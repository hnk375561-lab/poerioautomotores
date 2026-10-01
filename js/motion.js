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
   · Puntero    → paralaje del hero (solo mouse; nunca en táctil)
   · Profundidad (v6, solo escritorio) → el texto del hero se despide en capas, los fondos con interior de vehículo se desplazan apenas y las fotos del equipo van a distinta velocidad
   · Vender o permutar → una unidad por vez, con la misma máscara lateral y el mismo nombre por palabra que el hero
   · Ficha → se abre desde la tarjeta; la foto se revela con máscara y el contenido entra escalonado
   · Banner → foto fija de fondo con paralaje suave
   · Mapa       → se descubre con máscara; el panel de dirección entra escalonado
   · Preguntas  → el acordeón abre y cierra con altura animada (details nativo, teclado intacto)
   v7: entrada cinematográfica del hero · títulos con sesgo · fotos que suben desde abajo · capítulos con línea · banner que se abre · tilt 3D en tarjetas · botones magnéticos y con presión · modo liviano en equipos modestos.
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
  var lite = (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 2 || !!(navigator.connection && navigator.connection.saveData);

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
  function autoSync() { auto.subs.slice().forEach(function (f) { f(); }); }
  function autoBtn() { return function () {}; }   /* sin botón: las rotaciones son continuas */

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
    auto.subs.push(sync);
  }
  function onLoad(fn) { if (document.readyState === 'complete') fn(); else window.addEventListener('load', fn); }
  onLoad(function () {
    rotator($('#fqs2'), ['ka-s-1', 'clio-2', 'punto-2', 'ecosport-2', 'up-4'], { sizes: '(min-width:900px) 40vw,100vw', sc: 1.06, du: 1.2, ms: 4600 });
    rotator($('#fqs'), ['clio-3', 'up-3', 'punto-3', 'ecosport-3', 'ka-s-2'], { sizes: '(min-width:900px) 40vw,100vw', sc: 1.06, du: 1.2, ms: 3800 });
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
      var out = [];
      Array.prototype.slice.call(el.childNodes).forEach(function (n) {
        var tag = n.nodeType === 1 && /^(EM|I|STRONG|B)$/.test(n.nodeName) ? n.nodeName.toLowerCase() : '', t = n.textContent.trim();
        if (!t) return;
        t.split(/\s+/).forEach(function (x) { out.push(tag ? '<' + tag + '>' + x + '</' + tag + '>' : x); });
      });
      if (!out.length) return [];
      el.setAttribute('aria-label', el.textContent.trim().split(/\s+/).join(' '));
      el.innerHTML = out.map(function (x) { return '<span class="wl" aria-hidden="true"><span>' + x + '</span></span>'; }).join(' ');
      return $$('.wl > span', el);
    }
    function words(el, trig) {
      var W = split(el); if (!W.length) return;
      g.from(W, { yPercent: 118, skewY: 7, transformOrigin: '0% 100%', duration: 1.15 * k, stagger: .055, ease: E, clearProps: 'transform', scrollTrigger: { trigger: trig, start: 'top 85%', once: true },
        onComplete: function () { W.forEach(function (w) { w.parentNode.style.overflow = 'visible'; }); } });
    }
    /* Foto editorial: máscara + escala asentándose. Nunca deforma: la escala es uniforme y siempre baja a 1 */
    function photos(boxes, trig, o) {
      boxes = boxes.filter(Boolean); if (!boxes.length) return; o = o || {};
      var imgs = boxes.map(function (b) { return $('img', b); }).filter(Boolean), s = o.s || .1;
      var st = { trigger: trig, start: o.st || 'top 85%', once: true };
      if (imgs.length) g.set(imgs, { transition: 'none' });
      /* o.to: las fotos con marco (outline) terminan con inset negativo para que el marco no quede recortado ni aparezca de golpe */
      g.fromTo(boxes, { clipPath: o.from || 'inset(100% 0% 0% 0%)' }, { clipPath: o.to || 'inset(0% 0% 0% 0%)', duration: 1.1 * k, stagger: s, ease: 'expo.inOut', clearProps: 'clipPath', scrollTrigger: st });
      if (!o.still && imgs.length) g.fromTo(imgs, { scale: 1.1 }, { scale: 1, duration: 1.5, stagger: s, ease: 'power3.out', clearProps: 'transform,transition', scrollTrigger: st });
    }
    function pulse(sel) {
      $$(sel).forEach(function (b) { b.classList.add('pulse'); setTimeout(function () { b.classList.remove('pulse'); }, 1800); });
    }

    /* ---------- HERO: visible desde el primer pintado ----------
       Sin animación de entrada que lo oculte (el título, los botones y la foto ya están en el HTML). Solo queda la salida con profundidad y el paralaje. */
    var fg = $('.hero figure'), fi = $('#hzs'), bg = $('.hero .bgv') || document.createElement('i'),
      txt = [$('.hero h1'), $('.hero .tx p')];
    if (D) {
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

    /* Salida del hero en capas: al bajar, cada bloque de texto se despide a distinta velocidad (solo transform, escritorio).
       El hero sigue visible desde el primer pintado: no hay animación de entrada que lo oculte. */
    if (D && $('.hero')) {
      var hl = g.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: .6 } });
      [['.hero .hlogo', -10], ['.hero h1', -24], ['.hero .tx > p', -36], ['.hero .tx .row', -48], ['.hero .tx .lk', -56], ['.hero .hcap', -22]].forEach(function (a) {
        var el = $(a[0]); if (el) hl.to(el, { y: a[1] }, 0);
      });
    }

    /* ---------- HERO · entrada cinematográfica (una sola vez) ----------
       La foto se descubre con máscara lateral mientras la escala baja desde 1.35; el título entra por palabra con sesgo y el resto con máscaras cortas.
       Solo transform/clip-path; nada bloquea clics y todo se limpia al terminar (el scrub de salida sigue funcionando). */
    function heroTitle(h) {
      if (!h || h._s) return []; h._s = 1;
      var eb = $('.h1n', h), nodes = Array.prototype.slice.call(h.childNodes).filter(function (n) { return n !== eb; });
      var rest = nodes.map(function (n) { return n.textContent; }).join(' ').trim().split(/\s+/).filter(Boolean);
      if (!rest.length) return [];
      h.setAttribute('aria-label', (eb ? eb.textContent.replace(/\s*:\s*$/, '') + ': ' : '') + rest.join(' '));
      nodes.forEach(function (n) { h.removeChild(n); });
      rest.forEach(function (w, i) {
        var o = document.createElement('span'), q = document.createElement('span');
        o.className = 'wl'; o.setAttribute('aria-hidden', 'true'); q.textContent = w; o.appendChild(q);
        if (i) h.appendChild(document.createTextNode(' '));
        h.appendChild(o);
      });
      return $$('.wl > span', h);
    }
    if (!window.__poerioIntro && $('.hero') && !(window.scrollY > innerHeight)) {
      window.__poerioIntro = 1;
      var hW = heroTitle($('.hero h1')), hI = $('#hs .hz.on img'), hT = g.timeline({ defaults: { ease: E } });
      var cp = function (a) { return { clipPath: a }; };
      if (fg) hT.fromTo(fg, cp('inset(0% 0% 0% 100%)'), { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.35 * k, ease: 'expo.inOut', clearProps: 'clipPath' }, 0);
      if (hI) hT.fromTo(hI, { scale: 1.35, xPercent: 6 }, { scale: 1, xPercent: 0, duration: 2.1, ease: 'power3.out', clearProps: 'transform' }, 0);
      [['.hero .hlogo', 'inset(0% 100% 0% 0%)', .12], ['.hero .h1n', 'inset(0% 100% 0% 0%)', .3]].forEach(function (a) {
        var el = $(a[0]); if (el) hT.fromTo(el, cp(a[1]), { clipPath: 'inset(0% 0% 0% 0%)', duration: .9 * k, ease: 'expo.inOut', clearProps: 'clipPath' }, a[2]);
      });
      if (hW.length) hT.from(hW, { yPercent: 118, skewY: 8, transformOrigin: '0% 100%', duration: 1.15 * k, stagger: .075, clearProps: 'transform',
        onComplete: function () { hW.forEach(function (w) { w.parentNode.style.overflow = 'visible'; }); } }, .38);
      var hp = $('.hero .tx > p'); if (hp) hT.fromTo(hp, cp('inset(0% 0% 100% 0%)'), { clipPath: 'inset(0% 0% 0% 0%)', duration: .9 * k, ease: 'expo.inOut', clearProps: 'clipPath' }, .85);
      var hb = $$('.hero .row .btn'); if (hb.length) hT.fromTo(hb, cp('inset(0% 100% 0% 0%)'), { clipPath: 'inset(-6% -6% -6% -6%)', duration: .85 * k, stagger: .1, ease: 'expo.inOut', clearProps: 'clipPath' }, 1);
      var hk = $('.hero .lk'); if (hk) hT.fromTo(hk, cp('inset(0% 100% 0% 0%)'), { clipPath: 'inset(0% 0% 0% 0%)', duration: .8 * k, ease: 'expo.inOut', clearProps: 'clipPath' }, 1.15);
      var hc = $('.hero .hcap'); if (hc) hT.fromTo(hc, cp('inset(100% 0% 0% 0%)'), { clipPath: 'inset(0% 0% 0% 0%)', duration: .9 * k, ease: 'expo.inOut', clearProps: 'clipPath' }, 1);
      var ha = $$('.hero .ha .btn'); if (ha.length) hT.fromTo(ha, cp('inset(100% 0% 0% 0%)'), { clipPath: 'inset(-6% -6% -6% -6%)', duration: .8 * k, stagger: .08, ease: 'expo.inOut', clearProps: 'clipPath' }, 1.2);
    }
    /* Salida: la foto viaja más lento que el scroll (profundidad entre capas) */
    if (!lite && fi && $('.hero')) g.to(fi, { yPercent: D ? 7 : 4, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

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
      cleanups.push(function () { var i = auto.subs.indexOf(sync); if (i > -1) auto.subs.splice(i, 1); });
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
          g.fromTo(W, { yPercent: 118, skewY: 6, transformOrigin: '0% 100%' }, { yPercent: 0, skewY: 0, duration: .7 * k, stagger: .045, delay: .1, ease: E, clearProps: 'transform' });
          g.fromTo(hm, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: .5, delay: .2, ease: E, clearProps: 'opacity,transform' });
          if (bg && bg.parentNode) g.to(bg, { opacity: 0, duration: .3, onComplete: function () { bg.src = $('img', A).src; g.to(bg, { opacity: 1, duration: 1, ease: 'power2.out', clearProps: 'opacity' }); } });
          if (started) tick(d.to);
        });
      };
      document.addEventListener('poerio:hero', onHero);
      cleanups.push(function () { document.removeEventListener('poerio:hero', onHero); if (prog) prog.kill(); prog = null; started = false; root.classList.remove('hg'); });
      on(document, 'visibilitychange', sync);
      ST.create({ trigger: hs, start: 'top bottom', end: 'bottom top', onToggle: function (s) { inView = s.isActive; sync(); } });
      /* deslizar en táctil: cambia de unidad en el sentido del gesto */
      var hv = $('.hv', hs), x0 = 0, y0 = 0;
      on(hv, 'pointerdown', function (e) { x0 = e.clientX; y0 = e.clientY; });
      on(hv, 'pointerup', function (e) { var dx = e.clientX - x0, dy2 = e.clientY - y0; if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy2) * 1.4) { var s2 = dx < 0 ? 1 : -1; H.go(H.i + s2, s2); } });
    }
    startSlider();   /* arranca la rotación (y la retoma tras redimensionar) */


    /* ---------- VENDER O PERMUTAR · una unidad por vez ----------
       Mismo gesto que el hero: máscara lateral según el sentido, foto que se asienta con contraparalaje y nombre por palabra.
       El progreso de cada unidad es el propio tween que la hace avanzar (se pausa con hover/foco, fuera de pantalla, en otra pestaña o con el estado compartido). */
    var VR = window.poerioVr, vrEl = $('#vr'), vsl = $$('.vrz', vrEl || document), vbt = $$('.vrr button', vrEl || document);
    var vn = $('#vrN'), vm = $('#vrM'), vi = $('#vrI'), vprog = null, vheld = 0, vin = false, vstarted = false;
    function vsync() { if (!vprog) return; (!auto.off && !vheld && vin && !document.hidden) ? vprog.play() : vprog.pause(); }
    function vtick(i) {
      if (vprog) vprog.kill();
      vbt.forEach(function (b, q) { g.set($('i', b), { scaleX: q < i ? 1 : 0 }); });
      vprog = g.to($('i', vbt[i]), { scaleX: 1, duration: 3.8, ease: 'none', onComplete: function () { VR.next(); } });
      vsync();
    }
    if (VR && vrEl && vsl.length > 1) {
      var r0 = vrEl.getBoundingClientRect(); vin = r0.top < innerHeight && r0.bottom > 0;
      root.classList.add('vg');
      auto.subs.push(vsync);
      cleanups.push(function () { var q = auto.subs.indexOf(vsync); if (q > -1) auto.subs.splice(q, 1); });
      var onVr = function (e) {
        ctx.add(function () {
          var d = e.detail, A = vsl[d.to], B = vsl[d.from], iA = $('img', A), iB = $('img', B), dir = d.dir;
          vsl.forEach(function (x) { if (x !== A && x !== B) { x.classList.remove('lv'); g.set(x, { clearProps: 'clipPath,zIndex' }); } });
          g.killTweensOf([A, B, iA, iB]);
          B.classList.add('lv'); g.set(B, { zIndex: 1, clipPath: 'inset(0% 0% 0% 0%)' }); g.set(A, { zIndex: 2 });
          g.fromTo(A, { clipPath: dir > 0 ? 'inset(0% 0% 0% 100%)' : 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: .9 * k, ease: 'expo.inOut', clearProps: 'clipPath,zIndex',
            onComplete: function () { B.classList.remove('lv'); g.set(B, { clearProps: 'zIndex,clipPath' }); g.set(iB, { clearProps: 'transform' }); } });
          g.fromTo(iA, { scale: 1.16, xPercent: 8 * dir }, { scale: 1, xPercent: 0, duration: 1.4, ease: 'power3.out', clearProps: 'transform' });
          g.to(iB, { xPercent: -6 * dir, duration: .9 * k, ease: 'expo.inOut' });
          var W = split(vn, true);
          g.fromTo(W, { yPercent: 118, skewY: 6, transformOrigin: '0% 100%' }, { yPercent: 0, skewY: 0, duration: .7 * k, stagger: .045, delay: .15, ease: E, clearProps: 'transform' });
          g.fromTo([vm, vi], { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: .5, delay: .25, ease: E, clearProps: 'opacity,transform' });
          if (vstarted) vtick(d.to);
        });
      };
      document.addEventListener('poerio:vr', onVr);
      cleanups.push(function () { document.removeEventListener('poerio:vr', onVr); if (vprog) vprog.kill(); vprog = null; vstarted = false; root.classList.remove('vg'); });
      on(document, 'visibilitychange', vsync);
      if (fine) { on(vrEl, 'pointerenter', function () { vheld |= 1; vsync(); }); on(vrEl, 'pointerleave', function () { vheld &= ~1; vsync(); }); }
      on(vrEl, 'focusin', function () { vheld |= 2; vsync(); });
      on(vrEl, 'focusout', function () { vheld &= ~2; vsync(); });
      ST.create({ trigger: vrEl, start: 'top bottom', end: 'bottom top', onToggle: function (s2) { vin = s2.isActive; vsync(); } });
      /* deslizar en táctil: cambia de unidad en el sentido del gesto */
      var vx0 = 0, vy0 = 0;
      on(vrEl, 'pointerdown', function (e) { vx0 = e.clientX; vy0 = e.clientY; });
      on(vrEl, 'pointerup', function (e) { if (e.target.closest('.g-a, .vrr')) return; var dx = e.clientX - vx0, dy2 = e.clientY - vy0; if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy2) * 1.4) { var s3 = dx < 0 ? 1 : -1; VR.go(VR.i + s3, s3); } });
      vstarted = true; vtick(VR.i);
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

    /* ---------- FICHA: se abre desde la tarjeta tocada; la foto se revela con máscara y el contenido entra escalonado ---------- */
    var dlg = $('#dlg'), was = false, ox = 0, oy = 0;
    grid.addEventListener('click', function (e) {
      var c = e.target.closest('.car'); if (!c) return;
      var r = $('.im', c).getBoundingClientRect();
      ox = r.left + r.width / 2 - innerWidth / 2; oy = r.top + r.height / 2 - innerHeight / 2;
    }, true);
    dlg.addEventListener('close', function () { was = false; });
    var mo2 = new MutationObserver(function () {
      var fresh = dlg.open && !was; was = dlg.open;
      if (!dlg.open) return;
      if (fresh) {
        var w = dlg.offsetWidth, h = dlg.offsetHeight;
        g.fromTo(dlg, { opacity: 0, scale: D ? .92 : .97, x: ox * .08, y: oy * .08 + 18, transformOrigin: (w / 2 + ox) + 'px ' + (h / 2 + oy) + 'px' },
          { opacity: 1, scale: 1, x: 0, y: 0, duration: .75, ease: E, clearProps: 'opacity,transform,transformOrigin', overwrite: 'auto' });
      }
      var stage = $('.fcs', dlg), im0 = $('.ct img', dlg);
      if (stage) g.fromTo(stage, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1 * k, ease: 'expo.inOut', delay: fresh ? .12 : 0, clearProps: 'clipPath', overwrite: 'auto' });
      if (im0) g.fromTo(im0, { scale: 1.12 }, { scale: 1, duration: 1.6, ease: 'power3.out', delay: fresh ? .12 : 0, clearProps: 'transform', overwrite: 'auto' });
      var t = $$('.fcb > *, .fcft', dlg);
      if (t.length) g.from(t, { opacity: 0, y: D ? 14 : 10, duration: .6, stagger: .05, delay: fresh ? .3 : .08, ease: E, clearProps: 'opacity,transform', overwrite: 'auto' });
    });
    mo2.observe(dlg, { childList: true });


    /* ---------- CURSOR del catálogo: "Ver ficha" sigue al mouse sobre la foto de cada tarjeta (solo mouse) ---------- */
    if (fine) {
      var cu = document.createElement('div'); cu.className = 'cur'; cu.setAttribute('aria-hidden', 'true'); cu.innerHTML = '<span>Ver ficha</span>'; document.body.appendChild(cu);
      var cqx = g.quickTo(cu, 'x', { duration: .45, ease: 'power3.out' }), cqy = g.quickTo(cu, 'y', { duration: .45, ease: 'power3.out' }), cOn = false;
      var cshow = function (v, e) {
        if (v === cOn) return; cOn = v; root.classList.toggle('cur-on', v);
        if (v && e) g.set(cu, { x: e.clientX, y: e.clientY });
        g.to(cu, { scale: v ? 1 : 0, opacity: v ? 1 : 0, duration: .45, ease: E, overwrite: 'auto' });
      };
      on(grid, 'pointermove', function (e) {
        if (e.pointerType && e.pointerType !== 'mouse') return;
        var im = e.target.closest && e.target.closest('.im'), over = !!im && !e.target.closest('.g-a');
        if (over) { cqx(e.clientX); cqy(e.clientY); }
        cshow(over, e);
      });
      on(grid, 'pointerleave', function () { cshow(false); });
      on(window, 'scroll', function () { cshow(false); }, { passive: true });
      on(dlg, 'click', function () { cshow(false); }, true);
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
    var bdI = $('.bdm img');
    if (bdI) {
      g.set(bdI, { scale: 1.06 });
      g.fromTo(bdI, { yPercent: D ? -2.5 : -1.5 }, { yPercent: D ? 2.5 : 1.5, ease: 'none', scrollTrigger: { trigger: '.bd', start: 'top bottom', end: 'bottom top', scrub: true } });
    }
    words($('.bd h2'), '.bd');
    reveal($$('.bd .bde, .bd .btn'), '.bd', { y: 18, st: 'top 75%', nt: 1 });

    /* ---------- FAQ (foto) y marca del pie ---------- */
    photos($$('.fq'), '.faq', { s: .1, st: 'top 85%' });
    reveal($$('.fl .sub'), '.faq', { st: 'top 85%' });

    /* ---------- BLOQUES: mismo gesto en todo el sitio ---------- */
    words($('.ops h2'), '.ops');
    reveal($$('.ops .oh .sub'), '.ops');
    reveal($$('.oc'), '.og', { s: .1, st: 'top 88%', nt: 1 });
    photos($$('.oi'), '.og', { s: .1, st: 'top 88%' });

    /* Collage "Contanos tu auto": máscara escalonada; en escritorio, cada foto con su propia velocidad (±3–5%) */
    reveal($$('.fm > div:first-child > :not(.vr):not(.stp)'), '.fm', { s: .12, st: 'top 85%' });
    reveal($$('.stp li'), '.stp', { s: .14, y: 22, st: 'top 88%' });
    photos([$('#vr')], '#vr', { st: 'top 88%', still: true, from: D ? 'inset(0% 100% 0% 0%)' : 'inset(0% 0% 100% 0%)' });
    reveal($$('.fm form'), '.fm form', { st: 'top 88%' });

    /* Mapa: se descubre con máscara y el mapa se asienta; el panel de dirección entra escalonado */
    /* El mapa no se anima: un iframe con opacidad animada al llegar causaba tirones; se carga en reposo desde index.html */
    reveal([$('.lc')], '.loc', { st: 'top 65%' });
    reveal($$('.lc > *'), '.loc', { st: 'top 65%', s: .09, y: 18, d: .25 });
    words($('.faq h2'), '.faq');
    reveal($$('.faq details'), '.faq details', { y: 16, s: .06, st: 'top 90%' });
    reveal($$('.fin'), '.fin', { y: 12, st: 'top 95%' });
    reveal($$('footer .lg'), 'footer', { y: 16, st: 'top 92%' });
    reveal($$('footer .w > :not(.lg)'), 'footer', { y: 12, s: .07, d: .15, st: 'top 96%' });

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

    /* ---------- v6 · mismo lenguaje en todas las secciones ----------
       Título por palabra + bajada y etiqueta con subida corta; las listas entran escalonadas con la misma curva.
       Sin lógica nueva: se reutilizan reveal / words / photos. */
    $$('.pdl, .hwh, .eqh, .rvh, .mdh, .rec .rh').forEach(function (h) {
      var t = $('h2', h); if (t) words(t, h);
      reveal($$('.pde, .pdt, .ey, .mdt, .mdk, :scope > p', h).filter(function (x) { return !t || !t.contains(x); }), h, { s: .08, y: dy * .6, st: 'top 80%' });
    });
    reveal($$('.hwl li'), '.hwl', { s: .1, st: 'top 85%' });
    reveal($$('.pdg .pdc'), '.pdg', { s: .09, y: dy * .6, st: 'top 88%', nt: 1 });
    reveal($$('.gd details'), '.gd', { s: .08, y: dy * .6, st: 'top 88%' });
    reveal($$('.pdr .btn, .eqc .btn, .hwr .btn, .rvr .btn'), '.pdr, .eqc, .hwr, .rvr', { s: .08, y: 14, st: 'top 92%', nt: 1 });
    /* Tarjeta de contacto: cada dato entra después de la tarjeta */
    reveal($$('.ci .cit, .ci .cia .btn, .ci .cis > *'), '.ci', { s: .05, y: 14, d: .2, st: 'top 80%', nt: 1 });
    /* Equipo: fotos con máscara; el video del ingreso va a otra velocidad (escritorio) */
    photos([$('.eqf .eqm')], '.eqg', { to: 'inset(-3% -3% -3% -3%)', st: 'top 82%' });
    photos([$('.eqv .eqm')], '.eqg', { to: 'inset(-3% -3% -3% -3%)', from: D ? 'inset(0% 0% 0% 100%)' : 'inset(0% 0% 100% 0%)', st: 'top 82%', s: .18, still: true });
    reveal($$('.eqk li'), '.eqk', { s: .1, st: 'top 88%' });
    /* Cómo llegar: datos, escena (máscara) y texto del recorrido */
    reveal($$('.rtg > div'), '.rtg', { s: .07, y: 16, st: 'top 90%' });
    reveal($$('.rq .rqb'), '.rq', { s: .06, y: 14, d: .15, st: 'top 85%', nt: 1 });
    var rsc = $('.rs');
    if (rsc) g.fromTo(rsc, { clipPath: D ? 'inset(0% 100% 0% 0%)' : 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(-3% -3% -3% -3%)', duration: 1.2 * k, ease: 'expo.inOut', clearProps: 'clipPath', scrollTrigger: { trigger: rsc, start: 'top 82%', once: true } });
    reveal($$('.rec .rg'), '.rec .rx', { y: 20, d: .25, st: 'top 78%' });

    /* Profundidad (solo escritorio): fondos con interior de vehículo y fotos a distinta velocidad.
       Todo con transform; el fondo se mueve con una variable CSS no heredable (--bgy), que solo recalcula el propio fondo. */
    if (D) {
      root.classList.add('bgp');
      cleanups.push(function () { root.classList.remove('bgp'); });
      ['#financiacion', '#visita', '#guia'].forEach(function (id) {
        var sc = $(id); if (!sc) return;
        g.fromTo(sc, { '--bgy': '-5%' }, { '--bgy': '5%', ease: 'none', scrollTrigger: { trigger: sc, start: 'top bottom', end: 'bottom top', scrub: true } });
      });
      var nph = $('#nph');
      if (nph) g.fromTo(nph, { y: 26 }, { y: -26, ease: 'none', scrollTrigger: { trigger: '#nosotros', start: 'top bottom', end: 'bottom top', scrub: .6 } });
      var eqv = $('.eqv');
      if (eqv) g.fromTo(eqv, { y: 40 }, { y: -40, ease: 'none', scrollTrigger: { trigger: '.eqg', start: 'top bottom', end: 'bottom top', scrub: .6 } });
    }

    /* Avisos de estado (copiar dirección, formularios): aparecen con el mismo gesto corto */
    $$('.fs, .rqs').forEach(function (el) {
      if (el.id === 'fStatus') return;
      var mx = new MutationObserver(function () { if (el.textContent.trim()) g.fromTo(el, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: .45, ease: E, clearProps: 'opacity,transform', overwrite: 'auto' }); });
      mx.observe(el, { childList: true, characterData: true, subtree: true });
      cleanups.push(function () { mx.disconnect(); });
    });

    /* ---------- Progreso de lectura: línea fina bajo el header (solo transform) ---------- */
    var pb = $('.pgb') || header.appendChild(Object.assign(document.createElement('i'), { className: 'pgb', ariaHidden: 'true' }));
    g.to(pb, { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: .3 } });

    /* ---------- CAPÍTULOS: una línea fina se dibuja con el scroll al entrar en cada sección ---------- */
    if (!lite) ['#unidades', '#versus', '#operaciones', '#contacto', '#preguntas'].forEach(function (id) {
      var sc = $(id); if (!sc) return;
      var ln = document.createElement('i'); ln.setAttribute('aria-hidden', 'true');
      ln.style.cssText = 'display:block;height:1px;width:min(1180px,calc(100% - 40px));margin:0 auto;background:var(--lux,#5cb8d0);opacity:.6;transform-origin:0 50%;pointer-events:none';
      sc.insertBefore(ln, sc.firstChild);
      cleanups.push(function () { if (ln.parentNode) ln.parentNode.removeChild(ln); });
      g.fromTo(ln, { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: sc, start: 'top 92%', end: 'top 40%', scrub: .4 } });
    });

    /* ---------- BANNER: el marco se abre con el scroll (la foto pasa de ventana a pantalla completa) ---------- */
    if (D && !lite && $('.bdm')) g.fromTo($('.bdm'), { clipPath: 'inset(9% 7% 9% 7%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', scrollTrigger: { trigger: '.bd', start: 'top 95%', end: 'top 20%', scrub: .5 } });

    /* ---------- TARJETAS: inclinación 3D con respuesta del puntero (solo mouse, escritorio) ---------- */
    if (D && fine && !lite) {
      var tl2 = null, tq = null;
      on(grid, 'pointermove', function (e) {
        if (e.pointerType && e.pointerType !== 'mouse') return;
        var c = e.target.closest && e.target.closest('.car'), im = c && $('.im', c);
        if (tl2 && tl2 !== im) { g.to(tl2, { rotationX: 0, rotationY: 0, duration: .8, ease: 'elastic.out(1,.6)', overwrite: 'auto' }); tl2 = null; }
        if (!im) return;
        if (tl2 !== im) { tl2 = im; g.set(im, { transformPerspective: 900 }); tq = [g.quickTo(im, 'rotationX', { duration: .5, ease: 'power3.out' }), g.quickTo(im, 'rotationY', { duration: .5, ease: 'power3.out' })]; }
        var r = im.getBoundingClientRect();
        tq[0](((e.clientY - r.top) / r.height - .5) * -6); tq[1](((e.clientX - r.left) / r.width - .5) * 8);
      });
      on(grid, 'pointerleave', function () { if (tl2) g.to(tl2, { rotationX: 0, rotationY: 0, duration: .8, ease: 'elastic.out(1,.6)', overwrite: 'auto', clearProps: 'transform,transformPerspective' }); tl2 = null; });
    }

    /* ---------- BOTONES: atracción magnética (mouse) + presión táctil (todos) ---------- */
    if (D && fine && !lite) {
      $$('.hero .btn, .bd .btn, .loc .btn, .ci .btn, .eqc .btn, .pdr .btn, .hwr .btn, .rvr .btn').forEach(function (b) {
        var bx = g.quickTo(b, 'x', { duration: .6, ease: 'power3.out' }), by = g.quickTo(b, 'y', { duration: .6, ease: 'power3.out' });
        on(b, 'pointermove', function (e) {
          if (e.pointerType && e.pointerType !== 'mouse') return;
          var r = b.getBoundingClientRect();
          bx((e.clientX - (r.left + r.width / 2)) * .22); by((e.clientY - (r.top + r.height / 2)) * .3);
        });
        on(b, 'pointerleave', function () { g.to(b, { x: 0, y: 0, duration: .9, ease: 'elastic.out(1,.5)', overwrite: 'auto', clearProps: 'transform' }); });
      });
    }
    var pressed = null;
    function rel() { if (!pressed) return; var b = pressed; pressed = null; g.to(b, { scale: 1, duration: .6, ease: 'elastic.out(1,.55)', overwrite: 'auto', clearProps: 'scale' }); }
    on(document, 'pointerdown', function (e) {
      var b = e.target.closest && e.target.closest('.btn, .chip'); if (!b || b.disabled) return;
      pressed = b; g.to(b, { scale: .955, duration: .18, ease: 'power2.out', overwrite: 'auto' });
    }, true);
    on(document, 'pointerup', rel, true); on(document, 'pointercancel', rel, true); on(document, 'dragend', rel, true);

    /* ---------- Velocidad de scroll: las tarjetas del catálogo respiran apenas (escala ±) al desplazarse rápido ---------- */
    if (D && !lite) {
      var vq = g.quickTo(grid, 'scale', { duration: .6, ease: 'power3.out' }), vTO = 0;
      ST.create({ trigger: grid, start: 'top bottom', end: 'bottom top', onUpdate: function (s) {
        vq(1 - Math.min(.012, Math.abs(s.getVelocity()) / 90000)); clearTimeout(vTO); vTO = setTimeout(function () { vq(1); }, 120);
      } });
      cleanups.push(function () { clearTimeout(vTO); g.set(grid, { clearProps: 'scale' }); });
    }

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
          if (s.isActive && !pulsed) { pulsed = true;  }
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
