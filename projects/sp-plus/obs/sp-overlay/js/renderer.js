/* Scene switching and text binding.
 *
 * Scenes are swapped, never rebuilt: every pack is in the DOM from load, and a
 * cut is one class change plus one forced reflow to restart the entry
 * transition. Text is written only when the string actually differs, so a
 * 1Hz state tick does not touch the DOM 40 times a second.
 */

import { derive, isUnknown } from "./state.js";

const CLEAN_CHROME_SCENES = new Set(["HOLD", "BRB", "SLATE", "TECH", "OUTRO"]);

export class Renderer {
  constructor(root, sceneMap, field, cameras) {
    this.cameras = cameras || {};
    this.root = root;
    this.sceneMap = sceneMap;
    this.field = field;
    this.scenes = new Map();
    this.bindings = new Map();
    this.current = null;
    this.lastText = new Map();

    for (const el of root.querySelectorAll(".scene")) {
      this.scenes.set(el.dataset.scene, el);
    }
    // A binding name can appear in several scenes (camNotice does), so each
    // name maps to a list.
    for (const el of root.querySelectorAll("[data-bind]")) {
      const key = el.dataset.bind;
      if (!this.bindings.has(key)) this.bindings.set(key, []);
      this.bindings.get(key).push(el);
    }

    this.rail = root.querySelector("#rail-text");
    this.lamp = root.querySelector("#rail-lamp");
    this.markwire = root.querySelector("#markwire");
    this.meter = root.querySelector("#rail-meter");

    // The rail index is one square per scene, in scene order, so the rail
    // shows where in the running order the show currently is.
    this.order = Object.values(sceneMap);
    const index = root.querySelector("#rail-index");
    this.indexNodes = this.order.map((name) => {
      const li = document.createElement("li");
      li.dataset.scene = name;
      index.appendChild(li);
      return li;
    });

    this.gates = Array.from(root.querySelectorAll(".gate"));

    // Split titles into clipped word wrappers once, at boot. These carry
    // static text, so nothing has to be rebuilt during animation.
    for (const el of root.querySelectorAll("[data-words]")) {
      this.splitWords(el);
    }
  }

  /** Each word clips its own glyphs so the title rises from behind its line.
   *  Words stay atomic; a title never breaks inside one. */
  splitWords(el) {
    const words = el.textContent.split(" ");
    el.textContent = "";
    words.forEach((word, i) => {
      const wrap = document.createElement("span");
      wrap.className = "word";
      wrap.style.setProperty("--word-index", String(i));
      const inner = document.createElement("span");
      inner.textContent = word;
      wrap.appendChild(inner);
      el.appendChild(wrap);
      if (i < words.length - 1) {
        el.appendChild(document.createTextNode(" "));
      }
    });
  }

  /** Map an OBS scene name onto an overlay pack. An unmapped scene shows the
   *  rail alone rather than guessing at a layout. */
  showScene(obsSceneName) {
    const key = this.sceneMap[obsSceneName] || null;
    if (key === this.current) return;
    this.current = key;

    for (const [name, el] of this.scenes) {
      el.classList.toggle("is-active", name === key);
    }

    // Chrome and the mark are shared, so they are driven from the root rather
    // than duplicated into every pack.
    const section = key && this.scenes.get(key);
    this.root.dataset.mark = (section && section.dataset.mark) || "none";
    this.root.dataset.chrome = CLEAN_CHROME_SCENES.has(key)
      ? "clean"
      : key === "RIG" ? "min" : "full";

    this.indexNodes.forEach((li) => {
      li.classList.toggle("is-current", li.dataset.scene === key);
    });

    if (this.meter) {
      this.meter.textContent = obsSceneName || "SP+ / SIGNAL ROOM";
    }

    // The mark stands IN the room, so it takes the camera move with everything
    // else. Set once per cut rather than per frame: CSS eases it, and a
    // per-frame style write on a 720px SVG is not worth the parallax.
    const cam = (this.cameras && this.cameras[key]) || [0, 0];
    this.root.style.setProperty("--cam-x", cam[0] + "px");
    this.root.style.setProperty("--cam-y", cam[1] + "px");

    // Restart the mark's draw. Removing the class and forcing a reflow is what
    // makes a second cut inside the animation replay rather than be swallowed.
    if (this.markwire) {
      this.markwire.classList.remove("is-drawing");
      void this.markwire.getBoundingClientRect().width;
      if (this.root.dataset.mark !== "none") {
        this.markwire.classList.add("is-drawing");
      }
    }

    const active = key && this.scenes.get(key);
    if (active) {
      const pack = active.querySelector(".pack");
      pack.classList.add("is-entering");
      // Read a layout property to commit the start state before removing the
      // class; without this the browser coalesces both into one style pass and
      // the transition never runs.
      void pack.offsetWidth;
      pack.classList.remove("is-entering");
    }

    // The cut is a real event, so the room answers it: a pulse from where the
    // scene's own weight sits, not from a fixed point.
    this.field.pulse(560, 620, 0.85);
  }

