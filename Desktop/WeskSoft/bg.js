// ===== Background: কালো আকাশ + তারা + লাইন-আর্ট শহর + ঢেউয়ের কনটুর + পানির প্রতিবিম্ব =====
// স্কাইলাইন নিজে থেকে প্রসিডিউরালি আঁকা (seed ঠিক করা, তাই প্রতিবার একই দেখায়)।
(function () {
  const art = document.getElementById("bgArt");
  const starC = document.getElementById("stars");
  if (!art || !starC) return;
  const actx = art.getContext("2d");
  const sctx = starC.getContext("2d");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let W, H, dpr, stars = [];

  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function setup() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    for (const c of [art, starC]) {
      c.width = W * dpr;
      c.height = H * dpr;
    }
    sctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const r = rng(777);
    const n = Math.min(Math.round((W * H) / 6500), 260);
    stars = Array.from({ length: n }, () => {
      const big = r() < 0.06;
      return {
        x: r() * W, y: r() * H,
        r: big ? r() * 0.7 + 1.3 : r() * 0.9 + 0.35,
        base: r() * 0.5 + 0.4, sp: r() * 0.02 + 0.004, ph: r() * 6.28, halo: big,
      };
    });
    drawArt();
  }

  // ---------- স্ট্যাটিক আর্ট ----------
  function drawArt() {
    const ctx = actx;
    const r = rng(20260);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);

    const mobile = W < 700;
    const k = Math.max(0.5, Math.min(1.15, W / 1400));
    const hz = H * (mobile ? 0.72 : 0.68);           // দিগন্ত
    const maxH = hz * (mobile ? 0.42 : 0.55);

    // ১) ঢেউয়ের মতো বহমান কনটুর লাইন (ডান দিকে)
    const lineGrad = ctx.createLinearGradient(W * 0.36, 0, W, 0);
    lineGrad.addColorStop(0, "rgba(255,255,255,0)");
    lineGrad.addColorStop(0.45, "rgba(255,255,255,.35)");
    lineGrad.addColorStop(1, "rgba(255,255,255,.8)");
    ctx.strokeStyle = lineGrad;
    ctx.lineWidth = 1;
    const N = mobile ? 38 : 78;
    for (let i = 0; i < N; i++) {
      const t = i / N;
      ctx.globalAlpha = 0.45 + 0.55 * (1 - Math.abs(t - 0.55));
      ctx.beginPath();
      const steps = 70;
      for (let s = 0; s <= steps; s++) {
        const u = s / steps;
        const x = W * (0.36 + 0.64 * u);
        const base = hz * (0.08 + t * 0.9);
        const rise = hz * 0.5 * Math.pow(u, 1.7) * (1 - t * 0.85);
        const ripple = (4 + 8 * u) * Math.sin(u * 13 + t * 9) + 3 * Math.sin(u * 31 + t * 4);
        const y = base - rise + ripple + hz * 0.2 * (1 - u) * Math.sin(t * 3);
        s ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // ২) বিল্ডিং তৈরি
    const buildings = [];
    const cx = W * (mobile ? 0.6 : 0.62);
    let x = -10;
    while (x < W + 10) {
      const w = (20 + r() * 50) * k;
      const f = Math.exp(-Math.pow((x - cx) / (W * 0.27), 2));
      let h = (12 + r() * 38 + f * (50 + r() * 190)) * (H / 900);
      h = Math.min(h, maxH);
      buildings.push({ x, w, h, step: r() < 0.38, win: r() < 0.55 });
      x += w + r() * 4;
    }

    // ৩) পানির প্রতিবিম্ব + আনুভূমিক লাইন
    for (const b of buildings) {
      const g = ctx.createLinearGradient(0, hz, 0, hz + b.h * 0.7);
      g.addColorStop(0, "rgba(255,255,255,.12)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(b.x, hz + 4, b.w, b.h * 0.7);
    }
    let yy = hz + 5, row = 0;
    while (yy < H) {
      const depth = (yy - hz) / (H - hz);
      let xx = r() * 40 - 40;
      while (xx < W) {
        const len = 20 + r() * 130;
        if (r() < 0.62) {
          ctx.strokeStyle = `rgba(255,255,255,${(0.42 * (1 - depth) + 0.05) * (0.4 + r() * 0.8)})`;
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(xx, yy); ctx.lineTo(xx + len, yy); ctx.stroke();
        }
        xx += len + 6 + r() * 50;
      }
      yy += 3.5 + depth * 6 + (row++ % 3 === 0 ? 1 : 0);
    }

    // ৪) বিল্ডিং আঁকা (কালো ভরাট + সাদা আউটলাইন + হ্যাচ)
    for (const b of buildings) {
      const top = hz - b.h;
      ctx.fillStyle = "rgba(0,0,0,.94)";
      ctx.strokeStyle = "rgba(255,255,255,.62)";
      ctx.lineWidth = 1;
      ctx.fillRect(b.x, top, b.w, b.h);
      ctx.strokeRect(b.x + 0.5, top + 0.5, b.w - 1, b.h);

      // ভার্টিক্যাল হ্যাচ
      ctx.strokeStyle = "rgba(255,255,255,.2)";
      ctx.beginPath();
      for (let hx = b.x + 3; hx < b.x + b.w - 1; hx += 3 * (0.8 + k * 0.3)) {
        ctx.moveTo(hx + 0.5, top + 3); ctx.lineTo(hx + 0.5, hz);
      }
      ctx.stroke();

      // জানালার আনুভূমিক দাগ
      if (b.win) {
        ctx.strokeStyle = "rgba(255,255,255,.14)";
        ctx.beginPath();
        for (let wy = top + 8; wy < hz - 4; wy += 7) { ctx.moveTo(b.x + 2, wy); ctx.lineTo(b.x + b.w - 2, wy); }
        ctx.stroke();
      }

      // ধাপওয়ালা চূড়া
      if (b.step && b.h > 40) {
        const sw = b.w * 0.55, sh = Math.min(b.h * 0.18, 28);
        const sx = b.x + (b.w - sw) / 2;
        ctx.fillStyle = "rgba(0,0,0,.94)";
        ctx.fillRect(sx, top - sh, sw, sh);
        ctx.strokeStyle = "rgba(255,255,255,.62)";
        ctx.strokeRect(sx + 0.5, top - sh + 0.5, sw - 1, sh);
        ctx.beginPath(); ctx.moveTo(b.x + b.w / 2, top - sh); ctx.lineTo(b.x + b.w / 2, top - sh - 10 - r() * 14); ctx.stroke();
      }
    }

    // ৫) উঁচু টাওয়ার (পড, অ্যান্টেনা)
    const tx = W * (mobile ? 0.34 : 0.4), th = Math.min(maxH * 0.95, H * 0.4);
    ctx.fillStyle = "#000";
    ctx.strokeStyle = "rgba(255,255,255,.75)";
    ctx.lineWidth = 1;
    const sw = 5 * k + 2;
    ctx.fillRect(tx - sw / 2, hz - th, sw, th);
    ctx.strokeRect(tx - sw / 2 + 0.5, hz - th + 0.5, sw - 1, th);
    ctx.beginPath(); ctx.ellipse(tx, hz - th * 0.9, 13 * k + 4, 7 * k + 3, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath(); ctx.moveTo(tx + i * 4, hz - th * 0.9 - 4); ctx.lineTo(tx + i * 4, hz - th * 0.9 + 4); ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(tx, hz - th * 0.9 - 7); ctx.lineTo(tx, hz - th - 16); ctx.stroke();

    // ৬) তীরের গাছ/ঝোপের জ্যাগড লাইন + দিগন্তরেখা
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.moveTo(0, hz + 2);
    const pts = [];
    for (let px = 0; px <= W; px += 5) {
      const bump = (r() - 0.5) * 9 + Math.sin(px * 0.05) * 3;
      pts.push([px, hz - 4 + bump]);
    }
    pts.forEach((p) => ctx.lineTo(p[0], p[1]));
    ctx.lineTo(W, hz + 2); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.55)";
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,.4)";
    ctx.beginPath(); ctx.moveTo(0, hz + 2.5); ctx.lineTo(W, hz + 2.5); ctx.stroke();

    // ৭) লেখা পড়ার সুবিধার জন্য বাঁ দিক ও নিচ গাঢ় করা
    const lg = ctx.createLinearGradient(0, 0, W * 0.65, 0);
    lg.addColorStop(0, "rgba(0,0,0,.72)");
    lg.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = lg; ctx.fillRect(0, 0, W, H);
    const bgd = ctx.createLinearGradient(0, H * 0.85, 0, H);
    bgd.addColorStop(0, "rgba(0,0,0,0)");
    bgd.addColorStop(1, "rgba(0,0,0,.75)");
    ctx.fillStyle = bgd; ctx.fillRect(0, H * 0.85, W, H * 0.15);
  }

  // ---------- মিটমিট তারা ----------
  function drawStars(t) {
    sctx.clearRect(0, 0, W, H);
    for (const s of stars) {
      const tw = reduce ? 1 : 0.55 + 0.45 * Math.sin(t * s.sp + s.ph);
      const a = Math.min(1, s.base * tw + 0.12);
      if (s.halo) {
        sctx.beginPath(); sctx.arc(s.x, s.y, s.r * 5.5, 0, Math.PI * 2);
        sctx.fillStyle = `rgba(200,205,225,${a * 0.14})`; sctx.fill();
      }
      sctx.beginPath(); sctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      sctx.fillStyle = `rgba(255,255,255,${a})`; sctx.fill();
    }
  }
  function loop(t) {
    drawStars(t);
    if (!reduce && !document.hidden) requestAnimationFrame(loop);
  }

  let rt;
  window.addEventListener("resize", () => {
    clearTimeout(rt);
    rt = setTimeout(() => { setup(); if (reduce) drawStars(0); }, 150);
  });
  document.addEventListener("visibilitychange", () => { if (!document.hidden && !reduce) requestAnimationFrame(loop); });

  setup();
  requestAnimationFrame(loop);
})();