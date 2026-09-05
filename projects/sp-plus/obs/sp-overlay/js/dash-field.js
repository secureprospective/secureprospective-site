/* The operations ticker: the site's own identity field, not a lookalike.
 *
 * Ported from src/components/HeroTicker.astro on secureprospective.com so the
 * stream and the website run the same register. The earlier version of this
 * file invented a sparse platinum sweep with a gold highlight; the real field
 * is a FULL-WIDTH blue register carrying a travelling yellow signal, and the
 * difference is the whole character of the thing.
 *
 * Constants below are the site's, unchanged: 28px rows, 10x2 dashes, 8px gap,
 * 0.37 row phase, wave > 0.88 becomes signal.
 *
 * Position derives from an integer frame counter, so the same frame number
 * puts every dash in the same place. The rAF timestamp only decides whether to
 * advance that counter.
 */

const ROW_HEIGHT = 28;
const DASH_W = 10;
const DASH_H = 2;
const GAP = 8;
const UNIT = DASH_W + GAP;

const ROW_PHASE = 0.37;
const SIGNAL_THRESHOLD = 0.88;

// The site advances t by elapsed*0.00075, i.e. ~0.012 per frame at 60fps.
const T_PER_FRAME_60 = 0.012;

const YELLOW = "255, 215, 0";

/* The register's base colour has to answer the ground it sits on.
 *
 * On the site the field is blue on silver, and the blue carries the structure
 * while yellow stays a rare signal. Composited on ink or on the guest's
 * screen, blue at 0.1-0.4 alpha disappears and only the yellow survives -- the
 * field stops reading as a register and becomes noise. Dark grounds therefore
 * take a silver register, which preserves the relationship the site actually
 * depends on: a quiet structure with an occasional signal in it. */
const TONE = {
  dark: "229, 228, 226",   // silver register, for ink and video grounds
  light: "0, 51, 160",     // the site's own blue, for the platinum scene
};

export class DashField {
  constructor(canvas) {
    this.ctx = canvas.getContext("2d", { alpha: true });
    this.canvas = canvas;
    this.frame = 0;
    this.t = 0;
    this.hz = 10;
    this.base = TONE.dark;
    this.pulseFrames = 0;
    this.lastTick = 0;
    this.running = false;
  }

  /** Scene-driven cadence and weight. RIG runs slower and fainter because the
   *  guest's screen is the content there and the field must not compete. */
  configure({ hz, opacity, tone }) {
    this.hz = hz;
    this.base = TONE[tone] || TONE.dark;
    this.canvas.style.opacity = String(opacity);
  }

  /** A real state or scene change. On the site the equivalent is the single
   *  verification pass; here it briefly lowers the signal threshold so more of
   *  the register goes yellow, then settles back. */
  pulse() {
    this.pulseFrames = 20;
  }

  start() {
    if (this.running) return;
    this.running = true;
    const loop = (ts) => {
      if (!this.running) return;
      const interval = 1000 / this.hz;
      if (ts - this.lastTick >= interval) {
        this.lastTick = ts;
        this.frame += 1;
        // Hold the site's wall-clock speed whatever tick rate this scene uses.
        this.t += T_PER_FRAME_60 * (60 / this.hz);
        if (this.pulseFrames > 0) this.pulseFrames -= 1;
        this.draw();
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
  }

  draw() {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    const t = this.t;

    ctx.clearRect(0, 0, width, height);

    const threshold = this.pulseFrames > 0
      ? SIGNAL_THRESHOLD - (this.pulseFrames / 20) * 0.22
      : SIGNAL_THRESHOLD;

    const rows = Math.ceil(height / ROW_HEIGHT) + 1;

    for (let row = 0; row <= rows; row += 1) {
      const y = row * ROW_HEIGHT + ROW_HEIGHT / 2;
      const direction = row % 2 === 0 ? 1 : -1;
      const offset = (((t * 40 * direction) % UNIT) + UNIT) % UNIT;
      const rowPhase = (row * ROW_PHASE) % (Math.PI * 2);

      for (let x = -UNIT; x < width + UNIT; x += UNIT) {
        const dx = x - offset;
        const wave =
          Math.sin((dx / width) * Math.PI * 2 + t * 1.4 + rowPhase) * 0.5 + 0.5;
        const brightness = 0.1 + wave * 0.3;
        ctx.fillStyle = wave > threshold
          ? "rgba(" + YELLOW + ", " + Math.min(1, brightness + 0.5).toFixed(2) + ")"
          : "rgba(" + this.base + ", " + brightness.toFixed(2) + ")";
        ctx.fillRect(Math.round(dx), y - 1, DASH_W, DASH_H);
      }
    }
  }
}
