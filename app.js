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

  /* ---------- background: ravens, ruins and a full moon in fog. Kept dim so the designs stay readable ---------- */
  const cv = $("#stars"), cx = cv.getContext("2d");
  const nave = new Image(); nave.decoding = "async";
  nave.src = innerWidth > 900 ? "images/ravenmoon.webp" : "images/ravenmoon-1200.webp";
  let W = 0, H = 0, base = null, mist = [], motes = [], nextBat = 3000;
  function buildSky() {
    const dpr = Math.min(devicePixelRatio || 1, 1.5); W = innerWidth; H = innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    base = document.createElement("canvas"); base.width = cv.width; base.height = cv.height;
    const b = base.getContext("2d"); b.setTransform(dpr, 0, 0, dpr, 0, 0);
    b.fillStyle = "#000"; b.fillRect(0, 0, W, H);
    if (nave.complete && nave.naturalWidth) {
      // cover, keeping the rose window in view
      const s = Math.max(W / nave.naturalWidth, H / nave.naturalHeight), iw = nave.naturalWidth * s, ih = nave.naturalHeight * s;
      b.globalAlpha = 0.7; b.drawImage(nave, (W - iw) * 0.62, (H - ih) * 0.3, iw, ih); b.globalAlpha = 1;
      const dim = b.createRadialGradient(W / 2, H * 0.5, Math.min(W, H) * 0.15, W / 2, H * 0.5, Math.max(W, H) * 0.75); dim.addColorStop(0, "rgba(0,0,0,.22)"); dim.addColorStop(1, "rgba(0,0,0,.62)"); b.fillStyle = dim; b.fillRect(0, 0, W, H);
    }
    let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    mist = Array.from({ length: 6 }, (_, i) => ({ x: rnd() * W, y: H * (0.55 + rnd() * 0.5), rx: W * (0.35 + rnd() * 0.4), ry: H * (0.06 + rnd() * 0.1), a: 0.03 + rnd() * 0.035, v: (rnd() * 0.5 + 0.3) * (i % 2 ? 1 : -1) * 6 }));
    motes = []; nextBat = 3000;
  }
  nave.addEventListener("load", () => { buildSky(); paintSky(performance.now()); });
  let lastT = 0;
  function paintSky(t) {
    const dt = Math.min(0.1, (t - lastT) / 1000 || 0); lastT = t;
    cx.globalAlpha = 1; cx.drawImage(base, 0, 0, W, H);
    // a raven crossing the sky now and then, wings beating
    if (t > nextBat && motes.length < 3) {
      const dir = Math.random() < 0.5 ? 1 : -1;
      motes.push({ x: dir > 0 ? -60 : W + 60, y: H * (0.08 + Math.random() * 0.35), vx: dir * (W / (9 + Math.random() * 5)), wob: Math.random() * 6.28, s: 0.7 + Math.random() * 0.6, born: t });
      nextBat = t + 6000 + Math.random() * 9000;
    }
    motes = motes.filter(m => m.x > -80 && m.x < W + 80);
    for (const m of motes) {
      m.x += m.vx * dt; const y = m.y + Math.sin(t / 700 + m.wob) * 14, flap = Math.sin(t / 85 + m.wob);
      cx.save(); cx.translate(m.x, y); cx.scale(m.s * (m.vx > 0 ? 1 : -1), m.s); cx.globalAlpha = 0.85; cx.fillStyle = "#030404";
      // raven: long tapered wings that beat up and down, wedge tail
      const up = flap * 16;
      for (const k of [1, -1]) { cx.beginPath(); cx.moveTo(4 * k, -1); cx.quadraticCurveTo(16 * k, -6 - up * 0.6, 34 * k, -up); cx.quadraticCurveTo(20 * k, 0 - up * 0.2, 4 * k, 3); cx.closePath(); cx.fill(); }
      cx.beginPath(); cx.ellipse(0, 1, 9, 3.2, 0, 0, 6.283); cx.fill();
      cx.beginPath(); cx.moveTo(-8, 0); cx.lineTo(-17, -3); cx.lineTo(-16, 4); cx.closePath(); cx.fill();
      cx.beginPath(); cx.arc(9, -1, 2.8, 0, 6.283); cx.fill(); cx.beginPath(); cx.moveTo(11, -1.5); cx.lineTo(16, 0); cx.lineTo(11, 1); cx.fill();
      cx.restore();
    }
    // mist rolling along the floor
    for (const m of mist) {
      const x = ((m.x + (t / 1000) * m.v) % (W + m.rx * 2) + (W + m.rx * 2)) % (W + m.rx * 2) - m.rx;
      cx.save(); cx.translate(x, m.y); cx.scale(1, m.ry / m.rx);
      const mg = cx.createRadialGradient(0, 0, 0, 0, 0, m.rx); mg.addColorStop(0, `rgba(190,198,220,${m.a})`); mg.addColorStop(1, "rgba(190,198,220,0)");
      cx.globalAlpha = 1; cx.fillStyle = mg; cx.beginPath(); cx.arc(0, 0, m.rx, 0, 6.283); cx.fill(); cx.restore();
    }
    cx.globalAlpha = 1;
  }
  let raf = 0, last = 0;
  const loop = t => { raf = requestAnimationFrame(loop); if (t - last < 40) return; last = t; paintSky(t); };
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
  // which image is front / back, and which one the card shows
  const sides = p => {
    if (p.front || p.back) { const cover = p.cover && p[p.cover] ? p.cover : (p.back ? "back" : "front"); return { front: p.front, back: p.back, cover }; }
    const cover = p.print === "front" ? "front" : "back", o = cover === "front" ? "back" : "front";
    return { [cover]: p.tee, [o]: p.teeFront, cover };
  };
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
    const sd = sides(p), cov = sd[sd.cover], alt = sd[sd.cover === "front" ? "back" : "front"], swap = !!alt;
    return `
      <button class="card ${swap ? "swap" : "zoom"}" type="button" data-id="${esc(p.id)}" style="--focus:${esc(p.printFocus || "50% 45%")}" aria-label="${esc(p.name)}, ${rs(basePrice(p))}. View details">
        <span class="card-img">
          <img class="main" src="${esc(cov)}" alt="" loading="lazy" decoding="async">
          ${swap ? `<img class="alt" src="${esc(alt)}" alt="" loading="lazy" decoding="async">` : ""}
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
    const p = current, sd = sides(p), src = sd[v], img = $("#sheet-img");
    img.classList.remove("is-zoomed");
    img.style.setProperty("--focus", (v === sd.cover ? p.printFocus : null) || "50% 45%");
    img.innerHTML = `<img class="is-tee" src="${esc(src)}" alt="${esc(p.name)}, ${v}">`;
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
