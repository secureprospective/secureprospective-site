/* ==========================================================================
   Website intent beacon — client.

   Cloudflare Web Analytics counts page views and cannot record anything
   else, so the moments that actually signal intent — tapping the call
   button, copying the number, starting a form and walking away, or
   failing the spam check and being unable to send at all — are invisible
   today. This module reports them to /api/track.

   Three rules hold this file together:

   1. It can never cost a visitor anything. Every call sits inside a
      try/catch that swallows, and the transport is navigator.sendBeacon,
      which is fire-and-forget by design and cannot delay a tel: handoff
      or a form submit. A visitor must never lose a submission because an
      analytics call failed.
   2. It sends no identifier. No cookie, no session id, no referrer, no
      free text. The event name and its detail both come from fixed lists
      that the endpoint enforces again on arrival.
   3. The names are a reporting vocabulary, not labels. Each one becomes
      a series counted over weeks, months and years, so a name that gets
      repurposed splits its own history. Add, never repurpose. The list
      here must stay in step with EVENTS in functions/api/track.ts.
   ========================================================================== */

const ENDPOINT = '/api/track';

// Queue and flush rather than one request per event. A visitor who
// scrolls the whole page and then leaves would otherwise fire five
// separate requests; the endpoint caps a batch at ten.
const MAX_BATCH = 10;
const FLUSH_DELAY_MS = 1000;

let queue = [];
let timer = null;

function currentPath() {
  const path = window.location.pathname || '/';
  return path.length > 200 ? path.slice(0, 200) : path;
}

function send(batch) {
  const body = JSON.stringify(batch);
  // sendBeacon survives the page being torn down, which is exactly the
  // moment form_abandon and a tel: handoff happen. keepalive fetch is
  // the fallback where it is missing; where both are missing the event
  // is simply dropped, because nothing here is worth a blocking request.
  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: 'application/json' });
    if (navigator.sendBeacon(ENDPOINT, blob)) return;
  }
  if (window.fetch) {
    window.fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {});
  }
}

export function flush() {
  try {
    if (timer !== null) {
      window.clearTimeout(timer);
      timer = null;
    }
    if (queue.length === 0) return;
    const batch = queue;
    queue = [];
    send(batch);
  } catch {
    /* Reporting must never break the page. */
  }
}

/**
 * Record one intent event.
 *
 * @param {string} event  A name from the endpoint's allowlist.
 * @param {string} [detail]  An allowlisted detail, where the event has one.
 * @param {{now?: boolean}} [options]  `now` flushes immediately, for events
 *   that fire as the page is going away.
 */
export function track(event, detail, options) {
  try {
    const item = { event: event, path: currentPath() };
    if (detail !== undefined && detail !== null) item.detail = String(detail);
    queue.push(item);

    if ((options && options.now) || queue.length >= MAX_BATCH) {
      flush();
      return;
    }
    if (timer === null) timer = window.setTimeout(flush, FLUSH_DELAY_MS);
  } catch {
    /* Reporting must never break the page. */
  }
}

/* --------------------------------------------------------------------------
   Automatic events.

   Delegated from the document so they survive Astro's view transitions
   without re-binding per page, and so a link added later is covered
   without anyone remembering to wire it.
   -------------------------------------------------------------------------- */

// Hosts a visitor may legitimately be sent to. The endpoint allowlists
// the same set: an outbound click to anywhere else is recorded as
// nothing rather than as free text, because a destination host typed by
// a page is still text from a page.
const OUTBOUND_HOSTS = new Set([
  'linkedin.com',
  'www.linkedin.com',
  'facebook.com',
  'www.facebook.com',
  'x.com',
  'calendly.com',
]);

const SCROLL_MARKS = [25, 50, 75, 100];
let scrollSeen = new Set();

function onDocumentClick(event) {
  try {
    const link = event.target.closest && event.target.closest('a[href]');
    if (!link) return;
    const href = link.getAttribute('href') || '';

    if (href.startsWith('tel:')) {
      // A tap is intent, not a call. Whether it connected is the Voice
      // lane's answer, and joining the two is Phase 5's job, not this
      // file's. Never report this as a call.
      track('tel_click', undefined, { now: true });
      return;
    }
    if (href.startsWith('mailto:')) {
      track('mailto_click', undefined, { now: true });
      return;
    }
    if (/^https?:/i.test(href)) {
      const host = new URL(href, window.location.href).hostname;
      if (OUTBOUND_HOSTS.has(host)) track('outbound_click', host, { now: true });
    }
  } catch {
    /* Reporting must never break the page. */
  }
}

function onCopy() {
  try {
    const selection = String(window.getSelection() || '');
    // Digits only, so the check does not care how the number is
    // formatted on the page or how much whitespace came with it.
    const digits = selection.replace(/\D/g, '');
    if (digits.length >= 10 && digits.indexOf('8323032277') !== -1) {
      // Desktop intent. Without this, a visitor who copies the number
      // and dials it from a handset reads as zero interest.
      track('tel_copy');
    }
  } catch {
    /* Reporting must never break the page. */
  }
}

function onScroll() {
  try {
    const doc = document.documentElement;
    const scrollable = doc.scrollHeight - window.innerHeight;
    if (scrollable <= 0) return;
    const percent = ((window.scrollY / scrollable) * 100);
    for (const mark of SCROLL_MARKS) {
      if (percent >= mark && !scrollSeen.has(mark)) {
        scrollSeen.add(mark);
        track('scroll_depth', String(mark));
      }
    }
  } catch {
    /* Reporting must never break the page. */
  }
}

function onHidden() {
  // The last chance to send anything queued. visibilitychange is the
  // only unload-ish event mobile browsers fire reliably.
  if (document.visibilityState === 'hidden') flush();
}

try {
  document.addEventListener('click', onDocumentClick, true);
  document.addEventListener('copy', onCopy, true);
  window.addEventListener('scroll', onScroll, { passive: true });
  document.addEventListener('visibilitychange', onHidden);
  // A view transition is a new page view for reporting purposes, so the
  // depth marks reset with it.
  document.addEventListener('astro:page-load', () => {
    scrollSeen = new Set();
  });
} catch {
  /* Reporting must never break the page. */
}
