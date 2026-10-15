/* Dawn Sogni — Gravity-Free Showroom (three.js)
   Tees float in a dark chamber. Drag to turn the room, scroll/pinch to move closer,
   tap a tee to pull it in, flip it, then open its product page.
   Data comes from products.js; each collection (drop) can have its own atmosphere. */
import * as THREE from "./vendor/three.module.min.js?v=0160";

const D = window.DS, App = window.DSApp;
const $ = s => document.querySelector(s);
const room = $("#room"), canvas = $("#room-canvas"), labelsEl = $("#room-labels"), hint = $("#room-hint"), ctrl = $("#room-ctrl");
const sw = $("#view-switch"), gridWrap = $("#grid-wrap");
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const store = { get: (k, d) => { try { return localStorage.getItem(k) ?? d; } catch (e) { return d; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} } };

/* ---------- view switch (showroom / grid) ---------- */
function webglOK() { try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch (e) { return false; } }
const can3d = webglOK() && D.products.length > 0;
if (!can3d) { sw.hidden = true; room.hidden = true; gridWrap.hidden = false; }
let started = false;
function setView(v) {
  if (!can3d) return;
  room.hidden = v !== "room"; gridWrap.hidden = v === "room";
  sw.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", b.dataset.view === v));
  store.set("ds-view", v);
  if (v === "room") { if (!started) start(); else resize(); }
}
sw.addEventListener("click", e => { const b = e.target.closest("button[data-view]"); if (b) setView(b.dataset.view); });

/* ---------- the chamber ---------- */
let renderer, scene, camera, clock, particles, pGeo, pVel, floorRing, rimLight, keyLight, items = [], atmo;
const ATMOS = Object.assign({ default: { fog: "#04050a", glow: "#cfd8e3", rim: "#8aa2c0", particles: "ash" } }, D.atmospheres || {});
const view = { theta: 0, phi: 1.38, r: 6.2, tTheta: 0, tPhi: 1.38, tR: 6.2 };
let focus = null, idleAt = 0, narrow = false;

