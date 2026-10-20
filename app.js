/* Dawn Sogni — shop, bag, ordering, music */
(() => {
  const D = window.DS;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const rs = n => "Rs. " + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const rs0 = n => "Rs. " + Number(n).toLocaleString("en-IN");
  const FIT = { regular: "Regular", oversized: "Oversized" };
  const byId = Object.fromEntries(D.products.map(p => [p.id, p]));
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  /* ---------- loader: brief, gone once the page has painted (never waits for the tee images) ---------- */
  const loader = $("#loader"), t0 = performance.now();
  document.body.classList.add("loading");
  const hideLoader = () => {
    const wait = Math.max(0, 300 - (performance.now() - t0));
    setTimeout(() => { loader.classList.add("done"); document.body.classList.remove("loading"); setTimeout(() => loader.remove(), 700); }, wait);
  };
  let loaderGone = false; const hideOnce = () => { if (!loaderGone) { loaderGone = true; hideLoader(); } };
  if (document.readyState === "complete") hideOnce(); else addEventListener("load", hideOnce, { once: true });
  setTimeout(hideOnce, Math.max(0, 1200 - performance.now())); // counted from when the page was opened
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };

  /* ---------- background: ravens, ruins and a full moon in fog. The picture is a fixed CSS layer (no repainting);
     the canvas above it only draws drifting mist and the odd raven, and pauses while the page is scrolling ---------- */
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
    if (t > nextBat && motes.length < 2) {
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
    custom: "Hi Dawn Sogni! I have my own design I'd like printed. I'll attach the file here.\n\nGarment (tee / polo / print only):\nSize:\nPrint size on the garment:"
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
  const FILTERS = [
    { id: "all", name: "All", test: () => true },
    { id: "back", name: "Back print", test: p => p.print === "back" },
    { id: "front", name: "Front print", test: p => p.print === "front" }
  ].filter(f => f.id === "all" || D.products.some(f.test));
  const pills = $("#pills"), grid = $("#grid");
  if (D.products.length < 3) { pills.hidden = true; grid.classList.add("few"); }
  pills.innerHTML = FILTERS.map((f, i) => `<button class="pill" role="tab" type="button" data-f="${f.id}" aria-selected="${i === 0}">${f.name}</button>`).join("");
  // Card hover: swap to the other side if a front image exists, otherwise zoom into the print.
  // Cards appear one after another as their image arrives. Until then each card shows a small spinning DS.
  function card(p, i) {
    const sd = sides(p), cov = sd[sd.cover], alt = sd[sd.cover === "front" ? "back" : "front"], swap = !!alt;
    return `
      <button class="card ${swap ? "swap" : "zoom"} is-loading" type="button" data-id="${esc(p.id)}" data-i="${i}" style="--focus:${esc(p.printFocus || "50% 45%")}" aria-label="${esc(p.name)}, ${rs(basePrice(p))}. View details">
        <span class="card-img">
          <span class="card-loader" aria-hidden="true"><img src="images/logo-mark.webp" alt=""></span>
          <img class="main" data-src="${esc(thumb(cov))}" data-full="${esc(cov)}" alt="" width="560" height="560" decoding="async">
          ${swap ? `<img class="alt" data-src="${esc(thumb(alt))}" data-full="${esc(alt)}" alt="" width="560" height="560" decoding="async">` : ""}
        </span>
        <span class="card-name">${esc(p.name)}</span>
        <span class="card-price">${rs(basePrice(p))}</span>
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
    const f = FILTERS.find(x => x.id === fid) || FILTERS[0]; grid.innerHTML = D.products.filter(f.test).map(card).join("");
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
  const chartTable = fit => {
    const c = D.sizeCharts?.[fit]; if (!c) return "";
    return `<table class="size-table"><caption>${esc(c.title)}</caption>
      <thead><tr><th scope="col">Size</th>${c.columns.map(x => `<th scope="col">${esc(x)}</th>`).join("")}</tr></thead>
      <tbody>${c.rows.map(r => `<tr><th scope="row">${esc(r[0])}</th>${r.slice(1).map(v => `<td>${esc(v)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
  };
  $("#size-tables").innerHTML = Object.keys(D.sizeCharts || {}).map(chartTable).join("");

  /* ---------- toast ---------- */
  let toastT;
  const toast = msg => { const t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 1800); };

  /* ---------- bag ---------- */
  let bag = store.get("ds-bag", []).filter(i => byId[i.id] && byId[i.id].prices[i.fit] != null);
  const bagEl = $("#bag");
  const lineKey = i => `${i.id}|${i.fit}|${i.size}`;
  const bagCount = () => bag.reduce((n, i) => n + i.qty, 0);
  const bagTotal = () => bag.reduce((n, i) => n + byId[i.id].prices[i.fit] * i.qty, 0);
  function saveBag() { store.set("ds-bag", bag); renderBag(); }
  function bagMessage(no = orderNo()) {
    const lines = bag.map((i, k) => {
      const p = byId[i.id], price = p.prices[i.fit];
      return `${k + 1}. *${p.name}* (${p.id})\n   ${FIT[i.fit] || i.fit}, size ${i.size}${p.colorName ? ", " + p.colorName : ""}\n   ${i.qty} × ${rs0(price)} = ${rs0(price * i.qty)}`;
    });
    return `Hi Dawn Sogni! I'd like to place this order.\nOrder no: *${no}*\n\n${lines.join("\n\n")}\n\n*Total: ${rs0(bagTotal())}* (${bagCount()} ${bagCount() === 1 ? "tee" : "tees"})`;
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
      return `<div class="bag-item" data-key="${esc(lineKey(i))}">
        <img src="${esc(thumb(p.tee))}" alt="" onerror="this.onerror=null;this.src='${esc(p.tee)}'">
        <div><h3>${esc(p.name)}</h3><p>${FIT[i.fit] || esc(i.fit)}, ${esc(i.size)}</p>
          <div class="qty"><button type="button" data-q="-1" aria-label="One less">−</button><span>${i.qty}</span><button type="button" data-q="1" aria-label="One more">+</button></div></div>
        <div class="bag-line"><span>${rs0(price * i.qty)}</span><button class="link-btn" type="button" data-remove>Remove</button></div>
      </div>`;
    }).join("");
    $("#bag-total").textContent = rs(bagTotal());
    $("#bag-send").href = wa(bagMessage());
  }
  function addToBag(id, fit, size) {
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
  $("#bag-clear").addEventListener("click", () => { bag = []; saveBag(); });
  renderBag();

  /* ---------- product sheet ---------- */
  const sheet = $("#sheet");
  let current = null, sel = {};
  function showView(v) {
    const p = current, sd = sides(p), src = sd[v], img = $("#sheet-img");
    img.classList.remove("is-zoomed");
    img.style.setProperty("--focus", (v === sd.cover ? p.printFocus : null) || "50% 45%");
    const qi = queue.indexOf(src); if (qi > -1) queue.splice(qi, 1);
    const big = new Image(); big.decoding = "async"; big.fetchPriority = "high"; big.src = src;
    if (big.complete && big.naturalWidth) img.innerHTML = `<img class="is-tee" src="${esc(src)}" alt="${esc(p.name)}, ${v}">`;
    else {
      img.innerHTML = `<img class="is-tee" src="${esc(thumb(src))}" alt="${esc(p.name)}, ${v}">`;
      const shown = img.firstElementChild;
      shown.onerror = () => { shown.onerror = null; shown.src = src; };
      (big.decode ? big.decode() : new Promise((ok, no) => { big.onload = ok; big.onerror = no; })).then(() => { if (img.firstElementChild === shown) shown.src = src; }).catch(() => {});
    }
    $$(".view", $("#views")).forEach(b => b.setAttribute("aria-selected", b.dataset.v === v));
  }
  function updateOrder() {
    const p = current, price = p.prices[sel.fit];
    $("#sheet-price").textContent = rs(price);
    const link = productLink(p.id);
    $("#sheet-wa").href = wa(`Hi Dawn Sogni! I'd like to order this design.\nOrder no: *${orderNo()}*\n\n*${p.name}* (${p.id})\nFit: ${FIT[sel.fit] || sel.fit}\nSize: ${sel.size}\n${p.colorName ? "Colour: " + p.colorName + "\n" : ""}Price: ${rs0(price)}\n\n${link}`);
    $("#sheet-chart").innerHTML = chartTable(sel.fit);
  }
  function open(id) {
    const p = byId[id]; if (!p) return;
    current = p;
    sel = { fit: firstFit(p), size: p.sizes.includes("M") ? "M" : p.sizes[0] };
    const sd = sides(p);
    $("#views").innerHTML = sd.front && sd.back ? `<button class="view" type="button" role="tab" data-v="front">Front</button><button class="view" type="button" role="tab" data-v="back">Back</button>` : "";
    showView(sd.cover);
    $("#sheet-code").textContent = p.id;
    $("#sheet-name").textContent = p.name;
    $("#sheet-desc").textContent = p.description || "";
    $("#sheet-colour").textContent = p.colorName ? "Colour: " + p.colorName : "";
    const fits = Object.keys(p.prices);
    $("#opt-fit").hidden = fits.length < 2;
    $("#fit-row").innerHTML = fits.map(f => `<label><input type="radio" name="fit" value="${esc(f)}" ${f === sel.fit ? "checked" : ""}><span>${FIT[f] || esc(f)} <small>${rs0(p.prices[f])}</small></span></label>`).join("");
    $("#size-row").innerHTML = p.sizes.map(s => `<label><input type="radio" name="size" value="${esc(s)}" ${s === sel.size ? "checked" : ""}><span>${esc(s)}</span></label>`).join("");
    updateOrder();
    sheet.showModal(); sheet.scrollTop = 0;
    history.replaceState(null, "", "#p=" + p.id);
  }
  document.addEventListener("click", e => { const b = e.target.closest(".card"); if (b) open(b.dataset.id); });
  $("#views").addEventListener("click", e => { const b = e.target.closest(".view"); if (b) showView(b.dataset.v); });
  $("#sheet-img").addEventListener("click", () => $("#sheet-img").classList.toggle("is-zoomed"));
  $("#sheet-add").addEventListener("click", () => {
    addToBag(current.id, sel.fit, sel.size);
    sheet.close();
    toast(`Added: ${current.name}, ${FIT[sel.fit]} ${sel.size}`);
  });
  $("#sheet-close").addEventListener("click", () => sheet.close());
  sheet.addEventListener("click", e => { if (e.target === sheet) sheet.close(); });
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
          offers: { "@type": "AggregateOffer", priceCurrency: "INR", lowPrice: Math.min(...prices), highPrice: Math.max(...prices), offerCount: prices.length, availability: "https://schema.org/InStock" } } };
      }) }
    ] };
    const tag = document.createElement("script"); tag.type = "application/ld+json"; tag.textContent = JSON.stringify(ld); document.head.append(tag);
  } catch (e) {}
})();
