// ===== Auto Racer — top-down, endless, plays by itself =====
// গাড়ি নিজেই লেন বদলে অন্য গাড়ি এড়ায় আর কয়েন কুড়ায়। কখনও শেষ হয় না।
(function () {
  const canvas = document.getElementById("gameCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  // পোর্ট্রেট (লম্বা) ক্যানভাস — মোবাইল ও ডেস্কটপ দুই জায়গাতেই একই অনুপাত
  const W = 300, H = 420;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const LANES = 3, LANE_W = 60;
  const ROAD_W = LANES * LANE_W;
  const ROAD_X = (W - ROAD_W) / 2;
  const laneX = (i) => ROAD_X + LANE_W * (i + 0.5);
  const PY = H - 92;                 // খেলোয়াড়ের গাড়ির Y
  const CAR_W = 30, CAR_H = 52;
  const CAR_COLORS = ["#ef4444", "#f59e0b", "#22c55e", "#06b6d4", "#a855f7", "#ec4899", "#f97316", "#eab308", "#3b82f6"];
  const TREE_COLORS = ["#16a34a", "#22c55e", "#15803d", "#4ade80"];

  const rand = (a, b) => Math.random() * (b - a) + a;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  function rr(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // ---------- স্টেট ----------
  const REL = 0.55; // অন্য গাড়ি রাস্তার তুলনায় কত ধীরে চলে
  let p, cars, coins, trees, parts, offset, speed, time, dist, coinCount, spawnT, coinT, treeT, shake;

  function init() {
    p = { x: laneX(1), target: 1, tilt: 0 };
    cars = []; coins = []; trees = []; parts = [];
    offset = 0; speed = 4.2; time = 0; dist = 0; coinCount = 0;
    spawnT = 40; coinT = 70; treeT = 0; shake = 0;
    for (let y = -20; y < H + 40; y += 46) addTree(y);
  }

  function addTree(y) {
    const left = Math.random() < 0.5;
    const x = left ? rand(10, ROAD_X - 18) : rand(ROAD_X + ROAD_W + 18, W - 10);
    trees.push({ x, y, r: rand(8, 15), c: pick(TREE_COLORS), bloom: Math.random() < 0.18 });
  }

  function spawnCar() {
    const lane = Math.floor(rand(0, LANES));
    const truck = Math.random() < 0.2;
    const h = truck ? 78 : CAR_H;
    const y = -h;
    // একই লেনে কাছাকাছি গাড়ি থাকলে নয়
    if (cars.some((c) => c.lane === lane && c.y < h + 110)) return false;
    // তিন লেন একসাথে বন্ধ করা যাবে না — অন্তত একটা লেন ফাঁকা থাকবে
    const blockedLanes = new Set([lane]);
    for (const c of cars) if (Math.abs(c.y - y) < 175) blockedLanes.add(c.lane);
    if (blockedLanes.size >= LANES) return false;
    cars.push({ lane, x: laneX(lane), y, h, w: truck ? 36 : CAR_W, truck, color: pick(CAR_COLORS) });
    return true;
  }

  function spawnCoin() {
    const lane = Math.floor(rand(0, LANES));
    if (cars.some((c) => c.lane === lane && c.y < 140)) return false;
    coins.push({ lane, x: laneX(lane), y: -20, ph: rand(0, 6.28) });
    return true;
  }

  function burst(x, y, colors, n, sp) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2), s = rand(0.6, sp);
      parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rand(18, 34), max: 34, color: pick(colors) });
    }
  }

  // ---------- AI ----------
  function overlapsWindow(c, look) {
    return c.y + c.h / 2 > PY - CAR_H / 2 - look && c.y - c.h / 2 < PY + CAR_H / 2 + 24;
  }

  function decideLane() {
    const cur = Math.max(0, Math.min(LANES - 1, Math.round((p.x - laneX(0)) / LANE_W)));
    const look = 150 + speed * 9;

    // প্রতিটা লেনের বিপদ (সবচেয়ে কাছের বাধার দূরত্ব)
    const danger = [Infinity, Infinity, Infinity];
    for (const c of cars) {
      if (overlapsWindow(c, look)) {
        const gap = PY - (c.y + c.h / 2);
        danger[c.lane] = Math.min(danger[c.lane], gap);
      }
    }
    const blocked = (l) => danger[l] !== Infinity;

    let best = cur;
    if (blocked(cur)) {
      const options = [cur - 1, cur + 1].filter((l) => l >= 0 && l < LANES && !blocked(l));
      if (options.length) {
        best = options.reduce((a, b) => (Math.abs(a - 1) <= Math.abs(b - 1) ? a : b));
      } else {
        // কোনো লেনই খালি নয় — যেটার বাধা সবচেয়ে দূরে সেটা বেছে নাও
        let far = -Infinity;
        for (const l of [cur - 1, cur, cur + 1]) {
          if (l < 0 || l >= LANES) continue;
          if (danger[l] > far) { far = danger[l]; best = l; }
        }
      }
    } else {
      // নিরাপদ থাকলে কাছের কয়েনের লেনে যাও
      let bestCoin = null;
      for (const k of coins) {
        if (k.y > PY - 190 && k.y < PY - 25 && Math.abs(k.lane - cur) <= 1 && !blocked(k.lane)) {
          if (!bestCoin || k.y > bestCoin.y) bestCoin = k;
        }
      }
      if (bestCoin) best = bestCoin.lane;
    }
    p.target = best;
  }

  // ---------- আপডেট ----------
  function update(dt) {
    time += dt;
    speed = 4.2 + Math.min(3.2, time / 1500);
    offset = (offset + speed * dt) % 1000;
    dist += speed * dt * 0.0001;

    decideLane();
    const tx = laneX(p.target);
    const step = 5.2 * dt;
    const dx = tx - p.x;
    p.x += Math.max(-step, Math.min(step, dx));
    p.tilt += (Math.max(-1, Math.min(1, dx / LANE_W)) * 0.22 - p.tilt) * 0.2 * dt;

    spawnT -= dt; coinT -= dt; treeT -= dt;
    if (spawnT <= 0) { if (spawnCar()) spawnT = Math.max(28, 80 - time / 60) + rand(0, 26); else spawnT = 8; }
    if (coinT <= 0) { if (spawnCoin()) coinT = rand(26, 60); else coinT = 8; }
    if (treeT <= 0) { addTree(-20); treeT = rand(10, 24) / (speed / 4.2); }

    for (const c of cars) c.y += speed * REL * dt;
    for (const k of coins) { k.y += speed * REL * dt; k.ph += 0.15 * dt; }
    for (const t of trees) t.y += speed * dt;

    // কয়েন কুড়ানো
    for (const k of coins) {
      if (!k.got && Math.abs(k.x - p.x) < 20 && Math.abs(k.y - PY) < 30) {
        k.got = true;
        coinCount++;
        burst(k.x, k.y, ["#fde047", "#fbbf24", "#fff"], 10, 2.6);
      }
    }

    // ধাক্কা (AI-র কারণে প্রায় হয় না — হলেও খেলা চলতেই থাকে)
    for (const c of cars) {
      if (!c.hit && Math.abs(c.x - p.x) < (CAR_W + c.w) / 2 - 4 && Math.abs(c.y - PY) < (CAR_H + c.h) / 2 - 4) {
        c.hit = true;
        burst(c.x, c.y, ["#fb923c", "#f87171", "#fde047"], 22, 3.4);
        shake = 12;
        time = Math.max(0, time - 300);
      }
    }

    cars = cars.filter((c) => !c.hit && c.y < H + 100);
    coins = coins.filter((k) => !k.got && k.y < H + 30);
    trees = trees.filter((t) => t.y < H + 30);

    for (const q of parts) { q.x += q.vx * dt; q.y += q.vy * dt; q.life -= dt; }
    parts = parts.filter((q) => q.life > 0);
    if (shake > 0) shake -= dt;
  }

  // ---------- আঁকা ----------
  function drawCar(x, y, w, h, color, opts) {
    opts = opts || {};
    ctx.save();
    ctx.translate(x, y);
    if (opts.tilt) ctx.rotate(opts.tilt);

    // ছায়া
    ctx.fillStyle = "rgba(0,0,0,.28)";
    rr(-w / 2 + 3, -h / 2 + 5, w, h, 8); ctx.fill();

    if (opts.truck) {
      // ট্রাক: ট্রেলার + কেবিন
      ctx.fillStyle = "#e5e7eb";
      rr(-w / 2, -h / 2 + 22, w, h - 22, 5); ctx.fill();
      ctx.fillStyle = "rgba(0,0,0,.08)";
      for (let i = 0; i < 4; i++) ctx.fillRect(-w / 2 + 3, -h / 2 + 28 + i * 12, w - 6, 2);
      ctx.fillStyle = color;
      rr(-w / 2, -h / 2, w, 26, 7); ctx.fill();
      ctx.fillStyle = "#0f172a";
      rr(-w / 2 + 4, -h / 2 + 5, w - 8, 9, 3); ctx.fill();
    } else {
      // সাধারণ গাড়ি
      const g = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
      g.addColorStop(0, color); g.addColorStop(0.5, "#ffffffaa"); g.addColorStop(1, color);
      ctx.fillStyle = color;
      rr(-w / 2, -h / 2, w, h, 9); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.22)";
      rr(-w / 2 + 3, -h / 2 + 3, 6, h - 6, 3); ctx.fill();
      // সামনের কাচ
      ctx.fillStyle = "#0f172a";
      rr(-w / 2 + 4, -h / 2 + 11, w - 8, 12, 4); ctx.fill();
      // ছাদ
      ctx.fillStyle = "rgba(0,0,0,.18)";
      rr(-w / 2 + 5, -h / 2 + 23, w - 10, 14, 3); ctx.fill();
      // পেছনের কাচ
      ctx.fillStyle = "#0f172a";
      rr(-w / 2 + 5, h / 2 - 15, w - 10, 8, 3); ctx.fill();
      // রেসিং স্ট্রাইপ (শুধু খেলোয়াড়)
      if (opts.player) {
        ctx.fillStyle = "rgba(255,255,255,.85)";
        ctx.fillRect(-2, -h / 2 + 2, 4, h - 4);
      }
    }

    // হেডলাইট ও ব্রেকলাইট
    ctx.fillStyle = "#fef08a";
    ctx.fillRect(-w / 2 + 3, -h / 2 - 1, 6, 3);
    ctx.fillRect(w / 2 - 9, -h / 2 - 1, 6, 3);
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(-w / 2 + 3, h / 2 - 2, 6, 3);
    ctx.fillRect(w / 2 - 9, h / 2 - 2, 6, 3);

    ctx.restore();
  }

  function drawTree(t) {
    ctx.fillStyle = "rgba(0,0,0,.25)";
    ctx.beginPath(); ctx.arc(t.x + 3, t.y + 4, t.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = t.c;
    ctx.beginPath(); ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.2)";
    ctx.beginPath(); ctx.arc(t.x - t.r * 0.3, t.y - t.r * 0.3, t.r * 0.5, 0, Math.PI * 2); ctx.fill();
    if (t.bloom) {
      ctx.fillStyle = "#f9a8d4";
      for (let i = 0; i < 5; i++) {
        const a = i * 1.26;
        ctx.beginPath(); ctx.arc(t.x + Math.cos(a) * t.r * 0.5, t.y + Math.sin(a) * t.r * 0.5, 2.2, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  function draw() {
    ctx.save();
    if (shake > 0) ctx.translate(rand(-2, 2), rand(-2, 2));

    // ঘাস (স্ক্রল হওয়া ডোরা)
    ctx.fillStyle = "#2f9e44"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#37b24d";
    const band = 50, o = offset % (band * 2);
    for (let y = -band * 2 + o; y < H; y += band * 2) ctx.fillRect(0, y, W, band);

    // রাস্তা
    ctx.fillStyle = "#2a3347"; ctx.fillRect(ROAD_X, 0, ROAD_W, H);
    ctx.fillStyle = "rgba(255,255,255,.035)";
    for (let y = -80 + (offset * 0.7) % 80; y < H; y += 80) ctx.fillRect(ROAD_X, y, ROAD_W, 40);

    // কার্ব (লাল-সাদা)
    const cb = 18, co = offset % (cb * 2);
    for (let y = -cb * 2 + co, i = 0; y < H; y += cb, i++) {
      ctx.fillStyle = i % 2 ? "#f8fafc" : "#ef4444";
      ctx.fillRect(ROAD_X - 6, y, 6, cb);
      ctx.fillRect(ROAD_X + ROAD_W, y, 6, cb);
    }

    // লেনের ড্যাশ
    ctx.fillStyle = "rgba(255,255,255,.75)";
    const dl = 24, dg = 22, dOff = offset % (dl + dg);
    for (let l = 1; l < LANES; l++) {
      for (let y = -dl - dg + dOff; y < H; y += dl + dg) ctx.fillRect(ROAD_X + l * LANE_W - 1.5, y, 3, dl);
    }

    trees.forEach(drawTree);

    // কয়েন
    for (const k of coins) {
      const sx = Math.abs(Math.cos(k.ph));
      ctx.save();
      ctx.translate(k.x, k.y);
      ctx.shadowColor = "#fbbf24"; ctx.shadowBlur = 10;
      ctx.fillStyle = "#fbbf24";
      ctx.beginPath(); ctx.ellipse(0, 0, 9 * Math.max(sx, 0.2), 9, 0, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#fde68a";
      ctx.beginPath(); ctx.ellipse(0, 0, 5 * Math.max(sx, 0.2), 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    // হেডলাইটের আলো
    const beam = ctx.createLinearGradient(0, PY - CAR_H / 2, 0, PY - CAR_H / 2 - 120);
    beam.addColorStop(0, "rgba(254,240,138,.28)"); beam.addColorStop(1, "rgba(254,240,138,0)");
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(p.x - 12, PY - CAR_H / 2);
    ctx.lineTo(p.x - 34, PY - CAR_H / 2 - 120);
    ctx.lineTo(p.x + 34, PY - CAR_H / 2 - 120);
    ctx.lineTo(p.x + 12, PY - CAR_H / 2);
    ctx.fill();

    cars.forEach((c) => drawCar(c.x, c.y, c.w, c.h, c.color, { truck: c.truck }));
    drawCar(p.x, PY, CAR_W, CAR_H, "#2f6bff", { player: true, tilt: p.tilt });

    // স্পিড লাইন
    if (speed > 5) {
      ctx.strokeStyle = "rgba(255,255,255,.18)"; ctx.lineWidth = 1.5;
      for (let i = 0; i < 6; i++) {
        const x = ROAD_X + ((i * 53 + offset * 3) % ROAD_W);
        const y = (i * 97 + offset * 5) % H;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 16); ctx.stroke();
      }
    }

    for (const q of parts) {
      ctx.globalAlpha = Math.max(0, q.life / q.max);
      ctx.fillStyle = q.color;
      ctx.fillRect(q.x, q.y, 3, 3);
    }
    ctx.globalAlpha = 1;

    // হালকা ভিনিয়েট
    const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.75);
    v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,.28)");
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);

    ctx.restore();
  }

  // ---------- স্ট্যাটস (DOM) ----------
  const elCoins = document.getElementById("stCoins");
  const elDist = document.getElementById("stDist");
  const elSpeed = document.getElementById("stSpeed");
  let statT = 0;
  function updateStats(dt) {
    statT -= dt;
    if (statT > 0) return;
    statT = 8;
    if (elCoins) elCoins.textContent = coinCount;
    if (elDist) elDist.textContent = dist.toFixed(2);
    if (elSpeed) elSpeed.textContent = Math.round(speed * 28);
  }

  // ---------- লুপ (স্ক্রিনে না থাকলে থামে) ----------
  let running = false, visible = true, last = 0;
  function loop(t) {
    if (!running) return;
    const dt = Math.min((t - last) / 16.667, 2.5);
    last = t;
    update(dt);
    draw();
    updateStats(dt);
    requestAnimationFrame(loop);
  }
  function start() {
    if (running || !visible || document.hidden) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(loop);
  }
  function stop() { running = false; }

  new IntersectionObserver((en) => {
    visible = en[0].isIntersecting;
    visible ? start() : stop();
  }, { threshold: 0.1 }).observe(canvas);
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));

  init();
  draw();
  start();
})();