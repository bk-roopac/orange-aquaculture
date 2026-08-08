/* ORANGE AQUACULTURE — the living sea
   Canvas: plankton motes (copepod escape-jumps), ambient clownfish, bubbles.
   DOM: dive-torch cursor, depth gauge, water colour by depth, scroll reveals. */

(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = document.documentElement;
  const canvas = document.getElementById("sea");
  const ctx = canvas.getContext("2d");
  const water = document.querySelector(".water");
  const secret = document.querySelector(".hero-secret");
  const gaugeMarker = document.getElementById("gaugeMarker");
  const depthNum = document.getElementById("depthNum");

  let W = 0, H = 0, DPR = 1;

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  resize();
  window.addEventListener("resize", resize);

  /* ---------- pointer / dive torch ---------- */

  const pointer = { x: W / 2, y: H * 0.4, tx: W / 2, ty: H * 0.4, active: false };

  function setPointer(x, y) {
    pointer.tx = x;
    pointer.ty = y;
    pointer.active = true;
  }
  window.addEventListener("pointermove", (e) => setPointer(e.clientX, e.clientY), { passive: true });
  window.addEventListener("touchmove", (e) => {
    if (e.touches[0]) setPointer(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });

  /* ---------- depth: gauge + water colour ---------- */

  const MAX_DEPTH = 40; // metres, bottom of the page
  const stops = [
    { p: 0.0, top: [14, 74, 99],  bot: [6, 40, 59] },
    { p: 0.35, top: [10, 53, 80], bot: [4, 29, 48] },
    { p: 0.7, top: [6, 38, 62],   bot: [2, 18, 31] },
    { p: 1.0, top: [3, 22, 36],   bot: [1, 8, 15] },
  ];

  function lerp(a, b, t) { return a + (b - a) * t; }
  function mixRGB(a, b, t) {
    return `rgb(${Math.round(lerp(a[0], b[0], t))},${Math.round(lerp(a[1], b[1], t))},${Math.round(lerp(a[2], b[2], t))})`;
  }

  let scrollProgress = 0;

  function onScroll() {
    const max = document.documentElement.scrollHeight - H;
    scrollProgress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;

    // water colour between stops
    let i = 0;
    while (i < stops.length - 2 && scrollProgress > stops[i + 1].p) i++;
    const a = stops[i], b = stops[i + 1];
    const t = Math.min(1, Math.max(0, (scrollProgress - a.p) / (b.p - a.p)));
    water.style.background = `linear-gradient(${mixRGB(a.top, b.top, t)}, ${mixRGB(a.bot, b.bot, t)})`;

    // gauge
    if (gaugeMarker) {
      const trackH = document.querySelector(".gauge").offsetHeight;
      gaugeMarker.style.top = (scrollProgress * (trackH - 9)).toFixed(1) + "px";
      depthNum.textContent = (scrollProgress * MAX_DEPTH).toFixed(1);
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- scroll reveals ---------- */

  const observer = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        observer.unobserve(e.target);
      }
    }
  }, { threshold: 0.18 });
  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

  /* ---------- card tilt ---------- */

  if (!reduceMotion && matchMedia("(hover: hover)").matches) {
    document.querySelectorAll(".card").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(900px) rotateX(${(-py * 5).toFixed(2)}deg) rotateY(${(px * 6).toFixed(2)}deg)`;
      });
      card.addEventListener("pointerleave", () => { card.style.transform = ""; });
    });
  }

  /* ---------- canvas world ---------- */

  const TORCH_R = 260;

  // plankton motes (copepods): drift, glow near light, escape-jump when crowded
  const MOTES = Math.min(140, Math.floor((W * H) / 12000));
  const motes = [];
  for (let i = 0; i < MOTES; i++) {
    motes.push({
      x: Math.random() * W,
      y: Math.random() * H,
      r: 0.6 + Math.random() * 1.5,
      vx: (Math.random() - 0.5) * 0.15,
      vy: -0.05 - Math.random() * 0.2,
      jx: 0, jy: 0,
      phase: Math.random() * Math.PI * 2,
    });
  }

  const bubbles = [];
  function burst(x, y, n) {
    for (let i = 0; i < n; i++) {
      bubbles.push({
        x: x + (Math.random() - 0.5) * 30,
        y: y + (Math.random() - 0.5) * 16,
        r: 1.5 + Math.random() * 4.5,
        vy: 1 + Math.random() * 1.6,
        wob: Math.random() * Math.PI * 2,
        life: 1,
      });
    }
  }
  window.addEventListener("pointerdown", (e) => {
    if (e.target.closest("a, button")) return;
    burst(e.clientX, e.clientY, 9 + Math.floor(Math.random() * 6));
  });

  // ambient clownfish (hero residents)
  class Fish {
    constructor(size) {
      this.size = size;
      this.x = Math.random() * W;
      this.y = H * (0.25 + Math.random() * 0.5);
      this.angle = Math.random() * Math.PI * 2;
      this.speed = 0.5 + Math.random() * 0.4;
      this.turn = 0;
      this.wanderT = Math.random() * 100;
      this.beat = 6 + Math.random() * 3;
    }
    update(dt, t) {
      this.wanderT += dt;
      let targetTurn = Math.sin(this.wanderT * 0.4 + this.beat) * 0.012;

      // gentle curiosity: drift toward the light, but keep distance
      if (pointer.active) {
        const dx = pointer.x - this.x, dy = pointer.y - this.y;
        const d = Math.hypot(dx, dy);
        if (d < 420 && d > 130) {
          const desired = Math.atan2(dy, dx);
          let diff = desired - this.angle;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          targetTurn += diff * 0.004;
        } else if (d <= 110) {
          const desired = Math.atan2(-dy, -dx);
          let diff = desired - this.angle;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          targetTurn += diff * 0.02;
        }
      }
      this.turn += (targetTurn - this.turn) * 0.08;
      this.angle += this.turn * dt * 60;

      // keep to hero band of water
      if (this.y < H * 0.14) this.angle += 0.01 * dt * 60 * (Math.cos(this.angle) >= 0 ? 1 : -1) * Math.sign(Math.sin(this.angle) < 0 ? 1 : 0.2);
      const v = this.speed * dt * 60;
      this.x += Math.cos(this.angle) * v;
      this.y += Math.sin(this.angle) * v * 0.55;

      const m = this.size;
      if (this.x < -m * 2) this.x = W + m * 2;
      if (this.x > W + m * 2) this.x = -m * 2;
      if (this.y < H * 0.1) this.y = H * 0.1;
      if (this.y > H * 0.85) this.y = H * 0.85;
    }
    draw(t, alpha) {
      const m = this.size;
      const flip = Math.cos(this.angle) < 0;
      const wag = Math.sin(t * this.beat) * 0.3;
      const lit = pointer.active
        ? Math.max(0, 1 - Math.hypot(pointer.x - this.x, pointer.y - this.y) / TORCH_R)
        : 0;

      ctx.save();
      ctx.globalAlpha = alpha * (0.85 + lit * 0.15);
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      if (flip) ctx.scale(1, -1);
      ctx.scale(m / 100, m / 100);

      if (lit > 0.15) {
        ctx.shadowColor = "rgba(87,228,212," + (0.5 * lit).toFixed(2) + ")";
        ctx.shadowBlur = 26 * lit;
      }

      const body = "#f79420", fin = "#d97b0e", band = "#f6fbfa", edge = "#10222b";

      // tail
      ctx.save();
      ctx.translate(-46, 0);
      ctx.rotate(wag);
      ctx.fillStyle = fin;
      ctx.beginPath();
      ctx.moveTo(6, 0);
      ctx.quadraticCurveTo(-26, -22, -20, 0);
      ctx.quadraticCurveTo(-26, 22, 6, 0);
      ctx.fill();
      ctx.restore();

      // dorsal + anal fins
      ctx.fillStyle = fin;
      ctx.beginPath();
      ctx.moveTo(-24, -22);
      ctx.quadraticCurveTo(8, -42 + wag * 6, 34, -22);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-18, 22);
      ctx.quadraticCurveTo(10, 40 - wag * 6, 32, 22);
      ctx.closePath();
      ctx.fill();

      // body
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.ellipse(0, 0, 50, 27, 0, 0, Math.PI * 2);
      ctx.fill();

      // bands (clipped)
      ctx.save();
      ctx.clip();
      ctx.fillStyle = band;
      ctx.strokeStyle = edge;
      ctx.lineWidth = 2;
      const bandShapes = [
        [30, -30, 14, 60],
        [-6, -30, 12, 60],
        [-40, -30, 9, 60],
      ];
      for (const [bx, by, bw, bh] of bandShapes) {
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(bx, by, bw, bh, 6);
        else ctx.rect(bx, by, bw, bh);
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();

      // pectoral fin
      ctx.save();
      ctx.translate(8, 8);
      ctx.rotate(Math.sin(t * this.beat * 0.8) * 0.35);
      ctx.fillStyle = fin;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-12, 20, 6, 20);
      ctx.quadraticCurveTo(12, 10, 6, 0);
      ctx.fill();
      ctx.restore();

      // eye
      ctx.shadowBlur = 0;
      ctx.fillStyle = edge;
      ctx.beginPath();
      ctx.arc(38, -8, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = band;
      ctx.beginPath();
      ctx.arc(39.5, -9.5, 1.6, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  const fishes = [new Fish(64), new Fish(48), new Fish(38)];

  /* ---------- main loop ---------- */

  let last = performance.now();

  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    const t = now / 1000;

    // torch follows pointer with watery lag
    pointer.x += (pointer.tx - pointer.x) * 0.07;
    pointer.y += (pointer.ty - pointer.y) * 0.07;
    root.style.setProperty("--mx", pointer.x.toFixed(1) + "px");
    root.style.setProperty("--my", pointer.y.toFixed(1) + "px");

    // secret line mask (element-local coords)
    if (secret) {
      const r = secret.getBoundingClientRect();
      secret.style.setProperty("--smx", (pointer.x - r.left).toFixed(1) + "px");
      secret.style.setProperty("--smy", (pointer.y - r.top).toFixed(1) + "px");
    }

    ctx.clearRect(0, 0, W, H);

    // motes
    for (const p of motes) {
      const dx = p.x - pointer.x, dy = p.y - pointer.y;
      const d = Math.hypot(dx, dy);

      // copepod escape jump
      if (pointer.active && d < 64 && Math.abs(p.jx) < 0.2 && Math.abs(p.jy) < 0.2) {
        const s = (2.4 + Math.random() * 1.6) / Math.max(d, 8);
        p.jx = dx * s;
        p.jy = dy * s;
      }
      p.jx *= 0.92;
      p.jy *= 0.92;

      p.x += (p.vx + p.jx + Math.sin(t * 0.6 + p.phase) * 0.08) * dt * 60;
      p.y += (p.vy + p.jy) * dt * 60;

      if (p.y < -5) { p.y = H + 5; p.x = Math.random() * W; }
      if (p.x < -5) p.x = W + 5;
      if (p.x > W + 5) p.x = -5;

      const lit = pointer.active ? Math.max(0, 1 - d / TORCH_R) : 0;
      ctx.globalAlpha = 0.16 + lit * 0.7;
      ctx.fillStyle = lit > 0.4 ? "#a8f2e8" : "#7fb6c4";
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r + lit * 0.8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // fish live near the surface — fade as you dive
    const fishAlpha = Math.max(0, 1 - window.scrollY / (H * 0.9));
    if (fishAlpha > 0.02) {
      for (const f of fishes) {
        f.update(dt, t);
        f.draw(t, fishAlpha);
      }
    }

    // bubbles
    for (let i = bubbles.length - 1; i >= 0; i--) {
      const b = bubbles[i];
      b.wob += dt * 5;
      b.x += Math.sin(b.wob) * 0.6;
      b.y -= b.vy * dt * 60;
      b.life -= dt * 0.25;
      if (b.y < -10 || b.life <= 0) { bubbles.splice(i, 1); continue; }
      ctx.globalAlpha = Math.max(0, Math.min(0.7, b.life));
      ctx.strokeStyle = "rgba(190,240,255,0.9)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.25, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    requestAnimationFrame(frame);
  }

  if (!reduceMotion) {
    requestAnimationFrame(frame);
  } else {
    // static scene: faint motes only
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "rgba(127,182,196,0.25)";
    for (const p of motes) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
})();
