import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

(function () {
  "use strict";
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(pointer:fine)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- year ---------- */
  var yearEl = $('#year'); if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- mobile nav ---------- */
  // top bar gets a hairline border once the page scrolls
  var topbar = $('header');
  if (topbar) {
    var onScroll = function () { topbar.classList.toggle('is-scrolled', window.scrollY > 8); };
    onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
  }
  var navToggle = $('#navToggle'), navLinks = $('#navLinks');
  (function () {
    var headerEl = $('header');
    if (!headerEl) return;
    function syncHeaderHeight() {
      document.documentElement.style.setProperty('--header-h', headerEl.offsetHeight + 'px');
    }
    syncHeaderHeight();
    window.addEventListener('resize', syncHeaderHeight);
    window.addEventListener('load', syncHeaderHeight);
  })();
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      var open = navLinks.classList.toggle('open');
      navToggle.classList.toggle('is-open', open);
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    $$('a', navLinks).forEach(function (a) {
      a.addEventListener('click', function () {
        navLinks.classList.remove('open');
        navToggle.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.setAttribute('aria-label', 'Open menu');
        document.body.style.overflow = '';
      });
    });
  }

  /* ---------- smooth scroll (Lenis, synced to GSAP's ticker + ScrollTrigger) ---------- */
  if (!reduce) {
    var lenis = new Lenis({ autoRaf: false, duration: 1.1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  /* ---------- scroll progress + active section ---------- */
  var bar = $('#scrollProgress');
  var sections = $$('main section[id]');
  var navMap = {};
  $$('.nav-links a[href^="#"]').forEach(function (a) { navMap[a.getAttribute('href').slice(1)] = a; });
  var ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, h.scrollTop / max) : 0) + ')';
      var mark = h.scrollTop + 140, cur = null;
      sections.forEach(function (s) { if (s.offsetTop <= mark) cur = s.id; });
      for (var k in navMap) { navMap[k].classList.toggle('active', k === cur); }
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  onScroll();

  /* ---------- reveal (scroll-triggered, staggered) ---------- */
  var revealEls = $$('.reveal');
  if (revealEls.length) {
    if (!reduce) {
      ScrollTrigger.batch(revealEls, {
        start: 'top 88%',
        once: true,
        onEnter: function (batch) {
          gsap.to(batch, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.08, clearProps: 'transform' });
        }
      });
    } else {
      revealEls.forEach(function (el) { el.classList.add('in'); });
    }
  }

  /* ---------- hero entrance ---------- */
  (function () {
    var hero = $('.hero'); if (!hero) return;
    var h1 = $('h1', hero);
    if (reduce || !h1) {
      if (h1) h1.style.visibility = 'visible';
      $$('.hero .bento-status, .hero p.lede, .hero-ctas, .hero-note, .hero-demo', hero).forEach(function (el) { el.style.opacity = 1; });
      return;
    }
    function splitWords(el) {
      var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      var nodes = []; var n;
      while ((n = walker.nextNode())) nodes.push(n);
      nodes.forEach(function (node) {
        var parts = node.textContent.split(/(\s+)/);
        var frag = document.createDocumentFragment();
        parts.forEach(function (w) {
          if (w === '' ) return;
          if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(w)); return; }
          var outer = document.createElement('span');
          outer.className = 'split-word';
          var inner = document.createElement('span');
          inner.className = 'split-word-inner';
          inner.textContent = w;
          outer.appendChild(inner);
          frag.appendChild(outer);
        });
        node.parentNode.replaceChild(frag, node);
      });
      return $$('.split-word-inner', el);
    }
    var words = splitWords(h1);
    h1.style.visibility = 'visible';
    gsap.set(words, { yPercent: 110 });
    var tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
    tl.to(words, { yPercent: 0, duration: 1, stagger: 0.04, clearProps: 'transform' })
      .to('.hero .bento-status', { opacity: 1, duration: 0.5 }, 0.1)
      .fromTo('.hero p.lede, .hero-ctas, .hero-note', { y: 14 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.08, clearProps: 'transform' }, '-=0.6')
      .fromTo('.hero-demo', { y: 28 }, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', clearProps: 'transform' }, '-=0.8');
  })();

  /* ---------- image reveal wipe on scroll ---------- */
  (function () {
    var imgs = $$('.case-shot img, .wf-shot img, .case-gallery img, .site-preview .site-shot');
    if (!imgs.length) return;
    if (reduce) return;
    ScrollTrigger.batch(imgs, {
      start: 'top 90%',
      once: true,
      onEnter: function (batch) {
        gsap.to(batch, { clipPath: 'inset(0% 0 0% 0)', duration: 0.9, ease: 'power3.inOut', stagger: 0.06 });
      }
    });
  })();

  /* ---------- stat count-up ---------- */
  var stats = $$('[data-count]');
  if ('IntersectionObserver' in window && !reduce && stats.length) {
    var sio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target; sio.unobserve(el);
        var target = parseInt(el.getAttribute('data-count'), 10);
        var suffix = el.getAttribute('data-suffix') || '';
        var start = performance.now(), dur = 1400;
        (function step(now) {
          var p = Math.min(1, (now - start) / dur);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * eased).toLocaleString('en-US') + suffix;
          if (p < 1) requestAnimationFrame(step);
        })(start);
      });
    }, { threshold: 0.5 });
    stats.forEach(function (el) { sio.observe(el); });
  }

  /* ---------- hero: live speed-to-lead workflow (loops forever) ---------- */
  (function () {
    var demo = $('#demo'), wf = $('#wf'); if (!demo || !wf) return;
    var svg = $('.wf-lines', wf), token = $('.wf-token', wf), halo = $('.wf-halo', wf);
    var node = function (id) { return $('[data-node="' + id + '"]', wf); };
    var countEl = $('#demoCount'), rateEl = $('#demoRate');
    // segment -> [from node, to node]
    var SEG = { s0: ['trigger', 'actions'], s1: ['actions', 'wait'], s2: ['wait', 'cond'], y0: ['cond', 'ai'], y1: ['ai', 'book'], y2: ['book', 'booked'],
      n0: ['cond', 'nsms'], n1: ['nsms', 'nwait'], n2: ['nwait', 'task'] };
    var leads = [['Sarah M.', 'Sarah', 'FB Lead Ad', true], ['Mike R.', 'Mike', 'Website form', false], ['Priya K.', 'Priya', 'Google Ads', true],
      ['Daniel T.', 'Daniel', 'FB Lead Ad', true], ['Ana L.', 'Ana', 'Website form', false]];
    var count = 1284, booked = 822, li = 0, running = false;

    // connectors are measured from the laid-out nodes, so they follow any screen size
    function layout() {
      var W = wf.clientWidth, H = wf.clientHeight;
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      Object.keys(SEG).forEach(function (k) {
        var A = node(SEG[k][0]), B = node(SEG[k][1]);
        var x1 = A.offsetLeft + A.offsetWidth / 2, y1 = A.offsetTop + A.offsetHeight;
        var x2 = B.offsetLeft + B.offsetWidth / 2, y2 = B.offsetTop, d;
        if (Math.abs(x1 - x2) < 1) d = 'M' + x1 + ' ' + y1 + ' V' + y2;
        else {
          var ym = (y1 + y2) / 2, r = 10, dir = x2 > x1 ? 1 : -1;
          d = 'M' + x1 + ' ' + y1 + ' V' + (ym - r) + ' Q' + x1 + ' ' + ym + ' ' + (x1 + dir * r) + ' ' + ym +
            ' H' + (x2 - dir * r) + ' Q' + x2 + ' ' + ym + ' ' + x2 + ' ' + (ym + r) + ' V' + y2;
        }
        $('[data-seg="' + k + '"]', svg).setAttribute('d', d);
        var f = $('[data-fill="' + k + '"]', svg); f.setAttribute('d', d);
        var len = f.getTotalLength(); f.style.strokeDasharray = len; if (!f.dataset.on) f.style.strokeDashoffset = len;
      });
      ['yes', 'no'].forEach(function (k) {
        var p = $('[data-seg="' + (k === 'yes' ? 'y0' : 'n0') + '"]', svg), pt = p.getPointAtLength(p.getTotalLength() * 0.5);
        var t = $('[data-tag="' + k + '"]', wf); t.style.left = pt.x + 'px'; t.style.top = pt.y + 'px';
      });
    }

    // time only advances while running, so pausing offscreen freezes the scene mid-step
    function wait(ms) {
      return new Promise(function (res) {
        var last = performance.now();
        (function loop(now) { if (running) ms -= now - last; last = now; ms <= 0 ? res() : requestAnimationFrame(loop); })(last);
      });
    }
    function travel(k, ms) {
      var f = $('[data-fill="' + k + '"]', svg), len = f.getTotalLength(), t = 0;
      return new Promise(function (res) {
        var last = performance.now();
        (function loop(now) {
          if (running) t += (now - last) / ms; last = now;
          var e = Math.min(1, t), q = e < .5 ? 2 * e * e : 1 - Math.pow(-2 * e + 2, 2) / 2, pt = f.getPointAtLength(len * q);
          token.setAttribute('cx', pt.x); token.setAttribute('cy', pt.y); halo.setAttribute('cx', pt.x); halo.setAttribute('cy', pt.y);
          f.style.strokeDashoffset = len * (1 - q); f.dataset.on = '1';
          e >= 1 ? res() : requestAnimationFrame(loop);
        })(last);
      });
    }
    function bubble(id, on) {
      var b = $('[data-bubble="' + id + '"]', wf); if (!b) return;
      if (on) {
        var n = node(id), right = !n.classList.contains('lane-no');
        b.style.top = (n.offsetTop - b.offsetHeight + 6) + 'px';
        b.style.left = right ? Math.min(wf.clientWidth - b.offsetWidth - 6, n.offsetLeft + n.offsetWidth * 0.55) + 'px'
          : Math.max(6, n.offsetLeft + n.offsetWidth * 0.45 - b.offsetWidth) + 'px';
      }
      b.classList.toggle('show', on);
    }
    async function step(id, ms) {
      var n = node(id); n.classList.add('is-active'); bubble(id, true);
      await wait(ms);
      n.classList.remove('is-active'); n.classList.add('is-done');
      setTimeout(function () { bubble(id, false); }, 900);
    }
    function reset() {
      $$('.wf-node', wf).forEach(function (n) { n.classList.remove('is-active', 'is-done'); });
      $$('.wf-fill', svg).forEach(function (f) { delete f.dataset.on; f.style.strokeDashoffset = f.getTotalLength(); });
      $$('.wf-bubble', wf).forEach(function (b) { b.classList.remove('show'); });
      wf.classList.remove('go-yes', 'go-no');
      token.setAttribute('cx', -20); halo.setAttribute('cx', -20);
    }
    function setLead(L) {
      $$('[data-name]', wf).forEach(function (el) { el.textContent = L[0]; });
      $$('[data-first]', wf).forEach(function (el) { el.textContent = L[1]; });
      $$('[data-src]', wf).forEach(function (el) { el.textContent = L[2]; });
    }
    async function run() {
      for (;;) {
        var L = leads[li]; setLead(L);
        await step('trigger', 700);
        if (countEl) countEl.textContent = (++count).toLocaleString('en-US');
        await travel('s0', 520); await step('actions', 1300);
        await travel('s1', 480); await step('wait', 800);
        await travel('s2', 480); await step('cond', 650);
        var y = L[3], P = y ? ['y', 'ai', 'book', 'booked'] : ['n', 'nsms', 'nwait', 'task'];
        wf.classList.add(y ? 'go-yes' : 'go-no');
        await travel(P[0] + '0', 700); await step(P[1], 1300);
        await travel(P[0] + '1', 480); await step(P[2], y ? 1100 : 800);
        await travel(P[0] + '2', 480); await step(P[3], 1200);
        if (y) { booked++; document.dispatchEvent(new CustomEvent('wf:booked', { detail: { name: L[1] } })); }
        if (rateEl) rateEl.textContent = Math.round((booked / count) * 100) + '%';
        await wait(1100);
        wf.classList.add('is-resetting'); await wait(380);
        reset(); wf.classList.remove('is-resetting');
        li = (li + 1) % leads.length;
        await wait(350);
      }
    }

    layout();
    if ('ResizeObserver' in window) new ResizeObserver(layout).observe(wf);
    if (reduce) { // static, completed "yes" path
      ['trigger', 'actions', 'wait', 'cond', 'ai', 'book', 'booked'].forEach(function (id) { node(id).classList.add('is-done'); });
      ['s0', 's1', 's2', 'y0', 'y1', 'y2'].forEach(function (k) { var f = $('[data-fill="' + k + '"]', svg); f.dataset.on = '1'; f.style.strokeDashoffset = 0; });
      wf.classList.add('go-yes');
      return;
    }
    var started = false;
    function start() { running = true; if (!started) { started = true; run(); } }
    function stop() { running = false; }
    new IntersectionObserver(function (en) { en[0].isIntersecting && !document.hidden ? start() : stop(); }).observe(demo);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop(); else if (demo.getBoundingClientRect().top < window.innerHeight) start();
    });

    if (fine) {
      var hero = $('.hero'), pending = false, px = 0, py = 0;
      hero.addEventListener('pointermove', function (e) {
        px = (e.clientX / window.innerWidth) * 2 - 1; py = (e.clientY / window.innerHeight) * 2 - 1;
        if (pending) return; pending = true;
        requestAnimationFrame(function () {
          demo.style.setProperty('--px', px.toFixed(3)); demo.style.setProperty('--py', py.toFixed(3));
          pending = false;
        });
      });
      hero.addEventListener('pointerleave', function () { demo.style.setProperty('--px', 0); demo.style.setProperty('--py', 0); });
    }
  })();

  /* ---------- hero: mini Gab mascot (follows the cursor, reacts to pokes and bookings) ---------- */
  (function () {
    var m = $('#mascot'); if (!m) return;
    var btn = $('.mascot-btn', m), bubbleEl = $('#mascotBubble'), hero = $('.hero');
    var look = $('.m-look', m), sprite = $('.mascot-sprite', m);
    var parts = $$('[data-show]', m);
    var face = 'idle', hold = 0, timers = [], visible = true;
    var tx = 0, ty = 0, lx = 0, ly = 0, raf = 0, lastInput = Date.now(), lastBook = 0;
    var tips = ['Hi! I’m mini Gab 👋', 'Psst… poke me', 'New leads get a reply in 38s ↓', 'Need a CRM untangled?', 'Your workflows, minus the babysitting', 'Say hi → Let’s talk'];
    var tipI = 0, bubbleT = 0;

    function later(fn, ms) { var t = setTimeout(fn, ms); timers.push(t); return t; }
    // face name -> cell of the 3×3 sprite atlas (idle, blink, wink / laugh, surprised, stars / bashful, sleepy, dizzy)
    var CELLS = { idle: 0, blink: 1, wink: 2, laugh: 3, surprised: 4, stars: 5, bashful: 6, sleepy: 7, dizzy: 8, heart: 1, sparkle: 3, delighted: 3 };
    function showCell(name) {
      var i = CELLS[name] || 0;
      sprite.style.backgroundPosition = (i % 3) * 50 + '% ' + Math.floor(i / 3) * 50 + '%';
    }
    function setFace(f) {
      face = f; m.dataset.face = f; showCell(f);
      parts.forEach(function (p) { p.style.display = p.dataset.show.split(' ').indexOf(f) > -1 ? 'inline' : ''; });
    }
    // show a reaction for ms, then settle back to idle
    function react(f, ms) {
      setFace(f); clearTimeout(hold);
      hold = setTimeout(function () { setFace('idle'); }, ms);
    }
    function say(text, ms) {
      if (!bubbleEl) return;
      bubbleEl.textContent = text; bubbleEl.classList.add('is-on');
      clearTimeout(bubbleT); bubbleT = setTimeout(function () { bubbleEl.classList.remove('is-on'); }, ms || 3200);
    }
    function replay(cls, ms) {
      m.classList.remove(cls); void m.offsetWidth; m.classList.add(cls);
      later(function () { m.classList.remove(cls); }, ms);
    }

    // sit him behind "that": body clipped at the x-height line, a hand on each "t"
    var wrapEl = m.parentNode, h1El = $('h1', wrapEl), wordEl = $('.m-word', wrapEl), handEls = $$('.mascot-hand', m);
    var metricsCtx = document.createElement('canvas').getContext('2d');
    function place() {
      if (!wordEl || !h1El) return;
      var cs = getComputedStyle(h1El), fs = parseFloat(cs.fontSize);
      metricsCtx.font = cs.fontWeight + ' ' + fs + 'px ' + cs.fontFamily;
      var mt = metricsCtx.measureText('tx'), A = mt.fontBoundingBoxAscent || fs * 0.95, D = mt.fontBoundingBoxDescent || fs * 0.25;
      var tAsc = metricsCtx.measureText('t').actualBoundingBoxAscent || fs * 0.66;
      var xAsc = metricsCtx.measureText('x').actualBoundingBoxAscent || fs * 0.52;
      var lh = parseFloat(cs.lineHeight) || fs * 1.02;
      var W = wrapEl.getBoundingClientRect(), wr = wordEl.getBoundingClientRect();
      var ts = $$('.m-t', wordEl).map(function (t) { return t.getBoundingClientRect(); });
      var lineTop = ts[0].top - W.top;
      var base = lineTop + (lh - (A + D)) / 2 + A;
      var xTop = base - xAsc, tTop = base - tAsc;
      var size = Math.max(84, Math.min(180, wr.width * 1.18));
      var cx = (wr.left + wr.right) / 2 - W.left;
      var bx = cx - size / 2, by = xTop + fs * 0.06 - size * 0.875;
      m.style.setProperty('--bs', size.toFixed(1) + 'px');
      m.style.setProperty('--bx', bx.toFixed(1) + 'px');
      m.style.setProperty('--by', by.toFixed(1) + 'px');
      m.style.setProperty('--qx', (bx + size * 0.14).toFixed(1) + 'px');
      m.style.setProperty('--qy', (by - size * 0.08).toFixed(1) + 'px');
      var hs = Math.max(22, fs * 0.46);
      m.style.setProperty('--hs', hs.toFixed(1) + 'px');
      handEls.forEach(function (h, i) {
        var r = ts[i] || ts[0];
        h.style.left = ((r.left + r.right) / 2 - W.left - hs / 2).toFixed(1) + 'px';
        h.style.top = (tTop - hs * 0.32).toFixed(1) + 'px';
      });
      m.classList.add('is-placed');
    }
    place();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(place);
    window.addEventListener('resize', place);
    handEls.forEach(function (h) { h.addEventListener('click', function () { btn.click(); }); });

    // cursor follow: lean, tilt and turn the whole sprite toward the pointer (eased per frame)
    function f2(n) { return n.toFixed(2); }
    function draw() {
      look.style.transform = 'perspective(420px) translate(' + f2(lx * 5) + 'px,' + f2(ly * 3) + 'px) rotate(' + f2(lx * 4) + 'deg) rotateY(' + f2(lx * 14) + 'deg) rotateX(' + f2(-ly * 6) + 'deg)';
    }
    function tick() {
      lx += (tx - lx) * 0.14; ly += (ty - ly) * 0.14;
      draw();
      raf = visible && (Math.abs(tx - lx) > 0.002 || Math.abs(ty - ly) > 0.002) ? requestAnimationFrame(tick) : 0;
    }
    function lookAt(x, y) {
      var r = btn.getBoundingClientRect();
      var dx = x - (r.left + r.width / 2), dy = y - (r.top + r.height * 0.45);
      var d = Math.hypot(dx, dy), k = Math.min(1, d / 320) / (d || 1);
      tx = dx * k; ty = dy * k;
      if (reduce) { lx = tx; ly = ty; draw(); return; }
      if (!raf && visible) raf = requestAnimationFrame(tick);
    }
    function wake() {
      lastInput = Date.now();
      if (face === 'sleepy') setFace('idle');
    }

    if (fine) {
      window.addEventListener('pointermove', function (e) { wake(); lookAt(e.clientX, e.clientY); }, { passive: true });
    }
    window.addEventListener('pointerdown', function (e) { wake(); lookAt(e.clientX, e.clientY); }, { passive: true });

    // pokes: squash + a happy reaction; four quick pokes make him dizzy
    var pokes = 0, pokeAt = 0, payoffs = ['heart', 'sparkle', 'delighted', 'wink', 'bashful'];
    btn.addEventListener('click', function () {
      wake();
      var now = Date.now();
      pokes = now - pokeAt < 1600 ? pokes + 1 : 1; pokeAt = now;
      if (!reduce) replay('is-squash', 440);
      if (pokes >= 4) { pokes = 0; react('dizzy', 1400); say('Whoa… okay, okay, I’m dizzy 😵‍💫', 2400); return; }
      setFace('surprised'); clearTimeout(hold);
      hold = setTimeout(function () { react(payoffs[Math.floor(Math.random() * payoffs.length)], 700); }, 140);
      if (pokes === 1 && Math.random() < 0.5) say(['Hehe, that tickles', 'Hi there!', 'Boop!', 'I automate things. Ask me how →'][Math.floor(Math.random() * 4)], 2200);
    });

    // cheer when the hero workflow books a lead
    document.addEventListener('wf:booked', function (e) {
      var now = Date.now(); if (!visible || now - lastBook < 3000) return; lastBook = now;
      tx = 0.9; ty = 0.5; resume(); // glance toward the workflow
      react('stars', 1600);
      if (!reduce) replay('is-cheer', 720);
      var who = e.detail && e.detail.name;
      say(who ? who + ' just booked! 🎉' : 'Lead booked! 🎉', 2600);
    });

    // idle life: blinking, glancing around, falling asleep, tips
    function blink() {
      if (visible && face === 'idle') {
        var blinkOnce = function (ms) { showCell('blink'); setTimeout(function () { if (face === 'idle') showCell('idle'); }, ms); };
        blinkOnce(130);
        if (Math.random() < 0.25) setTimeout(function () { if (face === 'idle') blinkOnce(110); }, 280);
      }
      later(blink, 2600 + Math.random() * 3200);
    }
    function idle() {
      if (visible) {
        var quiet = Date.now() - lastInput;
        if (quiet > 30000 && face === 'idle') setFace('sleepy');
        else if (quiet > 4000 && face === 'idle') { // look around on his own
          tx = Math.random() * 1.6 - 0.8; ty = Math.random() * 1.0 - 0.4; resume();
        }
        if (face === 'idle' && quiet > 2500 && !reduce && Math.random() < 0.3) replay('is-hop', 560);
      }
      later(idle, 2200 + Math.random() * 1800);
    }
    function tip() {
      if (visible && face !== 'sleepy' && !bubbleEl.classList.contains('is-on')) { say(tips[tipI], 3400); tipI = (tipI + 1) % tips.length; }
      later(tip, 13000 + Math.random() * 6000);
    }

    setFace('idle');
    function resume() { if (visible && !raf && !reduce) raf = requestAnimationFrame(tick); }
    if (hero) new IntersectionObserver(function (en) { visible = en[0].isIntersecting && !document.hidden; resume(); }).observe(hero);
    document.addEventListener('visibilitychange', function () {
      var r = hero && hero.getBoundingClientRect();
      visible = !document.hidden && !!r && r.bottom > 0 && r.top < window.innerHeight;
      resume();
    });

    if (reduce) { m.classList.add('is-in'); return; }
    later(function () {
      m.classList.add('is-in');
      later(function () { m.classList.add('is-waving'); say(tips[0], 3000); tipI = 1; }, 750);
      later(function () { m.classList.remove('is-waving'); }, 1700);
      later(blink, 2000); later(idle, 3000); later(tip, 12000);
    }, 900);
  })();

  /* ---------- case study diagrams: animate when scrolled into view ---------- */
  var diagrams = $$('.diagram');
  if ('IntersectionObserver' in window && !reduce && diagrams.length) {
    var dio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('animate'); dio.unobserve(en.target); }
      });
    }, { threshold: 0.3 });
    diagrams.forEach(function (svg) { dio.observe(svg); });
  } else {
    diagrams.forEach(function (svg) { svg.classList.add('animate'); });
  }

  /* ---------- project filter (FLIP) ---------- */
  var grid = $('#projectsGrid'), chips = $$('.chip'), statusEl = $('#filterStatus');
  if (grid && chips.length) {
    var cards = $$('.project-card', grid);
    function applyFilter(f, push) {
      var first = cards.map(function (c) { return c.getBoundingClientRect(); });
      var shown = 0;
      cards.forEach(function (c) {
        var tags = (c.getAttribute('data-tags') || '').split(/\s+/);
        var show = (f === 'all') || tags.indexOf(f) !== -1;
        c.hidden = !show;
        if (show) shown++;
      });
      chips.forEach(function (ch) {
        ch.setAttribute('aria-pressed', ch.getAttribute('data-filter') === f ? 'true' : 'false');
      });
      if (statusEl) {
        var lbl = 'Showing ' + shown + ' project' + (shown === 1 ? '' : 's');
        statusEl.textContent = f === 'all' ? 'Showing all ' + shown + ' projects' : lbl + ' in this category';
      }
      if (!reduce && typeof cards[0].animate === 'function') {
        cards.forEach(function (c, i) {
          if (c.hidden) return;
          var last = c.getBoundingClientRect(), fr = first[i];
          if (!fr || fr.width === 0) {
            c.animate([{ opacity: 0, transform: 'scale(.96)' }, { opacity: 1, transform: 'none' }],
              { duration: 260, easing: 'ease' });
            return;
          }
          var dx = fr.left - last.left, dy = fr.top - last.top;
          if (dx || dy) {
            c.animate([{ transform: 'translate(' + dx + 'px,' + dy + 'px)' }, { transform: 'none' }],
              { duration: 300, easing: 'cubic-bezier(.2,.8,.2,1)' });
          }
        });
      }
      if (push) {
        try {
          if (f === 'all') history.replaceState(null, '', location.pathname + location.search + '#projects');
          else history.replaceState(null, '', location.pathname + location.search + '#projects=' + f);
        } catch (e) { }
      }
    }
    chips.forEach(function (ch) {
      ch.addEventListener('click', function () { applyFilter(ch.getAttribute('data-filter'), true); });
    });
  }

  /* ---------- case study filter ---------- */
  (function () {
    var grid = $('#caseGrid'); if (!grid) return;
    var chips = $$('.case-chip'), cards = $$('.case-card', grid), empty = $('#caseEmpty');
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var f = chip.getAttribute('data-case-filter'), shown = 0;
        chips.forEach(function (c) { c.setAttribute('aria-pressed', c === chip ? 'true' : 'false'); });
        cards.forEach(function (card) {
          var show = f === 'all' || card.getAttribute('data-tags').split(' ').indexOf(f) !== -1;
          card.hidden = !show; if (show) shown++;
          if (show && !reduce && card.animate) card.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: 'ease-out' });
        });
        grid.classList.toggle('is-filtered', f !== 'all');
        if (empty) empty.hidden = shown > 0;
      });
    });
  })();

  /* ---------- about: live clocks + availability ---------- */
  (function () {
    var card = $('#clockCard'); if (!card) return;
    var tz = card.getAttribute('data-tz');
    var start = parseInt(card.getAttribute('data-start'), 10), end = parseInt(card.getAttribute('data-end'), 10);
    var days = card.getAttribute('data-days').split(',').map(Number);
    var label = $('#clockStatus span');
    var WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    function tick() {
      var now = new Date();
      $$('[data-clock]', card).forEach(function (el) {
        el.textContent = new Intl.DateTimeFormat('en-US', { timeZone: el.getAttribute('data-clock'), hour: 'numeric', minute: '2-digit' }).format(now);
      });
      var p = {};
      new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short', hour: 'numeric', hourCycle: 'h23' })
        .formatToParts(now).forEach(function (x) { p[x.type] = x.value; });
      var hour = parseInt(p.hour, 10) % 24;
      var online = days.indexOf(WEEKDAYS.indexOf(p.weekday)) !== -1 && hour >= start && hour < end;
      card.classList.toggle('is-online', online);
      label.textContent = online ? 'Online now' : 'Offline right now';
    }
    tick();
    setInterval(tick, 30000);
  })();

  /* ---------- about: ID badge (lanyard physics, drag, 3D twist, flip) ---------- */
  (function () {
    var wrap = $('#idBadge'); if (!wrap) return;
    var hang = $('.id-hang', wrap), card = $('.id-card', wrap);
    var front = $('.id-front', card), back = $('.id-back', card);
    var flipped = false;
    function setFaces() {
      front.inert = flipped; back.inert = !flipped;
      front.setAttribute('aria-hidden', flipped ? 'true' : 'false');
      back.setAttribute('aria-hidden', flipped ? 'false' : 'true');
    }
    setFaces();

    function onKey(fn) {
      card.addEventListener('keydown', function (e) {
        if (e.target !== card || (e.key !== 'Enter' && e.key !== ' ')) return;
        e.preventDefault(); fn();
      });
    }

    if (reduce) { // no physics: a click is an instant face swap
      var swap = function () { flipped = !flipped; card.classList.toggle('is-flipped', flipped); setFaces(); };
      card.addEventListener('click', function (e) { if (!e.target.closest('a, button')) swap(); });
      onKey(swap);
      return;
    }

    wrap.classList.add('is-live');

    // woven strap printed with the brand, plus the metal crimp, swivel and ring
    var label = new Array(14).join('TECHYOPS  ·  ');
    wrap.insertAdjacentHTML('afterbegin',
      '<svg class="id-strap" aria-hidden="true"><defs>' +
        '<pattern id="idWeave" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">' +
          '<rect width="5" height="5" style="fill:var(--accent)"/><rect width="2" height="5" fill="rgba(0,0,0,.14)"/></pattern>' +
        '<linearGradient id="idFadeG" gradientUnits="userSpaceOnUse" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#000"/><stop offset="1" stop-color="#fff"/></linearGradient>' +
        '<mask id="idFade" maskUnits="userSpaceOnUse" x="-3000" y="-3000" width="6000" height="6000"><rect x="-3000" y="-3000" width="6000" height="6000" fill="url(#idFadeG)"/></mask>' +
      '</defs><g mask="url(#idFade)">' +
        '<path class="s-edge" fill="none" stroke="rgba(0,0,0,.32)" stroke-width="25"/>' +
        '<path id="idStrapPath" fill="none" stroke="url(#idWeave)" stroke-width="22"/>' +
        '<text font-family="JetBrains Mono Variable, monospace" font-size="8.5" font-weight="700" letter-spacing="2" fill="rgba(255,255,255,.88)" dominant-baseline="central">' +
          '<textPath href="#idStrapPath" startOffset="4">' + label + '</textPath></text>' +
      '</g></svg>');
    wrap.insertAdjacentHTML('beforeend',
      '<svg class="id-clip" aria-hidden="true"><defs>' +
        '<linearGradient id="idMetal" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#f4f6fb"/><stop offset=".45" stop-color="#a7b0c2"/><stop offset=".7" stop-color="#e6eaf2"/><stop offset="1" stop-color="#7c869a"/></linearGradient>' +
      '</defs>' +
        '<line class="c-stem" stroke="url(#idMetal)" stroke-width="3" stroke-linecap="round"/>' +
        '<circle class="c-ring" r="8" fill="none" stroke="url(#idMetal)" stroke-width="3"/>' +
        '<g class="c-crimp"><rect x="-13" y="-8" width="26" height="16" rx="3.5" fill="url(#idMetal)" stroke="rgba(0,0,0,.28)"/>' +
          '<rect x="-9" y="-2" width="18" height="4" rx="2" fill="rgba(0,0,0,.18)"/></g>' +
      '</svg>');
    var strap = $('.id-strap', wrap), path = $('#idStrapPath'), edge = $('.s-edge', strap), fadeG = $('#idFadeG');
    var clip = $('.id-clip', wrap), stem = $('.c-stem', clip), ring = $('.c-ring', clip), crimp = $('.c-crimp', clip);

    // state: rope angle/length, card swing relative to the rope, 3D twist
    var G = 2600, KR = 260, CR = 16, KP = 90, CP = 7, KS = 55, CS = 6.5;
    var ax, ay, p0x, p0y, L;
    var phi = 0, om = 0, r = 0, vr = 0, psi = 0, vpsi = 0, spin = 0, vspin = 0, F = 0, phiAcc = 0;
    var drag = null, raf = null, last = 0, flipT = 0; // flipT: time left in a flip, which uses a softer spring

    function layout() {
      var strapPx = parseFloat(getComputedStyle(hang).getPropertyValue('--strap')) || 170;
      p0x = wrap.clientWidth / 2; p0y = hang.offsetTop + strapPx;
      L = strapPx * 1.5 + 20; ax = p0x; ay = p0y - L; // anchor sits above the visible strap
      if (!r) r = L;
      fadeG.setAttribute('y1', ay); fadeG.setAttribute('y2', ay + L * 0.5);
    }

    function render() {
      var px = ax + Math.sin(phi) * r, py = ay + Math.cos(phi) * r;
      var theta = -(phi + psi);
      card.style.transform = 'translate3d(' + (px - p0x).toFixed(2) + 'px,' + (py - p0y).toFixed(2) + 'px,0) rotate(' + theta.toFixed(4) + 'rad) rotateY(' + spin.toFixed(2) + 'deg)';
      card.style.setProperty('--tilt', (theta * 57.3 + (spin % 180) * 0.15).toFixed(2));
      // strap: sags into a curve when the card is pushed closer than its length
      var dx = px - ax, dy = py - ay, d = Math.hypot(dx, dy) || 1, sag = r < L ? Math.sqrt(L * L - r * r) * 0.55 : 0;
      var side = om >= 0 ? -1 : 1, cx = ax + dx / 2 + (-dy / d) * sag * side, cy = ay + dy / 2 + (dx / d) * sag * side;
      var ux = px - cx, uy = py - cy, ul = Math.hypot(ux, uy) || 1; ux /= ul; uy /= ul;
      var ex = px - ux * 22, ey = py - uy * 22;
      var dPath = 'M' + ax.toFixed(1) + ' ' + ay.toFixed(1) + ' Q' + cx.toFixed(1) + ' ' + cy.toFixed(1) + ' ' + ex.toFixed(1) + ' ' + ey.toFixed(1);
      path.setAttribute('d', dPath); edge.setAttribute('d', dPath);
      crimp.setAttribute('transform', 'translate(' + ex.toFixed(1) + ' ' + ey.toFixed(1) + ') rotate(' + (Math.atan2(uy, ux) * 57.3 - 90).toFixed(1) + ')');
      var rx = px - Math.sin(theta) * 6, ry = py + Math.cos(theta) * 6;
      ring.setAttribute('cx', rx.toFixed(1)); ring.setAttribute('cy', ry.toFixed(1));
      stem.setAttribute('x1', (ex + ux * 8).toFixed(1)); stem.setAttribute('y1', (ey + uy * 8).toFixed(1));
      stem.setAttribute('x2', (rx - ux * 8).toFixed(1)); stem.setAttribute('y2', (ry - uy * 8).toFixed(1));
    }

    function step(dt) {
      if (!drag) {
        phiAcc = -(G / r) * Math.sin(phi) - 1.5 * om;
        om += phiAcc * dt; phi += om * dt;
        vr += (-KR * (r - L) - CR * vr + r * om * om * 0.3) * dt; r += vr * dt;
      } else {
        var tx = drag.x - drag.ox - ax, ty = drag.y - drag.oy - ay;
        var nphi = Math.atan2(tx, ty), d = Math.hypot(tx, ty), lim = L * 1.18;
        var nr = Math.max(L * 0.45, d > lim ? lim + (d - lim) * 0.18 : d);
        var nom = (nphi - phi) / dt;
        phiAcc = (nom - om) / dt; om += (nom - om) * 0.5; vr = (nr - r) / dt; phi = nphi; r = nr;
      }
      vpsi += (-KP * psi - CP * vpsi - phiAcc * 0.5) * dt; psi = Math.max(-0.6, Math.min(0.6, psi + vpsi * dt));
      var target = F + (drag ? Math.max(-70, Math.min(70, drag.vx * 0.05)) : 0);
      // a flip turns slower with one small overshoot, like a badge turned by hand; drag twisting stays lively
      var ks = flipT > 0 ? 38 : KS, cs = flipT > 0 ? 10 : CS;
      flipT = Math.max(0, flipT - dt);
      vspin += (-ks * (spin - target) - cs * vspin) * dt; spin += vspin * dt;
    }

    function atRest() {
      return !drag && Math.abs(om) < 0.002 && Math.abs(phi) < 0.001 && Math.abs(r - L) < 0.05 && Math.abs(vr) < 0.05 &&
        Math.abs(psi) < 0.001 && Math.abs(vpsi) < 0.002 && Math.abs(spin - F) < 0.05 && Math.abs(vspin) < 0.05;
    }

    function frame(now) {
      var dt = Math.min(0.033, (now - last) / 1000 || 0.016); last = now;
      step(dt / 2); step(dt / 2);
      if (atRest()) { phi = om = psi = vpsi = vr = vspin = 0; r = L; spin = F; render(); raf = null; return; }
      render(); raf = requestAnimationFrame(frame);
    }
    function kick() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }

    function local(e) { var b = wrap.getBoundingClientRect(); return { x: e.clientX - b.left, y: e.clientY - b.top }; }
    function flip() {
      F = F === 0 ? 180 : 0; flipped = !flipped; setFaces();
      flipT = 1.6; om += (Math.random() < 0.5 ? -1 : 1) * 0.25; vr -= 120; // it bobs and sways as it turns
      kick();
    }

    card.addEventListener('pointerdown', function (e) {
      if (e.button !== 0 || e.target.closest('a, button')) return;
      var p = local(e), px = ax + Math.sin(phi) * r, py = ay + Math.cos(phi) * r;
      drag = { x: p.x, y: p.y, ox: p.x - px, oy: p.y - py, vx: 0, t: performance.now(), sx: p.x, sy: p.y, lt: performance.now() };
      card.setPointerCapture(e.pointerId); wrap.classList.add('is-dragging');
      if (e.pointerType === 'mouse') e.preventDefault();
      kick();
    });
    card.addEventListener('pointermove', function (e) {
      var p = local(e), now = performance.now();
      if (drag) {
        var dt = Math.max(0.008, (now - drag.lt) / 1000);
        drag.vx = drag.vx * 0.6 + ((p.x - drag.x) / dt) * 0.4;
        drag.x = p.x; drag.y = p.y; drag.lt = now;
      } else if (e.pointerType === 'mouse' && e.movementX) { // a passing cursor nudges it
        om += Math.max(-0.4, Math.min(0.4, e.movementX * 0.004)); kick();
      }
    });
    function release(e) {
      if (!drag) return;
      var moved = Math.hypot(drag.x - drag.sx, drag.y - drag.sy), quick = performance.now() - drag.t < 300;
      vspin += Math.max(-600, Math.min(600, drag.vx * 0.08));
      om = Math.max(-3.2, Math.min(3.2, om)); vr = Math.max(-400, Math.min(400, vr)); // a throw swings, it doesn't launch
      drag = null; wrap.classList.remove('is-dragging');
      if (e.type === 'pointerup' && moved < 6 && quick) flip(); // a click, not a drag
      kick();
    }
    card.addEventListener('pointerup', release);
    card.addEventListener('pointercancel', release);
    onKey(flip);

    layout(); render();
    if ('ResizeObserver' in window) new ResizeObserver(function () { layout(); render(); }).observe(wrap);

    // swing in the first time it scrolls into view, then drift now and then like a badge in a breeze
    var visible = false, swungIn = false, breeze = null;
    function scheduleBreeze() {
      clearTimeout(breeze);
      breeze = setTimeout(function () {
        if (visible && !drag && !document.hidden) { om += (Math.random() < 0.5 ? -1 : 1) * (0.18 + Math.random() * 0.14); kick(); }
        scheduleBreeze();
      }, 3500 + Math.random() * 3500);
    }
    new IntersectionObserver(function (entries) {
      visible = entries[0].intersectionRatio >= 0.35;
      if (visible && !swungIn) {
        swungIn = true; phi = 0.26; om = 0; kick();
        // one small half-turn tease, so it's clear the card turns over
        setTimeout(function () { if (!drag && F === 0) { vspin += 160; kick(); } }, 2600);
      }
      if (visible) scheduleBreeze(); else clearTimeout(breeze);
    }, { threshold: [0, 0.35] }).observe(card);
  })();

  /* ---------- focus trap helper ---------- */
  var FOCUSABLE = 'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])';
  function trap(container, e) {
    var items = $$(FOCUSABLE, container).filter(function (el) { return el.offsetParent !== null; });
    if (!items.length) return;
    var first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  /* ---------- lightbox ---------- */
  var lb = $('#lightbox'), lbImg = $('#lightboxImg'), lbClose = $('#lightboxClose'), lbCap = $('#lightboxCap');
  var lbReturn = null, scrollY = 0;
  function lockScroll() {
    scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = -scrollY + 'px';
    document.body.style.width = '100%';
  }
  function unlockScroll() {
    document.body.style.position = ''; document.body.style.top = ''; document.body.style.width = '';
    window.scrollTo(0, scrollY);
  }
  function openLightbox(img) {
    if (!lb) return;
    lbReturn = img;
    lbImg.src = img.currentSrc || img.src;
    lbImg.alt = img.alt || '';
    if (lbCap) lbCap.textContent = img.alt || 'Click anywhere or press Esc to close';
    lb.hidden = false; lb.classList.add('open');
    requestAnimationFrame(function () { lb.classList.add('show'); });
    lockScroll();
    if (lbClose) lbClose.focus();
  }
  function closeLightbox() {
    if (!lb || !lb.classList.contains('open')) return;
    lb.classList.remove('show');
    unlockScroll();
    setTimeout(function () {
      lb.classList.remove('open'); lb.hidden = true; lbImg.src = '';
      if (lbReturn) { lbReturn.focus({ preventScroll: true }); lbReturn = null; }
    }, reduce ? 0 : 200);
  }
  $$('img.zoomable').forEach(function (img) {
    img.setAttribute('tabindex', '0');
    img.setAttribute('role', 'button');
    img.addEventListener('click', function () { openLightbox(img); });
    img.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(img); }
    });
  });
  if (lb) {
    lb.addEventListener('click', closeLightbox);
    if (lbClose) lbClose.addEventListener('click', function (e) { e.stopPropagation(); closeLightbox(); });
    if (lbImg) lbImg.addEventListener('click', function (e) { e.stopPropagation(); });
  }

  /* ---------- fanned screenshot carousel ---------- */
  (function () {
    var overlay = $('#fanOverlay'), stage = $('#fanStage'), closeBtn = $('#fanClose');
    var trigger = $('#fanTrigger');
    if (!overlay || !stage || !trigger) return;
    var fanReturn = null;
    function buildCards() {
      var imgs = $$('.cs-shot img, .case-shot img, .case-gallery img');
      $$('.fan-card', stage).forEach(function (c) { c.remove(); });
      var n = imgs.length;
      imgs.forEach(function (img, i) {
        var card = document.createElement('div');
        card.className = 'fan-card';
        card.style.zIndex = String(i + 1);
        var inner = document.createElement('img');
        inner.src = img.currentSrc || img.src;
        inner.alt = img.alt || '';
        card.appendChild(inner);
        var mid = (n - 1) / 2;
        var offset = i - mid;
        var angle = offset * 12;
        var x = offset * 74;
        var y = Math.abs(offset) * 20;
        card.style.transform = 'translate(' + x + 'px,' + y + 'px) rotate(' + angle + 'deg)';
        card.addEventListener('click', function () {
          $$('.fan-card', stage).forEach(function (c) { c.style.zIndex = '1'; });
          card.style.zIndex = String(n + 1);
          if (!reduce) gsap.to(card, { y: y - 16, duration: 0.22, ease: 'power2.out', yoyo: true, repeat: 1 });
        });
        stage.appendChild(card);
        if (!reduce) {
          gsap.from(card, { y: 70, opacity: 0, rotate: angle * 2, duration: 0.6, delay: i * 0.08, ease: 'back.out(1.6)' });
        }
      });
    }
    function openFan() {
      fanReturn = document.activeElement;
      buildCards();
      overlay.hidden = false; overlay.classList.add('open');
      requestAnimationFrame(function () { overlay.classList.add('show'); });
      if (closeBtn) closeBtn.focus();
      document.body.style.overflow = 'hidden';
    }
    function closeFan() {
      if (!overlay.classList.contains('open')) return;
      overlay.classList.remove('show');
      document.body.style.overflow = '';
      setTimeout(function () {
        overlay.classList.remove('open'); overlay.hidden = true;
        if (fanReturn && fanReturn.focus) { fanReturn.focus(); fanReturn = null; }
      }, reduce ? 0 : 200);
    }
    trigger.addEventListener('click', openFan);
    if (closeBtn) closeBtn.addEventListener('click', closeFan);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeFan(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('open')) closeFan();
    });
  })();

  /* ---------- command palette ---------- */
  var cmdk = $('#cmdk'), cmdkInput = $('#cmdkInput'), cmdkList = $('#cmdkList');
  var cmdkReturn = null, sel = 0, results = [];
  var ITEMS = [
    { k: 'Go', t: 'Home', href: '/' },
    { k: 'Go', t: 'Work', href: '/work' },
    { k: 'Go', t: 'About', href: '/about' },
    { k: 'Go', t: 'Contact', href: '#contact' },
    { k: 'Case', t: 'Cordelia ARC – React + Supabase platform', href: '/work/cordelia-arc' },
    { k: 'Case', t: 'Kemp Beauty – Klaviyo deliverability rescue', href: '/work/kemp-beauty' },
    { k: 'Case', t: 'Sell Ready AI – Shopify content platform', href: '/work/sell-ready-ai' },
    { k: 'Case', t: 'Orange Ashes – GoHighLevel store', href: '/work/orange-ashes' },
    { k: 'Link', t: 'Email gabb.alisasis@gmail.com', href: 'mailto:gabb.alisasis@gmail.com', ext: true },
    { k: 'Link', t: 'Call +63 966 198 9672', href: 'tel:+639661989672', ext: true },
    { k: 'Link', t: 'Open cordeliaarc.com', href: 'https://cordeliaarc.com', ext: true },
    { k: 'Link', t: 'Open kempbeauty.com', href: 'https://kempbeauty.com', ext: true },
    { k: 'Link', t: 'Open sellready.ai', href: 'https://sellready.ai', ext: true },
    { k: 'Link', t: 'Open shop.orangeashes.com', href: 'https://shop.orangeashes.com', ext: true }
  ];
  function fuzzy(q, s) {
    q = q.toLowerCase(); s = s.toLowerCase();
    if (!q) return true;
    var i = 0;
    for (var j = 0; j < s.length && i < q.length; j++) { if (s[j] === q[i]) i++; }
    return i === q.length;
  }
  function renderCmdk() {
    var q = cmdkInput ? cmdkInput.value.trim() : '';
    results = ITEMS.filter(function (it) { return fuzzy(q, it.k + ' ' + it.t); });
    if (sel >= results.length) sel = 0;
    if (!results.length) {
      cmdkList.innerHTML = '<li class="cmdk-empty" role="presentation">No matches</li>';
      return;
    }
    cmdkList.innerHTML = results.map(function (it, i) {
      return '<li role="option" id="cmdk-o' + i + '" aria-selected="' + (i === sel) + '" data-i="' + i + '">' +
        '<span class="k">' + it.k + '</span><span class="t">' + it.t + '</span></li>';
    }).join('');
    var act = cmdkList.children[sel];
    if (act && act.scrollIntoView) act.scrollIntoView({ block: 'nearest' });
    if (cmdkInput) cmdkInput.setAttribute('aria-activedescendant', 'cmdk-o' + sel);
  }
  function openCmdk() {
    if (!cmdk) return;
    cmdkReturn = document.activeElement;
    cmdk.hidden = false; cmdk.classList.add('open');
    requestAnimationFrame(function () { cmdk.classList.add('show'); });
    if (cmdkInput) { cmdkInput.value = ''; }
    sel = 0; renderCmdk();
    if (cmdkInput) cmdkInput.focus();
  }
  function closeCmdk() {
    if (!cmdk || !cmdk.classList.contains('open')) return;
    cmdk.classList.remove('show');
    setTimeout(function () {
      cmdk.classList.remove('open'); cmdk.hidden = true;
      if (cmdkReturn && cmdkReturn.focus) { cmdkReturn.focus(); cmdkReturn = null; }
    }, reduce ? 0 : 160);
  }
  function runItem(it) {
    if (!it) return;
    closeCmdk();
    if (it.ext) { window.open(it.href, it.href.indexOf('http') === 0 ? '_blank' : '_self', 'noopener'); return; }
    if (it.href.charAt(0) === '#') {
      var tgt = $(it.href);
      if (tgt) tgt.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
      return;
    }
    window.location.assign(it.href);
  }
  var cmdkBtn = $('#cmdkOpen');
  if (cmdkBtn) cmdkBtn.addEventListener('click', openCmdk);
  if (cmdkInput) {
    cmdkInput.addEventListener('input', function () { sel = 0; renderCmdk(); });
    cmdkInput.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(results.length - 1, sel + 1); renderCmdk(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(0, sel - 1); renderCmdk(); }
      else if (e.key === 'Enter') { e.preventDefault(); runItem(results[sel]); }
    });
  }
  if (cmdkList) {
    cmdkList.addEventListener('click', function (e) {
      var li = e.target.closest('li[data-i]');
      if (li) runItem(results[parseInt(li.getAttribute('data-i'), 10)]);
    });
    cmdkList.addEventListener('mousemove', function (e) {
      var li = e.target.closest('li[data-i]');
      if (li) { var i = parseInt(li.getAttribute('data-i'), 10); if (i !== sel) { sel = i; renderCmdk(); } }
    });
  }
  if (cmdk) cmdk.addEventListener('click', function (e) { if (e.target === cmdk) closeCmdk(); });

  /* ---------- global keys ---------- */
  document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      if (cmdk && cmdk.classList.contains('open')) closeCmdk(); else openCmdk();
      return;
    }
    if (e.key === 'Escape') {
      if (lb && lb.classList.contains('open')) { closeLightbox(); return; }
      if (cmdk && cmdk.classList.contains('open')) { closeCmdk(); return; }
      if (navLinks && navLinks.classList.contains('open')) { navToggle.click(); return; }
    }
    if (e.key === 'Tab') {
      if (lb && lb.classList.contains('open')) trap(lb, e);
      else if (cmdk && cmdk.classList.contains('open')) trap(cmdk, e);
    }
  });

  /* ---------- contact form (FormSubmit.co — real POST, so first-time email verification works) ---------- */
  (function () {
    var form = $('#contactForm'); if (!form) return;
    var status = $('#formStatus'), btn = $('.contact-submit', form), nextField = $('#contactNext', form);
    var inbox = form.getAttribute('data-email');
    function say(msg, kind) { status.textContent = msg; status.className = 'form-status' + (kind ? ' is-' + kind : ''); }

    if (/[?&]sent=1\b/.test(window.location.search)) {
      say("Thanks — your message is in. I'll reply personally soon.", 'ok');
      var cleanUrl = window.location.pathname + window.location.hash;
      history.replaceState(null, '', cleanUrl);
    }

    form.addEventListener('submit', function (e) {
      if (!form.checkValidity()) { e.preventDefault(); form.reportValidity(); return; }
      var d = new FormData(form);
      if (d.get('botcheck')) { e.preventDefault(); return; }
      if (nextField) nextField.value = window.location.origin + window.location.pathname + '?sent=1#contact';
      btn.disabled = true; say('Sending…');
      // No preventDefault: this is a real form POST to formsubmit.co, which redirects back via _next.
      // Required so a brand-new inbox can complete FormSubmit's one-time email verification.
    });
  })();
})();
