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
  /* ---------- loader: at least 0.9s, gone on load or after 2.5s ---------- */
  const loader = $("#loader"), t0 = performance.now();
  document.body.classList.add("loading");
  const hideLoader = () => {
    const wait = Math.max(0, 900 - (performance.now() - t0));
    setTimeout(() => { loader.classList.add("done"); document.body.classList.remove("loading"); setTimeout(() => loader.remove(), 700); }, wait);
  };
  if (document.readyState === "complete") hideLoader(); else addEventListener("load", hideLoader, { once: true });
  setTimeout(hideLoader, 2500);
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };

  /* ---------- background: the hour before dawn. Night sky, a faint horizon glow, slow drifting mist ---------- */
  const cv = $("#stars"), cx = cv.getContext("2d");
  let W = 0, H = 0, sky, stars = [], mist = [];
  function buildSky() {
    const dpr = Math.min(devicePixelRatio || 1, 1.5); W = innerWidth; H = innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    sky = document.createElement("canvas"); sky.width = cv.width; sky.height = cv.height;
    const s = sky.getContext("2d"); s.setTransform(dpr, 0, 0, dpr, 0, 0);
    const g = s.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#000000"); g.addColorStop(0.45, "#030308"); g.addColorStop(0.78, "#0a0915"); g.addColorStop(1, "#160e1c");
    s.fillStyle = g; s.fillRect(0, 0, W, H);
    let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    // a few last stars, only high up, fading toward the horizon
    stars = Array.from({ length: Math.round(W / 22) }, () => ({ x: rnd() * W, y: Math.pow(rnd(), 1.8) * H * 0.55, r: rnd() * 0.9 + 0.3, a: 0.15 + rnd() * 0.5, ph: rnd() * 6.28 }));
    mist = Array.from({ length: 7 }, (_, i) => ({ x: rnd() * W, y: H * (0.45 + rnd() * 0.6), rx: W * (0.35 + rnd() * 0.4), ry: H * (0.08 + rnd() * 0.12), a: 0.035 + rnd() * 0.04, v: (rnd() * 0.5 + 0.3) * (i % 2 ? 1 : -1) * 6 }));
  }
  function paintSky(t) {
    cx.globalAlpha = 1; cx.drawImage(sky, 0, 0, W, H);
    // horizon glow, breathing very slowly
    const br = 0.85 + 0.15 * Math.sin(t / 9000);
    const hg = cx.createRadialGradient(W * 0.5, H * 1.08, 0, W * 0.5, H * 1.08, Math.max(W, H) * 0.75);
    hg.addColorStop(0, `rgba(255,150,105,${0.16 * br})`); hg.addColorStop(0.35, `rgba(150,90,140,${0.08 * br})`); hg.addColorStop(1, "rgba(0,0,0,0)");
    cx.fillStyle = hg; cx.fillRect(0, 0, W, H);
    for (const s of stars) { cx.globalAlpha = s.a * (1 - s.y / (H * 0.6)) * (0.6 + 0.4 * Math.sin(t / 1600 + s.ph)); cx.fillStyle = "#fff"; cx.beginPath(); cx.arc(s.x, s.y, s.r, 0, 6.283); cx.fill(); }
    // mist banks drifting sideways
    for (const m of mist) {
      const x = ((m.x + (t / 1000) * m.v) % (W + m.rx * 2) + (W + m.rx * 2)) % (W + m.rx * 2) - m.rx;
      cx.save(); cx.translate(x, m.y); cx.scale(1, m.ry / m.rx);
      const mg = cx.createRadialGradient(0, 0, 0, 0, 0, m.rx); mg.addColorStop(0, `rgba(200,205,225,${m.a})`); mg.addColorStop(1, "rgba(200,205,225,0)");
      cx.globalAlpha = 1; cx.fillStyle = mg; cx.beginPath(); cx.arc(0, 0, m.rx, 0, 6.283); cx.fill(); cx.restore();
    }
    cx.globalAlpha = 1;
  }
  let raf = 0, last = 0;
  const loop = t => { raf = requestAnimationFrame(loop); if (t - last < 50) return; last = t; paintSky(t); };
  function startSky() { buildSky(); cancelAnimationFrame(raf); if (reduce) paintSky(0); else raf = requestAnimationFrame(loop); }
  startSky();
  let rz; addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(startSky, 150); });
  document.addEventListener("visibilitychange", () => { if (document.hidden) cancelAnimationFrame(raf); else if (!reduce) raf = requestAnimationFrame(loop); });

  /* ---------- WhatsApp + links ---------- */
  const wa = t => `https://wa.me/${D.whatsapp}?text=${encodeURIComponent(t)}`;
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
  function card(p) {
    const swap = !!p.teeFront;
    return `
      <button class="card ${swap ? "swap" : "zoom"}" type="button" data-id="${esc(p.id)}" style="--focus:${esc(p.printFocus || "50% 45%")}" aria-label="${esc(p.name)}, ${rs(basePrice(p))}. View details">
        <span class="card-img">
          <img class="main" src="${esc(p.tee)}" alt="" loading="lazy" decoding="async">
          ${swap ? `<img class="alt" src="${esc(p.teeFront)}" alt="" loading="lazy" decoding="async">` : ""}
        </span>
        <span class="card-name">${esc(p.name)}</span>
        <span class="card-price">${rs(basePrice(p))}</span>
      </button>`;
  }
  function render(fid) { const f = FILTERS.find(x => x.id === fid) || FILTERS[0]; grid.innerHTML = D.products.filter(f.test).map(card).join(""); }
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

  /* ---------- gallery ---------- */
  const big = src => src.replace("/full/843,/", "/full/1686,/");
  const gal = D.gallery || [];
  if (!gal.length) $("#gallery").hidden = true;
  $("#gallery-grid").innerHTML = gal.map((a, i) => `
    <button class="art" type="button" data-i="${i}" aria-label="${esc(a.title)} by ${esc(a.artist)}. View larger">
      <span class="art-frame"><img src="${esc(a.src)}" alt="${esc(a.title)}, ${esc(a.artist)}" loading="lazy" decoding="async"></span>
      <span class="art-cap"><b>${esc(a.title)}</b><span>${esc(a.artist)}${a.year ? ", " + esc(a.year) : ""}</span></span>
    </button>`).join("");
  // if a museum image ever fails to load, drop that tile quietly
  $$("#gallery-grid img").forEach(img => img.addEventListener("error", () => { img.closest(".art").remove(); if (!$("#gallery-grid .art")) $("#gallery").hidden = true; }));
  const lb = $("#lightbox");
  $("#gallery-grid").addEventListener("click", e => {
    const b = e.target.closest(".art"); if (!b) return; const a = gal[+b.dataset.i];
    $("#lightbox-img").src = big(a.src); $("#lightbox-img").alt = `${a.title}, ${a.artist}`;
    $("#lightbox-cap").innerHTML = `<b>${esc(a.title)}</b>${esc(a.artist)}${a.year ? ", " + esc(a.year) : ""}${a.credit ? `<br>${a.link ? `<a href="${esc(a.link)}" target="_blank" rel="noopener">${esc(a.credit)}</a>` : esc(a.credit)}` : ""}`;
    lb.showModal();
  });
  $("#lightbox-close").addEventListener("click", () => lb.close());
  lb.addEventListener("click", e => { if (e.target === lb) lb.close(); });

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
  function bagMessage() {
    const lines = bag.map((i, k) => {
      const p = byId[i.id], price = p.prices[i.fit];
      return `${k + 1}. *${p.name}* (${p.id})\n   ${FIT[i.fit] || i.fit}, size ${i.size}${p.colorName ? ", " + p.colorName : ""}\n   ${i.qty} × ${rs0(price)} = ${rs0(price * i.qty)}`;
    });
    return `Hi Dawn Sogni! I'd like to place this order:\n\n${lines.join("\n\n")}\n\n*Total: ${rs0(bagTotal())}* (${bagCount()} ${bagCount() === 1 ? "tee" : "tees"})`;
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
        <img src="${esc(p.tee)}" alt="">
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
    const p = current, src = v === "front" ? p.teeFront : p.tee, img = $("#sheet-img");
    img.classList.remove("is-zoomed");
    img.style.setProperty("--focus", (v === "front" ? p.frontFocus : p.printFocus) || "50% 45%");
    img.innerHTML = `<img class="is-tee" src="${esc(src)}" alt="${esc(p.name)}, ${v === "front" ? "front" : p.print === "front" ? "front" : "back"}">`;
    $$(".view", $("#views")).forEach(b => b.setAttribute("aria-selected", b.dataset.v === v));
  }
  function updateOrder() {
    const p = current, price = p.prices[sel.fit];
    $("#sheet-price").textContent = rs(price);
    const link = location.href.split("#")[0] + "#p=" + p.id;
    $("#sheet-wa").href = wa(`Hi Dawn Sogni! I'd like to order this design:\n\n*${p.name}* (${p.id})\nFit: ${FIT[sel.fit] || sel.fit}\nSize: ${sel.size}\n${p.colorName ? "Colour: " + p.colorName + "\n" : ""}Price: ${rs0(price)}\n\n${link}`);
    $("#sheet-chart").innerHTML = chartTable(sel.fit);
  }
  function open(id) {
    const p = byId[id]; if (!p) return;
    current = p;
    sel = { fit: firstFit(p), size: p.sizes.includes("M") ? "M" : p.sizes[0] };
    $("#views").innerHTML = p.teeFront ? `<button class="view" type="button" role="tab" data-v="back">Back</button><button class="view" type="button" role="tab" data-v="front">Front</button>` : "";
    showView("back");
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
  const tryPlay = () => bgm.play().catch(() => {});
  const EVTS = ["pointerdown", "keydown", "touchstart"];
  const unlock = e => {
    if (e && e.target.closest && e.target.closest("#music-btn")) return;
    if (!userPaused && bgm.paused) tryPlay();
    EVTS.forEach(t => removeEventListener(t, unlock, true));
  };
  if (userPaused) bgm.pause();
  else { tryPlay(); EVTS.forEach(t => addEventListener(t, unlock, true)); }
  mBtn.addEventListener("click", () => {
    if (bgm.paused) { userPaused = false; tryPlay(); } else { userPaused = true; bgm.pause(); }
    store.set("ds-music-off", userPaused);
  });
  syncBtn();
})();
