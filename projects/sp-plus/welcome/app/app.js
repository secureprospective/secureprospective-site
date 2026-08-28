(() => {
  const screens = [...document.querySelectorAll('.screen')];
  const routes = [...document.querySelectorAll('.route')];
  const next = document.getElementById('next');
  const back = document.getElementById('back');
  const skip = document.getElementById('skip');
  const status = document.getElementById('status');
  const caption = document.getElementById('route-caption');
  const topline = document.getElementById('topline-place');
  let current = 0;
  let selectedTheme = 'SP+ CALM DARK';
  let adjustments = { wallpaper: 'Theme default', palette: 'Theme default' };
  const names = ['WELCOME','CHOOSE THE LOOK','KNOW YOUR WAY AROUND','OFFICE CONNECTIONS','FIN','OPTIONAL TOOLS + STORE','READY TO WORK'];
  const nextLabels = ["LET'S MAKE IT MINE",'USE THIS LOOK','CONTINUE','CONTINUE','CONTINUE','FINISH SETUP','OPEN THE DESKTOP'];
  function announce(message, kind=''){ status.textContent = message; status.dataset.kind = kind; }
  function go(index) {
    current = Math.max(0, Math.min(6, index));
    screens.forEach((screen,i) => { screen.classList.toggle('active',i===current); screen.setAttribute('aria-hidden', i===current ? 'false' : 'true'); });
    routes.forEach((route,i) => { route.classList.toggle('current',i===current); route.setAttribute('aria-current',i===current ? 'step' : 'false'); });
    caption.textContent = `${names[current]} / ${String(current+1).padStart(2,'0')} OF 07`;
    topline.textContent = `SP+ WELCOME / ${names[current]}`;
    back.disabled = current === 0;
    back.style.visibility = current === 0 ? 'hidden' : 'visible';
    skip.style.visibility = (current === 0 || current === 6) ? 'hidden' : 'visible';
    next.innerHTML = `${nextLabels[current]} <span>→</span>`;
    if (current === 0) window.spHero?.start(); else window.spHero?.stop();
    announce(current === 6 ? 'SETUP HANDOFF READY.' : 'READY WHEN YOU ARE.');
  }
  routes.forEach(route => route.addEventListener('click', () => go(Number(route.dataset.go))));
  next.addEventListener('click', () => { if(current===6){ announce('WELCOME STAYS AVAILABLE FROM APPLICATIONS.', ''); return; } go(current+1); });
  back.addEventListener('click', () => go(current-1));
  skip.addEventListener('click', () => go(current+1));
  // Applying a theme is a real system change, not a stub. The page hands the
  // look-and-feel id to the shell over the spplus: scheme; the shell runs
  // spplus-apply-theme, which writes EVERY component the theme declares --
  // colours, icons, widget style, Plasma theme, window decoration, cursor and
  // fonts -- and reports back through themeApplied(). Nothing here claims
  // success on its own.
  document.querySelectorAll('.theme-card').forEach(card => card.addEventListener('click', () => {
    document.querySelectorAll('.theme-card').forEach(item => { item.classList.remove('selected'); item.setAttribute('aria-checked','false'); });
    card.classList.add('selected'); card.setAttribute('aria-checked','true');
    selectedTheme = card.dataset.theme.toUpperCase();
    document.getElementById('final-theme').textContent = `${selectedTheme} / SELECTED`;
    announce(`APPLYING ${selectedTheme} TO THE WHOLE DESKTOP...`);
    // The shell watches the title. Navigating instead would replace the page.
    document.title = 'spplus:apply-theme?theme=' + encodeURIComponent(card.dataset.lnf);
  }));
  document.querySelectorAll('.stub-action').forEach(button => button.addEventListener('click', () => announce(`${button.dataset.stub.toUpperCase()} IS A STUB. NO SYSTEM CHANGE WAS MADE.`, 'stub')));
  document.getElementById('no-show').addEventListener('change', event => { localStorage.setItem('spplus-welcome-no-show', event.target.checked ? 'true' : 'false'); announce(event.target.checked ? 'WELCOME WILL STAY OUT OF THE WAY NEXT TIME.' : 'WELCOME WILL APPEAR AGAIN NEXT TIME.'); });

  const categories = {
    'Start here':'First five minutes and your map.',
    'Everyday work':'Apps and devices for work.',
    'Fix a problem':'Symptom-led fixes in order.',
    'Safety and privacy':'Protection, privacy and boundaries.',
    'Updates and recovery':'Restarts and recovery.',
    'Get more help':'Assistant and human support.'
  };
  let articles=[];
  let helpView={kind:'root'};
  const helpContent=document.getElementById('help-content'), helpHeading=document.getElementById('help-heading'), helpLede=document.getElementById('help-lede'), crumbs=document.getElementById('breadcrumbs');
  const esc=s=>s.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  const inline=s=>esc(s).replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');
  function markdown(text){let list=false, out=''; for(const raw of text.split('\n')){const s=raw.trim(); if(!s){if(list){out+='</ul>';list=false;} continue;} if(s.startsWith('#')){if(list){out+='</ul>';list=false;} const level=Math.min(3,s.match(/^#+/)[0].length);out+=`<h${level}>${inline(s.slice(level).trim())}</h${level}>`;continue;} if(s.startsWith('- ')){if(!list){out+='<ul>';list=true;}out+=`<li>${inline(s.slice(2))}</li>`;continue;} if(/^\d+\.\s/.test(s)){if(!list){out+='<ul>';list=true;}out+=`<li>${inline(s.replace(/^\d+\.\s/,''))}</li>`;continue;} if(s.startsWith('>')){out+=`<p><strong>${inline(s.slice(1).trim())}</strong></p>`;continue;} out+=`<p>${inline(s)}</p>`;} return out+(list?'</ul>':'');}
  function crumb(label, action){const b=document.createElement('button');b.className='crumb-button';b.textContent=label;b.addEventListener('click',action);crumbs.append(b);}
  function renderHelp(){ crumbs.innerHTML=''; if(helpView.kind==='root'){helpHeading.textContent='CHOOSE A TRAIL.';helpLede.textContent='Open a card, follow the breadcrumbs, then return to setup when you are ready.'; helpContent.innerHTML=`<div class="trail-grid">${Object.entries(categories).map(([name,desc])=>`<button class="trail-card" data-category="${name}"><b>${name}</b><small>${desc}</small></button>`).join('')}</div>`; helpContent.querySelectorAll('[data-category]').forEach(b=>b.addEventListener('click',()=>{helpView={kind:'category',category:b.dataset.category};renderHelp();}));return;}
    crumb('CHOOSE A TRAIL',()=>{helpView={kind:'root'};renderHelp()});
    if(helpView.kind==='category'){const cat=helpView.category;helpHeading.textContent=cat.toUpperCase()+'.';helpLede.textContent=categories[cat]; const entries=articles.filter(a=>a.category===cat);helpContent.innerHTML=`<div class="article-grid">${entries.map((a,i)=>`<button class="article-link" data-article="${i}"><b>${a.title}</b><small>OPEN THIS GUIDE INSIDE WELCOME</small></button>`).join('')}</div>`;helpContent.querySelectorAll('[data-article]').forEach((b,i)=>b.addEventListener('click',()=>{helpView={kind:'article',category:cat,article:entries[i]};renderHelp();}));return;}
    const a=helpView.article; crumb(helpView.category,()=>{helpView={kind:'category',category:helpView.category};renderHelp()});crumb(a.title,()=>{});helpHeading.textContent=a.title.toUpperCase();helpLede.textContent='Read inside Welcome. No browser or external window is opened.';
    const sections=a.markdown.split(/\n(?=## )/); const pages=[sections.slice(0,2).join('\n'),...sections.slice(2)]; const page=Math.min(helpView.page||0,pages.length-1);
    helpContent.innerHTML=`<div class="article-reader">${markdown(pages[page])}</div><div class="help-pager"><span>GUIDANCE ${page+1} OF ${pages.length}</span>${page>0?'<button class="text-button" data-page="prev">PREVIOUS</button>':''}${page<pages.length-1?'<button class="text-button" data-page="next">NEXT GUIDANCE</button>':''}</div>`;
    helpContent.querySelectorAll('[data-page]').forEach(button=>button.addEventListener('click',()=>{helpView={kind:'article',category:helpView.category,article:a,page:button.dataset.page==='next'?page+1:page-1};renderHelp();}));
  }
  document.getElementById('help-home').addEventListener('click',()=>{helpView={kind:'root'};renderHelp();});
  fetch('help-data.json').then(r=>r.json()).then(data=>{articles=data;renderHelp();}).catch(()=>{helpContent.textContent='Help is not available in this draft.';});
  function helpDepth(depth) {
    if (depth === 1) { helpView = {kind:'category', category:'Everyday work'}; renderHelp(); return; }
    const article = articles.find(item => item.category === 'Everyday work' && item.title === 'LibreOffice: your Word and Excel');
    if (article) { helpView = {kind:'article', category:'Everyday work', article}; renderHelp(); }
  }
  window.spWelcome = {
    themeApplied: function(result){
      const detail = document.getElementById('theme-detail');
      if (result && result.ok) {
        announce(`${(result.theme||'').toUpperCase()} APPLIED. THE WHOLE DESKTOP CHANGED.`);
        if (detail) detail.textContent = 'Applied to the desktop: colours, icons, window frames, panel, cursor and fonts all changed together.';
      } else {
        announce('THAT THEME COULD NOT BE APPLIED. THE DESKTOP WAS LEFT AS IT WAS.', 'stub');
        if (detail) detail.textContent = 'The desktop was left unchanged. Detail: ' + ((result && result.detail) || 'no detail reported') + '.';
      }
    }, go, helpDepth };
  go(0);
})();