function start() {
  started = true;
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x04050a, 0.05);
  camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  clock = new THREE.Clock();

  scene.add(new THREE.AmbientLight(0xffffff, 2.3));
  keyLight = new THREE.SpotLight(0xffffff, 60, 30, Math.PI / 5, 0.6, 1.2);
  keyLight.position.set(0, 8, 3); scene.add(keyLight); scene.add(keyLight.target);
  rimLight = new THREE.PointLight(0x8aa2c0, 25, 20, 1.5); rimLight.position.set(0, 1.5, -5); scene.add(rimLight);

  // faint orbit rings beneath the tees
  floorRing = new THREE.Group();
  for (const [r, o] of [[2.6, 0.22], [3.4, 0.12], [4.4, 0.06]]) {
    const m = new THREE.Mesh(new THREE.RingGeometry(r, r + 0.012, 128), new THREE.MeshBasicMaterial({ color: 0xcfd8e3, transparent: true, opacity: o, side: THREE.DoubleSide, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; floorRing.add(m);
  }
  floorRing.position.y = -1.55; scene.add(floorRing);

  makeParticles();
  const cols = D.drops.filter(d => D.products.some(p => p.drop === d.id));
  if (cols.length > 1) {
    const bar = document.createElement("div"); bar.className = "room-cols pills"; bar.setAttribute("role", "tablist");
    bar.innerHTML = cols.map((d, i) => `<button class="pill" role="tab" type="button" data-drop="${App.esc(d.id)}" aria-selected="${i === 0}">${App.esc(d.name)}</button>`).join("");
    bar.addEventListener("click", e => { const b = e.target.closest("[data-drop]"); if (!b) return; bar.querySelectorAll(".pill").forEach(x => x.setAttribute("aria-selected", x === b)); setFocus(null); buildCollection(b.dataset.drop); });
    room.appendChild(bar);
  }
  buildCollection(cols.length ? cols[0].id : null);
  bindInput();
  resize(); addEventListener("resize", resize);
  new ResizeObserver(resize).observe(room);
  renderer.setAnimationLoop(tick);
  document.addEventListener("visibilitychange", () => renderer.setAnimationLoop(document.hidden ? null : tick));
}

function resize() {
  if (!renderer) return;
  const w = room.clientWidth, h = room.clientHeight; if (!w || !h) return;
  renderer.setSize(w, h, false); camera.aspect = w / h; narrow = camera.aspect < 0.85;
  const spots = layout(items.length); items.forEach((it, i) => it.home.copy(spots[i]));
  // keep everything in frame on narrow screens
  const n = items.length, spread = n <= 1 ? 1.8 : Math.min(n, 4) * (narrow ? 1.05 : 1.4);
  const fit = Math.max(5.2, spread / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect) * 1.9);
  view.tR = view.r = Math.min(fit, 11);
  camera.updateProjectionMatrix();
}

/* ---------- particles: ash (drifts), embers (rise), snow (falls) ---------- */
function dotTexture() {
  const c = document.createElement("canvas"); c.width = c.height = 64; const g = c.getContext("2d");
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(0.35, "rgba(255,255,255,.45)"); r.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = r; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c);
}
function makeParticles() {
  const N = innerWidth < 700 ? 380 : 700; pGeo = new THREE.BufferGeometry();
  const pos = new Float32Array(N * 3); pVel = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) { pos[i * 3] = (Math.random() - 0.5) * 16; pos[i * 3 + 1] = (Math.random() - 0.5) * 8; pos[i * 3 + 2] = (Math.random() - 0.5) * 16; }
  pGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  particles = new THREE.Points(pGeo, new THREE.PointsMaterial({ size: 0.05, map: dotTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xcfd8e3, opacity: 0.8 }));
  scene.add(particles);
}
function stepParticles(dt, t) {
  const p = pGeo.attributes.position.array, kind = atmo.particles;
  for (let i = 0; i < p.length; i += 3) {
    const s = (i % 7) * 0.13 + 0.4;
    if (kind === "embers") { p[i + 1] += dt * 0.35 * s; p[i] += Math.sin(t * 0.7 + i) * dt * 0.08; }
    else if (kind === "snow") { p[i + 1] -= dt * 0.3 * s; p[i] += Math.sin(t * 0.5 + i) * dt * 0.06; }
    else { p[i] += Math.sin(t * 0.13 + i) * dt * 0.05; p[i + 1] += Math.cos(t * 0.11 + i * 0.7) * dt * 0.04; p[i + 2] += Math.sin(t * 0.09 + i * 1.3) * dt * 0.05; }
    if (p[i + 1] > 4) p[i + 1] = -4; if (p[i + 1] < -4) p[i + 1] = 4;
  }
  pGeo.attributes.position.needsUpdate = true;
}

/* ---------- atmosphere per collection ---------- */
function applyAtmosphere(id) {
  atmo = Object.assign({}, ATMOS.default, ATMOS[id] || {});
  const fog = new THREE.Color(atmo.fog), glow = new THREE.Color(atmo.glow), rim = new THREE.Color(atmo.rim);
  scene.fog.color.copy(fog); particles.material.color.copy(glow); rimLight.color.copy(rim);
  floorRing.children.forEach(m => m.material.color.copy(glow));
  items.forEach(it => it.halo.material.color.copy(glow));
}

