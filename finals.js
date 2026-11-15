/* ChemFluent: graded, open-note course finals, report card and course-progress sync.
   Every course final is 40 questions: the 40 hand-written questions in finaldata*.js, with up to 8 swapped for fresh
   questions from the chapter generators on each attempt, run in the shared Records.examUI (review first, cheat sheet always one tap away) and graded with Records.final.
   Routes: #/final (all finals + report card) and #/final/<courseId>. Loaded before core.js; uses its globals at call time. */
(function () {
  'use strict';
  const SITE = 'chemfluent', PASS = 70, TOTAL = 40, MINUTES = 90, MASTER = 80, FRESH = 8;
  const TRANSCRIPT = 'https://chalktalkstudy.com/readyroom/transcript.html';
  const DEEP = { '#FF8A6B': '#D9472B', '#7FA2FF': '#3D5BD9', '#FFC93C': '#A87400', '#3ED1AC': '#0F8F70', '#C29BFF': '#7646D6' };
  const NOTE = 'Self-study course completion. Not college credit.';
  const certId = cid => 'chemfluent-' + cid;
  const h = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const mix = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const letterOf = p => window.Records && Records.letter ? Records.letter(p).letter : p >= 93 ? 'A' : p >= 90 ? 'A-' : p >= 87 ? 'B+' : p >= 83 ? 'B' : p >= 80 ? 'B-' : p >= 77 ? 'C+' : p >= 73 ? 'C' : p >= 70 ? 'C-' : p >= 60 ? 'D' : 'F';
  const fmtPct = p => (Math.round(p * 10) / 10) + '%';

  /* ---------- state ---------- */
  const course = cid => COURSES.find(c => c.id === cid);
  const chapters = cid => CH.filter(c => c.course === cid);
  function fstate(cid) { S.finals ??= {}; return S.finals[cid] ??= { attempts: [] }; }
  function best(cid) { // best final percent: this app's record, or the shared Records copy on this device
    let b = null; const st = (S.finals || {})[cid]; if (st && st.attempts) st.attempts.forEach(a => { if (b == null || a.pct > b) b = a.pct; });
    try { const L = JSON.parse(localStorage.getItem('ct-grades-local') || '{}')[certId(cid)]; if (L && L.best && (b == null || L.best.percent > b)) b = L.best.percent; } catch (e) { }
    return b;
  }
  function masteredCount(cid) { return chapters(cid).filter(c => mastery(c.id) >= MASTER).length; }
  function status(cid) { const n = chapters(cid).length, m = masteredCount(cid), b = best(cid); return { n, m, mastered: n > 0 && m === n, best: b, passed: b != null && b >= PASS, earned: n > 0 && m === n && b != null && b >= PASS }; }
  function theme(cid) { const co = course(cid); return { bg: '#FFFDF7', ink: '#1D1B3A', accent: DEEP[co.color] || '#3D6BFF', font: 'Atkinson Hyperlegible' }; }
  function certOpts(cid) {
    const co = course(cid), chs = chapters(cid), b = best(cid);
    return { id: certId(cid), title: co.name, kind: 'Certificate of Completion', issuer: 'ChemFluent', site: SITE,
      detail: `All ${chs.length} chapters mastered${b != null ? ` · Final exam grade ${letterOf(b)}` : ''}`, modules: chs.map(c => c.title),
      score: b == null ? undefined : Math.round(b), theme: { bg: '#FFFDF7', ink: '#1D1B3A', accent: DEEP[co.color] || '#3D6BFF', font: 'Unbounded' }, note: NOTE };
  }

  /* ---------- cheat sheet and review ---------- */
  function sheet(cid) { const D = FINAL_DATA[cid]; return [...(D.extra || []), ...chapters(cid).map(c => ({ title: c.title, items: (D.sheet[c.id] || []).slice() }))]; }
  function review(cid) { const D = FINAL_DATA[cid]; return chapters(cid).filter(c => D.review[c.id]).map(c => ({ section: c.title, points: D.review[c.id][0], example: D.review[c.id][1] })); }
  const itemHTML = it => it && typeof it === 'object' && it.html ? it.html : h(it);

  /* ---------- questions ---------- */
  const strip = s => String(s).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
  function mcOK(q) {
    if (!Array.isArray(q.options) || q.options.length < 2 || q.answer == null || !q.options[q.answer]) return false;
    const t = q.options.map(strip); if (new Set(t).size !== t.length) return false;
    return !t.some((a, i) => t.some((b, j) => i !== j && b.length && a.startsWith(b))); // e.g. "Yes" vs "Yes, it is 1s"
  }
  function numChoices(q) {
    const v = q.value; if (typeof v !== 'number' || !isFinite(v)) return null;
    const show = x => sig(x, 3) + (q.unit ? ' ' + q.unit : '');
    const logLike = q.abs != null && Math.abs(v) < 20;
    const cands = logLike ? [v + 1, v - 1, v + 2, v - 2, 14 - v, v + 0.5, v - 0.5, v + 3] : [v * 10, v / 10, v * 2, v / 2, v * 3, v / 3, v * 4, v / 4, v * 100, v / 100];
    const gap = Math.max(3 * (q.tol || 0.02) * Math.abs(v), 3 * (q.abs || 0), 1e-12);
    const out = [show(v)], seen = new Set([strip(show(v))]);
    for (const x of mix(cands)) {
      if (!isFinite(x) || Math.abs(x - v) <= gap || (v >= 0 && x < 0)) continue;
      const s = show(x), k = strip(s); if (seen.has(k)) continue; seen.add(k); out.push(s); if (out.length === 4) break;
    }
    if (out.length < 4) return null;
    const order = mix([0, 1, 2, 3]); return { choices: order.map(i => out[i]), answer: order.indexOf(0) };
  }
  function genQ(c) {
    for (let t = 0; t < 8; t++) {
      let q; try { q = c.gen(); } catch (e) { continue; }
      if (!q || q.geo || q.mech) continue;
      let choices, answer;
      if (q.type === 'mc' && mcOK(q)) { const order = mix(q.options.map((_, i) => i)); choices = order.map(i => q.options[i]); answer = order.indexOf(q.answer); }
      else if (q.type === 'num') { const r = numChoices(q); if (!r) continue; ({ choices, answer } = r); }
      else continue;
      const vis = q.visual ? `<div class="vis cfx-vis">${q.visual}</div>` : '';
      return { ch: c.id, section: c.title, q: q.prompt + vis, choices, answer, explain: (q.steps || []).filter(Boolean).join(' '), gen: true };
    }
    return null;
  }
  function build(cid) {
    const D = FINAL_DATA[cid], chs = chapters(cid), ord = id => CH.findIndex(c => c.id === id);
    const qs = D.bank.filter(b => chById(b[0])).map(([ch, q, ch4, explain]) => { const order = mix(ch4.map((_, i) => i)); return { ch, section: chById(ch).title, q, choices: order.map(i => ch4[i]), answer: order.indexOf(0), explain }; });
    const seen = new Set(qs.map(x => strip(x.q)));
    // Retakes stay fresh: swap up to FRESH hand-written questions for new ones from the same chapter's generator.
    let swaps = 0;
    for (const i of mix(qs.map((_, i) => i))) {
      if (swaps >= FRESH) break;
      const c = chById(qs[i].ch); if (!c || !c.gen) continue;
      const g = genQ(c); if (!g) continue;
      const k = strip(g.q + g.choices.join('|')); if (seen.has(k)) continue; seen.add(k); qs[i] = g; swaps++;
    }
    let pool = mix(chs), dead = new Set(), guard = 0;
    while (qs.length < TOTAL && guard++ < TOTAL * 6 && dead.size < chs.length) {
      if (!pool.length) pool = mix(chs.filter(c => !dead.has(c.id)));
      const c = pool.shift(); if (!c || dead.has(c.id)) continue;
      const g = genQ(c); if (!g) { dead.add(c.id); continue; }
      const k = strip(g.q + g.choices.join('|')); if (seen.has(k)) continue; seen.add(k); qs.push(g);
    }
    return qs.map((q, i) => [q, i, Math.random()]).sort((a, b) => ord(a[0].ch) - ord(b[0].ch) || a[2] - b[2]).map(x => x[0]);
  }

  /* ---------- running the final ---------- */
  let running = false;
  function start(cid) {
    if (running) return;
    if (!window.Records || !Records.examUI) { const m = document.getElementById('cfxMsg'); if (m) m.textContent = 'The exam is still loading. Try again in a second.'; return; }
    const co = course(cid), stat = status(cid), qs = build(cid);
    const cert = stat.mastered ? certOpts(cid) : null;
    running = true; let again = false;
    const p = Records.examUI({
      courseId: certId(cid), title: `${co.name} final`, issuer: 'ChemFluent', site: SITE, minutes: MINUTES, passMark: PASS,
      questions: qs, review: review(cid), cheatSheet: sheet(cid), theme: theme(cid), allowHTML: true, certificate: cert,
      onDone: r => {
        const st = fstate(cid); st.attempts.push({ at: Date.now(), score: r.right, max: r.total, pct: r.percent }); st.attempts = st.attempts.slice(-30); save();
        if (cert) Object.assign(cert, certOpts(cid), { score: r.percent, detail: `All ${chapters(cid).length} chapters mastered · Final exam grade ${r.letter}` });
        const ov = document.querySelector('.rx-ov.cf-final'), top = ov && ov.querySelector('.rx-res-top');
        if (top) {
          const s = status(cid), note = document.createElement('div'); note.className = 'cfx-after ' + (r.passed ? 'ok' : 'no');
          note.innerHTML = r.passed ? (s.mastered ? `<b>🎓 Certificate unlocked.</b> You passed the final and mastered every chapter.` : `<b>Passed! Grade saved.</b> Master the last ${s.n - s.m} chapter${s.n - s.m > 1 ? 's' : ''} (80%+) to unlock your certificate.`)
            : `<b>Not passed yet.</b> You need ${PASS}% to pass. Open the cheat sheet on the sections in red, then retake with new questions.`;
          top.after(note);
          const rt = ov.querySelector('.rx-retake'); if (rt) { const nb = rt.cloneNode(true); nb.textContent = '↻ Retake with new questions'; rt.replaceWith(nb); nb.addEventListener('click', () => { again = true; const x = ov.querySelector('.rx-close'); if (x) x.click(); }); }
        }
        if (r.passed && window.confetti) { confetti(); const cv = document.querySelector('canvas.confetti'); if (cv) cv.style.zIndex = 2147482600; }
        cfProgress(true); document.dispatchEvent(new CustomEvent('cf-final-done', { detail: { cid, result: r } }));
      },
    });
    const ov = [...document.querySelectorAll('.rx-ov')].pop(); if (ov) { ov.classList.add('cf-final'); ov.style.setProperty('--cc', co.color); }
    p.then(() => { running = false; if (again) start(cid); else if (/^#\/final/.test(location.hash)) route(); }).catch(() => { running = false; });
  }

  /* ---------- pages ---------- */
  function badge(b) { return b == null ? '<span class="cfx-grade none">—</span>' : `<span class="cfx-grade g-${letterOf(b)[0]}">${letterOf(b)}</span>`; }
  function reqHTML(cid) {
    const s = status(cid);
    const step = (ok, title, sub) => `<li class="${ok ? 'ok' : ''}"><span class="cfx-tick" aria-hidden="true">${ok ? '✓' : ''}</span><div><b>${title}</b><small>${sub}</small></div></li>`;
    let certBit = '';
    if (window.Cert && (s.earned || Cert.has(certId(cid)))) certBit = Cert.button(Object.assign(certOpts(cid), { className: 'btn pri cfc-go' }));
    return `<div class="cfx-req"><h3>🎓 Certificate checklist</h3><ol>
      ${step(s.mastered, `Master every chapter (${s.m}/${s.n})`, s.mastered ? 'All chapters at 80%+.' : 'Reach 80% on each chapter’s practice.')}
      ${step(s.passed, `Pass the final with ${PASS}%+`, s.best == null ? 'Not taken yet.' : `Best: ${letterOf(s.best)} (${fmtPct(s.best)})`)}
    </ol>${certBit ? `<div class="cfx-certgo">${certBit}</div>` : ''}</div>`;
  }
  function sheetHTML(cid) {
    return sheet(cid).map((s, i) => `<section class="cfx-card" style="animation-delay:${i * 30}ms"><h4>${h(s.title)}</h4><ul>${s.items.map(it => `<li>${itemHTML(it)}</li>`).join('')}</ul></section>`).join('');
  }
  function viewOne(cid) {
    const co = course(cid), s = status(cid), st = fstate(cid), rv = review(cid), chs = chapters(cid);
    main.innerHTML = `<header class="chhead cfx-head" style="--cc:${co.color}"><a class="back" href="#/final">← All finals</a>
      <div class="cfx-top"><div class="cfx-tile" aria-hidden="true"><small>${co.code}</small><b>Fx</b><i>📝</i></div>
      <div class="cfx-tt"><span class="code">${co.code} · Final exam</span><h1>${co.name} final</h1>
      <p class="lede">A graded, comprehensive final over all ${chs.length} chapters. It’s <b>open note</b>: read the review, keep the cheat sheet open, and use it as much as you like.</p></div>
      <span class="cfx-stamp" aria-hidden="true">OPEN<br>NOTE ✓</span></div>
      <div class="cfx-pills"><span>🧪 ${TOTAL} questions</span><span>⏱️ ${MINUTES} min</span><span>✅ Pass ${PASS}%</span><span>🏅 Best ${s.best == null ? '—' : letterOf(s.best) + ' · ' + fmtPct(s.best)}</span></div>
      <div class="cta"><button class="btn pri cfx-go" id="cfxStart">Start the final →</button><a class="btn" href="#/final/${cid}" id="cfxSheetBtn">📄 Cheat sheet</a><button class="btn" id="cfxPrint">🖨 Print cheat sheet</button></div><p class="tip" id="cfxMsg" role="status"></p></header>
      ${reqHTML(cid)}
      <section class="cfx-sec"><h2>📚 Review, chapter by chapter</h2><p class="tip">Skim this first. Each card links to that chapter’s practice if you want more reps.</p>
      <div class="cfx-rev">${rv.map((r, i) => { const c = chs.find(x => x.title === r.section), m = mastery(c.id); return `<article class="cfx-card rv" style="--cc:${co.color};animation-delay:${i * 40}ms"><div class="cfx-rh"><span class="cfx-sym">${c.emoji}</span><h3>${h(r.section)}</h3>${ring(m, co.color, 30)}</div>
        <ul>${r.points.map(p => `<li>${p}</li>`).join('')}</ul><div class="cfx-ex"><b>Example.</b> ${r.example}</div><a href="#/ch/${c.id}/do">Practice ${h(c.title)} →</a></article>`; }).join('')}</div></section>
      <section class="cfx-sec" id="cfxSheet"><h2>📄 Cheat sheet</h2><p class="tip">This is the same sheet you get inside the exam. Print it or keep it open.</p><div class="cfx-sheet">${sheetHTML(cid)}</div></section>
      ${st.attempts.length ? `<section class="cfx-sec"><h2>Your attempts</h2><table class="tbl">${st.attempts.slice().reverse().slice(0, 8).map(a => `<tr><td>${new Date(a.at).toISOString().slice(0, 10)}</td><td>${a.score}/${a.max}</td><td><b>${fmtPct(a.pct)}</b></td><td>${badge(a.pct)}</td></tr>`).join('')}</table></section>` : ''}
      <p class="tip center">Self-study course grades. Not college credit or an accredited transcript.</p>`;
    $('#cfxStart').onclick = () => start(cid);
    $('#cfxPrint').onclick = () => printSheet(cid);
    $('#cfxSheetBtn').onclick = e => { e.preventDefault(); $('#cfxSheet').scrollIntoView({ behavior: 'smooth' }); };
  }
  function finalsGrid() {
    return `<div class="cfx-grid">${COURSES.filter(co => FINAL_DATA[co.id] && chapters(co.id).length).map((co, i) => { const s = status(co.id);
      return `<a class="cfx-fc ${s.passed ? 'passed' : ''}" href="#/final/${co.id}" style="--cc:${co.color};animation-delay:${i * 50}ms"><span class="code">${co.code}</span><b>${co.name}</b>${badge(s.best)}<small>${s.best == null ? 'Not taken yet' : 'Best ' + fmtPct(s.best)} · ${s.m}/${s.n} chapters mastered</small><span class="cfx-fgo">${s.best == null ? 'Take the final →' : 'Open →'}</span></a>`; }).join('')}</div>`;
  }
  function viewAll() {
    main.innerHTML = `<header class="chhead"><h1>🎓 Finals &amp; report card</h1><p class="lede">Every course ends with a graded, open-note final: ${TOTAL} questions across every chapter, a review to read first and a cheat sheet you can keep open the whole time. Your best grade goes on your report card, and passing (${PASS}%+) plus mastering every chapter earns the course certificate.</p></header>
      ${finalsGrid()}${reportBlock(false)}`;
  }
  function reportBlock(home) {
    return `<section class="course cfx-rcw"><div class="course-h"><div><span class="code">Grades</span><h2>📜 Report card</h2><small>Best final grade per course, with certificate codes.</small></div></div>
      ${home ? finalsGrid() : ''}<div class="cfx-report" data-cfx-report></div>
      <p class="cfx-tlink"><a class="btn" href="${TRANSCRIPT}" target="_blank" rel="noopener">📜 View full transcript ↗</a></p></section>`;
  }
  window.cfHomeReport = () => (window.FINAL_DATA ? reportBlock(true) : '');
  window.cfViewFinal = cid => (cid && course(cid) && FINAL_DATA[cid] ? viewOne(cid) : viewAll());
  window.cfFinal = { build, start, status, best, sheet, review, certOpts, PASS, TOTAL };

  /* ---------- report card widget (filled after render) ---------- */
  function fillReports() {
    if (!window.Records || !Records.reportCard) return;
    document.querySelectorAll('[data-cfx-report]:not([data-done])').forEach(el => { el.dataset.done = '1'; Records.reportCard(el, { site: SITE, title: 'ChemFluent courses', theme: { bg: '#FFFDF7', ink: '#1D1B3A', accent: '#3D6BFF', font: 'Atkinson Hyperlegible' } }).catch(() => { }); });
  }
  const mo = new MutationObserver(fillReports);
  addEventListener('DOMContentLoaded', () => { const m = document.getElementById('main'); if (m) mo.observe(m, { childList: true }); if (/^#\/final/.test(location.hash) && window.Cert) route(); fillReports(); cfProgress(); });
  document.addEventListener('ct-records-ready', () => setTimeout(fillReports));

  /* ---------- print the cheat sheet ---------- */
  function printSheet(cid) {
    const co = course(cid), box = document.createElement('div'); box.className = 'cfx-print';
    box.innerHTML = `<h1>${h(co.name)} final: cheat sheet</h1><p>ChemFluent · Open note: bring this to the final.</p><div class="cols">${sheet(cid).map(s => `<section><h4>${h(s.title)}</h4><ul>${s.items.map(it => `<li>${itemHTML(it)}</li>`).join('')}</ul></section>`).join('')}</div>`;
    document.body.appendChild(box); document.documentElement.classList.add('cfx-printing');
    const clean = () => { document.documentElement.classList.remove('cfx-printing'); box.remove(); removeEventListener('afterprint', clean); };
    addEventListener('afterprint', clean); window.print(); setTimeout(clean, 1500);
  }

  /* ---------- course progress -> account (Records.progress; no-op when signed out) ---------- */
  let pT = 0;
  function cfProgress(now) {
    clearTimeout(pT);
    const run = () => { if (!window.Records || !Records.progress) return;
      COURSES.forEach(co => { const chs = chapters(co.id); if (!chs.length) return; const s = status(co.id), name = co.code + ' ';
        const mocks = [...(S.exams || []).filter(e => e.at && (e.cid === co.id || String(e.name).startsWith(name))).map(e => ({ at: e.at, score: e.score != null ? e.score : e.pct, max: e.max || 100, full: false })),
          ...((S.finals || {})[co.id] || { attempts: [] }).attempts.map(a => ({ at: a.at, score: a.score, max: a.max, full: true }))];
        Records.progress(SITE, certId(co.id), { lessonsDone: s.m, lessonsTotal: s.n, mocks, passReady: s.mastered }); }); };
    if (now) run(); else pT = setTimeout(run, 1200);
  }
  window.cfProgress = cfProgress;

  /* ---------- styles ---------- */
  const css = document.createElement('style');
  css.textContent = `
.cfx-head .cfx-top{display:flex;align-items:center;gap:18px;flex-wrap:wrap;position:relative}
.cfx-tile{position:relative;width:86px;height:94px;flex:none;border:var(--bw) solid var(--ink);border-radius:14px;background:var(--cc);color:#10132A;box-shadow:var(--sh);display:grid;place-items:center;animation:tileIn .8s cubic-bezier(.2,1.6,.4,1)}
.cfx-tile small{position:absolute;left:6px;top:3px;font:700 9px "Atkinson Hyperlegible",sans-serif}.cfx-tile b{font:800 34px Unbounded,sans-serif}.cfx-tile i{position:absolute;right:6px;bottom:2px;font-style:normal;font-size:18px}
.cfx-tt{flex:1 1 300px;min-width:0}.cfx-tt h1{margin:.1em 0 .2em}.cfx-tt .lede{margin:0}
.cfx-stamp{position:absolute;right:0;top:-6px;transform:rotate(9deg);font:800 13px/1.15 Unbounded,sans-serif;color:var(--c1);border:3px solid var(--c1);border-radius:10px;padding:6px 10px;text-align:center;background:color-mix(in srgb,var(--paper) 85%,transparent);animation:cfxStamp .7s cubic-bezier(.2,1.8,.4,1) .3s both}
@keyframes cfxStamp{from{transform:rotate(-20deg) scale(2.4);opacity:0}}
.cfx-pills{display:flex;gap:8px;flex-wrap:wrap;margin:16px 0 4px}.cfx-pills span{padding:5px 12px;border:2px solid var(--ink);border-radius:999px;background:var(--panel);font-weight:700;font-size:14px}
.cfx-go{font-size:17px;padding:13px 22px;animation:cfxPulse 2.4s ease-in-out infinite}
@keyframes cfxPulse{50%{transform:translate(-2px,-2px);box-shadow:var(--sh2)}}
.cfx-req{margin:0 0 22px;padding:16px 18px;border:var(--bw) solid var(--ink);border-radius:var(--r);background:var(--panel);box-shadow:var(--sh)}
.cfx-req h3{margin:0 0 8px;font-size:18px}.cfx-req ol{list-style:none;margin:0;padding:0;display:grid;gap:8px}
.cfx-req li{display:flex;gap:12px;align-items:center}.cfx-req li b{display:block}.cfx-req li small{color:var(--muted)}
.cfx-tick{width:30px;height:30px;flex:none;display:grid;place-items:center;border:2.5px solid var(--ink);border-radius:9px;background:var(--panel2);font-weight:800}
.cfx-req li.ok .cfx-tick{background:var(--c4);color:#10132A;animation:tileIn .6s cubic-bezier(.2,1.6,.4,1)}
.cfx-certgo{margin-top:12px}
.cfx-sec{margin:26px 0}.cfx-sec>h2{margin:0 0 4px}
.cfx-rev{display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:14px;margin-top:10px}
.cfx-card{border:var(--bw) solid var(--ink);border-radius:var(--r);background:var(--panel);box-shadow:var(--sh);padding:14px 16px;animation:cfxIn .45s cubic-bezier(.2,1.3,.4,1) both;min-width:0;overflow-wrap:anywhere}
@keyframes cfxIn{from{opacity:0;transform:translateY(14px) scale(.97)}}
.cfx-card.rv{border-top:10px solid var(--cc)}
.cfx-rh{display:flex;align-items:center;gap:10px}.cfx-rh h3{flex:1;margin:0;font-size:16px}.cfx-sym{font-size:22px}
.cfx-card ul{margin:8px 0;padding-left:20px}.cfx-card li{margin:3px 0}
.cfx-ex{padding:8px 10px;border-left:4px solid var(--cc,var(--c3));background:var(--panel2);border-radius:0 10px 10px 0;font-size:15px;margin:8px 0}
.cfx-card.rv>a{font-weight:700;font-size:15px}
.cfx-sheet{columns:3 280px;column-gap:14px;margin-top:10px}
.cfx-sheet .cfx-card{break-inside:avoid;margin:0 0 14px;display:inline-block;width:100%;background:var(--panel);background-image:linear-gradient(var(--grid) 1px,transparent 1px);background-size:100% 26px}
.cfx-sheet h4{margin:0 0 4px;font:800 15px Unbounded,"Arial Black",sans-serif;color:var(--ink)}
.cfx-sheet li{font-size:15px}
.cfx-t{width:100%;border-collapse:collapse;font-size:13.5px;margin:4px 0}.cfx-t th,.cfx-t td{border:1px solid color-mix(in srgb,var(--ink) 25%,transparent);padding:3px 6px;text-align:left}.cfx-t th{background:var(--panel2)}
.cfx-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:14px;margin:0 0 18px}
.cfx-fc{position:relative;display:flex;flex-direction:column;gap:4px;padding:14px 16px 12px;border:var(--bw) solid var(--ink);border-radius:var(--r);background:var(--panel);box-shadow:var(--sh);color:var(--ink);text-decoration:none;border-top:10px solid var(--cc);transition:transform .12s,box-shadow .12s;animation:cfxIn .45s cubic-bezier(.2,1.3,.4,1) both}
.cfx-fc:hover{transform:translate(-2px,-2px);box-shadow:var(--sh2)}
.cfx-fc .code{align-self:flex-start;max-width:calc(100% - 56px);font-size:12px;font-weight:800;letter-spacing:.08em;color:var(--muted)}.cfx-fc b{font:800 16px/1.2 Unbounded,sans-serif;padding-right:52px}.cfx-fc small{color:var(--muted)}
.cfx-fc .cfx-grade{position:absolute;right:12px;top:12px}
.cfx-fgo{margin-top:4px;font-weight:700;color:var(--acc2)}
.cfx-grade{display:inline-grid;place-items:center;min-width:44px;height:40px;padding:0 6px;border:2.5px solid var(--ink);border-radius:10px;font:800 17px Unbounded,sans-serif;background:var(--panel2);color:var(--ink)}
.cfx-grade.g-A{background:var(--c4);color:#10132A}.cfx-grade.g-B{background:#9DB7FF;color:#10132A}.cfx-grade.g-C{background:var(--c3);color:#10132A}.cfx-grade.g-D,.cfx-grade.g-F{background:#FF9C8A;color:#10132A}
.cfx-fc.passed .cfx-grade{animation:wob .6s .3s}
.cfx-report .rx-rc{max-width:none;border:var(--bw) solid var(--ink);box-shadow:var(--sh);border-radius:var(--r)}
.cfx-report .rx-rc h3{font-family:Unbounded,"Arial Black",sans-serif}
.cfx-tlink{margin:14px 0 0}
/* exam overlay, ChemFluent style */
.rx-ov.cf-final{background:#FFFDF7 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28'%3E%3Cpath d='M28 0H0v28' fill='none' stroke='%231D1B3A' stroke-opacity='.06'/%3E%3C/svg%3E")}
.rx-ov.cf-final .rx-head{border-bottom:3px solid #1D1B3A;background:color-mix(in srgb,var(--cc) 30%,#FFFDF7)}
.rx-ov.cf-final .rx-head .rx-t,.rx-ov.cf-final .rx-main h1,.rx-ov.cf-final .rx-main h2,.rx-ov.cf-final .rx-big b{font-family:Unbounded,"Arial Black",sans-serif;letter-spacing:-.02em}
.rx-ov.cf-final .rx-badge{border:2px solid #1D1B3A;background:#FFC93C;color:#1D1B3A}
.rx-ov.cf-final .rx-b{border:2.5px solid #1D1B3A;box-shadow:3px 3px 0 #1D1B3A;transition:transform .12s,box-shadow .12s}
.rx-ov.cf-final .rx-b:not([disabled]):hover{transform:translate(-2px,-2px);box-shadow:5px 5px 0 #1D1B3A}
.rx-ov.cf-final .rx-b.ghost{background:#fff;border-color:#1D1B3A}
.rx-ov.cf-final .rx-c{border:2.5px solid #1D1B3A;box-shadow:3px 3px 0 #1D1B3A;background:#fff;transition:transform .12s,box-shadow .12s}
.rx-ov.cf-final .rx-c:hover{transform:translate(-2px,-2px);box-shadow:5px 5px 0 #1D1B3A}
.rx-ov.cf-final .rx-c[aria-checked="true"]{background:color-mix(in srgb,var(--cc) 35%,#fff);box-shadow:3px 3px 0 #1D1B3A;animation:cfxPick .35s cubic-bezier(.2,1.8,.4,1)}
@keyframes cfxPick{40%{transform:scale(1.03)}}
.rx-ov.cf-final .rx-c .rx-l{border:2px solid #1D1B3A}
.rx-ov.cf-final .rx-q{animation:cfxIn .35s ease both}
.rx-ov.cf-final .rx-q .vis,.rx-ov.cf-final .rx-wrong .vis,.rx-ov.cf-final .rx-q table{font-weight:400;font-size:16px}
.rx-ov.cf-final .vis{--ink:#1D1B3A;--paper2:#F4F5FA;--panel:#fff;--panel2:#F4F5FA;--muted:#5E5A7A;--grid:rgba(40,40,90,.06);color:#1D1B3A;border-color:#1D1B3A}
.rx-ov.cf-final .vis svg.mol{max-height:220px}
.rx-ov.cf-final .rx-q .tbl,.rx-ov.cf-final .rx-q table{border-collapse:collapse;margin:8px 0}.rx-ov.cf-final .rx-q td,.rx-ov.cf-final .rx-q th{border:1px solid #c9c6da;padding:4px 8px}
.rx-ov.cf-final .rx-rev section,.rx-ov.cf-final .rx-wrong,.rx-ov.cf-final .rx-call{border:2.5px solid #1D1B3A;box-shadow:3px 3px 0 #1D1B3A;background:#fff}
.rx-ov.cf-final .rx-call{background:#FFF3C4}
.rx-ov.cf-final .rx-cs-b section{border:2px solid #1D1B3A}
.rx-ov.cf-final .rx-cs-b h4{font-family:Unbounded,"Arial Black",sans-serif}
.rx-ov.cf-final .rx-big{animation:tileIn .8s cubic-bezier(.2,1.6,.4,1)}
.rx-ov.cf-final .rx-map button{border:2px solid #1D1B3A}
.rx-ov.cf-final .rx-bar{border:1.5px solid #1D1B3A;height:9px}
.cfx-after{margin:0 0 14px;padding:12px 14px;border:2.5px solid #1D1B3A;border-radius:14px;box-shadow:3px 3px 0 #1D1B3A;background:#FFF3C4}.cfx-after.ok{background:#C9F2E4}.cfx-after b{display:block}
.rx-ov.cf-final li:has(>table){list-style:none;margin-left:-18px}
.cfx-print{display:none}
@media print{html.cfx-printing body>*:not(.cfx-print){display:none!important}html.cfx-printing .cfx-print{display:block!important;color:#000;font:10.5pt/1.4 Georgia,serif}
  .cfx-print .cols{columns:2;column-gap:18pt}.cfx-print section{break-inside:avoid;margin:0 0 8pt}.cfx-print h4{margin:0 0 2pt}.cfx-print ul{margin:0;padding-left:14pt}.cfx-print table{border-collapse:collapse}.cfx-print td,.cfx-print th{border:1px solid #999;padding:1pt 4pt}}
@media (max-width:600px){.cfx-stamp{position:static;transform:rotate(6deg);order:3}.cfx-head .cfx-top{gap:12px}.cfx-tile{width:68px;height:76px}.cfx-tile b{font-size:26px}.cfx-sheet{columns:1}.cfx-rev{grid-template-columns:1fr}}
@media (prefers-reduced-motion:reduce){.cfx-go,.cfx-stamp,.cfx-card,.cfx-fc{animation:none!important}}`;
  document.head.appendChild(css);
})();
