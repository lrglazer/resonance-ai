/* ChemFluent — app shell: state, routing, lessons, practice engine, exams, flashcards, tools. */
'use strict';
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const main = $('#main');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ---------- courses (from UT Dallas syllabi) ---------- */
const COURSES = [
  { id: '1311', name: 'General Chemistry I', code: 'CHEM 1311', book: 'Burdge & Overby, Chemistry: Atoms First', color: '#FF8A6B' },
  { id: '1312', name: 'General Chemistry II', code: 'CHEM 1312', book: 'Burdge & Overby, Chemistry: Atoms First', color: '#7FA2FF' },
  { id: '2323', name: 'Organic Chemistry I', code: 'CHEM 2323', book: 'Wade, Organic Chemistry · Klein, Organic Chemistry I as a Second Language', color: '#FFC93C' },
  { id: '2325', name: 'Organic Chemistry II', code: 'CHEM 2325', book: 'Wade, Organic Chemistry · Klein, Organic Chemistry II as a Second Language', color: '#3ED1AC' },
  { id: '3361', name: 'Biochemistry I', code: 'BIOL/CHEM 3361', book: 'Lehninger, Principles of Biochemistry', color: '#C29BFF' },
];
const COURSE_OF = { econfig: '1311', formal: '1311', vsepr: '1311', moles: '1311', balance: '1311', stoich: '1311', gas: '1311', ph: '1312', bondline: '2323', fg: '2323', resonance: '2323', acidbase: '2323', naming: '2323', stereo: '2323', subelim: '2323', reactions: '2323', spectro: '2325' };
CH.forEach(c => { c.course = c.course || COURSE_OF[c.id] || (c.unit === 'gen' ? '1311' : '2323'); });
const ORDER = ['quantum', 'econfig', 'trends', 'ionic', 'formal', 'vsepr', 'imf', 'moles', 'balance', 'stoich', 'aqueous', 'thermo', 'gas', 'colligative', 'kinetics', 'equilibrium', 'ph', 'ksp', 'gibbs', 'electro', 'nuclear', 'bondline', 'fg', 'resonance', 'acidbase', 'naming', 'conform', 'stereo', 'radical', 'subelim', 'reactions', 'spectro', 'massspec', 'aromatic', 'carbonyl', 'amines', 'enolates', 'aminoacids', 'proteins', 'enzymes', 'carbs', 'metabolism'];
CH.sort((a, b) => ORDER.indexOf(a.id) - ORDER.indexOf(b.id));
const chById = id => CH.find(c => c.id === id);
const SYMS = { quantum: 'Qu', econfig: 'Ec', trends: 'Tr', ionic: 'Io', formal: 'Fc', vsepr: 'Vs', imf: 'Im', moles: 'Mo', balance: 'Ba', stoich: 'St', aqueous: 'Aq', thermo: 'Th', gas: 'Gs', colligative: 'Cg', kinetics: 'Ki', equilibrium: 'Eq', ph: 'Ph', ksp: 'Ks', gibbs: 'Gb', electro: 'El', nuclear: 'Nu', bondline: 'Bl', fg: 'Fg', resonance: 'Rs', acidbase: 'Ab', naming: 'Nm', conform: 'Cn', stereo: 'Sr', radical: 'Rd', subelim: 'Sn', reactions: 'Rx', spectro: 'Ir', massspec: 'Ms', aromatic: 'Ar', carbonyl: 'Cb', amines: 'Am', enolates: 'En', aminoacids: 'Aa', proteins: 'Pr', enzymes: 'Ez', carbs: 'Cs', metabolism: 'Mt' };
const symOf = c => SYMS[c.id] || c.title.slice(0, 2);
const zOf = c => CH.indexOf(c) + 1;
function tile(c, co, i = 0) { const m = mastery(c.id); return `<a class="ccard ${m >= 80 ? 'mastered' : ''}" href="#/ch/${c.id}" style="--cc:${co.color};animation-delay:${i * 35}ms" aria-label="${c.title}, ${m}% mastered"><span class="zn"><span>${zOf(c)}</span><span>${c.emoji}</span></span><span class="sym">${symOf(c)}</span><b>${c.title}</b><small>${c.blurb}</small><span class="m"><span class="meter"><i style="width:${m}%"></i></span>${m >= 80 ? 'Mastered' : m ? m + '%' : 'New'}</span></a>`; }
function flaskMeter(p) { const y = 78 - p / 100 * 50; return `<div class="mflask" aria-label="${p}% mastered"><svg viewBox="0 0 70 84"><defs><clipPath id="fc"><path d="M24 4h22v22l20 46a6 6 0 0 1-6 8H10a6 6 0 0 1-6-8l20-46z"/></clipPath></defs><g clip-path="url(#fc)"><rect class="l" x="0" y="${y}" width="70" height="90"/></g><path class="g" fill="none" d="M24 4h22v22l20 46a6 6 0 0 1-6 8H10a6 6 0 0 1-6-8l20-46z" style="fill:none"/><path d="M20 4h30" stroke="var(--ink)" stroke-width="4" stroke-linecap="round"/></svg><div>${p}%</div></div>`; }

