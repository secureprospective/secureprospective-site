(() => {
  // Rendering, search and prompt extraction live in help-core.js, which the
  // pinned Help app loads verbatim as well. Welcome draws the corpus as one
  // step of a wizard and the Help app draws it as a reference, but what an
  // advisor FINDS has to be identical in both, so the deciding logic is
  // shared rather than reimplemented on each side.
  const H = window.SPPlusHelp;
  // Help sits after "Bring Fin into your work": the help screen offers to
  // hand the advisor to Fin, which only makes sense once Fin exists for them.
  const HELP_SCREEN = 5;
  const screens = [...document.querySelectorAll('.screen')];
  const routes = [...document.querySelectorAll('.route')];
  const next = document.getElementById('next');
  const back = document.getElementById('back');
  const skip = document.getElementById('skip');
  const status = document.getElementById('status');
  const caption = document.getElementById('route-caption');
  const topline = document.getElementById('topline-place');
  const askForm = document.getElementById('ask-form');
  const askInput = document.getElementById('ask-fin');
  const askSubmit = document.getElementById('ask-submit');
  const askFeedback = document.getElementById('ask-feedback');
  const askFeedbackCopy = document.getElementById('ask-feedback-copy');
  const askDismiss = document.getElementById('ask-dismiss');
  let askTimer = null;
  let current = 0;
  // No theme has been chosen until the advisor chooses one. This used to
  // default to a theme name that no longer ships, so the closing summary told
  // them they had selected something they had never seen and that does not
  // exist. Saying plainly that the desktop is unchanged is both true and less
  // alarming than a stranger's choice made on their behalf.
  let selectedTheme = '';
  let adjustments = { wallpaper: 'Theme default', palette: 'Theme default' };
  const screenCount = screens.length;
  const routeCount = routes.length;
  const names = ['WELCOME','CHOOSE YOUR LOOK','YOUR DESKTOP MAP','CONNECT YOUR OFFICE','YOUR SERVICES','FIN','OPTIONAL TOOLS + STORE','READY TO WORK'];
  const nextLabels = ["LET'S GET STARTED",'USE THIS LOOK','CONTINUE','CONTINUE','CONTINUE','CONTINUE','FINISH SETUP','OPEN THE DESKTOP'];
  const serviceScreens = { files: 4, social: 4 };
  const serviceCache = { files: null, social: null };
  const servicePending = { files: false, social: false };
  const serviceReady = { files: false, social: false };
  function announce(message, kind=''){ status.textContent = message; status.dataset.kind = kind; }
  function serviceElement(service, attribute) {
    return document.querySelector(`[data-${attribute}="${service}"]`);
  }
  function setReadyOnlyControls(service, ready, state = '') {
    const card = document.querySelector(`[data-service-card="${service}"]`);
    if (!card) return;
    const statusCopy = card.querySelector('[data-service-card-state]');
    const actionCopy = card.querySelector('[data-service-card-action]');
    const stateName = state || (ready ? 'ready' : 'unavailable');
    const stateLabels = {
      pending: 'CHECKING...',
      ready: 'READY',
      provisioning: 'SETTING UP',
      unavailable: 'NOT READY'
    };
    const actionLabels = {
      pending: 'CHECKING...',
      ready: card.dataset.readyLabel || 'SEE NEXT STEP',
      provisioning: service === 'files' ? 'PORTAL IS SETTING UP' : 'SOCIAL IS SETTING UP',
      unavailable: 'TRY AGAIN ABOVE'
    };
    card.disabled = !ready;
    card.setAttribute('aria-disabled', ready ? 'false' : 'true');
    card.dataset.state = stateName;
    card.classList.toggle('is-ready', ready);
    if (statusCopy) statusCopy.textContent = stateLabels[stateName] || stateLabels.unavailable;
    if (actionCopy) actionCopy.textContent = actionLabels[stateName] || actionLabels.unavailable;
  }
  function renderSocialPlatforms(platforms, state) {
    const list = document.getElementById('social-platforms');
    if (!list) return;
    list.replaceChildren();
    if (state !== 'ready') {
      const item = document.createElement('p');
      item.className = 'platform-info-empty';
      item.textContent = state === 'provisioning'
        ? 'Platform details will appear when Social is ready.'
        : 'Social will show platform details when it is back.';
      list.append(item);
      return;
    }
    const declared = Array.isArray(platforms) ? platforms : [];
    if (!declared.length) {
      const item = document.createElement('p');
      item.className = 'platform-info-empty';
      item.textContent = 'Social has not reported any platform details yet.';
      list.append(item);
      return;
    }
    declared.forEach(platform => {
      if (!platform) return;
      const item = document.createElement('div');
      const live = platform.state === 'live';
      item.className = live ? 'platform-info platform-info--live' : 'platform-info platform-info--pending';
      item.setAttribute('role', 'status');
      const label = document.createElement('strong');
      label.textContent = platform.label;
      const stateLabel = document.createElement('span');
      stateLabel.className = 'platform-info-state';
      stateLabel.textContent = live ? 'LIVE / CONNECT ON SOCIAL' : 'WAITING FOR APPROVAL';
      const owner = document.createElement('small');
      owner.textContent = live ? 'READY WHEN YOU ARE' : 'SECUREPROSPECTIVE IS HANDLING THIS';
      item.append(label, stateLabel, owner);
      list.append(item);
    });
  }
  function renderServicePending(service) {
    servicePending[service] = true;
    serviceReady[service] = false;
    const state = serviceElement(service, 'service-state');
    const title = serviceElement(service, 'service-title');
    const detail = serviceElement(service, 'service-detail');
    const retry = document.querySelector(`[data-service-retry="${service}"]`);
    if (state) { state.dataset.kind = 'pending'; state.removeAttribute('data-http-status'); }
    if (title) title.textContent = service === 'files' ? 'CHECKING FILE PORTAL...' : 'CHECKING SOCIAL...';
    if (detail) detail.textContent = service === 'files'
      ? 'Welcome is checking that the portal is ready. No files are opened.'
      : 'Welcome is checking that Social is ready. No accounts are changed.';
    if (retry) { retry.disabled = false; retry.textContent = 'RETRY'; }
    setReadyOnlyControls(service, false, 'pending');
    if (service === 'social') renderSocialPlatforms([], 'pending');
  }
  function renderServiceResult(service, payload) {
    const stateName = payload && ['ready', 'provisioning', 'unavailable'].includes(payload.status)
      ? payload.status : 'unavailable';
    const state = serviceElement(service, 'service-state');
    const title = serviceElement(service, 'service-title');
    const detail = serviceElement(service, 'service-detail');
    const retry = document.querySelector(`[data-service-retry="${service}"]`);
    const httpStatus = payload && Number.isInteger(payload.http_status) ? String(payload.http_status) : '';
    if (state) {
      state.dataset.kind = stateName;
      if (httpStatus) state.dataset.httpStatus = httpStatus; else state.removeAttribute('data-http-status');
    }
    if (stateName === 'ready') {
      if (title) title.textContent = service === 'files' ? 'FILE PORTAL IS READY.' : 'SOCIAL IS READY.';
      if (detail) detail.textContent = service === 'files'
        ? 'The portal is ready. Open its card for the next step. Sign-in and file work happen on the service site.'
        : 'Social is ready. Open its card to see what is available. The Social site handles connections and scheduling.';
    } else if (stateName === 'provisioning') {
      if (title) title.textContent = 'WE ARE STILL SETTING UP THE SERVICE.';
      if (detail) detail.textContent = 'We are still setting this up. Check again when you are ready.';
    } else if (payload && payload.failure === 'network') {
      if (title) title.textContent = "WE'LL SET THIS UP ONCE YOU'RE ONLINE.";
      if (detail) detail.textContent = 'Connect to the internet, then choose Retry. Welcome did not ask you to sign in.';
    } else {
      if (title) title.textContent = 'WE WILL BE BACK.';
      if (detail) detail.textContent = service === 'social'
        ? 'The Social service is not answering right now. This is on our side and temporary. No accounts were changed.'
        : 'The File Portal is not answering right now. This is on our side and temporary. No files were opened or changed.';
    }
    if (retry) { retry.disabled = false; retry.textContent = stateName === 'unavailable' ? 'TRY AGAIN' : 'RETRY'; }
    serviceReady[service] = stateName === 'ready';
    setReadyOnlyControls(service, serviceReady[service], stateName);
    if (service === 'social') renderSocialPlatforms(serviceReady[service] ? payload.platforms : [], stateName);
  }
  function requestServiceCapability(service, force = false) {
    if (!Object.prototype.hasOwnProperty.call(serviceScreens, service)) return;
    if (!force && serviceCache[service]) {
      renderServiceResult(service, serviceCache[service]);
      return;
    }
    if (servicePending[service]) return;
    if (force) serviceCache[service] = null;
    renderServicePending(service);
    document.title = `spplus:service-capabilities?service=${encodeURIComponent(service)}${force ? '&retry=1' : ''}`;
  }
  function finishServiceCapability(payload) {
    const service = payload && payload.service;
    if (!Object.prototype.hasOwnProperty.call(serviceScreens, service)) return;
    servicePending[service] = false;
    serviceCache[service] = payload;
    renderServiceResult(service, payload);
    document.title = 'SP+ Welcome';
  }
  const serviceUrls = {
    files: 'https://cloud.secureprospective.com',
    social: 'https://social.secureprospective.com'
  };
  const servicePanel = document.getElementById('service-panel');
  const servicePanelClose = document.getElementById('service-panel-close');
  const servicePanelBackdrop = document.getElementById('service-panel-backdrop');
  const servicePanelLink = document.getElementById('service-panel-link');
  const servicePanelLinkLabel = document.getElementById('service-panel-link-label');
  const servicePanelResult = document.getElementById('service-panel-result');
  const servicePanelViews = [...document.querySelectorAll('[data-service-panel-view]')];
  let activeServicePanel = null;
  let servicePanelOrigin = null;

  function openServicePanel(service, origin) {
    if (!serviceUrls[service]) return;
    if (!serviceReady[service]) {
      announce(`${service === 'files' ? 'THE FILE PORTAL' : 'SOCIAL'} IS NOT READY YET. CHOOSE RETRY FIRST.`, 'stub');
      return;
    }
    activeServicePanel = service;
    servicePanelOrigin = origin || document.activeElement;
    servicePanelViews.forEach(view => { view.hidden = view.dataset.servicePanelView !== service; });
    document.getElementById('service-panel-kicker').textContent = service === 'files'
      ? 'FILE PORTAL / SERVICE DETAILS' : 'SOCIAL / SERVICE DETAILS';
    document.getElementById('service-panel-title').textContent = service === 'files'
      ? 'YOUR FILE PORTAL' : 'YOUR SOCIAL WORKSPACE';
    servicePanelLink.href = serviceUrls[service];
    servicePanelLinkLabel.textContent = service === 'files' ? 'OPEN FILE PORTAL' : 'OPEN SOCIAL';
    servicePanelResult.textContent = service === 'files'
      ? 'The File Portal site handles sign-in, uploads and sharing. Welcome will not open your files.'
      : 'The Social site handles account connections and scheduling. Welcome does not connect accounts.';
    servicePanel.hidden = false;
    document.body.classList.add('service-panel-open');
    servicePanelClose.focus();
  }
  function closeServicePanel() {
    if (!servicePanel || servicePanel.hidden) return;
    servicePanel.hidden = true;
    document.body.classList.remove('service-panel-open');
    activeServicePanel = null;
    const origin = servicePanelOrigin;
    servicePanelOrigin = null;
    if (origin && typeof origin.focus === 'function' && document.contains(origin)) origin.focus();
  }
  function openService(service) {
    if (!serviceUrls[service]) return;
    if (!serviceReady[service]) {
      announce(`${service === 'files' ? 'THE FILE PORTAL' : 'SOCIAL'} IS NOT READY YET. CHOOSE RETRY FIRST.`, 'stub');
      return;
    }
    document.title = `spplus:open-service?service=${encodeURIComponent(service)}&action=browser`;
  }
  function finishServiceOpen(result) {
    document.title = 'SP+ Welcome';
    const message = result && result.message;
    if (!result || !result.ok) {
      if (servicePanelResult) servicePanelResult.textContent = message || 'The browser could not be opened. Welcome is still here.';
      announce((message || 'THE BROWSER COULD NOT BE OPENED. WELCOME IS STILL HERE.').toUpperCase(), 'stub');
      return;
    }
    if (servicePanelResult) servicePanelResult.textContent = 'Browser launch requested. Welcome is still here when you return.';
    announce((message || 'THE BROWSER LAUNCH WAS REQUESTED. WELCOME IS STILL HERE.').toUpperCase());
  }
  document.querySelectorAll('[data-service-retry]').forEach(button => {
    button.addEventListener('click', () => requestServiceCapability(button.dataset.serviceRetry, true));
  });
  document.querySelectorAll('[data-service-card]').forEach(card => {
    card.addEventListener('click', () => openServicePanel(card.dataset.serviceCard, card));
  });
  servicePanelClose.addEventListener('click', closeServicePanel);
  servicePanelBackdrop.addEventListener('click', closeServicePanel);
  servicePanelLink.addEventListener('click', event => {
    event.preventDefault();
    if (activeServicePanel) openService(activeServicePanel);
  });
  document.addEventListener('keydown', event => {
    if (!servicePanel || servicePanel.hidden) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      closeServicePanel();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = [servicePanelClose, servicePanelLink].filter(control => control && !control.disabled && !control.hidden);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
  function showAskFeedback(message, kind) {
    askFeedback.hidden = false;
    askFeedback.dataset.kind = kind || '';
    askFeedbackCopy.textContent = message;
  }
  function resetAskFeedback() {
    if (askTimer) { clearTimeout(askTimer); askTimer = null; }
    askFeedback.hidden = true;
    askFeedback.dataset.kind = '';
    askFeedbackCopy.textContent = '';
    askInput.disabled = false;
    askSubmit.disabled = false;
    askForm.setAttribute('aria-busy', 'false');
    document.title = 'SP+ Welcome';
  }
  function finishAsk(result) {
    if (askTimer) { clearTimeout(askTimer); askTimer = null; }
    askInput.disabled = false;
    askSubmit.disabled = false;
    askForm.setAttribute('aria-busy', 'false');
    document.title = 'SP+ Welcome';
    if (result && result.ok && result.answer) {
      showAskFeedback(result.answer, 'answer');
      announce('FIN ANSWERED YOUR QUESTION.');
      return;
    }
    const reason = (result && result.reason) || 'Fin did not return an answer.';
    if (reason === 'Fin is not connected yet.') {
      showAskFeedback(`${reason} Open Fin from Applications, type /login, and choose a provider.`, 'error');
    } else {
      showAskFeedback(`${reason} Try again. If it keeps happening, open Fin from Applications and ask for help.`, 'error');
    }
    announce('FIN COULD NOT ANSWER THIS TIME.','stub');
  }
  function go(index) {
    const lastScreen = screenCount - 1;
    const target = Math.max(0, Math.min(lastScreen, index));
    if (servicePanel && !servicePanel.hidden) closeServicePanel();
    current = target;
    screens.forEach((screen,i) => { screen.classList.toggle('active',i===current); screen.setAttribute('aria-hidden', i===current ? 'false' : 'true'); });
    routes.forEach((route,i) => { route.classList.toggle('current',i===current); route.setAttribute('aria-current',i===current ? 'step' : 'false'); });
    caption.textContent = `${names[current]} / ${String(current+1).padStart(2,'0')} OF ${String(routeCount).padStart(2,'0')}`;
    topline.textContent = `SP+ WELCOME / ${names[current]}`;
    back.disabled = current === 0;
    back.style.visibility = current === 0 ? 'hidden' : 'visible';
    skip.style.visibility = (current === 0 || current === lastScreen) ? 'hidden' : 'visible';
    next.innerHTML = `${nextLabels[current]} <span>→</span>`;
    if (current === 0) window.spHero?.start(); else window.spHero?.stop();
    if (current === serviceScreens.files) requestServiceCapability('files');
    if (current === serviceScreens.social) requestServiceCapability('social');
    announce(current === lastScreen ? 'SETUP HANDOFF IS READY.' : 'READY WHEN YOU ARE.');
  }
  routes.forEach(route => route.addEventListener('click', () => go(Number(route.dataset.go))));
  // The last button is the handoff. Welcome's job ends here, so it closes and
  // leaves the advisor on the desktop it just set up. Announcing and staying
  // open made the button look broken: it is the one control on the screen that
  // did nothing visible.
  function finishSetup(){
    announce('OPENING YOUR DESKTOP.', '');
    document.title = 'spplus:finish';
    setTimeout(() => { document.title = 'SP+ Welcome'; }, 400);
  }
  next.addEventListener('click', () => { if(current===screenCount-1){ finishSetup(); return; } go(current+1); });
  back.addEventListener('click', () => go(current-1));
  skip.addEventListener('click', () => go(current+1));
  // A theme card opens a preview receipt. Nothing reaches the shell until the
  // advisor sees the verified-session capture and presses APPLY inside that
  // receipt. The shell receives the look-and-feel id plus an explicit layout
  // decision; it runs the one transactional helper and reports its readback.
  const themeCards = [...document.querySelectorAll('.theme-card')];
  const themePreview = document.getElementById('theme-preview');
  const previewImage = document.getElementById('preview-image');
  const previewMissing = document.getElementById('preview-missing');
  const previewTitle = document.getElementById('preview-title');
  const previewCaption = document.getElementById('preview-caption');
  const previewChanges = document.getElementById('preview-changes');
  const previewUnchanged = document.getElementById('preview-unchanged');
  const previewSave = document.getElementById('preview-save');
  const previewResult = document.getElementById('preview-result');
  const previewApply = document.getElementById('preview-apply');
  const previewClose = document.getElementById('preview-close');
  const previewKeep = document.getElementById('preview-keep');
  let previewCard = null;
  let previewFocus = null;
  let themeApplying = false;

  function fillPreviewList(target, lines) {
    target.replaceChildren(...lines.map(line => {
      const item = document.createElement('li');
      item.textContent = line;
      return item;
    }));
  }
  function setPreviewResult(message, kind='') {
    previewResult.textContent = message;
    previewResult.dataset.kind = kind;
  }
  function closeThemePreview() {
    if (themeApplying) return;
    themePreview.hidden = true;
    document.body.classList.remove('theme-preview-open');
    document.title = 'SP+ Welcome';
    if (previewFocus && typeof previewFocus.focus === 'function') previewFocus.focus();
    previewFocus = null;
    previewCard = null;
  }
  function openThemePreview(card) {
    if (themeApplying) return;
    previewCard = card;
    previewFocus = document.activeElement;
    const label = (card.dataset.theme || 'THIS THEME').toUpperCase();
    const resetsLayout = card.dataset.layoutReset === 'true';
    previewTitle.textContent = label;
    previewCaption.textContent = 'Verified desktop capture. This is the real applied session, not a drawing.';
    previewImage.alt = `${label} verified desktop preview`;
    previewImage.onload = () => {
      previewImage.hidden = false;
      previewMissing.hidden = true;
      previewApply.disabled = false;
      previewApply.setAttribute('aria-busy', 'false');
    };
    previewImage.onerror = () => {
      previewImage.hidden = true;
      previewMissing.hidden = false;
      previewApply.disabled = true;
      previewApply.setAttribute('aria-busy', 'false');
      setPreviewResult('This choice is not available until its verification preview is installed.', 'error');
    };
    previewImage.removeAttribute('src');
    previewImage.hidden = true;
    previewMissing.hidden = true;
    previewApply.disabled = true;
    previewApply.setAttribute('aria-busy', 'true');
    previewApply.dataset.state = 'ready';
    previewApply.textContent = `APPLY ${label}`;
    previewClose.disabled = false;
    previewKeep.disabled = false;
    setPreviewResult('Nothing changes until you choose Apply.');
    if (resetsLayout) {
      // Five of the eight themes ship a layout of their own. Nordic and the two
      // Catppuccin themes do not, so applying them lays down the standard
      // arrangement rather than one their author designed. The panel is still
      // reset either way, which is what stops the previous theme's panel leaking
      // through; only the wording differs, because promising "this theme's
      // arrangement" for a theme that has none is a claim the desktop cannot keep.
      const fromTheme = (card.dataset.panelSource || 'theme') !== 'standard';
      const arrangement = fromTheme
        ? "this theme's arrangement"
        : 'the standard arrangement, because this theme does not define its own';
      fillPreviewList(previewChanges, [
        'Colours, window style, and desktop theme.',
        `Panel and pinned apps: replaced with ${arrangement}.`,
        `Desktop widgets: replaced with ${arrangement}.`,
        'Splash screen: changes the next time you sign in.'
      ]);
      fillPreviewList(previewUnchanged, [
        'Apps already open may keep their current look. Reopen them to see the new one.',
        card.dataset.cursorNote || 'The mouse pointer stays standard for Windows Modern.',
        'The lock screen and on-screen messages stay unchanged.',
        'Start-menu favourites are not removed. Their order is not guaranteed.'
      ]);
      previewSave.textContent = 'Your current panel is saved first. You can restore the previous panel and pinned apps later.';
    } else {
      fillPreviewList(previewChanges, [
        'Colours, window style, and desktop theme.',
        'Splash screen: changes the next time you sign in.',
        'Cursor, fonts, and application icon theme.'
      ]);
      fillPreviewList(previewUnchanged, [
        'Your panel and pinned apps stay as they are.',
        'Apps already open may keep their current look. Reopen them to see the new one.',
        card.dataset.cursorNote || 'The mouse pointer stays standard for Windows Modern.',
        'The lock screen and on-screen messages stay unchanged.',
        'Start-menu favourites are not removed. Their order is not guaranteed.'
      ]);
      previewSave.textContent = 'No panel backup is needed. This theme does not change the panel.';
    }
    previewImage.src = card.dataset.preview || '';
    themePreview.hidden = false;
    document.body.classList.add('theme-preview-open');
    previewClose.focus();
  }
  themeCards.forEach(card => card.addEventListener('click', () => openThemePreview(card)));
  previewClose.addEventListener('click', closeThemePreview);
  previewKeep.addEventListener('click', closeThemePreview);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !themePreview.hidden && !themeApplying) closeThemePreview();
  });
  previewApply.addEventListener('click', () => {
    if (!previewCard || previewApply.disabled || themeApplying) return;
    const label = (previewCard.dataset.theme || 'THIS THEME').toUpperCase();
    const layout = previewCard.dataset.layoutReset === 'true' ? '1' : '0';
    themeApplying = true;
    previewApply.disabled = true;
    previewApply.setAttribute('aria-busy', 'true');
    previewApply.dataset.state = 'working';
    previewApply.textContent = 'APPLYING...';
    previewClose.disabled = true;
    previewKeep.disabled = true;
    setPreviewResult('Applying the package, saving the current panel, and checking that the change landed.', 'working');
    announce(`APPLYING ${label} TO THE WHOLE DESKTOP...`);
    // The shell watches the title. Navigating instead would replace the page.
    document.title = 'spplus:apply-theme?theme=' + encodeURIComponent(previewCard.dataset.lnf) + `&layout=${layout}`;
  });
  const toolActions = [...document.querySelectorAll('.tool-action')];
  let activeTool = null;
  function toolLabel(button) { return button.dataset.toolName || 'That application'; }
  function setToolState(button, state) {
    if (!button) return;
    button.dataset.state = state;
    button.disabled = state === 'working' || state === 'installed';
    button.setAttribute('aria-busy', state === 'working' ? 'true' : 'false');
    const stateCopy = button.closest('.tool-row')?.querySelector('.tool-state small');
    if (stateCopy) stateCopy.textContent = ({idle:'READY', working:'ADDING...', installed:'ADDED', failed:'NOT ADDED THIS TIME'})[state] || 'READY';
    button.textContent = ({idle:`ADD ${toolLabel(button).toUpperCase()}`, working:'ADDING...', installed:'ADDED', failed:`TRY ${toolLabel(button).toUpperCase()} AGAIN`})[state] || 'ADD';
  }
  function updateFinalTools() {
    const ready = toolActions.filter(button => button.dataset.state === 'installed').map(toolLabel);
    const finalTools = document.getElementById('final-tools');
    if (finalTools) finalTools.textContent = ready.length ? `${ready.join(' / ').toUpperCase()} READY` : 'NOTHING ADDED YET';
  }
  function startToolInstall(button) {
    if (activeTool || button.dataset.state === 'installed') return;
    activeTool = button;
    toolActions.forEach(item => { if (item !== button) item.disabled = true; });
    setToolState(button, 'working');
    announce(`ADDING ${toolLabel(button).toUpperCase()}. THIS MAY TAKE A FEW MINUTES. WELCOME WILL STAY AVAILABLE.`);
    document.title = 'spplus:install?app=' + encodeURIComponent(button.dataset.appId);
  }
  toolActions.forEach(button => {
    setToolState(button, button.dataset.state || 'idle');
    button.addEventListener('click', () => startToolInstall(button));
  });
  function finishTool(result) {
    const button = toolActions.find(item => item.dataset.appId === (result && result.app));
    const name = (result && result.name) || (button && toolLabel(button)) || 'That application';
    if (button) {
      setToolState(button, result && result.ok ? 'installed' : 'failed');
      activeTool = null;
      toolActions.forEach(item => { item.disabled = item.dataset.state === 'installed'; });
    }
    document.title = 'SP+ Welcome';
    if (result && result.ok) {
      announce((result.message || `${name} is ready to use on this computer.`).toUpperCase());
      updateFinalTools();
    } else {
      announce((result && result.message) || `${name} could not be added. Your computer was left unchanged.`, 'stub');
    }
  }
  function finishStore(result) {
    const button = document.querySelector('[data-store-action]');
    if (button) button.disabled = false;
    document.title = 'SP+ Welcome';
    if (result && result.ok) announce(result.message || 'Discover is open. Welcome is still here when you need it.');
    else announce((result && result.message) || 'Flathub is not available right now, so Discover was not opened.', 'stub');
  }
  const deferredActions = [...document.querySelectorAll('.deferred-action')];
  const officeState = { folder: 'NOT STARTED', printer: 'NOT STARTED', email: 'NOT STARTED' };
  const finalOffice = document.getElementById('final-office');
  function updateOfficeSummary() {
    if (finalOffice) {
      // The closing screen exists to settle a nervous advisor, and it used to
      // greet them with "FOLDER NOT STARTED + PRINTER NOT STARTED + EMAIL NOT
      // STARTED" -- three failures in a row for someone who has done nothing
      // wrong. Untouched is not a failure, so the done work is named first and
      // what is left is described as still waiting, which is what it is.
      const done = Object.entries(officeState).filter(([, value]) => value !== 'NOT STARTED');
      const waiting = Object.keys(officeState).filter(key => officeState[key] === 'NOT STARTED');
      const parts = [];
      if (done.length) parts.push(done.map(([key, value]) => `${key.toUpperCase()} ${value}`).join(' + '));
      if (waiting.length) parts.push(`${waiting.map(key => key.toUpperCase()).join(' AND ')} STILL WAITING FOR YOU`);
      finalOffice.textContent = `${parts.join(' / ')} / NOTHING HERE EXPIRES`;
    }
  }
  deferredActions.forEach(button => {
    const kind = button.dataset.deferred;
    if (localStorage.getItem(`spplus-welcome-skipped-${kind}`) === 'true') {
      officeState[kind] = 'SKIPPED';
      button.disabled = true;
      button.textContent = 'SKIPPED FOR NOW';
    }
    button.addEventListener('click', () => {
      officeState[kind] = 'SKIPPED';
      localStorage.setItem(`spplus-welcome-skipped-${kind}`, 'true');
      button.disabled = true;
      button.textContent = 'SKIPPED FOR NOW';
      announce(`${kind.toUpperCase()} SKIPPED. NOTHING WAS CHANGED. COME BACK ANY TIME.`);
      updateOfficeSummary();
    });
  });
  updateOfficeSummary();
  const finButton = document.getElementById('fin-launch');
  const finResult = document.getElementById('fin-result');
  function finishFin(result) {
    if (finButton) finButton.disabled = false;
    if (finResult) finResult.textContent = (result && result.message) || 'Fin could not be opened. Welcome is still here.';
    announce((result && result.message) || 'FIN COULD NOT BE OPENED. WELCOME IS STILL HERE.', result && result.ok ? '' : 'stub');
    if (result && result.ok) document.getElementById('final-fin').textContent = 'OPEN OR READY / /LOGIN IF ASKED';
    document.title = 'SP+ Welcome';
  }
  finButton.addEventListener('click', () => {
    finButton.disabled = true;
    if (finResult) finResult.textContent = 'Opening Fin in its own window. Welcome will stay available.';
    announce('OPENING FIN. WELCOME WILL STAY AVAILABLE.');
    document.title = 'spplus:launch-fin';
  });
  const checkButton = document.getElementById('fin-check');
  const checkResultEl = document.getElementById('check-result');
  const checkSummaryEl = document.getElementById('check-summary');
  function finishCheck(result){
    if (checkButton) checkButton.disabled = false;
    const msg = (result && result.message) || 'The check could not run this time.';
    if (checkResultEl) checkResultEl.textContent = msg;
    if (checkSummaryEl) {
      checkSummaryEl.textContent = '';
      const rows = (result && result.summary) || [];
      rows.forEach(row => { const li = document.createElement('li'); li.textContent = row; checkSummaryEl.append(li); });
      checkSummaryEl.hidden = rows.length === 0;
    }
    // A machine that cannot update looks completely normal from the desktop,
    // so an unhealthy result must READ as a problem, not as a quiet success.
    announce(msg.toUpperCase(), (result && result.ok && result.healthy) ? '' : 'stub');
    document.title = 'SP+ Welcome';
  }
  if (checkButton) checkButton.addEventListener('click', () => {
    checkButton.disabled = true;
    if (checkResultEl) checkResultEl.textContent = 'Fin is checking this computer. Nothing will be changed.';
    announce('FIN IS CHECKING THIS COMPUTER. NOTHING WILL BE CHANGED.');
    document.title = 'spplus:check-computer';
  });
  const emailButton = document.getElementById('email-connect');
  const emailResult = document.getElementById('email-result');
  function finishEmail(result) {
    if (emailButton) emailButton.disabled = false;
    if (result && result.ok) officeState.email = 'OPENED';
    if (emailResult) emailResult.textContent = (result && result.message) || 'Email could not be opened this time.';
    updateOfficeSummary();
    announce((result && result.message) || 'EMAIL COULD NOT BE OPENED THIS TIME.', result && result.ok ? '' : 'stub');
    document.title = 'SP+ Welcome';
  }
  emailButton.addEventListener('click', () => {
    const provider = document.querySelector('input[name="email"]:checked')?.value || 'other';
    emailButton.disabled = true;
    if (emailResult) emailResult.textContent = 'Opening your provider page. SP+ will not ask for your email password.';
    announce('OPENING THE PROVIDER SIGN-IN PAGE. SP+ NEVER HANDLES YOUR EMAIL PASSWORD.');
    document.title = 'spplus:connect-email?provider=' + encodeURIComponent(provider);
  });
  const shareButton = document.getElementById('share-check');
  const shareResult = document.getElementById('share-result');
  function finishShare(result) {
    if (shareButton) shareButton.disabled = false;
    if (result && result.ok) officeState.folder = 'CHECKED';
    if (shareResult) shareResult.textContent = (result && result.message) || 'The folder could not be checked this time.';
    updateOfficeSummary();
    announce((result && result.message) || 'THE FOLDER COULD NOT BE CHECKED THIS TIME.', result && result.ok ? '' : 'stub');
    document.title = 'SP+ Welcome';
  }
  shareButton.addEventListener('click', () => {
    const server = document.getElementById('share-server').value.trim();
    const folder = document.getElementById('share-folder').value.trim();
    const username = document.getElementById('share-username').value.trim();
    if (!server || !folder || !username) {
      announce('ENTER THE SERVER, FOLDER AND USERNAME FIRST.', 'stub');
      if (shareResult) shareResult.textContent = 'Enter the server, folder and username so Welcome can check it.';
      return;
    }
    shareButton.disabled = true;
    if (shareResult) shareResult.textContent = 'Checking the folder through the desktop connection service. No permanent mount will be left behind.';
    announce('CHECKING THE SHARED FOLDER. NO PERMANENT MOUNT WILL BE LEFT BEHIND.');
    const save = document.getElementById('share-save').checked;
    document.title = 'spplus:check-share?server=' + encodeURIComponent(server) + '&folder=' + encodeURIComponent(folder) + '&username=' + encodeURIComponent(username) + '&save=' + save;
  });
  const printerButton = document.getElementById('printer-test');
  const printerResult = document.getElementById('printer-result');
  function finishPrinter(result) {
    if (printerButton) printerButton.disabled = false;
    if (result && result.ok) officeState.printer = 'PRINTED';
    if (printerResult) printerResult.textContent = (result && result.message) || 'The printer test did not complete this time.';
    updateOfficeSummary();
    announce((result && result.message) || 'THE PRINTER TEST DID NOT COMPLETE THIS TIME.', result && result.ok ? '' : 'stub');
    document.title = 'SP+ Welcome';
  }
  printerButton.addEventListener('click', () => {
    printerButton.disabled = true;
    if (printerResult) printerResult.textContent = 'Checking the print service and the configured printer before sending one page.';
    announce('CHECKING THE PRINT SERVICE FIRST. EXACTLY ONE PAGE WILL BE SENT IF A PRINTER IS READY.');
    document.title = 'spplus:print-test';
  });
  document.querySelector('[data-store-action]').addEventListener('click', event => {
    const button = event.currentTarget;
    if (button.disabled) return;
    button.disabled = true;
    announce('CHECKING FLATHUB. DISCOVER WILL OPEN ONLY IF IT IS READY.');
    document.title = 'spplus:browse-store';
  });
  document.getElementById('no-show').addEventListener('change', event => { localStorage.setItem('spplus-welcome-no-show', event.target.checked ? 'true' : 'false'); announce(event.target.checked ? 'WELCOME WILL STAY OUT OF THE WAY NEXT TIME.' : 'WELCOME WILL APPEAR AGAIN NEXT TIME.'); });
  askForm.addEventListener('submit', event => {
    event.preventDefault();
    const question = askInput.value.trim();
    if (!question) {
      showAskFeedback('Write a question first, then choose ASK FIN.', 'error');
      announce('TYPE A QUESTION FOR FIN FIRST.','stub');
      askInput.focus();
      return;
    }
    askInput.disabled = true;
    askSubmit.disabled = true;
    askForm.setAttribute('aria-busy', 'true');
    showAskFeedback('FIN IS THINKING. YOUR QUESTION IS WITH FIN.', 'pending');
    announce('FIN IS THINKING. YOUR QUESTION IS WITH FIN.');
    document.title = 'spplus:ask?q=' + encodeURIComponent(question);
    askTimer = setTimeout(() => finishAsk({ok:false, reason:'Fin did not respond.'}), 125000);
  });

  // Descriptions we have written for the categories we know about. The list of
  // categories itself is NOT taken from here -- it is derived from the corpus, so
  // a category the manual adds appears in the tree instead of becoming articles
  // that only search can reach. A category with no description still shows, with
  // an honest line rather than a blank.
  const categoryNotes = H.CATEGORY_NOTES;
  let categories = {};
  function buildCategories(){ categories = H.categoriesOf(articles); }
  let articles=[];
  let helpView={kind:'root'};
  const helpContent=document.getElementById('help-content'), helpHeading=document.getElementById('help-heading'), helpLede=document.getElementById('help-lede'), crumbs=document.getElementById('breadcrumbs');
  const esc = H.esc, inline = H.inline;
  const markdown = H.markdown;
  function crumb(label, action){const b=document.createElement('button');b.className='crumb-button';b.textContent=label;b.addEventListener('click',action);crumbs.append(b);}
  const helpHome = document.getElementById('help-home');
  const promptPanel=document.getElementById('prompt-panel');
  const promptList=document.getElementById('prompt-list');

  function renderPrompts(article){
    const prompts = article ? H.extractPrompts(article.markdown) : [];
    if(!promptPanel||!promptList) return;
    if(!prompts.length){ promptPanel.hidden=true; promptList.innerHTML=''; return; }
    promptPanel.hidden=false;
    promptList.innerHTML=prompts.map((text,i)=>
      `<li class="prompt-item"><p class="prompt-text" id="prompt-${i}">${esc(text)}</p>`+
      `<button class="secondary-action prompt-copy" type="button" data-copy="${i}" `+
      `aria-label="Copy this to send to Fin">COPY</button></li>`).join('');
    promptList.querySelectorAll('[data-copy]').forEach(button=>{
      button.addEventListener('click',()=>copyPrompt(button,prompts[Number(button.dataset.copy)]));
    });
  }

  // Welcome runs from file:// inside QtWebEngine, where the async clipboard
  // API is not available on an opaque origin. The textarea route works in
  // both that shell and a normal browser window, so it is the one used, and
  // the button says plainly when it could not copy rather than pretending.
  function copyPrompt(button,text){
    let ok=false;
    try{
      const scratch=document.createElement('textarea');
      scratch.value=text;
      scratch.setAttribute('readonly','');
      scratch.style.position='fixed';
      scratch.style.opacity='0';
      document.body.appendChild(scratch);
      scratch.select();
      ok=document.execCommand('copy');
      document.body.removeChild(scratch);
    }catch(e){ ok=false; }
    button.textContent = ok ? 'COPIED' : 'PRESS CTRL+C';
    if(!ok){ try{ window.getSelection().selectAllChildren(button.previousElementSibling); }catch(e){} }
    setTimeout(()=>{ button.textContent='COPY'; },2200);
  }

  function renderHelp(){ crumbs.innerHTML=''; renderPrompts(null);
    // BACK TO HELP TOPICS is only an exit from somewhere. At the topic root it
    // had no visibility rule at all, so it sat on the screen offering to return
    // the advisor to the view they were already looking at, and clicking it just
    // re-rendered the same list. A control that does nothing teaches a nervous
    // user that the app is not to be trusted, so it is hidden where it has no job.
    if(helpHome) helpHome.hidden = helpView.kind === 'root';
    if(helpView.kind==='root'){helpHeading.textContent='PICK A STARTING POINT.';helpLede.textContent='Choose a topic, follow it at your own pace, then come back when you are ready.'; helpContent.innerHTML=`<div class="trail-grid">${Object.entries(categories).map(([name,desc])=>`<button class="trail-card" data-category="${name}"><b>${name}</b><small>${desc}</small></button>`).join('')}</div>`; helpContent.querySelectorAll('[data-category]').forEach(b=>b.addEventListener('click',()=>{helpView={kind:'category',category:b.dataset.category};renderHelp();}));return;}
    crumb('HELP TOPICS',()=>{helpView={kind:'root'};renderHelp()});
    if(helpView.kind==='search'){
      const found = helpView.results;
      crumb('SEARCH', ()=>{});
      helpHeading.textContent = found.length ? 'WHAT WE FOUND.' : 'NOTHING MATCHED THAT YET.';
      helpLede.textContent = found.length
        ? 'These look closest to what you typed. Open one, or keep typing to narrow it down.'
        : 'We could not find a guide for those words. Fin can answer in your own words, so press ASK FIN and it will take it from here.';
      // The topic tree is kept below the results rather than replaced by them.
      // A short result list otherwise left most of the panel blank, and more
      // importantly it took away the browsable route at the exact moment the
      // advisor has discovered our words do not match theirs. Search narrows;
      // it should never be the thing that removes their other way through.
      // Names only. The descriptions belong on the topic screen where they have
      // room; repeated here they pushed the last row past the panel edge on a
      // 1024-wide screen, cutting it off with no scrollbar to reveal it.
      const browse = `<div class="search-browse"><span>OR BROWSE EVERY TOPIC</span><div class="browse-chips">${Object.keys(categories).map(name=>`<button class="browse-chip" data-category="${esc(name)}">${esc(name)}</button>`).join('')}</div></div>`;
      helpContent.innerHTML = (found.length
        ? `<div class="trail-grid trail-grid--compact">${found.map((a,i)=>`<button class="trail-card" data-found="${i}"><b>${esc(a.title)}</b><small>${esc(a.category.toUpperCase())}</small></button>`).join('')}</div>`
        : '<div class="search-empty"><p>Nothing here matches those words yet. That is our gap, not your mistake.</p><p>Fin reads plain English and can answer from the whole manual, so pressing ASK FIN above is the fastest way on.</p></div>') + browse;
      helpContent.querySelectorAll('[data-category]').forEach(b=>b.addEventListener('click',()=>{
        askInput.value=''; helpView={kind:'category',category:b.dataset.category};renderHelp();}));
      helpContent.querySelectorAll('[data-found]').forEach((b,i)=>b.addEventListener('click',()=>{
        helpView={kind:'article',category:found[i].category,article:found[i]};renderHelp();}));
      return;
    }
    if(helpView.kind==='category'){const cat=helpView.category;helpHeading.textContent=cat.toUpperCase()+'.';helpLede.textContent=categories[cat];
      // A category can hold more guides than the panel is tall, and the panel
      // does not scroll. Page the list with the same pager the reader uses, so
      // nothing is ever silently cut off the bottom.
      const entries=articles.filter(a=>a.category===cat);
      const per=6, pageCount=Math.max(1,Math.ceil(entries.length/per));
      const page=Math.min(Math.max(helpView.page||0,0),pageCount-1);
      const shown=entries.slice(page*per,page*per+per);
      helpContent.innerHTML=`<div class="trail-grid trail-grid--compact">${shown.map((a,i)=>`<button class="trail-card" data-article="${i}"><b>${esc(a.title)}</b><small>READ THIS GUIDE HERE</small></button>`).join('')}</div>`+(pageCount>1?`<div class="help-pager"><span>GUIDES ${page*per+1}-${page*per+shown.length} OF ${entries.length}</span>${page>0?'<button class="text-button" data-list="prev">PREVIOUS</button>':''}${page<pageCount-1?'<button class="text-button" data-list="next">MORE GUIDES</button>':''}</div>`:'');
      helpContent.querySelectorAll('[data-article]').forEach((b,i)=>b.addEventListener('click',()=>{helpView={kind:'article',category:cat,article:shown[i]};renderHelp();}));
      helpContent.querySelectorAll('[data-list]').forEach(b=>b.addEventListener('click',()=>{helpView={kind:'category',category:cat,page:page+(b.dataset.list==='next'?1:-1)};renderHelp();}));
      return;}
    const a=helpView.article; crumb(helpView.category,()=>{helpView={kind:'category',category:helpView.category};renderHelp()});crumb(a.title,()=>{});helpHeading.textContent=a.title.toUpperCase();helpLede.textContent='This guide stays inside Welcome. No browser window opens.';
    // Suggested prompts are lifted out of the prose into their own panel with
    // a copy button on each. Retyping a sentence into a terminal without a
    // typo is exactly where a nervous advisor gives up, and it is the one
    // part of the manual they are most likely to actually want.
    renderPrompts(a);
    const body=H.stripPrompts(a.markdown);
    const sections=body.split(/\n(?=## )/); const pages=[sections.slice(0,2).join('\n'),...sections.slice(2)]; const page=Math.min(helpView.page||0,pages.length-1);
    helpContent.innerHTML=`<div class="article-reader">${markdown(pages[page])}</div><div class="help-pager"><span>PAGE ${page+1} OF ${pages.length}</span>${page>0?'<button class="text-button" data-page="prev">PREVIOUS</button>':''}${page<pages.length-1?'<button class="text-button" data-page="next">NEXT PAGE</button>':''}</div>`;
    helpContent.querySelectorAll('[data-page]').forEach(button=>button.addEventListener('click',()=>{helpView={kind:'article',category:helpView.category,article:a,page:button.dataset.page==='next'?page+1:page-1};renderHelp();}));
  }
  // Pin your help. The Help app is a real installed application with its own
  // window and its own entry, not a browser tab pointed at a file, so pinning
  // it is a task-bar operation the shell has to do. Welcome only asks.
  const pinHelp=document.getElementById('pin-help');
  const pinHelpResult=document.getElementById('pin-help-result');
  let pinning=false;
  if(pinHelp){
    pinHelp.addEventListener('click',()=>{
      if(pinning) return;
      pinning=true;
      pinHelp.disabled=true;
      pinHelp.setAttribute('aria-busy','true');
      pinHelp.textContent='PINNING...';
      if(pinHelpResult) pinHelpResult.textContent='Putting Help on your task bar.';
      document.title='spplus:pin-help';
    });
  }
  function finishPinHelp(result){
    pinning=false;
    document.title='SP+ Welcome';
    if(!pinHelp) return;
    pinHelp.setAttribute('aria-busy','false');
    const ok=result&&result.ok;
    pinHelp.textContent=ok?'PINNED':'PIN YOUR HELP';
    pinHelp.disabled=!!ok;
    if(pinHelpResult){
      pinHelpResult.textContent = ok
        ? 'Help is on your task bar. Open it any time, even with Welcome closed.'
        : 'Help could not be pinned just now: ' +
          ((result&&result.reason)||'no detail was reported') +
          ' You can still open Help from Applications.';
    }
  }

  askDismiss.addEventListener('click',()=>{resetAskFeedback();helpView={kind:'root'};renderHelp();});
  helpHome.addEventListener('click',()=>{resetAskFeedback();helpView={kind:'root'};renderHelp();});

  // ---- Help search -------------------------------------------------------
  // A category tree quietly demands two things a frightened advisor does not
  // have: knowing which category their problem belongs to, and knowing our word
  // for it. Someone whose printer has stopped does not know whether that is
  // "Everyday work" or "Fix a problem", and may well type "printr wont wrk".
  // So the Ask Fin field doubles as a search: it suggests articles while the
  // advisor types, in their words rather than ours, and when it genuinely has
  // nothing it hands them to Fin instead of showing an empty shelf.
  //
  // Everything here is local. The corpus is already in memory, so this works
  // with the network down, which is exactly when someone is looking for help.

  let searchIndex = [];
  function buildSearchIndex(){ searchIndex = H.buildIndex(articles); }
  function searchHelp(query){ return H.search(searchIndex, query, 5); }

  // The same field asks Fin and searches the manual. One box is simpler than two,
  // and it means the advisor never has to decide which one their problem belongs
  // in before they can type anything.
  askInput.addEventListener('input', () => {
    const query = askInput.value.trim();
    if (query.length < 2) {
      if (helpView.kind === 'search') { helpView = {kind:'root'}; renderHelp(); }
      return;
    }
    helpView = {kind:'search', query, results: searchHelp(query)};
    renderHelp();
  });

  fetch('help-data.json').then(r=>r.json()).then(data=>{articles=data;buildCategories();buildSearchIndex();renderHelp();}).catch(()=>{helpContent.textContent='Help could not load right now. Try this topic again.';});
  function helpDepth(depth) {
    if (depth === 1) { helpView = {kind:'category', category:'Everyday work'}; renderHelp(); return; }
    const article = articles.find(item => item.category === 'Everyday work' && item.title === 'LibreOffice: your Word and Excel');
    if (article) { helpView = {kind:'article', category:'Everyday work', article}; renderHelp(); }
  }
  window.spWelcome = {
    themeApplied: function(result){
      const detail = document.getElementById('theme-detail');
      const samePreview = previewCard && result && result.theme === previewCard.dataset.lnf;
      themeApplying = false;
      document.title = 'SP+ Welcome';
      if (result && result.ok) {
        themeCards.forEach(item => {
          const selected = item.dataset.lnf === result.theme;
          item.classList.toggle('selected', selected);
          item.setAttribute('aria-checked', selected ? 'true' : 'false');
        });
        selectedTheme = (result.theme || '').toUpperCase();
        document.getElementById('final-theme').textContent = `${selectedTheme} / SELECTED`;
        announce(`${selectedTheme} APPLIED. THE WHOLE DESKTOP CHANGED.`);
        if (detail) detail.textContent = 'Applied after package validation and readback. The hardware session still needs to confirm the visuals, app cache, splash screen, and Dell-specific evidence.';
        if (samePreview) {
          setPreviewResult('Applied. The helper verified the package settings, wallpaper, decoration, and requested layout.', 'success');
          previewApply.dataset.state = 'applied';
          previewApply.textContent = 'APPLIED';
          previewApply.disabled = true;
          previewApply.setAttribute('aria-busy', 'false');
          previewClose.disabled = false;
          previewKeep.disabled = false;
        }
      } else {
        announce('THAT THEME COULD NOT BE APPLIED. THE DESKTOP WAS LEFT UNCHANGED.', 'stub');
        if (detail) detail.textContent = 'The desktop was left unchanged after rollback. Here is the detail: ' + ((result && result.detail) || 'no detail was reported') + '.';
        if (samePreview) {
          setPreviewResult('Apply did not finish, so the saved configuration was restored. No new theme was selected.', 'error');
          previewApply.dataset.state = 'failed';
          previewApply.textContent = 'APPLY FAILED';
          previewApply.disabled = true;
          previewApply.setAttribute('aria-busy', 'false');
          previewClose.disabled = false;
          previewKeep.disabled = false;
        }
      }
    },
    answered: finishAsk,
    toolResult: finishTool,
    storeResult: finishStore,
    checkResult: finishCheck,
    finResult: finishFin,
    emailResult: finishEmail,
    shareResult: finishShare,
    printerResult: finishPrinter,
    serviceResult: finishServiceCapability,
    serviceOpenResult: finishServiceOpen,
    pinHelpResult: finishPinHelp,
    // Named on purpose. The help screen has moved once already, and a test
    // that hardcodes its index silently tests the wrong screen afterwards.
    goHelp: function(){ go(HELP_SCREEN); },
    go, helpDepth };
  go(0);
})();
