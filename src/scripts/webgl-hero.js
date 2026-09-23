import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, Mesh, Points, Sprite, Clock, Color, MathUtils,
  TorusGeometry, SphereGeometry, BufferGeometry, Float32BufferAttribute,
  MeshPhysicalMaterial, PointsMaterial, SpriteMaterial, CanvasTexture,
  HemisphereLight, DirectionalLight, PointLight, AdditiveBlending, NormalBlending, SRGBColorSpace,
} from 'three';

// Arc geometry traced from the TechyOps mark (64×64 viewBox, centre 32,32), scaled 1:10.
const MARK = {
  outer: { radius: 2.4, tube: 0.33, start: MathUtils.degToRad(170.7), length: MathUtils.degToRad(263.8) },
  inner: { radius: 1.3, tube: 0.3, start: MathUtils.degToRad(40), length: MathUtils.degToRad(185) },
  core: 0.42,
};
const STOPS = ['#93C7F9', '#4C8DF6', '#3253D4'].map((c) => new Color(c));

function gradientAt(t) {
  const c = new Color();
  return t < 0.5 ? c.lerpColors(STOPS[0], STOPS[1], t * 2) : c.lerpColors(STOPS[1], STOPS[2], (t - 0.5) * 2);
}

// Bakes the logo's top-left → bottom-right gradient into vertex colours, in mark space.
function paint(geo, rotation, extent) {
  const pos = geo.attributes.position;
  const cs = Math.cos(rotation), sn = Math.sin(rotation);
  const colors = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i);
    const mx = x * cs - y * sn, my = x * sn + y * cs;
    const c = gradientAt(MathUtils.clamp((mx - my) / (4 * extent) + 0.5, 0, 1));
    colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new Float32BufferAttribute(colors, 3));
  return geo;
}

