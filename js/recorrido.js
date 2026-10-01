/* Recorrido del local (#local), video del equipo (#equipo) y entrada de las fotos de secciones pendientes. Sin dependencias. */
(function () {
  var d = document, R = d.documentElement;
  R.classList.add('rj');
  var rm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return [].slice.call((c || d).querySelectorAll(s)); }
  function play(v) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }

  /* Fotos de secciones pendientes: entran una sola vez */
  var figs = $$('.pp .ppf');
  if (rm || !('IntersectionObserver' in window)) figs.forEach(function (f) { f.classList.add('in'); });
  else {
    var fo = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); fo.unobserve(e.target); } });
    }, { threshold: .18 });
    figs.forEach(function (f) { fo.observe(f); });
  }

  /* Recorrido: los cuatro pasos se suceden solos, en bucle continuo (la escena y el texto cambian juntos).
     Cada cambio avisa con el evento poerio:local para que motion.js lo anime (máscara + texto por palabra). */
  var st = $('#vj');
  if (st) {
    var L = $$('.vl', st), C = $$('.vi', st), N = $$('.vt button', st),
        v = $('#rvid'), nn = $('#rn'),
        DUR = [7000, 6500, 12000, 7000], cur = 0, tm = 0, vis = false;

    N.forEach(function (b, k) { b.style.setProperty('--d', DUR[k] + 'ms'); });

    function stop() { clearTimeout(tm); tm = 0; if (v) v.pause(); }
    function go(i) {
      clearTimeout(tm); tm = 0;
      var prev = cur;
      cur = i;
      L.forEach(function (l, k) { l.classList.toggle('on', k === i); });
      C.forEach(function (c, k) { c.classList.toggle('on', k === i); });
      N.forEach(function (b, k) {
        b.classList.remove('on'); b.classList.toggle('done', k < i || rm);
        if (k === i) { void b.offsetWidth; b.classList.add('on'); }
      });
      st.setAttribute('data-c', i);
      if (nn) nn.textContent = '0' + (i + 1);
      if (v) { if (i === 2 && vis && !rm) { try { v.currentTime = 0; } catch (e) {} play(v); } else v.pause(); }
      if (prev !== i) d.dispatchEvent(new CustomEvent('poerio:local', { detail: { from: prev, to: i, dir: (prev === L.length - 1 && i === 0) || i > prev ? 1 : -1 } }));
      if (vis && !rm && !d.hidden) tm = setTimeout(function () { go((cur + 1) % L.length); }, DUR[i]);
    }

    N.forEach(function (b, k) { b.addEventListener('click', function () { if (k !== cur) go(k); }); });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        var n = es[0].isIntersecting;
        if (n === vis) return;
        vis = n;
        if (vis) go(cur); else stop();
      }, { threshold: .15 }).observe(st);
    }
    d.addEventListener('visibilitychange', function () { if (d.hidden) stop(); else if (vis) go(cur); });
    go(0);
  }

  /* Video del equipo: corre en bucle mientras está a la vista */
  var r = $('#eqv');
  if (r && 'IntersectionObserver' in window) {
    var rv = false;
    new IntersectionObserver(function (es) {
      rv = es[0].isIntersecting;
      if (rv && !rm) play(r); else r.pause();
    }, { threshold: .4 }).observe(r);
    d.addEventListener('visibilitychange', function () { if (d.hidden) r.pause(); else if (rv && !rm) play(r); });
  }
})();
