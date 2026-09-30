/* Movimiento del sitio · GSAP + ScrollTrigger (sin dependencias extra, sin CDN).
   SISTEMA (un gesto por tipo de elemento, para que se sienta ritmo y no efectos sueltos):
   · Fotos     → se revelan con máscara (clip-path) + asentado de escala 1.1 → 1
   · Texto     → títulos por palabra; bajadas y bloques con subida corta
   · Curva     → expo.out en todo lo que entra; expo.inOut solo en máscaras
   · Conversión→ WhatsApp/Llamar siempre accesibles; el pulso ocurre una sola vez
   Máscaras: siempre inset() de 4 valores en % (GSAP no interpola 0 con 0% y la máscara saltaría al final).
   Solo se animan transform, opacity y clip-path (única excepción: la altura del acordeón de Preguntas). Sin smooth-scroll ni scroll-jacking.
   CAPAS v5 (todas con el mismo lenguaje: expo.out, gestos cortos, nada decorativo):
   · ScrollTo   → los enlaces internos viajan con expo.inOut; la rueda o el toque los interrumpen (no hay secuestro de scroll)
   · Flip       → al filtrar unidades, las que quedan se reacomodan, las nuevas entran y las que salen se despiden
   · Puntero    → paralaje del hero, botones magnéticos y tilt de las tarjetas de operaciones (solo mouse; nunca en táctil)
   · Vista previa del mensaje → el mensaje de WhatsApp se escribe mientras se completa el formulario; año y km ruedan como un odómetro
   · Mapa       → se descubre con máscara; el panel de dirección entra escalonado
   · Preguntas  → el acordeón abre y cierra con altura animada (details nativo, teclado intacto)
   prefers-reduced-motion: no se registra ninguna animación (queda la navegación activa, sin movimiento). */