/* ---------- product cards ---------- */
const loader = new THREE.TextureLoader();
function bentPlane(w, h, bend) {
  const g = new THREE.PlaneGeometry(w, h, 24, 1), a = g.attributes.position;
  for (let i = 0; i < a.count; i++) { const x = a.getX(i); a.setZ(i, -bend * x * x); }
  g.computeVertexNormals(); return g;
}
function haloTexture() {
  const c = document.createElement("canvas"); c.width = c.height = 256; const g = c.getContext("2d");
  const r = g.createRadialGradient(128, 128, 10, 128, 128, 128); r.addColorStop(0, "rgba(255,255,255,.55)"); r.addColorStop(0.5, "rgba(255,255,255,.12)"); r.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = r; g.fillRect(0, 0, 256, 256); return new THREE.CanvasTexture(c);
}
const HALO = haloTexture();
// Back of a tee with no front photo: a gothic info card instead of a fake front.
function infoCard(p) {
  const c = document.createElement("canvas"); c.width = c.height = 1024; const g = c.getContext("2d");
  const silver = y0 => { const gr = g.createLinearGradient(0, y0 - 120, 0, y0 + 20); gr.addColorStop(0, "#ffffff"); gr.addColorStop(.45, "#c9d2dc"); gr.addColorStop(.75, "#7d8b99"); gr.addColorStop(1, "#dde3ea"); return gr; };
  g.fillStyle = "rgba(6,7,10,.92)"; roundRect(g, 150, 110, 724, 804, 36); g.fill();
  g.strokeStyle = "rgba(220,228,236,.45)"; g.lineWidth = 3; roundRect(g, 170, 130, 684, 764, 26); g.stroke();
  g.textAlign = "center";
  g.font = '900 210px "Grenze Gotisch", serif'; g.fillStyle = silver(390); g.fillText("DS", 512, 390);
  g.font = '700 64px "Grenze Gotisch", serif'; g.fillStyle = "#ffffff"; wrap(g, p.name, 512, 520, 600, 70);
  g.font = 'italic 600 40px "Chakra Petch", sans-serif'; g.fillStyle = "#d9dee4";
  const prices = Object.entries(p.prices).map(([f, v]) => `${f === "regular" ? "Regular" : f === "oversized" ? "Oversized" : f} Rs. ${Number(v).toLocaleString("en-IN")}`);
  prices.forEach((s, k) => g.fillText(s, 512, 690 + k * 54));
  g.font = '600 30px "Chakra Petch", sans-serif'; g.fillStyle = "#8f96a0"; g.fillText("TAP OPEN TO ORDER", 512, 840);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function wrap(g, text, x, y, max, lh) {
  const words = String(text).split(" "); let line = "", lines = [];
  for (const w of words) { const t = line ? line + " " + w : w; if (g.measureText(t).width > max && line) { lines.push(line); line = w; } else line = t; }
  lines.push(line); lines.slice(0, 2).forEach((l, k) => g.fillText(l, x, y + k * lh));
}
function texture(url) { const t = loader.load(url); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }

function clearItems() { items.forEach(it => { scene.remove(it.group); it.label.remove(); }); items = []; }
function layout(n) {
  // a gentle arc for a few tees, a full ring for many
  const out = [];
  if (n <= 5) { const gap = narrow ? 1.75 : 2.35; for (let i = 0; i < n; i++) { const x = (i - (n - 1) / 2) * gap; out.push(new THREE.Vector3(x, (i % 2 ? 0.18 : -0.08), -Math.abs(x) * 0.28)); } }
  else { const R = Math.max(2.8, n * 0.42); for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; out.push(new THREE.Vector3(Math.sin(a) * R, ((i % 3) - 1) * 0.35, Math.cos(a) * R)); } }
  return out;
}
async function buildCollection(dropId) {
  clearItems(); applyAtmosphere(dropId || "default");
  try { await Promise.all([document.fonts.load('900 100px "Grenze Gotisch"'), document.fonts.load('700 60px "Grenze Gotisch"'), document.fonts.load('italic 600 40px "Chakra Petch"')]); } catch (e) {}
  const list = D.products.filter(p => !dropId || p.drop === dropId);
  const spots = layout(list.length);
  list.forEach((p, i) => {
    const group = new THREE.Group(), body = new THREE.Group();
    const frontTex = texture(p.tee);
    const mat = new THREE.MeshStandardMaterial({ map: frontTex, transparent: true, alphaTest: 0.35, roughness: 0.92, metalness: 0, side: THREE.FrontSide });
    const geo = bentPlane(2.1, 2.1, 0.08);
    const face = new THREE.Mesh(geo, mat);
    const backMat = p.teeFront
      ? new THREE.MeshStandardMaterial({ map: texture(p.teeFront), transparent: true, alphaTest: 0.35, roughness: 0.92 })
      : new THREE.MeshBasicMaterial({ map: infoCard(p), transparent: true, alphaTest: 0.02 });
    const back = new THREE.Mesh(geo, backMat); back.rotation.y = Math.PI;
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: HALO, color: new THREE.Color(atmo.glow), transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending }));
    halo.scale.set(3.7, 3.7, 1); halo.position.z = -0.25;
    body.add(halo, face, back); group.add(body);
    group.position.copy(spots[i]); scene.add(group);
    const label = document.createElement("div"); label.className = "room-label";
    label.innerHTML = `<b>${App.esc(p.name)}</b><span>${App.rs(App.basePrice(p))}</span>`; labelsEl.appendChild(label);
    items.push({ p, group, body, face, back, halo, label, home: spots[i].clone(), seed: Math.random() * 10, flip: 0, tFlip: 0, hover: 0, pull: 0 });
  });
  $("#room-list").innerHTML = list.map(p => `<li><button type="button" data-id="${App.esc(p.id)}">${App.esc(p.name)}, ${App.rs(App.basePrice(p))}</button></li>`).join("");
  resize();
}
$("#room-list").addEventListener("click", e => { const b = e.target.closest("button[data-id]"); if (b) App.open(b.dataset.id); });

