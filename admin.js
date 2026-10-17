/* Dawn Sogni admin — edits products.js and images in the GitHub repo that hosts the site. */
(() => {
  const $ = s => document.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL"];
  const HEADER = `/* Dawn Sogni catalogue.\n   Edit it from admin.html, or by hand. Everything after "window.DS = " must stay valid JSON.\n   Field guide: see README.md. */\n`;

  let cfg = null, data = null, catalogSha = null;
  const pending = new Map();   // repo path -> { blob, url }
  let dirty = 0;

  /* ---------- storage ---------- */
  const keep = {
    load() { try { return JSON.parse(localStorage.getItem("ds-admin") || sessionStorage.getItem("ds-admin") || "null"); } catch (e) { return null; } },
    save(c, remember) { try { const s = JSON.stringify(c); (remember ? localStorage : sessionStorage).setItem("ds-admin", s); if (!remember) localStorage.removeItem("ds-admin"); } catch (e) {} },
    clear() { try { localStorage.removeItem("ds-admin"); sessionStorage.removeItem("ds-admin"); } catch (e) {} }
  };

  /* ---------- GitHub API ---------- */
  const b64encodeText = s => { const bytes = new TextEncoder().encode(s); let bin = ""; for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000)); return btoa(bin); };
  const b64decodeText = b => { const bin = atob(b.replace(/\s/g, "")); const bytes = Uint8Array.from(bin, c => c.charCodeAt(0)); return new TextDecoder().decode(bytes); };
  const blobToB64 = blob => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(",")[1]); r.onerror = rej; r.readAsDataURL(blob); });
  async function gh(path, opts = {}) {
    const r = await fetch(`https://api.github.com/repos/${cfg.repo}/contents/${path.split("/").map(encodeURIComponent).join("/")}${opts.method ? "" : `?ref=${encodeURIComponent(cfg.branch)}`}`, {
      method: opts.method || "GET",
      headers: { Authorization: `Bearer ${cfg.token}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", ...(opts.body ? { "Content-Type": "application/json" } : {}) },
      body: opts.body ? JSON.stringify(opts.body) : undefined
    });
    if (r.status === 404 && !opts.method) return null;
    if (!r.ok) {
      let msg = ""; try { msg = (await r.json()).message || ""; } catch (e) {}
      const hint = r.status === 401 ? "The access key is wrong or expired." : r.status === 403 ? "The access key can read your site but isn't allowed to save to it. On GitHub open Settings → Developer settings → Fine-grained tokens → your key, set Repository access to DawnSogniWeb and Permissions → Contents to \"Read and write\", click Update, then press Publish again (your changes here are kept)." : r.status === 404 ? "Repository or branch not found." : r.status === 409 ? "Someone else changed this file. Reload the admin and try again." : r.status === 422 ? "GitHub rejected the file." : "";
      throw new Error(`${hint} (GitHub ${r.status}${msg ? ": " + msg : ""})`.trim());
    }
    return r.json();
  }
  async function getFile(path) { const j = await gh(path); return j ? { sha: j.sha, text: j.content ? b64decodeText(j.content) : null } : null; }
  async function putFile(path, contentB64, message, sha) { return gh(path, { method: "PUT", body: { message, content: contentB64, branch: cfg.branch, ...(sha ? { sha } : {}) } }); }

  /* ---------- connect ---------- */
  const saved = keep.load();
  if (saved) { $("#token").value = saved.token; $("#repo").value = saved.repo; $("#branch").value = saved.branch; }
  $("#connect-form").addEventListener("submit", async e => {
    e.preventDefault(); $("#connect-error").textContent = "";
    cfg = { token: $("#token").value.trim(), repo: $("#repo").value.trim(), branch: $("#branch").value.trim() };
    const btn = e.submitter; btn.disabled = true; btn.textContent = "Connecting…";
    try {
      const f = await getFile("products.js");
      if (!f) throw new Error("products.js wasn't found on that branch.");
      const m = f.text.match(/window\.DS\s*=\s*(\{[\s\S]*\});?\s*$/);
      if (!m) throw new Error("products.js isn't in the format the admin expects.");
      data = JSON.parse(m[1]); catalogSha = f.sha;
      data.products ||= []; data.gallery ||= []; data.drops ||= []; data.sizeCharts ||= {};
      keep.save(cfg, $("#remember").checked);
      $("#connect").hidden = true; $("#tabs").hidden = false; $("#publish").hidden = false;
      showTab("products"); renderAll();
    } catch (err) { $("#connect-error").textContent = err.message; }
    btn.disabled = false; btn.textContent = "Connect";
  });

  /* ---------- tabs / dirty ---------- */
  function showTab(t) {
    $$("#tabs button").forEach(b => b.setAttribute("aria-selected", b.dataset.tab === t));
    ["products", "gallery", "settings"].forEach(x => ($(`#tab-${x}`).hidden = x !== t));
  }
  $("#tabs").addEventListener("click", e => { const b = e.target.closest("[data-tab]"); if (b) showTab(b.dataset.tab); });
  function markDirty() { dirty++; $("#dirty").hidden = false; $("#dirty").textContent = "Unpublished changes"; }
  addEventListener("beforeunload", e => { if (dirty) { e.preventDefault(); e.returnValue = ""; } });

  const imgUrl = path => pending.get(path)?.url || (/^https?:/.test(path) ? path : path + "?t=" + Date.now().toString(36).slice(0, 5));

  function renderAll() { renderProducts(); renderGallery(); renderSettings(); }

  /* ---------- products list ---------- */
  function renderProducts() {
    const L = data.products; $("#p-count").textContent = `(${L.length})`;
    $("#p-list").innerHTML = L.length ? L.map((p, i) => `
      <li class="item" data-i="${i}">
        <img src="${esc(imgUrl(p.tee))}" alt="">
        <div><b>${esc(p.name)}${pending.has(p.tee) ? '<span class="new">new image</span>' : ""}</b>
          <small>${esc(p.id)} · ${Object.entries(p.prices).map(([f, v]) => `${f} Rs. ${v}`).join(" / ")} · ${esc(p.sizes.join(" "))}</small></div>
        <div class="acts">
          <button type="button" data-a="up" ${i === 0 ? "disabled" : ""} aria-label="Move up">↑</button>
          <button type="button" data-a="down" ${i === L.length - 1 ? "disabled" : ""} aria-label="Move down">↓</button>
          <button type="button" data-a="edit">Edit</button>
          <button type="button" data-a="del" class="del">Delete</button>
        </div>
      </li>`).join("") : `<li class="empty">No products yet. Add your first one.</li>`;
  }
  $("#p-list").addEventListener("click", e => {
    const b = e.target.closest("button[data-a]"); if (!b) return; const i = +b.closest(".item").dataset.i, L = data.products;
    if (b.dataset.a === "up" && i > 0) [L[i - 1], L[i]] = [L[i], L[i - 1]];
    else if (b.dataset.a === "down" && i < L.length - 1) [L[i + 1], L[i]] = [L[i], L[i + 1]];
    else if (b.dataset.a === "edit") return openProduct(i);
    else if (b.dataset.a === "del") { if (!confirm(`Delete "${L[i].name}" from the site?`)) return; L.splice(i, 1); }
    markDirty(); renderProducts();
  });

  /* ---------- image processing ---------- */
  const loadImg = src => new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => rej(new Error("That image couldn't be read.")); im.src = src; });
  const toBlob = (c, type, q) => new Promise(res => c.toBlob(res, type, q));
  // Tee: trim empty edges, centre on a transparent 1000×1000 square, export WebP (PNG if the browser can't).
  async function processTee(file) {
    const url = URL.createObjectURL(file), im = await loadImg(url); URL.revokeObjectURL(url);
    const w = im.naturalWidth, h = im.naturalHeight;
    const c0 = document.createElement("canvas"); c0.width = w; c0.height = h; const g0 = c0.getContext("2d"); g0.drawImage(im, 0, 0);
    const px = g0.getImageData(0, 0, w, h).data;
    let x0 = w, y0 = h, x1 = -1, y1 = -1, transparent = 0;
    for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) { const a = px[(y * w + x) * 4 + 3]; if (a < 250) transparent++; if (a > 20) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } }
    const hasAlpha = transparent > (w * h / 4) * 0.05;
    if (!hasAlpha || x1 < 0) { x0 = 0; y0 = 0; x1 = w - 1; y1 = h - 1; }
    const bw = x1 - x0 + 1, bh = y1 - y0 + 1, S = 1000, fit = S * 0.9 / Math.max(bw, bh);
    const c = document.createElement("canvas"); c.width = c.height = S; const g = c.getContext("2d"); g.imageSmoothingQuality = "high";
    g.drawImage(c0, x0, y0, bw, bh, (S - bw * fit) / 2, (S - bh * fit) / 2, bw * fit, bh * fit);
    let blob = await toBlob(c, "image/webp", 0.88); let ext = "webp";
    if (!blob || blob.type !== "image/webp") { blob = await toBlob(c, "image/png"); ext = "png"; }
    return { blob, ext, hasAlpha };
  }
  // small card image with the glow baked in (the shop shows these on the cards)
  async function makeThumb(blob) {
    const url = URL.createObjectURL(blob), im = await loadImg(url); URL.revokeObjectURL(url);
    const S = 560, c = document.createElement("canvas"); c.width = c.height = S; const g = c.getContext("2d");
    g.shadowColor = "rgba(255,255,255,.42)"; g.shadowBlur = 18; g.drawImage(im, 0, 0, S, S);
    g.shadowBlur = 0; g.shadowColor = "transparent"; g.drawImage(im, 0, 0, S, S);
    let t = await toBlob(c, "image/webp", 0.8); if (!t || t.type !== "image/webp") t = await toBlob(c, "image/png");
    return t;
  }
  async function processArt(file) {
    const url = URL.createObjectURL(file), im = await loadImg(url); URL.revokeObjectURL(url);
    const sc = Math.min(1, 1600 / Math.max(im.naturalWidth, im.naturalHeight));
    const c = document.createElement("canvas"); c.width = Math.round(im.naturalWidth * sc); c.height = Math.round(im.naturalHeight * sc);
    c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
    let blob = await toBlob(c, "image/webp", 0.86); let ext = "webp";
    if (!blob || blob.type !== "image/webp") { blob = await toBlob(c, "image/jpeg", 0.88); ext = "jpg"; }
    return { blob, ext };
  }
  const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "item";
  const stamp = () => Date.now().toString(36);
  function stage(path, blob) { const url = URL.createObjectURL(blob); pending.set(path, { blob, url }); return path; }

  /* ---------- product editor ---------- */
  const pe = $("#p-editor"); let editIdx = -1, draft = null;
  $("#p-sizes").innerHTML = SIZES.map(s => `<label><input type="checkbox" value="${s}"> ${s}</label>`).join("");
  function nextId() { let n = 1; const ids = new Set(data.products.map(p => p.id)); while (ids.has(`DS-${String(n).padStart(2, "0")}`)) n++; return `DS-${String(n).padStart(2, "0")}`; }
  const SIDES = ["front", "back"], other = s => (s === "front" ? "back" : "front");
  // older products only have tee (+ teeFront): turn them into front/back + cover
  function normalise(p) {
    if (p.front || p.back) { p.cover ||= p.back ? "back" : "front"; return p; }
    const side = p.print === "front" ? "front" : "back";
    if (p.tee) p[side] = p.tee;
    if (p.teeFront && p.teeFront !== p.tee) p[other(side)] = p.teeFront;
    p.cover = side; return p;
  }
  function refreshSides() {
    for (const s of SIDES) {
      const path = draft[s], img = $(`#p-${s}-prev`);
      img.hidden = !path; $(`#p-${s}-hint`).hidden = !!path; if (path) img.src = imgUrl(path);
      $(`#p-${s}-clear`).hidden = !path; $(`#p-${s}-change`).hidden = !path;
      const radio = $(`input[name="cover"][value="${s}"]`); radio.disabled = !path;
    }
    if (!draft[draft.cover]) draft.cover = draft.front ? "front" : draft.back ? "back" : "back";
    $$('input[name="cover"]').forEach(r => (r.checked = r.value === draft.cover));
    $$(".img-field[data-side]").forEach(f => f.classList.toggle("is-cover", f.dataset.side === draft.cover && !!draft[draft.cover]));
    for (const s of SIDES) {
      const dot = $(`#p-${s}-dot`), show = s === draft.cover && !!draft[s]; dot.hidden = !show;
      if (show) { const [fx, fy] = (draft.printFocus || "50% 45%").split(" ").map(parseFloat); dot.style.left = fx + "%"; dot.style.top = fy + "%"; }
    }
  }
  function openProduct(i) {
    editIdx = i; const p = i >= 0 ? data.products[i] : null;
    draft = p ? normalise(JSON.parse(JSON.stringify(p))) : { id: nextId(), name: "", description: "", colorName: "", cover: "back", prices: { regular: 999, oversized: 1099 }, sizes: ["S", "M", "L", "XL", "XXL"], printFocus: "50% 45%" };
    $("#p-title").textContent = p ? `Edit ${p.name}` : "New product";
    $("#p-name").value = draft.name; $("#p-id").value = draft.id; $("#p-desc").value = draft.description || ""; $("#p-colour").value = draft.colorName || "";
    $("#p-reg-on").checked = draft.prices.regular != null; $("#p-reg").value = draft.prices.regular ?? 999;
    $("#p-ovr-on").checked = draft.prices.oversized != null; $("#p-ovr").value = draft.prices.oversized ?? 1099;
    $$("#p-sizes input").forEach(cb => (cb.checked = draft.sizes.includes(cb.value)));
    $("#p-tee-warn").hidden = true; $("#p-error").textContent = "";
    refreshSides();
    pe.showModal(); $("#p-name").focus();
  }
  $("#p-add").addEventListener("click", () => openProduct(-1));
  $("#p-cancel").addEventListener("click", () => pe.close());
  for (const s of SIDES) {
    $(`#p-${s}-drop`).addEventListener("click", e => {
      if (draft[s] && e.target.id === `p-${s}-prev`) {
        if (draft.cover !== s) { draft.cover = s; draft.printFocus = "50% 45%"; return refreshSides(); } // clicking a side makes it the card image
        const r = e.currentTarget.getBoundingClientRect();
        draft.printFocus = `${Math.round((e.clientX - r.left) / r.width * 100)}% ${Math.round((e.clientY - r.top) / r.height * 100)}%`;
        return refreshSides();
      }
      $(`#p-${s}`).click();
    });
    $(`#p-${s}-change`).addEventListener("click", () => $(`#p-${s}`).click());
    $(`#p-${s}-clear`).addEventListener("click", () => { delete draft[s]; refreshSides(); });
    $(`#p-${s}`).addEventListener("change", async e => {
      const f = e.target.files[0]; if (!f) return; e.target.value = "";
      try {
        const r = await processTee(f);
        const name = `tee-${slug($("#p-id").value || draft.id)}-${s}-${stamp()}.${r.ext}`;
        draft[s] = stage(`images/${name}`, r.blob);
        stage(`images/thumb/${name}`, await makeThumb(r.blob));
        $("#p-tee-warn").hidden = r.hasAlpha;
        if (!draft[other(s)]) draft.cover = s;
        if (draft.cover === s) draft.printFocus = "50% 45%";
        refreshSides();
      } catch (err) { $("#p-error").textContent = err.message; }
    });
  }
  $$('input[name="cover"]').forEach(r => r.addEventListener("change", () => { draft.cover = r.value; draft.printFocus = "50% 45%"; refreshSides(); }));
  $$(".drop").forEach(d => d.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); d.click(); } }));
  $("#p-form").addEventListener("submit", e => {
    e.preventDefault(); const err = $("#p-error");
    const name = $("#p-name").value.trim(), id = $("#p-id").value.trim().toUpperCase();
    const sizes = $$("#p-sizes input:checked").map(c => c.value);
    const prices = {};
    if ($("#p-reg-on").checked) prices.regular = Math.round(+$("#p-reg").value);
    if ($("#p-ovr-on").checked) prices.oversized = Math.round(+$("#p-ovr").value);
    if (!name) return (err.textContent = "Give the product a name.");
    if (!/^[A-Z0-9-]+$/.test(id)) return (err.textContent = "Code can only use letters, numbers and dashes.");
    if (data.products.some((p, k) => p.id === id && k !== editIdx)) return (err.textContent = `Another product already uses the code ${id}.`);
    if (!Object.keys(prices).length || Object.values(prices).some(v => !(v > 0))) return (err.textContent = "Turn on at least one fit and give it a price above 0.");
    if (!sizes.length) return (err.textContent = "Pick at least one size.");
    if (!draft.front && !draft.back) return (err.textContent = "Add a front or back image.");
    const cover = draft[draft.cover] ? draft.cover : (draft.front ? "front" : "back");
    Object.assign(draft, { id, name, description: $("#p-desc").value.trim(), colorName: $("#p-colour").value.trim(), prices, sizes, cover, print: cover });
    // keep the older fields the shop also reads
    draft.tee = draft[cover]; if (draft[other(cover)]) draft.teeFront = draft[other(cover)]; else delete draft.teeFront;
    SIDES.forEach(s => { if (!draft[s]) delete draft[s]; });
    if (!draft.colorName) delete draft.colorName;
    if (editIdx >= 0) data.products[editIdx] = draft; else data.products.push(draft);
    pe.close(); markDirty(); renderProducts();
  });

  /* ---------- gallery ---------- */
  function renderGallery() {
    const L = data.gallery; $("#g-count").textContent = `(${L.length})`;
    $("#g-list").innerHTML = L.length ? L.map((a, i) => `
      <li class="item" data-i="${i}">
        <img src="${esc(imgUrl(a.src))}" alt="">
        <div><b>${esc(a.title)}${pending.has(a.src) ? '<span class="new">new image</span>' : ""}</b><small>${esc([a.artist, a.year].filter(Boolean).join(", "))}</small></div>
        <div class="acts">
          <button type="button" data-a="up" ${i === 0 ? "disabled" : ""} aria-label="Move up">↑</button>
          <button type="button" data-a="down" ${i === L.length - 1 ? "disabled" : ""} aria-label="Move down">↓</button>
          <button type="button" data-a="edit">Edit</button>
          <button type="button" data-a="del" class="del">Delete</button>
        </div>
      </li>`).join("") : `<li class="empty">The gallery is empty, so it's hidden on the site.</li>`;
  }
  $("#g-list").addEventListener("click", e => {
    const b = e.target.closest("button[data-a]"); if (!b) return; const i = +b.closest(".item").dataset.i, L = data.gallery;
    if (b.dataset.a === "up" && i > 0) [L[i - 1], L[i]] = [L[i], L[i - 1]];
    else if (b.dataset.a === "down" && i < L.length - 1) [L[i + 1], L[i]] = [L[i], L[i + 1]];
    else if (b.dataset.a === "edit") return openArt(i);
    else if (b.dataset.a === "del") { if (!confirm(`Remove "${L[i].title}" from the gallery?`)) return; L.splice(i, 1); }
    markDirty(); renderGallery();
  });
  const ge = $("#g-editor"); let gIdx = -1, gDraft = null;
  function gPreview() { const has = !!gDraft.src; $("#g-prev").hidden = !has; $("#g-hint").hidden = has; if (has) $("#g-prev").src = imgUrl(gDraft.src); }
  function openArt(i) {
    gIdx = i; gDraft = i >= 0 ? { ...data.gallery[i] } : { src: "", title: "", artist: "", year: "", credit: "", link: "" };
    $("#g-title").textContent = i >= 0 ? "Edit artwork" : "New artwork";
    $("#g-url").value = /^https?:/.test(gDraft.src) ? gDraft.src : "";
    ["name:title", "artist:artist", "year:year", "credit:credit", "link:link"].forEach(k => { const [f, key] = k.split(":"); $(`#g-${f}`).value = gDraft[key] || ""; });
    $("#g-error").textContent = ""; gPreview(); ge.showModal();
  }
  $("#g-add").addEventListener("click", () => openArt(-1));
  $("#g-cancel").addEventListener("click", () => ge.close());
  $("#g-drop").addEventListener("click", () => $("#g-file").click());
  $("#g-file").addEventListener("change", async e => {
    const f = e.target.files[0]; if (!f) return; e.target.value = "";
    try { const r = await processArt(f); gDraft.src = stage(`images/gallery/${slug($("#g-name").value || f.name.replace(/\.\w+$/, ""))}-${stamp()}.${r.ext}`, r.blob); $("#g-url").value = ""; gPreview(); }
    catch (err) { $("#g-error").textContent = err.message; }
  });
  $("#g-url").addEventListener("change", () => { const u = $("#g-url").value.trim(); if (u) { gDraft.src = u; gPreview(); } });
  $("#g-form").addEventListener("submit", e => {
    e.preventDefault();
    const u = $("#g-url").value.trim(); if (u) gDraft.src = u;
    if (!gDraft.src) return ($("#g-error").textContent = "Add an image or an image link.");
    const title = $("#g-name").value.trim(); if (!title) return ($("#g-error").textContent = "Give the artwork a title.");
    Object.assign(gDraft, { title, artist: $("#g-artist").value.trim(), year: $("#g-year").value.trim(), credit: $("#g-credit").value.trim(), link: $("#g-link").value.trim() });
    Object.keys(gDraft).forEach(k => { if (gDraft[k] === "") delete gDraft[k]; });
    if (gIdx >= 0) data.gallery[gIdx] = gDraft; else data.gallery.push(gDraft);
    ge.close(); markDirty(); renderGallery();
  });

  /* ---------- settings ---------- */
  function renderSettings() {
    $("#s-wa").value = data.whatsapp || ""; $("#s-ig").value = data.instagram || "";
    $("#s-charts").innerHTML = Object.entries(data.sizeCharts).map(([fit, c]) => `
      <fieldset class="chart-box" data-fit="${esc(fit)}"><legend>${esc(fit === "regular" ? "Regular fit" : fit === "oversized" ? "Oversized fit" : fit)}</legend>
        <div class="form">
          <label>Title<input data-k="title" value="${esc(c.title)}"></label>
          <label>Columns after "Size" (separate with |)<input data-k="columns" value="${esc(c.columns.join(" | "))}"></label>
          <label>Rows<textarea class="chart" data-k="rows" rows="6">${esc(c.rows.map(r => r.join(" | ")).join("\n"))}</textarea></label>
        </div>
      </fieldset>`).join("");
  }
  $("#s-form").addEventListener("submit", e => {
    e.preventDefault();
    data.whatsapp = $("#s-wa").value.replace(/\D/g, ""); data.instagram = $("#s-ig").value.trim().replace(/^@/, "");
    $$("#s-charts fieldset").forEach(fs => {
      const c = data.sizeCharts[fs.dataset.fit];
      c.title = fs.querySelector('[data-k="title"]').value.trim();
      c.columns = fs.querySelector('[data-k="columns"]').value.split("|").map(s => s.trim()).filter(Boolean);
      c.rows = fs.querySelector('[data-k="rows"]').value.split("\n").map(l => l.split("|").map(s => s.trim())).filter(r => r[0]);
    });
    markDirty(); e.submitter.textContent = "Applied. Now publish"; setTimeout(() => (e.submitter.textContent = "Apply settings"), 2500);
  });

  /* ---------- publish ---------- */
  const pub = $("#pub"), log = (msg, cls) => { const li = document.createElement("li"); li.textContent = msg; if (cls) li.className = cls; $("#pub-log").appendChild(li); return li; };
  $("#publish").addEventListener("click", async () => {
    $("#pub-log").innerHTML = ""; $("#pub-title").textContent = "Publishing…"; $("#pub-close").hidden = true; pub.showModal();
    const btn = $("#publish"); btn.disabled = true;
    try {
      // only upload images that are still used
      const used = new Set([...data.products.flatMap(p => [p.tee, p.teeFront, p.front, p.back]), ...data.gallery.map(a => a.src)]);
      for (const u of [...used]) if (u && u.startsWith("images/")) used.add(u.replace(/^images\//, "images/thumb/"));
      // safety net: any product image that has no small card version yet gets one now
      for (const p of data.products) for (const src of [p.front, p.back, p.tee, p.teeFront]) {
        if (!src || !src.startsWith("images/") || src.startsWith("images/thumb/")) continue;
        const t = src.replace(/^images\//, "images/thumb/");
        if (pending.has(t)) continue;
        let exists = false;
        try { exists = (await fetch(t + "?check=" + Date.now(), { method: "HEAD", cache: "no-store" })).ok; } catch (e) {}
        if (exists) continue;
        try {
          const full = pending.get(src)?.blob || await (await fetch(src, { cache: "no-store" })).blob();
          stage(t, await makeThumb(full)); used.add(t);
        } catch (e) {}
      }
      for (const [path, { blob }] of pending) {
        if (!used.has(path)) { pending.delete(path); continue; }
        const li = log(`Uploading ${path.split("/").pop()}…`);
        await putFile(path, await blobToB64(blob), `Admin: add ${path}`);
        li.textContent = `Uploaded ${path.split("/").pop()}`; li.className = "ok"; pending.delete(path);
      }
      let li = log("Saving catalogue…");
      const text = HEADER + "window.DS = " + JSON.stringify(data, null, 2) + ";\n";
      let res;
      try { res = await putFile("products.js", b64encodeText(text), "Admin: update catalogue", catalogSha); }
      catch (err) { if (!/409|sha/i.test(err.message)) throw err; const f = await getFile("products.js"); res = await putFile("products.js", b64encodeText(text), "Admin: update catalogue", f.sha); }
      catalogSha = res.content.sha; li.textContent = "Catalogue saved"; li.className = "ok";
      // bump the version tag so visitors get the new catalogue straight away
      li = log("Refreshing the site's cache tag…");
      const idx = await getFile("index.html"), v = new Date().toISOString().replace(/\D/g, "").slice(0, 12);
      const html = idx.text.replace(/products\.js\?v=\d+/, `products.js?v=${v}`);
      if (html !== idx.text) await putFile("index.html", b64encodeText(html), "Admin: refresh cache tag", idx.sha);
      li.textContent = "Cache tag refreshed"; li.className = "ok";
      dirty = 0; $("#dirty").hidden = true;
      $("#pub-title").textContent = "Published";
      log("The live site updates in about a minute.", "ok");
      renderAll();
    } catch (err) { log(err.message, "err"); $("#pub-title").textContent = "Publishing stopped"; log("Nothing is lost here. Fix the problem and press Publish again.", ""); }
    btn.disabled = false; $("#pub-close").hidden = false;
  });
  $("#pub-close").addEventListener("click", () => pub.close());
})();
