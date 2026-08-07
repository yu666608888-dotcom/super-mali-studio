(function(){
  var nav = document.getElementById('nav');
  var navLinks = document.getElementById('navLinks');
  var navToggle = document.getElementById('navToggle');
  var progress = document.getElementById('scrollProgress');
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  if (navToggle) {
    navToggle.addEventListener('click', function(){
      var open = navLinks.classList.toggle('open');
      navToggle.classList.toggle('open', open);
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      navToggle.setAttribute('aria-label', open ? '关闭菜单' : '打开菜单');
    });
    navLinks.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(){
        navLinks.classList.remove('open');
        navToggle.classList.remove('open');
        navToggle.setAttribute('aria-expanded','false');
      });
    });
  }

  function onScroll(){
    var st = window.scrollY || document.documentElement.scrollTop;
    if (nav) nav.classList.toggle('scrolled', st > 10);
    if (progress) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = 'scaleX(' + (max > 0 ? st / max : 0) + ')';
    }
  }
  window.addEventListener('scroll', onScroll, { passive:true });
  onScroll();

  var revealObserver = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if (entry.isIntersecting){
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: .12, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach(function(el){ revealObserver.observe(el); });
  function revealInView(){
    var vh = window.innerHeight;
    document.querySelectorAll('.reveal:not(.visible)').forEach(function(el){
      var r = el.getBoundingClientRect();
      if (r.top < vh * 1.05) el.classList.add('visible');
    });
  }
  window.addEventListener('load', revealInView);
  revealInView();

  function animateCount(el){
    var target = parseFloat(el.getAttribute('data-target'));
    var duration = 1400;
    var start = null;
    function tick(now){
      if (!start) start = now;
      var p = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  var countObserver = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if (entry.isIntersecting){
        entry.target.querySelectorAll('.stat-num[data-target]').forEach(animateCount);
        countObserver.unobserve(entry.target);
      }
    });
  }, { threshold: .4 });
  var stats = document.getElementById('stats');
  if (stats) countObserver.observe(stats);

  // 品牌案例筛选
  var tabs = document.querySelectorAll('.filter-tab');
  var cards = document.querySelectorAll('.case-card');
  if (tabs.length && cards.length) {
    function applyFilter(cat){
      tabs.forEach(function(t){
        t.classList.toggle('active', t.getAttribute('data-filter') === cat);
      });
      cards.forEach(function(c){
        c.style.display = (cat === 'all' || c.getAttribute('data-cat') === cat) ? '' : 'none';
      });
      var counter = document.getElementById('caseCount');
      if (counter) {
        var n = 0;
        cards.forEach(function(c){ if (c.style.display !== 'none') n++; });
        counter.textContent = n + (document.documentElement.lang === 'en' ? ' cases' : ' 个案例');
      }
    }
    tabs.forEach(function(t){
      t.addEventListener('click', function(){
        applyFilter(t.getAttribute('data-filter'));
        var url = new URL(window.location.href);
        var cat = t.getAttribute('data-filter');
        if (cat === 'all') url.searchParams.delete('cat');
        else url.searchParams.set('cat', cat);
        history.replaceState(null, '', url);
      });
    });
    var params = new URLSearchParams(window.location.search);
    var initCat = params.get('cat');
    if (initCat && ['music','variety','esports','art'].indexOf(initCat) >= 0) applyFilter(initCat);
  }
})();

