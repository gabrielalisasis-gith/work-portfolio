/* About page: real-photo 3D portrait + live automation network.
   The portrait is Gab's own photo pixels on a depth-displaced mesh (no redraw);
   the network is a separate canvas behind him so the silhouette shadow only
   applies to the portrait. Loaded lazily from site.js when WebGL2 is available. */
import {
  WebGLRenderer, Scene, PerspectiveCamera, PlaneGeometry, BufferGeometry, BufferAttribute,
  ShaderMaterial, Mesh, Points, Group, Sprite, SpriteMaterial, CanvasTexture, TextureLoader,
  LinearFilter, LinearSRGBColorSpace, NoColorSpace, DoubleSide, Vector3, Euler, Quaternion
} from 'three';

const FOV = 16, AR = 1100 / 934, DEPTH = 0.3;
const TAN = Math.tan(FOV * Math.PI / 360);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const ease = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 4);
const damp = (dt, k) => 1 - Math.exp(-dt * k);

function rng(seed) {
  return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
}

const probe = document.createElement('canvas').getContext('2d');
function color(str, fallback) {
  probe.fillStyle = fallback; probe.fillStyle = (str || '').trim() || fallback;
  const v = probe.fillStyle;
  if (v[0] === '#') return [1, 3, 5].map((i) => parseInt(v.slice(i, i + 2), 16) / 255).concat(1);
  const m = v.match(/[\d.]+/g).map(Number);
  return [m[0] / 255, m[1] / 255, m[2] / 255, m.length > 3 ? m[3] : 1];
}

// pick the smallest srcset candidate that covers the needed pixel width
function pickSrc(img, need) {
  const list = (img.getAttribute('srcset') || '').split(',').map((s) => s.trim().split(/\s+/))
    .filter((p) => p[0]).map((p) => ({ url: p[0], w: parseInt(p[1], 10) || 0 })).sort((a, b) => a.w - b.w);
  const hit = list.find((c) => c.w >= need) || list[list.length - 1];
  return hit ? hit.url : img.getAttribute('src');
}

const PORTRAIT_VS = /* glsl */`
  uniform sampler2D uD0, uD1;
  uniform float uDMix, uDepth;
  uniform vec3 uNeck;
  uniform vec2 uHead;
  varying vec2 vUv;
  mat3 rotY(float a){ float c = cos(a), s = sin(a); return mat3(c,0.,-s, 0.,1.,0., s,0.,c); }
  mat3 rotX(float a){ float c = cos(a), s = sin(a); return mat3(1.,0.,0., 0.,c,s, 0.,-s,c); }
  void main(){
    vUv = uv;
    float d = mix(texture2D(uD0, uv).r, texture2D(uD1, uv).r, uDMix);
    vec3 p = position;
    p.z += d * uDepth;
    // the head turns further than the body, bending smoothly through the neck
    float hw = smoothstep(0.64, 0.695, uv.y) * (1.0 - smoothstep(0.14, 0.23, abs(uv.x - (uNeck.x + 0.5))));
    p = rotY(uHead.x * hw) * rotX(uHead.y * hw) * (p - uNeck) + uNeck;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const PORTRAIT_FS = /* glsl */`
  uniform sampler2D uC0, uC1, uD0, uD1;
  uniform float uCMix, uDMix, uDepth, uIntro, uLight, uKey;
  uniform vec3 uL, uL0;
  uniform vec2 uTexel;
  varying vec2 vUv;
  float dep(vec2 uv){ return mix(texture2D(uD0, uv).r, texture2D(uD1, uv).r, uDMix); }
  void main(){
    // colour textures are premultiplied on upload, so edges filter cleanly
    vec4 c = mix(texture2D(uC0, vUv), texture2D(uC1, vUv), uCMix);
    c *= smoothstep(0.02, 0.32, vUv.y) * smoothstep(0.0, 0.22, uIntro);
    if (c.a < 0.003) discard;
    vec2 e = uTexel * 7.0; // wide kernel: smooth, low-frequency shading only
    float dx = (dep(vUv + vec2(e.x, 0.)) - dep(vUv - vec2(e.x, 0.))) / (2.0 * e.x) * uDepth;
    float dy = (dep(vUv + vec2(0., e.y)) - dep(vUv - vec2(0., e.y))) / (2.0 * e.y * ${AR.toFixed(5)}) * uDepth;
    vec3 n = normalize(vec3(-dx, -dy, 1.0));
    // relight relative to the photo's own light: identical pixels when the light is centred
    float shade = 1.0 + uLight * (max(dot(n, uL), 0.) - max(dot(n, uL0), 0.)) + uKey * max(dot(n, uL), 0.);
    vec3 col = c.rgb * shade * mix(0.16, 1.0, smoothstep(0.12, 1.0, uIntro));
    gl_FragColor = vec4(col, c.a);
  }
