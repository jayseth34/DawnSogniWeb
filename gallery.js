/* The Dawn Sogni Gallery: a dark, spotlit hall with the designs hung like framed prints.
   Scroll / swipe to walk, tap a piece to step up to it and open it. Loaded only when the gallery is opened.
   three.js comes from jsDelivr (pinned version). */
(() => {
  const THREE_URL = "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";
  let started = false, ctl = null;

  window.DSGallery = {
    async open(api) {
      const root = document.getElementById("gallery");
      root.hidden = false; document.documentElement.classList.add("gallery-on");
      requestAnimationFrame(() => root.classList.add("in"));
      if (!started) {
        started = true;
        try { ctl = await build(api, root); }
        catch (e) {
          console.warn(e); started = false;
          root.querySelector(".gl-loading span").textContent = "This device can't show the 3D gallery. Taking you back to the shop…";
          setTimeout(() => this.close(), 2200); return;
        }
      }
      ctl.resume();
    },
    close() {
      const root = document.getElementById("gallery");
      root.classList.remove("in"); document.documentElement.classList.remove("gallery-on");
      if (ctl) ctl.pause();
      setTimeout(() => { if (!root.classList.contains("in")) root.hidden = true; }, 350);
      if (location.hash === "#gallery") history.replaceState(null, "", location.pathname + location.search);
    }
  };

  async function build(api, root) {
    const THREE = await import(THREE_URL);
    const canvas = root.querySelector("canvas");
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);
    scene.fog = new THREE.Fog(0x050505, 9, 30);
    const camera = new THREE.PerspectiveCamera(62, 1, 0.05, 80);
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ---------- layout ----------
    const items = api.products.slice().sort((a, b) => api.isOut(a) - api.isOut(b));
    const W = 6.2, H = 4.4, SP = 4.2, START = 3.6, eye = 1.62, ART = 1.3;
    const zOf = i => -(START + i * SP / 2);
    const lastZ = zOf(items.length - 1), END = lastZ - 6.5;
    const walkMin = 1.2, walkMax = END + 4.2; // camera z range (walking toward -z)

    // ---------- textures drawn on canvases ----------
    const canvasTex = (w, h, draw) => { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
    const glow = canvasTex(256, 256, (g, w, h) => { const r = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); r.addColorStop(0, "rgba(255,248,236,.55)"); r.addColorStop(.45, "rgba(255,248,236,.16)"); r.addColorStop(1, "rgba(255,248,236,0)"); g.fillStyle = r; g.fillRect(0, 0, w, h); });
    const beam = canvasTex(64, 256, (g, w, h) => { const r = g.createLinearGradient(0, 0, 0, h); r.addColorStop(0, "rgba(255,250,240,.28)"); r.addColorStop(1, "rgba(255,250,240,0)"); g.fillStyle = r; g.fillRect(0, 0, w, h); });
    const font = getComputedStyle(document.body).fontFamily || "sans-serif";
    try { await Promise.all([document.fonts.load(`700 40px ${font}`), document.fonts.load(`italic 700 40px ${font}`)]); } catch (e) {}
    const label = p => canvasTex(1024, 256, (g, w, h) => {
      g.fillStyle = "#0b0b0b"; g.fillRect(0, 0, w, h);
      g.fillStyle = "#fff"; g.font = `italic 700 64px ${font}`; g.textBaseline = "middle";
      let name = p.name.toUpperCase(); while (g.measureText(name).width > w - 120 && name.length > 4) name = name.slice(0, -2) + "…";
      g.fillText(name, 56, 92);
      g.fillStyle = "rgba(255,255,255,.62)"; g.font = `500 44px ${font}`;
      g.fillText(api.isOut(p) ? "Sold out" : `From ${api.price(p)}${api.isNew(p) ? "   ·   New" : ""}`, 56, 178);
    });

    // ---------- the hall ----------
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x232326, roughness: .9 });
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0b, roughness: .32, metalness: .35 });
    const ceilMat = new THREE.MeshStandardMaterial({ color: 0x0c0c0d, roughness: 1 });
    const len = Math.abs(END) + 8, midZ = END / 2 + 2;
    const plane = (w, h, mat) => new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    const floor = plane(W, len, floorMat); floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, midZ); scene.add(floor);
    const ceil = plane(W, len, ceilMat); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, H, midZ); scene.add(ceil);
    const wl = plane(len, H, wallMat); wl.rotation.y = Math.PI / 2; wl.position.set(-W / 2, H / 2, midZ); scene.add(wl);
    const wr = plane(len, H, wallMat); wr.rotation.y = -Math.PI / 2; wr.position.set(W / 2, H / 2, midZ); scene.add(wr);
    const we = plane(W, H, wallMat); we.position.set(0, H / 2, END); scene.add(we);
    const wb = plane(W, H, wallMat); wb.rotation.y = Math.PI; wb.position.set(0, H / 2, 4); scene.add(wb);
    // skirting lines and a ceiling light strip give the hall depth
    const lineMat = new THREE.MeshBasicMaterial({ color: 0x2a2a2d });
    [-1, 1].forEach(s => { const b = new THREE.Mesh(new THREE.BoxGeometry(.02, .08, len), lineMat); b.position.set(s * (W / 2 - .01), .04, midZ); scene.add(b); });
    const strip = new THREE.Mesh(new THREE.BoxGeometry(.08, .02, len - 2), new THREE.MeshBasicMaterial({ color: 0x3a3a3d })); strip.position.set(0, H - .01, midZ); scene.add(strip);
    scene.add(new THREE.HemisphereLight(0xb4bac4, 0x0a0a0a, .9));
    const key = new THREE.PointLight(0xfff4e6, 10, 11, 1.5); scene.add(key); // follows the visitor

    // ---------- framed pieces ----------
    const loader = new THREE.TextureLoader();
    const frames = [], pickables = [];
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x0d0d0e, roughness: .55, metalness: .2 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0x9a9ca2, roughness: .3, metalness: .9 });
    const fixtureMat = new THREE.MeshStandardMaterial({ color: 0x111112, roughness: .4, metalness: .6 });
    let loaded = 0; const total = items.length + 1;
    const progress = () => { loaded++; root.querySelector(".gl-loading span").textContent = `Opening the gallery… ${Math.round(loaded / total * 100)}%`; };
    const loadTex = src => new Promise(ok => loader.load(src, t => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = renderer.capabilities.getMaxAnisotropy(); ok(t); }, undefined, () => ok(null)));

    await Promise.all(items.map(async (p, i) => {
      const left = i % 2 === 0, x = left ? -W / 2 + .02 : W / 2 - .02, z = zOf(i), ry = left ? Math.PI / 2 : -Math.PI / 2;
      const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g);
      const art = new THREE.Group(); art.position.set(0, 1.95, 0); art.scale.set(ART, ART, 1); g.add(art);
      const rim = new THREE.Mesh(new THREE.BoxGeometry(1.74, 2.14, .05), rimMat); rim.position.z = .025; art.add(rim);
      const board = new THREE.Mesh(new THREE.BoxGeometry(1.68, 2.08, .08), frameMat); board.position.z = .05; art.add(board);
      const sd = api.sides(p), src = sd[sd.cover] || p.tee;
      const tex = await loadTex(api.thumb(src)); progress();
      const teeMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, color: api.isOut(p) ? 0x777777 : 0xffffff });
      const tee = new THREE.Mesh(new THREE.PlaneGeometry(1.44, 1.44), teeMat); tee.position.set(0, .22, .095); art.add(tee);
      const lab = new THREE.Mesh(new THREE.PlaneGeometry(1.44, .36), new THREE.MeshBasicMaterial({ map: label(p), toneMapped: false })); lab.position.set(0, -.74, .095); art.add(lab);
      // light: a pool on the wall, a soft beam from the fixture, a pool on the floor
      const pool = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 4.4), new THREE.MeshBasicMaterial({ map: glow, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); pool.position.set(0, 2.25, .012); g.add(pool);
      const fl = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6), new THREE.MeshBasicMaterial({ map: glow, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: .55 })); fl.rotation.x = -Math.PI / 2; fl.position.set(0, .012, .9); g.add(fl);
      const cone = new THREE.Mesh(new THREE.CylinderGeometry(.05, .95, 2.3, 24, 1, true), new THREE.MeshBasicMaterial({ map: beam, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, opacity: .55 }));
      cone.position.set(0, H - 1.15, 1.05); cone.rotation.x = -.42; g.add(cone);
      const fix = new THREE.Mesh(new THREE.CylinderGeometry(.07, .09, .2, 16), fixtureMat); fix.position.set(0, H - .1, 1.25); fix.rotation.x = -.5; g.add(fix);
      [tee, board, lab].forEach(m => { m.userData.frame = i; pickables.push(m); });
      frames[i] = { p, g, art, tee, teeMat, pool, src, world: new THREE.Vector3(x, 1.95, z), normal: new THREE.Vector3(left ? 1 : -1, 0, 0), full: false };
    }));

    // end wall: the DS mark (additive, so its black background melts into the wall), and a piece that opens the Design Studio
    const logoTex = await loadTex("images/logo-full.webp"); progress();
    if (logoTex) { const a = logoTex.image.width / logoTex.image.height; const lg = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 3.6 / a), new THREE.MeshBasicMaterial({ map: logoTex, transparent: true, toneMapped: false, blending: THREE.AdditiveBlending, depthWrite: false })); lg.position.set(0, 2.85, END + .03); scene.add(lg); }
    const endPool = new THREE.Mesh(new THREE.PlaneGeometry(6, 4.4), new THREE.MeshBasicMaterial({ map: glow, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); endPool.position.set(0, 2.2, END + .02); scene.add(endPool);
    const studioTex = canvasTex(1024, 300, (g, w, h) => {
      g.fillStyle = "#fff"; g.beginPath(); g.roundRect(8, 8, w - 16, h - 16, 140); g.fill();
      g.fillStyle = "#000"; g.textAlign = "center"; g.textBaseline = "middle"; g.font = `italic 700 88px ${font}`; g.fillText("Design your own", w / 2, h / 2 - 22);
      g.font = `500 44px ${font}`; g.fillStyle = "rgba(0,0,0,.6)"; g.fillText("Open the Dawn Sogni Studio", w / 2, h / 2 + 60);
    });
    const studio = new THREE.Mesh(new THREE.PlaneGeometry(2.4, .7), new THREE.MeshBasicMaterial({ map: studioTex, transparent: true, toneMapped: false }));
    studio.position.set(0, 1.25, END + .04); studio.userData.studio = true; scene.add(studio); pickables.push(studio);

    // ---------- walking ----------
    let target = Math.min(walkMin, zOf(0) + 2.6), z = target + 2.5, look = new THREE.Vector3(0, eye, -10), lookTarget = look.clone();
    let mode = "walk", focus = null, tw = null, mx = 0, my = 0;
    const clamp = v => Math.max(walkMax, Math.min(walkMin, v));
    const portrait = () => innerHeight > innerWidth;
    function resize() {
      const w = root.clientWidth, h = root.clientHeight; renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.fov = portrait() ? 74 : 60; camera.updateProjectionMatrix();
    }
    addEventListener("resize", resize); resize();
    // the camera turns toward the piece you're walking up to (more on phones, where the side walls are out of view)
    let side = 0; // on phones the visitor steps across the hall to face the piece they're walking up to
    function walkLook() {
      let best = null, bw = 0;
      frames.forEach(f => { if (!f) return; const ahead = z - f.world.z; if (ahead < -1 || ahead > 7) return; const w = Math.max(0, 1 - Math.abs(ahead - 2.6) / 3.2); if (w > bw) { bw = w; best = f; } });
      const fwd = new THREE.Vector3(0, eye, z - 10);
      side = best && portrait() ? -best.normal.x * 1.75 * Math.min(1, bw * 1.4) : 0;
      if (!best) return fwd;
      const k = Math.min(1, bw * (portrait() ? 1.25 : .62));
      return fwd.lerp(best.world.clone().setY(eye + .2), k);
    }
    const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    function tweenTo(pos, lookAt, ms, done) {
      tw = { from: camera.position.clone(), to: pos, lf: look.clone(), lt: lookAt, t0: performance.now(), ms: reduce ? 1 : ms, done };
    }
    function goTo(i) {
      const f = frames[i]; if (!f) return;
      mode = "focus"; focus = i; hideHint();
      const pos = f.world.clone().add(f.normal.clone().multiplyScalar(portrait() ? 3.4 : 2.7)); pos.y = eye + .15;
      tweenTo(pos, f.world.clone(), 900, () => {
        if (!f.full) { f.full = true; loadTex(f.src).then(t => { if (t) { f.teeMat.map = t; f.teeMat.needsUpdate = true; } }); }
        api.open(f.p.id);
      });
      setCount(i);
    }
    function backToWalk() {
      if (mode !== "focus") return;
      const f = frames[focus]; mode = "tween";
      z = target = clamp(f.world.z + 2.4);
      const back = walkLook(); xNow = side;
      tweenTo(new THREE.Vector3(side, eye, z), back, 750, () => { mode = "walk"; focus = null; });
    }
    api.onSheetClose(() => { if (!root.hidden && mode === "focus") backToWalk(); });

    // input
    const hint = root.querySelector(".gl-hint"); let hinted = false;
    const hideHint = () => { if (!hinted) { hinted = true; hint.classList.add("gone"); } };
    root.addEventListener("wheel", e => { if (mode !== "walk") return; e.preventDefault(); target = clamp(target - e.deltaY * .0045); hideHint(); }, { passive: false });
    let drag = null;
    canvas.addEventListener("pointerdown", e => { drag = { y: e.clientY, x: e.clientX, t0: target, moved: 0 }; });
    addEventListener("pointermove", e => {
      mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5;
      if (drag && mode === "walk") { const dy = e.clientY - drag.y, dx = e.clientX - drag.x; drag.moved = Math.max(drag.moved, Math.hypot(dx, dy)); target = clamp(drag.t0 + (dy + dx * .6) * .016); if (drag.moved > 8) hideHint(); }
      if (!drag && e.pointerType === "mouse") hover(e);
    });
    addEventListener("pointerup", e => { if (drag && drag.moved < 8 && e.target === canvas) pick(e); drag = null; });
    addEventListener("keydown", e => {
      if (root.hidden || document.querySelector("dialog[open]")) return;
      if (e.key === "Escape") return window.DSGallery.close();
      if (mode !== "walk") return;
      if (["ArrowUp", "ArrowRight", "PageDown", " "].includes(e.key)) { e.preventDefault(); step(1); }
      if (["ArrowDown", "ArrowLeft", "PageUp"].includes(e.key)) { e.preventDefault(); step(-1); }
      if (e.key === "Enter") { const i = nearest(); if (i > -1) goTo(i); }
    });
    // jump to the next / previous piece
    const nearest = () => { let bi = -1, bd = 1e9; frames.forEach((f, i) => { const d = Math.abs(z - 2.6 - f.world.z); if (d < bd) { bd = d; bi = i; } }); return bi; };
    function step(dir) { hideHint(); const i = Math.max(0, Math.min(frames.length - 1, nearest() + dir)); target = clamp(frames[i].world.z + 2.6); setCount(i); }
    root.querySelector(".gl-next").onclick = () => step(1);
    root.querySelector(".gl-prev").onclick = () => step(-1);
    root.querySelector(".gl-back").onclick = () => window.DSGallery.close();

    const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
    const hit = e => { const r = canvas.getBoundingClientRect(); ndc.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, camera); const h = ray.intersectObjects(pickables, false)[0]; return h && h.distance < 14 ? h.object : null; };
    let hovered = -1;
    function hover(e) {
      if (mode !== "walk") return;
      const o = hit(e), i = o && o.userData.frame != null ? o.userData.frame : -1;
      canvas.style.cursor = o ? "pointer" : "grab";
      if (i !== hovered) { hovered = i; }
    }
    function pick(e) {
      if (mode !== "walk") return;
      const o = hit(e); if (!o) return;
      if (o.userData.studio) { window.DSGallery.close(); const a = document.querySelector('a[href*="/printcanvas"]'); if (a) a.click(); return; }
      goTo(o.userData.frame);
    }

    // count + progress
    const countEl = root.querySelector(".gl-count"), bar = root.querySelector(".gl-progress i");
    function setCount(i) { countEl.textContent = `${i + 1} / ${frames.length}`; }

    // ---------- render loop ----------
    let running = false, last = performance.now(), xNow = 0;
    function frame(now) {
      if (!running) return;
      const dt = Math.min(.05, (now - last) / 1000); last = now;
      if (tw) {
        const k = Math.min(1, (now - tw.t0) / tw.ms), e = ease(k);
        camera.position.lerpVectors(tw.from, tw.to, e); look.lerpVectors(tw.lf, tw.lt, e);
        if (k >= 1) { const d = tw.done; tw = null; if (d) d(); }
      } else if (mode === "walk") {
        z += (target - z) * Math.min(1, dt * (reduce ? 20 : 4.2));
        lookTarget.copy(walkLook()); look.lerp(lookTarget, Math.min(1, dt * 3.2));
        xNow += (side - xNow) * Math.min(1, dt * 2.6);
        camera.position.set(xNow + mx * .25, eye + Math.sin(now / 900) * (reduce ? 0 : .008) - my * .12, z);
      }
      camera.lookAt(look.x + mx * .9, look.y - my * .5, look.z);
      key.position.set(0, H - .4, camera.position.z - 2.5);
      frames.forEach((f, i) => { const s = ART * (i === hovered && mode === "walk" ? 1.035 : 1); f.art.scale.lerp(new THREE.Vector3(s, s, 1), Math.min(1, dt * 8)); });
      bar.style.transform = `scaleX(${Math.min(1, Math.max(0, (walkMin - z) / (walkMin - walkMax)))})`;
      if (mode === "walk") { const n = nearest(); if (n > -1 && Math.abs(z - 2.6 - frames[n].world.z) < 1.6) setCount(n); }
      renderer.render(scene, camera);
      requestAnimationFrame(frame);
    }
    root.querySelector(".gl-loading").classList.add("done");
    setCount(0);
    return {
      resume() { if (running) return; running = true; last = performance.now(); resize(); requestAnimationFrame(frame); },
      pause() { running = false; }
    };
  }
})();
