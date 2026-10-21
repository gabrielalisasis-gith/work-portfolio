// mini Gab, the roaming site guide. site.js imports this once the page has settled.
// As you scroll he teleports between hiding spots in a bolt of emerald lightning, says a line
// about the section you're reading, waits at the screen edge when no spot is in view, and opens
// a quick-answer help card when clicked. Spots, lines and answers live in src/data/mascot.ts.
import { BODY, FACES, PAGES, LINES, HELP_HI, QA, CHIPS } from '../data/mascot';

export function init(opt) {
  var reduce = !!opt.reduce, fine = !!opt.fine, hero = opt.hero || null, lenis = opt.lenis || null;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var root = $('#mg');
  if (!root || root.dataset.on) return;

  var path = location.pathname.replace(/\/+$/, '') || '/';
  var page = null;
  PAGES.forEach(function (p) { if (!page && p.match.test(path)) page = p; });
  if (!page) return;
  root.dataset.on = '1';
  var slug = page.key === 'case' ? path.split('/').pop() : '';

  var sprite = $('.mg-sprite', root), face = $('.mg-face', root), bubbleEl = $('.mg-bubble', root);
  var hands = $$('.mg-hand', root), header = $('header'), phoneMq = window.matchMedia('(max-width:760px)');
  var helpEl = $('#mgHelp'), logEl = $('#mgLog'), chipsEl = $('#mgChips'), muteBtn = $('#mgMute');
  var homeBtn = $('#mgHome'), closeBtn = $('#mgHelpClose'), returnBtn = $('#mgReturn');
  var CW = BODY.cell[0], CH = BODY.cell[1], P = BODY.poses;

  function load(k, session) { try { return (session ? sessionStorage : localStorage).getItem(k); } catch (e) { return null; } }
  function save(k, v, session) {
    try { var st = session ? sessionStorage : localStorage; if (v == null) st.removeItem(k); else st.setItem(k, v); } catch (e) {}
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function now() { return Date.now(); }
  function replay(cls, ms) {
    root.classList.remove(cls); void root.offsetWidth; root.classList.add(cls);
    setTimeout(function () { root.classList.remove(cls); }, ms);
  }

  var muted = load('mg-muted') === '1', sentHome = load('mg-home') === '1';
  var returning = !!load('mg-seen') && !load('mg-visit', true);
  save('mg-seen', String(now())); save('mg-visit', '1', true);
  var pagesSeen = +(load('mg-pages', true) || 0); // later pages in a visit get a quicker entrance
  save('mg-pages', String(pagesSeen + 1), true);

  /* ---------- spots ---------- */
  var spots = [];
  function resolve() {
    var ph = phoneMq.matches;
    spots = [];
    page.spots.forEach(function (base) {
      var s = Object.assign({}, base, ph && base.phone ? base.phone : {});
      if (s.mode === 'hero' && !hero) return;
      if (s.min && innerWidth < s.min) return;
      s.el = $(s.sel);
      if (!s.el) return;
      s.shared = !!base.key || s.id === 'contact'; // the same on every page, so no per-page lines
      s.key = s.key || (s.id === 'contact' ? 'contact' : page.key + '.' + s.id);
      spots.push(s);
    });
    if (cur && cur.spot) cur.spot = spots.filter(function (x) { return x.id === cur.spot.id; })[0] || cur.spot;
  }
  function bodyScale() { return phoneMq.matches ? 0.29 : 0.42; }
  function bustSize() { return phoneMq.matches ? 70 : 90; }
  function headerBottom() { return header ? Math.max(0, header.getBoundingClientRect().bottom) : 0; }

  /* ---------- layouts: where and how he sits for a location ---------- */
  // Coordinates are page coordinates, or viewport ones when the layout is fixed (dock, help card).
  function bodyAt(pose, anchor, x, y, flip, fixed) {
    var s = bodyScale(), ax = flip < 0 ? CW - anchor[0] : anchor[0], head = P[pose].head;
    return {
      form: 'body', pose: pose, s: s, flip: flip, fixed: !!fixed,
      x: x - ax * s, y: y - anchor[1] * s, w: CW * s, h: CH * s,
      hx: (flip < 0 ? CW - head[0] : head[0]) * s, hy: head[1] * s,
      hit: pose === 'peek' ? (flip < 0 ? [36, 2, 52, 86] : [12, 2, 52, 86]) : [22, 3, 56, 82],
    };
  }
  function bustAt(cx, edge, b, fixed, handX) {
    cx = clamp(cx, b / 2 + 6 + (fixed ? 0 : scrollX), (fixed ? 0 : scrollX) + innerWidth - b / 2 - 6);
    var L = {
      form: 'bust', fixed: !!fixed, x: cx - b / 2, y: edge - b * 0.74, w: b, h: b, edge: b * 0.74,
      clip: 'inset(-60% -40% ' + (b * 0.26).toFixed(1) + 'px -40%)', hx: b / 2, hy: b * 0.04, hit: [14, 4, 72, 70],
      hs: b * 0.26,
    };
    var hx = handX || [cx - b * 0.27, cx + b * 0.27];
    L.hands = hx.map(function (x) { return [x - L.x - L.hs / 2, L.edge - L.hs * 0.45]; });
    return L;
  }
  function wordRange(sp) {
    if (sp._range === undefined) {
      sp._range = null;
      var walk = document.createTreeWalker(sp.el, NodeFilter.SHOW_TEXT), n;
      while ((n = walk.nextNode())) {
        var i = n.data.indexOf(sp.word);
        if (i > -1) { var rg = document.createRange(); rg.setStart(n, i); rg.setEnd(n, i + sp.word.length); sp._range = rg; break; }
      }
    }
    return sp._range;
  }
  var metrics = document.createElement('canvas').getContext('2d');
  // the bust behind a word in a heading: clipped at the top of its tallest letter, a hand on each end
  function wordLayout(sp, r) {
    var rg = wordRange(sp), wr = rg && rg.getClientRects()[0];
    if (!wr) return bustAt(r.left + r.width * 0.8 + scrollX, r.top + scrollY, bustSize());
    var cs = getComputedStyle(rg.startContainer.parentElement), fs = parseFloat(cs.fontSize);
    // only the first line has nothing above it to cover; on a wrapped line, peek over the heading instead
    if (wr.top - r.top > fs * 0.6) return bustAt((wr.left + wr.right) / 2 + scrollX, r.top + scrollY, bustSize());
    metrics.font = cs.fontWeight + ' ' + fs + 'px ' + cs.fontFamily;
    var m = metrics.measureText(sp.word), A = m.fontBoundingBoxAscent || fs * 0.95, D = m.fontBoundingBoxDescent || fs * 0.25;
    var asc = m.actualBoundingBoxAscent || fs * 0.7, base = wr.bottom - D * (wr.height / (A + D)), top = base - asc;
    var b = clamp(wr.width * 1.05, phoneMq.matches ? 58 : 76, phoneMq.matches ? 88 : 104);
    return bustAt((wr.left + wr.right) / 2 + scrollX, top + fs * 0.03 + scrollY, b, false,
      [wr.left + wr.width * 0.2 + scrollX, wr.right - wr.width * 0.2 + scrollX]);
  }
  function peekSide(r, side, fy, fixed) {
    var right = side === 'r', s = bodyScale(), ox = fixed ? 0 : scrollX, oy = fixed ? 0 : scrollY;
    var L = bodyAt('peek', [P.peek.cut, 6], (right ? r.right : r.left) + ox, r.top + r.height * (fy || 0) + 8 + oy, right ? -1 : 1, fixed);
    var keep = (P.peek.cut + 12) * s;
    L.clip = right ? 'inset(-30% -30% -30% ' + (L.w - keep).toFixed(1) + 'px)' : 'inset(-30% ' + (L.w - keep).toFixed(1) + 'px -30% -30%)';
    L.tuck = (172 * s).toFixed(1) + 'px';
    L.vis = (P.peek.cut - 28) * s; // how far he sticks out past the edge
    return L;
  }
  function spotLayout(sp) {
    var r = sp.el.getBoundingClientRect(), fx = sp.fx == null ? 0.85 : sp.fx;
    if (sp.mode === 'word') return wordLayout(sp, r);
    if (sp.mode === 'peek-top') return bustAt(r.left + r.width * fx + scrollX, r.top + scrollY, bustSize());
    if (sp.mode === 'sit') return inView(bodyAt('sit', P.sit.seat, r.left + r.width * fx + scrollX, r.top + scrollY, 1));
    if (sp.mode === 'hang') return inView(bodyAt('hang', P.hang.grip, r.left + r.width * fx + scrollX, r.bottom + scrollY, 1), 22); // room for the swing
    if (sp.mode === 'stand') return inView(bodyAt('stand', P.stand.feet, r.left + r.width * fx + scrollX, r.top + scrollY, 1));
    if (sp.mode === 'point') return pointLayout(sp, r);
    var L = peekSide(r, sp.side, sp.fy);
    // no room in the gutter (narrow screens): peek over the top edge instead
    var room = sp.side === 'r' ? innerWidth - r.right : r.left;
    return room >= P.peek.cut * L.s + 4 ? L : bustAt(r.left + r.width * 0.86 + scrollX, r.top + scrollY, bustSize());
  }
  // standing in the empty space beside an element, pointing at it with his fingertip just past its edge;
  // no layout (so the spot is skipped) when the screen is too narrow for him to stand there
  function pointLayout(sp, r) {
    if (sp.min && innerWidth < sp.min) return null;
    var right = sp.side === 'r', s = bodyScale(), outer = sp.edge && $(sp.edge), e = outer ? outer.getBoundingClientRect() : r;
    var L = bodyAt('point', P.point.tip, (right ? e.right + 8 : e.left - 8) + scrollX, r.top + r.height * (sp.fy == null ? 0.5 : sp.fy) + scrollY, right ? -1 : 1);
    var v = L.x - scrollX, left = v + (right ? CW - 273 : 55) * s, end = v + (right ? CW - 55 : 273) * s;
    return left >= 4 && end <= innerWidth - 4 ? L : null;
  }
  // nudge a page-positioned box so none of it hangs past the sides of the screen
  function inView(L, m) { m = m || 4; L.x = clamp(L.x, scrollX + m, scrollX + innerWidth - L.w - m); return L; }
  function layout(loc) {
    if (loc.kind === 'dock') {
      var vh = innerHeight;
      return peekSide({ left: innerWidth, right: innerWidth, top: vh * (phoneMq.matches ? 0.5 : 0.46), height: 0 }, 'l', 0, true);
    }
    if (loc.kind === 'help') {
      var c = helpEl.getBoundingClientRect();
      return bustAt(c.right - (phoneMq.matches ? 52 : 64), c.top, phoneMq.matches ? 62 : 74, true);
    }
    return spotLayout(loc.spot);
  }
  function toView(x, y, fixed) { return fixed ? { x: x, y: y } : { x: x - scrollX, y: y - scrollY }; }
  // the point a bolt leaves from or lands on, in viewport coordinates
  function groundOf(L) {
    if (L.form === 'bust') return { x: L.x + L.w / 2, y: L.y + L.edge };
    var a = P[L.pose].feet || P[L.pose].seat || P[L.pose].grip;
    return { x: L.x + (L.flip < 0 ? CW - a[0] : a[0]) * L.s, y: L.y + a[1] * L.s };
  }
  function pointOf(loc) {
    if (loc.kind === 'hero') { var hr = hero.rect(); return { x: hr.left + hr.width / 2, y: hr.top + hr.height * 0.55 }; }
    var L = layout(loc);
    if (!L) return { x: innerWidth - 6, y: innerHeight * 0.5 };
    if (loc.kind === 'dock') return { x: innerWidth - 6, y: L.y + L.h * 0.3 };
    var g = groundOf(L);
    return toView(g.x, g.y, L.fixed);
  }

  /* ---------- drawing him ---------- */
  var curL = null;
  function cell(i) { return (i % 3) * 50 + '% ' + Math.floor(i / 3) * 50 + '%'; }
  function setPose(name) { sprite.style.backgroundPosition = cell(P[name].i); root.dataset.pose = name; }
  function setFace(name) { face.style.backgroundPosition = cell(FACES[name] || 0); }
  function apply(L) {
    curL = L;
    var st = root.style;
    root.classList.toggle('is-fixed', L.fixed);
    root.dataset.form = L.form;
    st.left = L.x.toFixed(1) + 'px'; st.top = L.y.toFixed(1) + 'px';
    st.width = L.w.toFixed(1) + 'px'; st.height = L.h.toFixed(1) + 'px';
    st.setProperty('--mg-clip', L.clip || 'none');
    st.setProperty('--mg-flip', L.flip || 1);
    st.setProperty('--mg-tuck', L.tuck || '0px');
    st.setProperty('--mg-hx', L.hit[0] + '%'); st.setProperty('--mg-hy', L.hit[1] + '%');
    st.setProperty('--mg-hw', L.hit[2] + '%'); st.setProperty('--mg-hh', L.hit[3] + '%');
    if (L.form === 'body') setPose(L.pose);
    else {
      root.dataset.pose = '';
      st.setProperty('--mg-hs', L.hs.toFixed(1) + 'px');
      hands.forEach(function (h, i) { h.style.left = L.hands[i][0].toFixed(1) + 'px'; h.style.top = L.hands[i][1].toFixed(1) + 'px'; });
    }
    if (bubbleEl.classList.contains('is-on')) placeBubble();
  }
  function showFig() { root.hidden = false; root.classList.remove('is-gone'); root.tabIndex = 0; }
  function hideFig() { root.classList.add('is-gone'); root.tabIndex = -1; bubbleOff(); }
  function figRect() { return root.getBoundingClientRect(); }

  /* ---------- FX: emerald lightning on a canvas that only runs during a teleport ---------- */
  var cvs = $('#mgFx'), ctx = cvs && cvs.getContext('2d'), items = [], fxRaf = 0, dpr = 1, bend = 1;
  function fxSize() {
    if (!ctx) return;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    cvs.width = Math.round(innerWidth * dpr); cvs.height = Math.round(innerHeight * dpr);
    cvs.style.width = innerWidth + 'px'; cvs.style.height = innerHeight + 'px';
  }
  function fx(it) {
    if (reduce || !ctx) { if (it.done) it.done(); return; }
    it.t0 = performance.now(); items.push(it);
    if (!fxRaf) { cvs.classList.add('is-on'); fxRaf = requestAnimationFrame(tick); }
  }
  function tick(t) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    ctx.globalCompositeOperation = 'lighter';
    var list = items; items = [];
    list.forEach(function (it) {
      var p = clamp((t - it.t0) / it.dur, 0, 1); // a frame can be stamped just before an effect was added
      it.draw(p, t);
      if (p < 1) items.push(it); else if (it.done) it.done();
    });
    if (items.length) fxRaf = requestAnimationFrame(tick);
    else { fxRaf = 0; ctx.clearRect(0, 0, innerWidth, innerHeight); cvs.classList.remove('is-on'); }
  }
  function ease(p) { return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; }
  function easeOut(p) { return 1 - Math.pow(1 - p, 3); }
  // a jagged line between two points, the shape of a spark
  function jag(x0, y0, x1, y1, n, amp) {
    var pts = [[x0, y0]], dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
    for (var i = 1; i < n; i++) {
      var t = i / n, o = (Math.random() * 2 - 1) * amp * Math.sin(Math.PI * t);
      pts.push([x0 + dx * t + nx * o, y0 + dy * t + ny * o]);
    }
    pts.push([x1, y1]);
    return pts;
  }
  function glow(pts, w, a) {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    [[w * 3.4, 'rgba(16,185,129,' + 0.22 * a + ')'], [w * 1.6, 'rgba(52,211,153,' + 0.8 * a + ')'], [w * 0.6, 'rgba(236,253,245,' + a + ')']].forEach(function (pass) {
      ctx.beginPath();
      pts.forEach(function (p, i) { if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); });
      ctx.lineWidth = pass[0]; ctx.strokeStyle = pass[1]; ctx.stroke();
    });
  }
  function orb(x, y, r, a) {
    var g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(236,253,245,' + a + ')'); g.addColorStop(0.35, 'rgba(110,231,183,' + 0.85 * a + ')'); g.addColorStop(1, 'rgba(16,185,129,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill();
  }
  function fxArcs(dur) {
    var last = 0, arcs = [];
    fx({ dur: dur, draw: function (p, t) {
      var b = figRect();
      if (t - last > 55) {
        last = t; arcs = [];
        var cx = b.left + b.width / 2, cy = b.top + b.height * 0.6, rx = b.width * 0.42, ry = b.height * 0.4;
        for (var k = 0; k < 3; k++) {
          var a0 = Math.random() * 6.28, a1 = a0 + (Math.random() - 0.5) * 1.8;
          arcs.push(jag(cx + Math.cos(a0) * rx, cy + Math.sin(a0) * ry, cx + Math.cos(a1) * rx * 0.75, cy + Math.sin(a1) * ry * 0.75, 6, 7));
        }
      }
      arcs.forEach(function (pts) { glow(pts, 1.3, 1 - p * 0.3); });
    } });
  }
  function fxPillar(x, y0, y1, dur) {
    fx({ dur: dur, draw: function (p) {
      var a = 1 - easeOut(p), w = 30 * (1 - p * 0.5), g = ctx.createLinearGradient(0, y0, 0, y1);
      g.addColorStop(0, 'rgba(52,211,153,0)'); g.addColorStop(0.6, 'rgba(52,211,153,' + 0.45 * a + ')'); g.addColorStop(1, 'rgba(110,231,183,' + 0.7 * a + ')');
      ctx.fillStyle = g; ctx.fillRect(x - w / 2, y0, w, y1 - y0);
      ctx.fillStyle = 'rgba(236,253,245,' + 0.85 * a + ')'; ctx.fillRect(x - w * 0.1, y0 + (y1 - y0) * 0.25, w * 0.2, (y1 - y0) * 0.75);
    } });
  }
  function fxRing(x, y, dur) {
    fx({ dur: dur, draw: function (p) {
      var e = easeOut(p), rx = 8 + 64 * e, a = 1 - p;
      ctx.lineWidth = 3 * a + 0.6; ctx.strokeStyle = 'rgba(110,231,183,' + a + ')';
      ctx.beginPath(); ctx.ellipse(x, y, rx, rx * 0.28, 0, 0, 6.2832); ctx.stroke();
      ctx.lineWidth = 1.2; ctx.strokeStyle = 'rgba(236,253,245,' + 0.7 * a + ')';
      ctx.beginPath(); ctx.ellipse(x, y, rx * 0.6, rx * 0.17, 0, 0, 6.2832); ctx.stroke();
    } });
  }
  function fxSparks(x, y, n, up) {
    var ps = [];
    for (var i = 0; i < n; i++) {
      var a = up ? -Math.PI / 2 + (Math.random() - 0.5) * 2.2 : Math.random() * 6.2832, v = 0.12 + Math.random() * 0.3;
      ps.push({ vx: Math.cos(a) * v, vy: Math.sin(a) * v - (up ? 0.05 : 0.08), l: 5 + Math.random() * 8, hot: Math.random() < 0.4 });
    }
    var dur = 520;
    fx({ dur: dur, draw: function (p) {
      var t = p * dur, a = 1 - p;
      ps.forEach(function (s) {
        var px = x + s.vx * t, py = y + s.vy * t + 0.00045 * t * t;
        ctx.strokeStyle = s.hot ? 'rgba(236,253,245,' + a + ')' : 'rgba(52,211,153,' + a + ')'; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - s.vx * s.l * 2.2, py - (s.vy + 0.0009 * t) * s.l * 2.2); ctx.stroke();
      });
    } });
  }
  function fxDust(x, y) {
    var ps = [-1, -0.6, 0.6, 1].map(function (d) { return { d: d, r: 4 + Math.random() * 4 }; });
    fx({ dur: 480, draw: function (p) {
      var e = easeOut(p);
      ctx.globalCompositeOperation = 'source-over';
      ps.forEach(function (s) {
        ctx.fillStyle = 'rgba(203,213,225,' + 0.35 * (1 - p) + ')';
        ctx.beginPath(); ctx.arc(x + s.d * 34 * e, y - 6 * e, s.r * (1 + e), 0, 6.2832); ctx.fill();
      });
      ctx.globalCompositeOperation = 'lighter';
    } });
  }
  // the bolt: a glowing head on a curved path with a crackling tail and a fading afterglow; the end is
  // re-read every frame so it follows smooth scrolling (and a new target if the reader keeps going)
  function fxBolt(a, endFn, done, quick) {
    a = { x: clamp(a.x, 8, innerWidth - 8), y: clamp(a.y, headerBottom() + 8, innerHeight - 8) }; // start where it can be seen
    var b0 = endFn(), dist = Math.hypot(b0.x - a.x, b0.y - a.y), dur = clamp(260 + dist * 0.2, 320, 620) * (quick ? 0.7 : 1);
    bend = -bend;
    var dir = bend;
    fx({ dur: dur, done: done, draw: function (p) {
      var b = endFn(), t = ease(p);
      b = { x: clamp(b.x, -40, innerWidth + 40), y: clamp(b.y, -60, innerHeight + 60) };
      var dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1, k = Math.min(170, len * 0.3) * dir;
      var cx = (a.x + b.x) / 2 - dy / len * k, cy = (a.y + b.y) / 2 + dx / len * k;
      var q = function (u) { var v = 1 - u; return [v * v * a.x + 2 * v * u * cx + u * u * b.x, v * v * a.y + 2 * v * u * cy + u * u * b.y]; };
      // afterglow along the path travelled so far
      var trail = [];
      for (var i = 0; i <= 20; i++) trail.push(q(t * i / 20));
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); trail.forEach(function (pt, n) { if (n) ctx.lineTo(pt[0], pt[1]); else ctx.moveTo(pt[0], pt[1]); });
      ctx.lineWidth = 7; ctx.strokeStyle = 'rgba(16,185,129,' + 0.16 * (1 - p * 0.5) + ')'; ctx.stroke();
      // the crackling tail: two jittered strands
      var tail = Math.max(0, t - 0.42);
      for (var strand = 0; strand < 2; strand++) {
        var pts = [];
        for (i = 0; i <= 16; i++) {
          var pt = q(tail + (t - tail) * i / 16), j = i === 16 ? 0 : (Math.random() * 2 - 1) * (strand ? 11 : 6) * (i / 16);
          pts.push([pt[0] + j, pt[1] - j * 0.7]);
        }
        glow(pts, strand ? 1.4 : 3, strand ? 0.7 : 1);
      }
      var h = q(t);
      orb(h[0], h[1], 36, 0.3);
      orb(h[0], h[1], 18, 1);
      for (i = 0; i < 2; i++) {
        var ang = Math.random() * 6.28;
        glow(jag(h[0], h[1], h[0] + Math.cos(ang) * 38, h[1] + Math.sin(ang) * 38, 4, 6), 1, 0.85);
      }
    } });
  }

  /* ---------- speech ---------- */
  var said = (load('mg-said', true) || '').split('\n').filter(Boolean), lastSay = 0, spoke = {}, spotSaid = {}, bubbleT = 0;
  function remember(line) { said.push(line); save('mg-said', said.slice(-160).join('\n'), true); }
  function pickLine(key) {
    var pool = LINES[key];
    if (!pool) return null;
    var fresh = pool.filter(function (l) { return said.indexOf(l) < 0; });
    if (!fresh.length) return null;
    return spoke[key] ? fresh[Math.floor(Math.random() * fresh.length)] : fresh[0];
  }
  function placeBubble() {
    var L = curL; if (!L) return;
    var bw = bubbleEl.offsetWidth, bh = bubbleEl.offsetHeight, v = toView(L.x, L.y, L.fixed);
    var x = L.hx - bw / 2, y = L.hy - bh - 10;
    if (v.y + y < headerBottom() + 6) {
      // no room above his head (just under the header): talk from beside him instead
      y = Math.max(L.hy, headerBottom() + 6 - v.y);
      x = v.x + L.w + 8 + bw < innerWidth - 8 ? L.w * 0.8 + 8 : L.w * 0.2 - bw - 8;
    }
    x = clamp(x, 8 - v.x, innerWidth - 8 - bw - v.x);
    bubbleEl.style.setProperty('--mg-bx', x.toFixed(1) + 'px');
    bubbleEl.style.setProperty('--mg-by', y.toFixed(1) + 'px');
  }
  var bubbleHideT = 0;
  function bubbleOff() {
    clearTimeout(bubbleT); bubbleEl.classList.remove('is-on');
    clearTimeout(bubbleHideT); bubbleHideT = setTimeout(function () { if (!bubbleEl.classList.contains('is-on')) bubbleEl.hidden = true; }, 220);
  }
  function say(text, key) {
    if (!text) return;
    remember(text); lastSay = now();
    if (key) spoke[key] = (spoke[key] || 0) + 1;
    var ms = clamp(1600 + text.length * 55, 2600, 6500);
    if (cur && cur.kind === 'hero') { hero.say(text, ms); return; }
    clearTimeout(bubbleHideT);
    bubbleEl.hidden = false;
    bubbleEl.textContent = text;
    placeBubble();
    requestAnimationFrame(function () { bubbleEl.classList.add('is-on'); });
    clearTimeout(bubbleT);
    bubbleT = setTimeout(bubbleOff, ms);
  }
  // automatic chatter: rate-limited, never while muted, typing or reading the help card
  function speak(key, force) {
    if (muted || helpOpen || typing || document.hidden || hushed) return false;
    if (!force && now() - lastSay < 6000) return false;
    var line = pickLine(key);
    if (!line) return false;
    say(line, key);
    return true;
  }
  function spotKeys(sp) { return slug && !sp.shared ? [slug + '.' + sp.id, 'case.' + sp.id] : [sp.key]; }
  function speakSpot(sp, force) {
    var keys = spotKeys(sp);
    if ((spotSaid[sp.key] || 0) >= 2 && !force) return false;
    for (var i = 0; i < keys.length; i++) if (speak(keys[i], force)) { spotSaid[sp.key] = (spotSaid[sp.key] || 0) + 1; return true; }
    return false;
  }

  /* ---------- where he should be ---------- */
  var cur = null, state = 'idle', pending = false, lastMove = 0, offSince = 0, helpOpen = false, hushed = false, typing = false;
  var vel = 0, lastY = scrollY, lastT = performance.now(), settleT = 0, evalT = 0, greeted = !!hero, lastInput = now();
  function same(a, b) { return !!a && !!b && a.kind === b.kind && a.spot === b.spot; }
  // how much of him would be on screen at a spot: the top of his head and his lowest point, in viewport y
  function gauge(s) {
    if (s.mode === 'hero') { var hr = hero.rect(); return hr.height ? { head: hr.top + hr.height * 0.1, foot: hr.top + hr.height * 0.875 } : null; }
    var r = s.el.getBoundingClientRect();
    if (!r.width && !r.height) return null; // filtered away or hidden
    var L = spotLayout(s);
    if (!L) return null; // doesn't fit at this width
    var v = toView(L.x, L.y, L.fixed);
    return { head: v.y + L.hy, foot: v.y + (L.form === 'bust' ? L.edge : L.h * 0.97) };
  }
  // the visible spot closest to where you're reading wins; he stays put unless another is clearly closer
  function pick() {
    if (sentHome) return hero ? { kind: 'hero', spot: spots[0] } : { kind: 'gone' };
    if (helpOpen) return { kind: 'help' };
    var line = innerHeight * 0.42, top = headerBottom() + 6, bottom = innerHeight - 36, best = null, bestS = Infinity, curS = Infinity;
    spots.forEach(function (s, i) {
      var g = gauge(s);
      if (!g || g.head < top || g.foot > bottom) return;
      var sc = Math.abs((g.head + g.foot) / 2 - line);
      if (i === 0 && scrollY < 80) sc -= 5000; // the start spot holds until the reader scrolls
      if (cur && cur.spot === s && cur.kind !== 'dock') curS = sc;
      if (sc < bestS) { bestS = sc; best = s; }
    });
    if (best && curS < Infinity && cur.spot !== best && curS - bestS < 90) best = cur.spot;
    if (best) { offSince = 0; return { kind: best.mode === 'hero' ? 'hero' : 'spot', spot: best }; }
    // nothing in view: wait at the screen edge, after a beat so a quick scroll doesn't bounce him around
    if (!offSince) offSince = now();
    if (now() - offSince > 900) return { kind: 'dock' };
    clearTimeout(evalT); evalT = setTimeout(evaluate, 960);
    return cur;
  }
  function evaluate(force) {
    if (!ready) return;
    var t = pick();
    if (!t) return;
    if (state === 'travel') { if (!same(t, cur) && t.kind !== 'gone') cur = t; return; }
    if (state !== 'idle') { pending = true; return; }
    if (same(t, cur)) { reflow(); return; }
    if (!force && vel > 1.4) return; // let a fast scroll settle first
    var wait = 650 - (now() - lastMove);
    if (!force && wait > 0) { clearTimeout(evalT); evalT = setTimeout(evaluate, wait + 20); return; }
    go(t);
  }
  function reflow() {
    if (state !== 'idle' || !cur || cur.kind === 'hero' || cur.kind === 'gone') return;
    var L = layout(cur);
    if (!L) { go({ kind: 'dock' }); return; } // his spot no longer fits (the window got narrower)
    if (!curL || Math.abs(L.x - curL.x) > 0.5 || Math.abs(L.y - curL.y) > 0.5 || L.w !== curL.w || L.form !== curL.form) apply(L);
  }

  /* ---------- the teleport ---------- */
  function go(to) {
    var from = cur, idx = function (l) { return l && l.spot ? spots.indexOf(l.spot) : -1; };
    var info = {
      back: !!from && from.kind !== 'dock' && to.kind !== 'dock' && idx(to) > -1 && idx(to) < idx(from),
      skipped: from && to.kind === 'spot' && idx(from) > -1 ? Math.abs(idx(to) - idx(from)) - 1 : 0,
      first: !from,
    };
    cur = to; state = 'leaving'; lastMove = now();
    root.classList.add('is-busy');
    bubbleOff();
    depart(from, function (start) {
      if (cur.kind === 'gone') { finish(from, info); return; }
      state = 'travel';
      fxBolt(start, function () { return pointOf(cur); }, function () {
        state = 'arriving';
        arrive(cur, function () { finish(from, info); });
      }, to.kind === 'dock' || (!!from && from.kind === 'dock') || (!from && pagesSeen > 0));
    });
  }
  function finish(from, info) {
    state = 'idle';
    root.classList.remove('is-busy');
    root.dataset.at = cur.spot && cur.kind !== 'dock' && cur.kind !== 'help' ? cur.spot.id : cur.kind;
    if (cur.kind === 'gone') { root.hidden = true; returnBtn.hidden = false; }
    else landed(info);
    if (pending) { pending = false; setTimeout(evaluate, 80); }
  }
  function depart(from, done) {
    if (!from) { done(pagesSeen ? { x: innerWidth - 4, y: clamp(pointOf(cur).y, headerBottom() + 20, innerHeight - 20) } : { x: innerWidth + 30, y: headerBottom() + 40 }); return; }
    if (from.kind === 'hero') { hero.away(true); setTimeout(function () { done(pointOf(from)); }, reduce ? 0 : 170); return; }
    var L = curL || layout(from), r = figRect();
    var visible = r.bottom > 0 && r.top < innerHeight;
    if (reduce || !visible) { hideFig(); done(visible ? pointOf(from) : { x: r.left + r.width / 2, y: clamp(r.top, -40, innerHeight + 40) }); return; }
    if (L.form === 'bust' || from.kind === 'dock') {
      var p = pointOf(from);
      root.classList.add('is-duck');
      if (L.form === 'bust') setFace('surprised');
      setTimeout(function () {
        fxSparks(p.x, p.y, 10, true);
        hideFig(); root.classList.remove('is-duck'); setFace('idle');
        done(p);
      }, 200);
      return;
    }
    // full body: crouch and crackle, then launch out of the frame in a pillar of light
    var g = groundOf(L), hang = L.pose === 'hang' || (cur && cur.kind === 'dock');
    if (!hang) {
      apply(bodyAt('charge', P.charge.feet, g.x, g.y, L.flip, L.fixed));
      root.classList.add('is-charging');
      fxArcs(230);
    }
    setTimeout(function () {
      root.classList.remove('is-charging');
      if (!hang) apply(bodyAt('launch', P.launch.feet, g.x, g.y, L.flip, L.fixed)); else setPose('launch');
      root.classList.add('is-launching');
      var b = figRect(), c = { x: b.left + b.width / 2, y: b.top + b.height * 0.45 };
      fxPillar(c.x, c.y - 280, b.bottom, 320);
      fxSparks(c.x, b.bottom - 6, 14, true);
      setTimeout(function () { hideFig(); root.classList.remove('is-launching'); done(c); }, 190);
    }, hang ? 0 : 230);
  }
  function arrive(loc, done) {
    if (loc.kind === 'hero') {
      root.hidden = true;
      hero.away(false);
      var p = pointOf(loc);
      fxSparks(p.x, p.y, 12, true); fxRing(p.x, p.y + 4, 380);
      setTimeout(done, reduce ? 0 : 420);
      return;
    }
    var L = layout(loc);
    if (!L) { loc = cur = { kind: 'dock' }; L = layout(loc); }
    root.classList.toggle('is-help', loc.kind === 'help');
    if (reduce) { apply(L); showFig(); done(); return; }
    var e;
    if (L.form === 'bust') {
      apply(L); setFace('laugh'); showFig(); replay('is-rise', 520);
      e = toView(L.x + L.w / 2, L.y + L.edge, L.fixed);
      fxSparks(e.x, e.y, 12, true); fxRing(e.x, e.y, 360);
      setTimeout(function () { setFace('idle'); done(); }, 540);
      return;
    }
    if (loc.kind === 'dock' || L.pose === 'hang') {
      apply(L); showFig(); replay(L.pose === 'hang' ? 'is-grab' : 'is-slide', 900);
      e = pointOf(loc);
      fxSparks(e.x, e.y, 10, false);
      setTimeout(done, L.pose === 'hang' ? 520 : 420);
      return;
    }
    // superhero landing on the ground point, then settle into the spot's pose
    var g = groundOf(L);
    apply(bodyAt('land', P.land.feet, g.x, g.y, L.flip, L.fixed));
    showFig(); replay('is-landing', 360);
    e = toView(g.x, g.y, L.fixed);
    fxRing(e.x, e.y, 420); fxSparks(e.x, e.y - 4, 16, true); fxDust(e.x, e.y);
    setTimeout(function () {
      apply(L); replay(L.pose === 'peek' ? 'is-squash' : 'is-hop', 500);
      setTimeout(done, 360);
    }, 400);
  }
  function landed(info) {
    if (cur.kind === 'help') return;
    setTimeout(function () {
      if (state !== 'idle') return;
      if (!greeted) {
        greeted = true;
        var gk = 'mg-greet-' + page.key;
        if (returning && speak('welcomeBack', true)) { wave(2200); return; }
        if (!load(gk, true)) { save(gk, '1', true); if (speak('greet.' + page.key, true)) { wave(2200); return; } }
      }
      if (cur.kind === 'dock') { if (Math.random() < 0.5) speak('dock'); return; }
      if (cur.kind === 'hero') return; // the hero bust has its own tips
      if (info.skipped >= 2 && Math.random() < 0.6 && speak('fast')) return;
      if (info.back && Math.random() < 0.35 && speak('back')) return;
      speakSpot(cur.spot, info.first);
    }, 320);
  }

  /* ---------- waving: he stands up on his edge (or where he stands) and waves for a moment ---------- */
  var waving = 0;
  function wave(ms) {
    if (reduce || state !== 'idle' || !cur || cur.kind !== 'spot' || !curL || curL.form !== 'body' || waving) return false;
    if (curL.pose !== 'sit' && curL.pose !== 'stand' && curL.pose !== 'point') return false;
    var g = groundOf(curL);
    apply(bodyAt('wave', P.wave.feet, g.x, g.y, curL.flip, curL.fixed));
    waving = setTimeout(function () {
      waving = 0;
      if (state !== 'idle' || !cur || cur.kind !== 'spot') return;
      var L = layout(cur);
      if (L) { apply(L); replay('is-hop', 500); }
    }, ms || 1300);
    return true;
  }

  /* ---------- hiding: duck behind the edge when the cursor comes close ---------- */
  var px = -1e4, py = -1e4, ducked = false, duckNext = 0, proxRaf = 0;
  function proximity() {
    proxRaf = 0;
    if (state !== 'idle' || !cur || ducked || helpOpen || cur.kind === 'hero' || cur.kind === 'gone' || !curL || now() < duckNext) return;
    var r = figRect(), d = Math.hypot(px - (r.left + r.width / 2), py - (r.top + r.height * 0.4));
    if (d > Math.max(110, r.width * 0.9)) return;
    duckNext = now() + 5200;
    if (curL.form === 'body' && curL.pose !== 'peek') { if (!wave(1300)) replay(curL.pose === 'hang' ? 'is-grab' : 'is-hop', 900); return; }
    ducked = true;
    root.classList.add('is-duck');
    if (curL.form === 'bust') setFace('surprised');
    setTimeout(function () {
      ducked = false;
      root.classList.remove('is-duck');
      if (curL && curL.form === 'bust') { setFace('wink'); setTimeout(function () { setFace('idle'); }, 900); }
    }, 950);
  }
  if (fine) {
    window.addEventListener('pointermove', function (e) {
      px = e.clientX; py = e.clientY; wake();
      if (!proxRaf) proxRaf = requestAnimationFrame(proximity);
    }, { passive: true });
  }

  /* ---------- idle life: blinks, hops, the odd line, a doze ---------- */
  var idleLines = 0, sleeping = false;
  function wake() {
    lastInput = now();
    if (!sleeping) return;
    sleeping = false;
    if (curL && curL.form === 'bust') { setFace('blink'); setTimeout(function () { if (!sleeping) setFace('idle'); }, 160); }
  }
  function idle() {
    setTimeout(idle, 2600 + Math.random() * 2200);
    if (state !== 'idle' || !cur || document.hidden || hushed || ducked || cur.kind === 'hero' || cur.kind === 'gone' || cur.kind === 'help') return;
    if (now() - lastInput > 40000) {
      if (!sleeping && curL && curL.form === 'bust') { sleeping = true; setFace('sleepy'); }
      return; // dozing: no blinks, hops or chatter until something happens
    }
    if (curL && curL.form === 'bust' && Math.random() < 0.6) { setFace('blink'); setTimeout(function () { setFace('idle'); }, 130); }
    else if (!reduce && curL && curL.form === 'body' && curL.pose !== 'peek' && Math.random() < 0.18) replay(curL.pose === 'hang' ? 'is-grab' : 'is-hop', 900);
    var quiet = now() - lastSay, active = now() - lastInput < 60000;
    if (!active || quiet < 14000) return;
    if (cur.kind === 'dock') { if (Math.random() < 0.25) speak('dock'); return; }
    if (cur.kind === 'spot' && (spotSaid[cur.spot.key] || 0) < 2 && Math.random() < 0.4) { speakSpot(cur.spot); return; }
    if (idleLines < 3 && quiet > 24000 && Math.random() < 0.3 && speak('idle')) idleLines++;
  }

  /* ---------- clicks: a reaction, then the help card (four quick clicks make him dizzy) ---------- */
  var pokes = 0, pokeAt = 0, helpT = 0;
  function dizzy() {
    clearTimeout(helpT);
    var line = pickLine('dizzy') || LINES.dizzy[0];
    if (cur && cur.kind === 'hero') { say(line); return; } // the hero bust plays its own dizzy face
    replay('is-spin', 1400);
    if (curL && curL.form === 'bust') { setFace('dizzy'); setTimeout(function () { setFace('idle'); }, 1700); }
    say(line);
  }
  function poke() {
    var t = now();
    pokes = t - pokeAt < 1500 ? pokes + 1 : 1; pokeAt = t;
    clearTimeout(helpT);
    if (pokes >= 4) { pokes = 0; dizzy(); return; }
    if (cur && cur.kind !== 'hero') {
      replay('is-squash', 420);
      if (curL && curL.form === 'bust') { setFace('surprised'); setTimeout(function () { setFace('wink'); }, 180); }
    }
    helpT = setTimeout(function () { pokes = 0; openHelp(); }, 520);
  }
  root.addEventListener('click', function () {
    wake();
    if (state !== 'idle' || !cur) return;
    if (cur.kind === 'help') { replay('is-squash', 420); setFace('wink'); setTimeout(function () { setFace('idle'); }, 700); return; }
    poke();
  });
  if (hero) {
    hero.onPoke = function () { wake(); if (state === 'idle') poke(); };
    hero.onDizzy = function () { clearTimeout(helpT); pokes = 0; };
    hero.nextTip = function () {
      if (muted || helpOpen || now() - lastSay < 6000) return null;
      var line = pickLine('home.hero');
      if (line) { remember(line); lastSay = now(); spoke['home.hero'] = (spoke['home.hero'] || 0) + 1; }
      return line;
    };
  }

  /* ---------- the help card ---------- */
  var asked = [], helpBack = null, showAll = false;
  function chipKey() {
    if (cur && cur.spot && (cur.spot.key === 'contact' || cur.spot.key === 'send')) return 'contact';
    return slug && CHIPS[slug] ? slug : page.key;
  }
  function msgEl(text, me) {
    var el = document.createElement('div');
    el.className = 'mg-msg' + (me ? ' is-me' : '');
    el.textContent = text;
    logEl.appendChild(el);
    logEl.scrollTop = logEl.scrollHeight;
    return el;
  }
  function renderChips() {
    chipsEl.innerHTML = '';
    var first = (CHIPS[chipKey()] || CHIPS.home).filter(function (id) { return asked.indexOf(id) < 0; });
    var rest = QA.filter(function (q) { return asked.indexOf(q.id) < 0 && first.indexOf(q.id) < 0; }).map(function (q) { return q.id; });
    var list = showAll ? first.concat(rest) : first;
    list.forEach(function (id) {
      var q = QA.filter(function (x) { return x.id === id; })[0];
      if (!q) return;
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'mg-chip'; b.textContent = q.q; b.dataset.q = id;
      chipsEl.appendChild(b);
    });
    if (!showAll && rest.length) {
      var more = document.createElement('button');
      more.type = 'button'; more.className = 'mg-chip is-more'; more.textContent = 'More questions'; more.dataset.more = '1';
      chipsEl.appendChild(more);
    }
  }
  function answer(id) {
    var q = QA.filter(function (x) { return x.id === id; })[0];
    if (!q) return;
    asked.push(id);
    msgEl(q.q, true);
    renderChips();
    var dots = document.createElement('div');
    dots.className = 'mg-msg is-typing'; dots.setAttribute('aria-label', 'mini Gab is typing');
    dots.innerHTML = '<i></i><i></i><i></i>';
    logEl.appendChild(dots); logEl.scrollTop = logEl.scrollHeight;
    if (curL && curL.form === 'bust') setFace('blink');
    setTimeout(function () {
      dots.remove();
      setFace(id === 'shoes' ? 'stars' : 'laugh'); setTimeout(function () { setFace('idle'); }, 1200);
      var el = msgEl(q.a);
      if (q.act && q.act.length) {
        var row = document.createElement('div');
        row.className = 'mg-acts';
        q.act.forEach(function (a) {
          var x;
          if (a.go) { x = document.createElement('button'); x.type = 'button'; x.dataset.go = a.go; }
          else { x = document.createElement('a'); x.href = a.href; if (a.ext) { x.target = '_blank'; x.rel = 'noopener'; } }
          x.className = 'mg-act'; x.textContent = a.t + (a.go ? ' →' : a.ext ? ' ↗' : ' →');
          row.appendChild(x);
        });
        el.appendChild(row);
      }
      logEl.scrollTop = logEl.scrollHeight;
    }, reduce ? 60 : 520);
  }
  function lock(on) {
    if (on) { if (lenis) lenis.stop(); document.documentElement.style.overflow = 'hidden'; }
    else { document.documentElement.style.overflow = ''; if (lenis) lenis.start(); }
  }
  function openHelp() {
    if (helpOpen || sentHome) return;
    helpOpen = true;
    helpBack = document.activeElement;
    logEl.innerHTML = '';
    msgEl(HELP_HI[page.key] || HELP_HI.home);
    showAll = false; renderChips();
    helpEl.hidden = false; void helpEl.offsetWidth; helpEl.classList.add('is-open');
    helpEl.setAttribute('aria-modal', phoneMq.matches ? 'true' : 'false');
    if (phoneMq.matches) lock(true);
    setTimeout(function () { var c = $('.mg-chip', chipsEl); if (c) c.focus({ preventScroll: true }); }, 80);
    bubbleOff();
    setTimeout(function () { evaluate(true); }, 60); // he beams over to peek above the card
  }
  function closeHelp(keepFocus) {
    if (!helpOpen) return;
    helpOpen = false;
    helpEl.classList.remove('is-open');
    setTimeout(function () { if (!helpOpen) helpEl.hidden = true; }, reduce ? 0 : 220);
    lock(false);
    if (!keepFocus && helpBack && helpBack.focus) helpBack.focus({ preventScroll: true });
    setTimeout(function () { evaluate(true); }, 60); // and back to the section being read
  }
  function goContact() {
    closeHelp(true);
    var c = $('#contact');
    if (!c) return;
    c.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    setTimeout(function () { var f = $('#contact input[name="name"]'); if (f) f.focus({ preventScroll: true }); }, reduce ? 0 : 900);
  }
  chipsEl.addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.more) { showAll = true; renderChips(); var f = $('.mg-chip', chipsEl); if (f) f.focus(); return; }
    answer(b.dataset.q);
  });
  logEl.addEventListener('click', function (e) {
    var b = e.target.closest('[data-go]');
    if (b) goContact();
    else if (e.target.closest('a.mg-act')) closeHelp(true);
  });
  closeBtn.addEventListener('click', function () { closeHelp(); });
  function setMute(on) {
    muted = on; save('mg-muted', on ? '1' : null);
    muteBtn.textContent = on ? 'Unmute chatter' : 'Mute chatter';
    muteBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    if (on) bubbleOff();
  }
  setMute(muted);
  muteBtn.addEventListener('click', function () { setMute(!muted); });
  homeBtn.addEventListener('click', function () {
    say(pickLine('bye') || LINES.bye[0]);
    setFace('wink');
    setTimeout(function () {
      sentHome = true; save('mg-home', '1');
      bubbleOff(); setFace('idle');
      closeHelp(true);
      returnBtn.hidden = false;
      returnBtn.focus({ preventScroll: true });
    }, 1700);
  });
  returnBtn.addEventListener('click', function () {
    sentHome = false; save('mg-home', null);
    returnBtn.hidden = true;
    greeted = true;
    evaluate(true);
    setTimeout(function () { if (speak('hello', true)) wave(2000); }, 1500);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && helpOpen) { closeHelp(); return; }
    if (e.key === 'Tab' && helpOpen && phoneMq.matches) {
      var f = $$('button, a[href]', helpEl).filter(function (x) { return x.offsetParent; });
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });
  document.addEventListener('pointerdown', function (e) {
    if (helpOpen && !helpEl.contains(e.target) && !root.contains(e.target)) closeHelp(true);
  });

  /* ---------- the rest of the page ---------- */
  // quiet while someone types in the contact form
  var form = $('#contactForm'), typedOnce = false, typingT = 0;
  if (form) {
    form.addEventListener('focusin', function () {
      clearTimeout(typingT);
      if (!typing && !typedOnce) { typedOnce = true; bubbleOff(); speak('typing', true); }
      typing = true;
    });
    form.addEventListener('focusout', function () { typingT = setTimeout(function () { typing = false; }, 2500); });
  }
  // hide while an overlay is open (lightbox, screenshot fan, mobile menu, explorer sheet, search row)
  var navLinks = $('#navLinks');
  function hush() {
    var bs = document.body.style;
    hushed = bs.overflow === 'hidden' || bs.position === 'fixed' || (!!navLinks && navLinks.classList.contains('open')) || (!!header && header.classList.contains('search-open'));
    root.classList.toggle('is-hush', hushed);
    if (hushed) bubbleOff();
  }
  var mo = new MutationObserver(hush);
  mo.observe(document.body, { attributes: true, attributeFilter: ['style', 'class'] });
  if (navLinks) mo.observe(navLinks, { attributes: true, attributeFilter: ['class'] });
  if (header) mo.observe(header, { attributes: true, attributeFilter: ['class'] });
  // he cheers when the hero workflow books a lead while he's watching it
  var lastCheer = 0;
  document.addEventListener('wf:booked', function (e) {
    if (state !== 'idle' || !cur || !cur.spot || cur.spot.id !== 'workflow' || now() - lastCheer < 9000) return;
    lastCheer = now();
    replay('is-hop', 900);
    if (!muted && !helpOpen) say((e.detail && e.detail.name ? e.detail.name + ' just booked! ' : 'Lead booked! ') + '🎉');
  });

  window.addEventListener('scroll', function () {
    var t = performance.now(), dy = Math.abs(scrollY - lastY), dt = Math.max(1, t - lastT);
    vel = vel * 0.6 + (dy / dt) * 0.4; lastY = scrollY; lastT = t; wake();
    clearTimeout(settleT);
    settleT = setTimeout(function () { vel = 0; evaluate(); }, 170);
    if (!scrollRaf) scrollRaf = requestAnimationFrame(function () { scrollRaf = 0; evaluate(); });
  }, { passive: true });
  var scrollRaf = 0, resizeT = 0;
  window.addEventListener('resize', function () {
    clearTimeout(resizeT);
    resizeT = setTimeout(function () { resolve(); fxSize(); reflow(); evaluate(); }, 150);
  });
  if ('ResizeObserver' in window) {
    var roRaf = 0;
    var ro = new ResizeObserver(function () { if (!roRaf) roRaf = requestAnimationFrame(function () { roRaf = 0; reflow(); }); });
    ro.observe(document.body);
    ro.observe(helpEl); // the card grows as questions are answered; he stays on its top edge
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { spots.forEach(function (s) { s._range = undefined; }); reflow(); });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) evaluate(); });
  window.addEventListener('keydown', wake);
  window.addEventListener('pointerdown', wake, { passive: true });

  /* ---------- go ---------- */
  var ready = false;
  resolve();
  if (!spots.length) return;
  fxSize();
  setFace('idle');
  if (sentHome) returnBtn.hidden = false;
  if (hero) cur = { kind: 'hero', spot: spots[0] };
  ready = true;
  idle();
  setTimeout(function () { evaluate(true); }, hero ? 0 : 500);
}