/* ---------- saved progress ---------- */
const KEY = 'chemfluent-v1';
const S = (() => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } })();
S.xp ??= 0; S.ch ??= {}; S.cards ??= {}; S.miss ??= []; S.days ??= {}; S.exams ??= [];
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } };
const today = () => new Date().toISOString().slice(0, 10);
function chState(id) { return S.ch[id] ??= { att: 0, ok: 0, recent: [], learned: false }; }
function mastery(id) { const r = chState(id).recent; if (!r.length) return 0; return Math.round(r.filter(Boolean).length / Math.max(r.length, 8) * 100); }
function record(id, correct, q) {
  const st = chState(id); st.att++; if (correct) st.ok++; st.recent.push(!!correct); if (st.recent.length > 10) st.recent.shift();
  S.days[today()] = (S.days[today()] || 0) + 1;
  if (correct) { S.xp += 10; S.miss = S.miss.filter(m => m.k !== q.key); }
  else if (q && q.key) S.miss.unshift({ k: q.key, ch: id, t: Date.now() }), S.miss = S.miss.slice(0, 60);
  save(); renderTop();
}
function streak() { let n = 0, d = new Date(); for (; ;) { const k = d.toISOString().slice(0, 10); if (S.days[k]) { n++; d.setDate(d.getDate() - 1); } else if (n === 0 && k === today()) { d.setDate(d.getDate() - 1); } else break; } return n; }
const level = () => 1 + Math.floor(S.xp / 250);

/* ---------- top bar & sidebar ---------- */
function renderTop() {
  $('#xp').textContent = S.xp; $('#lvl').textContent = level(); $('#streak').textContent = streak();
  const p = (S.xp % 250) / 250 * 100; $('#lvlbar').style.width = p + '%';
}
function ring(p, color = 'var(--acc)', size = 34) {
  const r = size / 2 - 3, c = 2 * Math.PI * r;
  return `<svg class="ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="rb"/><circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="rf" style="stroke:${color};stroke-dasharray:${c};stroke-dashoffset:${c * (1 - p / 100)}"/></svg>`;
}
function renderNav() {
  const cur = location.hash;
  let h = `<a href="#/" class="nl ${cur === '#/' || cur === '' ? 'on' : ''}"><span class="ni">🏠</span>Home</a>
    <a href="#/exam" class="nl ${cur.startsWith('#/exam') ? 'on' : ''}"><span class="ni">📝</span>Exam simulator</a>
    <a href="#/review" class="nl ${cur.startsWith('#/review') ? 'on' : ''}"><span class="ni">🔁</span>Mistake review${S.miss.length ? `<b class="badge">${Math.min(S.miss.length, 99)}</b>` : ''}</a>
    <a href="#/cards" class="nl ${cur.startsWith('#/cards') ? 'on' : ''}"><span class="ni">🃏</span>Reaction flashcards</a>
    <a href="#/tools" class="nl ${cur.startsWith('#/tools') ? 'on' : ''}"><span class="ni">🧰</span>Toolbox</a>`;
  for (const co of COURSES) {
    const chs = CH.filter(c => c.course === co.id); if (!chs.length) continue;
    h += `<div class="ng"><span style="color:${co.color}">${co.code}</span> ${co.name}</div>`;
    for (const c of chs) h += `<a href="#/ch/${c.id}" class="nl ch ${cur.startsWith('#/ch/' + c.id) ? 'on' : ''}">${ring(mastery(c.id), co.color, 24)}<span>${c.title}</span></a>`;
  }
  $('#nav').innerHTML = h;
}