function glowTexture() {
  const s = 128, cv = document.createElement('canvas');
  cv.width = cv.height = s;
  const g = cv.getContext('2d');
  const grd = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.22, 'rgba(255,255,255,.5)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, s, s);
  const tex = new CanvasTexture(cv);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

function buildArc(spec, material, glowTex, packetCount) {
  const extent = MARK.outer.radius + MARK.outer.tube;
  const spin = new Group();
  spin.rotation.z = spec.start;

  spin.add(new Mesh(paint(new TorusGeometry(spec.radius, spec.tube, 32, 200, spec.length), spec.start, extent), material));
  [0, spec.length].forEach((a) => {
    const cap = new SphereGeometry(spec.tube, 32, 20);
    cap.translate(Math.cos(a) * spec.radius, Math.sin(a) * spec.radius, 0);
    spin.add(new Mesh(paint(cap, spec.start, extent), material));
  });

  const packets = [];
  for (let i = 0; i < packetCount; i++) {
    const sprite = new Sprite(new SpriteMaterial({
      map: glowTex, color: 0xeaf4ff, transparent: true, depthWrite: false, blending: AdditiveBlending,
    }));
    spin.add(sprite);
    packets.push({ sprite, phase: i / packetCount });
  }

  const pivot = new Group();
  pivot.add(spin);
  return { pivot, spin, packets, spec };
}

export function initHeroScene(canvas, { reduce = false } = {}) {
  let renderer;
  try {
    renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  } catch (e) {
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new Scene();
  const camera = new PerspectiveCamera(35, 1, 0.1, 50);
  camera.position.set(0, 0, 10.5);

  scene.add(new HemisphereLight(0xdbe9ff, 0x0b1229, 1.1));
  const key = new DirectionalLight(0xffffff, 2.4);
  key.position.set(3, 4, 6);
  scene.add(key);
  const rim = new DirectionalLight(0x93c7f9, 1.6);
  rim.position.set(-5, -2, -4);
  scene.add(rim);
  const coreLight = new PointLight(0x4c8df6, 5, 7, 1.4);
  scene.add(coreLight);

  const glowTex = glowTexture();
  const ringMat = new MeshPhysicalMaterial({
    vertexColors: true, roughness: 0.3, metalness: 0.12, clearcoat: 0.9, clearcoatRoughness: 0.22,
  });

  const emblem = new Group();
  scene.add(emblem);

  const outer = buildArc(MARK.outer, ringMat, glowTex, 3);
  const inner = buildArc(MARK.inner, ringMat, glowTex, 2);
  emblem.add(outer.pivot, inner.pivot);

  const coreMat = new MeshPhysicalMaterial({
    color: 0x4c8df6, emissive: 0x2a55d8, emissiveIntensity: 0.45, roughness: 0.18, clearcoat: 1,
  });
  const core = new Mesh(new SphereGeometry(MARK.core, 48, 32), coreMat);
  emblem.add(core);
  const coreGlow = new Sprite(new SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false }));
  coreGlow.scale.setScalar(2.4);
  emblem.add(coreGlow);

  const DUST = 260;
  const dustPos = new Float32Array(DUST * 3);
  for (let i = 0; i < DUST; i++) {
    const r = 3 + Math.random() * 2.6;
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    dustPos[i * 3] = r * Math.sin(ph) * Math.cos(th);
    dustPos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
    dustPos[i * 3 + 2] = r * Math.cos(ph) * 0.6;
  }
  const dustGeo = new BufferGeometry();
  dustGeo.setAttribute('position', new Float32BufferAttribute(dustPos, 3));
  const dustMat = new PointsMaterial({ map: glowTex, size: 0.09, transparent: true, depthWrite: false, opacity: 0.7 });
  const dust = new Points(dustGeo, dustMat);
  scene.add(dust);

  function applyTheme() {
    const css = getComputedStyle(document.documentElement);
    const accent = new Color(css.getPropertyValue('--accent').trim() || '#4C8DF6');
    const light = new Color(css.getPropertyValue('--ink').trim() || '#0E1430').getHSL({}).l > 0.5;
    coreGlow.material.color.copy(accent);
    coreGlow.material.blending = light ? NormalBlending : AdditiveBlending;
    coreGlow.material.opacity = light ? 0.28 : 0.6;
    dustMat.color.copy(accent);
    dustMat.blending = light ? NormalBlending : AdditiveBlending;
    dustMat.opacity = light ? 0.45 : 0.7;
    [coreGlow.material, dustMat].forEach((m) => { m.needsUpdate = true; });
  }
  applyTheme();

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();

  let boost = 1, pulse = 0;
  let pointerX = 0, pointerY = 0;

  function pose(t, e, dt) {
    // e: intro progress. At e=0 the rings sit face-on, exactly as the flat logo.
    outer.pivot.rotation.set(e * (0.55 + Math.sin(t * 0.35) * 0.18), e * Math.sin(t * 0.22) * 0.55, 0);
    inner.pivot.rotation.set(e * (-0.45 + Math.cos(t * 0.3) * 0.25), e * (0.7 + t * 0.32), 0);
    outer.spin.rotation.z = outer.spec.start + e * t * 0.16;
    inner.spin.rotation.z = inner.spec.start - e * t * 0.24;
    emblem.scale.setScalar(0.74 + 0.26 * e);

    [outer, inner].forEach((arc) => {
      const { radius, tube, length } = arc.spec;
      arc.packets.forEach((p) => {
        p.phase = (p.phase + dt * 0.11 * boost * (MARK.outer.length / length)) % 1;
        const a = p.phase * length;
        p.sprite.position.set(Math.cos(a) * radius, Math.sin(a) * radius, tube * 0.96);
        p.sprite.scale.setScalar(tube * 2.6 * Math.sin(p.phase * Math.PI) * e);
      });
    });

    const beat = 1 + pulse * 0.22 + Math.sin(t * 1.6) * 0.025;
    core.scale.setScalar(beat);
    coreGlow.scale.setScalar(2.4 * beat + pulse * 1.2);
    coreLight.intensity = 5 + pulse * 10;
    dust.rotation.y = t * 0.025;
    dust.rotation.x = t * 0.012;
  }

  if (reduce) {
    pose(4, 1, 0);
    renderer.render(scene, camera);
    canvas.classList.add('ready');
    const rerender = () => { resize(); applyTheme(); renderer.render(scene, camera); };
    new ResizeObserver(rerender).observe(canvas);
    new MutationObserver(rerender).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', rerender);
    return;
  }

  new ResizeObserver(resize).observe(canvas);
  new MutationObserver(applyTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', applyTheme);

  window.addEventListener('pointermove', (e) => {
    pointerX = (e.clientX / window.innerWidth) * 2 - 1;
    pointerY = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });
  document.addEventListener('automation:run', () => { boost = 6; pulse = 1; });

  const clock = new Clock();
  let intro = 0;
  function tick() {
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    intro = Math.min(1, intro + dt / 2.2);
    const e = 1 - Math.pow(1 - intro, 3);

    boost += (1 - boost) * Math.min(1, dt * 1.2);
    pulse += (0 - pulse) * Math.min(1, dt * 2.2);
    pose(t, e, dt);

    emblem.rotation.y += (pointerX * 0.45 - emblem.rotation.y) * 0.05;
    emblem.rotation.x += (pointerY * 0.3 - emblem.rotation.x) * 0.05;
    emblem.rotation.z = window.scrollY * 0.0009;

    renderer.render(scene, camera);
  }

  const io = new IntersectionObserver(([entry]) => {
    renderer.setAnimationLoop(entry.isIntersecting ? tick : null);
    if (entry.isIntersecting) clock.getDelta();
  });
  io.observe(canvas);
  requestAnimationFrame(() => canvas.classList.add('ready'));
}