`;

// shared by lines, nodes and pulses: fade the network away from the text column
const NET_MASK = /* glsl */`
  uniform vec4 uFig;      // figure rect in frame space: left, bottom, right, top (0..1, y up)
  uniform vec2 uFade;     // x: fade on the left (desktop), y: fade on top (stacked mobile)
  uniform float uReveal;
  float netMask(vec2 f){
    float fw = uFig.z - uFig.x, fh = uFig.w - uFig.y;
    float m = mix(1.0, smoothstep(uFig.x - 0.03 * fw, uFig.x + 0.16 * fw, f.x), uFade.x);
    m *= mix(1.0, 1.0 - smoothstep(uFig.w - 0.10 * fh, uFig.w + 0.05 * fh, f.y), uFade.y);
    m *= smoothstep(uFig.y + 0.30 * fh, uFig.y + 0.62 * fh, f.y);
    m *= 1.0 - smoothstep(0.86, 1.0, f.x);
    m *= smoothstep(0.0, 0.10, f.x) * (1.0 - smoothstep(0.9, 1.0, f.y));
    return m;
  }
`;

const LINE_VS = /* glsl */`
  attribute vec3 aB;
  attribute float aT, aS, aAlpha, aKey;
  uniform vec2 uRes;
  uniform float uW;
  varying float vA, vT, vKey;
  varying vec2 vF;
  void main(){
    vec4 pa = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    vec4 pb = projectionMatrix * modelViewMatrix * vec4(aB, 1.0);
    vec2 sa = pa.xy / pa.w * uRes, sb = pb.xy / pb.w * uRes;
    vec2 dir = normalize(sb - sa + 1e-5);
    vec4 p = mix(pa, pb, aT);
    p.xy += vec2(-dir.y, dir.x) * aS * uW / uRes * p.w;
    gl_Position = p;
    vF = p.xy / p.w * 0.5 + 0.5;
    vA = aAlpha; vT = aT; vKey = aKey;
  }
`;
const LINE_FS = /* glsl */`
  uniform vec3 uCol;
  varying float vA, vT, vKey;
  varying vec2 vF;
  ${NET_MASK}
  void main(){
    float grow = clamp((uReveal - vKey) * 5.0, 0.0, 1.0);
    float a = vA * step(vT, grow) * netMask(vF);
    if (a < 0.002) discard;
    gl_FragColor = vec4(uCol * a, a);
  }
`;

const DOT_VS = /* glsl */`
  attribute float aSize, aAlpha, aKey, aKind;
  uniform float uScale;
  varying float vA, vKey, vKind;
  varying vec2 vF;
  void main(){
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * uScale / -mv.z;
    vF = gl_Position.xy / gl_Position.w * 0.5 + 0.5;
    vA = aAlpha; vKey = aKey; vKind = aKind;
  }
`;
const DOT_FS = /* glsl */`
  uniform vec3 uCol, uCol2;
  uniform float uTime;
  varying float vA, vKey, vKind;
  varying vec2 vF;
  ${NET_MASK}
  void main(){
    float d = length(gl_PointCoord - 0.5) * 2.0;
    float a;
    if (vKind > 1.5) {            // travelling data pulse: soft glow with a hot core
      a = pow(1.0 - clamp(d, 0., 1.), 2.2) + 0.6 * smoothstep(0.35, 0.1, d);
    } else if (vKind > 0.5) {     // hub: solid core + slowly breathing ring
      float ring = smoothstep(0.1, 0.0, abs(d - (0.62 + 0.18 * sin(uTime * 2.0 + vKey * 9.0))));
      a = smoothstep(0.34, 0.24, d) + ring * 0.55;
    } else {
      a = smoothstep(1.0, 0.55, d);
    }
    a *= vA * smoothstep(vKey, vKey + 0.12, uReveal) * netMask(vF);
    if (a < 0.002) discard;
    vec3 c = vKind > 1.5 ? mix(uCol, uCol2, step(0.5, fract(vKey * 7.0))) : uCol;
    gl_FragColor = vec4(c * a, a);
  }
`;

const GLOW_FS = /* glsl */`
  uniform vec3 uCol;
  uniform float uA;
  varying vec2 vUv;
  void main(){
    float r = length(vUv - 0.5) * 2.0;
    float a = uA * pow(1.0 - clamp(r, 0., 1.), 2.0);
    gl_FragColor = vec4(uCol * a, a);
  }