/* ---------- router ---------- */
let cleanup = null;
function route() {
  if (cleanup) { cleanup(); cleanup = null; }
  const parts = location.hash.replace(/^#\/?/, '').split('/');
  document.body.classList.remove('menu-open');
  window.scrollTo(0, 0);
  if (parts[0] === 'ch' && chById(parts[1])) viewChapter(chById(parts[1]), parts[2] || 'learn');
  else if (parts[0] === 'exam') viewExam(parts[1]);
  else if (parts[0] === 'review') viewReview();
  else if (parts[0] === 'cards') viewCards();
  else if (parts[0] === 'tools') viewTools(parts[1]);
  else viewHome();
  renderNav(); renderTop();
  main.focus({ preventScroll: true });
}
addEventListener('hashchange', route);

/* ---------- home ---------- */
function viewHome() {
  const next = CH.find(c => mastery(c.id) < 80) || CH[0];
  const total = CH.reduce((s, c) => s + mastery(c.id), 0) / CH.length;
  main.innerHTML = `
  <section class="hero">
    <div class="hero-txt">
      <div class="kick">Chemistry as a second language</div>
      <h1>Learn it. Watch it.<br><span>Do it</span> until it's automatic.</h1>
      <p>Every chapter teaches one skill the way a great textbook does, shows a worked example step by step, then gives you endless fresh problems until it clicks. Built around UT Dallas Gen Chem I &amp; II, Organic I &amp; II and Biochemistry.</p>
      <div class="cta"><a class="btn pri" href="#/ch/${next.id}">${S.xp ? 'Continue' : 'Start'}: ${next.title} →</a><a class="btn" href="#/exam">Take a practice exam</a></div>
    </div>
    <div class="hero-art" aria-hidden="true">${heroArt()}</div>
  </section>
  <section class="stats">
    <div class="stat"><b>${S.xp}</b><span>XP</span></div><div class="stat"><b>${level()}</b><span>Level</span></div>
    <div class="stat"><b>${streak()}🔥</b><span>Day streak</span></div><div class="stat"><b>${Math.round(total)}%</b><span>Overall mastery</span></div>
  </section>
  ${S.miss.length ? `<a class="banner" href="#/review"><b>🔁 ${S.miss.length} question${S.miss.length > 1 ? 's' : ''} to redo.</b> Clearing your mistakes is the fastest way to raise your exam score. →</a>` : ''}
  ${COURSES.map(co => { const chs = CH.filter(c => c.course === co.id); if (!chs.length) return '';
    return `<section class="course" style="--cc:${co.color}"><div class="course-h"><div><span class="code">${co.code}</span><h2>${co.name}</h2><small>Textbook: ${co.book}</small></div>${ring(chs.reduce((s, c) => s + mastery(c.id), 0) / chs.length, co.color, 52)}</div>
    <div class="cgrid">${chs.map((c, i) => tile(c, co, i)).join('')}</div></section>`; }).join('')}`;
}
function heroArt() {
  return `<svg class="flask" viewBox="0 0 330 330" aria-hidden="true"><defs><clipPath id="hc"><path d="M130 40h70v80l78 150a18 18 0 0 1-16 26H68a18 18 0 0 1-16-26l78-150z"/></clipPath></defs>
  <g clip-path="url(#hc)"><g class="wave"><path class="liq" d="M0 190 q30 -18 60 0 t60 0 t60 0 t60 0 t60 0 t60 0 V340 H0z"/></g>
  <circle class="bub" cx="140" cy="290" r="9"/><circle class="bub" cx="180" cy="300" r="6"/><circle class="bub" cx="200" cy="285" r="11"/><circle class="bub" cx="160" cy="300" r="5"/></g>
  <path class="glass" fill="none" d="M130 40h70v80l78 150a18 18 0 0 1-16 26H68a18 18 0 0 1-16-26l78-150z"/><path d="M118 40h94" stroke="var(--ink)" stroke-width="6" stroke-linecap="round"/>
  <g class="mol"><line x1="268" y1="70" x2="300" y2="40"/><line x1="268" y1="70" x2="300" y2="100"/><circle cx="268" cy="70" r="14" fill="#FF6B4A"/><circle cx="300" cy="40" r="9" fill="#FFFDF7"/><circle cx="300" cy="100" r="9" fill="#FFFDF7"/></g></svg>`;
}

/* ---------- chapter ---------- */
function viewChapter(c, tab) {
  const co = COURSES.find(x => x.id === c.course);
  const st = chState(c.id);
  main.innerHTML = `<header class="chhead" style="--cc:${co.color}"><a class="back" href="#/">← All chapters</a>
    <div class="chtitle"><div class="bigtile"><small>${zOf(c)}</small><b>${symOf(c)}</b><i>${c.emoji}</i></div><div><span class="code">${co.code} · ${co.name}</span><h1>${c.title}</h1><p>${c.blurb}</p></div>${flaskMeter(mastery(c.id))}</div>
    <nav class="tabs" role="tablist">${[['learn', '📖 Learn'], ['watch', '👀 Watch me'], ['do', '✍️ Your turn']].map(([k, l]) => `<a role="tab" aria-selected="${tab === k}" class="${tab === k ? 'on' : ''}" href="#/ch/${c.id}/${k}">${l}</a>`).join('')}</nav></header><div id="body"></div>`;
  const body = $('#body');
  if (tab === 'learn') learnView(c, body, st);
  else if (tab === 'watch') watchView(c, body);
  else practiceView(c, body);
}
function learnView(c, body, st) {
  let i = 0;
  const draw = () => {
    const L = c.learn[i];
    body.innerHTML = `<article class="page" aria-live="polite"><div class="pg">Lesson ${i + 1} of ${c.learn.length}</div><h2>${L.h}</h2>${L.body}
      ${c.viewer && i === 0 ? `<div class="viewer"><canvas id="v3d"></canvas><div class="vctl">${[[2, 0, 'Linear'], [3, 0, 'Trig. planar'], [3, 1, 'Bent'], [4, 0, 'Tetrahedral'], [4, 1, 'Pyramidal'], [4, 2, 'Bent (sp³)'], [5, 0, 'Trig. bipyramidal'], [5, 1, 'Seesaw'], [5, 2, 'T-shaped'], [6, 0, 'Octahedral'], [6, 1, 'Sq. pyramidal'], [6, 2, 'Sq. planar']].map(([s, l, n], k) => `<button class="chip ${k === 3 ? 'on' : ''}" data-s="${s}" data-l="${l}">${n}</button>`).join('')}</div><p class="tip">Drag to rotate. Blue lobes are lone pairs.</p></div>` : ''}
      ${c.launch && i === c.learn.length - 1 ? `<a class="btn pri launch" href="${c.launch}">Open the animated Pushing electrons lab →</a>` : ''}
      <div class="pnav"><button class="btn" id="prev" ${i ? '' : 'disabled'}>← Back</button><div class="dots">${c.learn.map((_, k) => `<i class="${k === i ? 'on' : k < i ? 'done' : ''}"></i>`).join('')}</div>
      ${i < c.learn.length - 1 ? '<button class="btn pri" id="next">Next →</button>' : `<a class="btn pri" href="#/ch/${c.id}/watch">Watch a worked example →</a>`}</div></article>`;
    $('#prev').onclick = () => { i--; draw(); };
    const n = $('#next'); if (n) n.onclick = () => { i++; draw(); };
    if (i === c.learn.length - 1 && !st.learned) { st.learned = true; save(); }
    if (c.viewer && i === 0) {
      let stop = vseprViewer($('#v3d'), 4, 0, { center: 'C' });
      cleanup = () => stop();
      $$('.vctl .chip').forEach(b => b.onclick = () => { $$('.vctl .chip').forEach(x => x.classList.toggle('on', x === b)); stop(); stop = vseprViewer($('#v3d'), +b.dataset.s, +b.dataset.l, { center: 'A' }); cleanup = () => stop(); });
    } else if (cleanup) { cleanup(); cleanup = null; }
  };
  draw();
}
function newQ(c) { const q = c.gen(); q.ch = c.id; q.key = c.id + ':' + Math.random().toString(36).slice(2); q.steps = (q.steps || []).filter(Boolean); return q; }
function qHTML(q, opts = {}) {
  let a = '';
  if (q.type === 'mc') a = `<div class="opts">${q.options.map((o, k) => `<button class="opt" data-k="${k}"><span class="key">${'ABCDEF'[k]}</span><span>${o}</span></button>`).join('')}</div>`;
  else if (q.type === 'num' || q.type === 'text') a = `<form class="ans"><input id="inp" autocomplete="off" autocapitalize="off" spellcheck="false" inputmode="${q.type === 'num' ? 'decimal' : 'text'}" placeholder="${q.placeholder || (q.type === 'num' ? 'Your answer' : 'Type your answer')}" aria-label="Your answer">${q.unit ? `<span class="unit">${q.unit}</span>` : ''}<button class="btn pri" type="submit">Check</button></form>${q.type === 'num' ? '<p class="tip">Within about 2% counts. Scientific notation works: 3.01e23.</p>' : ''}`;
  else if (q.type === 'balance') { const all = [...q.eq.L, ...q.eq.R]; a = `<form class="ans bal">${all.map((f, k) => `${k === q.eq.L.length ? '<span class="arr">→</span>' : k ? '<span>+</span>' : ''}<label><input class="co" type="number" min="1" max="20" value="1" aria-label="Coefficient for ${f}"><span class="f">${fmtFormula(f)}</span></label>`).join('')}<button class="btn pri" type="submit">Check</button></form>`; }
  return `<div class="q"><div class="prompt">${q.prompt}</div>${q.type === 'balance' ? '' : ''}${q.visual ? `<div class="vis" id="vis">${q.visual}</div>` : ''}${q.geo ? `<div class="vis geo"><canvas id="qgeo"></canvas></div>` : ''}${opts.noAnswer ? '' : a}<div class="fb" id="fb" aria-live="polite"></div></div>`;
}
function mountGeo(q) { if (q.geo && $('#qgeo')) { const stop = vseprViewer($('#qgeo'), q.geo.sn, q.geo.lp, { center: q.geo.center }); const prev = cleanup; cleanup = () => { stop(); prev && prev(); }; } }
function grade(q, root) {
  return new Promise(res => {
    const done = (ok, given) => res({ ok, given });
    if (q.type === 'mc') root.querySelectorAll('.opt').forEach(b => b.onclick = () => done(+b.dataset.k === q.answer, +b.dataset.k));
    else if (q.type === 'num') root.querySelector('form').onsubmit = e => { e.preventDefault(); const v = parseNum($('#inp').value); if (isNaN(v)) { $('#inp').classList.add('bad'); return; } const ok = q.abs != null && Math.abs(v - q.value) <= q.abs || Math.abs(v - q.value) <= Math.abs(q.value) * q.tol; done(ok, v); };
    else if (q.type === 'text') root.querySelector('form').onsubmit = e => { e.preventDefault(); const v = $('#inp').value; if (!v.trim()) return; done(!!q.check(v), v); };
    else if (q.type === 'balance') root.querySelector('form').onsubmit = e => { e.preventDefault(); const co = [...root.querySelectorAll('.co')].map(x => +x.value); done(q.check(co), co); };
  });
}
function showResult(q, r, root, explain = true) {
  root.querySelectorAll('.opt,input,button[type=submit]').forEach(e => e.disabled = true);
  if (q.type === 'mc') root.querySelectorAll('.opt').forEach(b => { const k = +b.dataset.k; if (k === q.answer) b.classList.add('right'); else if (k === r.given) b.classList.add('wrong'); });
  if (q.visualAfter && $('#vis')) $('#vis').innerHTML = q.visualAfter;
  const ans = q.type === 'num' ? `${sig(q.value, 3)} ${q.unit || ''}` : q.type === 'text' || q.type === 'balance' ? q.answerText : '';
  const pg = root.querySelector('.page'); if (pg) { pg.classList.remove('shake', 'glow'); void pg.offsetWidth; pg.classList.add(r.ok ? 'glow' : 'shake'); }
  root.querySelector('#fb').innerHTML = `<div class="verdict ${r.ok ? 'ok' : 'no'}">${r.ok ? R.pick(['Nailed it! ✅', 'Correct! ✅', 'Yes! ✅', 'Perfect ✅']) : 'Not quite ❌'}${!r.ok && ans ? ` <span>Answer: <b>${ans}</b></span>` : ''}</div>
    ${explain ? `<div class="how"><b>How to solve it</b><ol>${q.steps.map(s => `<li>${s}</li>`).join('')}</ol></div>` : ''}`;
}
function watchView(c, body) {
  const q = newQ(c);
  let k = 0;
  const shown = q.type === 'mc' ? q.options[q.answer] : q.type === 'num' ? `${sig(q.value)} ${q.unit || ''}` : q.answerText;
  body.innerHTML = `<article class="page watch"><div class="pg">Worked example</div>${qHTML(q, { noAnswer: true })}
    <ol class="wsteps" id="ws"></ol><div class="pnav"><button class="btn" id="another">↻ Another example</button><button class="btn pri" id="step">Show step 1 →</button></div></article>`;
  mountGeo(q);
  const next = () => {
    if (k < q.steps.length) { const li = document.createElement('li'); li.innerHTML = q.steps[k]; $('#ws').appendChild(li); k++; }
    if (k >= q.steps.length) { if (!$('#final')) { const d = document.createElement('div'); d.id = 'final'; d.className = 'final'; d.innerHTML = `Answer: <b>${shown}</b>`; $('#ws').after(d); if (q.visualAfter && $('#vis')) $('#vis').innerHTML = q.visualAfter; }
      $('#step').outerHTML = `<a class="btn pri" href="#/ch/${c.id}/do">Your turn →</a>`; }
    else $('#step').textContent = `Show step ${k + 1} →`;
  };
  $('#step').onclick = next; $('#another').onclick = () => { if (cleanup) { cleanup(); cleanup = null; } watchView(c, body); };
}
function practiceView(c, body) {
  const N = 5; let n = 0, right = 0;
  const one = async () => {
    if (cleanup) { cleanup(); cleanup = null; }
    if (n >= N) return finish();
    const q = newQ(c);
    body.innerHTML = `<article class="page do"><div class="prog"><div class="pg">Question ${n + 1} of ${N}</div><div class="pbar"><i style="width:${n / N * 100}%"></i></div><div class="score">✅ ${right}</div></div>${qHTML(q)}<div class="pnav" id="after" hidden><span></span><button class="btn pri" id="nextq">${n + 1 < N ? 'Next question →' : 'See results →'}</button></div></article>`;
    mountGeo(q);
    const inp = $('#inp'); if (inp) inp.focus();
    const r = await grade(q, body);
    if (r.ok) right++;
    record(c.id, r.ok, q);
    if (!r.ok) S.miss[0] && (S.miss[0].q = serialQ(q));
    save();
    showResult(q, r, body);
    if (r.ok) { pop('+10 XP'); window.fxFizz && fxFizz(body.querySelector('.verdict')); }
    $('#after').hidden = false; n++;
    $('#nextq').onclick = one; $('#nextq').focus();
  };
  const finish = () => {
    const m = mastery(c.id);
    body.innerHTML = `<article class="page result"><div class="big">${right === N ? '🏆' : right >= 3 ? '🎉' : '💪'}</div><h2>${right} / ${N} correct</h2><p>Chapter mastery: <b>${m}%</b>${m >= 80 ? ' · Mastered ⭐' : ' · Reach 80% over your last 10 to master it.'}</p>
      <div class="cta"><button class="btn pri" id="again">Practice 5 more</button><a class="btn" href="#/ch/${c.id}/learn">Review the lesson</a>${nextCh(c) ? `<a class="btn" href="#/ch/${nextCh(c).id}">Next chapter →</a>` : ''}</div></article>`;
    if (right === N) confetti();
    $('#again').onclick = () => practiceView(c, body);
  };
  one();
}
const nextCh = c => CH[CH.indexOf(c) + 1];
function serialQ(q) { try { return JSON.parse(JSON.stringify({ ...q, check: undefined, answerText: q.answerText })); } catch (e) { return null; } }

/* ---------- exam simulator ---------- */
const EXAMS = {
  '1311': [['Exam 1: atoms & electrons', ['quantum', 'econfig', 'trends']], ['Exam 2: bonding & structure', ['ionic', 'formal', 'vsepr', 'imf']], ['Exam 3: reactions & moles', ['moles', 'balance', 'stoich', 'aqueous']], ['Exam 4: energy & gases', ['thermo', 'gas']], ['Final', null]],
  '1312': [['Exam 1: solutions & kinetics', ['colligative', 'kinetics']], ['Exam 2: equilibrium & acids', ['equilibrium', 'ph']], ['Exam 3: Ksp & free energy', ['ph', 'ksp', 'gibbs']], ['Exam 4: electro & nuclear', ['gibbs', 'electro', 'nuclear']], ['Final', null]],
  '2323': [['Exam 1: structure & acids', ['bondline', 'fg', 'resonance', 'acidbase']], ['Exam 2: naming, conformations & stereo', ['naming', 'conform', 'stereo']], ['Exam 3: radicals, SN & E', ['radical', 'subelim']], ['Exam 4: alkene & alcohol reactions', ['reactions']], ['Final', null]],
  '2325': [['Exam 1: spectroscopy', ['spectro', 'massspec']], ['Exam 2: aromatics', ['aromatic']], ['Exam 3: carbonyls & amines', ['carbonyl', 'amines']], ['Exam 4: enolates', ['enolates', 'carbonyl']], ['Final', null]],
  '3361': [['Exam 1: amino acids & proteins', ['aminoacids', 'proteins']], ['Exam 2: enzymes & carbs', ['enzymes', 'carbs']], ['Exam 3: metabolism', ['metabolism']], ['Final', null]],
};
function viewExam(sel) {
  if (!sel) {
    main.innerHTML = `<header class="chhead"><h1>📝 Exam simulator</h1><p>Timed, no hints, graded at the end, just like the real thing. Pick an exam modeled on the UT Dallas syllabus.</p></header>
    ${COURSES.map(co => EXAMS[co.id] ? `<section class="course" style="--cc:${co.color}"><div class="course-h"><div><span class="code">${co.code}</span><h2>${co.name}</h2></div></div><div class="cgrid">${EXAMS[co.id].map(([nm, chs], i) => { const list = (chs || CH.filter(c => c.course === co.id).map(c => c.id)).map(chById).filter(Boolean);
      return `<a class="ccard" style="--cc:${co.color}" href="#/exam/${co.id}-${i}"><span class="em">⏱️</span><b>${nm}</b><small>${list.map(c => c.title).join(' · ')}</small><span class="m"><i>${chs ? 12 : 20} questions · ${chs ? 30 : 50} min</i></span></a>`; }).join('')}</div></section>` : '').join('')}
    <section class="course"><div class="cgrid"><a class="ccard" href="#/exam/all-0" style="--cc:#fff"><span class="em">🧠</span><b>Everything mix</b><small>Random questions from every chapter</small><span class="m"><i>20 questions · 50 min</i></span></a></div></section>
    ${S.exams.length ? `<section class="course"><h2>Past attempts</h2><table class="tbl">${S.exams.slice(0, 8).map(e => `<tr><td>${e.d}</td><td>${e.name}</td><td><b>${e.pct}%</b></td></tr>`).join('')}</table></section>` : ''}`;
    return;
  }
  const [cid, idx] = sel.split('-');
  let name, chs;
  if (cid === 'all') { name = 'Everything mix'; chs = CH.map(c => c.id); }
  else { const e = EXAMS[cid][+idx]; name = `${COURSES.find(c => c.id === cid).code} ${e[0]}`; chs = e[1] || CH.filter(c => c.course === cid).map(c => c.id); }
  const N = cid !== 'all' && EXAMS[cid][+idx][1] ? 12 : 20, mins = N === 12 ? 30 : 50;
  const qs = Array.from({ length: N }, (_, i) => newQ(chById(chs[i % chs.length])));
  R.shuffle(qs);
  const answers = new Array(N).fill(null); let i = 0, t0 = Date.now(), timer;
  const tick = () => { const left = Math.max(0, mins * 60 - (Date.now() - t0) / 1000); const el = $('#clock'); if (el) el.textContent = `${Math.floor(left / 60)}:${String(Math.floor(left % 60)).padStart(2, '0')}`; if (left <= 0) submit(); };
  timer = setInterval(tick, 500); cleanup = () => clearInterval(timer);
  const draw = () => {
    const q = qs[i];
    main.innerHTML = `<header class="examhead"><b>${name}</b><span class="clock" id="clock"></span><button class="btn" id="submit">Submit exam</button></header>
      <div class="qnav">${qs.map((_, k) => `<button class="${k === i ? 'on' : ''} ${answers[k] != null ? 'done' : ''}" data-k="${k}">${k + 1}</button>`).join('')}</div>
      <article class="page">${qHTML(q)}<div class="pnav"><button class="btn" id="prev" ${i ? '' : 'disabled'}>← Previous</button><button class="btn pri" id="nxt">${i < N - 1 ? 'Next →' : 'Review & submit'}</button></div></article>`;
    tick();
    const geoStop = q.geo ? vseprViewer($('#qgeo'), q.geo.sn, q.geo.lp, { center: q.geo.center }) : null;
    const prevClean = cleanup; cleanup = () => { geoStop && geoStop(); clearInterval(timer); };
    // restore previous answer
    const a = answers[i];
    if (a != null) { if (q.type === 'mc') $$('.opt')[a.given]?.classList.add('picked'); else if (q.type === 'balance') $$('.co').forEach((x, k) => x.value = a.given[k]); else if ($('#inp')) $('#inp').value = a.raw; }
    if (q.type === 'mc') $$('.opt').forEach(b => b.onclick = () => { $$('.opt').forEach(x => x.classList.remove('picked')); b.classList.add('picked'); answers[i] = { given: +b.dataset.k, ok: +b.dataset.k === q.answer }; mark(); });
    else { const f = $('form'); const store = () => { if (q.type === 'balance') { const co = $$('.co').map(x => +x.value); answers[i] = { given: co, ok: q.check(co) }; } else { const raw = $('#inp').value; if (!raw.trim()) { answers[i] = null; return; } const ok = q.type === 'num' ? (() => { const v = parseNum(raw); return !isNaN(v) && (q.abs != null && Math.abs(v - q.value) <= q.abs || Math.abs(v - q.value) <= Math.abs(q.value) * q.tol); })() : !!q.check(raw); answers[i] = { raw, given: raw, ok }; } mark(); };
      f.oninput = store; f.onsubmit = e => { e.preventDefault(); store(); if (i < N - 1) { i++; draw(); } };
      const sb = f.querySelector('button[type=submit]'); if (sb) sb.textContent = 'Save'; }
    $('#prev').onclick = () => { i--; draw(); }; $('#nxt').onclick = () => { if (i < N - 1) { i++; draw(); } else submit(); };
    $$('.qnav button').forEach(b => b.onclick = () => { i = +b.dataset.k; draw(); });
    $('#submit').onclick = submit;
    void prevClean;
  };
  const mark = () => $$('.qnav button').forEach((b, k) => b.classList.toggle('done', answers[k] != null));
  function submit() {
    clearInterval(timer);
    const score = answers.filter(a => a && a.ok).length, pct = Math.round(score / N * 100);
    const by = {}; qs.forEach((q, k) => { (by[q.ch] ??= [0, 0]); by[q.ch][1]++; if (answers[k] && answers[k].ok) by[q.ch][0]++; record(q.ch, !!(answers[k] && answers[k].ok), q); if (!(answers[k] && answers[k].ok)) { S.miss[0] && (S.miss[0].q = serialQ(q)); } });
    S.exams.unshift({ d: today(), name, pct }); save();
    const weak = Object.entries(by).filter(([, [a, b]]) => a / b < .7).map(([id]) => chById(id));
    const grade = pct >= 90 ? 'A' : pct >= 80 ? 'B' : pct >= 70 ? 'C' : pct >= 60 ? 'D' : 'F';
    main.innerHTML = `<article class="page result"><div class="big">${pct >= 90 ? '🏆' : pct >= 70 ? '🎉' : '📚'}</div><h2>${score} / ${N} · ${pct}% · ${grade}</h2><p>${name} · ${Math.round((Date.now() - t0) / 60000)} min</p>
      <table class="tbl">${Object.entries(by).map(([id, [a, b]]) => `<tr><td>${chById(id).title}</td><td>${a}/${b}</td><td>${ring(a / b * 100, a / b >= .7 ? 'var(--acc)' : 'var(--neg)', 26)}</td></tr>`).join('')}</table>
      ${weak.length ? `<div class="banner static"><b>Drill these before the real exam:</b> ${weak.map(c => `<a href="#/ch/${c.id}/learn">${c.title}</a>`).join(', ')}</div>` : '<div class="banner static ok"><b>No weak spots.</b> You are ready. 💪</div>'}
      <h3>Review</h3><div class="review">${qs.map((q, k) => { const a = answers[k]; return `<details ${a && a.ok ? '' : 'open'}><summary>${a && a.ok ? '✅' : '❌'} Q${k + 1} · ${chById(q.ch).title}</summary><div class="rq">${q.prompt}${q.visualAfter || q.visual ? `<div class="vis">${q.visualAfter || q.visual}</div>` : ''}<p>Answer: <b>${q.type === 'mc' ? q.options[q.answer] : q.type === 'num' ? sig(q.value) + ' ' + (q.unit || '') : q.answerText}</b></p><ol>${q.steps.map(s => `<li>${s}</li>`).join('')}</ol></div></details>`; }).join('')}</div>
      <div class="cta"><a class="btn pri" href="#/exam/${sel}" onclick="setTimeout(route)">Retake with new questions</a><a class="btn" href="#/exam">All exams</a></div></article>`;
    if (pct >= 90) confetti();
    renderNav();
  }
  draw();
}

/* ---------- mistake review ---------- */
function viewReview() {
  const items = S.miss.filter(m => chById(m.ch));
  main.innerHTML = `<header class="chhead"><h1>🔁 Mistake review</h1><p>Every question you missed lands here. Get a fresh version of each one right to clear it.</p></header><div id="body"></div>`;
  const body = $('#body');
  if (!items.length) { body.innerHTML = `<article class="page result"><div class="big">✨</div><h2>No mistakes to review</h2><p>Go practice something. Anything you miss will show up here.</p><a class="btn pri" href="#/">Back home</a></article>`; return; }
  const counts = {}; items.forEach(m => counts[m.ch] = (counts[m.ch] || 0) + 1);
  body.innerHTML = `<div class="cgrid">${Object.entries(counts).map(([id, n]) => { const c = chById(id); return `<button class="ccard" data-id="${id}"><span class="em">${c.emoji}</span><b>${c.title}</b><small>${n} to redo</small></button>`; }).join('')}</div>`;
  $$('#body .ccard').forEach(b => b.onclick = () => redo(chById(b.dataset.id)));
  async function redo(c) {
    const q = newQ(c);
    body.innerHTML = `<article class="page do"><div class="pg">Redo · ${c.title}</div>${qHTML(q)}<div class="pnav" id="after" hidden><a class="btn" href="#/review" onclick="setTimeout(route)">Back to list</a><button class="btn pri" id="nextq">Another →</button></div></article>`;
    mountGeo(q);
    const r = await grade(q, body);
    if (r.ok) { const k = S.miss.findIndex(m => m.ch === c.id); if (k >= 0) S.miss.splice(k, 1); S.xp += 10; save(); renderTop(); renderNav(); pop('Cleared! +10 XP'); }
    showResult(q, r, body); $('#after').hidden = false;
    $('#nextq').onclick = () => S.miss.some(m => m.ch === c.id) ? redo(c) : viewReview();
  }
}

/* ---------- reaction flashcards (Leitner spaced repetition) ---------- */
function viewCards() {
  const now = Date.now(), INTERVAL = [0, 60e3, 10 * 60e3, 864e5, 3 * 864e5, 7 * 864e5];
  const deck = RXN.map((r, i) => ({ r, i, s: S.cards[i] || { box: 0, due: 0 } }));
  const due = deck.filter(d => d.s.due <= now).sort((a, b) => a.s.box - b.s.box || Math.random() - .5);
  const mastered = deck.filter(d => d.s.box >= 4).length;
  main.innerHTML = `<header class="chhead"><h1>🃏 Reaction flashcards</h1><p>${RXN.length} must-know reagents. Tap the card to flip it. Cards you miss come back sooner; cards you know wait longer.</p>
    <div class="boxes">${[0, 1, 2, 3, 4, 5].map(b => `<div><b>${deck.filter(d => d.s.box === b).length}</b><span>${['New', 'Learning', 'Hard', 'Good', 'Strong', 'Mastered'][b]}</span></div>`).join('')}</div></header><div id="body"></div>`;
  const body = $('#body');
  if (!due.length) { body.innerHTML = `<article class="page result"><div class="big">🎉</div><h2>All caught up</h2><p>${mastered} of ${RXN.length} cards are strong. Come back later for the next review.</p></article>`; return; }
  const d = due[0];
  body.innerHTML = `<div class="flip" id="card" tabindex="0" role="button" aria-label="Flip card"><div class="face front"><small>Reagent · ${d.r[1]}</small><div class="rg">${d.r[0]}</div><span class="tap">Tap to flip</span></div>
    <div class="face back"><small>What it does</small><p>${d.r[2]}</p>${d.r[3] ? `<em>${d.r[3]}</em>` : ''}</div></div>
    <div class="rate" id="rate" hidden><button class="btn no" data-g="0">Again</button><button class="btn" data-g="1">Hard</button><button class="btn pri" data-g="2">Got it</button><button class="btn ok" data-g="3">Easy</button></div><p class="tip center">${due.length} card${due.length > 1 ? 's' : ''} due</p>`;
  const card = $('#card'), flip = () => { card.classList.toggle('on'); $('#rate').hidden = false; };
  card.onclick = flip; card.onkeydown = e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flip(); } };
  $$('#rate button').forEach(b => b.onclick = () => {
    const g = +b.dataset.g, s = d.s; s.box = g === 0 ? 1 : Math.min(5, s.box + g); s.due = Date.now() + INTERVAL[s.box];
    S.cards[d.i] = s; if (g) { S.xp += 2; } S.days[today()] = (S.days[today()] || 0) + 1; save(); renderTop(); viewCards();
  });
}

