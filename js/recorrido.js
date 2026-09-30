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

  /* Botones de video: pausar y sonido */
  function wire(v, pb, man) {
    function label() { pb.textContent = v.paused ? 'Reproducir' : 'Pausar'; pb.setAttribute('aria-label', v.paused ? 'Reproducir el video' : 'Pausar el video'); }
    v.addEventListener('play', label); v.addEventListener('pause', label); label();
    pb.addEventListener('click', function () { if (v.paused) { man.v = false; play(v); } else { man.v = true; v.pause(); } });
  }

  /* Recorrido: capítulos que cambian la escena */
  var st = $('#local .rs');
  if (st && 'IntersectionObserver' in window) {
    var L = $$('#local .rl'), C = $$('#local .rcc'), B = $$('#local .rb i'),
        v = $('#rvid'), pb = $('#rvp'), sb = $('#rvs'), nn = $('#rn'), tt = $('#rt'),
        man = { v: false }, cur = -1, vis = false;
    if (v && pb) wire(v, pb, man);
    if (v && sb) sb.addEventListener('click', function () {
      v.muted = !v.muted; sb.setAttribute('aria-pressed', v.muted ? 'false' : 'true');
      sb.setAttribute('aria-label', v.muted ? 'Activar el sonido del video' : 'Silenciar el video');
    });
    function sync() { if (!v) return; if (vis && cur === 2 && !rm && !man.v) play(v); else v.pause(); }
    function set(i) {
      if (i < 0 || i === cur) return;
      cur = i;
      L.forEach(function (l, k) { l.classList.toggle('on', k === i); });
      C.forEach(function (c, k) { c.classList.toggle('on', k === i); });
      B.forEach(function (b, k) { b.classList.toggle('on', k <= i); });
      st.setAttribute('data-c', i);
      nn.textContent = '0' + (i + 1);
      tt.textContent = C[i].getAttribute('data-t');
      sync();
    }
    var mq = matchMedia('(min-width:900px)'), io;
    function mk() {
      if (io) io.disconnect();
      io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) set(C.indexOf(e.target)); });
      }, { rootMargin: mq.matches ? '-40% 0px -40% 0px' : '-58% 0px -18% 0px' });
      C.forEach(function (c) { io.observe(c); });
    }
    mk();
    if (mq.addEventListener) mq.addEventListener('change', mk); else mq.addListener(mk);
    new IntersectionObserver(function (es) { vis = es[0].isIntersecting; sync(); }).observe($('#local'));
    d.addEventListener('visibilitychange', function () { if (d.hidden && v) v.pause(); else sync(); });
    set(0);
  }

  /* Video del equipo: corre a la vista, con botón de pausa */
  var r = $('#eqv'), rp = $('#eqp');
  if (r && rp && 'IntersectionObserver' in window) {
    var m2 = { v: false }, rv = false;
    wire(r, rp, m2);
    new IntersectionObserver(function (es) {
      rv = es[0].isIntersecting;
      if (rv && !rm && !m2.v) play(r); else r.pause();
    }, { threshold: .4 }).observe(r);
    d.addEventListener('visibilitychange', function () { if (d.hidden) r.pause(); else if (rv && !rm && !m2.v) play(r); });
  }
})();