`;
const UV_VS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';

const LABELS = [
  { at: [0.07, 0.07], text: 'New lead', dot: 'accent', side: 1, layer: 0 },
  { at: [0.8, 0.02], text: 'Tagged · hot-lead', dot: 'accent', side: -1, layer: 1 },
  { at: [0.93, 0.22], text: 'SMS sent · 38s', dot: 'accent', side: -1, layer: 0 },
  { at: [0.08, 0.27], text: 'Call booked', dot: 'pos', side: 1, layer: 0 },
];
// narrow screens: fewer labels, kept clear of his hair
const LABELS_SMALL = [
  { at: [0.07, 0.06], text: 'New lead', dot: 'accent', side: 1, layer: 0 },
  { at: [0.95, 0.15], text: 'SMS sent · 38s', dot: 'accent', side: -1, layer: 0 },
  { at: [0.95, 0.285], text: 'Call booked', dot: 'pos', side: -1, layer: 0 },
];
const LAYERS = [-0.3, -0.75, -1.35];
const LAYER_ALPHA = [0.6, 0.36, 0.2];

export default function initPortrait3D(fig, { reduce = false } = {}) {
  const hero = fig.closest('section') || document.body;
  const imgOn = fig.querySelector('.p-on'), imgOff = fig.querySelector('.p-off');
  const ex = parseFloat(fig.dataset.eyeX) / 100, ey = parseFloat(fig.dataset.eyeY) / 100;
  const hover = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const small = !hover || innerWidth < 700;

  const netCv = document.createElement('canvas'), glCv = document.createElement('canvas');
  netCv.className = 'portrait-net'; glCv.className = 'portrait-gl';
  netCv.setAttribute('aria-hidden', 'true'); glCv.setAttribute('aria-hidden', 'true');
  fig.insertBefore(netCv, fig.firstChild); fig.appendChild(glCv);

  const mkR = (cv) => {
    const r = new WebGLRenderer({ canvas: cv, alpha: true, antialias: true, premultipliedAlpha: true, powerPreference: 'high-performance' });
    r.setClearColor(0x000000, 0); r.outputColorSpace = LinearSRGBColorSpace;
    cv.addEventListener('webglcontextlost', (e) => { e.preventDefault(); fig.classList.remove('is-3d', 'is-3d-ready'); });
    return r;
  };
  const netR = mkR(netCv), glR = mkR(glCv);
  const netScene = new Scene(), glScene = new Scene();
  const cam = new PerspectiveCamera(FOV, 1, 0.05, 60), pcam = new PerspectiveCamera(FOV, 1, 0.05, 60);

  /* ---------- portrait mesh ---------- */
  const need = fig.offsetWidth * Math.min(devicePixelRatio || 1, 2);
  const loader = new TextureLoader();
  const load = (url, premult) => new Promise((res, rej) => loader.load(url, (t) => {
    t.colorSpace = NoColorSpace; t.generateMipmaps = false; t.minFilter = t.magFilter = LinearFilter;
    t.premultiplyAlpha = premult; res(t);
  }, undefined, rej));

  const uni = {
    uC0: { value: null }, uC1: { value: null }, uD0: { value: null }, uD1: { value: null },
    uCMix: { value: 0 }, uDMix: { value: 0 }, uDepth: { value: DEPTH }, uIntro: { value: reduce ? 1 : 0 },
    uLight: { value: 0.16 }, uKey: { value: 0 },
    uL: { value: new Vector3(0, 0.15, 1).normalize() }, uL0: { value: new Vector3(0, 0.15, 1).normalize() },
    uTexel: { value: [1 / 467, 1 / 550] },
    uNeck: { value: new Vector3(ex - 0.5, (0.5 - 0.32) * AR, DEPTH * 0.6) }, uHead: { value: [0, 0] },
  };
  const seg = small ? [150, 177] : [220, 259];
  const mesh = new Mesh(new PlaneGeometry(1, AR, seg[0], seg[1]), new ShaderMaterial({
    uniforms: uni, vertexShader: PORTRAIT_VS, fragmentShader: PORTRAIT_FS,
    transparent: true, premultipliedAlpha: true, depthTest: true, depthWrite: true,
  }));
  mesh.frustumCulled = false;
  const body = new Group(); body.add(mesh); glScene.add(body);
  const pivot = new Vector3(ex - 0.5, (0.5 - 0.52) * AR, DEPTH * 0.5);
  mesh.position.copy(pivot).negate();
  const eyeLocal = new Vector3(ex - 0.5, (0.5 - ey) * AR, DEPTH * 0.96);

  /* ---------- network ---------- */
  const net = new Group(); netScene.add(net);
  const netUni = {
    uFig: { value: [0, 0, 1, 1] }, uFade: { value: [1, 0] }, uReveal: { value: reduce ? 2 : 0 },
    uCol: { value: new Vector3() }, uCol2: { value: new Vector3() }, uRes: { value: [1, 1] },
    uW: { value: 1.2 }, uScale: { value: 1 }, uTime: { value: 0 },
  };
  const netMat = (vs, fs) => new ShaderMaterial({
    uniforms: netUni, vertexShader: vs, fragmentShader: fs,
    transparent: true, premultipliedAlpha: true, depthTest: false, depthWrite: false,
  });
  const lineMat = netMat(LINE_VS, LINE_FS), dotMat = netMat(DOT_VS, DOT_FS);
  lineMat.side = DoubleSide; // quad winding depends on the edge direction
  const glowUni = { uCol: netUni.uCol, uA: { value: 0 } };
  const glow = new Mesh(new PlaneGeometry(1, 1), new ShaderMaterial({
    uniforms: glowUni, vertexShader: UV_VS, fragmentShader: GLOW_FS,
    transparent: true, premultipliedAlpha: true, depthTest: false, depthWrite: false,
  }));
  netScene.add(glow);

  let glowBase = 0.2;
  let nodes = [], edges = [], lines = null, dots = null, pulseObj = null, sprites = [];
  const PULSES = small ? 10 : 18;
  const pulses = [];
  let W = 1, H = 1, D = 5, fw = 1, fh = 1, fx = 0, fy = 0, VW = 1, VH = 1, offX = 0, offY = 0;
  const planeC = new Vector3();

  function worldAt(sx, sy, z) { // net-canvas coords (0..1, y down) at depth z -> world
    const hh = (D - z) * TAN, hw = hh * (VW / VH);
    const vx = (offX + sx * W) / VW, vy = (offY + sy * H) / VH;
    return new Vector3((vx * 2 - 1) * hw, (1 - vy * 2) * hh, z);
  }

  function buildNet() {
    [lines, dots, pulseObj].forEach((o) => { if (o) { net.remove(o); o.geometry.dispose(); } });
    sprites.forEach((s) => { net.remove(s); s.material.map.dispose(); s.material.dispose(); });
    sprites = []; nodes = []; edges = [];
    const r = rng(20260926);
    const center = new Vector3(0, 0, -0.8);
    net.position.copy(center);
    const figX = (sx) => (fx + sx * fw) / W, figY = (sy) => (fy + sy * fh) / H;
    const headX = figX(0.44), headY = figY(0.2);
    const add = (sx, sy, L, kind) => {
      const z = LAYERS[L] + (kind ? 0 : (r() - 0.5) * 0.2);
      const p = worldAt(sx, sy, z).sub(center);
      const key = Math.hypot((sx - headX) * W / fw, (sy - headY) * H / fw) / 1.6;
      nodes.push({ p, sx, sy, L, kind, key });
      return nodes.length - 1;
    };
    const labels = fig.offsetWidth < 440 ? LABELS_SMALL : LABELS;
    labels.forEach((l) => { l.node = add(figX(l.at[0]), figY(l.at[1]), l.layer, 1); });
    const count = small ? 48 : 84;
    for (let guard = 0; nodes.length < count && guard < 6000; guard++) {
      const sx = r(), sy = r() * 0.95;
      const L = r() < 0.4 ? 0 : r() < 0.6 ? 1 : 2;
      const hx = (sx - headX) * W / fw, hy = (sy - headY) * H / fw;
      if (hx * hx / 0.035 + hy * hy / 0.06 < 1 && r() < 0.92) continue; // keep the face clear
      if (nodes.some((n) => Math.hypot((n.sx - sx) * W, (n.sy - sy) * H) < fw * 0.07)) continue;
      add(sx, sy, L, 0);
    }
    const has = new Set();
    nodes.forEach((a, i) => {
      nodes.map((b, j) => ({ j, d: a.p.distanceTo(b.p) + Math.abs(a.L - b.L) * 0.25 }))
        .filter((o) => o.j !== i && Math.abs(nodes[o.j].L - a.L) <= 1)
        .sort((x, y) => x.d - y.d).slice(0, a.kind ? 3 : 2)
        .forEach((o) => {
          const k = i < o.j ? i + ':' + o.j : o.j + ':' + i;
          if (!has.has(k) && o.d < 0.75) { has.add(k); edges.push([i, o.j]); }
        });
    });

    // lines as screen-space quads (WebGL lines are 1 device pixel)
    const nE = edges.length, pos = new Float32Array(nE * 12), bb = new Float32Array(nE * 12);
    const t = new Float32Array(nE * 4), s = new Float32Array(nE * 4), al = new Float32Array(nE * 4), ky = new Float32Array(nE * 4);
    const idx = [];
    edges.forEach(([i, j], e) => {
      let a = nodes[i], b = nodes[j];
      if (b.key < a.key) [a, b] = [b, a]; // draw outward from the head
      for (let v = 0; v < 4; v++) {
        pos.set([a.p.x, a.p.y, a.p.z], (e * 4 + v) * 3); bb.set([b.p.x, b.p.y, b.p.z], (e * 4 + v) * 3);
        t[e * 4 + v] = v < 2 ? 0 : 1; s[e * 4 + v] = v % 2 ? 1 : -1;
        al[e * 4 + v] = LAYER_ALPHA[Math.max(a.L, b.L)] * 0.75; ky[e * 4 + v] = a.key;
      }
      const o = e * 4; idx.push(o, o + 1, o + 2, o + 2, o + 1, o + 3);
    });
    const lg = new BufferGeometry();
    lg.setAttribute('position', new BufferAttribute(pos, 3)); lg.setAttribute('aB', new BufferAttribute(bb, 3));
    lg.setAttribute('aT', new BufferAttribute(t, 1)); lg.setAttribute('aS', new BufferAttribute(s, 1));
    lg.setAttribute('aAlpha', new BufferAttribute(al, 1)); lg.setAttribute('aKey', new BufferAttribute(ky, 1));
    lg.setIndex(idx);
    lines = new Mesh(lg, lineMat); lines.frustumCulled = false; net.add(lines);

    const nN = nodes.length, dp = new Float32Array(nN * 3), ds = new Float32Array(nN), da = new Float32Array(nN), dk = new Float32Array(nN), dkind = new Float32Array(nN);
    nodes.forEach((n, i) => {
      dp.set([n.p.x, n.p.y, n.p.z], i * 3);
      ds[i] = n.kind ? 30 : 6 + r() * 5; da[i] = n.kind ? 1 : LAYER_ALPHA[n.L] * 1.5; dk[i] = n.key; dkind[i] = n.kind;
    });
    const dg = new BufferGeometry();
    dg.setAttribute('position', new BufferAttribute(dp, 3)); dg.setAttribute('aSize', new BufferAttribute(ds, 1));
    dg.setAttribute('aAlpha', new BufferAttribute(da, 1)); dg.setAttribute('aKey', new BufferAttribute(dk, 1));
    dg.setAttribute('aKind', new BufferAttribute(dkind, 1));
    dots = new Points(dg, dotMat); dots.frustumCulled = false; net.add(dots);

    const pg = new BufferGeometry();
    pg.setAttribute('position', new BufferAttribute(new Float32Array(PULSES * 3), 3));
    pg.setAttribute('aSize', new BufferAttribute(new Float32Array(PULSES).fill(22), 1));
    pg.setAttribute('aAlpha', new BufferAttribute(new Float32Array(PULSES), 1));
    pg.setAttribute('aKey', new BufferAttribute(Float32Array.from({ length: PULSES }, (_, i) => i / PULSES), 1));
    pg.setAttribute('aKind', new BufferAttribute(new Float32Array(PULSES).fill(2), 1));
    pulseObj = new Points(pg, dotMat); pulseObj.frustumCulled = false; net.add(pulseObj);
    pulses.length = 0;
    for (let i = 0; i < PULSES; i++) pulses.push({ e: -1, t: 0, dur: 1, rev: false });

    labels.forEach((l) => {
      const n = nodes[l.node];
      const sp = new Sprite(new SpriteMaterial({ transparent: true, depthTest: false, depthWrite: false }));
      sp.userData = { label: l, node: n };
      net.add(sp); sprites.push(sp);
    });
    drawLabels();
  }

  function drawLabels() {
    const cs = getComputedStyle(document.documentElement);
    const scale = small ? 0.85 : 1;
    sprites.forEach((sp) => {
      const { label: l, node: n } = sp.userData;
      const c = document.createElement('canvas'), x = c.getContext('2d'), k = 2;
      const font = `600 ${12 * k}px "Public Sans", system-ui, sans-serif`;
      x.font = font;
      const w = Math.ceil(x.measureText(l.text).width) + 38 * k, h = 28 * k;
      c.width = w; c.height = h;
      x.font = font;
      x.fillStyle = cs.getPropertyValue('--panel').trim() || '#161D3D';
      x.strokeStyle = cs.getPropertyValue('--line-strong').trim() || '#3F4A85';
      x.lineWidth = k;
      x.beginPath();
      if (x.roundRect) x.roundRect(k / 2, k / 2, w - k, h - k, h / 2); else x.rect(k / 2, k / 2, w - k, h - k);
      x.fill(); x.stroke();
      x.fillStyle = cs.getPropertyValue(l.dot === 'pos' ? '--pos' : '--accent').trim();
      x.beginPath(); x.arc(15 * k, h / 2, 4 * k, 0, Math.PI * 2); x.fill();
      x.fillStyle = cs.getPropertyValue('--text').trim() || '#E9EDFA';
      x.textBaseline = 'middle'; x.fillText(l.text, 26 * k, h / 2 + k * 0.5);
      if (sp.material.map) sp.material.map.dispose();
      const tex = new CanvasTexture(c); tex.colorSpace = NoColorSpace; tex.generateMipmaps = false; tex.minFilter = LinearFilter;
      sp.material.map = tex; sp.material.needsUpdate = true;
      // size in world units so the label renders at its CSS pixel size on that depth layer
      const pxPerUnit = VH / (2 * (D - (n.p.z + net.position.z)) * TAN);
      const ww = (w / k) * scale / pxPerUnit, hh = (h / k) * scale / pxPerUnit;
      sp.scale.set(ww, hh, 1);
      sp.position.set(n.p.x + l.side * (ww / 2 + 12 / pxPerUnit), n.p.y, n.p.z);
    });
  }

  function readTheme() {
    const cs = getComputedStyle(document.documentElement);
    const acc = color(cs.getPropertyValue('--accent'), '#4C8DF6'), pos = color(cs.getPropertyValue('--pos'), '#5AD1A0');
    const light = color(cs.getPropertyValue('--ink'), '#0E1430').slice(0, 3).reduce((a, b) => a + b) > 1.5;
    netUni.uCol.value.set(acc[0], acc[1], acc[2]); netUni.uCol2.value.set(pos[0], pos[1], pos[2]);
    glowBase = light ? 0.16 : 0.22;
    if (sprites.length) drawLabels();
  }

  /* ---------- layout: map the figure box exactly onto the mesh at rest ---------- */
  const dprN = Math.min(devicePixelRatio || 1, 1.5), dprP = Math.min(devicePixelRatio || 1, 2);
  function layout() {
    W = netCv.offsetWidth; H = netCv.offsetHeight; fw = fig.offsetWidth; fh = fig.offsetHeight;
    if (!W || !H || !fw) return false;
    fx = -netCv.offsetLeft; fy = -netCv.offsetTop;
    // the camera axis runs through his eyes (a virtual frame centred on them), so fine facial
    // relief doesn't shift sideways in perspective and the rest pose matches the photo
    const eX = fx + ex * fw, eY = fy + ey * fh;
    VW = 2 * Math.max(eX, W - eX); VH = 2 * Math.max(eY, H - eY);
    offX = VW / 2 - eX; offY = VH / 2 - eY;
    D = VH / (fw * 2 * TAN);
    cam.aspect = pcam.aspect = VW / VH;
    cam.position.set(0, 0, D); pcam.position.set(0, 0, D);
    cam.setViewOffset(VW, VH, offX, offY, W, H);
    pcam.setViewOffset(VW, VH, offX + glCv.offsetLeft + fx, offY + glCv.offsetTop + fy, glCv.offsetWidth, glCv.offsetHeight);
    netR.setPixelRatio(dprN); netR.setSize(W, H, false);
    glR.setPixelRatio(dprP); glR.setSize(glCv.offsetWidth, glCv.offsetHeight, false);
    // face sits on the z=0 plane, so at rest it matches the photo's size on the page
    planeC.set(0.5 - ex, -(0.5 - ey) * AR, -DEPTH * 0.9);
    body.position.copy(planeC).add(pivot);
    const stacked = getComputedStyle(fig.closest('.about-hero-grid') || fig).gridTemplateColumns.split(' ').length < 2;
    netUni.uFig.value = [fx / W, 1 - (fy + fh) / H, (fx + fw) / W, 1 - fy / H];
    netUni.uFade.value = stacked ? [0, 1] : [1, 0];
    netUni.uRes.value = [W * dprN / 2, H * dprN / 2];
    netUni.uW.value = 0.6 * dprN;
    netUni.uScale.value = dprN * D * 0.9;
    const head = new Vector3(planeC.x + (0.44 - 0.5), planeC.y + (0.5 - 0.2) * AR, -0.4);
    glow.position.copy(head); glow.scale.setScalar(1.25);
    buildNet();
    return true;
  }

  /* ---------- state ---------- */
  let tx = 0, ty = 0, x = 0, y = 0, off = 0, intro = reduce ? 1 : 0, introStart = null, ready = false;
  let visible = false, ratio = 0, raf = 0, last = 0, time = 0, spawnAcc = 0, drawnOnce = false;
  const r2 = rng(99);
  const q = new Quaternion(), eul = new Euler(), tmp = new Vector3(), eyeW = new Vector3();
  const base = new Vector3();
  let prevSig = '';

  function spawn() {
    const p = pulses.find((o) => o.e < 0);
    if (!p || !edges.length) return;
    let e = Math.floor(r2() * edges.length);
    if (r2() < 0.45) { // favour edges that feed a labelled hub
      const hubs = edges.map((ed, i) => (nodes[ed[0]].kind || nodes[ed[1]].kind ? i : -1)).filter((i) => i >= 0);
      if (hubs.length) e = hubs[Math.floor(r2() * hubs.length)];
    }
    p.e = e; p.t = 0; p.dur = 1.1 + r2() * 1.2; p.rev = r2() < 0.5;
  }

  function frame(now) {
    raf = 0;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60; last = now; time += dt;
    if (introStart !== null && intro < 1) intro = clamp((now - introStart) / 2400, 0, 1);
    const ie = ease(intro);
    const offT = fig.classList.contains('is-off') && intro >= 0.85 ? 1 : 0;
    off += (offT - off) * damp(dt, 3.6);
    if (!reduce) { x += (tx - x) * damp(dt, 5); y += (ty - y) * damp(dt, 5); }
    if (Math.abs(off - offT) < 0.0005) off = offT;

    // body turn + extra head turn toward the pointer
    // kept modest so his features stay true to the photo
    body.rotation.set(y * 0.05, x * 0.15, 0);
    uni.uHead.value = [x * 0.03, y * 0.02];
    uni.uCMix.value = clamp((off - 0.12) / 0.6, 0, 1);
    uni.uDMix.value = clamp((off - 0.05) / 0.9, 0, 1);
    uni.uIntro.value = intro;
    uni.uKey.value = 0.05 * off;
    eul.set(body.rotation.x, body.rotation.y, 0); q.setFromEuler(eul).invert();
    uni.uL.value.set(x * 0.9, 0.15 - y * 0.7, 1).normalize().applyQuaternion(q);
    uni.uL0.value.set(0, 0.15, 1).normalize().applyQuaternion(q);

    // camera dollies along the ray through the eyes: push in on hover, pull back for the intro
    body.updateMatrixWorld(); mesh.updateMatrixWorld();
    eyeW.copy(eyeLocal); mesh.localToWorld(eyeW);
    base.set(0, 0, D);
    const k = (reduce ? 0 : 0.12 * ease(off)) - (reduce ? 0 : 0.34 * (1 - ie));
    tmp.copy(eyeW).sub(base).multiplyScalar(k).add(base);
    cam.position.copy(tmp); pcam.position.copy(tmp);

    net.rotation.set(-y * 0.05, -x * 0.09, 0);
    netUni.uReveal.value = reduce ? 2 : intro * intro * (3 - 2 * intro) * 1.25; // draws out from behind him
    netUni.uTime.value = reduce ? 0 : time;
    glowUni.uA.value = glowBase * ie;
    glow.scale.setScalar(1.1 + 0.25 * ie + 0.1 * off);

    // data pulses
    if (!reduce && pulseObj && intro > 0.5) {
      spawnAcc += dt;
      while (spawnAcc > 0.2) { spawnAcc -= 0.2; spawn(); }
      const pa = pulseObj.geometry.attributes.position, aa = pulseObj.geometry.attributes.aAlpha;
      pulses.forEach((p, i) => {
        if (p.e < 0) { aa.array[i] = 0; return; }
        p.t += dt / p.dur;
        if (p.t >= 1) { p.e = -1; aa.array[i] = 0; return; }
        const [ia, ib] = edges[p.e], A = nodes[p.rev ? ib : ia], B = nodes[p.rev ? ia : ib];
        const u = p.t * p.t * (3 - 2 * p.t);
        pa.array[i * 3] = A.p.x + (B.p.x - A.p.x) * u;
        pa.array[i * 3 + 1] = A.p.y + (B.p.y - A.p.y) * u;
        pa.array[i * 3 + 2] = A.p.z + (B.p.z - A.p.z) * u;
        aa.array[i] = Math.sin(Math.PI * p.t) * (0.55 + 0.45 * LAYER_ALPHA[Math.min(A.L, B.L)] / 0.6);
      });
      pa.needsUpdate = true; aa.needsUpdate = true;
    }
    sprites.forEach((sp) => { sp.material.opacity = clamp((netUni.uReveal.value - sp.userData.node.key - 0.05) * 5, 0, 1); });

    netR.render(netScene, cam);
    const sig = [x, y, off, intro, cam.position.z].map((v) => v.toFixed(4)).join();
    if (sig !== prevSig || !drawnOnce) {
      glR.render(glScene, pcam); prevSig = sig;
      if (!drawnOnce) { drawnOnce = true; fig.classList.add('is-3d-ready'); }
    }
    const moving = Math.abs(tx - x) > 0.0005 || Math.abs(ty - y) > 0.0005 || off !== offT || intro < 1;
    if (visible && !document.hidden && (moving || !reduce)) raf = requestAnimationFrame(frame);
  }
  const kick = () => { if (!raf && ready && visible && !document.hidden) { last = 0; raf = requestAnimationFrame(frame); } };

  function maybeIntro() {
    if (ready && introStart === null && ratio >= 0.25) { introStart = reduce ? -1e9 : performance.now(); }
    kick();
  }

  /* ---------- input ---------- */
  if (hover && !reduce) {
    hero.addEventListener('pointermove', (e) => {
      const r = fig.getBoundingClientRect();
      tx = clamp((e.clientX - r.left - r.width * 0.44) / r.width, -1, 1);
      ty = clamp((e.clientY - r.top - r.height * 0.3) / r.height, -1, 1);
      kick();
    });
    hero.addEventListener('pointerleave', () => { tx = 0; ty = 0; kick(); });
  } else if (!reduce) {
    let g0 = null, b0 = null;
    const onOri = (e) => {
      if (e.gamma == null) return;
      if (g0 === null) { g0 = e.gamma; b0 = e.beta; }
      g0 += (e.gamma - g0) * 0.01; b0 += (e.beta - b0) * 0.01; // slowly re-centre
      tx = clamp((e.gamma - g0) / 16, -1, 1); ty = clamp((e.beta - b0) / 16, -1, 1);
      kick();
    };
    const DOE = window.DeviceOrientationEvent;
    if (DOE && typeof DOE.requestPermission === 'function') {
      fig.addEventListener('click', function ask() {
        fig.removeEventListener('click', ask);
        DOE.requestPermission().then((s) => { if (s === 'granted') addEventListener('deviceorientation', onOri); }).catch(() => {});
      });
    } else addEventListener('deviceorientation', onOri);
  }
  new MutationObserver(kick).observe(fig, { attributes: true, attributeFilter: ['class'] });
  const themeMO = () => { readTheme(); prevSig = ''; kick(); };
  new MutationObserver(themeMO).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  matchMedia('(prefers-color-scheme: light)').addEventListener('change', themeMO);
  new IntersectionObserver((es) => {
    ratio = es[es.length - 1].intersectionRatio; visible = ratio > 0; maybeIntro();
  }, { threshold: [0, 0.25, 0.5] }).observe(fig);
  document.addEventListener('visibilitychange', kick);
  let rT = 0;
  new ResizeObserver(() => {
    clearTimeout(rT);
    rT = setTimeout(() => { if (layout()) { prevSig = ''; drawnOnce = false; if (!raf && ready) raf = requestAnimationFrame(frame); } }, 60);
  }).observe(fig);

  /* ---------- load ---------- */
  return Promise.all([
    load(pickSrc(imgOn, need), true), load(pickSrc(imgOff, need), true),
    load(fig.dataset.depthOn, false), load(fig.dataset.depthOff, false),
  ]).then(([c0, c1, d0, d1]) => {
    uni.uC0.value = c0; uni.uC1.value = c1; uni.uD0.value = d0; uni.uD1.value = d1;
    uni.uTexel.value = [1 / d0.image.width, 1 / d0.image.height];
    readTheme();
    if (!layout()) throw new Error('portrait3d: no layout');
    ready = true;
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { drawLabels(); prevSig = ''; kick(); });
    maybeIntro();
    if (reduce) raf = requestAnimationFrame(frame);
  });
}
