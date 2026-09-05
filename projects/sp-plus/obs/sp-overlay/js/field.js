/* The live field, from Concept B — "The Signal Room".
 *
 * Ported from concepts/b-radical/src/scripts/field.js. A lattice of drifting
 * nodes joined by hairlines wherever two come close enough; a charge travels
 * the lattice and turns a link or a node yellow where phases align.
 *
 * The site's field answers a visitor's inputs -- pointer, scroll, device tilt.
 * A stream has none of those. What it has instead are OBS events, so the
 * inspection pulse is fired by a scene cut or a real state change. Same
 * mechanic, wired to the inputs this surface actually has.
 *
 * Two departures from the source, both deliberate:
 *
 * - Node seeding uses a fixed-seed PRNG rather than Math.random, so the
 *   lattice is identical on every launch. A recording made twice puts every
 *   node in the same place.
 * - The vignette is drawn into the canvas as a destination-out mask rather
 *   than painted as an opaque overlay. On the site it can paint --void over
 *   the ground; here the ground is often live video, which must not be
 *   darkened. Masking fades the FIELD at the edges and leaves the picture
 *   untouched.
 */

const BLUE = "43, 107, 255";
const YELLOW = "255, 215, 0";

const LINK_DISTANCE = 132;
const LINK_DISTANCE_SQ = LINK_DISTANCE * LINK_DISTANCE;
const AREA_PER_NODE = 13500;
const MAX_NODES = 130;

const CHARGE_RATE = 1.1;
const LINK_HOT = 0.93;
const NODE_HOT = 0.96;

const SEED = 0x5150b1;

