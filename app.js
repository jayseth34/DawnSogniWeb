/* Dawn Sogni — shop, bag, ordering, music */
(() => {
  const D = window.DS;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const rs = n => "Rs. " + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const rs0 = n => "Rs. " + Number(n).toLocaleString("en-IN");
  const FIT = window.DS_FITS || { regular: "Regular", oversized: "Oversized" };
  const CATS = window.DS_CATS || { tees: { name: "Tees", one: "Tee" } };
  const catOf = p => (CATS[p.category] ? p.category : "tees"); // no category = tee (all older products)
  // making time: the product's own value, else its type's (shirts: 7–8 days, embroidered to order)
  const leadOf = p => p.leadTime || CATS[catOf(p)].lead || "";
  const leadNote = p => CATS[catOf(p)].leadNote || "Made to order";
  // sold out: the whole product (soldOut) or single sizes (soldOutSizes), both set in the admin
  const sizeOut = (p, s) => !!p.soldOut || (p.soldOutSizes || []).includes(s);
  // "New" tag: shown until the product's newUntil date (set in the admin, 3 weeks by default)
  const today = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; })();
  const isNew = p => !!p.newUntil && p.newUntil >= today;
  const isOut = p => !!p.soldOut || (p.sizes.length > 0 && p.sizes.every(s => sizeOut(p, s)));
  const byId = Object.fromEntries(D.products.map(p => [p.id, p]));
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  /* ---------- loader: brief, gone once the page has painted (never waits for the tee images) ---------- */
  const loader = $("#loader"), t0 = performance.now();
  // motion: one opening moment for the hero, the rest only answers what the visitor does
  if (!reduce) {
    document.documentElement.classList.add("anim");
    const line = $(".hero-line");
    if (line) line.innerHTML = line.textContent.trim().split(/\s+/).map((w, i) => `<span class="w" style="--i:${i}"><i>${esc(w)}</i></span>`).join(" ");
  }
  document.body.classList.add("loading");
  const hideLoader = () => {
    const wait = Math.max(0, 300 - (performance.now() - t0));
    setTimeout(() => { loader.classList.add("done"); document.body.classList.remove("loading"); document.documentElement.classList.add("is-ready"); setTimeout(() => loader.remove(), 700); }, wait);
  };
  let loaderGone = false; const hideOnce = () => { if (!loaderGone) { loaderGone = true; hideLoader(); } };
  if (document.readyState === "complete") hideOnce(); else addEventListener("load", hideOnce, { once: true });
  setTimeout(hideOnce, Math.max(0, 1200 - performance.now())); // counted from when the page was opened
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };

  /* ---------- background: ravens, ruins and a full moon in fog. The picture is a fixed CSS layer (no repainting);
     the canvas above it only draws drifting mist, and pauses while the page is scrolling ---------- */
  const cv = $("#stars"), cx = cv.getContext("2d");
  let W = 0, H = 0, mist = [], motes = [], nextBat = 3000, scrolling = false, scrollT;
  function mistSprite(a) { // one pre-rendered fog blob (a soft circle, stretched when drawn), reused every frame
    const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d");
    const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, `rgba(190,198,220,${a})`); r.addColorStop(0.6, `rgba(190,198,220,${a * 0.45})`); r.addColorStop(1, "rgba(190,198,220,0)");
    g.fillStyle = r; g.fillRect(0, 0, 128, 128); return c;
  }
  function buildSky() {
    const dpr = Math.min(devicePixelRatio || 1, 1.25); W = innerWidth; H = innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    mist = Array.from({ length: 5 }, (_, i) => ({ x: rnd() * W, y: H * (0.55 + rnd() * 0.45), w: W * (0.7 + rnd() * 0.8), h: H * (0.12 + rnd() * 0.18), img: mistSprite(0.05 + rnd() * 0.05), v: (rnd() * 0.5 + 0.3) * (i % 2 ? 1 : -1) * 6 }));
    motes = []; nextBat = performance.now() + 3000;
  }
  let lastT = 0;
  function paintSky(t) {
    const dt = Math.min(0.1, (t - lastT) / 1000 || 0); lastT = t;
    cx.clearRect(0, 0, W, H);
    for (const m of mist) {
      const span = W + m.w, x = (((m.x + (t / 1000) * m.v) % span) + span) % span - m.w / 2;
      cx.drawImage(m.img, x - m.w / 2, m.y - m.h / 2, m.w, m.h);
    }
    if (false) { // flying birds removed
      const dir = Math.random() < 0.5 ? 1 : -1;
      motes.push({ x: dir > 0 ? -60 : W + 60, y: H * (0.08 + Math.random() * 0.35), vx: dir * (W / (9 + Math.random() * 5)), wob: Math.random() * 6.28, s: 0.7 + Math.random() * 0.6 });
      nextBat = t + 6000 + Math.random() * 9000;
    }
    motes = motes.filter(m => m.x > -80 && m.x < W + 80);
    cx.fillStyle = "#030404";
    for (const m of motes) {
      m.x += m.vx * dt; const y = m.y + Math.sin(t / 700 + m.wob) * 14, up = Math.sin(t / 85 + m.wob) * 16;
      cx.save(); cx.translate(m.x, y); cx.scale(m.s * (m.vx > 0 ? 1 : -1), m.s); cx.globalAlpha = 0.85;
      for (const k of [1, -1]) { cx.beginPath(); cx.moveTo(4 * k, -1); cx.quadraticCurveTo(16 * k, -6 - up * 0.6, 34 * k, -up); cx.quadraticCurveTo(20 * k, -up * 0.2, 4 * k, 3); cx.closePath(); cx.fill(); }
      cx.beginPath(); cx.ellipse(0, 1, 9, 3.2, 0, 0, 6.283); cx.fill();
      cx.beginPath(); cx.moveTo(-8, 0); cx.lineTo(-17, -3); cx.lineTo(-16, 4); cx.closePath(); cx.fill();
      cx.beginPath(); cx.arc(9, -1, 2.8, 0, 6.283); cx.fill(); cx.beginPath(); cx.moveTo(11, -1.5); cx.lineTo(16, 0); cx.lineTo(11, 1); cx.fill();
      cx.restore();
    }
    cx.globalAlpha = 1;
  }
  let raf = 0, last = 0;
  const loop = t => { raf = requestAnimationFrame(loop); if (scrolling || t - last < 50) return; last = t; paintSky(t); };
  addEventListener("scroll", () => { scrolling = true; clearTimeout(scrollT); scrollT = setTimeout(() => (scrolling = false), 160); }, { passive: true });
  function startSky() { buildSky(); cancelAnimationFrame(raf); if (reduce) paintSky(0); else raf = requestAnimationFrame(loop); }
  startSky();
  let rz; addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(startSky, 150); });
  document.addEventListener("visibilitychange", () => { if (document.hidden) cancelAnimationFrame(raf); else if (!reduce) raf = requestAnimationFrame(loop); });

  /* ---------- WhatsApp + links ---------- */
  const wa = t => `https://wa.me/${D.whatsapp}?text=${encodeURIComponent(t)}`;
  // order number: DS-<day><month>-<4 letters>, e.g. DS-2010-K7QP. Easy to read out, no 0/O or 1/I mix-ups.
  const orderNo = () => { const d = new Date(), A = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; let r = ""; for (let i = 0; i < 4; i++) r += A[Math.floor(Math.random() * A.length)]; return `DS-${String(d.getDate()).padStart(2, "0")}${String(d.getMonth() + 1).padStart(2, "0")}-${r}`; };
  const productLink = id => (window.location.origin + window.location.pathname).replace(/index\.html$/, "") + "p/" + String(id).toLowerCase().replace(/[^a-z0-9]+/g, "-") + ".html";
  const WA_TEXT = {
    general: "Hi Dawn Sogni! I'd like to know more about your designs.",
    custom: "Hi Dawn Sogni! I have my own design I'd like printed or embroidered. I'll attach the file here.\n\nGarment (tee / polo / embroidered shirt / print only):\nSize:\nPrint size on the garment:"
  };
  $$("[data-wa]").forEach(a => (a.href = wa(WA_TEXT[a.dataset.wa])));
  const ig = `https://instagram.com/${D.instagram}`;
  $("#ig-link").href = ig; $("#ig-drawer").href = ig;
  $("#year").textContent = "© " + new Date().getFullYear();

  /* ---------- full-screen menu ---------- */
  const menu = $("#menu"), menuBtn = $("#menu-btn");
  function setMenu(open) {
    menuBtn.setAttribute("aria-expanded", open);
    if (open) { menu.hidden = false; requestAnimationFrame(() => menu.classList.add("is-open")); document.body.style.overflow = "hidden"; $("#menu-close").focus(); }
    else { menu.classList.remove("is-open"); document.body.style.overflow = ""; setTimeout(() => { if (!menu.classList.contains("is-open")) menu.hidden = true; }, reduce ? 0 : 350); menuBtn.focus({ preventScroll: true }); }
  }
  menuBtn.addEventListener("click", () => setMenu(true));
  $("#menu-close").addEventListener("click", () => setMenu(false));
  menu.addEventListener("click", e => {
    const a = e.target.closest("a"); if (!a) return;
    if (a.hasAttribute("data-open-bag")) { e.preventDefault(); setMenu(false); openBag(); return; }
    if (a.getAttribute("href").startsWith("#")) setMenu(false);
  });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !menu.hidden) setMenu(false); });

  /* ---------- shop ---------- */
  // which image is front / back, and which one the card shows
  const sides = p => {
    if (p.front || p.back) { const cover = p.cover && p[p.cover] ? p.cover : (p.back ? "back" : "front"); return { front: p.front, back: p.back, cover }; }
    const cover = p.print === "front" ? "front" : "back", o = cover === "front" ? "back" : "front";
    return { [cover]: p.tee, [o]: p.teeFront, cover };
  };
  const thumb = src => String(src || "").replace(/^images\/(?!thumb\/)/, "images/thumb/");
  const basePrice = p => p.prices.regular ?? Math.min(...Object.values(p.prices));
  const firstFit = p => (p.prices.regular != null ? "regular" : Object.keys(p.prices)[0]);
  // tabs: one per product type once there's more than one type, otherwise the front/back print tabs as before
  const usedCats = Object.keys(CATS).filter(c => D.products.some(p => catOf(p) === c));
  const FILTERS = [{ id: "all", name: "All", test: () => true }].concat(usedCats.length > 1
    ? usedCats.map(c => ({ id: c, name: CATS[c].name, test: p => catOf(p) === c }))
    : [{ id: "back", name: "Back print", test: p => p.print === "back" }, { id: "front", name: "Front print", test: p => p.print === "front" }]
  ).filter(f => f.id === "all" || D.products.some(f.test));
  const pills = $("#pills"), grid = $("#grid");
  if (D.products.length < 3) { pills.hidden = true; grid.classList.add("few"); }
  pills.innerHTML = FILTERS.map((f, i) => `<button class="pill" role="tab" type="button" data-f="${f.id}" aria-selected="${i === 0}">${f.name}</button>`).join("");
  // Card hover: swap to the other side if a front image exists, otherwise zoom into the print.
  // Cards appear one after another as their image arrives. Until then each card shows a small spinning DS.
  function card(p, i) {
    const sd = sides(p), cov = sd[sd.cover], alt = sd[sd.cover === "front" ? "back" : "front"], swap = !!alt;
    return `
      <button class="card ${swap ? "swap" : "zoom"} is-loading${isOut(p) ? " is-soldout" : ""}" type="button" data-id="${esc(p.id)}" data-i="${i}" style="--focus:${esc(p.printFocus || "50% 45%")}" aria-label="${esc(p.name)}, ${isOut(p) ? "sold out" : rs(basePrice(p))}. View details">
        <span class="card-img">${isOut(p) ? `<span class="card-badge">Sold out</span>` : isNew(p) ? `<span class="card-badge is-new">New</span>` : ""}
          <span class="card-loader" aria-hidden="true"><img src="images/logo-mark.webp" alt=""></span>
          <img class="main" data-src="${esc(thumb(cov))}" data-full="${esc(cov)}" alt="" width="560" height="560" decoding="async">
          ${swap ? `<img class="alt" data-src="${esc(thumb(alt))}" data-full="${esc(alt)}" alt="" width="560" height="560" decoding="async">` : ""}
        </span>
        <span class="card-name">${esc(p.name)}</span>
        <span class="card-price">${rs(basePrice(p))}</span>
        ${isOut(p) ? `<span class="card-lead">Sold out</span>` : leadOf(p) ? `<span class="card-lead">Ready in ${esc(leadOf(p))}</span>` : ""}
      </button>`;
  }
  let loadRun = 0;
  function loadImg(img) { // resolves when the image is downloaded and decoded (falls back to the full image if the small one is missing)
    return new Promise(res => {
      const done = () => (img.decode ? img.decode().catch(() => {}) : Promise.resolve()).then(res);
      img.addEventListener("load", done, { once: true });
      img.addEventListener("error", () => {
        if (img.src.indexOf("/thumb/") > -1) { img.addEventListener("load", done, { once: true }); img.addEventListener("error", res, { once: true }); img.src = img.dataset.full; }
        else res();
      }, { once: true });
      img.src = img.dataset.src;
    });
  }
  async function progressive(run) {
    const cards = $$(".card", grid), ready = new Array(cards.length).fill(false);
    let shown = 0;
    const reveal = () => { // keep the order: a card shows only after the ones before it
      while (shown < cards.length && ready[shown]) { cards[shown].classList.remove("is-loading"); cards[shown].classList.add("is-in"); shown++; }
    };
    let next = 0;
    const worker = async () => {
      while (next < cards.length && run === loadRun) {
        const k = next++; await loadImg($("img.main", cards[k]));
        if (run !== loadRun) return; ready[k] = true; reveal();
      }
    };
    await Promise.all(Array.from({ length: 6 }, worker)); // card pictures are ~25 KB, so six at a time
    if (run !== loadRun) return;
    cardsDone();
    // hover images come next, quietly
    await Promise.all($$("img.alt", grid).map(loadImg));
    if (run !== loadRun) return;
    imagesDone();
  }
  // things that must not compete with the card pictures wait for them
  let cardsReady, imagesReady;
  const cardsP = new Promise(r => (cardsReady = r)), imagesP = new Promise(r => (imagesReady = r));
  const cardsDone = () => cardsReady(), imagesDone = () => imagesReady();
  cardsP.then(hideOnce);
  function render(fid) {
    const f = FILTERS.find(x => x.id === fid) || FILTERS[0]; grid.innerHTML = D.products.filter(f.test).sort((a, b) => isOut(a) - isOut(b)).map(card).join(""); // sold out goes last
    progressive(++loadRun);
  }
  // warm the cache: hover images and full-size images load quietly after the page is ready,
  // and a product's full image starts loading the moment a finger or mouse touches its card
  // background downloads go one at a time, so a picture someone actually asks for never waits behind a queue
  const warm = new Set(), queue = []; let busy = false;
  const pump = () => {
    if (busy || !queue.length) return; busy = true;
    const im = new Image(); im.decoding = "async"; im.fetchPriority = "low";
    im.onload = im.onerror = () => { busy = false; pump(); }; im.src = queue.shift();
  };
  const prefetch = src => { if (!src || warm.has(src)) return; warm.add(src); queue.push(src); pump(); };
  const fetchNow = src => { if (!src) return; const i = queue.indexOf(src); if (i > -1) queue.splice(i, 1); if (warm.has(src) && i < 0) return; warm.add(src); const im = new Image(); im.fetchPriority = "high"; im.src = src; };
  const idle = window.requestIdleCallback || (fn => setTimeout(fn, 600));
  // big product pictures: first the ones on screen, after all card pictures are in
  imagesP.then(() => idle(() => {
    D.products.forEach(p => { const sd = sides(p); prefetch(sd[sd.cover]); });
    D.products.forEach(p => { const sd = sides(p); prefetch(sd.front); prefetch(sd.back); });
  }));
  grid.addEventListener("pointerover", e => { const c = e.target.closest(".card"); if (!c) return; const sd = sides(byId[c.dataset.id]); fetchNow(sd[sd.cover]); });
  grid.addEventListener("touchstart", e => { const c = e.target.closest(".card"); if (!c) return; const sd = sides(byId[c.dataset.id]); fetchNow(sd[sd.cover]); }, { passive: true });
  pills.addEventListener("click", e => {
    const b = e.target.closest(".pill"); if (!b) return;
    $$(".pill", pills).forEach(x => x.setAttribute("aria-selected", x === b));
    render(b.dataset.f);
  });
  render("all");

  /* ---------- size charts ---------- */
  // chart keys: "regular" / "oversized" are the tee charts; other types use "<type>" or "<type>-<fit>"
  const chartKey = (p, fit) => { const c = catOf(p), S = D.sizeCharts || {}; return [`${c}-${fit}`, c, c === "tees" ? fit : null].find(k => k && S[k]); };
  const chartTable = key => {
    const c = key && D.sizeCharts?.[key]; if (!c) return "";
    return `<table class="size-table"><caption>${esc(c.title)}</caption>
      <thead><tr><th scope="col">Size</th>${c.columns.map(x => `<th scope="col">${esc(x)}</th>`).join("")}</tr></thead>
      <tbody>${c.rows.map(r => `<tr><th scope="row">${esc(r[0])}</th>${r.slice(1).map(v => `<td>${esc(v)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
  };
  // show tee charts and the charts of every type that has products
  const chartCat = k => (CATS[k] ? k : CATS[k.split("-")[0]] ? k.split("-")[0] : "tees");
  const chartSold = k => { const c = chartCat(k); if (c === "tees") return true; const fit = CATS[k] ? null : k.split("-").slice(1).join("-");
    return D.products.some(p => catOf(p) === c && (!fit || p.prices[fit] != null)); };
  /* ---------- size guide: pick a size, see where each measurement is taken on the garment ---------- */
  const chartFit = k => (k === "regular" || k === "oversized" ? k : CATS[k] ? "" : k.split("-").slice(1).join("-"));
  const keys = Object.keys(D.sizeCharts || {}).filter(chartSold)
    .sort((a, b) => Object.keys(CATS).indexOf(chartCat(a)) - Object.keys(CATS).indexOf(chartCat(b)));
  const szCats = [...new Set(keys.map(chartCat))];
  const sz = $("#size-tables");
  // garment outlines (viewBox 0 0 400 440) and where each kind of measurement sits on them
  const GARMENTS = {
    top: { body: "M150 30Q200 60 250 30L330 58L392 142L338 170L318 146L318 410L82 410L82 146L62 170L8 142L70 58Z",
      extra: "M150 30Q200 60 250 30",
      lines: { shoulder: [[70, 44], [330, 44], "up"], chest: [[84, 186], [316, 186], "up"], length: [[294, 62], [294, 408], "side"], sleeve: [[344, 64], [398, 136], "side"] } },
    shirt: { body: "M150 28L200 74L250 28L322 52L384 330L344 342L300 160L300 410L100 410L100 160L56 342L16 330L78 52Z",
      extra: "M150 28L176 70L200 74L224 70L250 28M200 74L200 410M207 120a3 3 0 1 0 .1 0M207 180a3 3 0 1 0 .1 0M207 240a3 3 0 1 0 .1 0M207 300a3 3 0 1 0 .1 0M207 360a3 3 0 1 0 .1 0",
      lines: { shoulder: [[78, 18], [322, 18], "up"], chest: [[102, 196], [298, 196], "up"], length: [[280, 82], [280, 408], "side"], sleeve: [[338, 70], [394, 326], "side"], collar: [[200, 74], [200, 74], "dot"] } },
    bottom: { body: "M110 20L290 20L300 62L332 410L234 410L203 160L197 160L166 410L68 410L100 62Z",
      extra: "M108 34L292 34",
      lines: { waist: [[110, 14], [290, 14], "up"], hip: [[101, 92], [299, 92], "up"], thigh: [[94, 200], [196, 200], "up"], opening: [[70, 396], [164, 396], "up"], inseam: [[208, 168], [238, 404], "side"], length: [[352, 20], [352, 410], "side"] } }
  };
  const garmentOf = c => (c === "shirts" ? "shirt" : c === "trousers" || c === "trackpants" ? "bottom" : "top");
  // read a chart column: which line it belongs to, or whether it's the wearer's own measurement
  const colInfo = name => {
    const n = name.toLowerCase(), unit = /\(cm\)/.test(n) ? " cm" : "″";
    const body = /your|fits/.test(n);
    const kind = ["shoulder", "sleeve", "collar", "inseam", "thigh", "opening", "hip", "waist", "length", "chest"].find(k => n.includes(k));
    return { name: name.replace(/\s*\((in|cm)\)\s*/i, "").replace(/,/g, ""), unit, body, kind };
  };
  const num = v => { const m = String(v).match(/[\d.]+/); return m ? parseFloat(m[0]) : null; };
  sz.innerHTML = `
    <div class="sg-pick">
      <div class="sz-types pills" role="tablist" aria-label="Product type" ${szCats.length < 2 ? "hidden" : ""}>${szCats.map(c => `<button class="pill" type="button" role="tab" data-c="${c}">${esc(CATS[c].name)}</button>`).join("")}</div>
      <div class="sz-fits" role="tablist" aria-label="Fit"></div>
    </div>
    <div class="sg">
      <figure class="sg-fig"><svg viewBox="-24 -16 448 452" aria-hidden="true"><path class="sg-body"/><path class="sg-extra"/><g class="sg-lines"></g></svg></figure>
      <div class="sg-panel">
        <div class="sg-sizes" role="radiogroup" aria-label="Size"></div>
        <p class="sg-fitline" aria-live="polite"></p>
        <dl class="sg-list"></dl>
        <div class="sz-find"><label><span class="sz-find-l">Your chest (in)</span><input type="number" inputmode="decimal" min="20" max="60" step="0.5" placeholder="e.g. 39"></label><p class="sz-find-r" aria-live="polite"></p></div>
      </div>
    </div>
    <details class="sg-all"><summary>See all sizes</summary><div class="sg-table"></div></details>`;
  const svg = $(".sg-fig svg", sz), linesG = $(".sg-lines", sz);
  let szKey = keys[0], szRow = 0, shown = {};
  function drawGarment(k, animate) {
    const c = chartCat(k), G = GARMENTS[garmentOf(c)], cols = D.sizeCharts[k].columns.map(colInfo);
    $(".sg-body", sz).setAttribute("d", G.body); $(".sg-extra", sz).setAttribute("d", G.extra);
    linesG.innerHTML = cols.map((ci, j) => {
      if (ci.body || !ci.kind || !G.lines[ci.kind]) return "";
      const [[x1, y1], [x2, y2], pos] = G.lines[ci.kind];
      if (pos === "dot") return `<g data-j="${j}"><circle cx="${x1}" cy="${y1 - 4}" r="4.5"/><text x="${x1 + 12}" y="${y1 + 22}" text-anchor="start">0</text></g>`;
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, vert = Math.abs(x2 - x1) < Math.abs(y2 - y1);
      const tx = vert ? mx + 14 : mx, ty = vert ? my : my - 10, rot = vert ? `rotate(${(Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI) - 90} ${tx} ${ty})` : "";
      return `<g data-j="${j}"><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" pathLength="1"/><line class="tick" x1="${x1 - (vert ? 6 : 0)}" y1="${y1 - (vert ? 0 : 6)}" x2="${x1 + (vert ? 6 : 0)}" y2="${y1 + (vert ? 0 : 6)}"/><line class="tick" x1="${x2 - (vert ? 6 : 0)}" y1="${y2 - (vert ? 0 : 6)}" x2="${x2 + (vert ? 6 : 0)}" y2="${y2 + (vert ? 0 : 6)}"/><text x="${tx}" y="${ty}" text-anchor="middle" ${vert ? `dominant-baseline="middle" transform="${rot}"` : ""}>0</text></g>`;
    }).join("");
    if (animate && !reduce) {
      svg.querySelector(".sg-body").animate([{ opacity: 0, transform: "scale(.94)" }, { opacity: 1, transform: "none" }], { duration: 450, easing: "cubic-bezier(.2,.7,.2,1)" });
      $$("g[data-j] line:not(.tick)", linesG).forEach((l, i) => l.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 600, delay: 150 + i * 90, easing: "cubic-bezier(.2,.7,.2,1)", fill: "backwards" }));
    }
    shown = {};
  }
  // numbers count from the old size to the new one
  function setText(el, to, unit, key) {
    const from = shown[key], n = num(to), plain = n == null || /[–-]/.test(String(to));
    shown[key] = n;
    if (plain || from == null || reduce) { el.textContent = to + (n != null ? unit : ""); return; }
    const t0 = performance.now(), dec = String(to).includes(".") ? 1 : 0;
    const step = t => { const k = Math.min(1, (t - t0) / 380), v = from + (n - from) * (1 - Math.pow(1 - k, 3)); el.textContent = v.toFixed(dec) + unit; if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }
  function showRow(i) {
    const C = D.sizeCharts[szKey], row = C.rows[i]; if (!row) return; szRow = i;
    $$(".sg-sizes button", sz).forEach((b, j) => b.setAttribute("aria-checked", j === i));
    const cols = C.columns.map(colInfo);
    const bodyCol = cols.findIndex(c => c.body);
    $(".sg-fitline", sz).innerHTML = bodyCol > -1 ? `Fits ${esc(cols[bodyCol].name.replace(/^(your|fits)\s*/i, "").toLowerCase())} <b>${esc(row[bodyCol + 1] || "")}${cols[bodyCol].unit}</b>` : "";
    $(".sg-list", sz).innerHTML = cols.map((c, j) => c.body ? "" : `<div><dt>${esc(c.name)}</dt><dd data-j="${j}"></dd></div>`).join("");
    cols.forEach((c, j) => {
      if (c.body) return; const v = row[j + 1] || "–";
      const dd = $(`.sg-list dd[data-j="${j}"]`, sz); if (dd) setText(dd, v, c.unit, "l" + j);
      const t = $(`g[data-j="${j}"] text`, linesG); if (t) setText(t, v, c.unit, "g" + j);
    });
    if (!reduce) $$("g[data-j] text", linesG).forEach(t => t.animate([{ opacity: .3 }, { opacity: 1 }], { duration: 300 }));
  }
  function szSet(k) {
    szKey = k; const c = chartCat(k), C = D.sizeCharts[k];
    $$(".sz-types .pill", sz).forEach(b => b.setAttribute("aria-selected", b.dataset.c === c));
    const fits = keys.filter(x => chartCat(x) === c);
    $(".sz-fits", sz).innerHTML = fits.length > 1 ? fits.map(x => `<button type="button" role="tab" data-k="${esc(x)}" aria-selected="${x === k}">${esc(FIT[chartFit(x)] || "All fits")}</button>`).join("") : "";
    $(".sg-sizes", sz).innerHTML = C.rows.map((r, j) => `<button type="button" role="radio" data-i="${j}">${esc(r[0])}</button>`).join("");
    $(".sg-table", sz).innerHTML = chartTable(k);
    const first = (C.columns[0] || "").toLowerCase();
    $(".sz-find-l", sz).textContent = /waist/.test(first) ? "Your waist (in)" : "Your chest (in)";
    drawGarment(k, true);
    const mid = C.rows.findIndex(r => r[0] === "M" || r[0] === "32"); showRow(mid > -1 ? mid : Math.floor(C.rows.length / 2));
    szFind();
  }
  // "find my size": picks the size that matches a measurement
  function szFind() {
    const v = parseFloat($(".sz-find input", sz).value), out = $(".sz-find-r", sz);
    if (!(v > 0)) { out.textContent = ""; return; }
    const rows = D.sizeCharts[szKey].rows, nums = rows.map(r => String(r[1] || "").split(/[–-]/).map(parseFloat).filter(n => n > 0));
    let hit = nums.findIndex(n => n.length && v >= n[0] - .25 && v <= (n[1] ?? n[0]) + .25);
    if (hit < 0) hit = nums.findIndex(n => n.length && v <= (n[1] ?? n[0]));
    if (hit < 0) { out.textContent = "That's outside this chart. Message us and we'll help."; return; }
    out.textContent = `Go for ${rows[hit][0]}` + (chartFit(szKey) === "oversized" ? " (or a size down for a less baggy look)" : "");
    showRow(hit);
  }
  $(".sz-find input", sz).addEventListener("input", szFind);
  $(".sz-types", sz).addEventListener("click", e => { const b = e.target.closest("[data-c]"); if (b) szSet(keys.find(k => chartCat(k) === b.dataset.c)); });
  $(".sz-fits", sz).addEventListener("click", e => { const b = e.target.closest("[data-k]"); if (b) szSet(b.dataset.k); });
  $(".sg-sizes", sz).addEventListener("click", e => { const b = e.target.closest("[data-i]"); if (b) showRow(+b.dataset.i); });
  $(".sg-sizes", sz).addEventListener("keydown", e => { if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); const n = D.sizeCharts[szKey].rows.length; showRow((szRow + (e.key === "ArrowRight" ? 1 : n - 1)) % n); $$(".sg-sizes button", sz)[szRow].focus(); } });
  if (keys.length) szSet(keys[0]); else $("#sizes").hidden = true;

  /* ---------- toast ---------- */
  let toastT;
  const toast = msg => { const t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 1800); };

  /* ---------- bag ---------- */
  let bag = store.get("ds-bag", []).filter(i => byId[i.id] && byId[i.id].prices[i.fit] != null);
  const bagEl = $("#bag");
  const lineKey = i => `${i.id}|${i.fit}|${i.size}`;
  const lineOut = i => sizeOut(byId[i.id], i.size);
  const live = () => bag.filter(i => !lineOut(i));
  const bagCount = () => live().reduce((n, i) => n + i.qty, 0);
  const bagTotal = () => live().reduce((n, i) => n + byId[i.id].prices[i.fit] * i.qty, 0);
  function saveBag() { store.set("ds-bag", bag); renderBag(); }
  function bagMessage(no = orderNo()) {
    const lines = live().map((i, k) => {
      const p = byId[i.id], price = p.prices[i.fit];
      return `${k + 1}. *${p.name}* (${p.id})\n   ${CATS[catOf(p)].one}, ${FIT[i.fit] || i.fit}, size ${i.size}${p.colorName ? ", " + p.colorName : ""}\n   ${i.qty} × ${rs0(price)} = ${rs0(price * i.qty)}${leadOf(p) ? `\n   Ready in ${leadOf(p)} (${leadNote(p).toLowerCase()})` : ""}`;
    });
    return `Hi Dawn Sogni! I'd like to place this order.\nOrder no: *${no}*\n\n${lines.join("\n\n")}\n\n*Total: ${rs0(bagTotal())}* (${bagCount()} ${bagCount() === 1 ? "item" : "items"})`;
  }
  function renderBag() {
    const n = bagCount(), badge = $("#bag-count");
    badge.textContent = n; badge.hidden = n === 0;
    $("#bag-btn").setAttribute("aria-label", `Open bag, ${n} ${n === 1 ? "item" : "items"}`);
    const items = $("#bag-items");
    if (!bag.length) {
      items.innerHTML = `<div class="bag-empty"><p>Your bag is empty.</p><button class="btn" type="button" data-close-bag>Browse designs</button></div>`;
      $("#bag-foot").hidden = true; return;
    }
    $("#bag-foot").hidden = false;
    items.innerHTML = bag.map(i => {
      const p = byId[i.id], price = p.prices[i.fit];
      return `<div class="bag-item${lineOut(i) ? " is-out" : ""}" data-key="${esc(lineKey(i))}">
        ${(() => { const sd = sides(p), src = sd[sd.cover] || p.tee; return `<img src="${esc(thumb(src))}" alt="" onerror="this.onerror=null;this.src='${esc(src)}'">`; })()}
        <div><h3>${esc(p.name)}</h3><p>${Object.keys(p.prices).length > 1 ? (FIT[i.fit] || esc(i.fit)) + ", " : ""}${esc(i.size)}</p>
          <div class="qty"><button type="button" data-q="-1" aria-label="One less">−</button><span>${i.qty}</span><button type="button" data-q="1" aria-label="One more">+</button></div></div>
        <div class="bag-line"><span>${lineOut(i) ? "Sold out" : rs0(price * i.qty)}</span><button class="link-btn" type="button" data-remove>Remove</button></div>
      </div>`;
    }).join("");
    $("#bag-total").textContent = rs(bagTotal());
    const send = $("#bag-send"), ok = bagCount() > 0;
    send.href = ok ? wa(bagMessage()) : "#"; send.classList.toggle("is-disabled", !ok); send.setAttribute("aria-disabled", !ok);
    $("#bag-out").hidden = !bag.some(lineOut);
  }
  function addToBag(id, fit, size) {
    if (sizeOut(byId[id], size)) return;
    gtag("event", "add_to_cart", { currency: "INR", value: byId[id].prices[fit], items: [gaItem(byId[id], fit)] });
    const k = `${id}|${fit}|${size}`, ex = bag.find(i => lineKey(i) === k);
    if (ex) ex.qty = Math.min(ex.qty + 1, 20); else bag.push({ id, fit, size, qty: 1 });
    saveBag();
  }
  function openBag() { renderBag(); bagEl.showModal(); }
  $("#bag-btn").addEventListener("click", openBag);
  $("#bag-close").addEventListener("click", () => bagEl.close());
  bagEl.addEventListener("click", e => {
    if (e.target === bagEl || e.target.closest("[data-close-bag]")) { bagEl.close(); if (e.target.closest("[data-close-bag]")) $("#shop").scrollIntoView({ behavior: reduce ? "auto" : "smooth" }); return; }
    const row = e.target.closest(".bag-item"); if (!row) return;
    const it = bag.find(i => lineKey(i) === row.dataset.key); if (!it) return;
    const q = e.target.closest("[data-q]");
    if (q) { it.qty = Math.max(0, Math.min(20, it.qty + Number(q.dataset.q))); if (!it.qty) bag = bag.filter(i => i !== it); saveBag(); }
    if (e.target.closest("[data-remove]")) { bag = bag.filter(i => i !== it); saveBag(); }
  });
  $("#bag-send").addEventListener("click", e => { if (!bagCount()) e.preventDefault(); });
  $("#bag-clear").addEventListener("click", () => { bag = []; saveBag(); });
  renderBag();

  /* ---------- visitors ----------
     Public count: each browser is counted once (free Abacus counter, no account), shown in the footer.
     Detailed reports: Google Analytics, switched on by pasting the G- code in Admin → Settings. */
  const COUNTER = "https://abacus.jasoncameron.dev", NS = "dawnsogni-web";
  const ymd = () => { const d = new Date(); return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`; };
  (async () => {
    const box = $("#visitors"); if (!box) return;
    const store = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } };
    const isNew = !store("ds-visited"), day = ymd(), newToday = store("ds-day") !== day;
    try {
      const r = await fetch(`${COUNTER}/${isNew ? "hit" : "get"}/${NS}/visitors`, { cache: "no-store" });
      const j = await r.json(); if (!(j.value > 0)) return;
      if (isNew) store("ds-visited", "1");
      if (newToday) { store("ds-day", day); fetch(`${COUNTER}/hit/${NS}/day-${day}`).catch(() => {}); }
      const n = j.value, out = $("#visitors-n", box);
      if (n === 1) $("#visitors-t", box).textContent = "person has visited Dawn Sogni";
      box.hidden = false;
      // count up when the footer comes into view
      const run = () => {
        if (reduce) { out.textContent = n.toLocaleString("en-IN"); return; }
        const t0 = performance.now(), from = Math.max(0, Math.floor(n * .6));
        const step = t => { const k = Math.min(1, (t - t0) / 1400); out.textContent = Math.round(from + (n - from) * (1 - Math.pow(1 - k, 3))).toLocaleString("en-IN"); if (k < 1) requestAnimationFrame(step); };
        requestAnimationFrame(step);
      };
      out.textContent = n.toLocaleString("en-IN");
      const io = new IntersectionObserver(es => { if (es[0].isIntersecting) { io.disconnect(); run(); } }); io.observe(box);
    } catch (e) { /* counter unreachable: the line just stays hidden */ }
  })();
  // Google Analytics (only once a G- code is set in the admin)
  const GA = /^G-[A-Z0-9]{4,}$/.test(D.analytics || "") ? D.analytics : null;
  window.dataLayer = window.dataLayer || [];
  const gtag = function () { if (GA) window.dataLayer.push(arguments); };
  if (GA) {
    const g = document.createElement("script"); g.async = true; g.src = `https://www.googletagmanager.com/gtag/js?id=${GA}`; document.head.append(g);
    gtag("js", new Date()); gtag("config", GA);
  }
  const gaItem = (p, fit) => ({ item_id: p.id, item_name: p.name, item_category: CATS[catOf(p)].name, item_variant: fit, price: fit ? p.prices[fit] : basePrice(p) });

  /* ---------- extra motion: scroll zoom, tilt, star burst, logo wipe (all skipped with reduced motion) ---------- */
  // star burst: little four-point stars thrown out from a point
  const STAR = '<svg viewBox="-10 -10 20 20"><path d="M0-10C1 -3 3 -1 10 0C3 1 1 3 0 10C-1 3 -3 1 -10 0C-3 -1 -1 -3 0-10Z"/></svg>';
  function burst(x, y, n = 14) {
    if (reduce || !document.body.animate) return;
    for (let i = 0; i < n; i++) {
      const s = document.createElement("span"); s.className = "spark"; s.innerHTML = STAR;
      const size = 7 + Math.random() * 11; Object.assign(s.style, { left: x - size / 2 + "px", top: y - size / 2 + "px", width: size + "px", height: size + "px" });
      document.body.append(s);
      const ang = (i / n) * Math.PI * 2 + Math.random() * .5, dist = 46 + Math.random() * 70, spin = (Math.random() - .5) * 320;
      s.animate([
        { transform: "translate(0,0) scale(.2) rotate(0deg)", opacity: 1 },
        { transform: `translate(${Math.cos(ang) * dist * .7}px, ${Math.sin(ang) * dist * .7}px) scale(1) rotate(${spin * .6}deg)`, opacity: 1, offset: .45 },
        { transform: `translate(${Math.cos(ang) * dist}px, ${Math.sin(ang) * dist + 18}px) scale(0) rotate(${spin}deg)`, opacity: 0 }
      ], { duration: 650 + Math.random() * 350, easing: "cubic-bezier(.2,.7,.3,1)" }).finished.then(() => s.remove(), () => s.remove());
    }
  }
  const burstAt = el => { const r = el.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2); };
  $("#sheet-wa").addEventListener("click", e => {
    if (e.currentTarget.classList.contains("is-disabled")) return; burstAt(e.currentTarget);
    if (current && !sizeOut(current, sel.size)) gtag("event", "whatsapp_order", { currency: "INR", value: current.prices[sel.fit], items: [gaItem(current, sel.fit)] });
  });
  $("#bag-send").addEventListener("click", e => { if (!bagCount()) return; burstAt(e.currentTarget); gtag("event", "whatsapp_order", { currency: "INR", value: bagTotal(), items: live().map(i => ({ ...gaItem(byId[i.id], i.fit), quantity: i.qty })) }); });
  document.addEventListener("click", e => { if (e.target.closest('a[href*="/printcanvas"]')) gtag("event", "open_design_studio"); }, true);

  if (!reduce) {
    // scroll zoom: the hall leans in and darkens as you scroll down, and the DS mark comes through
    const hero = $(".hero");
    if (hero) {
      let ticking = false;
      const onScroll = () => { if (ticking) return; ticking = true; requestAnimationFrame(() => { ticking = false; const p = Math.min(1, Math.max(0, scrollY / (hero.offsetHeight * .8))); hero.style.setProperty("--p", p.toFixed(3)); }); };
      addEventListener("scroll", onScroll, { passive: true }); onScroll();
    }

    // 3D tilt. Computer: the tee leans toward the mouse and lifts, its shadow moving the other way.
    // Phones (no permission needed): tees tilt as they scroll through the screen, and lean toward a pressing finger.
    const tilt = (box, x, y, k) => { // x, y from -0.5 to 0.5
      box.style.setProperty("--ry", (x * k).toFixed(2) + "deg"); box.style.setProperty("--rx", (-y * k).toFixed(2) + "deg");
      box.style.setProperty("--sx", (-x * 22).toFixed(1) + "px"); box.style.setProperty("--sy", (14 - y * 16).toFixed(1) + "px");
    };
    const untilt = box => ["--rx", "--ry", "--sx", "--sy"].forEach(v => box.style.removeProperty(v));
    const fromEvent = (box, e) => { const r = box.getBoundingClientRect(); return [(e.clientX - r.left) / r.width - .5, (e.clientY - r.top) / r.height - .5]; };
    if (matchMedia("(hover: hover) and (pointer: fine)").matches) {
      grid.addEventListener("pointermove", e => { const c = e.target.closest(".card"); if (!c) return; const box = c.querySelector(".card-img"); tilt(box, ...fromEvent(box, e), 26); });
      grid.addEventListener("pointerout", e => { const c = e.target.closest(".card"); if (c && !c.contains(e.relatedTarget)) untilt(c.querySelector(".card-img")); });
    } else {
      const seen = new Set(), io = new IntersectionObserver(es => es.forEach(x => x.isIntersecting ? seen.add(x.target) : seen.delete(x.target)), { rootMargin: "60px 0px" });
      new MutationObserver(() => { seen.clear(); io.disconnect(); $$(".card-img", grid).forEach(b => io.observe(b)); }).observe(grid, { childList: true });
      $$(".card-img", grid).forEach(b => io.observe(b));
      let raf = 0;
      const wave = () => { raf = 0; const mid = innerHeight / 2; seen.forEach(b => { const r = b.getBoundingClientRect(), off = Math.max(-1, Math.min(1, (r.top + r.height / 2 - mid) / mid)); b.style.setProperty("--tx", (off * 18).toFixed(2) + "deg"); }); };
      addEventListener("scroll", () => { if (!raf) raf = requestAnimationFrame(wave); }, { passive: true });
      grid.addEventListener("pointerdown", e => { const c = e.target.closest(".card"); if (!c) return; const box = c.querySelector(".card-img"); tilt(box, ...fromEvent(box, e), 22); });
      grid.addEventListener("pointermove", e => { if (!e.buttons && e.pointerType !== "touch") return; const c = e.target.closest(".card"); if (!c) return; const box = c.querySelector(".card-img"); tilt(box, ...fromEvent(box, e), 22); });
      ["pointerup", "pointercancel", "pointerleave"].forEach(t => grid.addEventListener(t, e => { const c = e.target.closest && e.target.closest(".card"); if (c) untilt(c.querySelector(".card-img")); }));
    }

    // logo wipe: going to the Design Studio, the DS mark sweeps across first
    const wipe = document.createElement("div"); wipe.className = "wipe"; wipe.innerHTML = '<img src="images/logo-mark.webp" alt="">'; document.body.append(wipe);
    document.addEventListener("click", e => {
      const a = e.target.closest('a[href*="/printcanvas"]');
      if (!a || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || !wipe.animate) return;
      e.preventDefault();
      try { sessionStorage.setItem("ds-wipe", "1"); } catch (_) {}
      wipe.classList.add("on");
      wipe.animate([{ clipPath: "inset(0 0 0 100%)" }, { clipPath: "inset(0 0 0 0)" }], { duration: 480, easing: "cubic-bezier(.7,0,.2,1)", fill: "forwards" })
        .finished.then(() => { location.href = a.href; });
    });
    addEventListener("pageshow", e => { if (e.persisted) { wipe.getAnimations().forEach(x => x.cancel()); wipe.classList.remove("on"); } });
  }

  /* ---------- product sheet ---------- */
  const sheet = $("#sheet");
  let current = null, sel = {};
  // switching front/back never blanks the picture: the current one stays (dimmed, with the DS loader)
  // until the other side is ready, small version first, then the sharp one
  let viewRun = 0;
  const ready = src => new Promise(ok => { const im = new Image(); im.decoding = "async"; im.onload = im.onerror = () => ok(im.naturalWidth ? src : null); im.src = src; });
  function showView(v) {
    const p = current, sd = sides(p), src = sd[v], img = $("#sheet-img"), run = ++viewRun;
    img.classList.remove("is-zoomed");
    img.style.setProperty("--focus", (v === sd.cover ? p.printFocus : null) || "50% 45%");
    $$(".view", $("#views")).forEach(b => b.setAttribute("aria-selected", b.dataset.v === v));
    const qi = queue.indexOf(src); if (qi > -1) queue.splice(qi, 1);
    // changing side turns the tee over, like the DS mark; the first picture of a product just appears
    let turn = !reduce && !!img.querySelector("img.is-tee") && img.dataset.v && img.dataset.v !== v;
    img.dataset.v = v;
    const put = s => {
      if (run !== viewRun) return;
      let el = img.querySelector("img.is-tee");
      if (!el) { img.insertAdjacentHTML("afterbegin", `<img class="is-tee" alt="">`); el = img.querySelector("img.is-tee"); }
      const set = () => { el.src = s; el.alt = `${p.name}, ${v}`; };
      if (!turn || !el.animate) return set();
      turn = false;
      el.animate([{ transform: "perspective(900px) rotateY(0deg)" }, { transform: "perspective(900px) rotateY(90deg)" }], { duration: 170, easing: "ease-in" }).finished
        .then(() => { if (run !== viewRun) return; set(); el.animate([{ transform: "perspective(900px) rotateY(-90deg)" }, { transform: "perspective(900px) rotateY(0deg)" }], { duration: 300, easing: "cubic-bezier(.2,.7,.2,1)" }); })
        .catch(set);
    };
    const big = new Image(); big.fetchPriority = "high"; big.src = src;
    if (big.complete && big.naturalWidth) { img.classList.remove("is-switching"); return put(src); }
    if (!img.querySelector("img.is-tee")) img.innerHTML = ""; // first open: nothing to keep yet
    img.classList.add("is-switching");
    ready(thumb(src)).then(s => { if (s && run === viewRun && !big.complete) { put(s); img.classList.remove("is-switching"); } });
    ready(src).then(s => { if (run !== viewRun) return; put(s || thumb(src)); img.classList.remove("is-switching"); });
  }
  function updateOrder() {
    const p = current, price = p.prices[sel.fit];
    $("#sheet-price").textContent = rs(price);
    const lead = leadOf(p), le = $("#sheet-lead"); le.hidden = !lead; le.textContent = lead ? `${leadNote(p)} · ready in ${lead}` : "";
    const link = productLink(p.id), out = sizeOut(p, sel.size), all = isOut(p);
    $("#sheet-out").hidden = !out;
    $("#sheet-out").textContent = all ? "Sold out" : `Size ${sel.size} is sold out`;
    const add = $("#sheet-add"); add.disabled = out; add.textContent = out ? "Sold out" : "Add to bag";
    $("#sheet-wa span").textContent = out ? "Ask about a restock" : "Order just this on WhatsApp";
    if (out) { // not an order: just a question about when it's back
      $("#sheet-wa").href = wa(`Hi Dawn Sogni! Is *${p.name}* (${p.id}) coming back${all ? "" : " in size " + sel.size}? Please let me know when it's available again.\n\n${link}`);
      $("#sheet-chart").innerHTML = chartTable(chartKey(p, sel.fit)); return;
    }
    $("#sheet-wa").href = wa(`Hi Dawn Sogni! I'd like to order this design.\nOrder no: *${orderNo()}*\n\n*${p.name}* (${p.id})\nItem: ${CATS[catOf(p)].one}\nFit: ${FIT[sel.fit] || sel.fit}\nSize: ${sel.size}\n${p.colorName ? "Colour: " + p.colorName + "\n" : ""}Price: ${rs0(price)}\n${leadOf(p) ? `Ready in: ${leadOf(p)} (${leadNote(p).toLowerCase()})\n` : ""}\n${link}`);
    $("#sheet-chart").innerHTML = chartTable(chartKey(p, sel.fit));
  }
  // a picture that travels across the screen: card -> product view, product view -> bag
  function fly(src, from, to, opts, host = document.body) {
    const g = document.createElement("img"); g.src = src; g.alt = ""; g.className = "fly";
    Object.assign(g.style, { left: to.left + "px", top: to.top + "px", width: to.width + "px", height: to.height + "px" });
    host.append(g);
    const a = g.animate([
      { transform: `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${from.width / to.width}, ${from.height / to.height})`, opacity: opts.fromOpacity ?? 1 },
      { transform: "none", opacity: opts.toOpacity ?? 1 }
    ], { duration: opts.duration, easing: opts.easing || "cubic-bezier(.2,.8,.2,1)" });
    const done = () => g.remove(); a.finished.then(done, done); return a.finished;
  }
  function closeSheet() {
    if (reduce || !sheet.animate || !sheet.open) return sheet.close();
    const mobile = matchMedia("(max-width: 820px)").matches;
    sheet.animate([{ opacity: 1, transform: "none" }, { opacity: mobile ? 1 : 0, transform: mobile ? "translateY(100%)" : "translateY(14px) scale(.985)" }], { duration: mobile ? 240 : 170, easing: "ease-in" })
      .finished.then(() => sheet.close(), () => sheet.close());
  }
  function open(id, card) {
    const p = byId[id]; if (!p) return;
    gtag("event", "view_item", { currency: "INR", value: basePrice(p), items: [gaItem(p)] });
    const fromImg = card && !reduce ? card.querySelector(".card-img img.main") : null;
    const fromRect = fromImg && fromImg.complete && fromImg.naturalWidth ? fromImg.getBoundingClientRect() : null;
    $("#sheet-img").dataset.v = "";
    current = p;
    const inStock = p.sizes.filter(s => !sizeOut(p, s));
    sel = { fit: firstFit(p), size: ["M", "32"].find(s => inStock.includes(s)) || inStock[0] || ["M", "32"].find(s => p.sizes.includes(s)) || p.sizes[0] };
    $("#size-row").closest("fieldset").querySelector("legend").textContent = p.sizes.every(s => /^\d+$/.test(s)) ? "Waist (in)" : "Size";
    const sd = sides(p);
    $("#views").innerHTML = sd.front && sd.back ? `<button class="view" type="button" role="tab" data-v="front">Front</button><button class="view" type="button" role="tab" data-v="back">Back</button>` : "";
    $("#sheet-img").innerHTML = "";
    showView(sd.cover);
    const otherSide = sd.cover === "front" ? "back" : "front"; if (sd[otherSide]) { fetchNow(thumb(sd[otherSide])); fetchNow(sd[otherSide]); }
    $("#sheet-code").innerHTML = esc(p.id) + (isNew(p) && !isOut(p) ? ` <span class="sheet-new">New</span>` : "");
    $("#sheet-name").textContent = p.name;
    $("#sheet-desc").textContent = p.description || "";
    $("#sheet-colour").textContent = p.colorName ? "Colour: " + p.colorName : "";
    const fits = Object.keys(p.prices);
    $("#opt-fit").hidden = fits.length < 2;
    $("#fit-row").innerHTML = fits.map(f => `<label><input type="radio" name="fit" value="${esc(f)}" ${f === sel.fit ? "checked" : ""}><span>${FIT[f] || esc(f)} <small>${rs0(p.prices[f])}</small></span></label>`).join("");
    $("#size-row").innerHTML = p.sizes.map(s => `<label class="${sizeOut(p, s) ? "is-out" : ""}" title="${sizeOut(p, s) ? "Sold out" : ""}"><input type="radio" name="size" value="${esc(s)}" ${s === sel.size ? "checked" : ""}><span>${esc(s)}</span></label>`).join("");
    updateOrder();
    sheet.showModal(); sheet.scrollTop = 0;
    history.replaceState(null, "", "#p=" + p.id);
    if (!reduce && sheet.animate) {
      sheet.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 240, easing: "ease-out" });
      if (fromRect) { // the tapped tee glides into place in the product view
        const box = $("#sheet-img"), b = box.getBoundingClientRect(), pad = b.width * .05;
        const to = { left: b.left + pad, top: b.top + pad, width: b.width * .9, height: b.height * .9 };
        box.classList.add("is-morphing");
        fly(fromImg.currentSrc || fromImg.src, fromRect, to, { duration: 460 }, sheet).then(() => box.classList.remove("is-morphing"), () => box.classList.remove("is-morphing"));
      }
    }
  }
  document.addEventListener("click", e => { const b = e.target.closest(".card"); if (b) open(b.dataset.id, b); });
  $("#views").addEventListener("click", e => { const b = e.target.closest(".view"); if (b) showView(b.dataset.v); });
  $("#sheet-img").addEventListener("click", () => $("#sheet-img").classList.toggle("is-zoomed"));
  $("#sheet-add").addEventListener("click", () => {
    addToBag(current.id, sel.fit, sel.size);
    // the tee drops into the bag, and the count gives a small bump
    const teeEl = $("#sheet-img img.is-tee"), bagBtn = $("#bag-btn"), badge = $("#bag-count");
    const from = teeEl && !reduce ? teeEl.getBoundingClientRect() : null, src = teeEl && (teeEl.currentSrc || teeEl.src);
    sheet.close();
    if (from && from.width && bagBtn.animate) {
      const t = bagBtn.getBoundingClientRect(), size = 26, to = { left: t.left + t.width / 2 - size / 2, top: t.top + t.height / 2 - size / 2, width: size, height: size };
      fly(src, from, to, { duration: 620, toOpacity: .25, easing: "cubic-bezier(.5,0,.2,1)" })
        .then(() => { burstAt(bagBtn); badge.animate([{ transform: "scale(1)" }, { transform: "scale(1.7)" }, { transform: "scale(1)" }], { duration: 380, easing: "cubic-bezier(.2,.7,.2,1)" }); }, () => {});
    }
    toast(`Added: ${current.name}, ${Object.keys(current.prices).length > 1 ? (FIT[sel.fit] || sel.fit) + " " : ""}${sel.size}`);
  });
  $("#sheet-close").addEventListener("click", closeSheet);
  sheet.addEventListener("click", e => { if (e.target === sheet) closeSheet(); });
  sheet.addEventListener("close", () => history.replaceState(null, "", location.pathname + location.search));
  sheet.addEventListener("change", e => {
    if (e.target.name === "fit") sel.fit = e.target.value;
    if (e.target.name === "size") sel.size = e.target.value;
    updateOrder();
  });
  const m = location.hash.match(/^#p=(.+)$/);
  if (m) open(decodeURIComponent(m[1]));

  /* ---------- background music: plays by default, starts on first interaction if the browser blocks autoplay ---------- */
  const bgm = $("#bgm"), mBtn = $("#music-btn");
  let userPaused = store.get("ds-music-off", false);
  bgm.volume = 0.6;
  const syncBtn = () => { const on = !bgm.paused; mBtn.setAttribute("aria-pressed", on); mBtn.setAttribute("aria-label", on ? "Mute music" : "Play music"); };
  bgm.addEventListener("play", syncBtn); bgm.addEventListener("pause", syncBtn);
  // the song is 2 MB, so it only starts loading once the page and tee images are in
  const ensureSrc = () => { if (!bgm.getAttribute("src")) { bgm.src = bgm.dataset.src; bgm.preload = "auto"; } };
  const tryPlay = () => { ensureSrc(); return bgm.play().catch(() => { if (bgm.paused && !bgm.currentTime) { bgm.removeAttribute("src"); bgm.preload = "none"; bgm.load(); } }); };
  const EVTS = ["pointerdown", "keydown", "touchstart"];
  const unlock = e => {
    if (e && e.target.closest && e.target.closest("#music-btn")) return;
    if (!userPaused && bgm.paused) tryPlay();
    EVTS.forEach(t => removeEventListener(t, unlock, true));
  };
  if (userPaused) bgm.pause();
  else { imagesP.then(() => setTimeout(tryPlay, 300)); setTimeout(() => imagesReady(), 8000); EVTS.forEach(t => addEventListener(t, unlock, true)); }
  mBtn.addEventListener("click", () => {
    if (bgm.paused) { userPaused = false; tryPlay(); } else { userPaused = true; bgm.pause(); }
    store.set("ds-music-off", userPaused);
  });
  syncBtn();

  /* share one design: the link shows that tee as the preview on WhatsApp / Instagram */
  $("#sheet-share")?.addEventListener("click", async () => {
    if (!current) return;
    const url = productLink(current.id);
    try { if (navigator.share) { await navigator.share({ title: current.name + " — Dawn Sogni", url }); return; } } catch (e) { if (e.name === "AbortError") return; }
    try { await navigator.clipboard.writeText(url); toast("Link copied"); } catch (e) { prompt("Copy this link", url); }
  });

  /* tell Google what is on sale */
  try {
    const site = (location.origin + location.pathname).replace(/index\.html$/, "");
    const ld = { "@context": "https://schema.org", "@graph": [
      { "@type": "Organization", name: "Dawn Sogni", url: site, logo: site + "images/logo-mark.png", sameAs: D.instagram ? ["https://www.instagram.com/" + D.instagram + "/"] : [] },
      { "@type": "ItemList", name: "Dawn Sogni tees", itemListElement: D.products.map((p, i) => {
        const prices = Object.values(p.prices).filter(v => v != null), img = (p.cover === "front" ? p.front : p.back) || p.front || p.back || p.tee;
        return { "@type": "ListItem", position: i + 1, item: { "@type": "Product", name: p.name, sku: p.id, description: p.description || undefined, color: p.colorName || undefined, image: site + img, url: productLink(p.id), brand: { "@type": "Brand", name: "Dawn Sogni" },
          offers: { "@type": "AggregateOffer", priceCurrency: "INR", lowPrice: Math.min(...prices), highPrice: Math.max(...prices), offerCount: prices.length, availability: isOut(p) ? "https://schema.org/OutOfStock" : "https://schema.org/InStock" } } };
      }) }
    ] };
    const tag = document.createElement("script"); tag.type = "application/ld+json"; tag.textContent = JSON.stringify(ld); document.head.append(tag);
  } catch (e) {}
})();