/* ---------- input: drag room, pinch/scroll zoom, tap to pull, drag focused to flip ---------- */
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
let drag = null, hovered = null;
function pick(x, y) {
  const r = canvas.getBoundingClientRect(); ndc.set(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const hit = ray.intersectObjects(items.flatMap(it => [it.face, it.back]), false)[0];
  return hit ? items.find(it => it.face === hit.object || it.back === hit.object) : null;
}
function bindInput() {
  const pts = new Map();
  canvas.addEventListener("pointerdown", e => {
    canvas.setPointerCapture(e.pointerId); pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.size === 2) { const [a, b] = [...pts.values()]; drag = { pinch: Math.hypot(a.x - b.x, a.y - b.y), r: view.tR }; return; }
    drag = { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, moved: 0, item: pick(e.clientX, e.clientY), theta: view.tTheta, phi: view.tPhi };
    if (drag.item && drag.item === focus) drag.flip0 = focus.tFlip;
    nudge();
  });
  canvas.addEventListener("pointermove", e => {
    if (pts.has(e.pointerId)) pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (drag && drag.pinch && pts.size === 2) { const [a, b] = [...pts.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y); view.tR = THREE.MathUtils.clamp(drag.r * drag.pinch / d, 3.2, 12); return; }
    if (!drag) { const it = pick(e.clientX, e.clientY); hovered = it; room.classList.toggle("over-item", !!it); return; }
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.moved = Math.max(drag.moved, Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy));
    if (drag.moved > 6) room.classList.add("is-dragging");
    if (drag.flip0 != null) { focus.tFlip = drag.flip0 + (e.clientX - drag.sx) * 0.012; }
    else if (!focus) { view.tTheta = drag.theta - (e.clientX - drag.sx) * 0.006; view.tPhi = THREE.MathUtils.clamp(drag.phi - (e.clientY - drag.sy) * 0.004, 1.05, 1.72); }
  });
  const end = e => {
    pts.delete(e.pointerId); room.classList.remove("is-dragging");
    if (!drag) return;
    if (drag.pinch) { if (pts.size === 0) drag = null; return; }
    if (drag.flip0 != null) focus.tFlip = Math.round(focus.tFlip / Math.PI) * Math.PI;
    if (drag.moved < 6) {
      const it = drag.item;
      if (it && it === focus) App.open(it.p.id);
      else if (it) setFocus(it);
      else if (focus) setFocus(null);
    }
    drag = null; nudge();
  };
  canvas.addEventListener("pointerup", end); canvas.addEventListener("pointercancel", end);
  canvas.addEventListener("pointerleave", () => { if (!drag) { hovered = null; room.classList.remove("over-item"); } });
  canvas.addEventListener("wheel", e => {
    if (!e.ctrlKey && !focus) return; // normal scrolling passes through; pinch (ctrl+wheel) or a focused tee zooms
    e.preventDefault(); view.tR = THREE.MathUtils.clamp(view.tR + e.deltaY * 0.004, 3.2, 12); nudge();
  }, { passive: false });
  canvas.addEventListener("dblclick", e => { const it = pick(e.clientX, e.clientY); if (it) App.open(it.p.id); });
  $("#room-flip").addEventListener("click", () => { if (focus) focus.tFlip += Math.PI; });
  $("#room-open").addEventListener("click", () => { if (focus) App.open(focus.p.id); });
  $("#room-back").addEventListener("click", () => setFocus(null));
  addEventListener("keydown", e => { if (e.key === "Escape" && focus && !document.querySelector("dialog[open]")) setFocus(null); });
}
function nudge() { idleAt = clock.elapsedTime; hint.classList.add("gone"); }
function setFocus(it) {
  if (focus && focus !== it) focus.tFlip = 0;
  focus = it; ctrl.hidden = !it; hint.classList.add("gone");
}

