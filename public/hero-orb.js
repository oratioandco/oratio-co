/**
 * Hero wireframe orb — Canvas 2D, zero dependencies.
 *
 * Renders a rotating sphere of connected points. Edges pulse on their own
 * lifecycles ("breathing"), triangular faces flash with muted stained-glass
 * colors, and points flurry away from pointer movement.
 *
 * Mount by including this file on any page that has a <canvas id="hero-canvas">
 * inside a .hero section.
 */
(function () {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: true });

  // ─── Points on a sphere via Fibonacci lattice ───
  const N_POINTS = 96;
  const points = [];
  const GOLDEN_RATIO = (1 + Math.sqrt(5)) / 2;
  for (let i = 0; i < N_POINTS; i++) {
    const t = i / (N_POINTS - 1);
    const inclination = Math.acos(1 - 2 * t);
    const azimuth = 2 * Math.PI * i / GOLDEN_RATIO;
    points.push({
      x: Math.sin(inclination) * Math.cos(azimuth),
      y: Math.sin(inclination) * Math.sin(azimuth),
      z: Math.cos(inclination),
      accent: i % 13 === 0,
    });
  }

  // ─── Edges (nearest-6 neighbors, each with a breathing cycle) ───
  const connections = [];
  const seen = new Set();
  const adj = new Map();
  for (let i = 0; i < points.length; i++) {
    const dists = [];
    for (let j = 0; j < points.length; j++) {
      if (i === j) continue;
      const dx = points[i].x - points[j].x;
      const dy = points[i].y - points[j].y;
      const dz = points[i].z - points[j].z;
      dists.push({ j, d: dx * dx + dy * dy + dz * dz });
    }
    dists.sort((a, b) => a.d - b.d);
    for (let k = 0; k < 6; k++) {
      const j = dists[k].j;
      const key = i < j ? i + '_' + j : j + '_' + i;
      if (seen.has(key)) continue;
      seen.add(key);
      connections.push({
        i: Math.min(i, j), j: Math.max(i, j),
        phase: Math.random() * Math.PI * 2,
        period: 8 + Math.random() * 14,
        threshold: 0.15 + Math.random() * 0.25,
      });
      if (!adj.has(i)) adj.set(i, new Set());
      if (!adj.has(j)) adj.set(j, new Set());
      adj.get(i).add(j); adj.get(j).add(i);
    }
  }

  // ─── Faces (triangles of 3 mutually-connected points — stained glass) ───
  // Palette: muted and tonal. Very low alpha at draw time so they whisper.
  const FACE_COLORS = [
    [131, 201, 236], // soft sky blue
    [240, 231, 148], // warm gold
    [246, 241, 231], // cream
    [200, 170, 120], // warm ochre
    [180, 200, 210], // cool dusk
  ];
  const faces = [];
  const faceSeen = new Set();
  for (let i = 0; i < points.length; i++) {
    const ni = adj.get(i); if (!ni) continue;
    for (const j of ni) {
      if (j <= i) continue;
      const nj = adj.get(j); if (!nj) continue;
      for (const k of nj) {
        if (k <= j) continue;
        if (!ni.has(k)) continue;
        const key = i + '_' + j + '_' + k;
        if (faceSeen.has(key)) continue;
        faceSeen.add(key);
        faces.push({
          i, j, k,
          phase: Math.random() * Math.PI * 2,
          period: 14 + Math.random() * 20,        // slower than edges — hold longer
          threshold: 0.45 + Math.random() * 0.3,  // more dormant than edges — most faces are dark
          colorIndex: Math.floor(Math.random() * FACE_COLORS.length),
        });
      }
    }
  }

  // ─── Pointer interaction state ───
  const disp = new Float32Array(points.length * 4);
  let ptrX = null, ptrY = null, ptrPrevX = null, ptrPrevY = null, ptrVX = 0, ptrVY = 0;
  const hero = canvas.parentElement;
  hero.addEventListener('pointermove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const nx = e.clientX - rect.left, ny = e.clientY - rect.top;
    if (ptrPrevX !== null) { ptrVX = nx - ptrPrevX; ptrVY = ny - ptrPrevY; }
    ptrPrevX = nx; ptrPrevY = ny; ptrX = nx; ptrY = ny;
  }, { passive: true });
  hero.addEventListener('pointerleave', () => { ptrX = null; ptrY = null; ptrPrevX = null; ptrPrevY = null; });

  // ─── Sizing + DPR ───
  let width = 0, height = 0, scale = 1, dpr = window.devicePixelRatio || 1;
  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = rect.width; height = rect.height;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(width * dpr); canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    scale = Math.min(width, height) * 0.38;
  }
  resize();
  window.addEventListener('resize', resize);

  // ─── Rotation + projection ───
  let rotY = 0, rotX = -0.35;
  const FOCAL = 2.2;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function project(p) {
    const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
    const x1 = p.x * cosY - p.z * sinY;
    const z1 = p.x * sinY + p.z * cosY;
    const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
    const y2 = p.y * cosX - z1 * sinX;
    const z2 = p.y * sinX + z1 * cosX;
    const pers = FOCAL / (FOCAL - z2);
    return { sx: width / 2 + x1 * scale * pers, sy: height / 2 + y2 * scale * pers, z: z2 };
  }

  // ─── Interaction constants ───
  const POINTER_RADIUS = 180, POINTER_FORCE = 0.9, POINTER_SPEED_BOOST = 3.2;
  const SPRING = 0.055, DAMPING = 0.88, MAX_DISP = 80;

  function render() {
    ctx.clearRect(0, 0, width, height);
    const proj = points.map(project);

    // Pointer displacement physics
    const mouseActive = ptrX !== null && !reducedMotion;
    const speedMag = Math.sqrt(ptrVX * ptrVX + ptrVY * ptrVY);
    const speedFactor = Math.min(1.2, speedMag / 25);
    for (let i = 0; i < points.length; i++) {
      const base = proj[i];
      let dx = disp[i*4], dy = disp[i*4+1], vx = disp[i*4+2], vy = disp[i*4+3];
      if (mouseActive) {
        const mdx = base.sx - ptrX, mdy = base.sy - ptrY;
        const distSq = mdx*mdx + mdy*mdy;
        if (distSq < POINTER_RADIUS * POINTER_RADIUS) {
          const dist = Math.sqrt(distSq) + 0.001;
          const falloff = 1 - dist / POINTER_RADIUS;
          const strength = falloff * falloff * (POINTER_FORCE + speedFactor * POINTER_SPEED_BOOST);
          vx += (mdx / dist) * strength; vy += (mdy / dist) * strength;
          const swirl = falloff * speedFactor * 0.4;
          vx += (-mdy / dist) * swirl; vy += (mdx / dist) * swirl;
        }
      }
      vx -= dx * SPRING; vy -= dy * SPRING;
      vx *= DAMPING; vy *= DAMPING;
      dx += vx; dy += vy;
      if (dx > MAX_DISP) dx = MAX_DISP; if (dx < -MAX_DISP) dx = -MAX_DISP;
      if (dy > MAX_DISP) dy = MAX_DISP; if (dy < -MAX_DISP) dy = -MAX_DISP;
      disp[i*4] = dx; disp[i*4+1] = dy; disp[i*4+2] = vx; disp[i*4+3] = vy;
      base.sx += dx; base.sy += dy;
    }
    ptrVX *= 0.72; ptrVY *= 0.72;

    const time = performance.now() * 0.001;

    // ── 1. Stained glass faces (drawn first, behind edges) ──
    for (let f = 0; f < faces.length; f++) {
      const face = faces[f];
      const a = proj[face.i], b = proj[face.j], c = proj[face.k];
      // Back-face cull by 2D cross product of projected triangle
      const ux = b.sx - a.sx, uy = b.sy - a.sy;
      const vx = c.sx - a.sx, vy = c.sy - a.sy;
      const cross = ux * vy - uy * vx;
      if (cross < 0) continue; // back-facing — skip

      // Breathing cycle
      const raw = Math.sin(time * (Math.PI * 2 / face.period) + face.phase);
      let pulse = (raw - face.threshold) / (1 - face.threshold);
      if (pulse <= 0) continue;
      if (pulse > 1) pulse = 1;
      pulse = pulse * pulse * (3 - 2 * pulse);

      // Depth
      const avgZ = (a.z + b.z + c.z) / 3;
      const depthT = (avgZ + 1) * 0.5;

      const col = FACE_COLORS[face.colorIndex];
      const alpha = depthT * pulse * 0.17; // very subtle stained-glass
      if (alpha < 0.005) continue;

      ctx.fillStyle = 'rgba(' + col[0] + ',' + col[1] + ',' + col[2] + ',' + alpha + ')';
      ctx.beginPath();
      ctx.moveTo(a.sx, a.sy);
      ctx.lineTo(b.sx, b.sy);
      ctx.lineTo(c.sx, c.sy);
      ctx.closePath();
      ctx.fill();
    }

    // ── 2. Edges (lead) ──
    ctx.lineWidth = 0.6;
    for (let c = 0; c < connections.length; c++) {
      const conn = connections[c];
      const a = proj[conn.i], b = proj[conn.j];
      const raw = Math.sin(time * (Math.PI * 2 / conn.period) + conn.phase);
      let pulse = (raw - conn.threshold) / (1 - conn.threshold);
      if (pulse <= 0) continue;
      if (pulse > 1) pulse = 1;
      pulse = pulse * pulse * (3 - 2 * pulse);
      const avgZ = (a.z + b.z) * 0.5;
      const depthT = (avgZ + 1) * 0.5;
      const alpha = (0.04 + depthT * 0.42) * pulse;
      if (alpha < 0.01) continue;
      ctx.strokeStyle = 'rgba(246, 241, 231, ' + alpha + ')';
      ctx.beginPath(); ctx.moveTo(a.sx, a.sy); ctx.lineTo(b.sx, b.sy); ctx.stroke();
    }

    // ── 3. Nodes ──
    for (let i = 0; i < points.length; i++) {
      const p = points[i], pr = proj[i];
      const t = (pr.z + 1) * 0.5;
      const radius = 1.1 + t * 1.8;
      const alpha = 0.2 + t * 0.75;
      if (p.accent) {
        ctx.fillStyle = 'rgba(240, 231, 148, ' + alpha + ')';
        ctx.beginPath(); ctx.arc(pr.sx, pr.sy, radius * 1.4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(240, 231, 148, ' + Math.min(1, alpha + 0.25) + ')';
        ctx.beginPath(); ctx.arc(pr.sx, pr.sy, radius * 0.55, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.fillStyle = 'rgba(246, 241, 231, ' + alpha + ')';
        ctx.beginPath(); ctx.arc(pr.sx, pr.sy, radius, 0, Math.PI * 2); ctx.fill();
      }
    }

    // Advance rotation
    if (!reducedMotion) {
      rotY += 0.0018;
      rotX = -0.35 + Math.sin(rotY * 0.3) * 0.12;
    }
  }

  let rafId;
  function loop() { render(); rafId = requestAnimationFrame(loop); }
  if (reducedMotion) render(); else loop();

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { if (rafId) cancelAnimationFrame(rafId); }
    else if (!reducedMotion) loop();
  });
})();
