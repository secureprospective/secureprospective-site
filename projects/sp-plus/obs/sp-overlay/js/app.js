/* Boot. Nothing branded is revealed until the real assets are in.
 *
 * A system-font fallback or a half-decoded logo on a live stream is worse than
 * a blank plate, so the root stays hidden until both faces and the logo have
 * loaded. If they never do, the overlay stays blank and says why in the
 * console -- it does not silently substitute.
 */

import { connect } from "./obs-events.js";
import { Renderer } from "./renderer.js";
import { DashField } from "./dash-field.js";

const root = document.getElementById("overlay-root");
const canvas = document.getElementById("field");

async function loadAssets() {
  await Promise.all([
    document.fonts.load('400 24px "IBM Plex Sans"'),
    document.fonts.load('700 72px "IBM Plex Sans"'),
    document.fonts.ready,
  ]);

  const logos = Array.from(document.images);
  await Promise.all(logos.map((img) =>
    img.decode().catch((err) => {
      throw new Error("logo failed to decode: " + img.src + " (" + err + ")");
    })));
}

async function main() {
  const config = await (await fetch("/config/scenes.json")).json();

  const field = new DashField(canvas);
  const renderer = new Renderer(root, config.sceneMap, field);

  try {
    await loadAssets();
  } catch (err) {
    console.error("[overlay] assets unavailable, staying blank:", err);
    return;
  }
  document.documentElement.classList.add("assets-ready");

  field.configure(config.fieldDefault);
  field.start();

  let lastScene = null;
  connect(
    (payload) => {
      renderer.apply(payload);

      // A null scene means the bridge has no live OBS view. Hold the last
      // layout -- cutting to blank would be its own false statement -- but the
      // rail has already flipped to UNAVAILABLE, so nothing claims to be live.
      const scene = payload.scene;
      if (scene && scene !== lastScene) {
        lastScene = scene;
        const key = config.sceneMap[scene];
        field.configure(config.field[key] || config.fieldDefault);
        renderer.showScene(scene);
      }
    },
    () => {
      renderer.apply({ obsConnected: false });
    },
  );

  // rAF is already throttled in a hidden document; this is a belt-and-braces
  // CPU guard, not the scene mechanism. The page is deliberately persistent
  // and stays visible across cuts.
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) field.stop(); else field.start();
  });
}

main().catch((err) => console.error("[overlay] boot failed:", err));
