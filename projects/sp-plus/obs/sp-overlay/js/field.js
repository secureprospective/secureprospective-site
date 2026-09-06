/* The live field — Signal Room, built as a room rather than a backdrop.
 *
 * The concept's lattice is one plane. A frame that has to hold a presenter and
 * a guest's screen needs somewhere for them to stand, so the field is built
 * here as four depth planes drawn back to front:
 *
 *   0  DECK    a floor grid in one-point perspective, receding to a horizon
 *   1  FAR     small slow nodes, thin links, low alpha
 *   2  MID     the concept's own lattice at its published values
 *   3  NEAR    fewer, larger, faster nodes with brighter links
 *
 * Depth is carried by parallax rate, node size and alpha together -- change
 * one alone and the plane reads as a different colour rather than a different
 * distance. The pulse crosses every plane, expanding faster on the near ones,
 * so an event reads as passing through the room instead of across a picture.
 *
 * Position derives from an integer frame counter and a fixed-seed PRNG, never
 * a wall clock or Math.random: the same frame number always draws the same
 * room, so a recording made twice matches.
 */

const BLUE = "43, 107, 255";
const YELLOW = "255, 215, 0";

const CHARGE_RATE = 1.1;
const SEED = 0x5150b1;

/* Parallax factors. The deck is the floor of the room and hardly moves; the
   near plane is closest to the lens and moves most. The spread between them
   IS the depth -- compress it and the room flattens into a sliding image. */
const DECK_PARALLAX = 0.18;
const DECK_BLEED = 80;          // deck is drawn oversized so a shift shows no edge
const PLANE_PARALLAX = [0.42, 0.85, 1.6];

function spec_parallax(index) {
  return PLANE_PARALLAX[index] || 1;
}

/* Each plane's distance, expressed in every channel at once. */
const PLANES = [
  { name: "far",  areaPerNode: 26000, cap: 90, link: 96,  speed: 0.06, radius: 0.9, alpha: 0.45, hot: 0.985 },
  { name: "mid",  areaPerNode: 13500, cap: 130, link: 132, speed: 0.16, radius: 1.3, alpha: 1.0,  hot: 0.96 },
  { name: "near", areaPerNode: 62000, cap: 34, link: 210, speed: 0.34, radius: 2.4, alpha: 1.25, hot: 0.93 },
];

/* The deck. A one-point perspective grid: rows bunch toward the horizon, so
   the eye reads distance from the spacing rather than from a gradient. */