/* 中英文切换 */
(function(){
  var toggle = document.getElementById('langToggle');
  var saved = null;
  try { saved = localStorage.getItem('site-lang'); } catch(e){}
  var params = new URLSearchParams(window.location.search);
  var initLang = params.get('lang') || saved || 'zh-CN';
  if (initLang !== 'en') initLang = 'zh-CN';

  function decodeHTML(s){
    var t = document.createElement('textarea');
    t.innerHTML = s;
    return t.value;
  }

  function applyLang(lang){
    var isEn = lang === 'en';
    document.documentElement.lang = isEn ? 'en' : 'zh-CN';
    document.querySelectorAll('[data-en]').forEach(function(el){
      if (isEn){
        if (!el.dataset.zh) el.dataset.zh = el.innerHTML;
        el.innerHTML = decodeHTML(el.dataset.en);
      } else if (el.dataset.zh){
        el.innerHTML = el.dataset.zh;
      }
    });
    var t = document.querySelector('title');
    if (t && t.dataset.en){
      if (!t.dataset.zh) t.dataset.zh = t.textContent;
      t.textContent = isEn ? decodeHTML(t.dataset.en) : t.dataset.zh;
    }
    if (toggle){
      toggle.textContent = isEn ? '中文' : 'EN';
      toggle.setAttribute('aria-label', isEn ? 'Switch to Chinese' : '切换为英文');
    }
    try { localStorage.setItem('site-lang', lang); } catch(e){}
  }

  if (toggle){
    toggle.addEventListener('click', function(){
      applyLang(document.documentElement.lang === 'zh-CN' ? 'en' : 'zh-CN');
    });
  }
  applyLang(initLang);
})();

/* 光标光波残影 */
(function(){
  var canvas = document.getElementById('cursorCanvas');
  if (!canvas) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var ctx = canvas.getContext('2d');
  if (!ctx) return;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var w = 0, h = 0;

  function resize(){
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  // 与页面一致的单一强调色（靛蓝紫）+ 白色
  var palette = ['#7170ff', '#828fff', '#7170ff', '#ffffff', '#7170ff'];
  var rgbs = palette.map(function(h){
    var m = h.match(/^#?([0-9a-f]{6})$/i);
    return m ? {
      r: parseInt(m[1].slice(0, 2), 16),
      g: parseInt(m[1].slice(2, 4), 16),
      b: parseInt(m[1].slice(4, 6), 16)
    } : { r: 199, g: 184, b: 245 };
  });
  var colorIdx = 0;

  var points = [];
  var rings = [];
  var last = null;

  function spawn(x, y, spread, count){
    for (var i = 0; i < count; i++){
      points.push({
        x: x, y: y,
        vx: (Math.random() - 0.5) * spread,
        vy: (Math.random() - 0.5) * spread,
        age: 0,
        life: 24 + Math.random() * 22,
        r: 1.1 + Math.random() * 2.4,
        col: Math.random() < 0.3 ? -1 : Math.floor(Math.random() * rgbs.length)
      });
    }
    if (points.length > 260) points.splice(0, points.length - 260);
  }

  window.addEventListener('pointermove', function(e){
    spawn(e.clientX, e.clientY, 0.9, 2);
    if (!last || Math.abs(e.clientX - last.x) + Math.abs(e.clientY - last.y) > 42){
      rings.push({ x: e.clientX, y: e.clientY, r: 2, life: 34, col: colorIdx++ % rgbs.length });
      if (rings.length > 14) rings.shift();
      last = { x: e.clientX, y: e.clientY };
    }
  }, { passive: true });

  window.addEventListener('pointerdown', function(e){
    spawn(e.clientX, e.clientY, 1.8, 12);
    rings.push({ x: e.clientX, y: e.clientY, r: 2, life: 46, col: colorIdx++ % rgbs.length });
  }, { passive: true });

  function draw(){
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';
    var i, p, rg, t, a;
    for (i = rings.length - 1; i >= 0; i--){
      rg = rings[i];
      rg.life--;
      rg.r += 1.7;
      if (rg.life <= 0){ rings.splice(i, 1); continue; }
      a = (rg.life / 34) * 0.5;
      ctx.beginPath();
      ctx.arc(rg.x, rg.y, rg.r, 0, Math.PI * 2);
      var rc = rgbs[rg.col];
      ctx.strokeStyle = 'rgba(' + rc.r + ',' + rc.g + ',' + rc.b + ',' + a + ')';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    for (i = points.length - 1; i >= 0; i--){
      p = points[i];
      p.age++;
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.955;
      p.vy *= 0.955;
      if (p.age > p.life){ points.splice(i, 1); continue; }
      t = 1 - p.age / p.life;
      a = t * 0.55;
      var c = p.col === -1 ? { r: 255, g: 255, b: 255 } : rgbs[p.col];
      var col = c.r + ',' + c.g + ',' + c.b;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(p.r * t, 0.2), 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + col + ',' + a + ')';
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
})();