/* ---------- toolbox ---------- */
const CATCOL = { alkali: '#FF8A6B', alkaline: '#FFB38A', transition: '#9DB7FF', 'post-transition': '#C9C6DA', metalloid: '#7FE3C8', nonmetal: '#FFE08A', halogen: '#C29BFF', noble: '#FF9CC9', lanthanide: '#FFD3A1', actinide: '#E9B8A6' };
function viewTools(t = 'table') {
  main.innerHTML = `<header class="chhead"><h1>🧰 Toolbox</h1><nav class="tabs">${[['table', '🧪 Periodic table'], ['mm', '⚖️ Molar mass'], ['pka', '📋 pKa table']].map(([k, l]) => `<a class="${t === k ? 'on' : ''}" href="#/tools/${k}">${l}</a>`).join('')}</nav></header><div id="body"></div>`;
  const body = $('#body');
  if (t === 'mm') {
    body.innerHTML = `<article class="page"><h2>Molar mass calculator</h2><form class="ans" id="mmf"><input id="mmi" placeholder="e.g. Ca(OH)2 or CuSO4·5H2O" value="C6H12O6" aria-label="Formula"><button class="btn pri">Calculate</button></form><div id="mmo"></div></article>`;
    const run = () => { try { const f = $('#mmi').value, c = parseFormula(f), M = molarMass(f); $('#mmo').innerHTML = `<p class="huge">${M.toFixed(3)} <small>g/mol</small></p><table class="tbl"><tr><th>Element</th><th>Count</th><th>Mass</th><th>%</th></tr>${Object.entries(c).map(([k, n]) => `<tr><td>${k} (${EL[k].name})</td><td>${n}</td><td>${(EL[k].mass * n).toFixed(3)}</td><td>${(EL[k].mass * n / M * 100).toFixed(1)}%</td></tr>`).join('')}</table>`; } catch (e) { $('#mmo').innerHTML = `<p class="bad">${esc(e.message)}</p>`; } };
    $('#mmf').onsubmit = e => { e.preventDefault(); run(); }; run(); return;
  }
  if (t === 'pka') { body.innerHTML = `<article class="page"><h2>pKa values to know</h2><p>Lower pK<sub>a</sub> = stronger acid. Equilibrium favors the weaker acid.</p><table class="tbl"><tr><th>Acid</th><th>pKa</th><th>Why</th></tr>${ACIDS.slice().sort((a, b) => a[1] - b[1]).map(a => `<tr><td>${a[0]}</td><td><b>${a[1]}</b></td><td>${ARIO[a[2]]}: ${a[3]}</td></tr>`).join('')}</table></article>`; return; }
  let mode = 'cat';
  const draw = () => {
    const ens = ELEMENTS.filter(e => e.en).map(e => e.en), lo = Math.min(...ens), hi = Math.max(...ens);
    const col = e => mode === 'cat' ? CATCOL[e.cat] : e.en ? `hsl(${220 - (e.en - lo) / (hi - lo) * 220} 75% 58%)` : '#3a4352';
    body.innerHTML = `<div class="ptctl"><button class="chip ${mode === 'cat' ? 'on' : ''}" data-m="cat">Color by type</button><button class="chip ${mode === 'en' ? 'on' : ''}" data-m="en">Electronegativity</button></div>
      <div class="ptable">${ELEMENTS.map(e => `<button class="el" style="grid-row:${e.row};grid-column:${e.col};--ec:${col(e)}" data-z="${e.Z}"><small>${e.Z}</small><b>${e.sym}</b></button>`).join('')}<div class="ptinfo" id="pti"><p>Tap any element.</p></div></div>`;
    $$('.ptctl .chip').forEach(b => b.onclick = () => { mode = b.dataset.m; draw(); });
    $$('.el').forEach(b => b.onclick = () => { const e = ELEMENTS[+b.dataset.z - 1]; $$('.el').forEach(x => x.classList.toggle('sel', x === b));
      $('#pti').innerHTML = `<div class="pbig" style="--ec:${col(e)}"><small>${e.Z}</small><b>${e.sym}</b></div><div><h3>${e.name}</h3><p>${e.cat.replace('-', ' ')} · group ${e.group} · period ${e.period}</p><p>Mass <b>${e.mass}</b> · EN <b>${e.en ?? '—'}</b></p><p class="cfg2">${e.Z <= 103 ? econfigShort(e.Z) : ''}</p></div>`; });
  };
  draw();
}

