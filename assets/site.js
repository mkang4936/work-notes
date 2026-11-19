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
(function client() {
  var body = document.getElementById('rf-body');
  if (!body) return;
  var h = body.previousElementSibling;
  if (!h || h.tagName !== 'H2') return;
  var until = 'onbeforematch' in document.body;
  var btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'rf-btn'; btn.setAttribute('aria-controls', 'rf-body');
  var name = document.createElement('span'); name.textContent = h.textContent;
  var act = document.createElement('span'); act.className = 'rf-act';
  act.insertAdjacentHTML('beforeend', '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>');
  btn.appendChild(name); btn.appendChild(act);
  h.textContent = ''; h.appendChild(btn);
  var sum = null, s = body.getAttribute('data-sum');
  if (s) { sum = document.createElement('p'); sum.className = 'rf-sum'; sum.textContent = s; h.parentNode.insertBefore(sum, body); }
  function set(open) {
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) body.removeAttribute('hidden'); else if (until) body.setAttribute('hidden', 'until-found'); else body.hidden = true;
    if (sum) sum.hidden = open;
  }
  btn.addEventListener('click', function () { set(btn.getAttribute('aria-expanded') !== 'true'); });
  body.addEventListener('beforematch', function () { set(true); });
  set(false);
})();
(function () {
  var M = (function matcher() {
  var SKIP = /[\s ​‐-―−\-·‧…]/, SKIPG = new RegExp(SKIP.source, 'g');
  var SAME = [['부가세', '부가가치세'], ['원천세', '원천징수']];
  function norm(s) {
    var o = '', m = [];
    for (var i = 0; i < s.length; i++) { var c = s.charAt(i); if (SKIP.test(c)) continue; o += c.toLowerCase(); m.push(i); }
    return { s: o, m: m };
  }
  function flat(s) { return s.replace(SKIPG, '').toLowerCase(); }
  function variants(w) {
    var n = flat(w), v = [], notes = [];
    if (!n) return { v: v, notes: notes };
    v.push(n);
    SAME.forEach(function (p) { if (n.indexOf(p[0]) >= 0) { v.push(n.split(p[0]).join(p[1])); notes.push(p); } });
    var r = n.replace(/서면([1-4])팀/g, '서면인터넷방문상담$1팀');
    if (r !== n) { v.push(r); var k = n.match(/서면([1-4])팀/); notes.push([k[0], '서면인터넷방문상담' + k[1] + '팀']); }
    return { v: v, notes: notes };
  }
  function parse(q) {
    q = (q || '').trim();
    var whole = variants(q), toks = q.split(/\s+/).filter(Boolean), terms = [], notes = whole.notes.slice();
    if (toks.length > 1) toks.forEach(function (t) {
      var x = variants(t); if (!x.v.length) return; terms.push(x.v);
      x.notes.forEach(function (p) { if (!notes.some(function (o) { return o[1] === p[1]; })) notes.push(p); });
    });
    return { q: q, len: whole.v.length ? whole.v[0].length : 0, phrase: whole.v, terms: terms, notes: notes };
  }
  function seek(N, vs, out) {
    vs.forEach(function (v) { if (!v) return; var i = N.indexOf(v); while (i >= 0) { out.push([i, i + v.length]); i = N.indexOf(v, i + v.length); } });
    return out;
  }
  function merge(rs) {
    rs.sort(function (a, b) { return a[0] - b[0] || b[1] - a[1]; });
    var o = [];
    rs.forEach(function (r) { var l = o[o.length - 1]; if (l && r[0] <= l[1]) l[1] = Math.max(l[1], r[1]); else o.push([r[0], r[1]]); });
    return o;
  }
  function has(N, vs) { for (var i = 0; i < vs.length; i++) if (vs[i] && N.indexOf(vs[i]) >= 0) return true; return false; }
  function mode(N, P) {
    if (has(N, P.phrase)) return 'p';
    if (P.terms.length && P.terms.every(function (vs) { return has(N, vs); })) return 't';
    return '';
  }
  function ranges(N, P, md) {
    var rs = [];
    if (md === 'p') seek(N, P.phrase, rs);
    else if (md === 't') P.terms.forEach(function (vs) { seek(N, vs, rs); });
    return merge(rs);
  }
  return { norm: norm, flat: flat, parse: parse, mode: mode, ranges: ranges };
})();
  (function client(M, QKEY, GKEY, SKEY, PAGE_GROUPS, PAGE_SECS) {
  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function put(k, v) { try { if (v === null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, v); } catch (e) {} }
  function get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  function json(k) { try { return JSON.parse(get(k) || 'null'); } catch (e) { return null; } }

  document.querySelectorAll('form.fd-q-list').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = f.querySelector('input').value.trim();
      if (!v) return;
      put(GKEY, JSON.stringify({ q: v, k: f.getAttribute('data-k') || '', at: Date.now() }));
      location.href = f.getAttribute('action');
    });
  });

  var post = document.getElementById('post');
  if (post) {
    var f = json(SKEY);
    put(SKEY, null);
    if (f && f.q && Date.now() - f.at < 120000 && f.p === location.pathname && (f.a ? location.hash === '#' + f.a : !location.hash)) {
      var P0 = M.parse(f.q), first = null, els = region(f.a);
      var rb = document.getElementById('rf-body'), rt = document.querySelector('[aria-controls="rf-body"]');
      if (rb && rt && els.indexOf(rb) >= 0 && rb.hasAttribute('hidden')) rt.click();
      var md0 = M.mode(M.flat(els.map(function (el) { return el.textContent; }).join('\n')), P0);
      if (md0) els.forEach(function (el) { var m = markIn(el, P0, md0); if (!first && m) first = m; });
      if (first) window.addEventListener('load', function () {
        setTimeout(function () { var r = first.getBoundingClientRect(); if (r.top < 0 || r.top > window.innerHeight * 0.7) first.scrollIntoView({ block: 'center' }); }, 60);
      });
    }
  }
  function keep(el) { return !el.matches('figure.fig, nav, .tolist, .foot, .cover, .meta, h1'); }
  function region(a) {
    var out = [], el;
    if (a) {
      var start = document.getElementById(a); if (!start) return out;
      out.push(start); el = start.nextElementSibling;
      while (el && el.tagName !== 'H2' && el.tagName !== 'H3') { if (keep(el)) out.push(el); el = el.nextElementSibling; }
    } else {
      el = post.firstElementChild;
      while (el && el.tagName !== 'H2') { if (keep(el)) out.push(el); el = el.nextElementSibling; }
    }
    return out;
  }
  function markIn(el, P, md) {
    var nodes = [], w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), t, txt = '';
    while ((t = w.nextNode())) { nodes.push([t, txt.length]); txt += t.nodeValue; }
    var N = M.norm(txt), rs = M.ranges(N.s, P, md), pieces = [];
    if (!rs.length) return null;
    rs.forEach(function (r) {
      var a = N.m[r[0]], b = N.m[r[1] - 1] + 1;
      nodes.forEach(function (nd, i) { var s = nd[1], e = s + nd[0].nodeValue.length, x = Math.max(a, s), y = Math.min(b, e); if (x < y) pieces.push([i, x - s, y - s]); });
    });
    pieces.sort(function (p, q) { return q[0] - p[0] || q[1] - p[1]; });
    var firstMark = null;
    pieces.forEach(function (p) {
      var node = nodes[p[0]][0];
      node.splitText(p[2]);
      var mid = node.splitText(p[1]), mk = document.createElement('mark');
      mk.className = 'fd-hit'; mid.parentNode.insertBefore(mk, mid); mk.appendChild(mid);
      firstMark = mk;
    });
    return firstMark;
  }

  var page = document.getElementById('find');
  if (!page) return;
  function $(id) { return document.getElementById(id); }
  var input = $('fd-q'), sum = $('fd-sum'), list = $('fd-hits'), eg = $('fd-eg'), bar = $('fd-scope'), moreG = $('fd-more');
  var base = page.getAttribute('data-root'), srcs = JSON.parse(page.getAttribute('data-index'));
  var order = {}; srcs.forEach(function (b, i) { order[b.k] = i; });
  var scope = '', posts = [], secs = null, timer = 0, lastP = null, groups = [], shown = 0;

  var st = json(GKEY); put(GKEY, null);
  if (!(st && Date.now() - st.at < 60000)) st = json(QKEY);
  if (st) { if (!input.value) input.value = st.q || ''; scope = (st.k in order) ? st.k : ''; }
  function save() { var q = input.value.trim(); put(QKEY, q ? JSON.stringify({ q: q, k: scope }) : null); }
  function paintBar(cnt) {
    if (!bar) return;
    bar.querySelectorAll('button').forEach(function (b) {
      var k = b.getAttribute('data-k'); b.setAttribute('aria-pressed', k === scope ? 'true' : 'false');
      b.querySelector('.fd-n').textContent = cnt ? String(k ? (cnt[k] || 0) : cnt['']) : '';
    });
    eg.querySelectorAll('button').forEach(function (b) { b.hidden = !!scope && b.getAttribute('data-k') !== scope; });
  }
  if (bar) bar.addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; scope = b.getAttribute('data-k'); save(); run(); });

  input.form.addEventListener('submit', function (e) { e.preventDefault(); save(); run(); input.blur(); });
  input.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(run, 120); });
  eg.querySelectorAll('button').forEach(function (b) { b.addEventListener('click', function () { input.value = b.textContent; save(); run(); }); });
  list.addEventListener('click', function (e) {
    var a = e.target.closest('a'), more = e.target.closest('button.fd-more');
    if (more) { more.parentNode.querySelectorAll('li[hidden]').forEach(function (li) { li.hidden = false; }); more.remove(); return; }
    if (!a) return;
    save();
    put(SKEY, JSON.stringify({ p: a.pathname, a: a.hash.slice(1), q: input.value.trim(), at: Date.now() }));
  });
  moreG.addEventListener('click', function () { draw(); });
  paintBar(null);
  run();
  Promise.all(srcs.map(function (b) { return fetch(b.src).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }); })).then(function (ds) {
    var ss = [];
    ds.forEach(function (d, bi) {
      var off = posts.length, b = srcs[bi];
      d.posts.forEach(function (p) { posts.push({ k: b.k, name: b.name, n: p.n, t: p.t, u: p.u, b: p.b, T: M.flat(p.t) }); });
      d.secs.forEach(function (s) { ss.push({ p: off + s[0], a: s[1], h: s[2], x: s[3], H: M.flat(s[2]), X: M.flat(s[3]), w: (s[2] === '근거' || s[2] === '다음 글') ? 0.5 : 1 }); });
    });
    secs = ss;
    run();
  }).catch(function () { show('찾기 목록을 불러오지 못했습니다. 다시 열어 주세요.'); });

  function show(msg) { sum.hidden = false; sum.className = 'fd-say'; sum.textContent = msg; }
  function josa(w) {
    var c = w.charCodeAt(w.length - 1);
    if (c >= 0xAC00 && c <= 0xD7A3) return (c - 0xAC00) % 28 ? '이' : '가';
    if (c >= 48 && c <= 57) return '013678'.indexOf(w.charAt(w.length - 1)) >= 0 ? '이' : '가';
    return '이(가)';
  }
  function marked(text, N, rs, a, b) {
    var o = '', at = a;
    rs.forEach(function (r) {
      var x = N.m[r[0]], y = N.m[r[1] - 1] + 1;
      if (y <= a || x >= b) return;
      x = Math.max(x, a); y = Math.min(y, b);
      o += esc(text.slice(at, x)) + '<mark class="fd-hit">' + esc(text.slice(x, y)) + '</mark>'; at = y;
    });
    return o + esc(text.slice(at, b));
  }
  function snippet(t, N, rs) {
    var len = t.length, a = 0, b = Math.min(len, 150), cut = false;
    if (rs.length) {
      var x = N.m[rs[0][0]], y = N.m[rs[0][1] - 1] + 1;
      var st2 = Math.max(t.lastIndexOf('. ', x), t.lastIndexOf('? ', x));
      if (x <= 30) a = 0;
      else if (st2 >= 0 && x - st2 <= 32) a = st2 + 2;
      else { a = x - 24; var sp = t.indexOf(' ', a); if (sp >= 0 && sp < x) a = sp + 1; cut = true; }
      b = Math.min(len, Math.max(a + 160, y + 30));
      if (b < len) { var sp2 = t.lastIndexOf(' ', b); if (sp2 > y) b = sp2; }
    }
    return (cut ? '…' : '') + marked(t, N, rs, a, b) + (b < len && t.charAt(b - 1) !== '.' ? '…' : '');
  }
  function groupHtml(g, P) {
    var p = g.p, href = base + p.u;
    var pick = g.items.slice().sort(function (a, b) { return b.sc - a.sc || b.c - a.c; }).slice(0, PAGE_SECS);
    var Tn = M.norm(p.t), tr = M.ranges(Tn.s, P, M.mode(Tn.s, P));
    return '<li class="fd-g"><p class="fd-k">' + esc(p.name) + ' · ' + p.n + '편</p>'
      + '<a class="fd-t" href="' + href + '">' + marked(p.t, Tn, tr, 0, p.t.length) + '</a>'
      + '<p class="fd-m">' + (p.b ? '근거 확인 기준일 ' + p.b + ' · ' : '') + '찾은 절 ' + g.items.length + '개</p>'
      + '<ol class="fd-s">' + g.items.map(function (it) {
        var Hn = M.norm(it.s.h), Xn = M.norm(it.s.x), hr = M.ranges(Hn.s, P, it.md), xr = M.ranges(Xn.s, P, it.md);
        return '<li' + (pick.indexOf(it) < 0 ? ' hidden' : '') + '><a href="' + href + (it.s.a ? '#' + it.s.a : '') + '">'
          + '<span class="fd-h">' + marked(it.s.h, Hn, hr, 0, it.s.h.length) + '</span>'
          + '<span class="fd-x">' + snippet(it.s.x, Xn, xr) + '</span>'
          + (it.c > 1 ? '<span class="fd-c">이 절에 ' + it.c + '번</span>' : '') + '</a></li>';
      }).join('') + '</ol>'
      + (g.items.length > PAGE_SECS ? '<button type="button" class="fd-more">이 글의 절 ' + (g.items.length - PAGE_SECS) + '개 더 보기</button>' : '')
      + '</li>';
  }
  function draw() {
    var next = groups.slice(shown, shown + PAGE_GROUPS);
    list.insertAdjacentHTML('beforeend', next.map(function (g) { return groupHtml(g, lastP); }).join(''));
    shown += next.length;
    var rest = groups.length - shown;
    moreG.hidden = rest <= 0;
    if (rest > 0) moreG.textContent = '글 ' + Math.min(rest, PAGE_GROUPS) + '개 더 보기 (남은 글 ' + rest + '개)';
  }
  function run() {
    var q = input.value.trim();
    list.innerHTML = ''; moreG.hidden = true; groups = []; shown = 0;
    if (!q) { put(QKEY, null); sum.hidden = true; eg.hidden = false; paintBar(null); return; }
    if (!secs) { show('찾는 중입니다.'); paintBar(null); return; }
    var P = M.parse(q);
    if (P.len < 2) { eg.hidden = true; show('두 글자 이상 넣어 주세요.'); paintBar(null); return; }
    var by = {}, all = [], cnt = { '': 0 };
    secs.forEach(function (s) {
      var md = M.mode(s.H + '\n' + s.X, P);
      if (!md) return;
      var hc = M.ranges(s.H, P, md).length, xc = M.ranges(s.X, P, md).length;
      var g = by[s.p];
      if (!g) { var p = posts[s.p]; g = by[s.p] = { p: p, items: [], score: M.mode(p.T, P) ? 1000 : 0 }; all.push(g); cnt[''] += 1; cnt[p.k] = (cnt[p.k] || 0) + 1; }
      g.items.push({ s: s, md: md, c: hc + xc, sc: (hc ? 3 : 1) * s.w });
      g.score += hc ? 10 : 1;
    });
    paintBar(cnt);
    groups = all.filter(function (g) { return !scope || g.p.k === scope; })
      .sort(function (a, b) { return b.score - a.score || order[a.p.k] - order[b.p.k] || a.p.n - b.p.n; });
    var label = '「' + esc(q) + '」';
    if (!groups.length) {
      eg.hidden = false;
      show('');
      sum.innerHTML = label + josa(q) + ' 들어간 절이 없습니다. '
        + (scope && cnt[''] ? '「전체」를 누르면 다른 가지의 글 ' + cnt[''] + '개가 나옵니다.' : '낱말을 줄이거나 다른 말로 찾아 보세요.');
      return;
    }
    eg.hidden = true;
    var n = 0; groups.forEach(function (g) { n += g.items.length; });
    sum.hidden = false; sum.className = 'list-head';
    sum.innerHTML = label + ' · 글 ' + groups.length + '개, 절 ' + n + '개'
      + P.notes.map(function (p) { return '<span class="fd-same">「' + esc(p[1]) + '」도 함께 찾았습니다</span>'; }).join('');
    lastP = P;
    draw();
  }
})(M, 'work-notes-q', 'work-notes-go', 'work-notes-find', 8, 3);
})();
