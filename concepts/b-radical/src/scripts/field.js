/* ==========================================================================
   The live field.

   A lattice of drifting nodes joined by hairlines wherever two nodes come
   close enough. It is the hero ticker's idea — signal travelling through a
   structure — rebuilt as a room rather than a strip: the same yellow arc,
   now propagating through a blue network that reacts to the pointer.

   Performance contract: node count scales with viewport area and is capped;
   the neighbour search is a uniform grid rather than an O(n^2) sweep; the
   loop stops entirely when the tab is hidden or motion is not wanted.
   ========================================================================== */

const BLUE = '43, 107, 255';
const YELLOW = '255, 215, 0';

const LINK_DISTANCE = 132;
const POINTER_RADIUS = 190;
const MAX_NODES = 130;

export function createField(canvas) {
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return () => {};

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  let nodes = [];
  let width = 0;
  let height = 0;
  let dpr = 1;
  let frame = null;
  let running = false;
  const pointer = { x: -9999, y: -9999, active: false };

  function seed() {
    // One node per ~13,500 css px of area keeps density constant across a
    // phone and a wide desktop instead of crowding one and starving the other.
    const target = Math.min(MAX_NODES, Math.round((width * height) / 13500));
    nodes = Array.from({ length: target }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.16,
      vy: (Math.random() - 0.5) * 0.16,
      // Phase offset so the yellow charge does not pulse in unison.
      phase: Math.random() * Math.PI * 2,
    }));
  }

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
  }

  /* A uniform spatial grid: each node is bucketed by cell, and link testing
     only looks at the eight neighbouring cells. Linear in node count. */
  function buildGrid() {
    const cell = LINK_DISTANCE;
    const cols = Math.max(1, Math.ceil(width / cell));
    const rows = Math.max(1, Math.ceil(height / cell));
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
    });

    return { buckets, cols, rows };
  }

  function step(time) {
    const t = time * 0.001;

    for (const node of nodes) {
      node.x += node.vx;
      node.y += node.vy;

      // Wrap rather than bounce: a bounded box reads as a container, and this
      // field is meant to feel larger than the window it is seen through.
      if (node.x < -20) node.x = width + 20;
      if (node.x > width + 20) node.x = -20;
      if (node.y < -20) node.y = height + 20;
      if (node.y > height + 20) node.y = -20;

      // The pointer pushes the lattice gently aside.
      if (pointer.active) {
        const dx = node.x - pointer.x;
        const dy = node.y - pointer.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 0.01 && dist < POINTER_RADIUS) {
          const force = (1 - dist / POINTER_RADIUS) * 0.55;
          node.x += (dx / dist) * force;
          node.y += (dy / dist) * force;
        }
      }
    }

    ctx.clearRect(0, 0, width, height);

    const { buckets, cols, rows } = buildGrid();

    // Links first, so nodes sit on top of their own connections.
    ctx.lineWidth = 1;
    for (const node of nodes) {
      for (let ox = 0; ox <= 1; ox++) {
        for (let oy = ox === 0 ? 0 : -1; oy <= 1; oy++) {
          const nx = node.cx + ox;
          const ny = node.cy + oy;
          if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
          const bucket = buckets.get(ny * cols + nx);
          if (!bucket) continue;

          for (const j of bucket) {
            const other = nodes[j];
            if (other === node) continue;
            const dx = other.x - node.x;
            const dy = other.y - node.y;
            const dist = Math.hypot(dx, dy);
            if (dist >= LINK_DISTANCE) continue;

            const strength = 1 - dist / LINK_DISTANCE;
            // A charge travels the lattice: where two nodes' phases align with
            // the clock, the link reads yellow instead of blue.
            const charge = Math.sin(t * 1.1 + node.phase + other.phase) * 0.5 + 0.5;
            const hot = charge > 0.93;

            ctx.strokeStyle = hot
              ? `rgba(${YELLOW}, ${(strength * 0.85).toFixed(3)})`
              : `rgba(${BLUE}, ${(strength * 0.3).toFixed(3)})`;
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(other.x, other.y);
            ctx.stroke();
          }
        }
      }
    }

    for (const node of nodes) {
      const charge = Math.sin(t * 1.1 + node.phase * 2) * 0.5 + 0.5;
      const hot = charge > 0.96;
      ctx.fillStyle = hot
        ? `rgba(${YELLOW}, 0.95)`
        : `rgba(${BLUE}, ${(0.35 + charge * 0.3).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(node.x, node.y, hot ? 2.1 : 1.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function loop(time) {
    if (!running) return;
    step(time);
    frame = requestAnimationFrame(loop);
  }

  function start() {
    if (running || reduced.matches || document.hidden) return;
    running = true;
    frame = requestAnimationFrame(loop);
  }

  function stop() {
    running = false;
    if (frame) cancelAnimationFrame(frame);
    frame = null;
  }

  /* A single static frame for reduced motion: the field is part of the
     composition, so it should still be there, just not moving. */
  function paintStill() {
    step(0);
  }

  const onPointerMove = (event) => {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.active = true;
  };
  const onPointerLeave = () => { pointer.active = false; };
  const onVisibility = () => (document.hidden ? stop() : start());
  const onResize = () => {
    resize();
    if (reduced.matches) paintStill();
  };
  const onMotionChange = () => {
    stop();
    if (reduced.matches) paintStill();
    else start();
  };

  resize();
  if (reduced.matches) paintStill();
  else start();

  window.addEventListener('resize', onResize, { passive: true });
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerleave', onPointerLeave, { passive: true });
  document.addEventListener('visibilitychange', onVisibility);
  reduced.addEventListener('change', onMotionChange);

  return () => {
    stop();
    window.removeEventListener('resize', onResize);
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerleave', onPointerLeave);
    document.removeEventListener('visibilitychange', onVisibility);
    reduced.removeEventListener('change', onMotionChange);
  };
}
