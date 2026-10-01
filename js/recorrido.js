/* Recorrido del local (#local), video del equipo (#equipo) y entrada de las fotos de secciones pendientes. Sin dependencias.

   Reparto de tareas (no se pisan):
   · recorrido.js  → estado, tiempos, reproducción de video, gestos y teclado. Solo alterna clases y atributos.
   · motion.js     → toda la coreografía visual (deslizamiento de escenas, máscara, texto por palabra, número). Se entera de cada
                     cambio por el evento poerio:local ({from, to, dir}), igual que antes.

   Principios de esta versión:
   · Un único reloj por paso, con pausa y reanudación reales: salir de la sección, cambiar de pestaña o tocar el escenario
     congela el paso (y su barra de progreso) donde estaba y lo retoma sin reiniciarlo.
   · Cero trabajo por fotograma: ni rAF ni polling. Un setTimeout por paso; las barras corren en el compositor (CSS).
   · Un solo punto de entrada para el entorno (visibilidad de pestaña, bfcache, prefers-reduced-motion en vivo).
   · Todos los listeners y observadores quedan registrados y se liberan al descargar la página. */
(function () {
  'use strict';
  var d = document, R = d.documentElement;
  R.classList.add('rj');

  var mq = matchMedia('(prefers-reduced-motion: reduce)'), rm = mq.matches;
  var hasIO = 'IntersectionObserver' in window;
  var cn = navigator.connection || {};
  var lean = !!cn.saveData || /(^|-)2g$/.test(cn.effectiveType || '');   /* ahorro de datos: no se precarga el video */
  var gone = false;                                                      /* la página se está yendo (bfcache / cierre) */

  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return [].slice.call((c || d).querySelectorAll(s)); }
  function now() { return performance.now(); }
  function away() { return d.hidden || gone; }
  /* play() sin ruido: si el navegador lo bloquea (autoplay) se avisa a quien lo pidió */
  function play(v, onBlock) {
    var p = v.play();
    if (p && p.catch) p.catch(function (e) { if (onBlock && e && e.name === 'NotAllowedError') onBlock(); });
  }

  /* ---------- Registro de recursos (se liberan juntos) ---------- */
  var disposers = [], subs = [];
  function listen(t, type, fn, opt) { t.addEventListener(type, fn, opt); disposers.push(function () { t.removeEventListener(type, fn, opt); }); }
  function watch(el, cb, opt) {
    var o = new IntersectionObserver(cb, opt); o.observe(el);
    disposers.push(function () { o.disconnect(); });
    return o;
  }

  /* ---------- Entorno: un solo juego de listeners para todo el archivo ---------- */
  function env() { subs.forEach(function (f) { f(); }); }
  listen(d, 'visibilitychange', env);
  listen(window, 'pagehide', function (e) {
    gone = true; env();
    if (!e.persisted) { disposers.forEach(function (f) { f(); }); disposers.length = subs.length = 0; }
  });
  listen(window, 'pageshow', function () { if (gone) { gone = false; env(); } });
  var onMq = function () { rm = mq.matches; env(); };
  if (mq.addEventListener) { mq.addEventListener('change', onMq); disposers.push(function () { mq.removeEventListener('change', onMq); }); }
  else if (mq.addListener) { mq.addListener(onMq); disposers.push(function () { mq.removeListener(onMq); }); }

  /* ================= Fotos de secciones pendientes: entran una sola vez ================= */
  (function () {
    var figs = $$('.pp .ppf');
    if (!figs.length) return;
    function all() { figs.forEach(function (f) { f.classList.add('in'); }); }
    if (rm || !hasIO) { all(); return; }
    var left = figs.length;
    var fo = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in'); fo.unobserve(e.target);
        if (--left === 0) fo.disconnect();
      });
    }, { threshold: .18 });
    figs.forEach(function (f) { fo.observe(f); });
    disposers.push(function () { fo.disconnect(); });
    subs.push(function () { if (rm) { all(); fo.disconnect(); } });
  })();

  /* ================= Recorrido: cuatro pasos en bucle continuo =================
     La escena y el texto cambian juntos. Cada cambio avisa con poerio:local (motion.js lo anima). */
  (function () {
    var st = $('#vj');
    if (!st) return;
    var L = $$('.vl', st), C = $$('.vi', st), N = $$('.vt button', st), B = N.map(function (b) { return $('i', b); }),
        vv = $('.vv', st), v = $('#rvid'), nn = $('#rn'), n = L.length,
        DUR = [7000, 6500, 12000, 7000],
        cur = 0, remain = DUR[0], t0 = 0, tm = 0, vtm = 0,
        running = false, fresh = false, lastRm = rm,
        vis = !hasIO,          /* sin IntersectionObserver se considera siempre visible */
        hold = 0;              /* 1 = foco de teclado dentro del recorrido · 2 = dedo apoyado sobre el escenario */
    if (!n) return;

    N.forEach(function (b, k) { b.style.setProperty('--d', (DUR[k] || 7000) + 'ms'); });

    /* --- Video del paso 3: arranca cuando la escena ya se asentó; se retoma donde quedó --- */
    function vstop() { clearTimeout(vtm); vtm = 0; if (v && !v.paused) v.pause(); }
    function vstart() {
      if (!v || rm) return;
      clearTimeout(vtm);
      var wait = fresh ? 480 : 0; fresh = false;
      if (!wait) { play(v); return; }
      vtm = setTimeout(function () { vtm = 0; if (running && cur === 2) play(v); }, wait);
    }

    /* --- Reloj del paso: pausa/reanuda sin perder lo avanzado; la barra CSS se congela con él --- */
    function want() { return vis && !rm && !hold && !away(); }
    function pause() {
      if (running) {
        running = false; clearTimeout(tm); tm = 0;
        remain = Math.max(250, remain - (now() - t0));
        if (B[cur]) B[cur].style.animationPlayState = 'paused';
      }
      vstop();
    }
    function resume() {
      if (running) return;
      running = true; t0 = now(); tm = setTimeout(next, remain);
      if (B[cur]) B[cur].style.animationPlayState = '';
      if (cur === 2) vstart();
    }
    function sync() { if (want()) resume(); else pause(); }
    function next() { tm = 0; go((cur + 1) % n); }

    /* --- Cambio de paso: solo clases/atributos; el resto es de motion.js y del CSS --- */
    function go(i, dir) {
      var prev = cur;
      clearTimeout(tm); tm = 0; running = false; vstop();
      cur = i; remain = DUR[i] || 7000; fresh = (i === 2);
      for (var k = 0; k < n; k++) {
        var on = k === i, b = N[k];
        L[k].classList.toggle('on', on);
        if (C[k]) C[k].classList.toggle('on', on);
        if (!b) continue;
        b.classList.toggle('done', k < i || rm);
        if (B[k]) B[k].style.animationPlayState = on ? 'paused' : '';   /* nace en pausa: sync() la libera en el mismo turno */
        if (on) {
          if (b.classList.contains('on')) { b.classList.remove('on'); void b.offsetWidth; }   /* solo en el arranque: reinicia la barra */
          b.classList.add('on'); b.setAttribute('aria-current', 'step');
        } else { b.classList.remove('on'); b.removeAttribute('aria-current'); }
      }
      st.setAttribute('data-c', i);
      if (nn) nn.textContent = '0' + (i + 1);
      if (v && i === 2 && !rm) { try { if (v.currentTime > .05) v.currentTime = 0; } catch (e) {} }
      if (prev !== i) {
        if (!dir) dir = ((prev === n - 1 && i === 0) || i > prev) ? 1 : -1;
        d.dispatchEvent(new CustomEvent('poerio:local', { detail: { from: prev, to: i, dir: dir } }));
      }
      sync();
    }

    /* --- Botones de paso (y teclado: ← → Inicio Fin) --- */
    N.forEach(function (b, k) { listen(b, 'click', function () { if (k !== cur) go(k); }); });
    var nav = $('.vt', st);
    if (nav) listen(nav, 'keydown', function (e) {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      var at = N.indexOf(e.target.closest ? e.target.closest('button') : null), j = -1;
      if (at < 0) return;
      if (e.key === 'ArrowRight') j = (at + 1) % n;
      else if (e.key === 'ArrowLeft') j = (at - 1 + n) % n;
      else if (e.key === 'Home') j = 0;
      else if (e.key === 'End') j = n - 1;
      if (j < 0) return;
      e.preventDefault(); N[j].focus();
      if (j !== cur) go(j);
    });

    /* --- Quien navega con teclado manda: el paso se queda quieto mientras el foco visible está dentro --- */
    listen(st, 'focusin', function (e) {
      var kv = false; try { kv = e.target.matches(':focus-visible'); } catch (x) {}
      if (kv && !(hold & 1)) { hold |= 1; sync(); }
    });
    listen(st, 'focusout', function (e) {
      if ((hold & 1) && !st.contains(e.relatedTarget)) { hold &= ~1; sync(); }
    });

    /* --- Gesto táctil: deslizar el escenario cambia de paso; mientras el dedo está apoyado el reloj se detiene --- */
    if (vv) {
      var px = 0, py = 0, pid = -1;
      vv.style.touchAction = 'pan-y';   /* el desplazamiento vertical sigue siendo del navegador; el horizontal es nuestro */
      var release = function (e, ok) {
        if (e.pointerId !== pid) return;
        pid = -1; hold &= ~2;
        var dx = e.clientX - px, dy = e.clientY - py;
        if (ok && Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(dy) * 1.4) { var s = dx < 0 ? 1 : -1; go((cur + s + n) % n, s); }
        else sync();
      };
      listen(vv, 'pointerdown', function (e) {
        if (e.pointerType === 'mouse' || pid !== -1) return;
        pid = e.pointerId; px = e.clientX; py = e.clientY; hold |= 2; sync();
      }, { passive: true });
      listen(vv, 'pointerup', function (e) { release(e, true); }, { passive: true });
      listen(vv, 'pointercancel', function (e) { release(e, false); }, { passive: true });
    }

    /* --- Visibilidad: el recorrido solo corre mientras se ve; al volver retoma el mismo paso, sin reiniciar --- */
    if (hasIO) {
      watch(st, function (es) {
        var nv = es[es.length - 1].isIntersecting;
        if (nv === vis) return;
        vis = nv; sync();
      }, { threshold: .15 });
      /* El video del paso 3 empieza a bajar cuando la sección está a poco más de una pantalla */
      if (v && !lean) {
        var po = watch(st, function (es) {
          if (!es[es.length - 1].isIntersecting) return;
          v.preload = 'auto'; po.disconnect();
        }, { rootMargin: '120% 0px' });
      }
    }

    /* --- Entorno: pestaña oculta, bfcache y prefers-reduced-motion en vivo --- */
    subs.push(function () {
      if (rm !== lastRm) { lastRm = rm; go(cur); return; }   /* reconstruye barras y video con el nuevo modo */
      sync();
    });

    go(0);
  })();

  /* ================= Video del equipo: en bucle mientras está a la vista; el botón lo pausa ================= */
  (function () {
    var r = $('#eqv'), pb = $('.eqvb');
    if (!r) return;
    var rv = false, held = rm, blocked = false;   /* held: pausa elegida · blocked: el navegador no dejó arrancar solo */

    function ui() {
      if (!pb) return;
      var p = held || blocked;
      pb.classList.toggle('is-paused', p);
      pb.setAttribute('aria-pressed', p ? 'true' : 'false');
      pb.setAttribute('aria-label', p ? 'Reproducir video' : 'Pausar video');
    }
    function blockedNow() { blocked = true; ui(); }
    function apply() { if (rv && !held && !away()) play(r, blockedNow); else r.pause(); }

    ui();
    listen(r, 'playing', function () { if (blocked) { blocked = false; ui(); } });
    if (pb) listen(pb, 'click', function () {
      if (blocked) { held = false; blocked = false; ui(); play(r); return; }   /* el toque es el gesto que faltaba */
      held = !held; ui(); apply();
    });
    if (hasIO) watch(r, function (es) { rv = es[es.length - 1].isIntersecting; apply(); }, { threshold: .4 });
    subs.push(function () { if (rm && !held) { held = true; ui(); } apply(); });
  })();
})();
