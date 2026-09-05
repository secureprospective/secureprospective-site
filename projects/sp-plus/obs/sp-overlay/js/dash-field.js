/* The registration sweep: the motion signature lifted from the site hero.
 *
 * Rows of short dashes, each row travelling in the opposite direction to the
 * one above it and offset in phase, so the field reads as a scan crossing the
 * frame rather than as decoration drifting.
 *
 * Position derives from an integer frame counter and fixed constants only --
 * no Math.random, no wall clock. Two OBS sources rendering the same overlay,
 * or the same recording replayed, put every dash in the same place. The rAF
 * timestamp is used to decide *whether* to advance that counter, never to
 * compute where anything is.
 */

const ROW_PITCH = 28;
const DASH_W = 10;
const DASH_H = 2;
const GAP = 8;
const STEP = DASH_W + GAP;          // 18px between dashes in a cluster
const CLUSTER = 4;                  // dashes drawn per row
const SPAN = CLUSTER * STEP;

const PHASE_OFFSET = 0.37;          // per-row phase stagger
const PHASE_INCREMENT = 0.012;      // per logical frame
const GOLD_THRESHOLD = 0.86;

const PLATINUM = "#E5E4E2";
const GOLD = "#D4AF37";

export class DashField {
  constructor(canvas) {
    this.ctx = canvas.getContext("2d", { alpha: true });
    this.canvas = canvas;
    this.rows = Math.ceil(canvas.height / ROW_PITCH);
    this.frame = 0;
    this.hz = 10;
    this.pulseFrames = 0;
    this.lastTick = 0;
    this.running = false;
  }

  /** Scene-driven cadence and weight. RIG runs slower and fainter because the
   *  guest's screen is the content there and the field must not compete. */
  configure({ hz, opacity }) {
    this.hz = hz;
    this.canvas.style.opacity = String(opacity);
  }

  /** A real state or scene change, and the only thing that turns a dash gold.
   *  Ambient motion stays platinum on purpose: if gold appeared on its own it
   *  would stop meaning anything. */
  pulse() {
    this.pulseFrames = 24;
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
    const w = this.canvas.width;
    const phase = this.frame * PHASE_INCREMENT;

    ctx.clearRect(0, 0, w, this.canvas.height);

    // The pulse rides the leading dash for its duration, brightest at the
    // moment of the cut and decaying from there.
    const boost = this.pulseFrames > 0 ? (this.pulseFrames / 24) * 0.45 : 0;

    for (let r = 0; r < this.rows; r += 1) {
      const y = r * ROW_PITCH;
      const t = mod1(phase + r * PHASE_OFFSET);
      const travel = r % 2 === 0 ? t : 1 - t;
      const centre = travel * (w + SPAN) - SPAN / 2;

      for (let i = 0; i < CLUSTER; i += 1) {
        const offset = i - (CLUSTER - 1) / 2;          // -1.5 .. 1.5
        const x = Math.round(centre + offset * STEP);
        if (x < -DASH_W || x > w) continue;

        // Leading dash is brightest; the cluster tapers behind it.
        const b = 1 - Math.abs(offset) / 2 + (i === CLUSTER - 1 ? boost : 0);
        ctx.globalAlpha = Math.min(1, b);
        ctx.fillStyle = b > GOLD_THRESHOLD ? GOLD : PLATINUM;
        ctx.fillRect(x, y, DASH_W, DASH_H);
      }
    }

    ctx.globalAlpha = 1;
  }
}

function mod1(v) {
  return ((v % 1) + 1) % 1;
}
