(() => {
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
  let selectedTheme = 'SP+ CALM DARK';
  let adjustments = { wallpaper: 'Theme default', palette: 'Theme default' };
  const screenCount = screens.length;
  const routeCount = routes.length;
  const names = ['WELCOME','CHOOSE THE LOOK','KNOW YOUR WAY AROUND','OFFICE CONNECTIONS','YOUR SERVICES','FIN','OPTIONAL TOOLS + STORE','READY TO WORK'];
  const nextLabels = ["LET'S MAKE IT MINE",'USE THIS LOOK','CONTINUE','CONTINUE','CONTINUE','CONTINUE','FINISH SETUP','OPEN THE DESKTOP'];
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
      provisioning: 'PROVISIONING',
      unavailable: 'UNAVAILABLE'
    };
    const actionLabels = {
      pending: 'CHECKING ACCESS',
      ready: card.dataset.readyLabel || 'OPEN SERVICE',
      provisioning: service === 'files' ? 'WAITING FOR PORTAL' : 'WAITING FOR SOCIAL',
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
        ? 'Platform status will appear when Social is ready.'
        : 'Platform status is unavailable until Social returns.';
      list.append(item);
      return;
    }
    const declared = Array.isArray(platforms) ? platforms : [];
    if (!declared.length) {
      const item = document.createElement('p');
      item.className = 'platform-info-empty';
      item.textContent = 'No platform status was declared by Social.';
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
      stateLabel.textContent = live ? 'LIVE / CONNECT ON SITE' : 'APPROVAL IN PROGRESS';
      const owner = document.createElement('small');
      owner.textContent = live ? 'READY TO USE' : 'SECUREPROSPECTIVE HANDLES THIS';
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
    if (detail) detail.textContent = 'Welcome is checking the service before it opens the details.';
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
      if (title) title.textContent = service === 'files' ? 'FILE PORTAL READY.' : 'SOCIAL READY.';
      if (detail) detail.textContent = service === 'files'
        ? 'Open the card for a short handoff. Sign-in and file work happen on the service site.'
        : 'Open the card for the declared platform status and the service link.';
    } else if (stateName === 'provisioning') {
      if (title) title.textContent = 'SETTING UP THE SERVICE...';
      if (detail) detail.textContent = 'Setup is still in flight. Choose Retry when you want to check again.';
    } else if (payload && payload.failure === 'network') {
      if (title) title.textContent = "WE'LL SET THIS UP ONCE YOU'RE ONLINE.";
      if (detail) detail.textContent = 'Connect to the internet, then choose Retry. No sign-in was requested.';
    } else {
      if (title) title.textContent = 'WE WILL BE BACK.';
      if (detail) detail.textContent = service === 'social'
        ? 'SecureProspective Social is not answering right now. This is on our side and it is temporary.'
        : 'SecureProspective File Portal is not answering right now. This is on our side and it is temporary.';
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
      announce(`${service === 'files' ? 'THE FILE PORTAL' : 'SOCIAL'} IS NOT READY. CHOOSE RETRY FIRST.`, 'stub');
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
      ? 'The File Portal site handles sign-in, uploads and sharing.'
      : 'The Social site handles account connections and scheduling.';
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
      announce(`${service === 'files' ? 'THE FILE PORTAL' : 'SOCIAL'} IS NOT READY. CHOOSE RETRY FIRST.`, 'stub');
      return;
    }
    document.title = `spplus:open-service?service=${encodeURIComponent(service)}&action=browser`;
  }
  function finishServiceOpen(result) {
    document.title = 'SP+ Welcome';
    const message = result && result.message;
    if (!result || !result.ok) {
      if (servicePanelResult) servicePanelResult.textContent = message || 'The browser could not be opened. Welcome stayed open.';
      announce((message || 'THE BROWSER COULD NOT BE OPENED.').toUpperCase(), 'stub');
      return;
    }
    if (servicePanelResult) servicePanelResult.textContent = 'Browser launch requested. Welcome stayed open.';
    announce((message || 'THE BROWSER LAUNCH WAS REQUESTED.').toUpperCase());
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
      showAskFeedback(`${reason} Open Fin from Applications, type /login, and pick a provider.`, 'error');
    } else {
      showAskFeedback(`${reason} Try again. If it keeps happening, open Fin from Applications.`, 'error');
    }
    announce('FIN COULD NOT ANSWER.','stub');
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
    announce(current === lastScreen ? 'SETUP HANDOFF READY.' : 'READY WHEN YOU ARE.');
  }
  routes.forEach(route => route.addEventListener('click', () => go(Number(route.dataset.go))));
  next.addEventListener('click', () => { if(current===screenCount-1){ announce('WELCOME STAYS AVAILABLE FROM APPLICATIONS.', ''); return; } go(current+1); });
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
    previewCaption.textContent = 'Verified applied-session capture. The image is not a drawn approximation.';
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
      setPreviewResult('This choice is not available until its verification capture is installed.', 'error');
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
    setPreviewResult('Nothing changes until you apply.');
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
        'Colours, window style and desktop theme.',
        `Panel and pinned apps: replaced with ${arrangement}.`,
        `Desktop widgets: replaced with ${arrangement}.`,
        'Splash screen: changes next time you sign in.'
      ]);
      fillPreviewList(previewUnchanged, [
        'Apps already open may keep their current look. Reopen them to see the new style.',
        card.dataset.cursorNote || 'The mouse pointer stays standard for Windows Modern.',
        'The lock screen and on-screen messages stay unchanged.',
        'Start-menu favourites are not removed. Their order is not guaranteed.'
      ]);
      previewSave.textContent = 'Your current panel is saved. You can restore the previous panel and pinned apps later.';
    } else {
      fillPreviewList(previewChanges, [
        'Colours, window style and desktop theme.',
        'Splash screen: changes next time you sign in.',
        'Cursor, fonts and application icon theme.'
      ]);
      fillPreviewList(previewUnchanged, [
        'Your panel and pinned apps stay as they are.',
        'Apps already open may keep their current look. Reopen them to see the new style.',
        card.dataset.cursorNote || 'The mouse pointer stays standard for Windows Modern.',
        'The lock screen and on-screen messages stay unchanged.',
        'Start-menu favourites are not removed. Their order is not guaranteed.'
      ]);
      previewSave.textContent = 'No panel backup is needed because this theme does not change the panel.';
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
    setPreviewResult('Applying the package, saving the current panel, then checking the live readback.', 'working');
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
    if (stateCopy) stateCopy.textContent = ({idle:'READY', working:'ADDING...', installed:'ADDED', failed:'NOT ADDED'})[state] || 'READY';
    button.textContent = ({idle:`ADD ${toolLabel(button).toUpperCase()}`, working:'ADDING...', installed:'ADDED', failed:`TRY ${toolLabel(button).toUpperCase()} AGAIN`})[state] || 'ADD';
  }
  function updateFinalTools() {
    const ready = toolActions.filter(button => button.dataset.state === 'installed').map(toolLabel);
    const finalTools = document.getElementById('final-tools');
    if (finalTools) finalTools.textContent = ready.length ? `${ready.join(' / ').toUpperCase()} READY` : 'NONE ADDED YET';
  }
  function startToolInstall(button) {
    if (activeTool || button.dataset.state === 'installed') return;
    activeTool = button;
    toolActions.forEach(item => { if (item !== button) item.disabled = true; });
    setToolState(button, 'working');
    announce(`ADDING ${toolLabel(button).toUpperCase()}. THIS MAY TAKE A FEW MINUTES.`);
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
      announce((result.message || `${name} is ready on this computer.`).toUpperCase());
      updateFinalTools();
    } else {
      announce((result && result.message) || `${name} could not be added. Your computer was left as it was.`, 'stub');
    }
  }
  function finishStore(result) {
    const button = document.querySelector('[data-store-action]');
    if (button) button.disabled = false;
    document.title = 'SP+ Welcome';
    if (result && result.ok) announce(result.message || 'DISCOVER IS OPEN. WELCOME STAYS AVAILABLE.');
    else announce((result && result.message) || 'FLATHUB IS NOT AVAILABLE. DISCOVER WAS NOT OPENED.', 'stub');
  }
  const deferredActions = [...document.querySelectorAll('.deferred-action')];
  const officeState = { folder: 'NOT STARTED', printer: 'NOT STARTED', email: 'NOT STARTED' };
  const finalOffice = document.getElementById('final-office');
  function updateOfficeSummary() {
    if (finalOffice) finalOffice.textContent = `${Object.entries(officeState).map(([key, value]) => `${key.toUpperCase()} ${value}`).join(' + ')} / RETURN WHEN READY`;
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
      announce(`${kind.toUpperCase()} SKIPPED. NOTHING WAS CHANGED. RETURN WHEN READY.`);
      updateOfficeSummary();
    });
  });
  updateOfficeSummary();
  const finButton = document.getElementById('fin-launch');
  const finResult = document.getElementById('fin-result');
  function finishFin(result) {
    if (finButton) finButton.disabled = false;
    if (finResult) finResult.textContent = (result && result.message) || 'Fin could not be opened. Welcome is still available.';
    announce((result && result.message) || 'FIN COULD NOT BE OPENED.', result && result.ok ? '' : 'stub');
    if (result && result.ok) document.getElementById('final-fin').textContent = 'OPEN OR READY / /LOGIN IF ASKED';
    document.title = 'SP+ Welcome';
  }
  finButton.addEventListener('click', () => {
    finButton.disabled = true;
    if (finResult) finResult.textContent = 'Opening Fin in its own window...';
    announce('OPENING FIN. WELCOME WILL STAY AVAILABLE.');
    document.title = 'spplus:launch-fin';
  });
  const checkButton = document.getElementById('fin-check');
  const checkResultEl = document.getElementById('check-result');
  const checkSummaryEl = document.getElementById('check-summary');
  function finishCheck(result){
    if (checkButton) checkButton.disabled = false;
    const msg = (result && result.message) || 'The check could not run.';
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
    if (checkResultEl) checkResultEl.textContent = 'Fin is looking at this computer. Nothing will be changed.';
    announce('FIN IS CHECKING THIS COMPUTER. NOTHING WILL BE CHANGED.');
    document.title = 'spplus:check-computer';
  });
  const emailButton = document.getElementById('email-connect');
  const emailResult = document.getElementById('email-result');
  function finishEmail(result) {
    if (emailButton) emailButton.disabled = false;
    if (result && result.ok) officeState.email = 'OPENED';
    if (emailResult) emailResult.textContent = (result && result.message) || 'Email could not be opened.';
    updateOfficeSummary();
    announce((result && result.message) || 'EMAIL COULD NOT BE OPENED.', result && result.ok ? '' : 'stub');
    document.title = 'SP+ Welcome';
  }
  emailButton.addEventListener('click', () => {
    const provider = document.querySelector('input[name="email"]:checked')?.value || 'other';
    emailButton.disabled = true;
    if (emailResult) emailResult.textContent = 'Opening the provider page. SP+ will not ask for your email password.';
    announce('OPENING THE PROVIDER SIGN-IN PAGE. SP+ NEVER HANDLES YOUR EMAIL PASSWORD.');
    document.title = 'spplus:connect-email?provider=' + encodeURIComponent(provider);
  });
  const shareButton = document.getElementById('share-check');
  const shareResult = document.getElementById('share-result');
  function finishShare(result) {
    if (shareButton) shareButton.disabled = false;
    if (result && result.ok) officeState.folder = 'CHECKED';
    if (shareResult) shareResult.textContent = (result && result.message) || 'The folder could not be checked.';
    updateOfficeSummary();
    announce((result && result.message) || 'THE FOLDER COULD NOT BE CHECKED.', result && result.ok ? '' : 'stub');
    document.title = 'SP+ Welcome';
  }
  shareButton.addEventListener('click', () => {
    const server = document.getElementById('share-server').value.trim();
    const folder = document.getElementById('share-folder').value.trim();
    const username = document.getElementById('share-username').value.trim();
    if (!server || !folder || !username) {
      announce('ENTER THE SERVER, FOLDER AND USERNAME FIRST.', 'stub');
      if (shareResult) shareResult.textContent = 'Server, folder and username are required.';
      return;
    }
    shareButton.disabled = true;
    if (shareResult) shareResult.textContent = 'Checking the folder through the desktop connection service...';
    announce('CHECKING THE SHARED FOLDER. NO PERMANENT MOUNT WILL BE LEFT BEHIND.');
    const save = document.getElementById('share-save').checked;
    document.title = 'spplus:check-share?server=' + encodeURIComponent(server) + '&folder=' + encodeURIComponent(folder) + '&username=' + encodeURIComponent(username) + '&save=' + save;
  });
  const printerButton = document.getElementById('printer-test');
  const printerResult = document.getElementById('printer-result');
  function finishPrinter(result) {
    if (printerButton) printerButton.disabled = false;
    if (result && result.ok) officeState.printer = 'PRINTED';
    if (printerResult) printerResult.textContent = (result && result.message) || 'The printer test did not complete.';
    updateOfficeSummary();
    announce((result && result.message) || 'THE PRINTER TEST DID NOT COMPLETE.', result && result.ok ? '' : 'stub');
    document.title = 'SP+ Welcome';
  }
  printerButton.addEventListener('click', () => {
    printerButton.disabled = true;
    if (printerResult) printerResult.textContent = 'Checking CUPS and the configured printer before submitting one page...';
    announce('CHECKING CUPS FIRST. EXACTLY ONE PAGE WILL BE SUBMITTED IF A PRINTER IS READY.');
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
      showAskFeedback('Type a question first, then choose ASK FIN.', 'error');
      announce('TYPE A QUESTION FOR FIN FIRST.','stub');
      askInput.focus();
      return;
    }
    askInput.disabled = true;
    askSubmit.disabled = true;
    askForm.setAttribute('aria-busy', 'true');
    showAskFeedback('FIN IS THINKING. YOUR QUESTION WAS RECEIVED.', 'pending');
    announce('FIN IS THINKING. YOUR QUESTION WAS RECEIVED.');
    document.title = 'spplus:ask?q=' + encodeURIComponent(question);
    askTimer = setTimeout(() => finishAsk({ok:false, reason:'Fin did not respond.'}), 125000);
  });

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
  askDismiss.addEventListener('click',()=>{resetAskFeedback();helpView={kind:'root'};renderHelp();});
  document.getElementById('help-home').addEventListener('click',()=>{resetAskFeedback();helpView={kind:'root'};renderHelp();});
  fetch('help-data.json').then(r=>r.json()).then(data=>{articles=data;renderHelp();}).catch(()=>{helpContent.textContent='Help is not available in this draft.';});
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
        if (detail) detail.textContent = 'Applied after package validation and readback. Visual Qt, app-cache, splash and Dell evidence still need the hardware session.';
        if (samePreview) {
          setPreviewResult('Applied. The helper verified the package settings, wallpaper, decoration and requested layout.', 'success');
          previewApply.dataset.state = 'applied';
          previewApply.textContent = 'APPLIED';
          previewApply.disabled = true;
          previewApply.setAttribute('aria-busy', 'false');
          previewClose.disabled = false;
          previewKeep.disabled = false;
        }
      } else {
        announce('THAT THEME COULD NOT BE APPLIED. THE DESKTOP WAS LEFT AS IT WAS.', 'stub');
        if (detail) detail.textContent = 'The desktop was left unchanged after rollback. Detail: ' + ((result && result.detail) || 'no detail reported') + '.';
        if (samePreview) {
          setPreviewResult('Apply failed and the saved configuration was restored. No new theme was selected.', 'error');
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
    go, helpDepth };
  go(0);
})();