/* ---------- frame ---------- */
const tmp = new THREE.Vector3(), camDir = new THREE.Vector3(), q = new THREE.Quaternion(), e3 = new THREE.Euler();
function tick() {
  const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
  if (!reduce && !focus && !drag && t - idleAt > 4) view.tTheta += dt * 0.06; // slow drift when idle
  const k = 1 - Math.pow(0.002, dt);
  view.theta += (view.tTheta - view.theta) * k; view.phi += (view.tPhi - view.phi) * k; view.r += (view.tR - view.r) * k;
  camera.position.set(Math.sin(view.theta) * Math.sin(view.phi) * view.r, Math.cos(view.phi) * view.r + 0.25, Math.cos(view.theta) * Math.sin(view.phi) * view.r);
  camera.lookAt(0, 0.1, 0);
  camera.getWorldDirection(camDir);
  keyLight.position.set(camera.position.x * 0.3, 7, camera.position.z * 0.3);

  const w = room.clientWidth, h = room.clientHeight;
  for (const it of items) {
    const isF = it === focus, dim = focus && !isF;
    it.pull += ((isF ? 1 : 0) - it.pull) * (1 - Math.pow(0.004, dt));
    it.hover += ((hovered === it && !focus ? 1 : 0) - it.hover) * (1 - Math.pow(0.01, dt));
    // zero-gravity bob + drift; pulled tees glide in front of the camera
    const bob = reduce ? 0 : Math.sin(t * 0.8 + it.seed) * 0.12;
    tmp.copy(it.home); tmp.y += bob; tmp.x += reduce ? 0 : Math.sin(t * 0.3 + it.seed) * 0.06;
    tmp.addScaledVector(camDir, -it.hover * 0.45);
    const front = camera.position.clone().addScaledVector(camDir, narrow ? 4.9 : 3.4); front.y -= 0.05;
    it.group.position.lerpVectors(tmp, front, it.pull);
    it.group.scale.setScalar(1 + it.hover * 0.06 + it.pull * 0.12);
    // face the camera, with a lazy sway, plus the flip
    it.group.lookAt(camera.position.x, it.group.position.y, camera.position.z);
    it.flip += (it.tFlip - it.flip) * (1 - Math.pow(0.003, dt));
    const sway = reduce ? 0 : Math.sin(t * 0.5 + it.seed) * 0.12 * (1 - it.pull);
    it.body.rotation.set(reduce ? 0 : Math.sin(t * 0.6 + it.seed * 2) * 0.04 * (1 - it.pull), sway + it.flip, reduce ? 0 : Math.sin(t * 0.4 + it.seed) * 0.05 * (1 - it.pull));
    const op = dim ? 0.25 : 1;
    it.face.material.opacity += (op - it.face.material.opacity) * 0.15; it.back.material.opacity = it.face.material.opacity;
    it.halo.material.opacity = (0.28 + it.hover * 0.25 + it.pull * 0.2) * it.face.material.opacity;
    // HTML label under each tee
    tmp.copy(it.group.position); tmp.y -= 1.12 * it.group.scale.y; tmp.project(camera);
    const vis = tmp.z < 1 && !isF && !(focus && dim) ? 1 : 0;
    it.label.style.opacity = vis * (1 - it.pull);
    it.label.style.left = ((tmp.x + 1) / 2 * w) + "px"; it.label.style.top = ((1 - tmp.y) / 2 * h) + "px";
  }
  if (!reduce) stepParticles(dt, t);
  floorRing.rotation.y = t * 0.02;
  renderer.render(scene, camera);
}

/* ---------- go ---------- */
if (can3d) setView(reduce ? store.get("ds-view", "grid") : store.get("ds-view", "room"));