  /** One ring leaves the lamp when the state actually changes -- the pill's
   *  own inspection pulse. Restarted by removing the class and forcing a
   *  reflow, or a change inside the animation would be swallowed. */
  runSignal() {
    this.lamp.classList.remove("is-signalling");
    void this.lamp.offsetWidth;
    this.lamp.classList.add("is-signalling");
  }

  apply(payload) {
    const d = derive(payload);

    // Publish the signal states so CSS can gate affirmative geometry on them.
    // An aperture, a lit edge or a bright corner is a claim that a source is
    // observed, and a claim has to pass the same evidence gate as the text.
    this.root.dataset.camera = {
      READY: "ready",
      DEGRADED: "degraded",
      UNAVAILABLE: "down",
    }[d.camValue] || "unknown";
    this.root.dataset.guest =
      d.vmValue === "OK" ? "ok" : "unknown";

    this.applyGates(d, payload);

    this.lastRailText = d.rail;
    if (this.setText(this.rail, d.rail)) {
      this.runSignal();
    }
    this.rail.classList.toggle("is-unknown", !d.railKnown);
    // A dead socket kills the lamp: nothing on the pill may imply a live link.
    this.lamp.classList.toggle("is-dark", !d.railKnown);

    for (const [key, els] of this.bindings) {
      const value = d[key];
      if (value === undefined) continue;
      for (const el of els) {
        if (this.setText(el, value)) {
          el.classList.toggle("is-unknown", isUnknown(value));
          // A readout dims as a whole, label included, not just its figure.
          const readout = el.closest(".readout");
          if (readout) readout.classList.toggle("is-unknown", isUnknown(value));
          if (el.classList.contains("chip")) {
            el.classList.toggle("is-known", value !== "--");
          }
        }
      }
    }
  }

  /** Each gate carries its own state, and a gate that changes fires the room's
   *  pulse from its own position. An event then reads as originating somewhere
   *  in the room rather than from an arbitrary point. */
  applyGates(d, payload) {
    const states = {
      obs: d.obsValue === "CONNECTED"
        ? ((payload && payload.stream && payload.stream.active) ||
           (payload && payload.record && payload.record.active) ? "live" : "known")
        : "unknown",
      rig: d.vmValue === "OK" ? "known" : "unknown",
      chapter: d.chapterTitle === "TITLE UNKNOWN" ? "unknown" : "known",
    };

    for (const gate of this.gates) {
      const next = states[gate.dataset.gate] || "unknown";
      if (gate.dataset.state === next) continue;
      gate.dataset.state = next;

      // offsetLeft/Top are page coordinates, and the page is the 1920x1080
      // canvas, so they are already the field's own coordinate space.
      this.field.pulse(
        gate.offsetLeft + gate.offsetWidth / 2,
        gate.offsetTop + gate.offsetHeight / 2,
        0.7);
    }
  }

  /** Returns true when the DOM was actually written. */
  setText(el, value) {
    if (this.lastText.get(el) === value) return false;
    this.lastText.set(el, value);
    el.textContent = value;
    return true;
  }
}
