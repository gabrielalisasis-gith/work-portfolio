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

  /* ---------- theme ---------- */
  var root = document.documentElement, themeBtn = $('#themeToggle'), themeIcon = $('#themeIcon');
  var SUN = '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>';
  var MOON = '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>';
  function currentTheme() {
    var set = root.getAttribute('data-theme');
    if (set) return set;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  function paintThemeIcon() {
    if (themeIcon) themeIcon.innerHTML = currentTheme() === 'light' ? MOON : SUN;
    if (themeBtn) themeBtn.setAttribute('aria-label',
      currentTheme() === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
  }
  try {
    var saved = localStorage.getItem('ga-theme');
    if (saved === 'light' || saved === 'dark') root.setAttribute('data-theme', saved);
  } catch (e) { }
  paintThemeIcon();
  if (themeBtn) themeBtn.addEventListener('click', function () {
    var next = currentTheme() === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('ga-theme', next); } catch (e) { }
    paintThemeIcon();
  });

  /* ---------- mobile nav ---------- */
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

  /* ---------- hero: live automation demo ---------- */
  (function () {
    var demo = $('#demo'); if (!demo) return;
    var steps = $$('.demo-step', demo);
    var toastSms = $('.demo-toast--sms', demo), toastBook = $('.demo-toast--booking', demo);
    var countEl = $('#demoCount');
    var leads = [['Sarah M.', 'Sarah'], ['James T.', 'James'], ['Priya K.', 'Priya'], ['Marco D.', 'Marco']];
    var lead = 0, count = 1284, active = -1, timer = null, running = false;

    function paint(n) {
      steps.forEach(function (s, i) {
        s.classList.toggle('is-done', i < n);
        s.classList.toggle('is-active', i === n);
      });
      demo.style.setProperty('--progress', Math.max(0, Math.min(1, n / (steps.length - 1))));
      toastSms.classList.toggle('show', n > 2);
      toastBook.classList.toggle('show', n > 3);
    }
    if (reduce) { paint(steps.length); return; }

    function tick() {
      active++;
      if (active > steps.length + 2) {
        active = -1; lead = (lead + 1) % leads.length; count++;
        demo.classList.add('is-resetting');
        timer = setTimeout(function () {
          $$('[data-name]', demo).forEach(function (el) { el.textContent = leads[lead][0]; });
          $$('[data-first]', demo).forEach(function (el) { el.textContent = leads[lead][1]; });
          if (countEl) countEl.textContent = count.toLocaleString('en-US');
          paint(-1);
          demo.classList.remove('is-resetting');
          timer = setTimeout(tick, 500);
        }, 450);
        return;
      }
      paint(active);
      timer = setTimeout(tick, 1100);
    }
    function start() { if (!running) { running = true; timer = setTimeout(tick, 700); } }
    function stop() { running = false; clearTimeout(timer); }
    paint(-1);
    new IntersectionObserver(function (en) { en[0].isIntersecting ? start() : stop(); }).observe(demo);
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
    { k: 'Link', t: 'Open shop.orangeashes.com', href: 'https://shop.orangeashes.com', ext: true },
    { k: 'Theme', t: 'Toggle light / dark theme', action: 'theme' }
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
    if (it.action === 'theme') { closeCmdk(); if (themeBtn) themeBtn.click(); return; }
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