(function () {
  var root = document.documentElement, g = window.gsap, ST = window.ScrollTrigger;
  if (!g || !ST) { root.classList.remove('m'); return; }
  g.registerPlugin(ST);
  if (window.Flip) g.registerPlugin(window.Flip);
  if (window.ScrollToPlugin) g.registerPlugin(window.ScrollToPlugin);
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

  window.addEventListener('load', function () { ST.refresh(); setTimeout(function () { ST.refresh(); }, 400); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ST.refresh(); });

  if (reduce) return;

  /* Reordenar con Flip (lo usa el comparador de index.html; sin GSAP cae a un cambio directo) */
  window.poerioFlip = function (els, mutate) {
    if (!window.Flip) { mutate(); return; }
    var st = window.Flip.getState(els); mutate();
    window.Flip.from(st, { duration: .9, ease: E, stagger: .04 });
  };

  /* ---------- Pausa del movimiento automático (WCAG 2.2.2) ----------
     Un solo estado para el hero y las tres rotaciones de fotos: cada una tiene su botón y todos quedan sincronizados. */
  var auto = { off: false, subs: [], btns: [] };
  var IC_PAUSE = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg>';
  var IC_PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M8 5.5v13l11-6.5z"/></svg>';
  function autoSync() { auto.subs.slice().forEach(function (f) { f(); }); }
  function autoBtn(host) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'apz';
    function paint() {
      var t = auto.off ? 'Reanudar el movimiento automático' : 'Pausar el movimiento automático';
      b.setAttribute('aria-label', t); b.title = t; b.innerHTML = auto.off ? IC_PLAY : IC_PAUSE;
    }
    b.addEventListener('click', function () { auto.off = !auto.off; auto.btns.forEach(function (f) { f(); }); autoSync(); });
    paint(); auto.btns.push(paint); host.appendChild(b);
    return function () { var i = auto.btns.indexOf(paint); if (i > -1) auto.btns.splice(i, 1); if (b.parentNode) b.parentNode.removeChild(b); };
  }

  /* ---------- Rotadores de fotos (banda, "Quiénes somos", Preguntas): un solo sistema ----------
     Fundido con asentado de escala; solo corren a la vista y con la pestaña visible. Se detienen con hover (mouse), foco de teclado y el botón de pausa.
     Las fotos extra se agregan tras la carga. */
  function rotator(box, names, o) {
    if (!box) return;
    names.forEach(function (n) {
      var src = 'images/' + n + '.webp', i = new Image();
      i.src = src; if (window.SSET) { i.srcset = window.SSET(src); i.sizes = o.sizes; }
      i.alt = ''; i.width = 1280; i.height = 960; i.loading = 'lazy';
      box.insertBefore(i, o.before ? $(o.before, box) : null);
    });
    var im = $$('img', box), k = 0, tm = 0, vis = false, top = o.op == null ? 1 : o.op;
    function nx() {
      var a = im[k], b = im[(k + 1) % im.length]; k = (k + 1) % im.length;
      g.set(b, { opacity: 0, scale: o.sc }); g.to(b, { opacity: top, scale: 1, duration: o.du, ease: 'power2.out' }); g.to(a, { opacity: 0, duration: o.du, ease: 'power2.out' });
    }
    var hold = 0;
    function go() { if (!tm) tm = setInterval(nx, o.ms); }
    function st() { clearInterval(tm); tm = 0; }
    function sync() { (vis && !hold && !auto.off && !document.hidden) ? go() : st(); }
    new IntersectionObserver(function (e) { vis = e[0].isIntersecting; sync(); }).observe(box);
    document.addEventListener('visibilitychange', sync);
    if (matchMedia('(hover:hover) and (pointer:fine)').matches) {
      box.addEventListener('pointerenter', function () { hold |= 1; sync(); });
      box.addEventListener('pointerleave', function () { hold &= ~1; sync(); });
    }
    box.addEventListener('focusin', function (e) { if (e.target.matches && e.target.matches(':focus-visible')) { hold |= 2; sync(); } });
    box.addEventListener('focusout', function () { hold &= ~2; sync(); });
    auto.subs.push(sync);
    autoBtn(box);
  }
  function onLoad(fn) { if (document.readyState === 'complete') fn(); else window.addEventListener('load', fn); }
  onLoad(function () {
    rotator($('#fqs'), ['clio-3', 'up-3', 'punto-3', 'ecosport-3', 'ka-s-2'], { sizes: '(min-width:900px) 40vw,100vw', sc: 1.06, du: 1.2, ms: 3800 });
    rotator($('#bd'), ['clio-5', 'up-5', 'ecosport-5'], { sizes: '100vw', sc: 1.08, du: 1.6, ms: 4200, op: .75, before: 'a' });
    rotator($('#nph'), ['nosotros-patio', 'nosotros-calle', 'nosotros-cartel'], { sizes: '(min-width:900px) 40vw,100vw', sc: 1.06, du: 1.2, ms: 3800 });
  });

  /* ---------- Anclas: viaje con expo.inOut; la rueda/toque lo interrumpe ---------- */
  if (window.ScrollToPlugin) document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest('a[href^="#"]'); if (!a) return;
    var id = a.getAttribute('href'); if (id.length < 2) return;
    var t = $(id); if (!t) return;
    e.preventDefault();
    var off = innerWidth >= 900 && header ? header.offsetHeight : 0, dist = Math.abs(t.getBoundingClientRect().top - off);
    g.to(window, { scrollTo: { y: t, offsetY: off, autoKill: true }, duration: Math.min(1.7, Math.max(.8, dist / 2400)), ease: 'expo.inOut', overwrite: true,
      onComplete: function () { t.setAttribute('tabindex', '-1'); t.focus({ preventScroll: true }); } });
    if (history.replaceState) history.replaceState(null, '', id);
  });

  /* ---------- Vista previa del mensaje: escritura + odómetro ----------
     index.html arma el estado (texto, modelo, dígitos) y llama a window.poerioFx(estado). Sin GSAP, index.html lo dibuja estático. */
  var pv = $('#pv'), pvIntro = false;
  if (pv) {
    var tx = $('#pvTx'), cr = $('#pvCr'), mod = $('#pvMod'), bar = $('#pvP'), bub = $('#pvBub'), tkp = $$('.tk path', pv);
    var T = { n: 0 }, wasEmpty = true, ready = false;
    var od = { y: { cols: $$('#odY .d'), strips: $$('#odY .s'), sps: [] }, k: { cols: $$('#odK .d'), strips: $$('#odK .s'), sps: $$('#odK .sp') } };
    /* las posiciones iniciales pasan de transform CSS a yPercent de GSAP */
    [od.y, od.k].forEach(function (o) { o.strips.forEach(function (st) { var d = +st.getAttribute('data-d') || 0; g.set(st, { clearProps: 'transform' }); g.set(st, { yPercent: -10 * d }); }); });
    var roll = function (o, v) {
      o.cols.forEach(function (c, i) { c.classList.toggle('off', !!v.a[i].off); });
      o.sps.forEach(function (b, i) { b.classList.toggle('off', v.off > (i ? 3 : 0)); });
      o.strips.forEach(function (st, i) { g.to(st, { yPercent: -10 * v.a[i].d, duration: 1.2, ease: E, delay: (v.a.length - 1 - i) * .045, overwrite: true }); });
    };
    window.poerioFx = function (s) {
      var cur = tx.textContent, c = 0, L = s.text.length;
      while (c < cur.length && c < L && cur.charAt(c) === s.text.charAt(c)) c++;
      g.killTweensOf(T);
      if (L <= c) tx.textContent = s.text;                       /* solo se borró: sin animación */
      else {
        tx.textContent = s.text.slice(0, c); T.n = c;
        g.to(T, { n: L, duration: Math.min(.9, (L - c) * .022), ease: 'none', onUpdate: function () { tx.textContent = s.text.slice(0, Math.round(T.n)); }, onComplete: function () { tx.textContent = s.text; } });
      }
      g.fromTo(cr, { opacity: 1 }, { opacity: 0, duration: .5, delay: 1.2, overwrite: true });
      var empty = !s.modelo;
      mod.textContent = s.modelo || 'Marca y modelo'; mod.classList.toggle('e', empty);
      if (empty !== wasEmpty) g.fromTo(mod, { yPercent: 40, opacity: 0 }, { yPercent: 0, opacity: 1, duration: .6, ease: E, overwrite: true, clearProps: 'opacity,transform' });
      wasEmpty = empty;
      g.to(bar, { scaleX: s.prog, duration: .9, ease: E, overwrite: true });
      if (s.prog === 1 && !ready) g.fromTo(bub, { scale: .97, transformOrigin: '100% 100%' }, { scale: 1, duration: .7, ease: E, clearProps: 'transform,transformOrigin', overwrite: 'auto' });
      ready = s.prog === 1;
      roll(od.y, s.y); roll(od.k, s.k);
    };
    /* Enviado: la burbuja se asienta y las tildes se dibujan */
    document.addEventListener('poerio:sent', function () {
      g.fromTo(bub, { y: 8, scale: .985, transformOrigin: '100% 100%' }, { y: 0, scale: 1, duration: .7, ease: E, clearProps: 'transform,transformOrigin', overwrite: 'auto' });
      tkp.forEach(function (pth, i) {
        var l = pth.getTotalLength();
        g.fromTo(pth, { strokeDasharray: l, strokeDashoffset: l }, { strokeDashoffset: 0, duration: .55, delay: .15 + i * .2, ease: E, clearProps: 'strokeDasharray,strokeDashoffset', overwrite: true });
      });
    });
  }

  g.matchMedia().add({ d: '(min-width:900px)', m: '(max-width:899px)' }, function (ctx) {
    var D = ctx.conditions.d, dy = D ? 32 : 18, k = D ? 1 : .8;
    var cleanups = [], fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
    function on(el, type, fn, cap) { el.addEventListener(type, fn, cap); cleanups.push(function () { el.removeEventListener(type, fn, cap); }); }

    /* ---------- Helpers del sistema ---------- */
    function reveal(t, trig, o) {
      if (!t.length) return; o = o || {};
      if (o.nt) g.set(t, { transition: 'none' });   /* si el elemento tiene transition CSS sobre transform, GSAP no debe pelear con ella */
      g.from(t, { opacity: 0, y: o.y == null ? dy : o.y, duration: .9 * k, stagger: o.s || .08, delay: o.d || 0, ease: E, clearProps: 'opacity,transform' + (o.nt ? ',transition' : ''),
        scrollTrigger: { trigger: trig, start: o.st || 'top 85%', once: true } });
    }
    function split(el, force) {
      if (!el || (el._s && !force)) return []; el._s = 1;
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

    /* ---------- HERO: visible desde el primer pintado ----------
       Sin animación de entrada que lo oculte (el título, los botones y la foto ya están en el HTML). Solo queda la salida con profundidad y el paralaje. */
    var fg = $('.hero figure'), fi = $('#hzs'), bg = $('.hero .bgv') || document.createElement('i'),
      txt = [$('.hero h1'), $('.hero .tx p')];
    if (D) {
      /* Salida del hero: profundidad muy moderada (texto 28px, foto 2%) */
      g.to([txt[0], txt[1]], { y: -28, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: .5 } });
      g.to(fi, { yPercent: 2, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: .5 } });
      g.delayedCall(.9, function () { pulse('header .btn.p'); });
      /* Paralaje con el puntero: foto y fondo se mueven en sentidos opuestos (solo mouse) */
      if (fine) {
        var hero = $('.hero'), P = { ease: 'power3.out', duration: .9 };
        g.to([fi, bg], { scale: 1.06, duration: 1.6, ease: 'power2.out' });
        var fx = g.quickTo(fi, 'x', P), fy = g.quickTo(fi, 'y', P), bx = g.quickTo(bg, 'x', P), by = g.quickTo(bg, 'y', P);
        on(hero, 'pointermove', function (e) {
          var r = hero.getBoundingClientRect(), nx = (e.clientX - r.left) / r.width - .5, ny = (e.clientY - r.top) / r.height - .5;
          fx(nx * -26); fy(ny * -18); bx(nx * 18); by(ny * 12);
        });
        on(hero, 'pointerleave', function () { fx(0); fy(0); bx(0); by(0); });
      }
    }


    /* ---------- HERO · rotación de unidades ----------
       Todas las unidades entran igual: máscara lateral (dirección según el sentido) + foto que se asienta con contraparalaje,
       nombre por palabra y un progreso por unidad en el rail. Se pausa con hover/foco, fuera de pantalla, en otra pestaña o con el botón. */
    var hs = $('#hs'), H = window.poerioHero, sl = $$('.hz', hs || document);
    var hn = $('#hn'), hm = $('#hm'), prog = null, held = 0, inView = true, started = false;
    function sync() { if (!prog) return; (!auto.off && !held && inView && !document.hidden) ? prog.play() : prog.pause(); }
    function tick(i) {
      if (prog) prog.kill();
      prog = g.delayedCall(2, function () { H.next(); });
      sync();
    }
    function startSlider() { if (started || !H || !hs) return; started = true; tick(H.i); }
    if (H && hs && sl.length > 1) {
      root.classList.add('hg');
      auto.subs.push(sync);
      cleanups.push(function () { var i = auto.subs.indexOf(sync); if (i > -1) auto.subs.splice(i, 1); }, autoBtn($('.hv', hs)));
      var onHero = function (e) {
        ctx.add(function () {
          var d = e.detail, A = sl[d.to], B = sl[d.from], iA = $('img', A), iB = $('img', B), dir = d.dir;
          sl.forEach(function (x) { if (x !== A && x !== B) { x.classList.remove('lv'); g.set(x, { clearProps: 'clipPath,zIndex' }); } });
          g.killTweensOf([A, B, iA, iB]);
          B.classList.add('lv'); g.set(B, { zIndex: 1, clipPath: 'inset(0% 0% 0% 0%)' }); g.set(A, { zIndex: 2 });
          g.fromTo(A, { clipPath: dir > 0 ? 'inset(0% 0% 0% 100%)' : 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: .8 * k, ease: 'expo.inOut', clearProps: 'clipPath,zIndex',
            onComplete: function () { B.classList.remove('lv'); g.set(B, { clearProps: 'zIndex,clipPath' }); g.set(iB, { clearProps: 'transform' }); } });
          g.fromTo(iA, { scale: 1.16, xPercent: 8 * dir }, { scale: 1, xPercent: 0, duration: 1.3, ease: 'power3.out', clearProps: 'transform' });
          g.to(iB, { xPercent: -6 * dir, duration: .8 * k, ease: 'expo.inOut' });
          var W = split(hn, true);
          g.fromTo(W, { yPercent: 115 }, { yPercent: 0, duration: .6 * k, stagger: .04, delay: .1, ease: E, clearProps: 'transform' });
          g.fromTo(hm, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: .5, delay: .2, ease: E, clearProps: 'opacity,transform' });
          if (bg && bg.parentNode) g.to(bg, { opacity: 0, duration: .3, onComplete: function () { bg.src = $('img', A).src; g.to(bg, { opacity: 1, duration: 1, ease: 'power2.out', clearProps: 'opacity' }); } });
          if (started) tick(d.to);
        });
      };
      document.addEventListener('poerio:hero', onHero);
      cleanups.push(function () { document.removeEventListener('poerio:hero', onHero); if (prog) prog.kill(); prog = null; started = false; root.classList.remove('hg'); });
      if (fine) { on(hs, 'pointerenter', function () { held |= 1; sync(); }); on(hs, 'pointerleave', function () { held &= ~1; sync(); }); }
      on(hs, 'focusin', function (e) { if (e.target.matches && e.target.matches(':focus-visible')) { held |= 2; sync(); } });
      on(hs, 'focusout', function () { held &= ~2; sync(); });
      on(document, 'visibilitychange', sync);
      ST.create({ trigger: hs, start: 'top bottom', end: 'bottom top', onToggle: function (s) { inView = s.isActive; sync(); } });
      /* deslizar en táctil: cambia de unidad en el sentido del gesto */
      var hv = $('.hv', hs), x0 = 0, y0 = 0;
      on(hv, 'pointerdown', function (e) { x0 = e.clientX; y0 = e.clientY; });
      on(hv, 'pointerup', function (e) { var dx = e.clientX - x0, dy2 = e.clientY - y0; if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy2) * 1.4) { var s2 = dx < 0 ? 1 : -1; H.go(H.i + s2, s2); } });
    }
    startSlider();   /* arranca la rotación (y la retoma tras redimensionar) */

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
    /* Filtros con Flip: las que quedan se reacomodan, las nuevas entran, las que salen se despiden.
       Se captura el estado ANTES de que index.html vuelva a dibujar la grilla (listener en captura). */
    var chipsEl = $('#chips'), pend = null, busy = false;
    if (window.Flip && chipsEl) on(chipsEl, 'click', function (e) {
      var b = e.target.closest('.chip'); if (!b || b.getAttribute('aria-pressed') === 'true') return;
      var cs = $$('.car', grid).filter(function (c) { return !c._gh; }); if (!cs.length) { pend = null; return; }
      var gr = grid.getBoundingClientRect();
      cs.forEach(function (c) { c.setAttribute('data-flip-id', c.getAttribute('data-i')); });
      var st0 = window.Flip.getState(cs); mo.takeRecords();   /* getState reubica nodos un instante: esos registros no cuentan */
      pend = { state: st0, ghosts: cs.map(function (c) { var r = c.getBoundingClientRect(); return { el: c, id: c.getAttribute('data-i'), l: r.left - gr.left, t: r.top - gr.top, w: r.width, h: r.height }; }) };
    }, true);
    function flipIn(P, cards) {
      busy = true;
      cards.forEach(function (c) { c._m = 1; c.setAttribute('data-flip-id', c.getAttribute('data-i')); });
      var ids = cards.map(function (c) { return c.getAttribute('data-i'); });
      P.ghosts.forEach(function (o) {
        if (ids.indexOf(o.id) > -1) return;
        var el = o.el; el._gh = 1; grid.appendChild(el);
        g.set(el, { position: 'absolute', left: o.l, top: o.t, width: o.w, height: o.h, margin: 0, zIndex: 0, pointerEvents: 'none', opacity: 1 });
        g.to(el, { opacity: 0, scale: .95, y: 10, duration: .32, ease: 'power2.in', onComplete: function () { if (el.parentNode) el.parentNode.removeChild(el); } });
      });
      mo.takeRecords(); busy = false;
      /* durante el vuelo las tarjetas van por encima de las que se despiden y con fondo opaco (se limpia al terminar) */
      g.set(cards, { position: 'relative', zIndex: 1, backgroundColor: '#F3F5F6' });
      window.Flip.from(P.state, { targets: cards, duration: .95 * k, ease: E, stagger: .04, nested: false, delay: .08,
        onComplete: function () { g.set(cards, { clearProps: 'position,zIndex,backgroundColor' }); },
        onEnter: function (els) { return g.fromTo(els, { opacity: 0, y: dy, scale: .96 }, { opacity: 1, y: 0, scale: 1, duration: .8 * k, stagger: .07, ease: E, clearProps: 'opacity,transform' }); } });
    }
    var mo = new MutationObserver(function () {
      if (busy) return;
      var cards = $$('.car', grid).filter(function (c) { return !c._gh; });
      if (pend && cards.some(function (c) { return !pend.ghosts.some(function (o) { return o.el === c; }); })) { var P = pend; pend = null; flipIn(P, cards); }
      else ctx.add(function () { bind(cards); });
      requestAnimationFrame(function () { ST.refresh(); });
    });
    mo.observe(grid, { childList: true });

    /* ---------- FICHA: se abre desde la tarjeta tocada; el contenido entra escalonado ---------- */
    var dlg = $('#dlg'), was = false, ox = 0, oy = 0, fl = null;
    grid.addEventListener('click', function (e) {
      var c = e.target.closest('.car'); if (!c) return;
      var r = $('.im', c).getBoundingClientRect(), ct = $('.ct', c);
      ox = r.left + r.width / 2 - innerWidth / 2; oy = r.top + r.height / 2 - innerHeight / 2;
      fl = ct && !(e.target.closest('.ar')) ? { r: r, idx: Math.round(ct.scrollLeft / (ct.clientWidth || 1)) } : null;
    }, true);
    dlg.addEventListener('close', function () { was = false; });
    var mo2 = new MutationObserver(function () {
      var fresh = dlg.open && !was; was = dlg.open;
      var gal0 = $('.gal', dlg);
      if (fresh && fl && gal0) {
        /* Vuelo compartido: la foto de la tarjeta viaja hasta la galería de la ficha (escala uniforme, nunca deforma) y la ficha se abre desde el rectángulo de la tarjeta */
        var F = fl; fl = null; zoomOff();
        if (F.idx) gal0.scrollLeft = F.idx * gal0.clientWidth;
        var gr = gal0.getBoundingClientRect(), dr = dlg.getBoundingClientRect(), src = $$('img', gal0)[F.idx || 0].src;
        var fy = document.createElement('div'); fy.className = 'fly'; fy.setAttribute('aria-hidden', 'true'); fy.innerHTML = '<img alt="" src="' + src + '">';
        fy.style.cssText = 'left:' + gr.left + 'px;top:' + gr.top + 'px;width:' + gr.width + 'px;height:' + gr.height + 'px';
        dlg.appendChild(fy);
        var cp = function (a, b, c2, d) { return 'inset(' + a + 'px ' + b + 'px ' + c2 + 'px ' + d + 'px)'; };
        g.fromTo(dlg, { clipPath: cp(F.r.top - dr.top, dr.right - F.r.right, dr.bottom - F.r.bottom, F.r.left - dr.left) }, { clipPath: cp(0, 0, 0, 0), duration: 1.05 * k, ease: 'expo.inOut', clearProps: 'clipPath', overwrite: 'auto' });
        g.fromTo(fy, { x: F.r.left - gr.left, y: F.r.top - gr.top, scale: F.r.width / gr.width }, { x: 0, y: 0, scale: 1, duration: 1.05 * k, ease: 'expo.inOut',
          onComplete: function () { if (fy.parentNode) fy.parentNode.removeChild(fy); } });
        g.fromTo(gal0, { opacity: 0 }, { opacity: 1, duration: .01, delay: 1.05 * k, clearProps: 'opacity' });
      } else if (fresh) {
        fl = null;
        var w = dlg.offsetWidth, h = dlg.offsetHeight;
        g.fromTo(dlg, { opacity: 0, scale: D ? .88 : .94, x: ox * .1, y: oy * .1 + 10, transformOrigin: (w / 2 + ox) + 'px ' + (h / 2 + oy) + 'px' },
          { opacity: 1, scale: 1, x: 0, y: 0, duration: .65, ease: E, clearProps: 'opacity,transform,transformOrigin', overwrite: 'auto' });
      }
      var t = $$('.di > *', dlg);
      if (t.length) g.from(t, { opacity: 0, y: D ? 12 : 8, duration: .55, stagger: .045, delay: fresh ? .18 : 0, ease: E, clearProps: 'opacity,transform', overwrite: 'auto' });
      if (gal0 && !$('.fly', dlg)) g.from(gal0, { opacity: 0, duration: .5, delay: fresh ? .1 : 0, ease: 'power2.out', clearProps: 'opacity' });
    });
    mo2.observe(dlg, { childList: true });


    /* ---------- FOTOS: lupa en la ficha, exploración por puntero y cursor en el catálogo (solo mouse) ---------- */
    var zi = null, zqx, zqy, ZS = 2.2;
    function zoomOff() {
      if (!zi) return; var im = zi; zi = null;
      if (im.parentNode) im.parentNode.classList.remove('zo');
      g.to(im, { scale: 1, x: 0, y: 0, duration: .6, ease: E, overwrite: true, clearProps: 'transform' });
    }
    if (fine) {
      on(dlg, 'click', function (e) {
        var im = e.target.closest && e.target.closest('.gal img'); if (!im) return;
        if (zi) return zoomOff();
        zi = im; im.parentNode.classList.add('zo');
        zqx = g.quickTo(im, 'x', { duration: .55, ease: 'power3.out' }); zqy = g.quickTo(im, 'y', { duration: .55, ease: 'power3.out' });
        g.to(im, { scale: ZS, duration: .8, ease: E, overwrite: 'auto' });
        pan(e);
      });
      var pan = function (e) {
        if (!zi) return; var r = zi.parentNode.getBoundingClientRect();
        zqx(-((e.clientX - r.left) / r.width - .5) * (ZS - 1) * r.width); zqy(-((e.clientY - r.top) / r.height - .5) * (ZS - 1) * r.height);
      };
      on(dlg, 'pointermove', pan);
      on(dlg, 'pointerout', function (e) { if (zi && !(e.relatedTarget && zi.parentNode.contains(e.relatedTarget))) zoomOff(); });
      on(dlg, 'scroll', zoomOff, true);
      on(dlg, 'keydown', zoomOff);
      on(dlg, 'close', zoomOff);

      /* Cursor contextual + exploración: al mover el puntero sobre la foto de una tarjeta, se recorren sus fotos */
      var cu = document.createElement('div'); cu.className = 'cur'; cu.setAttribute('aria-hidden', 'true'); cu.innerHTML = '<span>Ver ficha</span>'; document.body.appendChild(cu);
      var cqx = g.quickTo(cu, 'x', { duration: .45, ease: 'power3.out' }), cqy = g.quickTo(cu, 'y', { duration: .45, ease: 'power3.out' }), cOn = false, scrubbed = new WeakMap();
      var cshow = function (v, e) {
        if (v === cOn) return; cOn = v; root.classList.toggle('cur-on', v);
        if (v && e) g.set(cu, { x: e.clientX, y: e.clientY });
        g.to(cu, { scale: v ? 1 : 0, opacity: v ? 1 : 0, duration: .45, ease: E, overwrite: 'auto' });
      };
      var snapBack = function (im) {
        var ct = $('.ct', im); if (!ct || !scrubbed.get(im)) { im.classList.remove('pk'); return; }
        scrubbed.set(im, 0);
        if (window.ScrollToPlugin) g.to(ct, { scrollTo: { x: 0 }, duration: .7, ease: E, overwrite: true, onComplete: function () { im.classList.remove('pk'); } });
        else { ct.scrollLeft = 0; im.classList.remove('pk'); }
      };
      on(grid, 'pointermove', function (e) {
        if (e.pointerType && e.pointerType !== 'mouse') return;
        var im = e.target.closest && e.target.closest('.im'), over = !!im && !e.target.closest('.ar');
        if (over) {
          cqx(e.clientX); cqy(e.clientY);
          var ct = $('.ct', im), n = ct ? ct.children.length : 0;
          if (n > 1 && window.ScrollToPlugin) {
            var r = im.getBoundingClientRect(), idx = Math.max(0, Math.min(n - 1, Math.floor((e.clientX - r.left) / r.width * n)));
            if (idx !== im._pi) {
              im._pi = idx; im.classList.add('pk'); scrubbed.set(im, 1);
              g.to(ct, { scrollTo: { x: idx * ct.clientWidth }, duration: .75, ease: E, overwrite: true });
            }
          }
        }
        cshow(over, e);
      });
      on(grid, 'pointerout', function (e) {
        var im = e.target.closest && e.target.closest('.im'); if (!im || (e.relatedTarget && im.contains(e.relatedTarget))) return;
        im._pi = -1; snapBack(im);
      });
      on(grid, 'pointerleave', function () { cshow(false); });
      on(window, 'scroll', function () { cshow(false); }, { passive: true });
      on(dlg, 'click', function () { cshow(false); }, true);
      on(grid, 'click', function (e) { if (e.target.closest('.ar')) { var im = e.target.closest('.im'); if (im) { scrubbed.set(im, 0); im._pi = -1; } } }, true);
      cleanups.push(function () { root.classList.remove('cur-on'); if (cu.parentNode) cu.parentNode.removeChild(cu); });
    }

    /* ---------- COMPARADOR (versus), Quiénes somos, banner y barra de filtros ---------- */
    reveal($$('#ff, #qc'), '#ff', { s: .08 });
    words($('#versus h2'), '#versus');
    reveal($$('#versus .sub, #vp'), '#versus', { s: .08 });
    words($('#nosotros h2'), '#nosotros');
    reveal($$('#nosotros .ey, #nosotros .w > div:nth-child(2) > p, #nosotros .pl > div, #nosotros .w > div:nth-child(2) > .btn'), '#nosotros', { s: .08, nt: 1 });
    photos([$('#nph')], '#nosotros', { still: true });
    reveal($$('.ci'), '.ci', { s: .08 });
    reveal($$('.bd a'), '.bd', { y: 20, st: 'top 70%', nt: 1 });

    /* ---------- FAQ (foto) y marca del pie ---------- */
    photos($$('.fq'), '.faq', { s: .1, st: 'top 85%' });
    reveal($$('.fl .sub'), '.faq', { st: 'top 85%' });

    /* ---------- BLOQUES: mismo gesto en todo el sitio ---------- */
    words($('.ops h2'), '.ops');
    reveal($$('.ops .oh .sub'), '.ops');
    reveal($$('.oc'), '.og', { s: .1, st: 'top 88%', nt: 1 });
    photos($$('.oi'), '.og', { s: .1, st: 'top 88%' });

    /* Collage "Contanos tu auto": máscara escalonada; en escritorio, cada foto con su propia velocidad (±3–5%) */
    reveal($$('.fm > div:first-child > :not(.fp):not(.stp)'), '.fm', { s: .12, st: 'top 85%' });
    reveal($$('.stp li'), '.stp', { s: .14, y: 22, st: 'top 88%' });
    photos($$('.fp > div'), '.fp', { s: .14, st: 'top 88%', still: D, from: D ? 'inset(0% 100% 0% 0%)' : 'inset(0% 0% 100% 0%)' });
    if (D) {
      $$('.fp > div').forEach(function (box, i) {
        var img = $('img', box), a = [3, 5, 4][i] || 3;
        g.fromTo(img, { scale: 1.12, yPercent: -a }, { scale: 1.12, yPercent: a, ease: 'none', scrollTrigger: { trigger: '.fp', start: 'top bottom', end: 'bottom top', scrub: .6 } });
      });
    }
    reveal($$('.fm form'), '.fm form', { st: 'top 88%' });

    /* Vista previa: máscara + contenido escalonado; el mensaje se escribe solo la primera vez que entra */
    var pvEl = $('#pv');
    if (pvEl) {
      if (pvEl.getBoundingClientRect().top > innerHeight * .85) $('#pvTx').textContent = '';
      g.fromTo(pvEl, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2 * k, ease: 'expo.inOut', clearProps: 'clipPath', scrollTrigger: { trigger: pvEl, start: 'top 88%', once: true } });
      reveal($$('.pv > *:not(.pvp)'), pvEl, { y: 14, s: .1, d: .3, st: 'top 82%' });
      ST.create({ trigger: pvEl, start: 'top 82%', once: true, onEnter: function () { g.delayedCall(.55, function () { if (window.poerioPv && !$('#pvTx').textContent) window.poerioPv(); }); } });
    }

    /* Mapa: se descubre con máscara y el mapa se asienta; el panel de dirección entra escalonado */
    var mp = $('.mp'), mif = $('.mp iframe');
    if (mp) {
      var mst = { trigger: '.loc', start: 'top 78%', once: true };
      g.fromTo(mp, { opacity: 0 }, { opacity: 1, duration: 1 * k, ease: 'power2.out', clearProps: 'opacity', scrollTrigger: mst });
    }
    reveal([$('.lc')], '.loc', { st: 'top 65%' });
    reveal($$('.lc > *'), '.loc', { st: 'top 65%', s: .09, y: 18, d: .25 });
    words($('.faq h2'), '.faq');
    reveal($$('.faq details'), '.faq details', { y: 16, s: .06, st: 'top 90%' });
    reveal($$('.fin'), '.fin', { y: 12, st: 'top 95%' });
    reveal($$('footer .lg'), 'footer', { y: 16, st: 'top 92%' });
    reveal($$('footer .w > :not(.lg)'), 'footer', { y: 12, s: .07, d: .15, st: 'top 96%' });

    /* Botones magnéticos (solo mouse): siguen al puntero unos px y vuelven con expo.out; el press los achica */
    if (fine) $$('.hero .btn, header .btn.p, .loc .btn, .fin .btn, .fm form .btn, .bd a, .no .btn').forEach(function (b) {
      var lift = b.classList.contains('p') ? -2 : 0, qx, qy;
      b.classList.add('mg');
      qx = g.quickTo(b, 'x', { duration: .6, ease: 'power3.out' }); qy = g.quickTo(b, 'y', { duration: .6, ease: 'power3.out' });
      on(b, 'pointermove', function (e) { var r = b.getBoundingClientRect(); qx((e.clientX - (r.left + r.width / 2)) * .22); qy((e.clientY - (r.top + r.height / 2)) * .3 + lift); });
      on(b, 'pointerleave', function () { qx(0); qy(0); g.to(b, { scale: 1, duration: .5, ease: E, overwrite: 'auto' }); });
      on(b, 'pointerdown', function () { g.to(b, { scale: .97, duration: .15, ease: 'power2.out', overwrite: 'auto' }); });
      on(b, 'pointerup', function () { g.to(b, { scale: 1, duration: .6, ease: E, overwrite: 'auto' }); });
      cleanups.push(function () { b.classList.remove('mg'); g.set(b, { clearProps: 'transform' }); });
    });

    /* Tilt de las tarjetas de operaciones (solo mouse): giro corto hacia el puntero + elevación */
    if (fine) $$('.oc').forEach(function (c) {
      var o = { duration: .7, ease: 'power3.out' }, rx = g.quickTo(c, 'rotationX', o), ry = g.quickTo(c, 'rotationY', o), ly = g.quickTo(c, 'y', o);
      on(c, 'pointerenter', function () { g.set(c, { transformPerspective: 900 }); ly(-6); });
      on(c, 'pointermove', function (e) { var r = c.getBoundingClientRect(); ry(((e.clientX - r.left) / r.width - .5) * 7); rx(-((e.clientY - r.top) / r.height - .5) * 6); });
      on(c, 'pointerleave', function () { rx(0); ry(0); ly(0); });
    });

    /* Preguntas: el acordeón abre y cierra con altura animada (details nativo: el teclado y el lector de pantalla siguen igual) */
    $$('.faq details').forEach(function (d) {
      var sm = $('summary', d), pp = $('p', d);
      on(sm, 'click', function (e) {
        e.preventDefault();
        g.killTweensOf(d);
        var opening = !d.open, h0 = d.offsetHeight, bw = d.offsetHeight - d.clientHeight, hc = sm.offsetHeight + bw;
        if (opening) {
          d.open = true;
          var h1 = d.offsetHeight;
          g.fromTo(d, { height: h0 }, { height: h1, duration: .75 * k, ease: E, clearProps: 'height', onComplete: function () { ST.refresh(); } });
          g.fromTo(pp, { opacity: 0, y: -8 }, { opacity: 1, y: 0, duration: .6, delay: .08, ease: E, clearProps: 'opacity,transform', overwrite: 'auto' });
        } else {
          g.to(d, { height: hc, duration: .55 * k, ease: E, onComplete: function () { d.open = false; g.set(d, { clearProps: 'height' }); ST.refresh(); } });
          g.to(pp, { opacity: 0, duration: .25, ease: 'power2.out', overwrite: 'auto' });
        }
      });
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
      mo.disconnect(); mo2.disconnect(); mo3.disconnect(); mo.takeRecords();
      header.classList.remove('h');
      cleanups.forEach(function (f) { f(); });
    };
  });
})();
