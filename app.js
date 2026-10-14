/* Dawn Sogni — shop, ordering, music */
(() => {
  const D = window.DS;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const rs = n => "Rs. " + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const FIT = { regular: "Regular", oversized: "Oversized" };
  const byId = Object.fromEntries(D.products.map(p => [p.id, p]));

  /* ---------- starfield (static, drawn once per resize) ---------- */
  const cv = $("#stars"), cx = cv.getContext("2d");
  function drawStars() {
    const dpr = Math.min(devicePixelRatio || 1, 2), w = innerWidth, h = innerHeight;
    cv.width = w * dpr; cv.height = h * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx.fillStyle = "#000"; cx.fillRect(0, 0, w, h);
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const n = Math.round(w * h / 2600);
    for (let i = 0; i < n; i++) {
      const x = rnd() * w, y = rnd() * h, r = rnd() < 0.92 ? rnd() * 0.9 + 0.2 : rnd() * 1.4 + 0.9;
      cx.globalAlpha = 0.25 + rnd() * 0.75; cx.fillStyle = "#fff";
      cx.beginPath(); cx.arc(x, y, r, 0, Math.PI * 2); cx.fill();
      if (r > 1.6) { const g = cx.createRadialGradient(x, y, 0, x, y, r * 5); g.addColorStop(0, "rgba(255,255,255,.35)"); g.addColorStop(1, "rgba(255,255,255,0)"); cx.fillStyle = g; cx.beginPath(); cx.arc(x, y, r * 5, 0, Math.PI * 2); cx.fill(); }
    }
    // one faint shooting-star streak
    cx.globalAlpha = 0.7; const sx = w * 0.22, sy = h * 0.12, g = cx.createLinearGradient(sx, sy, sx + 40, sy - 26);
    g.addColorStop(0, "rgba(255,255,255,0)"); g.addColorStop(1, "rgba(255,255,255,.9)");
    cx.strokeStyle = g; cx.lineWidth = 1.4; cx.beginPath(); cx.moveTo(sx, sy); cx.lineTo(sx + 40, sy - 26); cx.stroke();
    cx.globalAlpha = 1;
  }
  drawStars();
  let rz; addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(drawStars, 150); });

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

  /* ---------- menu drawer ---------- */
  const menuBtn = $("#menu-btn"), drawer = $("#drawer");
  const setMenu = open => { drawer.hidden = !open; menuBtn.setAttribute("aria-expanded", open); menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu"); };
  menuBtn.addEventListener("click", () => setMenu(drawer.hidden));
  drawer.addEventListener("click", e => { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !drawer.hidden) setMenu(false); });
  document.addEventListener("click", e => { if (!drawer.hidden && !drawer.contains(e.target) && !menuBtn.contains(e.target)) setMenu(false); });

  /* ---------- shop ---------- */
  const basePrice = p => p.prices.regular ?? Math.min(...Object.values(p.prices));
  const firstFit = p => (p.prices.regular != null ? "regular" : Object.keys(p.prices)[0]);
  const FILTERS = [
    { id: "all", name: "All", test: () => true },
    { id: "back", name: "Back print", test: p => p.print === "back" },
    { id: "front", name: "Front print", test: p => p.print === "front" }
  ].filter(f => f.id === "all" || D.products.some(f.test));
  const pills = $("#pills"), grid = $("#grid");
  pills.innerHTML = FILTERS.map((f, i) => `<button class="pill" role="tab" type="button" data-f="${f.id}" aria-selected="${i === 0}">${f.name}</button>`).join("");
  function render(fid) {
    const f = FILTERS.find(x => x.id === fid) || FILTERS[0];
    grid.innerHTML = D.products.filter(f.test).map(p => `
      <button class="card" type="button" data-id="${esc(p.id)}" aria-label="${esc(p.name)}, ${rs(basePrice(p))}. View details">
        <span class="card-img"><img src="${esc(p.tee || p.photo)}" alt="" loading="lazy" decoding="async"></span>
        <span class="card-name">${esc(p.name)}</span>
        <span class="card-price">${rs(basePrice(p))}</span>
      </button>`).join("");
  }
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

  /* ---------- product sheet ---------- */
  const sheet = $("#sheet");
  let current = null, sel = {};
  function showView(v) {
    const p = current, src = v === "model" ? p.photo : p.tee;
    $("#sheet-img").innerHTML = `<img class="${v === "model" ? "is-model" : "is-tee"}" src="${esc(src)}" alt="${esc(p.name)}${v === "model" ? " worn by a model" : ""}">`;
    $$(".view", $("#views")).forEach(b => b.setAttribute("aria-selected", b.dataset.v === v));
  }
  function updateOrder() {
    const p = current, price = p.prices[sel.fit];
    $("#sheet-price").textContent = rs(price);
    const link = location.href.split("#")[0] + "#p=" + p.id;
    $("#sheet-wa").href = wa(`Hi Dawn Sogni! I'd like to order this design:\n\n*${p.name}* (${p.id})\nFit: ${FIT[sel.fit] || sel.fit}\nSize: ${sel.size}\n${p.colorName ? "Colour: " + p.colorName + "\n" : ""}Price: ${rs(price)}\n\n${link}`);
    $("#sheet-chart").innerHTML = chartTable(sel.fit);
  }
  function open(id) {
    const p = byId[id]; if (!p) return;
    current = p;
    sel = { fit: firstFit(p), size: p.sizes.includes("M") ? "M" : p.sizes[0] };
    const views = [p.tee && ["tee", "Tee"], p.photo && ["model", "On model"]].filter(Boolean);
    $("#views").innerHTML = views.length > 1 ? views.map(([v, l]) => `<button class="view" type="button" role="tab" data-v="${v}">${l}</button>`).join("") : "";
    showView(views[0][0]);
    $("#sheet-code").textContent = p.id;
    $("#sheet-name").textContent = p.name;
    $("#sheet-desc").textContent = p.description || "";
    $("#sheet-colour").textContent = p.colorName ? "Colour: " + p.colorName : "";
    const fits = Object.keys(p.prices);
    $("#opt-fit").hidden = fits.length < 2;
    $("#fit-row").innerHTML = fits.map(f => `<label><input type="radio" name="fit" value="${esc(f)}" ${f === sel.fit ? "checked" : ""}><span>${FIT[f] || esc(f)} <small>${rs(p.prices[f]).replace(".00", "")}</small></span></label>`).join("");
    $("#size-row").innerHTML = p.sizes.map(s => `<label><input type="radio" name="size" value="${esc(s)}" ${s === sel.size ? "checked" : ""}><span>${esc(s)}</span></label>`).join("");
    updateOrder();
    sheet.showModal(); sheet.scrollTop = 0;
    history.replaceState(null, "", "#p=" + p.id);
  }
  document.addEventListener("click", e => { const b = e.target.closest(".card"); if (b) open(b.dataset.id); });
  $("#views").addEventListener("click", e => { const b = e.target.closest(".view"); if (b) showView(b.dataset.v); });
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

  /* ---------- music (Spotify embed) ---------- */
  const music = D.music, mBtn = $("#music-btn"), panel = $("#music-panel");
  if (!music?.spotify) { $("#music").hidden = true; return; }
  let ctrl = null, playing = false, wantPlay = false, apiLoaded = false;
  const setPlaying = v => { playing = v; mBtn.setAttribute("aria-pressed", v); mBtn.setAttribute("aria-label", v ? "Pause music" : "Play music"); };
  const showPanel = v => panel.setAttribute("aria-hidden", !v);
  function loadApi() {
    if (apiLoaded) return; apiLoaded = true;
    window.onSpotifyIframeApiReady = API => {
      API.createController($("#spotify-embed"), { uri: "spotify:track:" + music.spotify, width: "100%", height: 80 }, c => {
        ctrl = c;
        c.addListener("playback_update", e => setPlaying(!e.data.isPaused));
        c.addListener("ready", () => { if (wantPlay) c.play(); });
      });
    };
    const s = document.createElement("script"); s.src = "https://open.spotify.com/embed/iframe-api/v1"; s.async = true; document.body.appendChild(s);
  }
  mBtn.addEventListener("click", () => {
    showPanel(true);
    if (!ctrl) { wantPlay = true; loadApi(); return; }
    ctrl.togglePlay();
  });
  // panel hides itself a few seconds after playback starts; the button keeps control
  let hideT;
  mBtn.addEventListener("mouseenter", () => showPanel(true));
  $("#music").addEventListener("mouseleave", () => { clearTimeout(hideT); hideT = setTimeout(() => playing && showPanel(false), 1200); });
  new MutationObserver(() => { clearTimeout(hideT); if (playing) hideT = setTimeout(() => showPanel(false), 4000); })
    .observe(mBtn, { attributes: true, attributeFilter: ["aria-pressed"] });
})();
