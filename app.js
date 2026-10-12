/* Dawn Sogni — site behaviour */
(() => {
  const D = window.DS;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGsap = !!(window.gsap && window.ScrollTrigger);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const dropById = Object.fromEntries(D.drops.map(d => [d.id, d]));
  const rupee = n => "₹" + n.toLocaleString("en-IN");
  const FIT_LABEL = { regular: "Regular", oversized: "Oversized" };

  /* ---------------- WhatsApp ---------------- */
  const wa = text => `https://wa.me/${D.whatsapp}?text=${encodeURIComponent(text)}`;
  const pageUrl = () => location.href.split("#")[0];
  const WA_TEXT = {
    general: "Hi Dawn Sogni! I'd like to know more about your designs.",
    custom: "Hi Dawn Sogni! I have my own design I'd like printed. I'll attach the file here.\n\nGarment (tee / polo / print only):\nSize:\nPrint size on the garment:"
  };
  $$("[data-wa]").forEach(a => (a.href = wa(WA_TEXT[a.dataset.wa])));
  $("#ig-link").href = `https://instagram.com/${D.instagram}`;
  $("#year").textContent = "© " + new Date().getFullYear();

  /* ---------------- placeholder prints (100×100 box) ---------------- */
  const T = (x, y, s, fill, txt, extra = "") =>
    `<text x="${x}" y="${y}" font-family="Archivo, sans-serif" font-size="${s}" font-weight="700" fill="${fill}" text-anchor="middle" letter-spacing="2" ${extra}>${txt}</text>`;
  const PRINTS = {
    sunrise: (ink, acc) => {
      let rays = "";
      for (let i = 0; i < 9; i++) {
        const ang = Math.PI + (i + 0.5) * (Math.PI / 9);
        const x1 = 50 + Math.cos(ang) * 31, y1 = 60 + Math.sin(ang) * 31;
        const x2 = 50 + Math.cos(ang) * 40, y2 = 60 + Math.sin(ang) * 40;
        rays += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${acc}" stroke-width="2.4" stroke-linecap="round"/>`;
      }
      return `${rays}<path d="M24,60 A26,26 0 0 1 76,60 Z" fill="${acc}"/>
        <rect x="10" y="62" width="80" height="2.6" fill="${ink}"/><rect x="20" y="68" width="60" height="2.2" fill="${ink}"/><rect x="31" y="73.5" width="38" height="1.8" fill="${ink}"/>
        ${T(50, 90, 8.6, ink, "FIRST LIGHT")}`;
    },
    wordmark: (ink, acc) =>
      `${T(50, 34, 9, acc, "dawn", 'letter-spacing="3"')}
       <text x="50" y="64" font-family="Archivo, sans-serif" font-size="30" font-weight="850" fill="${ink}" text-anchor="middle" style="font-variation-settings:'wdth' 125" letter-spacing="-0.5">sogni</text>
       <rect x="12" y="71" width="76" height="3" rx="1.5" fill="${acc}"/>`,
    chai: (ink, acc) =>
      `<path d="M38,22 q-5,7 0,13 q5,6 0,12" stroke="${acc}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
       <path d="M50,18 q-5,7 0,13 q5,6 0,12" stroke="${acc}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
       <path d="M62,22 q-5,7 0,13 q5,6 0,12" stroke="${acc}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
       <path d="M32,50 L68,50 L63,80 Q50,86 37,80 Z" fill="none" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/>
       <path d="M35,60 L65,60" stroke="${ink}" stroke-width="1.6"/>
       ${T(50, 97, 9, ink, "6:00 AM")}`,
    bands: (ink, acc) => {
      const cols = [acc, "#F08A5D", "#E2725B", "#B85C6B", "#7E4E73", ink];
      return cols.map((c, i) => `<rect x="${8 + i * 3}" y="${14 + i * 13}" width="${84 - i * 6}" height="9" rx="4.5" fill="${c}"/>`).join("");
    },
    moons: (ink, acc, bg) => {
      const xs = [14, 32, 50, 68, 86], off = [-9, -5, 99, 5, 9];
      return xs.map((x, i) => `<circle cx="${x}" cy="46" r="7.5" fill="${ink}"/>` +
        (off[i] === 99 ? "" : `<circle cx="${x + off[i]}" cy="46" r="7.5" fill="${bg}"/>`) +
        `<circle cx="${x}" cy="46" r="7.5" fill="none" stroke="${ink}" stroke-width="1"/>`).join("") +
        T(50, 74, 8, acc, "AFTER HOURS");
    },
    stars: (ink, acc, bg) => {
      const star = (x, y, s) => `<path d="M${x},${y - s} L${x + s * .3},${y - s * .3} L${x + s},${y} L${x + s * .3},${y + s * .3} L${x},${y + s} L${x - s * .3},${y + s * .3} L${x - s},${y} L${x - s * .3},${y - s * .3} Z" fill="${acc}"/>`;
      return `<circle cx="44" cy="44" r="22" fill="${ink}"/><circle cx="54" cy="37" r="20" fill="${bg}"/>
        ${star(76, 22, 6)}${star(84, 52, 4)}${star(66, 66, 3.5)}${star(20, 18, 3)}${star(14, 62, 4)}
        ${T(50, 92, 8.4, ink, "NIGHT SHIFT")}`;
    },
    rain: (ink, acc) => {
      let r = "";
      for (let i = 0; i < 7; i++) r += `<line x1="${24 + i * 9}" y1="${54 + (i % 2) * 5}" x2="${19 + i * 9}" y2="${70 + (i % 2) * 5}" stroke="${acc}" stroke-width="2.4" stroke-linecap="round"/>`;
      return `<g fill="${ink}"><circle cx="36" cy="38" r="12"/><circle cx="54" cy="30" r="16"/><circle cx="70" cy="40" r="10"/><rect x="24" y="38" width="56" height="12" rx="6"/></g>
        ${r}${T(50, 95, 9, ink, "MONSOON")}`;
    }
  };

  /* ---------------- tee renderer ---------------- */
  const SHAPES = {
    regular: {
      outline: "M118,38 Q150,64 182,38 L230,50 L278,110 L248,128 L222,112 L222,300 Q150,306 78,300 L78,112 L52,128 L22,110 L70,50 Z",
      neck: "M118,38 Q150,64 182,38", back: "M118,38 Q150,50 182,38 Q150,64 118,38 Z",
      stitches: ["M80,292 Q150,298 220,292", "M27,104 L56,121", "M273,104 L244,121"],
      folds: ["M84,128 Q112,172 104,236", "M216,128 Q190,176 198,240", "M96,292 Q116,280 128,300", "M174,300 Q190,282 206,292", "M70,56 Q92,84 84,110", "M230,56 Q208,84 216,110"],
      light: ["M128,120 Q140,200 132,282", "M176,96 Q170,170 178,250"],
      chest: { x: 108, y: 94, w: 84 }
    },
    oversized: {
      outline: "M116,40 Q150,66 184,40 L238,58 L284,140 L246,158 L228,128 L230,312 Q150,318 70,312 L72,128 L54,158 L16,140 L62,58 Z",
      neck: "M116,40 Q150,66 184,40", back: "M116,40 Q150,52 184,40 Q150,66 116,40 Z",
      stitches: ["M72,304 Q150,310 228,304", "M22,131 L58,149", "M278,131 L242,149"],
      folds: ["M80,140 Q108,190 98,252", "M220,140 Q192,192 202,256", "M88,302 Q112,288 124,312", "M176,312 Q192,290 212,302", "M62,64 Q86,100 76,128", "M238,64 Q214,100 224,128"],
      light: ["M126,124 Q140,206 130,296", "M178,104 Q170,180 180,268"],
      chest: { x: 104, y: 100, w: 92 }
    }
  };
  let uid = 0;
  function teeSVG(p, fit) {
    const S = SHAPES[fit] || SHAPES.regular, id = "t" + ++uid, c = S.chest;
    const print = p.art
      ? `<image href="${p.art}" x="${c.x}" y="${c.y}" width="${c.w}" height="${c.w}" preserveAspectRatio="xMidYMid meet"/>`
      : `<g transform="translate(${c.x} ${c.y}) scale(${c.w / 100})" opacity=".95">${(PRINTS[p.print] || PRINTS.wordmark)(p.ink, p.accent, p.color)}</g>`;
    return `<svg class="tee" viewBox="0 0 300 340" role="img" aria-label="${p.name} tee in ${p.colorName}">
      <defs>
        <clipPath id="${id}c"><path d="${S.outline}"/></clipPath>
        <linearGradient id="${id}x" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".32"/><stop offset=".2" stop-color="#000" stop-opacity=".05"/><stop offset=".48" stop-color="#fff" stop-opacity=".09"/><stop offset=".8" stop-color="#000" stop-opacity=".06"/><stop offset="1" stop-color="#000" stop-opacity=".34"/></linearGradient>
        <linearGradient id="${id}y" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".12"/><stop offset=".35" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".2"/></linearGradient>
      </defs>
      <path d="M150,46 L150,24 C150,11 166,9 168,20 C169,27 162,31 157,27" fill="none" stroke="#BDB6C4" stroke-width="3.2" stroke-linecap="round"/>
      <path d="${S.outline}" fill="${p.color}"/>
      <path d="${S.back}" fill="#000" opacity=".26"/>
      <g clip-path="url(#${id}c)">
        ${print}
        <rect width="300" height="340" fill="url(#${id}x)"/>
        <rect width="300" height="340" fill="url(#${id}y)"/>
        <g filter="url(#ds-soft)" fill="none" stroke-linecap="round">
          <g stroke="#000" stroke-opacity=".24" stroke-width="7">${S.folds.map(d => `<path d="${d}"/>`).join("")}</g>
          <g stroke="#fff" stroke-opacity=".13" stroke-width="10">${S.light.map(d => `<path d="${d}"/>`).join("")}</g>
        </g>
        <rect width="300" height="340" filter="url(#ds-noise)" opacity=".28"/>
      </g>
      <path d="${S.neck}" fill="none" stroke="#000" stroke-opacity=".2" stroke-width="5"/>
      <g fill="none" stroke="#000" stroke-opacity=".28" stroke-width="1.2" stroke-dasharray="3 3">${S.stitches.map(d => `<path d="${d}"/>`).join("")}</g>
      <path d="${S.outline}" fill="none" stroke="#000" stroke-opacity=".18" stroke-width="1"/>
    </svg>`;
  }
  const firstFit = p => (p.prices.regular != null ? "regular" : Object.keys(p.prices)[0]);
  const hangHTML = (p, fit) =>
    `<div class="hang"><div class="hang-a"><div class="hang-b">${
      p.photo ? `<img class="photo" src="${p.photo}" alt="${p.name} in ${p.colorName}" loading="lazy">` : teeSVG(p, fit || firstFit(p))
    }</div></div><div class="tee-shadow"></div></div>`;
  const priceLabel = p => {
    const v = Object.values(p.prices);
    return v.length > 1 ? "From " + rupee(Math.min(...v)) : rupee(v[0]);
  };

  /* ---------------- swing physics ---------------- */
  const swings = new Set();
  const io = new IntersectionObserver(es => es.forEach(e => (e.target._sw.on = e.isIntersecting)), { rootMargin: "100px" });
  function register(el, opts = {}) {
    const s = {
      el, A: $(".hang-a", el), B: $(".hang-b", el),
      a: 0, va: 0, b: 0, vb: 0, y: 0, vy: 0,
      ph: Math.random() * 6.28, dir: Math.random() < .5 ? -1 : 1,
      rail: !!opts.rail, gain: opts.gain || 1, on: false
    };
    el._sw = s; swings.add(s); io.observe(el);
    return s;
  }
  function unregister(root) {
    $$(".hang", root).forEach(el => { if (el._sw) { swings.delete(el._sw); io.unobserve(el); } });
  }

  /* ---------------- render: hero, rail, grid ---------------- */
  const latest = D.drops[0];
  const heroProduct = D.products.find(p => p.drop === latest.id) || D.products[0];
  $("#hero-hang").innerHTML = hangHTML(heroProduct, "oversized" in heroProduct.prices ? "oversized" : firstFit(heroProduct));
  const heroSwing = register($("#hero-hang .hang"), { gain: 1.2 });

  $("#drop-date").textContent = "Latest drop, " + latest.date;
  $("#drop-title").textContent = latest.name;
  $("#drop-note").textContent = latest.note;
  const track = $("#rail-track");
  track.innerHTML = D.products.filter(p => p.drop === latest.id).map(p =>
    `<button class="piece" type="button" data-id="${p.id}" aria-label="${p.name}, ${priceLabel(p)}. View details">
      ${hangHTML(p)}<span class="piece-name">${p.name}</span><br><span class="piece-meta">${priceLabel(p)}</span>
    </button>`).join("");
  $$(".hang", track).forEach(el => register(el, { rail: true }));

  const chips = $("#chips"), grid = $("#grid");
  const filters = [{ id: "all", name: "All" }, ...D.drops];
  chips.innerHTML = filters.map((f, i) =>
    `<button class="chip" role="tab" type="button" data-f="${f.id}" aria-selected="${i === 0}">${f.name}</button>`).join("");
  function renderGrid(f) {
    unregister(grid);
    const list = D.products.filter(p => f === "all" || p.drop === f);
    grid.innerHTML = list.map(p =>
      `<button class="piece" type="button" data-id="${p.id}" aria-label="${p.name}, ${priceLabel(p)}. View details">
        <div class="rack">${hangHTML(p)}</div>
        <div class="piece-text"><span><span class="piece-name">${p.name}</span><br><span class="piece-meta">${dropById[p.drop]?.name || ""}, ${p.colorName}</span></span><span class="piece-price">${priceLabel(p)}</span></div>
      </button>`).join("");
    $$(".hang", grid).forEach(el => register(el, { gain: .7 }));
    if (hasGsap && !reduce) gsap.from($$(".piece", grid), { y: 28, opacity: 0, duration: .6, stagger: .05, ease: "power3.out" });
  }
  chips.addEventListener("click", e => {
    const b = e.target.closest(".chip"); if (!b) return;
    $$(".chip", chips).forEach(c => c.setAttribute("aria-selected", c === b));
    renderGrid(b.dataset.f);
    swings.forEach(s => { if (!s.rail) s.va += s.dir * 60; });
  });
  renderGrid("all");

  /* ---------------- smooth scroll ---------------- */
  let lenis = null;
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);
  if (hasGsap && !reduce && window.Lenis) {
    lenis = new Lenis({ lerp: .09, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  document.addEventListener("click", e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const h = a.getAttribute("href");
    if (h.length < 2 || h.startsWith("#p=")) return;
    const t = $(h); if (!t) return;
    e.preventDefault();
    lenis ? lenis.scrollTo(t, { offset: h === "#top" ? 0 : -10, duration: 1.4 }) : t.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  });

  /* ---------------- sky: night to morning ---------------- */
  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const mix = (c1, c2, t) => { const a = hex(c1), b = hex(c2); return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(",")})`; };
  const SKY = [ // [progress, top, bottom]
    [0, "#17153A", "#4A2F5E"],
    [.45, "#4B3B6E", "#F09A5C"],
    [.75, "#E2A188", "#F9D3B3"],
    [1, "#F2CDBF", "#FCEEE3"]
  ];
  const NIGHT = ["#0E0D24", "#2A1F45"];
  const root = document.documentElement.style;
  const hero = $(".hero"), inter = $(".interlude");
  const smooth = t => t * t * (3 - 2 * t);
  let lastSky = "";
  function updateSky() {
    const vh = innerHeight;
    const p1 = clamp(scrollY / hero.offsetHeight, 0, 1);
    const r = inter.getBoundingClientRect();
    const p2 = clamp(-r.top / Math.max(1, r.height - vh), 0, 1);
    let top, bot;
    if (p2 <= 0) { top = mix(NIGHT[0], SKY[0][1], p1); bot = mix(NIGHT[1], SKY[0][2], p1); }
    else {
      let i = 0; while (i < SKY.length - 2 && p2 > SKY[i + 1][0]) i++;
      const t = smooth((p2 - SKY[i][0]) / (SKY[i + 1][0] - SKY[i][0]));
      top = mix(SKY[i][1], SKY[i + 1][1], t); bot = mix(SKY[i][2], SKY[i + 1][2], t);
    }
    const ft = smooth(clamp((p2 - .5) / .12, 0, 1));
    const key = top + bot + ft.toFixed(3) + p2.toFixed(3) + p1.toFixed(3);
    if (key === lastSky) return; lastSky = key;
    root.setProperty("--sky-top", top);
    root.setProperty("--sky-bot", bot);
    root.setProperty("--stars", ((1 - p1 * .3) * (1 - smooth(clamp(p2 / .4, 0, 1)))).toFixed(3));
    const sunY = p2 < .5 ? 115 - p2 / .5 * 70 : 45 - (p2 - .5) / .5 * 40;
    root.setProperty("--sun-y", sunY.toFixed(1) + "vh");
    root.setProperty("--fg", mix("#FBF7F1", "#1C1830", ft));
    const [fr, fg, fb] = [hex("#FBF7F1"), hex("#1C1830")].reduce((a, b) => a.map((v, i) => Math.round(v + (b[i] - v) * ft)));
    root.setProperty("--fg-soft", `rgba(${fr},${fg},${fb},.74)`);
    root.setProperty("--nav-bg", `rgba(${Math.round(14 + 237 * ft)},${Math.round(13 + 234 * ft)},${Math.round(36 + 205 * ft)},${(.35 + .25 * ft).toFixed(2)})`);
  }
  updateSky();

  /* ---------------- main loop ---------------- */
  const nav = $(".nav"), rail = $("#rail");
  const rippleMap = $("#ripple-map"), rippleTurb = $("#ripple-turb");
  let lastY = scrollY, vs = 0, lastRail = rail.scrollLeft, rv = 0, navAcc = 0, last = performance.now();
  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000) || .016; last = now;
    const y = scrollY, dy = y - lastY; lastY = y;
    vs += (dy - vs) * .25;
    const rl = rail.scrollLeft, dr = rl - lastRail; lastRail = rl;
    rv += (dr - rv) * .25;

    updateSky();

    // nav hides while scrolling down, returns on the way up
    navAcc = clamp(navAcc + dy, -80, 80);
    nav.classList.toggle("is-hidden", y > innerHeight * .6 && navAcc > 60 && !sheetOpen);
    if (dy < 0) navAcc = Math.min(navAcc, 0);

    if (reduce) return;
    const t = now / 1000;
    const pinned = pinActive;
    for (const s of swings) {
      if (!s.on) continue;
      // garments swing with scroll speed; on the rail they trail behind the direction of travel
      let drive = s.rail ? (pinned ? -vs * 1.2 : -rv * 1.4) : vs * .55 * s.dir;
      const target = clamp(drive * .9 * s.gain, -18, 18) + Math.sin(t * .9 + s.ph) * .9;
      s.va += (-62 * (s.a - target) - 5.2 * s.va) * dt; s.a += s.va * dt;
      s.vb += (-34 * (s.b - s.a) - 3.4 * s.vb) * dt; s.b += s.vb * dt;
      const ty = clamp(vs * .6, -22, 22);
      s.vy += (-90 * (s.y - ty) - 10 * s.vy) * dt; s.y += s.vy * dt;
      const lag = s.b - s.a;
      // the hook stays on the rod; the fabric below it stretches and lags
      s.A.style.transform = `rotate(${s.a.toFixed(3)}deg)`;
      s.B.style.transform = `rotate(${(lag * .9).toFixed(3)}deg) skewX(${(lag * .45).toFixed(3)}deg) scaleY(${(1 + s.y * .0035).toFixed(4)})`;
    }
    if (heroSwing.on && rippleMap) {
      rippleMap.setAttribute("scale", (3 + Math.min(Math.abs(vs), 40) * .35).toFixed(2));
      rippleTurb.setAttribute("baseFrequency", `${(.008 + Math.sin(t * .4) * .0015).toFixed(4)} ${(.018 + Math.cos(t * .3) * .003).toFixed(4)}`);
    }
  }
  if (hasGsap) gsap.ticker.add((time) => frame(time * 1000));
  else { const raf = n => { frame(n); requestAnimationFrame(raf); }; requestAnimationFrame(raf); }

  /* ---------------- scroll choreography ---------------- */
  let pinActive = false;
  if (hasGsap && !reduce) {
    // page load: the hero tee drops onto the rod and swings itself still
    const intro = gsap.timeline({ defaults: { ease: "power3.out" } });
    intro
      .from(".wm-line", { "--w": 62, opacity: 0, yPercent: 30, duration: 1.3, stagger: .12 })
      .from(".rod", { scaleX: 0, duration: 1, ease: "power2.inOut" }, .1)
      .from("#hero-hang", { y: -innerHeight * .7, duration: .75, ease: "power2.in", onComplete: () => { heroSwing.va = 150; heroSwing.vy = 260; } }, .55)
      .from(".hero-foot > *", { y: 20, opacity: 0, duration: .8, stagger: .1 }, 1.1);

    // wordmark squeezes like fabric as you leave the hero
    gsap.to(".wm-1", { "--w": 62, ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true } });
    gsap.to(".wm-2", { "--w": 80, ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true } });
    gsap.to(".wordmark", { yPercent: -18, ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true } });

    // latest drop: pinned rail on wide screens, native swipe on phones
    const mm = gsap.matchMedia();
    mm.add("(min-width: 900px)", () => {
      const dist = () => Math.max(0, track.scrollWidth - rail.clientWidth);
      const tw = gsap.to(track, {
        x: () => -dist(), ease: "none",
        scrollTrigger: {
          trigger: ".drop", pin: true, start: "top top", end: () => "+=" + (dist() + innerHeight * .3),
          scrub: .6, invalidateOnRefresh: true,
          onToggle: st => (pinActive = st.isActive)
        }
      });
      return () => { pinActive = false; tw.kill(); };
    });

    // interlude lines
    const il = gsap.timeline({ scrollTrigger: { trigger: inter, start: "top top", end: "bottom bottom", scrub: true } });
    il.fromTo(".il-1", { opacity: .15, "--w": 62 }, { opacity: 1, "--w": 112, duration: .35, ease: "none" })
      .fromTo(".il-2", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: .25, ease: "none" }, .3)
      .to({}, { duration: .4 });
    gsap.set(".il-1", { fontVariationSettings: '"wdth" var(--w)' });

    // headings stretch into place as they arrive
    $$(".cat-head h2, .steps h2, .custom h2").forEach(h => {
      gsap.fromTo(h, { "--w": 125 }, { "--w": 70, ease: "none", scrollTrigger: { trigger: h, start: "top 95%", end: "top 45%", scrub: true } });
      h.style.fontVariationSettings = '"wdth" var(--w)';
    });
    gsap.fromTo(".foot-mark", { "--w": 62 }, { "--w": 125, ease: "none", scrollTrigger: { trigger: ".foot", start: "top bottom", end: "bottom bottom", scrub: true } });
    $(".foot-mark").style.fontVariationSettings = '"wdth" var(--w)';

    // the catalogue sheet slides up over the morning sky
    gsap.from(".catalogue", { yPercent: 6, ease: "none", scrollTrigger: { trigger: ".catalogue", start: "top bottom", end: "top 40%", scrub: true } });

    addEventListener("load", () => ScrollTrigger.refresh());
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
  }

  /* ---------------- product sheet ---------------- */
  const sheet = $("#sheet"), scrim = $("#scrim");
  let sheetOpen = false, current = null, sel = {}, lastFocus = null, sheetSwing = null;
  const byId = Object.fromEntries(D.products.map(p => [p.id, p]));

  function drawVisual() {
    const v = $("#sheet-visual");
    unregister(v);
    v.innerHTML = hangHTML(current, sel.fit);
    sheetSwing = register($(".hang", v), { gain: .6 });
    if (!reduce) { sheetSwing.va = 140 * (Math.random() < .5 ? -1 : 1); sheetSwing.vy = 120; }
  }
  function updateOrder() {
    const p = current, price = p.prices[sel.fit];
    $("#sheet-price").textContent = rupee(price);
    const msg = `Hi Dawn Sogni! I'd like to order this design:\n\n*${p.name}* (${p.id})\nFit: ${FIT_LABEL[sel.fit] || sel.fit}\nSize: ${sel.size}\nColour: ${p.colorName}\nPrice: ${rupee(price)}\n\n${pageUrl()}#p=${p.id}`;
    $("#sheet-wa").href = wa(msg);
  }
  function openSheet(id) {
    const p = byId[id]; if (!p) return;
    current = p;
    sel = { fit: firstFit(p), size: p.sizes.includes("M") ? "M" : p.sizes[0] };
    $("#sheet-drop").textContent = `${dropById[p.drop]?.name || ""} drop, ${p.id}`;
    $("#sheet-name").textContent = p.name;
    $("#sheet-desc").textContent = p.description;
    $("#sheet-colour").innerHTML = `<span class="swatch" style="background:${p.color}"></span>${p.colorName}`;
    const fits = Object.keys(p.prices);
    $("#fit-row").innerHTML = fits.map(f =>
      `<label><input type="radio" name="fit" value="${f}" ${f === sel.fit ? "checked" : ""}><span>${FIT_LABEL[f] || f} <small>${rupee(p.prices[f])}</small></span></label>`).join("");
    $("#size-row").innerHTML = p.sizes.map(s =>
      `<label><input type="radio" name="size" value="${s}" ${s === sel.size ? "checked" : ""}><span>${s}</span></label>`).join("");
    drawVisual(); updateOrder();

    lastFocus = document.activeElement;
    scrim.hidden = false; sheet.hidden = false;
    requestAnimationFrame(() => { scrim.classList.add("is-open"); sheet.classList.add("is-open"); });
    sheet.scrollTop = 0;
    sheetOpen = true;
    lenis ? lenis.stop() : (document.body.style.overflow = "hidden");
    history.replaceState(null, "", "#p=" + p.id);
    setTimeout(() => $("#sheet-close").focus({ preventScroll: true }), 60);
  }
  function closeSheet() {
    if (!sheetOpen) return;
    sheetOpen = false;
    scrim.classList.remove("is-open"); sheet.classList.remove("is-open");
    setTimeout(() => { if (!sheetOpen) { scrim.hidden = true; sheet.hidden = true; unregister($("#sheet-visual")); } }, 560);
    lenis ? lenis.start() : (document.body.style.overflow = "");
    history.replaceState(null, "", location.pathname + location.search);
    lastFocus?.focus({ preventScroll: true });
  }
  document.addEventListener("click", e => {
    const b = e.target.closest(".piece");
    if (b) openSheet(b.dataset.id);
  });
  $("#sheet-close").addEventListener("click", closeSheet);
  scrim.addEventListener("click", closeSheet);
  sheet.addEventListener("change", e => {
    if (e.target.name === "fit") { sel.fit = e.target.value; if (!current.photo) drawVisual(); }
    if (e.target.name === "size") sel.size = e.target.value;
    updateOrder();
  });
  document.addEventListener("keydown", e => {
    if (!sheetOpen) return;
    if (e.key === "Escape") closeSheet();
    if (e.key === "Tab") {
      const f = $$('button, a[href], input', sheet).filter(x => x.offsetParent !== null);
      const first = f[0], lastEl = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastEl.focus(); }
      else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); first.focus(); }
    }
  });
  const m = location.hash.match(/^#p=(.+)$/);
  if (m) setTimeout(() => openSheet(decodeURIComponent(m[1])), 400);
})();
