// ChemFluent copy (chemfluent.com): endpoint defaults to https://chalktalkstudy.com (cross-domain records API).
// Records: final-exam grades, report cards, transcripts and course progress, shared by every course site.
//   Records.final({courseId, title, issuer, site, score, max, sections:[{name,score,max}], certId?}) -> Promise<{percent, letter, gpaPoints, saved}>
//   Records.reportCard(container, {site?, theme?, title?}) -> Promise   (renders a report-card widget)
//   Records.examUI({courseId, title, issuer, site, questions:[{q, choices[], answer, explain, section}], minutes, passMark,
//                   review:[{section, points[], example?}], cheatSheet: HTML | [{title, items[]}], theme, certificate?}) -> Promise<result|null>
//   Records.progress(site, course, {lessonsDone, lessonsTotal, mocks:[{at,score,max,full?}], passReady}) (debounced; signed-in only)
//   Records.letter(percent) -> {letter, gpaPoints} · Records.transcriptUrl() · Records.sync()
// Every final is OPEN NOTE: examUI always offers a review first, a cheat sheet during the exam, and links wrong answers to it.
// Settings (read at call time): Records.endpoint (API base, default same origin, or window.CT_RECORDS_ENDPOINT / Cert.endpoint),
// Records.token (optional bearer token: string or function). Anonymous visitors get a random device id ('ct-device-id').
(function () {
  if (window.Records && window.Records.__ct) return;
  const PRE = window.Records && typeof window.Records === 'object' ? window.Records : {};
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const DEVICE = 'ct-device-id', QUEUE = 'ct-grades-queue', LOCAL = 'ct-grades-local';
  const SCALE = [[93, 'A', 4.0], [90, 'A-', 3.7], [87, 'B+', 3.3], [83, 'B', 3.0], [80, 'B-', 2.7], [77, 'C+', 2.3], [73, 'C', 2.0], [70, 'C-', 1.7], [60, 'D', 1.0], [0, 'F', 0]];
  function letter(p) { p = Number(p) || 0; for (const [m, l, g] of SCALE) if (p >= m) return { letter: l, gpaPoints: g }; return { letter: 'F', gpaPoints: 0 }; }
  const jget = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k) || 'null'); return v == null ? d : v; } catch (e) { return d; } };
  const jset = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  function deviceId() {
    if (window.Cert && window.Cert.deviceId) return window.Cert.deviceId();
    let d = ''; try { d = localStorage.getItem(DEVICE) || ''; } catch (e) {}
    if (!/^d_[a-f0-9]{24}$/.test(d)) { const a = new Uint8Array(12); crypto.getRandomValues(a); d = 'd_' + Array.from(a, b => b.toString(16).padStart(2, '0')).join(''); try { localStorage.setItem(DEVICE, d); } catch (e) {} }
    return d;
  }
  const cfg = k => (window.Records && window.Records[k]) || '';
  const endpoint = () => String(cfg('endpoint') || window.CT_RECORDS_ENDPOINT || (window.Cert && window.Cert.endpoint) || '').replace(/\/+$/, '');
  function base() { let o = location.origin; try { if (endpoint()) o = new URL(endpoint(), location.href).origin; } catch (e) {} return /^https?:/.test(o) ? o : 'https://chalktalkstudy.com'; }
  const transcriptUrl = () => base() + '/readyroom/transcript.html';
  const verifyUrl = c => (window.Cert && window.Cert.verifyUrl) ? window.Cert.verifyUrl(c) : base() + '/readyroom/verify.html?c=' + encodeURIComponent(c);
  function headers() { const h = { 'content-type': 'application/json', 'x-ct-device': deviceId() }; let t = cfg('token') || (window.Cert && window.Cert.token) || ''; try { if (typeof t === 'function') t = t(); } catch (e) { t = ''; } if (t) h.authorization = 'Bearer ' + t; return h; }
  async function api(method, p, body, extra) {
    let res; try { res = await fetch(endpoint() + p, Object.assign({ method, headers: headers(), credentials: endpoint() ? 'omit' : 'same-origin', body: body ? JSON.stringify(body) : undefined }, extra || {})); }
    catch (e) { throw Object.assign(new Error('You seem to be offline.'), { network: true }); }
    let j = {}; try { j = await res.json(); } catch (e) {}
    if (!res.ok) throw Object.assign(new Error(j.error || 'Something went wrong.'), { status: res.status, code: j.code });
    return j;
  }
  const siteOf = o => String((o && o.site) || (location.pathname.split('/')[1] || '')).toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40);

  /* ---------- colours (theme) ---------- */
  function rgb(h) { h = String(h || '').trim(); let m = /^#?([0-9a-f]{3})$/i.exec(h); if (m) h = m[1].split('').map(c => c + c).join(''); m = /^#?([0-9a-f]{6})/i.exec(h); if (m) { const n = parseInt(m[1], 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; } return null; }
  const hex = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const mix = (a, b, t) => { const x = rgb(a), y = rgb(b); return x && y ? hex(x.map((v, i) => v + (y[i] - v) * t)) : a; };
  const lum = c => { const x = rgb(c) || [255, 255, 255]; return (0.299 * x[0] + 0.587 * x[1] + 0.114 * x[2]) / 255; };
  function vars(t) {
    t = Object.assign({ bg: '#fbfaf6', ink: '#1c2230', accent: '#2453d6', font: '' }, t || {});
    ['bg', 'ink', 'accent'].forEach(k => { if (!rgb(t[k])) t[k] = { bg: '#fbfaf6', ink: '#1c2230', accent: '#2453d6' }[k]; });
    const dark = lum(t.bg) < 0.45, on = lum(t.accent) > 0.55 ? mix(t.accent, '#000000', 0.85) : '#ffffff';
    const font = t.font ? `"${String(t.font).replace(/["\\]/g, '')}",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif` : 'system-ui,-apple-system,"Segoe UI",Roboto,sans-serif';
    return `--rx-bg:${t.bg};--rx-ink:${t.ink};--rx-accent:${t.accent};--rx-on:${on};--rx-muted:${mix(t.ink, t.bg, 0.4)};--rx-line:${mix(t.ink, t.bg, 0.82)};--rx-panel:${mix(t.bg, dark ? '#ffffff' : '#000000', dark ? 0.06 : 0.03)};--rx-soft:${mix(t.accent, t.bg, 0.88)};--rx-font:${font};--rx-ok:${dark ? '#5fd39a' : '#17804f'};--rx-bad:${dark ? '#ff8a8a' : '#c0302b'};--rx-warn:${dark ? '#ffd166' : '#a76500'};color-scheme:${dark ? 'dark' : 'light'}`;
  }
  const gradeTone = l => { const c = String(l || '')[0]; return c === 'A' ? 'a' : c === 'B' ? 'b' : c === 'C' ? 'c' : c === 'D' ? 'd' : c === 'F' ? 'f' : 'n'; };

  /* ---------- CSS ---------- */
  const CSS = `
.rx,.rx *{box-sizing:border-box}
.rx [hidden]{display:none!important}
.rx{font-family:var(--rx-font);color:var(--rx-ink);line-height:1.5;-webkit-text-size-adjust:100%}
.rx button{font:inherit}
.rx .rx-b{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:46px;padding:0 18px;border-radius:12px;border:1.5px solid var(--rx-accent);background:var(--rx-accent);color:var(--rx-on);font-weight:700;font-size:15px;cursor:pointer;text-decoration:none;line-height:1.1;text-align:center}
.rx .rx-b.ghost{background:transparent;color:var(--rx-ink);border-color:var(--rx-line)}
.rx .rx-b.small{min-height:38px;padding:0 12px;font-size:14px;border-radius:10px}
.rx .rx-b[disabled]{opacity:.45;cursor:not-allowed}
.rx .rx-b:focus-visible,.rx button:focus-visible,.rx a:focus-visible,.rx input:focus-visible{outline:3px solid var(--rx-accent);outline-offset:2px}
.rx .rx-sr{position:absolute!important;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.rx .rx-k{margin:0 0 6px;font-size:12px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--rx-accent)}
.rx .rx-badge{display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:999px;font-size:12px;font-weight:800;background:var(--rx-soft);color:var(--rx-ink);border:1px solid var(--rx-line);white-space:nowrap}
.rx .rx-chip{display:inline-flex;align-items:center;justify-content:center;min-width:42px;height:30px;padding:0 8px;border-radius:9px;font-weight:800;font-size:15px}
.rx .rx-g-a{background:rgba(23,128,79,.14);color:var(--rx-ok)}.rx .rx-g-b{background:rgba(36,83,214,.13);color:var(--rx-accent)}.rx .rx-g-c{background:rgba(167,101,0,.14);color:var(--rx-warn)}
.rx .rx-g-d{background:rgba(200,90,20,.15);color:var(--rx-warn)}.rx .rx-g-f{background:rgba(192,48,43,.13);color:var(--rx-bad)}.rx .rx-g-n{background:var(--rx-panel);color:var(--rx-muted)}
/* report card */
.rx-rc{background:var(--rx-bg);border:1px solid var(--rx-line);border-radius:18px;padding:20px;box-shadow:0 10px 30px rgba(0,0,0,.08);max-width:760px}
.rx-rc-top{display:flex;gap:16px;align-items:center;justify-content:space-between;flex-wrap:wrap;margin-bottom:14px}
.rx-rc h3{margin:0;font-size:22px;line-height:1.15}
.rx-rc-gpa{display:flex;align-items:center;gap:12px}
.rx-ring{width:74px;height:74px;border-radius:50%;display:grid;place-items:center;background:conic-gradient(var(--rx-accent) calc(var(--p)*1%),var(--rx-line) 0);flex:none}
.rx-ring>span{width:60px;height:60px;border-radius:50%;background:var(--rx-bg);display:grid;place-items:center;font-weight:800;font-size:19px}
.rx-rc table{width:100%;border-collapse:collapse;font-size:15px}
.rx-rc th{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--rx-muted);text-align:left;padding:6px 8px;border-bottom:1px solid var(--rx-line)}
.rx-rc td{padding:10px 8px;border-bottom:1px solid var(--rx-line);vertical-align:middle}
.rx-rc td small{display:block;color:var(--rx-muted);font-size:12.5px}
.rx-rc .rx-code{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12.5px;color:var(--rx-accent);text-decoration:none;white-space:nowrap}
.rx-rc .rx-pct{font-variant-numeric:tabular-nums;font-weight:700;white-space:nowrap}
.rx-rc-foot{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center;margin-top:14px}
.rx-rc-foot a{color:var(--rx-accent);font-weight:700;text-decoration:none}
.rx-rc .rx-note{font-size:12px;color:var(--rx-muted);margin:10px 0 0}
.rx-rc-empty{padding:18px;border:1.5px dashed var(--rx-line);border-radius:14px;color:var(--rx-muted);text-align:center}
.rx-rc small.rx-show-sm{display:none}
@media (max-width:560px){.rx-rc{padding:16px}.rx-rc .rx-hide-sm{display:none}.rx-rc small.rx-show-sm{display:block}.rx-rc td{padding:9px 5px}.rx-rc th{padding:6px 5px}}
/* exam */
.rx-ov{position:fixed;inset:0;z-index:2147482000;background:var(--rx-bg);display:flex;flex-direction:column;overflow:hidden}
.rx-head{flex:none;display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid var(--rx-line);background:var(--rx-panel)}
.rx-head .rx-t{flex:1;min-width:0;font-weight:800;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.rx-timer{font-variant-numeric:tabular-nums;font-weight:800;font-size:16px;padding:4px 10px;border-radius:9px;border:1px solid var(--rx-line);white-space:nowrap}
.rx-timer.low{color:var(--rx-bad);border-color:var(--rx-bad)}
.rx-x{width:40px;height:40px;border-radius:50%;border:1px solid var(--rx-line);background:transparent;color:var(--rx-ink);font-size:20px;cursor:pointer;flex:none}
.rx-body{flex:1;display:flex;min-height:0}
.rx-main{flex:1;overflow:auto;padding:22px 16px 40px;-webkit-overflow-scrolling:touch}
.rx-in{max-width:760px;margin:0 auto}
.rx-main h1{font-size:clamp(24px,5vw,34px);line-height:1.1;margin:0 0 10px}
.rx-main h2{font-size:20px;margin:22px 0 10px}
.rx-pills{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0 16px}
.rx-pill{padding:5px 12px;border-radius:999px;background:var(--rx-panel);border:1px solid var(--rx-line);font-size:14px;font-weight:600}
.rx-call{display:flex;gap:12px;padding:14px 16px;border-radius:14px;background:var(--rx-soft);border:1px solid var(--rx-line);margin:0 0 18px}
.rx-call b{display:block}
.rx-rev{display:grid;gap:12px}
.rx-rev section{border:1px solid var(--rx-line);border-radius:14px;padding:14px 16px;background:var(--rx-panel)}
.rx-rev h3{margin:0 0 6px;font-size:17px}
.rx-rev ul{margin:0;padding-left:20px}.rx-rev li{margin:3px 0}
.rx-ex{margin-top:8px;padding:10px 12px;border-left:3px solid var(--rx-accent);background:var(--rx-bg);border-radius:0 10px 10px 0;font-size:14.5px}
.rx-actions{display:flex;gap:10px;flex-wrap:wrap;margin:20px 0}
.rx-prog{display:flex;justify-content:space-between;gap:10px;font-size:13.5px;color:var(--rx-muted);font-weight:600;margin-bottom:6px}
.rx-bar{height:6px;border-radius:99px;background:var(--rx-line);overflow:hidden;margin-bottom:18px}.rx-bar>i{display:block;height:100%;background:var(--rx-accent);transition:width .2s}
.rx-q{font-size:clamp(18px,3.6vw,21px);font-weight:700;line-height:1.4;margin:6px 0 16px}
.rx-sec{font-size:12px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--rx-accent)}
.rx-choices{display:grid;gap:10px}
.rx-c{display:flex;align-items:flex-start;gap:12px;width:100%;text-align:left;padding:13px 14px;border-radius:14px;border:1.5px solid var(--rx-line);background:var(--rx-panel);color:var(--rx-ink);cursor:pointer;font-size:16px;line-height:1.4}
.rx-c:hover{border-color:var(--rx-accent)}
.rx-c[aria-checked="true"]{border-color:var(--rx-accent);background:var(--rx-soft);box-shadow:0 0 0 2px var(--rx-accent) inset}
.rx-c .rx-l{flex:none;width:28px;height:28px;border-radius:8px;display:grid;place-items:center;font-weight:800;font-size:14px;border:1.5px solid var(--rx-line);background:var(--rx-bg)}
.rx-c[aria-checked="true"] .rx-l{background:var(--rx-accent);color:var(--rx-on);border-color:var(--rx-accent)}
.rx-nav{display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap;margin:18px 0}
.rx-flag[aria-pressed="true"]{border-color:var(--rx-warn)!important;color:var(--rx-warn)!important}
.rx-map{display:grid;grid-template-columns:repeat(auto-fill,minmax(40px,1fr));gap:6px;margin-top:8px}
.rx-map button{height:40px;border-radius:9px;border:1.5px solid var(--rx-line);background:var(--rx-bg);color:var(--rx-ink);font-weight:700;cursor:pointer;position:relative}
.rx-map button.done{background:var(--rx-soft);border-color:var(--rx-accent)}
.rx-map button.cur{box-shadow:0 0 0 2px var(--rx-ink)}
.rx-map button.flag::after{content:"";position:absolute;top:3px;right:3px;width:8px;height:8px;border-radius:50%;background:var(--rx-warn)}
.rx-legend{display:flex;gap:14px;flex-wrap:wrap;font-size:12.5px;color:var(--rx-muted);margin-top:8px}
.rx-res-top{display:flex;gap:18px;align-items:center;flex-wrap:wrap;margin:6px 0 14px}
.rx-big{width:120px;height:120px;border-radius:50%;display:grid;place-items:center;background:conic-gradient(var(--rx-accent) calc(var(--p)*1%),var(--rx-line) 0);flex:none}
.rx-big>span{width:98px;height:98px;border-radius:50%;background:var(--rx-bg);display:grid;place-items:center;text-align:center;line-height:1}
.rx-big b{font-size:38px;display:block}.rx-big small{font-size:13px;color:var(--rx-muted);font-weight:700}
.rx-pass{font-weight:800}.rx-pass.ok{color:var(--rx-ok)}.rx-pass.no{color:var(--rx-bad)}
.rx-secs{display:grid;gap:10px}
.rx-srow{display:grid;grid-template-columns:minmax(0,1fr) 64px;gap:4px 12px;align-items:center}
.rx-srow .rx-bar{margin:0;grid-column:1/3;height:8px}
.rx-wrong{border:1px solid var(--rx-line);border-radius:14px;padding:14px 16px;margin:10px 0;background:var(--rx-panel)}
.rx-wrong p{margin:4px 0}.rx-wrong .bad{color:var(--rx-bad);font-weight:700}.rx-wrong .good{color:var(--rx-ok);font-weight:700}
.rx-link{background:none;border:0;padding:0;color:var(--rx-accent);font-weight:700;cursor:pointer;text-decoration:underline;text-underline-offset:3px}
.rx-status{font-size:14px;color:var(--rx-muted);margin:4px 0 0}
/* cheat sheet: side panel (desktop) / bottom sheet (phone) */
.rx-cs{flex:none;width:0;overflow:hidden;border-left:1px solid var(--rx-line);background:var(--rx-panel);display:flex;flex-direction:column;transition:width .2s}
.rx-ov.cs-open .rx-cs{width:min(400px,42vw)}
.rx-cs-h{display:flex;align-items:center;gap:8px;padding:12px 14px;border-bottom:1px solid var(--rx-line)}
.rx-cs-h b{flex:1;font-size:16px}
.rx-cs-s{padding:10px 14px;border-bottom:1px solid var(--rx-line)}
.rx-cs-s input{width:100%;height:42px;border-radius:10px;border:1.5px solid var(--rx-line);background:var(--rx-bg);color:var(--rx-ink);padding:0 12px;font:inherit;font-size:15px}
.rx-cs-b{flex:1;overflow:auto;padding:12px 14px 20px;font-size:14.5px;min-width:300px}
.rx-cs-b section{margin:0 0 14px;padding:10px 12px;border-radius:12px;background:var(--rx-bg);border:1px solid var(--rx-line);scroll-margin-top:10px}
.rx-cs-b section.hit{box-shadow:0 0 0 2px var(--rx-accent)}
.rx-cs-b h4{margin:0 0 6px;font-size:15px;color:var(--rx-accent)}
.rx-cs-b ul{margin:0;padding-left:18px}.rx-cs-b li{margin:3px 0}
.rx-cs-b mark{background:rgba(255,209,102,.55);color:inherit;border-radius:3px}
.rx-cs-f{display:flex;gap:8px;padding:10px 14px;border-top:1px solid var(--rx-line);flex-wrap:wrap}
.rx-cs-none{color:var(--rx-muted);font-size:14px}
.rx-scrim{display:none}
@media (max-width:860px){
  .rx-cs{position:fixed;left:0;right:0;bottom:0;width:auto!important;height:0;max-height:78dvh;border-left:0;border-top:1px solid var(--rx-line);border-radius:18px 18px 0 0;box-shadow:0 -14px 40px rgba(0,0,0,.25);transition:height .22s;z-index:3}
  .rx-ov.cs-open .rx-cs{height:72dvh}
  .rx-ov.cs-open .rx-scrim{display:block;position:fixed;inset:0;background:rgba(0,0,0,.25);z-index:2}
  .rx-cs-b{min-width:0}
  .rx-cs-h::before{content:"";position:absolute;left:50%;top:6px;width:40px;height:4px;margin-left:-20px;border-radius:9px;background:var(--rx-line)}
  .rx-cs-h{position:relative;padding-top:16px}
  .rx-head{padding:8px 10px;gap:6px}
  .rx-head .rx-b.small{padding:0 10px}
}
@media (max-width:520px){.rx-head .rx-t{display:none}.rx-head{justify-content:flex-end}.rx-head>.rx-badge{margin-right:auto;font-size:11px;padding:2px 7px}.rx-timer{font-size:15px;padding:3px 8px}}
@media (prefers-reduced-motion:reduce){.rx-cs,.rx-bar>i{transition:none}}
.rx-print{display:none}
@media print{
  html.rx-printing body>*:not(.rx-print){display:none!important}
  html.rx-printing .rx-print{display:block!important;color:#000;font:11pt/1.4 Georgia,serif}
  .rx-print h1{font-size:18pt;margin:0 0 4pt}.rx-print .cols{columns:2;column-gap:18pt}
  .rx-print section{break-inside:avoid;margin:0 0 8pt}.rx-print h4{margin:0 0 2pt;font-size:12pt}.rx-print ul{margin:0;padding-left:14pt}
}`;
  function injectCSS() { if (document.getElementById('rx-css')) return; const s = document.createElement('style'); s.id = 'rx-css'; s.textContent = CSS; (document.head || document.documentElement).appendChild(s); }

  /* ---------- grades: post, queue offline, sync ---------- */
  function keepLocal(body, r) {
    const L = jget(LOCAL, {}), c = L[body.courseId] || { courseId: body.courseId };
    Object.assign(c, { title: body.title, issuer: body.issuer, site: body.site });
    if (!c.best || r.percent > c.best.percent) c.best = { percent: r.percent, letter: r.letter, gpaPoints: r.gpaPoints, date: new Date(body.at).toISOString().slice(0, 10) };
    c.attempts = (c.attempts || 0) + 1; L[body.courseId] = c; jset(LOCAL, L);
  }
  async function final(o) {
    o = o || {};
    const max = Number(o.max), score = Number(o.score);
    if (!(max > 0) || !(score >= 0)) return Promise.reject(new Error('Records.final needs score and max.'));
    const body = { courseId: String(o.courseId || o.id || ''), title: o.title || '', issuer: o.issuer || '', site: siteOf(o), score, max, certId: o.certId || undefined, name: o.name || undefined,
      sections: (o.sections || []).map(s => ({ name: s.name, score: s.score, max: s.max })), attempts: o.attempts, at: Date.now(), device: deviceId() };
    if (!body.courseId) return Promise.reject(new Error('Records.final needs a courseId.'));
    const percent = Math.round(score / max * 1000) / 10, local = Object.assign({ percent }, letter(percent));
    try {
      const r = await api('POST', '/api/grades/final', body);
      keepLocal(body, r); return Object.assign({ saved: true }, r);
    } catch (e) {
      keepLocal(body, local);
      if (e.network || e.status >= 500 || e.status === 401) { const q = jget(QUEUE, []); q.push(body); jset(QUEUE, q.slice(-50)); }
      return Object.assign({ saved: false, queued: !!(e.network || e.status >= 500 || e.status === 401), error: e.message, code: e.code }, local);
    }
  }
  let syncing = null;
  function sync() {
    if (syncing) return syncing;
    syncing = (async () => {
      const q = jget(QUEUE, []); if (!q.length) return 0; const keep = []; let sent = 0;
      for (const b of q) { try { b.device = deviceId(); await api('POST', '/api/grades/final', b); sent++; } catch (e) { if (e.network || e.status >= 500 || e.status === 401) keep.push(b); } }
      jset(QUEUE, keep); return sent;
    })().finally(() => { syncing = null; });
    return syncing;
  }
  addEventListener('online', () => { sync(); });
  setTimeout(() => { sync().catch(() => {}); }, 2000);

  /* ---------- progress (money-back guarantee evidence; signed-in accounts only) ---------- */
  const PT = {}, PD = {}; let progressOff = false;
  function sendProgress(k) {
    const d = PD[k]; if (!d || progressOff) return; delete PD[k];
    return fetch(endpoint() + '/api/progress', { method: 'POST', headers: headers(), credentials: endpoint() ? 'omit' : 'same-origin', keepalive: true, body: JSON.stringify(d) })
      .then(r => r.json()).then(j => { if (j && j.saved === false && j.reason === 'login') progressOff = true; }).catch(() => {});
  }
  function progress(site, course, data) {
    try {
      if (progressOff) return;
      site = String(site || siteOf({})); course = String(course || site);
      const k = site + '|' + course, d = PD[k] = Object.assign(PD[k] || { site, course }, data || {});
      if (data && Array.isArray(data.mocks)) d.mocks = data.mocks.slice(-100).map(m => ({ at: m.at, score: m.score, max: m.max, full: m.full }));
      clearTimeout(PT[k]); PT[k] = setTimeout(() => sendProgress(k), 1500);
    } catch (e) {}
  }
  addEventListener('pagehide', () => { Object.keys(PD).forEach(k => { clearTimeout(PT[k]); sendProgress(k); }); });

  /* ---------- report card ---------- */
  function fmtPct(p) { return p == null ? '—' : (Math.round(p * 10) / 10).toFixed(p % 1 ? 1 : 0) + '%'; }
  function localTranscript(site) {
    const L = Object.values(jget(LOCAL, {})).filter(c => !site || c.site === site).map(c => ({ courseId: c.courseId, title: c.title, issuer: c.issuer, site: c.site, percent: c.best.percent, letter: c.best.letter, gpaPoints: c.best.gpaPoints, date: c.best.date, certCode: '' }));
    const certs = window.Cert && window.Cert.list ? window.Cert.list() : [];
    L.forEach(c => { const m = certs.find(x => x.id === c.courseId && x.srv); if (m) c.certCode = m.code; });
    const g = L.filter(c => c.letter); return { courses: L, gpa: g.length ? Math.round(g.reduce((a, c) => a + c.gpaPoints, 0) / g.length * 100) / 100 : null, offline: true };
  }
  async function reportCard(el, opts) {
    injectCSS(); opts = opts || {};
    if (typeof el === 'string') el = document.querySelector(el); if (!el) return null;
    el.classList.add('rx'); el.setAttribute('style', (el.getAttribute('style') || '') + ';' + vars(opts.theme));
    el.innerHTML = '<div class="rx-rc" aria-busy="true"><p class="rx-k">Report card</p><p style="color:var(--rx-muted);margin:0">Loading your grades…</p></div>';
    let t; try { t = await api('GET', '/api/grades/mine' + (opts.site ? '?site=' + encodeURIComponent(opts.site) : '')); } catch (e) { t = localTranscript(opts.site); }
    const rows = (t.courses || []).filter(c => !opts.site || c.site === opts.site);
    const gpa = t.gpa, pct = gpa == null ? 0 : gpa / 4 * 100;
    const head = `<div class="rx-rc-top"><div><p class="rx-k">${esc(opts.kicker || 'Report card')}</p><h3>${esc(opts.title || (t.name ? t.name : 'Your grades'))}</h3></div>
      <div class="rx-rc-gpa"><div class="rx-ring" style="--p:${pct}" role="img" aria-label="GPA ${gpa == null ? 'not yet' : gpa.toFixed(2)} out of 4.0"><span>${gpa == null ? '—' : gpa.toFixed(2)}</span></div><div><b>GPA</b><br><small style="color:var(--rx-muted)">${rows.filter(r => r.letter).length} graded · 4.0 scale</small></div></div></div>`;
    const body = rows.length ? `<table><thead><tr><th scope="col">Course</th><th scope="col">Final</th><th scope="col">Grade</th><th scope="col" class="rx-hide-sm">Certificate</th></tr></thead><tbody>${rows.map(c => `<tr>
      <td><b>${esc(c.title || c.courseId)}</b><small>${esc([c.issuer, c.date].filter(Boolean).join(' · '))}</small>${c.certCode ? `<small class="rx-show-sm">Certificate <a class="rx-code" href="${esc(verifyUrl(c.certCode))}" target="_blank" rel="noopener">${esc(c.certCode)}</a></small>` : ''}</td>
      <td class="rx-pct">${fmtPct(c.percent)}</td>
      <td><span class="rx-chip rx-g-${gradeTone(c.letter)}">${esc(c.letter || '—')}</span></td>
      <td class="rx-hide-sm">${c.certCode ? `<a class="rx-code" href="${esc(verifyUrl(c.certCode))}" target="_blank" rel="noopener" aria-label="Verify certificate ${esc(c.certCode)}">${esc(c.certCode)}</a>` : '<small>—</small>'}</td></tr>`).join('')}</tbody></table>`
      : `<div class="rx-rc-empty">No final exams yet. Take a course final and your grade shows up here.</div>`;
    el.innerHTML = `<div class="rx-rc">${head}${body}<div class="rx-rc-foot"><a href="${esc(transcriptUrl())}">View full transcript →</a>${t.offline ? '<small style="color:var(--rx-muted)">Offline: showing grades saved on this device</small>' : ''}</div>
      <p class="rx-note">Self-study course grades. Not college credit or an accredited transcript.</p></div>`;
    return t;
  }

  /* ---------- open-note final exam ---------- */
  const slug = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'general';
  function autoSheet(questions) {
    const by = new Map();
    questions.forEach(q => { const s = q.section || 'General'; if (!by.has(s)) by.set(s, []); const x = String(q.explain || '').trim(); if (x && !by.get(s).includes(x)) by.get(s).push(x); });
    return Array.from(by, ([title, items]) => ({ title, items: items.length ? items : ['Review the lessons on ' + title + '.'] }));
  }
  function sheetHTML(sheet) {
    if (typeof sheet === 'string') return `<div class="rx-cs-html">${sheet}</div>`;
    return sheet.map(s => `<section id="rx-cs-${slug(s.title)}" data-section="${esc(s.title)}"><h4>${esc(s.title)}</h4><ul>${(s.items || []).map(it => `<li>${it && typeof it === 'object' && it.html ? it.html : esc(it)}</li>`).join('')}</ul></section>`).join('');
  }
  function examUI(opts) {
    injectCSS(); opts = Object.assign({ passMark: 70, minutes: 0 }, opts || {});
    const Q = (opts.questions || []).filter(q => q && q.q && Array.isArray(q.choices) && q.choices.length >= 2);
    if (!Q.length) return Promise.reject(new Error('Records.examUI needs questions.'));
    const order = Q.map((_, i) => i); if (opts.shuffle) for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    const qs = order.map(i => Q[i]);
    const ansIdx = q => typeof q.answer === 'number' ? q.answer : Math.max(0, q.choices.findIndex(c => String(c) === String(q.answer)));
    const sheet = opts.cheatSheet && (typeof opts.cheatSheet === 'string' ? opts.cheatSheet.trim() : opts.cheatSheet.length) ? opts.cheatSheet : autoSheet(qs);
    const review = Array.isArray(opts.review) && opts.review.length ? opts.review : (Array.isArray(sheet) ? sheet.map(s => ({ section: s.title, points: (s.items || []).slice(0, 4).map(x => x && x.html ? x.html.replace(/<[^>]+>/g, '') : x) })) : []);
    const rich = s => opts.allowHTML ? String(s) : esc(s);
    const title = opts.title || 'Final exam', prevFocus = document.activeElement;
    return new Promise(resolve => {
      const ov = document.createElement('div'); ov.className = 'rx rx-ov'; ov.setAttribute('style', vars(opts.theme));
      ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', title + ', open-note final exam');
      ov.innerHTML = `<header class="rx-head"><span class="rx-t">${esc(title)}</span><span class="rx-badge" title="Open note: using the cheat sheet is encouraged">Open note ✓</span>
        <span class="rx-timer" hidden aria-label="Time left"></span>
        <button type="button" class="rx-b small ghost rx-cs-btn" aria-expanded="false" aria-controls="rx-cs"><span aria-hidden="true">📄</span><span class="rx-cs-lbl">Cheat sheet</span><span class="rx-sr"> (open note)</span></button>
        <button type="button" class="rx-x" aria-label="Close exam">×</button></header>
        <div class="rx-body"><main class="rx-main" tabindex="-1"><div class="rx-in"></div></main>
        <aside class="rx-cs" id="rx-cs" aria-label="Cheat sheet" hidden><div class="rx-cs-h"><b><span aria-hidden="true">📄</span> Cheat sheet</b><span class="rx-badge">Open note ✓</span><button type="button" class="rx-x rx-cs-x" aria-label="Close cheat sheet">×</button></div>
          <div class="rx-cs-s"><label class="rx-sr" for="rx-cs-q">Search the cheat sheet</label><input id="rx-cs-q" type="search" placeholder="Search the cheat sheet" autocomplete="off"></div>
          <div class="rx-cs-b">${sheetHTML(sheet)}<p class="rx-cs-none" hidden>Nothing matches. Try a shorter word.</p></div>
          <div class="rx-cs-f"><button type="button" class="rx-b small ghost rx-print-btn">Print cheat sheet</button><button type="button" class="rx-b small ghost rx-dl-btn">Download</button></div></aside>
        <div class="rx-scrim"></div></div><p class="rx-sr" aria-live="polite" id="rx-live"></p>`;
      document.body.appendChild(ov);
      const oldOverflow = document.documentElement.style.overflow; document.documentElement.style.overflow = 'hidden';
      const $ = s => ov.querySelector(s), main = $('.rx-in'), mainBox = $('.rx-main'), timerEl = $('.rx-timer'), cs = $('.rx-cs'), csBtn = $('.rx-cs-btn'), live = $('#rx-live');
      const S = { screen: 'review', idx: 0, ans: new Array(qs.length).fill(null), flag: new Set(), start: 0, end: 0, timer: 0, result: null, warned: {} };
      const say = t => { live.textContent = ''; setTimeout(() => { live.textContent = t; }, 30); };

      /* cheat sheet */
      const csBody = $('.rx-cs-b'), csIn = $('#rx-cs-q');
      function openSheet(sectionName) {
        cs.hidden = false; requestAnimationFrame(() => ov.classList.add('cs-open')); csBtn.setAttribute('aria-expanded', 'true');
        csBody.querySelectorAll('section.hit').forEach(x => x.classList.remove('hit'));
        if (sectionName) { csIn.value = ''; filter(''); const t = findSection(sectionName); if (t) { t.classList.add('hit'); setTimeout(() => t.scrollIntoView({ block: 'start', behavior: 'smooth' }), 240); } }
        setTimeout(() => (sectionName ? $('.rx-cs-x') : csIn).focus({ preventScroll: true }), 60);
      }
      function closeSheet() { ov.classList.remove('cs-open'); csBtn.setAttribute('aria-expanded', 'false'); setTimeout(() => { if (!ov.classList.contains('cs-open')) cs.hidden = true; }, 230); csBtn.focus(); }
      function findSection(name) {
        const n = String(name || '').toLowerCase().trim(); if (!n) return null;
        const secs = Array.from(csBody.querySelectorAll('section,[data-section],h1,h2,h3,h4'));
        const label = el => (el.getAttribute('data-section') || (el.querySelector('h4,h3,h2') || el).textContent || '').toLowerCase().trim();
        const hit = secs.find(el => label(el) === n) || secs.find(el => label(el).includes(n) || n.includes(label(el)) && label(el).length > 2);
        return hit ? (hit.closest('section') || hit) : null;
      }
      function filter(q) {
        q = q.trim().toLowerCase(); let any = false;
        csBody.querySelectorAll('mark[data-rx]').forEach(m => m.replaceWith(document.createTextNode(m.textContent)));
        csBody.normalize();
        const blocks = Array.from(csBody.querySelectorAll('section')).length ? Array.from(csBody.querySelectorAll('section')) : Array.from((csBody.querySelector('.rx-cs-html') || csBody).children);
        blocks.forEach(sec => {
          if (!q) { sec.hidden = false; sec.querySelectorAll('li,p,tr').forEach(x => { x.hidden = false; }); any = true; return; }
          const head = (sec.querySelector('h4,h3,h2') || {}).textContent || '', headHit = head.toLowerCase().includes(q);
          let n = 0; sec.querySelectorAll('li,p,tr').forEach(x => { const m = x.textContent.toLowerCase().includes(q); x.hidden = !(m || headHit); if (m) n++; });
          const show = headHit || n > 0 || sec.textContent.toLowerCase().includes(q); sec.hidden = !show; if (show) any = true;
        });
        if (q) { const walk = document.createTreeWalker(csBody, NodeFilter.SHOW_TEXT); const hits = []; while (walk.nextNode()) { const t = walk.currentNode; if (t.parentElement.closest('[hidden]')) continue; const i = t.data.toLowerCase().indexOf(q); if (i >= 0) hits.push([t, i]); }
          hits.slice(0, 200).forEach(([t, i]) => { const r = document.createRange(); r.setStart(t, i); r.setEnd(t, i + q.length); const m = document.createElement('mark'); m.dataset.rx = '1'; try { r.surroundContents(m); } catch (e) {} }); }
        $('.rx-cs-none').hidden = any;
      }
      csIn.addEventListener('input', () => filter(csIn.value));
      csBtn.addEventListener('click', () => ov.classList.contains('cs-open') ? closeSheet() : openSheet());
      $('.rx-cs-x').addEventListener('click', closeSheet); $('.rx-scrim').addEventListener('click', closeSheet);
      const sheetDoc = () => `<h1>${esc(title)}: cheat sheet</h1><p>${esc(opts.issuer || '')} · Open note: bring this to the final.</p><div class="cols">${typeof sheet === 'string' ? sheet : sheet.map(s => `<section><h4>${esc(s.title)}</h4><ul>${(s.items || []).map(it => `<li>${it && it.html ? it.html : esc(it)}</li>`).join('')}</ul></section>`).join('')}</div>`;
      function printSheet() {
        const box = document.createElement('div'); box.className = 'rx-print'; box.innerHTML = sheetDoc(); document.body.appendChild(box);
        document.documentElement.classList.add('rx-printing');
        const clean = () => { document.documentElement.classList.remove('rx-printing'); box.remove(); removeEventListener('afterprint', clean); };
        addEventListener('afterprint', clean); window.print(); setTimeout(clean, 1500);
      }
      function downloadSheet() {
        const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} cheat sheet</title><style>body{font:16px/1.5 Georgia,serif;max-width:900px;margin:24px auto;padding:0 16px;color:#111}.cols{columns:2 320px;column-gap:28px}section{break-inside:avoid;margin:0 0 14px}h4{margin:0 0 4px}ul{margin:0;padding-left:18px}@media print{body{margin:0}}</style><body>${sheetDoc()}</body></html>`;
        const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([html], { type: 'text/html' })); a.download = slug(title) + '-cheat-sheet.html'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 30000);
      }
      $('.rx-print-btn').addEventListener('click', printSheet); $('.rx-dl-btn').addEventListener('click', downloadSheet);

      /* timer (never pauses, cheat sheet or not) */
      const fmt = s => { s = Math.max(0, Math.ceil(s)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(x).padStart(2, '0'); };
      function tick() {
        if (!S.end) return; const left = (S.end - Date.now()) / 1000;
        timerEl.textContent = fmt(left); timerEl.classList.toggle('low', left <= 60);
        [[300, '5 minutes left'], [60, '1 minute left']].forEach(([t, m]) => { if (left <= t && !S.warned[t] && opts.minutes * 60 > t) { S.warned[t] = 1; say(m); } });
        if (left <= 0) { submit(true); }
      }

      /* screens */
      function show(html, focusSel) { main.innerHTML = html; mainBox.scrollTop = 0; const f = focusSel && main.querySelector(focusSel); (f || mainBox).focus({ preventScroll: true }); }
      function reviewScreen() {
        S.screen = 'review';
        show(`<p class="rx-k">Final exam · Open note</p><h1>${esc(title)}</h1>
          <div class="rx-pills"><span class="rx-pill">${qs.length} questions</span><span class="rx-pill">${opts.minutes ? opts.minutes + ' minutes' : 'Untimed'}</span><span class="rx-pill">Pass mark ${opts.passMark}%</span></div>
          <div class="rx-call"><span aria-hidden="true" style="font-size:22px">📄</span><div><b>Open note: keep the cheat sheet open, it's encouraged.</b>It's one tap away the whole exam, and opening it never pauses the clock. Read the review below first.</div></div>
          <h2>Review first</h2><div class="rx-rev">${review.map(r => `<section><h3>${esc(r.section)}</h3><ul>${(r.points || []).map(p => `<li>${rich(p)}</li>`).join('')}</ul>${r.example ? `<div class="rx-ex"><b>Example.</b> ${rich(r.example)}</div>` : ''}</section>`).join('') || '<p>Open the cheat sheet to review.</p>'}</div>
          <div class="rx-actions"><button type="button" class="rx-b rx-start">Start the exam</button><button type="button" class="rx-b ghost rx-open">📄 Open cheat sheet</button><button type="button" class="rx-b ghost rx-pr">Print cheat sheet</button></div>`, 'h1');
        main.querySelector('h1').tabIndex = -1;
        main.querySelector('.rx-start').addEventListener('click', start);
        main.querySelector('.rx-open').addEventListener('click', () => openSheet());
        main.querySelector('.rx-pr').addEventListener('click', printSheet);
      }
      function start() {
        S.start = Date.now(); S.idx = 0;
        if (opts.minutes > 0) { S.end = S.start + opts.minutes * 60e3; timerEl.hidden = false; tick(); S.timer = setInterval(tick, 1000); }
        say('Exam started. ' + qs.length + ' questions.' + (opts.minutes ? ' ' + opts.minutes + ' minutes.' : ''));
        question();
      }
      function question() {
        S.screen = 'q'; const i = S.idx, q = qs[i], a = S.ans[i], done = S.ans.filter(x => x != null).length;
        show(`<div class="rx-prog"><span>Question ${i + 1} of ${qs.length}</span><span>${done} answered${S.flag.size ? ' · ' + S.flag.size + ' flagged' : ''}</span></div>
          <div class="rx-bar" role="progressbar" aria-label="Answered" aria-valuemin="0" aria-valuemax="${qs.length}" aria-valuenow="${done}"><i style="width:${done / qs.length * 100}%"></i></div>
          ${q.section ? `<div class="rx-sec">${esc(q.section)}</div>` : ''}<h2 class="rx-q" id="rx-qt" tabindex="-1">${rich(q.q)}</h2>
          <div class="rx-choices" role="radiogroup" aria-labelledby="rx-qt">${q.choices.map((c, k) => `<button type="button" class="rx-c" role="radio" aria-checked="${a === k}" data-k="${k}" tabindex="${a === k || (a == null && k === 0) ? 0 : -1}"><span class="rx-l" aria-hidden="true">${'ABCDEFGH'[k]}</span><span>${rich(c)}</span></button>`).join('')}</div>
          <div class="rx-nav"><button type="button" class="rx-b ghost small rx-prev" ${i ? '' : 'disabled'}>← Previous</button>
            <button type="button" class="rx-b ghost small rx-flag" aria-pressed="${S.flag.has(i)}">${S.flag.has(i) ? '⚑ Flagged' : '⚐ Flag for review'}</button>
            <button type="button" class="rx-b small rx-next">${i === qs.length - 1 ? 'Review answers →' : 'Next →'}</button></div>
          <details ${qs.length <= 30 ? 'open' : ''}><summary style="cursor:pointer;font-weight:700;font-size:14px">All questions</summary><div class="rx-map">${qs.map((_, k) => `<button type="button" data-go="${k}" class="${S.ans[k] != null ? 'done' : ''}${S.flag.has(k) ? ' flag' : ''}${k === i ? ' cur' : ''}" aria-label="Question ${k + 1}${S.ans[k] != null ? ', answered' : ''}${S.flag.has(k) ? ', flagged' : ''}"${k === i ? ' aria-current="step"' : ''}>${k + 1}</button>`).join('')}</div>
          <div class="rx-legend"><span>■ answered</span><span style="color:var(--rx-warn)">● flagged</span></div></details>
          <p class="rx-status">Stuck? <button type="button" class="rx-link rx-hint">Check the cheat sheet${q.section ? ' for ' + esc(q.section) : ''}</button>. It's open note.</p>`, '#rx-qt');
        const pick = k => { S.ans[i] = k; main.querySelectorAll('.rx-c').forEach(b => { const on = Number(b.dataset.k) === k; b.setAttribute('aria-checked', on); b.tabIndex = on ? 0 : -1; }); updMap(); };
        main.querySelectorAll('.rx-c').forEach(b => b.addEventListener('click', () => pick(Number(b.dataset.k))));
        main.querySelector('.rx-choices').addEventListener('keydown', e => { const bs = Array.from(main.querySelectorAll('.rx-c')), cur = bs.indexOf(document.activeElement); if (cur < 0) return;
          if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); const n = bs[(cur + 1) % bs.length]; n.focus(); pick(Number(n.dataset.k)); }
          if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); const n = bs[(cur - 1 + bs.length) % bs.length]; n.focus(); pick(Number(n.dataset.k)); } });
        main.querySelector('.rx-prev').addEventListener('click', () => { S.idx--; question(); });
        main.querySelector('.rx-next').addEventListener('click', () => { if (i === qs.length - 1) reviewAnswers(); else { S.idx++; question(); } });
        main.querySelector('.rx-flag').addEventListener('click', e => { S.flag.has(i) ? S.flag.delete(i) : S.flag.add(i); const on = S.flag.has(i); e.currentTarget.setAttribute('aria-pressed', on); e.currentTarget.textContent = on ? '⚑ Flagged' : '⚐ Flag for review'; updMap(); });
        main.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => { S.idx = Number(b.dataset.go); question(); }));
        main.querySelector('.rx-hint').addEventListener('click', () => openSheet(q.section));
        function updMap() { main.querySelectorAll('[data-go]').forEach(b => { const k = Number(b.dataset.go); b.classList.toggle('done', S.ans[k] != null); b.classList.toggle('flag', S.flag.has(k)); });
          const d = S.ans.filter(x => x != null).length; main.querySelector('.rx-bar>i').style.width = d / qs.length * 100 + '%'; main.querySelector('.rx-bar').setAttribute('aria-valuenow', d);
          main.querySelector('.rx-prog span:last-child').textContent = d + ' answered' + (S.flag.size ? ' · ' + S.flag.size + ' flagged' : ''); }
      }
      function reviewAnswers() {
        S.screen = 'check'; const un = S.ans.map((a, k) => a == null ? k : -1).filter(k => k >= 0), fl = Array.from(S.flag).sort((a, b) => a - b);
        show(`<p class="rx-k">Before you submit</p><h1 tabindex="-1">Review your answers</h1>
          <div class="rx-pills"><span class="rx-pill">${qs.length - un.length} of ${qs.length} answered</span>${un.length ? `<span class="rx-pill" style="color:var(--rx-bad)">${un.length} unanswered</span>` : ''}${fl.length ? `<span class="rx-pill" style="color:var(--rx-warn)">${fl.length} flagged</span>` : ''}</div>
          ${un.length ? `<p>Unanswered questions count as wrong. Tap a number to go back.</p>` : '<p>Everything is answered. Check your flagged questions, then submit.</p>'}
          <div class="rx-map">${qs.map((_, k) => `<button type="button" data-go="${k}" class="${S.ans[k] != null ? 'done' : ''}${S.flag.has(k) ? ' flag' : ''}" aria-label="Question ${k + 1}${S.ans[k] != null ? ', answered' : ', unanswered'}${S.flag.has(k) ? ', flagged' : ''}">${k + 1}</button>`).join('')}</div>
          <div class="rx-legend"><span>■ answered</span><span style="color:var(--rx-warn)">● flagged</span><span>□ unanswered</span></div>
          <div class="rx-actions"><button type="button" class="rx-b rx-submit">Submit final exam</button><button type="button" class="rx-b ghost rx-back">← Back to questions</button></div>`, 'h1');
        main.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => { S.idx = Number(b.dataset.go); question(); }));
        main.querySelector('.rx-back').addEventListener('click', () => { S.idx = un.length ? un[0] : fl.length ? fl[0] : qs.length - 1; question(); });
        main.querySelector('.rx-submit').addEventListener('click', () => submit(false));
      }
      async function submit(timeUp) {
        if (S.screen === 'results' || S.screen === 'saving') return; S.screen = 'saving';
        clearInterval(S.timer); S.end = 0; timerEl.hidden = true;
        const secs = new Map(); let right = 0; const wrong = [];
        qs.forEach((q, k) => { const s = q.section || 'General', ok = S.ans[k] === ansIdx(q); if (!secs.has(s)) secs.set(s, { name: s, score: 0, max: 0 }); const x = secs.get(s); x.max++; if (ok) { x.score++; right++; } else wrong.push(k); });
        const sections = Array.from(secs.values()), used = Math.round((Date.now() - S.start) / 1000);
        show(`<p class="rx-k">${timeUp ? 'Time\'s up' : 'Submitted'}</p><h1 tabindex="-1">Grading your final…</h1>`, 'h1');
        const r = await final({ courseId: opts.courseId || slug(title), title, issuer: opts.issuer, site: opts.site, score: right, max: qs.length, sections, certId: opts.certificate && opts.certificate.id, name: opts.name });
        S.result = Object.assign({}, r, { right, total: qs.length, passed: r.percent >= opts.passMark, sections, wrong, seconds: used, timeUp: !!timeUp, answers: S.ans.slice() });
        results();
        try { if (opts.onDone) opts.onDone(S.result); } catch (e) {}
      }
      function results() {
        S.screen = 'results'; const R = S.result;
        const canCert = R.passed && opts.certificate && window.Cert && window.Cert.award;
        show(`<p class="rx-k">${R.timeUp ? 'Time\'s up · ' : ''}Final exam results</p><h1 tabindex="-1">${esc(title)}</h1>
          <div class="rx-res-top"><div class="rx-big" style="--p:${R.percent}" role="img" aria-label="Grade ${esc(R.letter)}, ${R.percent} percent"><span><span><b>${esc(R.letter)}</b><small>${fmtPct(R.percent)}</small></span></span></div>
            <div><p class="rx-pass ${R.passed ? 'ok' : 'no'}" style="margin:0 0 4px;font-size:20px">${R.passed ? 'Passed' : 'Not passed yet'}</p>
            <p style="margin:0">${R.right} of ${R.total} correct · pass mark ${opts.passMark}% · ${fmt(R.seconds)} used</p>
            <p class="rx-status">${R.saved ? 'Saved to your transcript.' : R.queued ? 'Saved on this device. It syncs to your transcript when you\'re back online or signed in.' : esc(R.error || 'Saved on this device.')}${R.best && R.best.percent > R.percent ? ` Your best stays ${fmtPct(R.best.percent)} (${esc(R.best.letter)}).` : ''}</p></div></div>
          <div class="rx-actions">${canCert ? '<button type="button" class="rx-b rx-cert">🎓 Get your certificate</button>' : ''}<a class="rx-b ${canCert ? 'ghost' : ''}" href="${esc(transcriptUrl())}">View transcript</a><button type="button" class="rx-b ghost rx-retake">Retake</button><button type="button" class="rx-b ghost rx-close">Close</button></div>
          <h2>By section</h2><div class="rx-secs">${R.sections.map(s => { const p = Math.round(s.score / s.max * 100); return `<div class="rx-srow"><span><b>${esc(s.name)}</b></span><span style="text-align:right;font-weight:700">${s.score}/${s.max}</span><div class="rx-bar" role="img" aria-label="${esc(s.name)}: ${p}%"><i style="width:${p}%;${p < opts.passMark ? 'background:var(--rx-bad)' : ''}"></i></div></div>`; }).join('')}</div>
          ${R.wrong.length ? `<h2>Questions to review (${R.wrong.length})</h2>${R.wrong.map(k => { const q = qs[k], a = S.ans[k]; return `<div class="rx-wrong"><p style="font-size:13px;color:var(--rx-muted);margin:0">Question ${k + 1}${q.section ? ' · ' + esc(q.section) : ''}</p><p><b>${rich(q.q)}</b></p>
            <p class="bad">Your answer: ${a == null ? 'no answer' : rich(q.choices[a])}</p><p class="good">Correct: ${rich(q.choices[ansIdx(q)])}</p>${q.explain ? `<p>${rich(q.explain)}</p>` : ''}
            <p><button type="button" class="rx-link" data-sec="${esc(q.section || 'General')}">📄 Cheat sheet: ${esc(q.section || 'General')} →</button></p></div>`; }).join('')}` : '<h2>Perfect score</h2><p>Every answer was right.</p>'}
          <p class="rx-status" style="margin-top:20px">Self-study course grade. Not college credit or an accredited transcript.</p>`, 'h1');
        say(`Grade ${R.letter}, ${R.percent} percent. ${R.passed ? 'Passed.' : 'Not passed yet.'}`);
        main.querySelectorAll('[data-sec]').forEach(b => b.addEventListener('click', () => openSheet(b.dataset.sec)));
        main.querySelector('.rx-retake').addEventListener('click', () => { S.ans.fill(null); S.flag.clear(); S.warned = {}; reviewScreen(); });
        main.querySelector('.rx-close').addEventListener('click', () => close(R));
        const cb = main.querySelector('.rx-cert'); if (cb) cb.addEventListener('click', () => window.Cert.award(Object.assign({}, opts.certificate, { score: R.percent })));
      }
      function close(val) {
        if (!ov.isConnected) return;
        if ((S.screen === 'q' || S.screen === 'check') && !confirm('Leave the exam? Your answers won\'t be graded.')) return;
        clearInterval(S.timer); ov.remove(); document.removeEventListener('keydown', onKey, true); document.documentElement.style.overflow = oldOverflow;
        try { if (prevFocus && prevFocus.focus) prevFocus.focus(); } catch (e) {}
        resolve(val === undefined ? S.result : val);
      }
      $('.rx-head .rx-x').addEventListener('click', () => close());
      function onKey(e) {
        if (e.key === 'Escape') { e.preventDefault(); if (ov.classList.contains('cs-open')) closeSheet(); else close(); return; }
        if (S.screen === 'q' && !e.target.closest('input,textarea,.rx-cs')) {
          const k = 'abcdefgh'.indexOf(e.key.toLowerCase()), n = /^[1-8]$/.test(e.key) ? Number(e.key) - 1 : k;
          if (n >= 0 && n < qs[S.idx].choices.length && !e.metaKey && !e.ctrlKey && !e.altKey) { const b = main.querySelector(`.rx-c[data-k="${n}"]`); if (b) { e.preventDefault(); b.click(); b.focus(); } }
        }
        if (e.key === 'Tab') { // keep focus inside the exam
          const f = Array.from(ov.querySelectorAll('a[href],button:not([disabled]),input,summary,[tabindex="0"]')).filter(el => el.offsetParent !== null && !el.closest('[hidden]'));
          if (!f.length) return; const first = f[0], last = f[f.length - 1];
          if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      }
      document.addEventListener('keydown', onKey, true);
      reviewScreen();
    });
  }

  const API = { __ct: 1, final, sync, reportCard, examUI, progress, letter, transcriptUrl, deviceId, SCALE: SCALE.map(([min, l, g]) => ({ min, letter: l, points: g })),
    endpoint: PRE.endpoint || window.CT_RECORDS_ENDPOINT || 'https://chalktalkstudy.com', token: PRE.token || '', _vars: vars, _css: injectCSS };
  window.Records = API;
  document.dispatchEvent(new CustomEvent('ct-records-ready'));
})();
