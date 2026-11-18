(function () {
  var root = document.documentElement, KEY = 'work-notes-theme';
  root.classList.add('js');
  var still = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  if (still) root.classList.add('still');

  var themeBtn = document.getElementById('themeBtn');
  function label() { themeBtn.setAttribute('aria-label', root.getAttribute('data-theme') === 'dark' ? '밝은 화면으로 바꾸기' : '어두운 화면으로 바꾸기'); }
  themeBtn.addEventListener('click', function () {
    var t = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', t);
    try { localStorage.setItem(KEY, t); } catch (e) {}
    label();
  });
  window.addEventListener('pageshow', function () {
    try { var t = localStorage.getItem(KEY); if (t === 'dark' || t === 'light') root.setAttribute('data-theme', t); } catch (e) {}
    label();
  });
  label();

  var topBar = document.querySelector('.top'), lastY = window.scrollY;
  window.addEventListener('scroll', function () {
    var y = window.scrollY;
    if (y > lastY + 6 && y > 140) topBar.classList.add('tuck');
    else if (y < lastY - 6 || y <= 140) topBar.classList.remove('tuck');
    lastY = y;
  }, { passive: true });

  document.querySelectorAll('[data-top]').forEach(function (a) {
    a.addEventListener('click', function (e) { e.preventDefault(); window.scrollTo({ top: 0, behavior: still ? 'auto' : 'smooth' }); });
  });

  var figs = [].slice.call(document.querySelectorAll('.fig'));
  figs.forEach(function (f) {
    var i = 0;
    f.querySelectorAll('.st').forEach(function (el) { el.style.setProperty('--i', i++); });
  });
  function stepOf(el) { var s = el.closest('.st'); return s ? Number(s.style.getPropertyValue('--i')) || 0 : 0; }
  function count(el) {
    var end = Number(el.getAttribute('data-count'));
    if (still) { el.textContent = end; return; }
    var wait = stepOf(el) * 600 + 200, dur = 1400, t0 = null;
    el.textContent = '0';
    setTimeout(function () {
      requestAnimationFrame(function tick(t) {
        if (t0 === null) t0 = t;
        var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(end * e);
        if (p < 1) requestAnimationFrame(tick);
      });
    }, wait);
  }
  function turnOn(f) {
    if (f.classList.contains('on')) return;
    f.classList.add('on');
    f.querySelectorAll('[data-count]').forEach(count);
  }
  var io = null;
  if (still || !('IntersectionObserver' in window)) {
    figs.forEach(turnOn);
  } else {
    figs.forEach(function (f) { f.querySelectorAll('[data-count]').forEach(function (el) { el.textContent = '0'; }); });
    io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { turnOn(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.3 });
    figs.forEach(function (f) { io.observe(f); });
  }
  window.addEventListener('beforeprint', function () { still = true; root.classList.add('still'); figs.forEach(turnOn); });
})();
