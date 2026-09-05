/* Turns the bridge payload into the exact strings the overlay renders.
 *
 * The single rule this module exists to enforce: the overlay never claims
 * something is live. Every derivation below defaults to UNKNOWN and has to be
 * argued up from there by fresh evidence. The bridge already expires stale
 * values into nulls, so a null here means "not known", never "not yet".
 */

const UNKNOWN = "UNKNOWN";

/** Camera and VM signals come from the producer, which is the only thing that
 *  can actually observe them. OBS cannot: a black source is still a source. */
function signalWord(node, map) {
  const s = node && node.signal;
  return (map && map[s]) || (s && s !== "unknown" ? s.toUpperCase() : UNKNOWN);
}

function clockFace(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m + ":" + String(s).padStart(2, "0");
}

export function derive(p) {
  const connected = !!(p && p.obsConnected);

  // The rail is the honesty surface. When the socket is down it says so
  // rather than freezing on the last thing it saw.
  let rail;
  if (!connected) {
    rail = "OBS STATUS / UNAVAILABLE";
  } else if (p.stream && p.stream.active) {
    rail = "SP+ / LIVE";
  } else if (p.record && p.record.active) {
    rail = "SP+ / RECORDING";
  } else {
    rail = "SP+ / STANDBY";
  }

  const chapter = p && p.chapter;
  const topic = (p && p.topic) || null;

  const camWord = signalWord(p && p.camera, {
    ok: "READY", degraded: "DEGRADED", down: "UNAVAILABLE",
  });
  const vmWord = signalWord(p && p.guest, {
    ok: "OK", blanked: "BLANK", degraded: "DEGRADED", down: "DOWN",
  });
  const obsWord = connected ? "CONNECTED" : "UNAVAILABLE";

  const countdown =
    p && p.countdown && Number.isFinite(p.countdown.secondsRemaining)
      ? clockFace(p.countdown.secondsRemaining)
      : "UNKNOWN";

  return {
    rail,
    railKnown: connected,

    holdSubtitle: "NEXT SIGNAL / " + (topic ? topic.toUpperCase() : UNKNOWN),
    topic: topic || "TOPIC UNKNOWN",
    chapterTitle: chapter && chapter.title ? chapter.title.toUpperCase()
                                           : "TITLE UNKNOWN",
    // The movement chip stays an empty placeholder until the number is real.
    chapterChip: chapter && Number.isFinite(chapter.number)
      ? String(chapter.number).padStart(2, "0")
      : "--",
    nextSignal: topic ? topic.toUpperCase() : "NEXT SIGNAL UNKNOWN",
    returnMessage: topic ? topic.toUpperCase() : "RETURN TIME UNKNOWN",
    countdown,

    camLabel: "CAMERA / " + camWord,
    vmStatus: "RIG / " + vmWord,
    obsStatus: "OBS / " + obsWord,

    // The readouts take the value alone; their label is a separate element.
    camValue: camWord,
    vmValue: vmWord,
    obsValue: obsWord,
    operatorNote: (p && p.guest && p.guest.note) ||
                  (p && p.camera && p.camera.note) || "CHECKING",
  };
}

/** True where the value is an admitted unknown, so it can be rendered dim
 *  instead of at full brightness. Stating a gap quietly is the point. */
export function isUnknown(text) {
  return typeof text === "string" && /UNKNOWN|UNAVAILABLE/.test(text);
}
