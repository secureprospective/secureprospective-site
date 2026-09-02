/* ==========================================================================
   The live field.

   A lattice of drifting nodes joined by hairlines wherever two nodes come
   close enough. The room responds to the inputs a visitor actually has:
   pointer contact creates an inspection pulse, scroll sends a pulse through
   the field, and device tilt changes its drift direction.

   Performance contract: node count scales with viewport area and is capped;
   link search uses a uniform grid; touch devices draw at 30fps with a lower
   pixel and node budget; the loop stops when the tab is hidden or motion is
   not wanted. Resizing preserves the existing lattice instead of reseeding it.
   ========================================================================== */

const BLUE = '43, 107, 255';
const YELLOW = '255, 215, 0';

const LINK_DISTANCE = 132;
const LINK_DISTANCE_SQ = LINK_DISTANCE * LINK_DISTANCE;
const POINTER_RADIUS = 190;
const MAX_NODES = 130;
const TOUCH_MAX_NODES = 48;
// Two 60Hz vsyncs. A 32ms gate avoids floating-point boundary misses that
// turn an intended 30fps cadence into an accidental 20fps cadence.
const MOBILE_FRAME_MS = 32;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function createField(canvas, { subscribe } = {}) {
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return () => {};

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const touchDevice = navigator.maxTouchPoints > 0 || window.matchMedia('(pointer: coarse)').matches;
  const frameInterval = touchDevice ? MOBILE_FRAME_MS : 0;

  let nodes = [];
  let pulses = [];
  let width = 0;
  let height = 0;
  let dpr = 1;
  let frame = null;
  let resizeFrame = null;
  let running = false;
  let lastFrameTime = 0;
  let lastScrollY = null;
  let scrollEnergy = 0;
  let scrollDirection = 1;
  const pointer = {
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    energy: 0,
    active: false,
    initialized: false,
    pointerId: null,
  };
  const orientation = {
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    angleX: 0,
    angleY: 0,
  };
  let calibration = null;

  function makeNode() {
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.16,
      vy: (Math.random() - 0.5) * 0.16,
      // Phase offset so the yellow charge does not pulse in unison.
      phase: Math.random() * Math.PI * 2,
    };
  }

  function targetNodeCount() {
    const cap = touchDevice ? TOUCH_MAX_NODES : MAX_NODES;
    const areaPerNode = touchDevice ? 14500 : 13500;
    return Math.min(cap, Math.round((width * height) / areaPerNode));
  }

  function syncNodeCount() {
    const target = targetNodeCount();
    // Keep existing nodes in place. Only the small delta caused by a genuine
    // viewport change is added or removed, so a URL-bar resize is quiet.
    if (nodes.length > target) nodes.length = target;
    while (nodes.length < target) nodes.push(makeNode());
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const nextWidth = Math.max(1, rect.width);
    const nextHeight = Math.max(1, rect.height);
    const nextDpr = Math.min(touchDevice ? 1.5 : 2, window.devicePixelRatio || 1);
    const oldWidth = width;
    const oldHeight = height;

    if (nextWidth === width && nextHeight === height && nextDpr === dpr) return;

    width = nextWidth;
    height = nextHeight;
    dpr = nextDpr;
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (nodes.length && oldWidth && oldHeight) {
      const scaleX = width / oldWidth;
      const scaleY = height / oldHeight;
      nodes.forEach((node) => {
        node.x *= scaleX;
        node.y *= scaleY;
      });
    }
    syncNodeCount();
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
      node.index = i;
    });

    return { buckets, cols, rows };
  }

  function emitPulse(x, y, energy = 1) {
    if (!width || !height) return;
    // A bounded queue keeps repeated scroll and touch input from growing work.
    if (pulses.length >= 5) pulses.shift();
    pulses.push({
      x: clamp(x, -40, width + 40),
      y: clamp(y, -40, height + 40),
      age: 0,
      life: 0.95,
      energy: clamp(energy, 0.2, 1),
    });
  }

  function updatePulses(deltaSeconds) {
    for (let i = pulses.length - 1; i >= 0; i -= 1) {
      pulses[i].age += deltaSeconds;
      if (pulses[i].age >= pulses[i].life) pulses.splice(i, 1);
    }
  }

  function drawPulses() {
    if (!pulses.length) return;

    ctx.lineWidth = 1;
    pulses.forEach((pulse) => {
      const progress = pulse.age / pulse.life;
      const radius = 10 + progress * Math.min(width, height) * 0.54;
      const alpha = (1 - progress) * pulse.energy * 0.52;
      ctx.strokeStyle = `rgba(${YELLOW}, ${alpha.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(pulse.x, pulse.y, radius, 0, Math.PI * 2);
      ctx.stroke();

      // The shorter inner trace makes a contact read as a measured signal,
      // not a generic glow.
      if (progress < 0.55) {
        ctx.strokeStyle = `rgba(${YELLOW}, ${(alpha * 0.7).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(pulse.x, pulse.y, radius * 0.42, 0, Math.PI * 2);
        ctx.stroke();
      }
    });
  }

  function step(time, deltaMs = 16.67) {
    const deltaSeconds = Math.min(0.05, Math.max(0.001, deltaMs / 1000));
    const frameScale = Math.min(3, deltaMs / 16.67);
    const t = time * 0.001;
    const pointerEase = 1 - Math.pow(0.001, frameScale);
    const orientationEase = 1 - Math.pow(0.02, frameScale);

    pointer.x += (pointer.targetX - pointer.x) * pointerEase;
    pointer.y += (pointer.targetY - pointer.y) * pointerEase;
    pointer.energy += ((pointer.active ? 1 : 0) - pointer.energy) * pointerEase;
    orientation.x += (orientation.targetX - orientation.x) * orientationEase;
    orientation.y += (orientation.targetY - orientation.y) * orientationEase;
    scrollEnergy = Math.max(0, scrollEnergy - deltaSeconds * 2.8);
    updatePulses(deltaSeconds);

    const flowX = orientation.x * 0.055 + orientation.angleX * 0.018;
    const flowY = orientation.y * 0.055 + orientation.angleY * 0.018 + scrollDirection * scrollEnergy * 0.035;

    for (const node of nodes) {
      node.x += (node.vx + flowX) * frameScale;
      node.y += (node.vy + flowY) * frameScale;

      // Wrap rather than bounce: a bounded box reads as a container, and this
      // field is meant to feel larger than the window it is seen through.
      if (node.x < -20) node.x = width + 20;
      if (node.x > width + 20) node.x = -20;
      if (node.y < -20) node.y = height + 20;
      if (node.y > height + 20) node.y = -20;

      // Pointer contact pushes the lattice gently aside. The target position
      // is canvas-local, so a non-zero canvas offset cannot skew the force.
      if (pointer.energy > 0.01) {
        const dx = node.x - pointer.x;
        const dy = node.y - pointer.y;
        const distanceSq = dx * dx + dy * dy;
        if (distanceSq > 0.01 && distanceSq < POINTER_RADIUS * POINTER_RADIUS) {
          const distance = Math.sqrt(distanceSq);
          const force = (1 - distance / POINTER_RADIUS) * 0.55 * pointer.energy;
          node.x += (dx / distance) * force * frameScale;
          node.y += (dy / distance) * force * frameScale;
        }
      }
    }

    ctx.clearRect(0, 0, width, height);
    const { buckets, cols, rows } = buildGrid();

    // Links first, so nodes sit on top of their own connections. Index checks
    // prevent the same link from being painted twice in a shared bucket.
    ctx.lineWidth = 1;
    for (const node of nodes) {
      for (let ox = 0; ox <= 1; ox++) {
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
            const distanceSq = dx * dx + dy * dy;
            if (distanceSq >= LINK_DISTANCE_SQ) continue;

            const distance = Math.sqrt(distanceSq);
            const strength = 1 - distance / LINK_DISTANCE;
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

    drawPulses();

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

    if (!lastFrameTime || !frameInterval || time - lastFrameTime >= frameInterval) {
      const deltaMs = lastFrameTime ? time - lastFrameTime : 16.67;
      lastFrameTime = time;
      step(time, deltaMs);
    }
    frame = requestAnimationFrame(loop);
  }

  function start() {
    if (running || reduced.matches || document.hidden) return;
    running = true;
    lastFrameTime = 0;
    frame = requestAnimationFrame(loop);
  }

  function stop() {
    running = false;
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    lastFrameTime = 0;
  }

  /* A single static frame for reduced motion: the field is part of the
     composition, so it should still be there, just not moving. */
  function paintStill() {
    step(performance.now(), 16.67);
  }

  function setPointer(event) {
    const rect = canvas.getBoundingClientRect();
    pointer.targetX = event.clientX - rect.left;
    pointer.targetY = event.clientY - rect.top;
    if (!pointer.initialized) {
      pointer.x = pointer.targetX;
      pointer.y = pointer.targetY;
      pointer.initialized = true;
    }
  }

  const onPointerMove = (event) => {
    if (reduced.matches) return;
    if (event.pointerType === 'touch' && pointer.pointerId !== event.pointerId) return;
    setPointer(event);
    pointer.active = true;
  };
  const onPointerDown = (event) => {
    if (reduced.matches || event.isPrimary === false) return;
    pointer.pointerId = event.pointerType === 'touch' ? event.pointerId : null;
    setPointer(event);
    pointer.active = true;
    emitPulse(pointer.targetX, pointer.targetY, event.pointerType === 'touch' ? 1 : 0.7);
  };
  const onPointerUp = (event) => {
    if (event.pointerType === 'touch' && pointer.pointerId !== event.pointerId) return;
    pointer.active = false;
    pointer.pointerId = null;
  };
  const onPointerLeave = (event) => {
    if (event.pointerType && event.pointerType !== 'mouse') return;
    pointer.active = false;
  };
  const onScroll = (y) => {
    if (lastScrollY === null) {
      lastScrollY = y;
      return;
    }
    const delta = y - lastScrollY;
    lastScrollY = y;
    if (reduced.matches || Math.abs(delta) < 2) return;
    scrollDirection = delta >= 0 ? 1 : -1;
    scrollEnergy = Math.min(1, scrollEnergy + Math.min(0.75, Math.abs(delta) / 180));
    emitPulse(
      width * (scrollDirection > 0 ? 0.2 : 0.8),
      height * (scrollDirection > 0 ? 0.76 : 0.24),
      Math.min(0.9, 0.35 + Math.abs(delta) / 160)
    );
  };
  const onVisibility = () => (document.hidden ? stop() : start());
  const onMotionChange = () => {
    stop();
    if (reduced.matches) {
      pulses.length = 0;
      paintStill();
    } else {
      start();
    }
  };
  const onResize = () => {
    if (resizeFrame !== null) return;
    resizeFrame = requestAnimationFrame(() => {
      resizeFrame = null;
      resize();
      if (reduced.matches) paintStill();
    });
  };
  const setOrientationAngle = () => {
    const angle = Number(window.screen?.orientation?.angle ?? window.orientation ?? 0);
    const radians = (angle * Math.PI) / 180;
    orientation.angleX = Math.sin(radians);
    orientation.angleY = Math.cos(radians) - 1;
  };
  const onOrientationChange = () => {
    calibration = null;
    setOrientationAngle();
    if (!reduced.matches) emitPulse(width / 2, height / 2, 0.8);
    onResize();
  };
  const onDeviceOrientation = (event) => {
    if (!Number.isFinite(event.gamma) || !Number.isFinite(event.beta)) return;
    if (!calibration) calibration = { gamma: event.gamma, beta: event.beta };
    orientation.targetX = clamp((event.gamma - calibration.gamma) / 30, -1, 1);
    orientation.targetY = clamp((event.beta - calibration.beta) / 30, -1, 1);
  };

  resize();
  setOrientationAngle();
  if (reduced.matches) paintStill();
  else start();

  window.addEventListener('resize', onResize, { passive: true });
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerdown', onPointerDown, { passive: true });
  window.addEventListener('pointerup', onPointerUp, { passive: true });
  window.addEventListener('pointercancel', onPointerUp, { passive: true });
  window.addEventListener('pointerleave', onPointerLeave, { passive: true });
  window.addEventListener('orientationchange', onOrientationChange, { passive: true });
  window.addEventListener('deviceorientation', onDeviceOrientation, { passive: true });
  document.addEventListener('visibilitychange', onVisibility);
  reduced.addEventListener('change', onMotionChange);
  const screenOrientation = window.screen?.orientation;
  screenOrientation?.addEventListener?.('change', onOrientationChange);

  const resizeObserver = 'ResizeObserver' in window ? new ResizeObserver(onResize) : null;
  resizeObserver?.observe(canvas);
  const unsubscribe = subscribe?.(onScroll);

  return () => {
    stop();
    if (resizeFrame !== null) cancelAnimationFrame(resizeFrame);
    resizeFrame = null;
    unsubscribe?.();
    resizeObserver?.disconnect();
    window.removeEventListener('resize', onResize);
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerdown', onPointerDown);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointercancel', onPointerUp);
    window.removeEventListener('pointerleave', onPointerLeave);
    window.removeEventListener('orientationchange', onOrientationChange);
    window.removeEventListener('deviceorientation', onDeviceOrientation);
    document.removeEventListener('visibilitychange', onVisibility);
    reduced.removeEventListener('change', onMotionChange);
    screenOrientation?.removeEventListener?.('change', onOrientationChange);
    pulses = [];
    nodes = [];
  };
}