const DECK = {
  horizon: 0.46,     // fraction of height
  rows: 16,
  columns: 26,
  alpha: 0.17,
};

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
    this.depth = 1;        // scene-driven depth multiplier
    this.running = false;
    this.lastTick = 0;
    this.pulses = [];

    /* The camera. Each scene sits at a different position in the room, and a
       cut moves the camera to it rather than cross-fading a backdrop. Every
       plane offsets by its own factor, so the deck barely shifts while the
       near lattice swings past -- which is what makes the move read as
       travelling through a space instead of sliding a picture. */
    this.cam = { x: 0, y: 0, tx: 0, ty: 0 };

    const rand = prng(SEED);
    this.planes = PLANES.map((spec) => {
      const count = Math.min(spec.cap,
        Math.round((this.width * this.height) / spec.areaPerNode));
      const nodes = [];
      for (let i = 0; i < count; i += 1) {
        nodes.push({
          x: rand() * this.width,
          y: rand() * this.height,
          vx: (rand() - 0.5) * spec.speed,
          vy: (rand() - 0.5) * spec.speed,
          phase: rand() * Math.PI * 2,
          cx: 0, cy: 0, index: i,
        });
      }
      return { spec, nodes };
    });

    this.buildDeck();
    this.buildMask();
  }

  /* The deck is static geometry, so it is rendered once and blitted. Redrawing
     40-odd perspective lines every frame buys nothing. */
  buildDeck() {
    // Oversized by the bleed on every side so a camera move never exposes the
    // deck's own edge.
    const w = this.width + DECK_BLEED * 2;
    const h = this.height + DECK_BLEED * 2;
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const g = c.getContext("2d");
    const hy = h * DECK.horizon;
    const vx = w * 0.5;

    g.lineWidth = 1;

    // Verticals converging on the vanishing point.
    for (let i = 0; i <= DECK.columns; i += 1) {
      const t = i / DECK.columns;
      const x = -w * 1.2 + t * (w * 3.4);
      const fade = 1 - Math.abs(t - 0.5) * 1.3;
      if (fade <= 0) continue;
      g.strokeStyle = "rgba(" + BLUE + ", " + (DECK.alpha * fade).toFixed(3) + ")";
      g.beginPath();
      g.moveTo(vx, hy);
      g.lineTo(x, h);
      g.stroke();
    }

    // Rows, spaced so they bunch toward the horizon.
    for (let i = 1; i <= DECK.rows; i += 1) {
      const t = i / DECK.rows;
      const y = hy + (h - hy) * (t * t);
      const fade = t * 0.9 + 0.1;
      g.strokeStyle = "rgba(" + BLUE + ", " + (DECK.alpha * fade).toFixed(3) + ")";
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(w, y);
      g.stroke();
    }

    // The horizon itself, the one line that is allowed to be bright.
    g.strokeStyle = "rgba(" + BLUE + ", 0.30)";
    g.beginPath();
    g.moveTo(0, hy);
    g.lineTo(w, hy);
    g.stroke();

    this.deck = c;
  }

  /** The vignette, pre-rendered once and applied as a mask so it can subtract
   *  the field at the edges without laying an opaque pixel over the video. */
  buildMask() {
    const m = document.createElement("canvas");
    m.width = this.width;
    m.height = this.height;
    const c = m.getContext("2d");
    const g = c.createRadialGradient(
      this.width * 0.5, this.height * 0.44, Math.min(this.width, this.height) * 0.26,
      this.width * 0.5, this.height * 0.44, Math.max(this.width, this.height) * 0.64);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(0,0,0,1)");
    c.fillStyle = g;
    c.fillRect(0, 0, this.width, this.height);
    this.mask = m;
  }

  /** Scene-driven weight. `depth` scales how much of the room is admitted:
   *  RIG keeps only the faintest planes because the guest's screen is the
   *  content there. */
  configure({ hz, opacity, depth, camera }) {
    this.hz = hz;
    this.depth = depth === undefined ? 1 : depth;
    this.canvas.style.opacity = String(opacity);
    if (camera) {
      this.cam.tx = camera[0];
      this.cam.ty = camera[1];
    }
  }

  /** An inspection pulse, fired by a real OBS event. */
  pulse(x, y, energy = 0.8) {
    if (this.pulses.length >= 5) this.pulses.shift();
    this.pulses.push({
      x: x === undefined ? this.width * 0.5 : x,
      y: y === undefined ? this.height * 0.5 : y,
      age: 0, life: 1.05, energy,
    });
  }

  start() {
    if (this.running) return;
    this.running = true;
    const loop = (ts) => {
      if (!this.running) return;
      if (ts - this.lastTick >= 1000 / this.hz) {
        this.lastTick = ts;
        this.frame += 1;
        this.step();
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  stop() { this.running = false; }

  step() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const dt = 1 / this.hz;
    const t = this.frame * dt;

    for (let i = this.pulses.length - 1; i >= 0; i -= 1) {
      this.pulses[i].age += dt;
      if (this.pulses[i].age >= this.pulses[i].life) this.pulses.splice(i, 1);
    }

    // Critically damped enough to settle inside a cut without overshooting.
    this.cam.x += (this.cam.tx - this.cam.x) * 0.12;
    this.cam.y += (this.cam.ty - this.cam.y) * 0.12;

    ctx.clearRect(0, 0, w, h);

    // Plane 0: the deck. Furthest away, so it moves least -- the parallax
    // factors below are the whole depth cue and are deliberately spread wide.
    ctx.globalAlpha = 0.9 * this.depth;
    ctx.drawImage(this.deck,
      Math.round(this.cam.x * DECK_PARALLAX) - DECK_BLEED,
      Math.round(this.cam.y * DECK_PARALLAX) - DECK_BLEED);
    ctx.globalAlpha = 1;

    this.planes.forEach((plane, index) => {
      // Nearer planes survive a low depth setting longer than far ones, which
      // is what keeps a faint room reading as a room and not as haze.
      const weight = Math.min(1, this.depth * (0.7 + index * 0.35));
      if (weight <= 0.02) return;
      ctx.save();
      ctx.translate(Math.round(this.cam.x * spec_parallax(index)),
                    Math.round(this.cam.y * spec_parallax(index)));
      this.drawPlane(plane, t, weight);
      ctx.restore();
    });

    this.drawPulses();

    ctx.globalCompositeOperation = "destination-out";
    ctx.drawImage(this.mask, 0, 0);
    ctx.globalCompositeOperation = "source-over";
  }

  drawPlane(plane, t, weight) {
    const ctx = this.ctx;
    const { spec, nodes } = plane;
    const w = this.width;
    const h = this.height;
    const linkSq = spec.link * spec.link;

    for (const node of nodes) {
      node.x += node.vx;
      node.y += node.vy;
      // Wrap rather than bounce: a bounded box reads as a container, and this
      // room is meant to feel larger than the frame it is seen through.
      if (node.x < -30) node.x = w + 30;
      if (node.x > w + 30) node.x = -30;
      if (node.y < -30) node.y = h + 30;
      if (node.y > h + 30) node.y = -30;
    }

    const { buckets, cols, rows } = this.grid(nodes, spec.link);

    ctx.lineWidth = spec.name === "near" ? 1.4 : 1;
    for (const node of nodes) {
      for (let ox = 0; ox <= 1; ox += 1) {
        for (let oy = ox === 0 ? 0 : -1; oy <= 1; oy += 1) {
          const nx = node.cx + ox;
          const ny = node.cy + oy;
          if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
          const bucket = buckets.get(ny * cols + nx);
          if (!bucket) continue;

          for (const j of bucket) {
            if (j <= node.index) continue;
            const other = nodes[j];
            const dx = other.x - node.x;
            const dy = other.y - node.y;
            const dsq = dx * dx + dy * dy;
            if (dsq >= linkSq) continue;

            const strength = (1 - Math.sqrt(dsq) / spec.link) * spec.alpha * weight;
            const charge =
              Math.sin(t * CHARGE_RATE + node.phase + other.phase) * 0.5 + 0.5;
            ctx.strokeStyle = charge > spec.hot
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

    for (const node of nodes) {
      const charge = Math.sin(t * CHARGE_RATE + node.phase * 2) * 0.5 + 0.5;
      const hot = charge > spec.hot;
      const a = spec.alpha * weight;
      ctx.fillStyle = hot
        ? "rgba(" + YELLOW + ", " + Math.min(1, 0.95 * a).toFixed(3) + ")"
        : "rgba(" + BLUE + ", " + Math.min(1, (0.35 + charge * 0.3) * a).toFixed(3) + ")";
      ctx.beginPath();
      ctx.arc(node.x, node.y, hot ? spec.radius * 1.6 : spec.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawPulses() {
    if (!this.pulses.length) return;
    const ctx = this.ctx;
    const reach = Math.min(this.width, this.height);

    for (const pulse of this.pulses) {
      const progress = pulse.age / pulse.life;
      const alpha = (1 - progress) * pulse.energy * 0.5 * this.depth;
      if (alpha <= 0.004) continue;

      // One ring per plane, each expanding at its own rate, so the pulse
      // travels through the room rather than across a flat picture.
      const rings = [
        { r: 10 + progress * reach * 0.34, a: alpha * 0.55, w: 1 },
        { r: 10 + progress * reach * 0.58, a: alpha, w: 1 },
        { r: 10 + progress * reach * 0.92, a: alpha * 0.7, w: 1.6 },
      ];

      for (const ring of rings) {
        ctx.lineWidth = ring.w;
        ctx.strokeStyle = "rgba(" + YELLOW + ", " + ring.a.toFixed(3) + ")";
        ctx.beginPath();
        ctx.arc(pulse.x, pulse.y, ring.r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // The short inner trace makes a contact read as a measured signal
      // rather than a generic glow.
      if (progress < 0.5) {
        ctx.lineWidth = 1;
        ctx.strokeStyle = "rgba(" + YELLOW + ", " + (alpha * 0.7).toFixed(3) + ")";
        ctx.beginPath();
        ctx.arc(pulse.x, pulse.y, 10 + progress * reach * 0.24, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  /** A uniform spatial grid, so link testing stays linear in node count. */
  grid(nodes, cell) {
    const cols = Math.max(1, Math.ceil(this.width / cell));
    const rows = Math.max(1, Math.ceil(this.height / cell));
    const buckets = new Map();

    nodes.forEach((node, i) => {
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
