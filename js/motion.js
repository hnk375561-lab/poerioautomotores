/* Movimiento del sitio (GSAP + ScrollTrigger, sin dependencias extra).
   Un solo sistema: fotos con máscara (clip-path), texto con subida corta, curva expo.out.
   Solo se animan transform, opacity y clip-path. Sin smooth-scroll ni scroll-jacking. */
(function () {
  var root = document.documentElement, g = window.gsap, ST = window.ScrollTrigger;
  if (!g || !ST) { root.classList.remove('m'); return; }
  g.registerPlugin(ST);
  ST.config({ ignoreMobileResize: true });

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
  var header = $('header'), nav = $('nav'), links = $$('nav a'), E = 'expo.out';

  /* ---- Navegación: sombra al scrollear y sección activa (también con reduced-motion) ---- */
  ST.create({ start: 8, end: 'max', toggleClass: { targets: header, className: 's' } });
  var cur = null;
  function active(a) {
    cur = a;
    links.forEach(function (l) { l === a ? l.setAttribute('aria-current', 'location') : l.removeAttribute('aria-current'); });
    if (a && nav.scrollWidth > nav.clientWidth) nav.scrollTo({ left: Math.max(0, a.offsetLeft - 16), behavior: reduce ? 'auto' : 'smooth' });
  }
  links.forEach(function (a) {
    var sec = $(a.getAttribute('href'));
    if (!sec) return;
    ST.create({ trigger: sec, start: 'top 50%', end: 'bottom 50%', onToggle: function (s) { if (s.isActive) active(a); else if (cur === a) active(null); } });
  });

  window.addEventListener('load', function () { ST.refresh(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ST.refresh(); });

  if (reduce) return;

  g.matchMedia().add({ d: '(min-width:900px)', m: '(max-width:899px)' }, function (ctx) {
    var D = ctx.conditions.d, dy = D ? 32 : 18, k = D ? 1 : .8;

    function reveal(t, trig, o) {
      if (!t.length) return; o = o || {};
      g.from(t, { opacity: 0, y: o.y == null ? dy : o.y, duration: .9 * k, stagger: o.s || .08, ease: E, clearProps: 'opacity,transform',
        scrollTrigger: { trigger: trig, start: o.st || 'top 85%', once: true } });
    }
    function split(el) {
      if (!el || el._s) return []; el._s = 1;
      var w = el.textContent.trim().split(/\s+/); el.setAttribute('aria-label', w.join(' '));
      el.innerHTML = w.map(function (x) { return '<span class="wl" aria-hidden="true"><span>' + x + '</span></span>'; }).join(' ');
      return $$('.wl > span', el);
    }
    function words(el, trig) {
      var W = split(el); if (!W.length) return;
      g.from(W, { yPercent: 115, duration: 1.05 * k, stagger: .06, ease: E, clearProps: 'transform', scrollTrigger: { trigger: trig, start: 'top 85%', once: true } });
    }
    function mask(el, trig, st) {
      if (!el) return;
      g.fromTo(el, { clipPath: D ? 'inset(0 0 0 100%)' : 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0 0)', duration: 1.3 * k, ease: 'expo.inOut', clearProps: 'clipPath',
        scrollTrigger: { trigger: trig || el, start: st || 'top 85%', once: true } });
    }

    /* ---- HERO: una sola entrada coordinada (foto, título, bajada, CTAs) ---- */
    if (!root.classList.contains('mi')) {
      var fg = $('.hero figure'), fi = $('.hero figure img'), bg = $('.hero .bgv'), bar = $('.bar'),
        txt = [$('.hero h1'), $('.hero .tx p'), $('.hero .row'), $('.hero .lk')], cap = $('.hero .vcap');
      var HW = split(txt[0]);
      var tl = g.timeline({ defaults: { ease: E }, onComplete: function () {
        root.classList.add('mi');
        g.set(HW, { clearProps: 'transform' });
        ctx.add(function () {
          if (D) g.to([txt[0], txt[1]], { y: -28, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: .5 } });
          g.delayedCall(1.2, function () { $$('header .btn.p, .bar .btn.p').forEach(function (b) { b.classList.add('pulse'); setTimeout(function () { b.classList.remove('pulse'); }, 1800); }); });
        });
        g.set([fg, bg, cap, bar].concat(txt), { clearProps: 'opacity,transform,clipPath' });
        if (!D) g.set(fi, { clearProps: 'transform' });
      } });
      tl.fromTo(fg, { clipPath: D ? 'inset(0 0 0 100%)' : 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0 0)', duration: 1.2 * k, ease: 'expo.inOut' }, 0)
        .fromTo(fi, { scale: D ? 1.12 : 1.08, transformOrigin: '100% 50%' }, { scale: D ? 1.05 : 1, duration: 1.8, ease: 'power3.out' }, 0)
        .fromTo(bg, { opacity: 0, scale: 1.1 }, { opacity: 1, scale: 1, duration: 1.6, ease: 'power2.out' }, 0)
        .set(txt[0], { opacity: 1 }, 0).fromTo(HW, { yPercent: 115 }, { yPercent: 0, duration: 1.1 * k, stagger: .07 }, .1)
        .fromTo(txt[1], { opacity: 0, y: dy }, { opacity: 1, y: 0, duration: .9 * k }, .25)
        .fromTo(txt[2], { opacity: 0, y: dy }, { opacity: 1, y: 0, duration: .8 * k }, .38)
        .fromTo(txt[3], { opacity: 0, y: dy / 2 }, { opacity: 1, y: 0, duration: .7 * k }, .5)
        .fromTo(cap, { opacity: 0 }, { opacity: 1, duration: .8 }, .7);
      if (!D) tl.fromTo(bar, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: .6 }, .3);
    }
    /* Profundidad: solo en escritorio, muy moderada (2%) */
    if (D) g.to('.hero figure img', { yPercent: 2, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: .5 } });

    /* ---- STOCK: unidades con máscara de foto + escala suave; también al filtrar ---- */
    words($('.head h2'), '.head');
    reveal($$('.head .sub, .head .tabs'), '.head');
    var grid = $('#stockGrid');
    var first = true;
    function bind(cards) {
      var soft = !first;
      cards = cards.filter(function (c) { return !c._m && c.getBoundingClientRect().bottom > 0; });
      if (!cards.length) return;
      cards.forEach(function (c) { c._m = 1; });
      g.set(cards, { opacity: 0, y: dy });
      if (!soft) {
        g.set(cards.map(function (c) { return $('.im', c); }), { clipPath: 'inset(0 0 100% 0)' });
        g.set(cards.map(function (c) { return $('.ct', c); }).filter(Boolean), { scale: D ? 1.12 : 1.06 });
      }
      ST.batch(cards, { start: 'top 90%', once: true, batchMax: 3, interval: .08, onEnter: function (b) {
        g.to(b, { opacity: 1, y: 0, duration: (soft ? .5 : .9) * k, stagger: soft ? .05 : .09, ease: E, clearProps: 'opacity,transform' });
        if (soft) return;
        g.to(b.map(function (c) { return $('.im', c); }), { clipPath: 'inset(0 0 0% 0)', duration: 1.1 * k, stagger: .09, ease: 'expo.inOut', clearProps: 'clipPath' });
        g.to(b.map(function (c) { return $('.ct', c); }).filter(Boolean), { scale: 1, duration: 1.5, stagger: .09, ease: 'power3.out', clearProps: 'transform' });
      } });
    }
    bind($$('.car', grid));
    first = false;
    var mo = new MutationObserver(function () {
      ctx.add(function () { bind($$('.car', grid)); });
      requestAnimationFrame(function () { ST.refresh(); });
    });
    mo.observe(grid, { childList: true });

    /* ---- Ficha de unidad: entrada escalonada del contenido (CSS anima el diálogo) ---- */
    var dlg = $('#dlg');
    grid.addEventListener('click', function (e) {
      var c = e.target.closest('.car'); if (!c) return;
      var r = $('.im', c).getBoundingClientRect();
      dlg.style.setProperty('--fx', (r.left + r.width / 2 - innerWidth / 2) + 'px');
      dlg.style.setProperty('--fy', (r.top + r.height / 2 - innerHeight / 2) + 'px');
    }, true);
    var mo2 = new MutationObserver(function () {
      var t = $$('.di > *', dlg);
      if (t.length) g.from(t, { opacity: 0, y: D ? 10 : 6, duration: .5, stagger: .04, ease: E, clearProps: 'opacity,transform', overwrite: 'auto' });
      if ($('.gal', dlg)) g.from($('.gal', dlg), { opacity: 0, duration: .5, ease: 'power2.out', clearProps: 'opacity' });
    });
    mo2.observe(dlg, { childList: true });

    /* ---- Bloques: mismo gesto en todo el sitio ---- */
    words($('.ops .w > div:first-child > h2'), '.ops');
    reveal($$('.ops .w > div:first-child > .sub'), '.ops');
    reveal($$('.op'), '.op', { s: .1, st: 'top 88%' });
    reveal([$('#canjeForm')], '#canjeForm', { st: 'top 90%' });
    reveal($$('.loc .w > div > *'), '.loc', { st: 'top 70%', s: .07 });
    mask($('.loc .ph'));
    if (D) g.fromTo('.loc .ph img', { yPercent: -4, scale: 1.08 }, { yPercent: 4, scale: 1.08, ease: 'none', scrollTrigger: { trigger: '.loc', start: 'top bottom', end: 'bottom top', scrub: .6 } });
    words($('.faq h2'), '.faq');
    reveal($$('.faq details'), '.faq details', { y: 16, s: .06, st: 'top 90%' });
    reveal($$('.fin'), '.fin', { y: 12, st: 'top 95%' });

    /* ---- Progreso de lectura: línea fina bajo el header (solo transform) ---- */
    var pb = $('.pgb') || header.appendChild(Object.assign(document.createElement('i'), { className: 'pgb', ariaHidden: 'true' }));
    g.to(pb, { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: .3 } });

    /* ---- Móvil: el header se guarda al bajar y vuelve al subir ---- */
    if (!D) {
      ST.create({ start: 0, end: 'max', onUpdate: function (s) { header.classList.toggle('h', s.scroll() > 260 && s.direction === 1); } });
      header.addEventListener('focusin', function () { header.classList.remove('h'); });
    }

    return function () { mo.disconnect(); mo2.disconnect(); header.classList.remove('h'); };
  });
})();
