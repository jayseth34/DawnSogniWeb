/* Admin → Analytics: reads Google Analytics after signing in with Google.
   Nothing is public: the page asks Google for the numbers only with the signed-in account's own permission.
   Needs gaClientId (Google OAuth web client) and gaPropertyId (the number, not the G- code) in products.js,
   both set in Admin → Settings. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const box = $("#ga"); if (!box) return;
  const SCOPE = "https://www.googleapis.com/auth/analytics.readonly";
  const API = "https://analyticsdata.googleapis.com/v1beta/properties/";
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmt = n => Number(n || 0).toLocaleString("en-IN");
  let cfg = null, token = null, days = 7, tokenClient = null;

  const say = html => { $(".ga-body", box).innerHTML = `<p class="muted ga-msg">${html}</p>`; };
  try { const t = JSON.parse(sessionStorage.getItem("ds-ga-token") || "null"); if (t && t.exp > Date.now() + 60000) token = t.v; } catch (e) {}

  async function config() {
    const txt = await (await fetch("products.js?ga=" + Date.now(), { cache: "no-store" })).text();
    const D = JSON.parse(txt.slice(txt.lastIndexOf("window.DS = ") + 12).trim().replace(/;$/, ""));
    return { client: D.gaClientId || "", property: String(D.gaPropertyId || "").replace(/\D/g, "") };
  }
  function loadGIS() {
    return new Promise((ok, no) => {
      if (window.google && google.accounts && google.accounts.oauth2) return ok();
      const s = document.createElement("script"); s.src = "https://accounts.google.com/gsi/client"; s.async = true;
      s.onload = ok; s.onerror = () => no(new Error("Couldn't reach Google sign-in. Check your connection.")); document.head.append(s);
    });
  }
  async function signIn() {
    await loadGIS();
    tokenClient = tokenClient || google.accounts.oauth2.initTokenClient({
      client_id: cfg.client, scope: SCOPE,
      callback: r => {
        if (r.error) return say(`Sign-in didn't finish (${esc(r.error)}). Try again.`);
        token = r.access_token;
        try { sessionStorage.setItem("ds-ga-token", JSON.stringify({ v: token, exp: Date.now() + (r.expires_in - 60) * 1000 })); } catch (e) {}
        load();
      }
    });
    tokenClient.requestAccessToken();
  }
  async function report(body, realtime) {
    const r = await fetch(API + cfg.property + (realtime ? ":runRealtimeReport" : ":runReport"), {
      method: "POST", headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" }, body: JSON.stringify(body)
    });
    const j = await r.json();
    if (r.status === 401) { token = null; try { sessionStorage.removeItem("ds-ga-token"); } catch (e) {} throw new Error("signin"); }
    if (!r.ok) throw new Error((j.error && j.error.message) || "Google Analytics returned an error.");
    return (j.rows || []).map(row => ({ d: (row.dimensionValues || []).map(v => v.value), m: (row.metricValues || []).map(v => +v.value) }));
  }
  const range = () => [{ startDate: days + "daysAgo", endDate: "today" }];

  async function load() {
    say("Loading…");
    try {
      const [tot, daily, src, city, dev, ev, items, live] = await Promise.all([
        report({ dateRanges: range(), metrics: [{ name: "activeUsers" }, { name: "newUsers" }, { name: "sessions" }, { name: "screenPageViews" }, { name: "averageSessionDuration" }] }),
        report({ dateRanges: range(), dimensions: [{ name: "date" }], metrics: [{ name: "activeUsers" }], orderBys: [{ dimension: { dimensionName: "date" } }] }),
        report({ dateRanges: range(), dimensions: [{ name: "sessionSource" }], metrics: [{ name: "sessions" }], orderBys: [{ metric: { metricName: "sessions" }, desc: true }], limit: 8 }),
        report({ dateRanges: range(), dimensions: [{ name: "city" }], metrics: [{ name: "activeUsers" }], orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }], limit: 8 }),
        report({ dateRanges: range(), dimensions: [{ name: "deviceCategory" }], metrics: [{ name: "activeUsers" }], orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }] }),
        report({ dateRanges: range(), dimensions: [{ name: "eventName" }], metrics: [{ name: "eventCount" }],
          dimensionFilter: { filter: { fieldName: "eventName", inListFilter: { values: ["view_item", "add_to_cart", "whatsapp_order", "open_design_studio", "studio_order"] } } } }),
        report({ dateRanges: range(), dimensions: [{ name: "itemName" }], metrics: [{ name: "itemsViewed" }, { name: "itemsAddedToCart" }], orderBys: [{ metric: { metricName: "itemsViewed" }, desc: true }], limit: 10 }).catch(() => []),
        report({ metrics: [{ name: "activeUsers" }] }, true).catch(() => [])
      ]);
      render({ tot: (tot[0] || { m: [0, 0, 0, 0, 0] }).m, daily, src, city, dev, ev, items, live: live[0] ? live[0].m[0] : 0 });
    } catch (e) {
      if (e.message === "signin") return showSignIn("Your Google sign-in has expired.");
      say(esc(e.message) + (/permission|PERMISSION/.test(e.message) ? "<br>Sign in with the Google account that owns the Dawn Sogni Analytics property." : ""));
    }
  }

  // visitors per day: one line, hover a day to read it
  function lineChart(rows) {
    if (!rows.length) return `<p class="muted">No visits in this period yet.</p>`;
    const byDay = new Map(rows.map(r => [r.d[0], r.m[0]])), pts = [];
    for (let i = days; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); const k = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`; pts.push({ k, d, v: byDay.get(k) || 0 }); }
    const W = 640, H = 200, L = 34, R = 10, T = 12, B = 26, max = Math.max(4, ...pts.map(p => p.v));
    const top = Math.ceil(max / 4) * 4, x = i => L + (W - L - R) * (pts.length < 2 ? .5 : i / (pts.length - 1)), y = v => T + (H - T - B) * (1 - v / top);
    const path = pts.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(p.v).toFixed(1)}`).join("");
    const grid = [0, .5, 1].map(f => `<line x1="${L}" x2="${W - R}" y1="${y(top * f)}" y2="${y(top * f)}" class="g"/><text x="${L - 6}" y="${y(top * f) + 4}" text-anchor="end">${fmt(top * f)}</text>`).join("");
    const lab = d => d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    const ticks = [0, Math.floor((pts.length - 1) / 2), pts.length - 1].map(i => `<text x="${x(i)}" y="${H - 6}" text-anchor="${i ? (i === pts.length - 1 ? "end" : "middle") : "start"}">${lab(pts[i].d)}</text>`).join("");
    const hits = pts.map((p, i) => `<rect class="hit" x="${x(i) - (W - L - R) / pts.length / 2}" y="${T}" width="${(W - L - R) / pts.length}" height="${H - T - B}" data-i="${i}" data-t="${esc(lab(p.d))}: ${fmt(p.v)} visitor${p.v === 1 ? "" : "s"}"/>`).join("");
    return `<div class="ga-line"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Visitors per day">${grid}<path d="${path}" class="ln"/>${ticks}<line class="xh" y1="${T}" y2="${H - B}" x1="-10" x2="-10"/><circle class="dot" r="4.5" cx="-10" cy="-10"/>${hits}</svg><div class="ga-tip" hidden></div></div>`;
  }
  // ranked list with a thin bar per row
  const bars = (rows, label = r => r.d[0], val = r => r.m[0]) => {
    if (!rows.length) return `<p class="muted">Nothing yet.</p>`;
    const max = Math.max(...rows.map(val)) || 1;
    return `<ol class="ga-bars">${rows.map(r => `<li><span class="nm">${esc(label(r) || "(not set)")}</span><span class="bar"><i style="width:${(val(r) / max * 100).toFixed(1)}%"></i></span><b>${fmt(val(r))}</b></li>`).join("")}</ol>`;
  };
  const SRC = s => ({ "(direct)": "Direct (typed or WhatsApp link)", "l.instagram.com": "Instagram", "instagram.com": "Instagram", "google": "Google", "m.facebook.com": "Facebook", "lm.facebook.com": "Facebook", "(not set)": "Other" }[s] || s);
  const EV = { view_item: "Tees opened", add_to_cart: "Added to bag", whatsapp_order: "WhatsApp orders sent", open_design_studio: "Design Studio opened", studio_order: "Studio orders sent" };

  function render(x) {
    const [users, fresh, sessions, views, avg] = x.tot, evc = Object.fromEntries(x.ev.map(r => [r.d[0], r.m[0]]));
    const mins = Math.floor(avg / 60), secs = Math.round(avg % 60);
    $(".ga-body", box).innerHTML = `
      <div class="ga-tiles">
        <div><span>Visitors</span><b>${fmt(users)}</b></div>
        <div><span>New visitors</span><b>${fmt(fresh)}</b></div>
        <div><span>Page views</span><b>${fmt(views)}</b></div>
        <div><span>Avg. time on site</span><b>${mins ? mins + "m " : ""}${secs}s</b></div>
        <div><span>WhatsApp orders sent</span><b>${fmt((evc.whatsapp_order || 0) + (evc.studio_order || 0))}</b></div>
        <div class="live"><span><i></i>On the site now</span><b>${fmt(x.live)}</b></div>
      </div>
      <h3>Visitors per day</h3>${lineChart(x.daily)}
      <div class="ga-grid">
        <section><h3>What people did</h3>${bars(Object.keys(EV).map(k => ({ d: [EV[k]], m: [evc[k] || 0] })))}</section>
        <section><h3>Most viewed designs</h3>${bars(x.items, r => r.d[0], r => r.m[0])}</section>
        <section><h3>Where they came from</h3>${bars(x.src, r => SRC(r.d[0]))}</section>
        <section><h3>Cities</h3>${bars(x.city)}</section>
        <section><h3>Devices</h3>${bars(x.dev, r => ({ mobile: "Phone", desktop: "Computer", tablet: "Tablet" }[r.d[0]] || r.d[0]))}</section>
      </div>
      <p class="muted ga-note">Google needs up to a day to add new visits to these reports. "On the site now" is live.</p>`;
    const wrap = $(".ga-line", box); if (!wrap) return;
    const svg = $("svg", wrap), tip = $(".ga-tip", wrap), xh = $(".xh", svg), dot = $(".dot", svg), ln = $(".ln", svg);
    const at = i => { const seg = ln.getAttribute("d").split(/(?=[ML])/)[i].slice(1).split(" "); return seg.map(Number); };
    svg.addEventListener("pointermove", e => {
      const h = e.target.closest(".hit"); if (!h) return;
      const [cx, cy] = at(+h.dataset.i); xh.setAttribute("x1", cx); xh.setAttribute("x2", cx); dot.setAttribute("cx", cx); dot.setAttribute("cy", cy);
      tip.hidden = false; tip.textContent = h.dataset.t;
      const r = svg.getBoundingClientRect(), px = cx / 640 * r.width; tip.style.left = Math.min(Math.max(px, 70), r.width - 70) + "px";
    });
    svg.addEventListener("pointerleave", () => { tip.hidden = true; xh.setAttribute("x1", -10); xh.setAttribute("x2", -10); dot.setAttribute("cx", -10); });
  }

  function showSignIn(note) {
    $(".ga-body", box).innerHTML = `${note ? `<p class="muted">${esc(note)}</p>` : ""}<button type="button" class="btn ga-signin">Sign in with Google to see analytics</button>`;
    $(".ga-signin", box).onclick = () => signIn().catch(e => say(esc(e.message)));
  }
  $(".ga-range", box).addEventListener("click", e => {
    const b = e.target.closest("[data-days]"); if (!b) return;
    days = +b.dataset.days; box.querySelectorAll(".ga-range button").forEach(x => x.setAttribute("aria-pressed", x === b));
    if (token) load();
  });

  (async () => {
    try { cfg = await config(); } catch (e) { return say("Couldn't read the site settings."); }
    if (!cfg.client || !cfg.property) return say("Not set up yet: add the Google sign-in Client ID and the Analytics Property ID in <b>Settings</b>, then publish.");
    if (token) load(); else showSignIn();
  })();
})();
