/* SSE client for the bridge.
 *
 * The page holds no obs-websocket credentials and makes no OBS request; it
 * only consumes what the bridge publishes. If the bridge dies, this reconnects
 * forever and reports the gap upward rather than leaving the last payload on
 * screen -- a frozen RECORDING badge is exactly the lie the whole state
 * protocol exists to prevent.
 */

const DELAYS = [250, 500, 1000, 2000, 4000, 8000, 10000];

export function connect(onState, onLost) {
  let attempt = 0;
  let source = null;

  function open() {
    source = new EventSource("/events");

    source.onopen = () => { attempt = 0; };

    source.onmessage = (ev) => {
      try {
        onState(JSON.parse(ev.data));
      } catch (err) {
        // A malformed frame is a bridge bug, not a reason to render garbage.
        console.error("[overlay] bad state frame", err);
      }
    };

    source.onerror = () => {
      source.close();
      onLost();
      const delay = DELAYS[Math.min(attempt, DELAYS.length - 1)];
      attempt += 1;
      setTimeout(open, delay);
    };
  }

  open();
}
