/* Movimiento del sitio · GSAP + ScrollTrigger (sin dependencias extra, sin CDN).
   SISTEMA (un gesto por tipo de elemento, para que se sienta ritmo y no efectos sueltos):
   · Fotos     → se revelan con máscara (clip-path) + asentado de escala 1.1 → 1
   · Texto     → títulos por palabra; bajadas y bloques con subida corta
   · Curva     → expo.out en todo lo que entra; expo.inOut solo en máscaras
   · Conversión→ WhatsApp/Llamar siempre accesibles; el pulso ocurre una sola vez
   Máscaras: siempre inset() de 4 valores en % (GSAP no interpola 0 con 0% y la máscara saltaría al final).
   Solo se animan transform, opacity y clip-path. Sin smooth-scroll ni scroll-jacking.
   prefers-reduced-motion: no se registra ninguna animación (queda la navegación activa, sin movimiento). */
(function () {
  var root = document.documentElement, g = window.gsap, ST = window.ScrollTrigger;
  if (!g || !ST) { root.classList.remove('m'); return; }
  g.registerPlugin(ST);
  ST.config({ ignoreMobileResize: true });

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
  var header = $('header'), nav = $('nav'), links = $$('nav a'), E = 'expo.out';

  /* ---------- Navegación: sombra, sección activa, indicador deslizante ---------- */
  ST.create({ start: 8, end: 'max', toggleClass: { targets: header, className: 's' } });

  var ind = document.createElement('i');
  ind.className = 'ni'; ind.setAttribute('aria-hidden', 'true'); nav.appendChild(ind);
  var shown = false, cur = null;
  function place(a, snap) {
    g.killTweensOf(ind);
    if (!a) { shown = false; g.to(ind, { opacity: 0, duration: reduce ? 0 : .3 }); return; }
    var to = { x: a.offsetLeft, scaleX: a.offsetWidth / 100 };
    if (!shown || snap || reduce) { g.set(ind, { opacity: 1, x: to.x, scaleX: to.scaleX }); shown = true; }
    else g.to(ind, { x: to.x, scaleX: to.scaleX, opacity: 1, duration: .7, ease: E });
  }
  function active(a) {
    cur = a;
    links.forEach(function (l) { l === a ? l.setAttribute('aria-current', 'location') : l.removeAttribute('aria-current'); });
    place(a);
    if (a && nav.scrollWidth > nav.clientWidth) nav.scrollTo({ left: Math.max(0, a.offsetLeft - 16), behavior: reduce ? 'auto' : 'smooth' });
  }
  links.forEach(function (a) {
    var sec = $(a.getAttribute('href'));
    if (!sec) return;
    ST.create({ trigger: sec, start: 'top 50%', end: 'bottom 50%', onToggle: function (s) { if (s.isActive) active(a); else if (cur === a) active(null); } });
  });

  /* Móvil: la tira de navegación insinúa que se desliza (degradé en el borde con más contenido) */
  function edge() {
    var max = nav.scrollWidth - nav.clientWidth;
    nav.classList.toggle('nl', max > 4 && nav.scrollLeft > 4);
    nav.classList.toggle('nr', max > 4 && nav.scrollLeft < max - 4);
  }
  nav.addEventListener('scroll', edge, { passive: true });
  ST.addEventListener('refresh', function () { if (cur) place(cur, true); edge(); });
  edge();

  window.addEventListener('load', function () { ST.refresh(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ST.refresh(); });

  if (reduce) return;

  g.matchMedia().add({ d: '(min-width:900px)', m: '(max-width:899px)' }, function (ctx) {
    var D = ctx.conditions.d, dy = D ? 32 : 18, k = D ? 1 : .8;
    var cleanups = [];

    /* ---------- Helpers del sistema ---------- */
    function reveal(t, trig, o) {
      if (!t.length) return; o = o || {};
      if (o.nt) g.set(t, { transition: 'none' });   /* si el elemento tiene transition CSS sobre transform, GSAP no debe pelear con ella */
      g.from(t, { opacity: 0, y: o.y == null ? dy : o.y, duration: .9 * k, stagger: o.s || .08, ease: E, clearProps: 'opacity,transform' + (o.nt ? ',transition' : ''),
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
    /* Foto editorial: máscara + escala asentándose. Nunca deforma: la escala es uniforme y siempre baja a 1 */
    function photos(boxes, trig, o) {
      boxes = boxes.filter(Boolean); if (!boxes.length) return; o = o || {};
      var imgs = boxes.map(function (b) { return $('img', b); }).filter(Boolean), s = o.s || .1;
      var st = { trigger: trig, start: o.st || 'top 85%', once: true };
      g.set(imgs, { transition: 'none' });
      g.fromTo(boxes, { clipPath: o.from || 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.1 * k, stagger: s, ease: 'expo.inOut', clearProps: 'clipPath', scrollTrigger: st });
      if (!o.still) g.fromTo(imgs, { scale: 1.1 }, { scale: 1, duration: 1.5, stagger: s, ease: 'power3.out', clearProps: 'transform,transition', scrollTrigger: st });
    }
    function pulse(sel) {
      $$(sel).forEach(function (b) { b.classList.add('pulse'); setTimeout(function () { b.classList.remove('pulse'); }, 1800); });
    }

    /* ---------- HERO: una sola entrada coordinada ----------
       0.0 foto (máscara desde la costura con el texto) · 0.25 título por palabra · 0.4 bajada · 0.5 CTAs (usables en <1 s) · 0.62 enlace · 0.9 epígrafe */
    if (!root.classList.contains('mi')) {
      var fg = $('.hero figure'), fi = $('.hero figure img'), bg = $('.hero .bgv'),
        txt = [$('.hero h1'), $('.hero .tx p'), $('.hero .row'), $('.hero .lk')], cap = $('.hero .vcap');
      var HW = split(txt[0]);
      var tl = g.timeline({ defaults: { ease: E }, onComplete: function () {
        root.classList.add('mi');
        g.set(HW, { clearProps: 'transform' });
        g.set([fg, fi, bg, cap].concat(txt), { clearProps: 'opacity,transform,clipPath' });
        ctx.add(function () {
          if (D) {
            /* Salida del hero: profundidad muy moderada (texto 28px, foto 2%) */
            g.to([txt[0], txt[1]], { y: -28, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: .5 } });
            g.to(fi, { yPercent: 2, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: .5 } });
            g.delayedCall(.9, function () { pulse('header .btn.p'); });
          }
        });
      } });
      tl.fromTo(fg, { clipPath: D ? 'inset(0% 100% 0% 0%)' : 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'expo.inOut' }, 0)
        .fromTo(fi, { scale: 1.12 }, { scale: 1, duration: 1.9, ease: 'power3.out' }, 0)
        .fromTo(bg, { opacity: 0, scale: 1.08 }, { opacity: 1, scale: 1, duration: 1.8, ease: 'power2.out' }, .1)
        .set(txt[0], { opacity: 1 }, 0).fromTo(HW, { yPercent: 115 }, { yPercent: 0, duration: 1.1 * k, stagger: .07 }, .25)
        .fromTo(txt[1], { opacity: 0, y: dy }, { opacity: 1, y: 0, duration: .8 * k }, .4)
        .fromTo(txt[2], { opacity: 0, y: dy }, { opacity: 1, y: 0, duration: .7 * k }, .5)
        .fromTo(txt[3], { opacity: 0, y: dy / 2 }, { opacity: 1, y: 0, duration: .6 * k }, .62)
        .fromTo(cap, { opacity: 0 }, { opacity: 1, duration: .8 }, .9);
    }

    /* ---------- STOCK: el corazón comercial ---------- */
    words($('.head h2'), '.head');
    reveal($$('.head .sub, .head .tabs'), '.head');

    /* Filtros: una sola línea que se desliza entre opciones (mismo lenguaje que la navegación) */
    var tabs = $('.tabs'), ti = null;
    if (tabs) {
      ti = document.createElement('i'); ti.className = 'ti'; ti.setAttribute('aria-hidden', 'true'); tabs.appendChild(ti);
      root.classList.add('mt');
      var tShown = false;
      var placeT = function (snap) {
        var c = $('.chip[aria-pressed="true"]', tabs); if (!c) return;
        var to = { x: c.offsetLeft, y: c.offsetTop + c.offsetHeight - 2, scaleX: c.offsetWidth / 100 };
        g.killTweensOf(ti);
        if (!tShown || snap) { g.set(ti, to); g.set(ti, { opacity: 1 }); tShown = true; }
        else g.to(ti, { x: to.x, y: to.y, scaleX: to.scaleX, duration: .6, ease: E });
      };
      tabs.addEventListener('click', function () { if (tShown) placeT(); });
      var onRef = function () { placeT(true); };
      ST.addEventListener('refresh', onRef);
      requestAnimationFrame(function () { placeT(true); });
      cleanups.push(function () { ST.removeEventListener('refresh', onRef); root.classList.remove('mt'); if (ti.parentNode) ti.parentNode.removeChild(ti); });
    }

    var grid = $('#stockGrid');
    var first = true;
    function bind(cards) {
      var soft = !first;
      cards = cards.filter(function (c) { return !c._m && c.getBoundingClientRect().bottom > 0; });
      if (!cards.length) return;
      cards.forEach(function (c) { c._m = 1; });
      g.set(cards, { opacity: 0, y: dy });
      if (!soft) {
        g.set(cards.map(function (c) { return $('.im', c); }), { clipPath: 'inset(0% 0% 100% 0%)' });
        g.set(cards.map(function (c) { return $('.ct', c); }).filter(Boolean), { scale: D ? 1.1 : 1.06 });
      }
      ST.batch(cards, { start: 'top 90%', once: true, batchMax: 3, interval: .08, onEnter: function (b) {
        g.to(b, { opacity: 1, y: 0, duration: (soft ? .5 : .9) * k, stagger: soft ? .05 : .09, ease: E, clearProps: 'opacity,transform' });
        if (soft) return;
        g.to(b.map(function (c) { return $('.im', c); }), { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.1 * k, stagger: .09, ease: 'expo.inOut', clearProps: 'clipPath' });
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

    /* ---------- FICHA: se abre desde la tarjeta tocada; el contenido entra escalonado ---------- */
    var dlg = $('#dlg'), was = false, ox = 0, oy = 0;
    grid.addEventListener('click', function (e) {
      var c = e.target.closest('.car'); if (!c) return;
      var r = $('.im', c).getBoundingClientRect();
      ox = r.left + r.width / 2 - innerWidth / 2; oy = r.top + r.height / 2 - innerHeight / 2;
    }, true);
    dlg.addEventListener('close', function () { was = false; });
    var mo2 = new MutationObserver(function () {
      var fresh = dlg.open && !was; was = dlg.open;
      if (fresh) {
        var w = dlg.offsetWidth, h = dlg.offsetHeight;
        g.fromTo(dlg, { opacity: 0, scale: D ? .88 : .94, x: ox * .1, y: oy * .1 + 10, transformOrigin: (w / 2 + ox) + 'px ' + (h / 2 + oy) + 'px' },
          { opacity: 1, scale: 1, x: 0, y: 0, duration: .65, ease: E, clearProps: 'opacity,transform,transformOrigin', overwrite: 'auto' });
      }
      var t = $$('.di > *', dlg);
      if (t.length) g.from(t, { opacity: 0, y: D ? 12 : 8, duration: .55, stagger: .045, delay: fresh ? .18 : 0, ease: E, clearProps: 'opacity,transform', overwrite: 'auto' });
      if ($('.gal', dlg)) g.from($('.gal', dlg), { opacity: 0, duration: .5, delay: fresh ? .1 : 0, ease: 'power2.out', clearProps: 'opacity' });
    });
    mo2.observe(dlg, { childList: true });

    /* ---------- BLOQUES: mismo gesto en todo el sitio ---------- */
    words($('.ops h2'), '.ops');
    reveal($$('.ops .oh .sub'), '.ops');
    reveal($$('.oc'), '.og', { s: .1, st: 'top 88%', nt: 1 });
    photos($$('.oi'), '.og', { s: .1, st: 'top 88%' });

    /* Collage "Contanos tu auto": máscara escalonada; en escritorio, cada foto con su propia velocidad (±3–5%) */
    reveal($$('.fm > div:first-child > :not(.fp)'), '.fm', { s: .12, st: 'top 85%' });
    photos($$('.fp > div'), '.fp', { s: .14, st: 'top 88%', still: D, from: D ? 'inset(0% 100% 0% 0%)' : 'inset(0% 0% 100% 0%)' });
    if (D) {
      $$('.fp > div').forEach(function (box, i) {
        var img = $('img', box), a = [3, 5, 4][i] || 3;
        g.fromTo(img, { scale: 1.12, yPercent: -a }, { scale: 1.12, yPercent: a, ease: 'none', scrollTrigger: { trigger: '.fp', start: 'top bottom', end: 'bottom top', scrub: .6 } });
      });
    }
    reveal($$('.fm form'), '.fm form', { st: 'top 88%' });
    reveal([$('.lc')], '.loc', { st: 'top 65%' });
    words($('.faq h2'), '.faq');
    reveal($$('.faq details'), '.faq details', { y: 16, s: .06, st: 'top 90%' });
    reveal($$('.fin'), '.fin', { y: 12, st: 'top 95%' });
    reveal($$('footer .lg'), 'footer', { y: 16, st: 'top 92%' });

    /* Preguntas: la respuesta acompaña al gesto de abrir */
    $$('.faq details').forEach(function (d) {
      var f = function () { if (d.open) g.fromTo($('p', d), { opacity: 0, y: -8 }, { opacity: 1, y: 0, duration: .5, ease: E, clearProps: 'opacity,transform', overwrite: 'auto' }); };
      d.addEventListener('toggle', f);
      cleanups.push(function () { d.removeEventListener('toggle', f); });
    });
    /* Formulario: el aviso de estado aparece con un gesto corto */
    var fs = $('#fStatus');
    var mo3 = new MutationObserver(function () { if (fs.textContent) g.fromTo(fs, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: .45, ease: E, clearProps: 'opacity,transform', overwrite: 'auto' }); });
    mo3.observe(fs, { childList: true });

    /* ---------- Progreso de lectura: línea fina bajo el header (solo transform) ---------- */
    var pb = $('.pgb') || header.appendChild(Object.assign(document.createElement('i'), { className: 'pgb', ariaHidden: 'true' }));
    g.to(pb, { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: .3 } });

    /* ---------- MÓVIL ---------- */
    if (!D) {
      /* Header: se guarda al bajar, vuelve al subir */
      ST.create({ start: 0, end: 'max', onUpdate: function (s) { header.classList.toggle('h', s.scroll() > 260 && s.direction === 1); } });
      header.addEventListener('focusin', function () { header.classList.remove('h'); });

      /* Barra WhatsApp/Llamar: mientras los CTAs del hero están a la vista no se muestra (antes los tapaba);
         al pasarlos, sube una vez con un pulso y queda siempre accesible */
      var bar = $('.bar'), pulsed = false;
      if (bar) {
        bar.classList.add('bh');
        var bt = ST.create({ trigger: '.hero .row', start: 'bottom 22%', end: 'max', onToggle: function (s) {
          bar.classList.toggle('bh', !s.isActive);
          if (s.isActive && !pulsed) { pulsed = true; g.delayedCall(.45, function () { pulse('.bar .btn.p'); }); }
        } });
        if (bt.isActive) bar.classList.remove('bh');
        cleanups.push(function () { bar.classList.remove('bh'); });
      }
    }

    return function () {
      mo.disconnect(); mo2.disconnect(); mo3.disconnect();
      header.classList.remove('h');
      cleanups.forEach(function (f) { f(); });
    };
  });
})();
