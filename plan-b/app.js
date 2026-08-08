/* ORANGE AQUACULTURE — Plan B: the hatchery journal
   Loupe panels: hover magnifies eggs / phyto cells / copepods.
   Night panel: clownfish larvae swim toward your light (phototaxis).
   Plus: day-counter rail and scroll reveals. */

(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- reveals ---------- */

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }
  }, { threshold: 0.15 });
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

  /* ---------- day rail ---------- */

  const railMarker = document.getElementById("railMarker");
  const dayNum = document.getElementById("dayNum");
  const MAX_DAY = 34;

  function onScroll() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    if (railMarker) {
      const rail = document.querySelector(".rail");
      railMarker.style.top = (p * (rail.offsetHeight - 9)).toFixed(1) + "px";
      dayNum.textContent = Math.round(p * MAX_DAY);
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- specimen panels ---------- */

  const LENS_R = 88;

  class Panel {
    constructor(fig) {
      this.fig = fig;
      this.type = fig.dataset.micro;
      this.canvas = fig.querySelector("canvas");
      this.ctx = this.canvas.getContext("2d");
      this.active = false;
      this.pointer = { x: -9999, y: -9999, has: false, idleT: 0 };
      this.lens = { x: 0, y: 0 };
      this.t0 = Math.random() * 100;
      this.resize();
      this.populate();

      fig.addEventListener("pointermove", (e) => {
        const r = this.canvas.getBoundingClientRect();
        this.pointer.x = e.clientX - r.left;
        this.pointer.y = e.clientY - r.top;
        this.pointer.has = true;
        this.pointer.idleT = 0;
      });
      fig.addEventListener("pointerleave", () => { this.pointer.has = false; });
    }

    resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.w = this.canvas.clientWidth;
      this.h = this.canvas.clientHeight;
      this.canvas.width = this.w * dpr;
      this.canvas.height = this.h * dpr;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    populate() {
      const { w, h, type } = this;
      this.items = [];
      if (type === "eggs") {
        // clutch: rows of capsule eggs, clustered mid-panel
        const cols = Math.floor(w / 34), rows = 4;
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            if (Math.random() < 0.14) continue;
            this.items.push({
              x: 24 + c * 32 + (Math.random() - 0.5) * 10 + (r % 2) * 14,
              y: h * 0.32 + r * 40 + (Math.random() - 0.5) * 12,
              a: -0.35 + Math.random() * 0.7,
              phase: Math.random() * Math.PI * 2,
              eye: 0.6 + Math.random() * 0.4,
            });
          }
        }
      } else if (type === "phyto") {
        const n = Math.floor((w * h) / 520);
        for (let i = 0; i < n; i++) {
          this.items.push({
            x: Math.random() * w, y: Math.random() * h,
            r: 0.8 + Math.random() * 1.4,
            vx: (Math.random() - 0.5) * 0.12, vy: (Math.random() - 0.5) * 0.12,
            phase: Math.random() * Math.PI * 2,
            pair: Math.random() < 0.18,
          });
        }
      } else if (type === "pods") {
        const n = Math.floor((w * h) / 2300);
        for (let i = 0; i < n; i++) {
          this.items.push({
            x: Math.random() * w, y: Math.random() * h,
            a: Math.random() * Math.PI * 2,
            v: 0.15 + Math.random() * 0.2,
            jx: 0, jy: 0, jt: Math.random() * 6,
            phase: Math.random() * Math.PI * 2,
          });
        }
      } else if (type === "larvae") {
        const n = 44;
        for (let i = 0; i < n; i++) {
          this.items.push({
            x: Math.random() * w, y: Math.random() * h,
            a: Math.random() * Math.PI * 2,
            v: 0.5 + Math.random() * 0.5,
            phase: Math.random() * Math.PI * 2,
          });
        }
      }
    }

    tick(dt, t) {
      const { ctx, w, h, type } = this;
      ctx.clearRect(0, 0, w, h);

      // lens target: pointer, or a slow demo drift when untouched
      let tx, ty;
      if (this.pointer.has) {
        tx = this.pointer.x; ty = this.pointer.y;
      } else {
        this.pointer.idleT += dt;
        tx = w * (0.5 + 0.32 * Math.sin(t * 0.22 + this.t0));
        ty = h * (0.5 + 0.26 * Math.cos(t * 0.17 + this.t0));
      }
      this.lens.x += (tx - this.lens.x) * 0.09;
      this.lens.y += (ty - this.lens.y) * 0.09;

      if (type === "larvae") { this.drawLarvae(dt, t); return; }

      this.updateItems(dt, t);
      this.drawBase(t);
      this.drawLens(t);
    }

    updateItems(dt, t) {
      const { w, h, type } = this;
      if (type === "phyto") {
        for (const o of this.items) {
          o.x += (o.vx + Math.sin(t * 0.5 + o.phase) * 0.05) * dt * 60;
          o.y += (o.vy + Math.cos(t * 0.4 + o.phase) * 0.05) * dt * 60;
          if (o.x < 0) o.x = w; if (o.x > w) o.x = 0;
          if (o.y < 0) o.y = h; if (o.y > h) o.y = 0;
        }
      } else if (type === "pods") {
        for (const o of this.items) {
          o.jt -= dt;
          if (o.jt <= 0) { // characteristic copepod hop
            o.jx = Math.cos(o.a) * 3.2; o.jy = Math.sin(o.a) * 3.2;
            o.a += (Math.random() - 0.5) * 2.4;
            o.jt = 2 + Math.random() * 5;
          }
          o.jx *= 0.9; o.jy *= 0.9;
          o.x += (Math.cos(o.a) * o.v + o.jx) * dt * 60;
          o.y += (Math.sin(o.a) * o.v + o.jy) * dt * 60;
          if (o.x < 0) o.x = w; if (o.x > w) o.x = 0;
          if (o.y < 0) o.y = h; if (o.y > h) o.y = 0;
        }
      }
    }

    drawBase(t) {
      const { ctx, type } = this;
      if (type === "eggs") {
        for (const o of this.items) this.drawEgg(o, t, 1, o.x, o.y, false);
      } else if (type === "phyto") {
        ctx.fillStyle = "rgba(62,142,90,0.7)";
        for (const o of this.items) {
          ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2); ctx.fill();
        }
      } else if (type === "pods") {
        ctx.fillStyle = "rgba(18,51,59,0.5)";
        for (const o of this.items) {
          ctx.save();
          ctx.translate(o.x, o.y); ctx.rotate(o.a);
          ctx.fillRect(-2.4, -1, 4.8, 2);
          ctx.restore();
        }
      }
    }

    drawLens(t) {
      const { ctx, type } = this;
      const L = this.lens, R = LENS_R;
      const K = { eggs: 2.2, phyto: 3.5, pods: 3.2 }[type] || 3.5;

      ctx.save();
      ctx.beginPath();
      ctx.arc(L.x, L.y, R, 0, Math.PI * 2);
      ctx.clip();

      // glass field
      ctx.fillStyle = type === "eggs" ? "rgba(255,251,244,0.96)" : "rgba(250,253,251,0.96)";
      ctx.fillRect(L.x - R, L.y - R, R * 2, R * 2);

      // magnified organisms: p' = L + (p - L) * K
      for (const o of this.items) {
        const dx = o.x - L.x, dy = o.y - L.y;
        if (Math.hypot(dx, dy) > R / K + 26) continue;
        const px = L.x + dx * K, py = L.y + dy * K;
        if (type === "eggs") this.drawEgg(o, t, K, px, py, true);
        else if (type === "phyto") this.drawCell(o, t, K, px, py);
        else if (type === "pods") this.drawPod(o, t, K, px, py);
      }

      // subtle glass shading
      const sh = ctx.createRadialGradient(L.x - R * 0.35, L.y - R * 0.35, R * 0.1, L.x, L.y, R);
      sh.addColorStop(0, "rgba(255,255,255,0)");
      sh.addColorStop(0.85, "rgba(255,255,255,0)");
      sh.addColorStop(1, "rgba(18,51,59,0.10)");
      ctx.fillStyle = sh;
      ctx.fillRect(L.x - R, L.y - R, R * 2, R * 2);
      ctx.restore();

      // rim + specular
      ctx.beginPath();
      ctx.arc(L.x, L.y, R, 0, Math.PI * 2);
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(18,51,59,0.75)";
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(L.x, L.y, R - 5, -2.2, -1.1);
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(255,255,255,0.75)";
      ctx.stroke();
    }

    drawEgg(o, t, k, px, py, zoom) {
      const { ctx } = this;
      const sway = Math.sin(t * 1.6 + o.phase) * 0.06;
      const ew = 6.5 * k, eh = 11 * k;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(o.a + sway);
      const g = ctx.createLinearGradient(0, -eh, 0, eh);
      g.addColorStop(0, "#f9a63e");
      g.addColorStop(1, "#d97b0e");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(0, 0, ew, eh, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(120,60,0,0.35)";
      ctx.lineWidth = Math.max(1, 0.6 * k);
      ctx.stroke();
      if (zoom) {
        // embryo: curled body + silver eyes near the top
        ctx.strokeStyle = "rgba(120,60,0,0.4)";
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(0, eh * 0.15, ew * 0.5, 0.4, Math.PI * 1.5);
        ctx.stroke();
        const blink = Math.sin(t * 2 + o.phase) > -0.92 ? 1 : 0.2;
        for (const s of [-1, 1]) {
          ctx.fillStyle = "rgba(230,235,240," + 0.75 * o.eye * blink + ")";
          ctx.beginPath(); ctx.arc(s * ew * 0.26, -eh * 0.45, 2.1, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = "rgba(15,25,30," + o.eye * blink + ")";
          ctx.beginPath(); ctx.arc(s * ew * 0.26, -eh * 0.45, 1.3, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.restore();
    }

    drawCell(o, t, k, px, py) {
      const { ctx } = this;
      const r = o.r * k * (1 + 0.06 * Math.sin(t * 2 + o.phase));
      ctx.fillStyle = "rgba(96,178,116,0.9)";
      ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "rgba(39,107,64,0.9)";
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.fillStyle = "rgba(39,107,64,0.55)";
      ctx.beginPath(); ctx.arc(px - r * 0.25, py + r * 0.15, r * 0.38, 0, Math.PI * 2); ctx.fill();
      if (o.pair) {
        ctx.fillStyle = "rgba(96,178,116,0.9)";
        ctx.beginPath(); ctx.arc(px + r * 1.6, py - r * 0.4, r * 0.8, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "rgba(39,107,64,0.9)";
        ctx.stroke();
      }
    }

    drawPod(o, t, k, px, py) {
      const { ctx } = this;
      const s = k / 3.5;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(o.a);
      ctx.scale(s, s);
      // teardrop body
      ctx.fillStyle = "rgba(94,84,50,0.9)";
      ctx.beginPath();
      ctx.moveTo(10, 0);
      ctx.quadraticCurveTo(6, -7, -4, -5);
      ctx.quadraticCurveTo(-12, 0, -4, 5);
      ctx.quadraticCurveTo(6, 7, 10, 0);
      ctx.fill();
      // tail fork
      ctx.strokeStyle = "rgba(94,84,50,0.85)";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-10, 0); ctx.lineTo(-17, -4);
      ctx.moveTo(-10, 0); ctx.lineTo(-17, 4);
      ctx.stroke();
      // antennae, twitching
      const tw = Math.sin(t * 9 + o.phase) * 0.35;
      ctx.beginPath();
      ctx.moveTo(8, -2); ctx.quadraticCurveTo(20, -9 + tw * 6, 30, -5 + tw * 8);
      ctx.moveTo(8, 2); ctx.quadraticCurveTo(20, 9 - tw * 6, 30, 5 - tw * 8);
      ctx.stroke();
      // eye
      ctx.fillStyle = "rgba(20,15,5,0.95)";
      ctx.beginPath(); ctx.arc(6, 0, 1.8, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    drawLarvae(dt, t) {
      const { ctx, w, h } = this;
      const L = this.lens;
      const lampOn = true;

      // lamp glow
      if (lampOn) {
        const g = ctx.createRadialGradient(L.x, L.y, 4, L.x, L.y, 150);
        g.addColorStop(0, "rgba(255,232,178,0.32)");
        g.addColorStop(0.4, "rgba(180,220,235,0.12)");
        g.addColorStop(1, "rgba(180,220,235,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      }

      // rotifer specks drifting in the beam
      ctx.fillStyle = "rgba(220,240,245,0.35)";
      for (let i = 0; i < 26; i++) {
        const rx = L.x + Math.sin(t * 0.7 + i * 2.1) * 90;
        const ry = L.y + Math.cos(t * 0.6 + i * 1.7) * 70;
        const d = Math.hypot(rx - L.x, ry - L.y);
        if (d < 130) { ctx.beginPath(); ctx.arc(rx, ry, 1.1, 0, Math.PI * 2); ctx.fill(); }
      }

      for (const o of this.items) {
        // phototaxis: steer toward the lamp
        const dx = L.x - o.x, dy = L.y - o.y;
        const d = Math.hypot(dx, dy);
        const desired = Math.atan2(dy, dx);
        let diff = desired - o.a;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        const pull = d > 60 ? 0.045 : 0.008; // mill around once they arrive
        o.a += diff * pull + Math.sin(t * 2.2 + o.phase) * 0.06;

        o.x += Math.cos(o.a) * o.v * dt * 60;
        o.y += Math.sin(o.a) * o.v * dt * 60;
        if (o.x < 0) o.x = w; if (o.x > w) o.x = 0;
        if (o.y < 0) o.y = h; if (o.y > h) o.y = 0;

        // sliver body with a big eye — brighter inside the beam
        const lit = Math.max(0, 1 - d / 170);
        ctx.save();
        ctx.translate(o.x, o.y);
        ctx.rotate(o.a);
        ctx.globalAlpha = 0.35 + lit * 0.65;
        ctx.strokeStyle = "rgba(214,232,238,0.9)";
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(4, 0);
        ctx.quadraticCurveTo(-2, Math.sin(t * 10 + o.phase) * 1.6, -7, Math.sin(t * 10 + o.phase) * 2.6);
        ctx.stroke();
        ctx.fillStyle = "rgba(230,240,245,0.95)";
        ctx.beginPath(); ctx.arc(4.5, 0, 1.9, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "rgba(8,16,22,0.95)";
        ctx.beginPath(); ctx.arc(4.8, 0, 1.1, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }
  }

  const panels = [...document.querySelectorAll(".specimen")].map((f) => new Panel(f));

  const panelIO = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const p = panels.find((p) => p.fig === e.target);
      if (p) p.active = e.isIntersecting;
    }
  }, { threshold: 0.05 });
  panels.forEach((p) => panelIO.observe(p.fig));

  window.addEventListener("resize", () => panels.forEach((p) => { p.resize(); p.populate(); }));

  if (reduceMotion) {
    // single static frame per panel, lens parked center
    panels.forEach((p) => { p.lens.x = p.w / 2; p.lens.y = p.h / 2; p.tick(0, 1); });
    return;
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    const t = now / 1000;
    for (const p of panels) if (p.active) p.tick(dt, t);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
