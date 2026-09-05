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
    this.tick = root.querySelector("#rail-tick");
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
    this.flashTick();
  }

  flashTick() {
    this.tick.classList.add("is-lit");
    setTimeout(() => this.tick.classList.remove("is-lit"), 420);
  }

  apply(payload) {
    const d = derive(payload);

    this.setText(this.rail, d.rail);
    this.rail.classList.toggle("is-unknown", !d.railKnown);

    for (const [key, els] of this.bindings) {
      const value = d[key];
      if (value === undefined) continue;
      for (const el of els) {
        if (this.setText(el, value)) {
          el.classList.toggle("is-unknown", isUnknown(value));
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