/** mulberry32: small, fast, and fully determined by its seed. */
function prng(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Field {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: true });
    this.width = canvas.width;
    this.height = canvas.height;

    this.frame = 0;
    this.hz = 30;
    this.weight = 1;
    this.running = false;
    this.lastTick = 0;
    this.pulses = [];

    const rand = prng(SEED);
    const count = Math.min(MAX_NODES,
      Math.round((this.width * this.height) / AREA_PER_NODE));
    this.nodes = [];
    for (let i = 0; i < count; i += 1) {
      this.nodes.push({
        x: rand() * this.width,
        y: rand() * this.height,
        vx: (rand() - 0.5) * 0.16,
        vy: (rand() - 0.5) * 0.16,
        // Phase offset so the charge does not pulse in unison.
        phase: rand() * Math.PI * 2,
        cx: 0, cy: 0, index: i,
      });
    }

    this.buildMask();
  }

  /** The vignette, pre-rendered once. Kept as a mask so it can subtract the
   *  field at the edges without touching what is behind the page. */
  buildMask() {
    const m = document.createElement("canvas");
    m.width = this.width;
    m.height = this.height;
    const c = m.getContext("2d");
    const g = c.createRadialGradient(
      this.width * 0.5, this.height * 0.4, Math.min(this.width, this.height) * 0.30,
      this.width * 0.5, this.height * 0.4, Math.max(this.width, this.height) * 0.62);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(0,0,0,1)");
    c.fillStyle = g;
    c.fillRect(0, 0, this.width, this.height);
    this.mask = m;
  }

  /** Scene-driven weight. RIG runs faint because the guest's screen is the
   *  content there and the room must not compete with it. */
  configure({ hz, opacity }) {
    this.hz = hz;
    this.canvas.style.opacity = String(opacity);
  }

  /** An inspection pulse: a ring travelling out from a point, exactly as a
   *  pointer contact does on the site. Fired here by a scene cut or a real
   *  state change -- the only genuine events this surface receives. */
  pulse(x, y, energy = 0.8) {
    if (this.pulses.length >= 5) this.pulses.shift();
    this.pulses.push({
      x: x === undefined ? this.width * 0.5 : x,
      y: y === undefined ? this.height * 0.5 : y,
      age: 0,
      life: 0.95,
      energy,
    });
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
        this.step();
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
  }

  step() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // Time derives from the frame counter, never a wall clock, so the same
    // frame number always draws the same field.
    const dt = 1 / this.hz;
    const t = this.frame * dt;

    for (const node of this.nodes) {
      node.x += node.vx;
      node.y += node.vy;
      // Wrap rather than bounce: a bounded box reads as a container, and this
      // field is meant to feel larger than the frame it is seen through.
      if (node.x < -20) node.x = w + 20;
      if (node.x > w + 20) node.x = -20;
      if (node.y < -20) node.y = h + 20;
      if (node.y > h + 20) node.y = -20;
    }

    for (let i = this.pulses.length - 1; i >= 0; i -= 1) {
      this.pulses[i].age += dt;
      if (this.pulses[i].age >= this.pulses[i].life) this.pulses.splice(i, 1);
    }

    ctx.clearRect(0, 0, w, h);

    const { buckets, cols, rows } = this.grid();

    // Links first, so nodes sit on top of their own connections.
    ctx.lineWidth = 1;
    for (const node of this.nodes) {
      for (let ox = 0; ox <= 1; ox += 1) {
        for (let oy = ox === 0 ? 0 : -1; oy <= 1; oy += 1) {
          const nx = node.cx + ox;
          const ny = node.cy + oy;
          if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
          const bucket = buckets.get(ny * cols + nx);
          if (!bucket) continue;

          for (const j of bucket) {
            if (j <= node.index) continue;
            const other = this.nodes[j];
            const dx = other.x - node.x;
            const dy = other.y - node.y;
            const dsq = dx * dx + dy * dy;
            if (dsq >= LINK_DISTANCE_SQ) continue;

            const strength = 1 - Math.sqrt(dsq) / LINK_DISTANCE;
            const charge =
              Math.sin(t * CHARGE_RATE + node.phase + other.phase) * 0.5 + 0.5;
            ctx.strokeStyle = charge > LINK_HOT
              ? "rgba(" + YELLOW + ", " + (strength * 0.85).toFixed(3) + ")"
              : "rgba(" + BLUE + ", " + (strength * 0.3).toFixed(3) + ")";
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(other.x, other.y);
            ctx.stroke();
          }
        }
      }
    }

    this.drawPulses();

    for (const node of this.nodes) {
      const charge = Math.sin(t * CHARGE_RATE + node.phase * 2) * 0.5 + 0.5;
      const hot = charge > NODE_HOT;
      ctx.fillStyle = hot
        ? "rgba(" + YELLOW + ", 0.95)"
        : "rgba(" + BLUE + ", " + (0.35 + charge * 0.3).toFixed(3) + ")";
      ctx.beginPath();
      ctx.arc(node.x, node.y, hot ? 2.1 : 1.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Subtract the vignette so the field fades at the edges without laying a
    // single opaque pixel over the video beneath.
    ctx.globalCompositeOperation = "destination-out";
    ctx.drawImage(this.mask, 0, 0);
    ctx.globalCompositeOperation = "source-over";
  }

  drawPulses() {
    if (!this.pulses.length) return;
    const ctx = this.ctx;
    ctx.lineWidth = 1;
    for (const pulse of this.pulses) {
      const progress = pulse.age / pulse.life;
      const radius = 10 + progress * Math.min(this.width, this.height) * 0.54;
      const alpha = (1 - progress) * pulse.energy * 0.52;
      ctx.strokeStyle = "rgba(" + YELLOW + ", " + alpha.toFixed(3) + ")";
      ctx.beginPath();
      ctx.arc(pulse.x, pulse.y, radius, 0, Math.PI * 2);
      ctx.stroke();

      // The shorter inner trace makes a contact read as a measured signal,
      // not a generic glow.
      if (progress < 0.55) {
        ctx.strokeStyle = "rgba(" + YELLOW + ", " + (alpha * 0.7).toFixed(3) + ")";
        ctx.beginPath();
        ctx.arc(pulse.x, pulse.y, radius * 0.42, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  /** A uniform spatial grid: link testing only looks at neighbouring cells,
   *  which keeps the pass linear in node count. */
  grid() {
    const cell = LINK_DISTANCE;
    const cols = Math.max(1, Math.ceil(this.width / cell));
    const rows = Math.max(1, Math.ceil(this.height / cell));
    const buckets = new Map();

    this.nodes.forEach((node, i) => {
      const cx = Math.min(cols - 1, Math.max(0, Math.floor(node.x / cell)));
      const cy = Math.min(rows - 1, Math.max(0, Math.floor(node.y / cell)));
      const key = cy * cols + cx;
      let bucket = buckets.get(key);
      if (!bucket) buckets.set(key, (bucket = []));
      bucket.push(i);
      node.cx = cx;
      node.cy = cy;
      node.index = i;
    });

    return { buckets, cols, rows };
  }
}
