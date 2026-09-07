(function(){
  "use strict";
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $  = function(s,c){ return (c||document).querySelector(s); };
  var $$ = function(s,c){ return Array.prototype.slice.call((c||document).querySelectorAll(s)); };

  /* ---------- year ---------- */
  var yearEl = $('#year'); if(yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- theme ---------- */
  var root = document.documentElement, themeBtn = $('#themeToggle'), themeIcon = $('#themeIcon');
  var SUN = '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>';
  var MOON = '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>';
  function currentTheme(){
    var set = root.getAttribute('data-theme');
    if(set) return set;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  function paintThemeIcon(){
    if(themeIcon) themeIcon.innerHTML = currentTheme()==='light' ? MOON : SUN;
    if(themeBtn) themeBtn.setAttribute('aria-label',
      currentTheme()==='light' ? 'Switch to dark theme' : 'Switch to light theme');
  }
  try{
    var saved = localStorage.getItem('ga-theme');
    if(saved==='light'||saved==='dark') root.setAttribute('data-theme',saved);
  }catch(e){}
  paintThemeIcon();
  if(themeBtn) themeBtn.addEventListener('click', function(){
    var next = currentTheme()==='light' ? 'dark' : 'light';
    root.setAttribute('data-theme', next);
    try{ localStorage.setItem('ga-theme', next); }catch(e){}
    paintThemeIcon();
  });

  /* ---------- mobile nav ---------- */
  var navToggle = $('#navToggle'), navLinks = $('#navLinks');
  if(navToggle && navLinks){
    navToggle.addEventListener('click', function(){
      var open = navLinks.classList.toggle('open');
      navToggle.textContent = open ? 'CLOSE' : 'MENU';
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    $$('a', navLinks).forEach(function(a){
      a.addEventListener('click', function(){
        navLinks.classList.remove('open');
        navToggle.textContent = 'MENU';
        navToggle.setAttribute('aria-expanded','false');
        document.body.style.overflow = '';
      });
    });
  }

  /* ---------- scroll progress + active section ---------- */
  var bar = $('#scrollProgress');
  var sections = $$('main section[id]');
  var navMap = {};
  $$('.nav-links a[href^="#"]').forEach(function(a){ navMap[a.getAttribute('href').slice(1)] = a; });
  var ticking = false;
  function onScroll(){
    if(ticking) return; ticking = true;
    requestAnimationFrame(function(){
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      if(bar) bar.style.transform = 'scaleX(' + (max>0 ? Math.min(1, h.scrollTop/max) : 0) + ')';
      var mark = h.scrollTop + 140, cur = null;
      sections.forEach(function(s){ if(s.offsetTop <= mark) cur = s.id; });
      for(var k in navMap){ navMap[k].classList.toggle('active', k===cur); }
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, {passive:true});
  window.addEventListener('resize', onScroll, {passive:true});
  onScroll();

  /* ---------- reveal ---------- */
  var revealEls = $$('.reveal');
  if('IntersectionObserver' in window && !reduce){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if(en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, {threshold:0.12});
    revealEls.forEach(function(el){ io.observe(el); });
  } else {
    revealEls.forEach(function(el){ el.classList.add('in'); });
  }

  /* ---------- stat count-up ---------- */
  var stats = $$('[data-count]');
  if('IntersectionObserver' in window && !reduce && stats.length){
    var sio = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if(!en.isIntersecting) return;
        var el = en.target; sio.unobserve(el);
        var target = parseInt(el.getAttribute('data-count'),10);
        var suffix = el.getAttribute('data-suffix') || '';
        var start = performance.now(), dur = 1400;
        (function step(now){
          var p = Math.min(1,(now-start)/dur);
          var eased = 1 - Math.pow(1-p, 3);
          el.textContent = Math.round(target*eased).toLocaleString('en-US') + suffix;
          if(p<1) requestAnimationFrame(step);
        })(start);
      });
    }, {threshold:0.5});
    stats.forEach(function(el){ sio.observe(el); });
  }

  /* ---------- hero canvas ---------- */
  var flow = $('#flow');
  if(flow){
    var nodes = $$('.flow-node', flow);
    nodes.forEach(function(btn){
      btn.addEventListener('click', function(){
        var panel = document.getElementById(btn.getAttribute('aria-controls'));
        var open = btn.getAttribute('aria-expanded')==='true';
        nodes.forEach(function(o){
          if(o===btn) return;
          o.setAttribute('aria-expanded','false');
          var p = document.getElementById(o.getAttribute('aria-controls'));
          if(p) p.classList.remove('open');
        });
        btn.setAttribute('aria-expanded', open ? 'false' : 'true');
        if(panel) panel.classList.toggle('open', !open);
      });
      btn.addEventListener('keydown', function(e){
        var i = nodes.indexOf(btn);
        if(e.key==='ArrowDown'){ e.preventDefault(); nodes[Math.min(nodes.length-1,i+1)].focus(); }
        if(e.key==='ArrowUp'){ e.preventDefault(); nodes[Math.max(0,i-1)].focus(); }
      });
    });

    var runBtn = $('#canvasRun');
    if(runBtn) runBtn.addEventListener('click', function(){
      runBtn.setAttribute('data-running','1');
      var seq = $$('.flow-node, .flow-connector', flow);
      seq.forEach(function(el){ el.classList.remove('firing'); });

      // reduced motion: mark the whole path at once rather than doing nothing
      if(reduce){
        seq.forEach(function(el){ el.classList.add('firing'); });
        setTimeout(function(){
          seq.forEach(function(el){ el.classList.remove('firing'); });
          runBtn.removeAttribute('data-running');
        }, 900);
        return;
      }

      var i = 0;
      (function tick(){
        if(i>0) seq[i-1].classList.remove('firing');
        if(i>=seq.length){ runBtn.removeAttribute('data-running'); return; }
        seq[i].classList.add('firing');
        i++;
        setTimeout(tick, 420);
      })();
    });
  }

  /* ---------- case study diagrams: animate when scrolled into view ---------- */
  var diagrams = $$('.diagram');
  if('IntersectionObserver' in window && !reduce && diagrams.length){
    var dio = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if(en.isIntersecting){ en.target.classList.add('animate'); dio.unobserve(en.target); }
      });
    }, {threshold:0.3});
    diagrams.forEach(function(svg){ dio.observe(svg); });
  } else {
    diagrams.forEach(function(svg){ svg.classList.add('animate'); });
  }

  /* ---------- project filter (FLIP) ---------- */
  var grid = $('#projectsGrid'), chips = $$('.chip'), statusEl = $('#filterStatus');
  if(grid && chips.length){
    var cards = $$('.project-card', grid);
    function applyFilter(f, push){
      var first = cards.map(function(c){ return c.getBoundingClientRect(); });
      var shown = 0;
      cards.forEach(function(c){
        var tags = (c.getAttribute('data-tags')||'').split(/\s+/);
        var show = (f==='all') || tags.indexOf(f)!==-1;
        c.hidden = !show;
        if(show) shown++;
      });
      chips.forEach(function(ch){
        ch.setAttribute('aria-pressed', ch.getAttribute('data-filter')===f ? 'true':'false');
      });
      if(statusEl){
        var lbl = 'Showing ' + shown + ' project' + (shown===1?'':'s');
        statusEl.textContent = f==='all' ? 'Showing all ' + shown + ' projects' : lbl + ' in this category';
      }
      if(!reduce && typeof cards[0].animate === 'function'){
        cards.forEach(function(c,i){
          if(c.hidden) return;
          var last = c.getBoundingClientRect(), fr = first[i];
          if(!fr || fr.width===0){
            c.animate([{opacity:0, transform:'scale(.96)'},{opacity:1, transform:'none'}],
                      {duration:260, easing:'ease'});
            return;
          }
          var dx = fr.left-last.left, dy = fr.top-last.top;
          if(dx || dy){
            c.animate([{transform:'translate('+dx+'px,'+dy+'px)'},{transform:'none'}],
                      {duration:300, easing:'cubic-bezier(.2,.8,.2,1)'});
          }
        });
      }
      if(push){
        try{
          if(f==='all') history.replaceState(null,'', location.pathname + location.search + '#projects');
          else history.replaceState(null,'', location.pathname + location.search + '#projects=' + f);
        }catch(e){}
      }
    }
    chips.forEach(function(ch){
      ch.addEventListener('click', function(){ applyFilter(ch.getAttribute('data-filter'), true); });
    });
  }

  /* ---------- focus trap helper ---------- */
  var FOCUSABLE = 'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])';
  function trap(container, e){
    var items = $$(FOCUSABLE, container).filter(function(el){ return el.offsetParent !== null; });
    if(!items.length) return;
    var first = items[0], last = items[items.length-1];
    if(e.shiftKey && document.activeElement===first){ e.preventDefault(); last.focus(); }
    else if(!e.shiftKey && document.activeElement===last){ e.preventDefault(); first.focus(); }
  }

  /* ---------- lightbox ---------- */
  var lb = $('#lightbox'), lbImg = $('#lightboxImg'), lbClose = $('#lightboxClose'), lbCap = $('#lightboxCap');
  var lbReturn = null, scrollY = 0;
  function lockScroll(){
    scrollY = window.scrollY;
    document.body.style.position='fixed';
    document.body.style.top = -scrollY+'px';
    document.body.style.width='100%';
  }
  function unlockScroll(){
    document.body.style.position=''; document.body.style.top=''; document.body.style.width='';
    window.scrollTo(0, scrollY);
  }
  function openLightbox(img){
    if(!lb) return;
    lbReturn = img;
    lbImg.src = img.currentSrc || img.src;
    lbImg.alt = img.alt || '';
    if(lbCap) lbCap.textContent = img.alt || 'Click anywhere or press Esc to close';
    lb.hidden = false; lb.classList.add('open');
    requestAnimationFrame(function(){ lb.classList.add('show'); });
    lockScroll();
    if(lbClose) lbClose.focus();
  }
  function closeLightbox(){
    if(!lb || !lb.classList.contains('open')) return;
    lb.classList.remove('show');
    unlockScroll();
    setTimeout(function(){
      lb.classList.remove('open'); lb.hidden = true; lbImg.src='';
      if(lbReturn){ lbReturn.focus({preventScroll:true}); lbReturn=null; }
    }, reduce ? 0 : 200);
  }
  $$('img.zoomable').forEach(function(img){
    img.setAttribute('tabindex','0');
    img.setAttribute('role','button');
    img.addEventListener('click', function(){ openLightbox(img); });
    img.addEventListener('keydown', function(e){
      if(e.key==='Enter'||e.key===' '){ e.preventDefault(); openLightbox(img); }
    });
  });
  if(lb){
    lb.addEventListener('click', closeLightbox);
    if(lbClose) lbClose.addEventListener('click', function(e){ e.stopPropagation(); closeLightbox(); });
    if(lbImg) lbImg.addEventListener('click', function(e){ e.stopPropagation(); });
  }

  /* ---------- command palette ---------- */
  var cmdk = $('#cmdk'), cmdkInput = $('#cmdkInput'), cmdkList = $('#cmdkList');
  var cmdkReturn = null, sel = 0, results = [];
  var ITEMS = [
    {k:'Go', t:'Home',    href:'/'},
    {k:'Go', t:'Work',    href:'/work'},
    {k:'Go', t:'About',   href:'/about'},
    {k:'Go', t:'Contact', href:'#contact'},
    {k:'Case', t:'Cordelia ARC – React + Supabase platform',    href:'/work/cordelia-arc'},
    {k:'Case', t:'Kemp Beauty – Klaviyo deliverability rescue', href:'/work/kemp-beauty'},
    {k:'Case', t:'Sell Ready AI – Shopify content platform',    href:'/work/sell-ready-ai'},
    {k:'Case', t:'Orange Ashes – GoHighLevel store',            href:'/work/orange-ashes'},
    {k:'Link', t:'Email gabb.alisasis@gmail.com', href:'mailto:gabb.alisasis@gmail.com', ext:true},
    {k:'Link', t:'Call +63 966 198 9672',         href:'tel:+639661989672', ext:true},
    {k:'Link', t:'Open cordeliaarc.com',          href:'https://cordeliaarc.com', ext:true},
    {k:'Link', t:'Open kempbeauty.com',           href:'https://kempbeauty.com', ext:true},
    {k:'Link', t:'Open sellready.ai',             href:'https://sellready.ai', ext:true},
    {k:'Link', t:'Open shop.orangeashes.com',     href:'https://shop.orangeashes.com', ext:true},
    {k:'Theme', t:'Toggle light / dark theme',    action:'theme'}
  ];
  function fuzzy(q, s){
    q = q.toLowerCase(); s = s.toLowerCase();
    if(!q) return true;
    var i = 0;
    for(var j=0; j<s.length && i<q.length; j++){ if(s[j]===q[i]) i++; }
    return i===q.length;
  }
  function renderCmdk(){
    var q = cmdkInput ? cmdkInput.value.trim() : '';
    results = ITEMS.filter(function(it){ return fuzzy(q, it.k + ' ' + it.t); });
    if(sel >= results.length) sel = 0;
    if(!results.length){
      cmdkList.innerHTML = '<li class="cmdk-empty" role="presentation">No matches</li>';
      return;
    }
    cmdkList.innerHTML = results.map(function(it,i){
      return '<li role="option" id="cmdk-o'+i+'" aria-selected="'+(i===sel)+'" data-i="'+i+'">' +
             '<span class="k">'+it.k+'</span><span class="t">'+it.t+'</span></li>';
    }).join('');
    var act = cmdkList.children[sel];
    if(act && act.scrollIntoView) act.scrollIntoView({block:'nearest'});
    if(cmdkInput) cmdkInput.setAttribute('aria-activedescendant','cmdk-o'+sel);
  }
  function openCmdk(){
    if(!cmdk) return;
    cmdkReturn = document.activeElement;
    cmdk.hidden = false; cmdk.classList.add('open');
    requestAnimationFrame(function(){ cmdk.classList.add('show'); });
    if(cmdkInput){ cmdkInput.value=''; }
    sel = 0; renderCmdk();
    if(cmdkInput) cmdkInput.focus();
  }
  function closeCmdk(){
    if(!cmdk || !cmdk.classList.contains('open')) return;
    cmdk.classList.remove('show');
    setTimeout(function(){
      cmdk.classList.remove('open'); cmdk.hidden = true;
      if(cmdkReturn && cmdkReturn.focus){ cmdkReturn.focus(); cmdkReturn=null; }
    }, reduce ? 0 : 160);
  }
  function runItem(it){
    if(!it) return;
    if(it.action==='theme'){ closeCmdk(); if(themeBtn) themeBtn.click(); return; }
    closeCmdk();
    if(it.ext){ window.open(it.href, it.href.indexOf('http')===0 ? '_blank' : '_self', 'noopener'); return; }
    if(it.href.charAt(0)==='#'){
      var tgt = $(it.href);
      if(tgt) tgt.scrollIntoView({behavior: reduce?'auto':'smooth'});
      return;
    }
    window.location.assign(it.href);
  }
  var cmdkBtn = $('#cmdkOpen');
  if(cmdkBtn) cmdkBtn.addEventListener('click', openCmdk);
  if(cmdkInput){
    cmdkInput.addEventListener('input', function(){ sel=0; renderCmdk(); });
    cmdkInput.addEventListener('keydown', function(e){
      if(e.key==='ArrowDown'){ e.preventDefault(); sel=Math.min(results.length-1, sel+1); renderCmdk(); }
      else if(e.key==='ArrowUp'){ e.preventDefault(); sel=Math.max(0, sel-1); renderCmdk(); }
      else if(e.key==='Enter'){ e.preventDefault(); runItem(results[sel]); }
    });
  }
  if(cmdkList){
    cmdkList.addEventListener('click', function(e){
      var li = e.target.closest('li[data-i]');
      if(li) runItem(results[parseInt(li.getAttribute('data-i'),10)]);
    });
    cmdkList.addEventListener('mousemove', function(e){
      var li = e.target.closest('li[data-i]');
      if(li){ var i=parseInt(li.getAttribute('data-i'),10); if(i!==sel){ sel=i; renderCmdk(); } }
    });
  }
  if(cmdk) cmdk.addEventListener('click', function(e){ if(e.target===cmdk) closeCmdk(); });

  /* ---------- global keys ---------- */
  document.addEventListener('keydown', function(e){
    if((e.metaKey||e.ctrlKey) && (e.key==='k'||e.key==='K')){
      e.preventDefault();
      if(cmdk && cmdk.classList.contains('open')) closeCmdk(); else openCmdk();
      return;
    }
    if(e.key==='Escape'){
      if(lb && lb.classList.contains('open')){ closeLightbox(); return; }
      if(cmdk && cmdk.classList.contains('open')){ closeCmdk(); return; }
      if(navLinks && navLinks.classList.contains('open')){ navToggle.click(); return; }
    }
    if(e.key==='Tab'){
      if(lb && lb.classList.contains('open')) trap(lb, e);
      else if(cmdk && cmdk.classList.contains('open')) trap(cmdk, e);
    }
  });

  /* ---------- magnetic buttons + cursor glow ---------- */
  if(!reduce && window.matchMedia('(pointer:fine)').matches){
    $$('.magnetic').forEach(function(el){
      el.addEventListener('mousemove', function(e){
        var r = el.getBoundingClientRect();
        var x = e.clientX - r.left - r.width/2;
        var y = e.clientY - r.top - r.height/2;
        el.style.transform = 'translate(' + (x*0.16) + 'px,' + (y*0.22) + 'px)';
      });
      el.addEventListener('mouseleave', function(){ el.style.transform=''; });
    });
    var glow = $('#glow');
    if(glow){
      window.addEventListener('mousemove', function(e){
        glow.classList.add('on');
        glow.style.left = e.clientX+'px';
        glow.style.top  = e.clientY+'px';
      }, {passive:true});
    }
  }
})();
