/* Scene switching and text binding.
 *
 * Scenes are swapped, never rebuilt: every pack is in the DOM from load, and a
 * cut is one class change plus one forced reflow to restart the entry
 * transition. Text is written only when the string actually differs, so a
 * 1Hz state tick does not touch the DOM 40 times a second.
 */

import { derive, isUnknown } from "./state.js";

export class Renderer {
  constructor(root, sceneMap, field) {
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
    // A binding name can appear in several scenes (camLabel does), so each
    // name maps to a list.
    for (const el of root.querySelectorAll("[data-bind]")) {
      const key = el.dataset.bind;
      if (!this.bindings.has(key)) this.bindings.set(key, []);
      this.bindings.get(key).push(el);
    }

    this.rail = root.querySelector("#rail-text");
    this.scan = root.querySelector("#rail-scan");

    // Split stamped titles once, at boot. These carry static text, so the
    // letters never have to be rebuilt -- no DOM creation during animation.
    for (const el of root.querySelectorAll("[data-stamp]")) {
      this.stamp(el);
    }
  }

  /** Words stay atomic so a title never breaks inside a word. */
  stamp(el) {
    const words = el.textContent.split(" ");
    el.textContent = "";
    let index = 0;
    words.forEach((word, w) => {
      const span = document.createElement("span");
      span.className = "stamp-word";
      for (const ch of word) {
        const letter = document.createElement("span");
        letter.className = "stamp-letter";
        letter.style.setProperty("--stamp-index", String(index));
        letter.textContent = ch;
        span.appendChild(letter);
        index += 1;
      }
      el.appendChild(span);
      if (w < words.length - 1) {
        const gap = document.createElement("span");
        gap.className = "stamp-letter";
        gap.style.setProperty("--stamp-index", String(index));
        gap.textContent = " ";
        el.appendChild(gap);
        index += 1;
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

    this.field.pulse();
  }

  /** One bar crosses the rail when the state actually changes -- the
   *  register's status scan, not a decorative loop. Restarted by removing the
   *  class and forcing a reflow, or a second change inside the animation would
   *  be silently swallowed. */
  runScan() {
    this.scan.classList.remove("is-scanning");
    void this.scan.offsetWidth;
    this.scan.classList.add("is-scanning");
  }

  apply(payload) {
    const d = derive(payload);

    if (this.setText(this.rail, d.rail)) {
      this.runScan();
    }
    this.rail.classList.toggle("is-unknown", !d.railKnown);

    for (const [key, els] of this.bindings) {
      const value = d[key];
      if (value === undefined) continue;
      for (const el of els) {
        if (this.setText(el, value)) {
          el.classList.toggle("is-unknown", isUnknown(value));
          if (el.classList.contains("chip")) {
            el.classList.toggle("is-known", value !== "--");
          }
        }
      }
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
