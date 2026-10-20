/* Builds a link-preview page + image for each product (p/<id>.html, images/og/<id>-<sig>.jpg).
   Used by admin.js when publishing. When WhatsApp/Instagram open a product link they see that tee. */
(() => {
  const SITE = "https://jayseth34.github.io/DawnSogniWeb/";
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const slug = id => String(id).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const cover = p => (p.cover === "front" ? p.front || p.back : p.back || p.front) || p.tee || p.teeFront;
  const fromPrice = p => Math.min(...Object.values(p.prices || {}).filter(v => v != null));
  const rs = n => "₹" + Number(n).toLocaleString("en-IN");
  function sig(p) { // short fingerprint: only rebuild when something visible changed
    const s = JSON.stringify([p.id, p.name, p.description, p.prices, cover(p), 1]);
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return h.toString(36);
  }
  const load = src => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src; });
  let fontP;
  const font = () => fontP || (fontP = Promise.all([
    new FontFace("DSShareBold", "url(fonts/chakra-petch-latin-700-italic.woff2)", { weight: "700", style: "italic" }).load(),
    new FontFace("DSShare", "url(fonts/chakra-petch-latin-400-normal.woff2)").load().catch(() => null)
  ]).then(fs => fs.forEach(f => f && document.fonts.add(f))).catch(() => null));
  function wrap(ctx, text, max) {
    const words = text.split(/\s+/), lines = []; let line = "";
    for (const w of words) { const t = line ? line + " " + w : w; if (ctx.measureText(t).width > max && line) { lines.push(line); line = w; } else line = t; }
    if (line) lines.push(line);
    return lines.slice(0, 3);
  }
  async function image(p, urlFor) {
    await font();
    const [bg, logo, tee] = await Promise.all([load("images/ravenmoon-1200.webp"), load("images/logo-full.webp"), load(urlFor(cover(p)))]);
    const c = document.createElement("canvas"); c.width = 1200; c.height = 630;
    const x = c.getContext("2d");
    x.fillStyle = "#000"; x.fillRect(0, 0, 1200, 630);
    const k = Math.max(1200 / bg.width, 630 / bg.height);
    x.globalAlpha = .55; x.drawImage(bg, (1200 - bg.width * k) / 2, (630 - bg.height * k) / 2, bg.width * k, bg.height * k); x.globalAlpha = 1;
    const g = x.createLinearGradient(0, 0, 1200, 0); g.addColorStop(0, "rgba(0,0,0,.92)"); g.addColorStop(.55, "rgba(0,0,0,.55)"); g.addColorStop(1, "rgba(0,0,0,.15)");
    x.fillStyle = g; x.fillRect(0, 0, 1200, 630);
    // tee on the right
    const box = 560, s = Math.min(box / tee.width, 580 / tee.height), tw = tee.width * s, th = tee.height * s;
    x.shadowColor = "rgba(0,0,0,.6)"; x.shadowBlur = 40; x.drawImage(tee, 900 - tw / 2, 315 - th / 2, tw, th); x.shadowBlur = 0;
    // text on the left
    x.drawImage(logo, 64, 56, 300, 300 * logo.height / logo.width);
    x.fillStyle = "#fff"; x.font = 'italic 700 54px "DSShareBold", sans-serif'; x.textBaseline = "top";
    const lines = wrap(x, p.name.toUpperCase(), 520);
    let y = 330 - (lines.length - 1) * 30;
    lines.forEach(l => { x.fillText(l, 64, y); y += 62; });
    x.fillStyle = "rgba(255,255,255,.72)"; x.font = '400 28px "DSShare", sans-serif';
    x.fillText("From " + rs(fromPrice(p)) + "  ·  Order on WhatsApp", 64, y + 14);
    return new Promise(ok => c.toBlob(ok, "image/jpeg", .86));
  }
  function html(p, imgPath, s) {
    const id = encodeURIComponent(p.id), url = SITE + "p/" + slug(p.id) + ".html", title = `${p.name} — Dawn Sogni`;
    const desc = (p.description || "Original Dawn Sogni print, made to order.").slice(0, 200);
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"><!-- ds-share:${s} -->
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="product">
<meta property="og:site_name" content="Dawn Sogni">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc("From " + rs(fromPrice(p)) + ". " + desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE + imgPath}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="product:price:amount" content="${fromPrice(p)}">
<meta property="product:price:currency" content="INR">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${SITE + imgPath}">
<meta http-equiv="refresh" content="0; url=../#p=${id}">
<script>location.replace("../#p=${id}")</script>
</head>
<body style="background:#000;color:#fff;font-family:sans-serif;text-align:center;padding:40px">
<a style="color:#fff" href="../#p=${id}">View ${esc(p.name)} on Dawn Sogni</a>
</body>
</html>
`;
  }
  async function build(p, urlFor = s => s) {
    const s = sig(p), base = slug(p.id);
    const imgPath = `images/og/${base}-${s}.jpg`;
    return { sig: s, htmlPath: `p/${base}.html`, imgPath, jpg: await image(p, urlFor), html: html(p, imgPath, s) };
  }
  window.DSShare = { build, sig, slug, link: id => SITE + "p/" + slug(id) + ".html" };
})();