/* ---------- little effects ---------- */
function pop(t) { const p = document.createElement('div'); p.className = 'xp-pop'; p.textContent = t; document.body.appendChild(p); setTimeout(() => p.remove(), 1200); }
function confetti() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const cv = document.createElement('canvas'); cv.className = 'confetti'; document.body.appendChild(cv);
  const ctx = cv.getContext('2d'); cv.width = innerWidth; cv.height = innerHeight;
  const cols = ['#43D9A0', '#7FA9FF', '#FFB86B', '#FF7BAC', '#fff']; let ps = Array.from({ length: 140 }, (_, i) => ({ x: innerWidth / 2, y: innerHeight / 3, vx: (Math.random() - .5) * 18, vy: -Math.random() * 16 - 4, r: Math.random() * 6, s: 6 + Math.random() * 6, c: cols[i % 5] }));
  let f = 0; (function tick() { ctx.clearRect(0, 0, cv.width, cv.height); ps.forEach(p => { p.vy += .5; p.x += p.vx; p.y += p.vy; p.r += .2; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); ctx.restore(); }); if (++f < 160) requestAnimationFrame(tick); else cv.remove(); })();
}

/* ---------- theme, menu, keyboard ---------- */
const theme = (() => { try { return localStorage.getItem('cf-theme'); } catch (e) { return null; } })();
if (theme) document.documentElement.dataset.theme = theme;
$('#themeBtn').onclick = () => { const cur = document.documentElement.dataset.theme || 'light'; const nx = cur === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = nx; try { localStorage.setItem('cf-theme', nx); } catch (e) { } };
$('#menuBtn').onclick = () => document.body.classList.toggle('menu-open');
addEventListener('keydown', e => {
  if (e.target.matches('input,textarea')) return;
  const k = '1234'.indexOf(e.key); const opts = $$('.opt:not(:disabled)'); if (k >= 0 && opts[k]) { opts[k].click(); return; }
  if (e.key === 'Enter') { const n = $('#nextq') || $('#step') || $('#next'); if (n && !n.closest('[hidden]')) { e.preventDefault(); n.click(); } }
});
route();
