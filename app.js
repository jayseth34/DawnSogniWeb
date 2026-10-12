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

  /* image or a plain colour tile until a photo is added */
  const isDark = hex => {
    const [r, g, b] = [1, 3, 5].map(i => parseInt((hex || "#eeeeee").slice(i, i + 2), 16));
    return 0.299 * r + 0.587 * g + 0.114 * b < 140;
  };
  const visual = (p, eager) => p.photo
    ? `<img src="${esc(p.photo)}" alt="${esc(p.name)} in ${esc(p.colorName)}" ${eager ? "" : 'loading="lazy"'}>`
    : `<div class="tile-empty" style="background:${esc(p.color)};color:${isDark(p.color) ? "#F7F3EC" : "#1C1830"}"><span>${esc(p.id)}</span><strong>${esc(p.name)}</strong></div>`;
  const priceLabel = p => {
    const v = Object.values(p.prices);
    return v.length > 1 ? "From " + rupee(Math.min(...v)) : rupee(v[0]);
  };
  const firstFit = p => (p.prices.regular != null ? "regular" : Object.keys(p.prices)[0]);

  /* catalogue */
  const chips = $("#chips"), dropsEl = $("#drops");
  chips.innerHTML = [{ id: "all", name: "All" }, ...D.drops].map((f, i) =>
    `<button class="chip" role="tab" type="button" data-f="${esc(f.id)}" aria-selected="${i === 0}">${esc(f.name)}</button>`).join("");

  function render(filter) {
    dropsEl.innerHTML = D.drops.filter(d => filter === "all" || d.id === filter).map(d => {
      const items = D.products.filter(p => p.drop === d.id);
      if (!items.length) return "";
      return `<div class="drop">
        <div class="drop-head"><h3>${esc(d.name)}</h3><span class="drop-date">${esc(d.date)}</span></div>
        ${d.note ? `<p class="drop-note">${esc(d.note)}</p>` : ""}
        <div class="grid">${items.map(p => `
          <button class="piece" type="button" data-id="${esc(p.id)}" aria-label="${esc(p.name)}, ${priceLabel(p)}. View details">
            <div class="tile">${visual(p)}</div>
            <div class="piece-text">
              <span><span class="piece-name">${esc(p.name)}</span><br><span class="piece-meta">${esc(p.colorName)}</span></span>
              <span class="piece-price">${priceLabel(p)}</span>
            </div>
          </button>`).join("")}</div>
      </div>`;
    }).join("");
  }
  chips.addEventListener("click", e => {
    const b = e.target.closest(".chip"); if (!b) return;
    $$(".chip", chips).forEach(c => c.setAttribute("aria-selected", c === b));
    render(b.dataset.f);
  });
  render("all");

  /* product dialog */
  const sheet = $("#sheet");
  let current = null, sel = {};
  function updateOrder() {
    const p = current, price = p.prices[sel.fit];
    $("#sheet-price").textContent = rupee(price);
    const link = location.href.split("#")[0] + "#p=" + p.id;
    $("#sheet-wa").href = wa(`Hi Dawn Sogni! I'd like to order this design:\n\n*${p.name}* (${p.id})\nFit: ${FIT[sel.fit] || sel.fit}\nSize: ${sel.size}\nColour: ${p.colorName}\nPrice: ${rupee(price)}\n\n${link}`);
  }
  function open(id) {
    const p = byId[id]; if (!p) return;
    current = p;
    sel = { fit: firstFit(p), size: p.sizes.includes("M") ? "M" : p.sizes[0] };
    $("#sheet-visual").innerHTML = visual(p, true);
    $("#sheet-drop").textContent = `${dropById[p.drop]?.name || ""} · ${p.id}`;
    $("#sheet-name").textContent = p.name;
    $("#sheet-desc").textContent = p.description || "";
    $("#sheet-colour").innerHTML = `<span class="swatch" style="background:${esc(p.color)}"></span>${esc(p.colorName)}`;
    const fits = Object.keys(p.prices);
    $("#opt-fit").hidden = fits.length < 2;
    $("#fit-row").innerHTML = fits.map(f =>
      `<label><input type="radio" name="fit" value="${esc(f)}" ${f === sel.fit ? "checked" : ""}><span>${FIT[f] || esc(f)} <small>${rupee(p.prices[f])}</small></span></label>`).join("");
    $("#size-row").innerHTML = p.sizes.map(s =>
      `<label><input type="radio" name="size" value="${esc(s)}" ${s === sel.size ? "checked" : ""}><span>${esc(s)}</span></label>`).join("");
    updateOrder();
    sheet.showModal();
    sheet.scrollTop = 0;
    history.replaceState(null, "", "#p=" + p.id);
  }
  document.addEventListener("click", e => { const b = e.target.closest(".piece"); if (b) open(b.dataset.id); });
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
})();
