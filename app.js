/* Dawn Sogni — catalogue + WhatsApp ordering */
(() => {
  const D = window.DS;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const rupee = n => "₹" + Number(n).toLocaleString("en-IN");
  const FIT = { regular: "Regular", oversized: "Oversized" };
  const dropById = Object.fromEntries(D.drops.map(d => [d.id, d]));
  const byId = Object.fromEntries(D.products.map(p => [p.id, p]));

  /* WhatsApp */
  const wa = t => `https://wa.me/${D.whatsapp}?text=${encodeURIComponent(t)}`;
  const WA_TEXT = {
    general: "Hi Dawn Sogni! I'd like to know more about your designs.",
    custom: "Hi Dawn Sogni! I have my own design I'd like printed. I'll attach the file here.\n\nGarment (tee / polo / print only):\nSize:\nPrint size on the garment:"
  };
  $$("[data-wa]").forEach(a => (a.href = wa(WA_TEXT[a.dataset.wa])));
  $("#ig-link").href = `https://instagram.com/${D.instagram}`;
  $("#year").textContent = "© " + new Date().getFullYear();

  /* cards */
  const visual = (p, eager) => p.photo
    ? `<img src="${esc(p.photo)}" alt="${esc(p.name)}" ${eager ? "" : 'loading="lazy"'}>`
    : "";
  const priceLabel = p => {
    const v = Object.values(p.prices || {});
    if (!v.length) return "";
    return v.length > 1 ? "From " + rupee(Math.min(...v)) : rupee(v[0]);
  };
  const firstFit = p => (p.prices.regular != null ? "regular" : Object.keys(p.prices)[0]);
  const card = p => `
    <button class="piece" type="button" data-id="${esc(p.id)}" aria-label="${esc(p.name)}, ${priceLabel(p)}. View details">
      <div class="tile">${visual(p)}</div>
      <div class="piece-text">
        <span><span class="piece-name">${esc(p.name)}</span>${p.colorName ? `<br><span class="piece-meta">${esc(p.colorName)}</span>` : ""}</span>
        <span class="piece-price">${priceLabel(p)}</span>
      </div>
    </button>`;

  const chips = $("#chips"), dropsEl = $("#drops");
  const useDrops = D.drops.length > 0 && D.products.some(p => p.drop);
  if (useDrops && D.drops.length > 1) {
    chips.innerHTML = [{ id: "all", name: "All" }, ...D.drops].map((f, i) =>
      `<button class="chip" role="tab" type="button" data-f="${esc(f.id)}" aria-selected="${i === 0}">${esc(f.name)}</button>`).join("");
  }

  function render(filter) {
    if (!D.products.length) {
      dropsEl.innerHTML = `<div class="empty">
        <h3>New designs are on their way</h3>
        <p>Message us on WhatsApp to hear first when they drop, or to get your own artwork printed.</p>
        <a class="btn btn-ink" href="${wa(WA_TEXT.general)}" target="_blank" rel="noopener">Message on WhatsApp</a>
      </div>`;
      return;
    }
    if (!useDrops) { dropsEl.innerHTML = `<div class="grid">${D.products.map(card).join("")}</div>`; return; }
    const groups = D.drops.filter(d => filter === "all" || d.id === filter)
      .map(d => ({ d, items: D.products.filter(p => p.drop === d.id) }));
    const loose = D.products.filter(p => !dropById[p.drop]);
    if (filter === "all" && loose.length) groups.push({ d: { name: "More designs" }, items: loose });
    dropsEl.innerHTML = groups.filter(g => g.items.length).map(({ d, items }) => `
      <div class="drop">
        <div class="drop-head"><h3>${esc(d.name)}</h3>${d.date ? `<span class="drop-date">${esc(d.date)}</span>` : ""}</div>
        ${d.note ? `<p class="drop-note">${esc(d.note)}</p>` : ""}
        <div class="grid">${items.map(card).join("")}</div>
      </div>`).join("");
  }
  chips.addEventListener("click", e => {
    const b = e.target.closest(".chip"); if (!b) return;
    $$(".chip", chips).forEach(c => c.setAttribute("aria-selected", c === b));
    render(b.dataset.f);
  });
  render("all");

  /* size charts */
  const chartTable = fit => {
    const c = D.sizeCharts?.[fit]; if (!c) return "";
    return `<table class="size-table"><caption>${esc(c.title)}</caption>
      <thead><tr><th scope="col">Size</th>${c.columns.map(x => `<th scope="col">${esc(x)}</th>`).join("")}</tr></thead>
      <tbody>${c.rows.map(r => `<tr><th scope="row">${esc(r[0])}</th>${r.slice(1).map(v => `<td>${esc(v)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
  };
  $("#size-tables").innerHTML = Object.keys(D.sizeCharts || {}).map(chartTable).join("");

  /* product dialog */
  const sheet = $("#sheet");
  let current = null, sel = {};
  function updateOrder() {
    const p = current, price = p.prices[sel.fit];
    $("#sheet-price").textContent = rupee(price);
    const link = location.href.split("#")[0] + "#p=" + p.id;
    $("#sheet-wa").href = wa(`Hi Dawn Sogni! I'd like to order this design:\n\n*${p.name}* (${p.id})\nFit: ${FIT[sel.fit] || sel.fit}\nSize: ${sel.size}\n${p.colorName ? "Colour: " + p.colorName + "\n" : ""}Price: ${rupee(price)}\n\n${link}`);
  }
  function open(id) {
    const p = byId[id]; if (!p) return;
    current = p;
    sel = { fit: firstFit(p), size: p.sizes.includes("M") ? "M" : p.sizes[0] };
    $("#sheet-visual").innerHTML = visual(p, true);
    $("#sheet-drop").textContent = [dropById[p.drop]?.name, p.id].filter(Boolean).join(", ");
    $("#sheet-name").textContent = p.name;
    $("#sheet-desc").textContent = p.description || "";
    $("#sheet-colour").textContent = p.colorName ? "Colour: " + p.colorName : "";
    const fits = Object.keys(p.prices);
    $("#opt-fit").hidden = fits.length < 2;
    $("#fit-row").innerHTML = fits.map(f =>
      `<label><input type="radio" name="fit" value="${esc(f)}" ${f === sel.fit ? "checked" : ""}><span>${FIT[f] || esc(f)} <small>${rupee(p.prices[f])}</small></span></label>`).join("");
    $("#size-row").innerHTML = p.sizes.map(s =>
      `<label><input type="radio" name="size" value="${esc(s)}" ${s === sel.size ? "checked" : ""}><span>${esc(s)}</span></label>`).join("");
    updateOrder();
    $("#sheet-chart").innerHTML = chartTable(sel.fit);
    sheet.showModal();
    sheet.scrollTop = 0;
    history.replaceState(null, "", "#p=" + p.id);
  }
  document.addEventListener("click", e => { const b = e.target.closest(".piece"); if (b) open(b.dataset.id); });
  $("#sheet-close").addEventListener("click", () => sheet.close());
  sheet.addEventListener("click", e => { if (e.target === sheet) sheet.close(); });
  sheet.addEventListener("close", () => history.replaceState(null, "", location.pathname + location.search));
  sheet.addEventListener("change", e => {
    if (e.target.name === "fit") { sel.fit = e.target.value; $("#sheet-chart").innerHTML = chartTable(sel.fit); }
    if (e.target.name === "size") sel.size = e.target.value;
    updateOrder();
  });
  const m = location.hash.match(/^#p=(.+)$/);
  if (m) open(decodeURIComponent(m[1]));
})();
