/* ==========================================================================
   Contact — form submission.

   The three route lines above the form are ordinary anchors to #contact-form,
   so choosing a line works with no JavaScript at all. This module adds the
   part that needs it: the line a reader chooses pre-selects in the form, and
   the form posts to /api/lead without a page reload.
   ========================================================================== */

const ROUTES = new Set(['operating', 'sp-plus', 'prospective']);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// How long to wait for the Turnstile widget before telling the visitor it is not
// coming. The script is third-party, so a blocked domain or a privacy extension
// makes it never arrive; long enough not to fire on a slow connection, short
// enough that nobody sits in front of a form that cannot work.
const TURNSTILE_TIMEOUT_MS = 8000;

let teardown = () => {};

function boot() {
  teardown();

  const form = document.querySelector('[data-contact-form]');
  if (!form) return;

  const status = form.querySelector('[data-contact-status]');
  const submit = form.querySelector('[data-contact-submit]');
  const route = form.querySelector('#cf-route');
  const slot = form.querySelector('[data-turnstile-slot]');
  const fallback = form.querySelector('[data-turnstile-fallback]');
  const lines = Array.from(document.querySelectorAll('[data-contact-line]'));

  // Turnstile writes its token into a hidden input it injects into the form.
  // Its presence is the only honest signal that the widget actually rendered.
  const hasWidget = () => Boolean(form.querySelector('[name="cf-turnstile-response"]'));

  let widgetFailed = false;
  let watchdog = null;
  let observer = null;

  const giveUpOnWidget = () => {
    if (widgetFailed || hasWidget()) return;
    widgetFailed = true;
    if (fallback) fallback.hidden = false;
    if (slot) slot.hidden = true;
    if (submit) submit.disabled = true;
  };

  // The timeout is a guess about a slow network, so it has to be reversible.
  // A widget that arrives late on a phone would otherwise leave the visitor
  // staring at a disabled button and an escape hatch they did not need.
  const widgetArrived = () => {
    if (!widgetFailed) return;
    widgetFailed = false;
    if (fallback) fallback.hidden = true;
    if (slot) slot.hidden = false;
    if (submit) submit.disabled = false;
  };

  // A site key that never made it into the build is the same dead end for the
  // visitor as a blocked script, so it is reported the same way and at once.
  if (slot && !slot.dataset.sitekey) {
    giveUpOnWidget();
  } else {
    watchdog = window.setTimeout(giveUpOnWidget, TURNSTILE_TIMEOUT_MS);
    // Turnstile injects its token input whenever it finishes, which may be
    // after the timeout has already fired.
    observer = new MutationObserver(() => {
      if (hasWidget()) widgetArrived();
    });
    observer.observe(form, { childList: true, subtree: true });
  }

  const say = (message, tone) => {
    if (!status) return;
    status.textContent = message;
    status.dataset.tone = tone;
    status.hidden = false;
  };

  const clear = () => {
    if (!status) return;
    status.hidden = true;
    status.textContent = '';
    delete status.dataset.tone;
  };

  // Choosing a line above the form selects it below the form.
  const onLineClick = (event) => {
    const chosen = event.currentTarget.dataset.contactLine;
    if (!route || !ROUTES.has(chosen)) return;
    route.value = chosen;
  };

  lines.forEach((line) => line.addEventListener('click', onLineClick));

  const onSubmit = async (event) => {
    event.preventDefault();
    clear();

    const data = new FormData(form);
    const name = String(data.get('name') ?? '').trim();
    const email = String(data.get('email') ?? '').trim();
    const chosenRoute = String(data.get('route') ?? '').trim();
    const message = String(data.get('message') ?? '').trim();
    const turnstileToken = String(data.get('cf-turnstile-response') ?? '');

    if (!name) {
      say('Add your name so Christopher knows who he is answering.', 'error');
      form.querySelector('#cf-name')?.focus();
      return;
    }
    if (!EMAIL_RE.test(email)) {
      say('That email address does not look right. Check it and try again.', 'error');
      form.querySelector('#cf-email')?.focus();
      return;
    }
    if (!ROUTES.has(chosenRoute)) {
      say('Choose which line you are on.', 'error');
      route?.focus();
      return;
    }
    if (!turnstileToken) {
      if (widgetFailed || !hasWidget()) {
        giveUpOnWidget();
        say(
          'The spam check could not load, so this form cannot send. Email info@secureprospective.com instead.',
          'error',
        );
        return;
      }
      say('The verification check has not finished yet. Give it a moment and try again.', 'error');
      return;
    }

    submit.disabled = true;
    say('Sending.', 'pending');

    try {
      const response = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          route: chosenRoute,
          message,
          turnstileToken,
          source: 'contact-form',
          page: window.location.pathname,
        }),
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        say(body.error || 'That did not go through. Try again, or email info@secureprospective.com.', 'error');
        window.turnstile?.reset();
        submit.disabled = false;
        return;
      }

      form.reset();
      window.turnstile?.reset();
      say('Received. Christopher will answer from info@secureprospective.com.', 'ok');
      submit.disabled = false;
    } catch {
      say('That did not go through. Try again, or email info@secureprospective.com.', 'error');
      window.turnstile?.reset();
      submit.disabled = false;
    }
  };

  form.addEventListener('submit', onSubmit);

  teardown = () => {
    if (watchdog !== null) window.clearTimeout(watchdog);
    watchdog = null;
    if (observer) observer.disconnect();
    observer = null;
    form.removeEventListener('submit', onSubmit);
    lines.forEach((line) => line.removeEventListener('click', onLineClick));
    teardown = () => {};
  };
}

document.addEventListener('astro:page-load', boot);
document.addEventListener('astro:before-swap', () => teardown());

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
