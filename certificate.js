// Chalk Talk course certificates, shared by every course site.
// ChemFluent copy (chemfluent.com): endpoint and verifyBase default to https://chalktalkstudy.com so codes are server-issued and verified there.
//   Cert.award({ id, title, kind, issuer, detail, modules, score, theme:{bg,ink,accent,font}, note }) -> Promise<record|null>
//   Cert.has(id) · Cert.get(id) · Cert.button(opts) -> HTML · Cert.wall() -> HTML
//   Extras: Cert.hint(text) -> HTML · Cert.preview(opts) -> HTML (sample certificate) · Cert.list()
//   Verifiable: Cert.svg(opts, {name,date,code}) -> SVG · Cert.verifyUrl(code) · Cert.sync() · Cert.qr(text) -> module matrix
// Codes are issued by the server (POST /api/cert/issue, random, never derived from the name) and checked at
// /readyroom/verify.html?c=CODE (the QR on every certificate points there). Settings, read at call time:
//   Cert.endpoint   = API base URL (default: same origin; or window.CT_RECORDS_ENDPOINT)
//   Cert.verifyBase = verifier page URL (default: <endpoint or origin>/readyroom/verify.html)
//   Cert.token      = optional bearer token (string or function) for apps that don't use the Ready Room cookie
// Earned certificates are cached in localStorage 'ct-certs' as { [id]: { name, date, code, score, srv:1, ... } }.
// Self-contained: injects its own CSS, loads the theme's Google Font only when the page does not already have it.
(function () {
  if (window.Cert && window.Cert.__ct) return;
  const PRE = window.Cert && typeof window.Cert === 'object' ? window.Cert : {}; // settings set before this script loaded
  const STORE = 'ct-certs', NAME = 'ct-cert-name', W = 1200, H = 850, PNG_W = 2400;
  const FIXED = 'Course completion certificate. This is not a professional license, accreditation or official exam credential.';
  const DEF = { bg: '#fbf7ee', ink: '#1f2533', accent: '#a8842c', font: 'Cormorant Garamond' };
  const REG = {};
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const read = () => { try { const o = JSON.parse(localStorage.getItem(STORE) || '{}'); return o && typeof o === 'object' ? o : {}; } catch (e) { return {}; } };
  const write = o => { try { localStorage.setItem(STORE, JSON.stringify(o)); } catch (e) {} };

  /* ---------- colour helpers ---------- */
  function rgb(h) {
    h = String(h || '').trim();
    let m = /^#?([0-9a-f]{3})$/i.exec(h); if (m) h = m[1].split('').map(c => c + c).join('');
    m = /^#?([0-9a-f]{6})$/i.exec(h); if (m) { const n = parseInt(m[1], 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
    m = /rgba?\(\s*(\d+)[ ,]+(\d+)[ ,]+(\d+)/i.exec(h); if (m) return [+m[1], +m[2], +m[3]];
    return null;
  }
  const hex = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const mix = (a, b, t) => { const x = rgb(a), y = rgb(b); return x && y ? hex(x.map((v, i) => v + (y[i] - v) * t)) : a; };
  const lum = c => { const x = rgb(c) || [255, 255, 255]; return (0.299 * x[0] + 0.587 * x[1] + 0.114 * x[2]) / 255; };
  function theme(t) {
    t = Object.assign({}, DEF, t || {});
    ['bg', 'ink', 'accent'].forEach(k => { if (!rgb(t[k])) t[k] = DEF[k]; });
    t.dark = lum(t.bg) < 0.45;
    t.muted = mix(t.ink, t.bg, 0.38);
    t.faint = mix(t.ink, t.bg, 0.6);
    t.deep = mix(t.accent, t.dark ? '#ffffff' : '#000000', t.dark ? 0.12 : 0.28);
    t.panel = mix(t.bg, t.dark ? '#ffffff' : '#000000', 0.035);
    t.onAccent = lum(t.accent) > 0.55 ? mix(t.accent, '#000000', 0.82) : '#ffffff';
    const fam = f => `"${String(f).replace(/["\\]/g, '')}"`;
    t.display = [fam(t.font), '"Cormorant Garamond"', '"EB Garamond"', 'Garamond', 'Georgia', '"Times New Roman"', 'serif'].join(',');
    t.body = t.bodyFont ? [fam(t.bodyFont), t.display].join(',') : t.display;
    t.mono = '"JetBrains Mono","IBM Plex Mono",ui-monospace,Menlo,Consolas,"Courier New",monospace';
    return t;
  }

  /* ---------- fonts ---------- */
  const fontWait = {};
  function hasFont(name) {
    const n = name.toLowerCase(), plus = name.replace(/ /g, '+').toLowerCase();
    try { for (const f of document.fonts) if (f.family.replace(/["']/g, '').toLowerCase() === n) return true; } catch (e) {}
    for (const l of document.querySelectorAll('link[href*="fonts.googleapis.com"],link[href*="fonts.bunny.net"]')) { const h = decodeURIComponent(l.href).toLowerCase(); if (h.includes(plus) || h.includes(n)) return true; }
    for (const s of document.querySelectorAll('style')) { const c = (s.textContent || '').toLowerCase(); if (c.includes('@import') && (c.includes(plus) || c.includes('family=' + n))) return true; }
    return false;
  }
  function ensureFont(name) {
    if (!name) return Promise.resolve();
    if (fontWait[name]) return fontWait[name];
    if (!hasFont(name) && navigator.onLine !== false) {
      const add = href => { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; l.dataset.ctcFont = '1'; document.head.appendChild(l); return l; };
      const fam = encodeURIComponent(name).replace(/%20/g, '+');
      const l = add(`https://fonts.googleapis.com/css2?family=${fam}:ital,wght@0,400;0,600;0,700;1,400;1,600&display=swap`);
      l.onerror = () => add(`https://fonts.googleapis.com/css2?family=${fam}&display=swap`);
    }
    const q = `"${name}"`;
    const load = document.fonts && document.fonts.load ? Promise.all(['400 40px ', '700 40px ', 'italic 400 40px ', '600 40px '].map(w => document.fonts.load(w + q).catch(() => null))) : Promise.resolve();
    fontWait[name] = Promise.race([load, new Promise(r => setTimeout(r, 2500))]).then(() => {});
    return fontWait[name];
  }

  /* ---------- verification code ---------- */
  function hash(str) { // cyrb53
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0; i < str.length; i++) { const c = str.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return [h1 >>> 0, h2 >>> 0];
  }
  const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  function codeFor(id, name, date) {
    const [a, b] = hash(`${id}|${String(name).trim().toLowerCase()}|${date}`);
    let n = BigInt(a) * 4294967296n + BigInt(b), s = '';
    for (let i = 0; i < 8; i++) { s += ALPHA[Number(n % 32n)]; n /= 32n; }
    return `CT-${s.slice(0, 4)}-${s.slice(4)}`;
  } // legacy only (kept for API compatibility). Real codes come from the server.

  /* ---------- QR code (byte mode, error correction M, versions 1-10) ---------- */
  const qr = (function () {
    const EXP = new Array(512), LOG = new Array(256);
    for (let i = 0, x = 1; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 256) x ^= 0x11d; }
    for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
    const mul = (a, b) => a && b ? EXP[LOG[a] + LOG[b]] : 0;
    function rs(data, n) {
      let g = [1]; for (let i = 0; i < n; i++) { const ng = new Array(g.length + 1).fill(0); for (let j = 0; j < g.length; j++) { ng[j] ^= g[j]; ng[j + 1] ^= mul(g[j], EXP[i]); } g = ng; }
      const r = new Array(n).fill(0);
      for (const d of data) { const f = d ^ r.shift(); r.push(0); for (let j = 0; j < n; j++) r[j] ^= mul(g[j + 1], f); }
      return r;
    }
    // [ec codewords per block, [[blocks, data codewords per block], ...]] for level M
    const M = [null, [10, [[1, 16]]], [16, [[1, 28]]], [26, [[1, 44]]], [18, [[2, 32]]], [24, [[2, 43]]], [16, [[4, 27]]], [18, [[4, 31]]], [22, [[2, 38], [2, 39]]], [22, [[3, 36], [2, 37]]], [26, [[4, 43], [1, 44]]]];
    const ALIGN = [null, [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]];
    const MASKS = [(y, x) => (y + x) % 2 === 0, y => y % 2 === 0, (y, x) => x % 3 === 0, (y, x) => (y + x) % 3 === 0, (y, x) => (Math.floor(y / 2) + Math.floor(x / 3)) % 2 === 0,
      (y, x) => (y * x) % 2 + (y * x) % 3 === 0, (y, x) => ((y * x) % 2 + (y * x) % 3) % 2 === 0, (y, x) => ((y + x) % 2 + (y * x) % 3) % 2 === 0];
    function encode(text) {
      const bytes = Array.from(new TextEncoder().encode(String(text)));
      let v = 1; for (; v <= 10; v++) { const dc = M[v][1].reduce((a, g) => a + g[0] * g[1], 0); if (4 + (v < 10 ? 8 : 16) + 8 * bytes.length <= dc * 8) break; }
      if (v > 10) throw new Error('QR text too long');
      const [ecn, groups] = M[v], dc = groups.reduce((a, g) => a + g[0] * g[1], 0);
      const bits = []; const put = (val, n) => { for (let i = n - 1; i >= 0; i--) bits.push((val >>> i) & 1); };
      put(4, 4); put(bytes.length, v < 10 ? 8 : 16); bytes.forEach(b => put(b, 8));
      put(0, Math.min(4, dc * 8 - bits.length)); while (bits.length % 8) bits.push(0);
      const data = []; for (let i = 0; i < bits.length; i += 8) data.push(parseInt(bits.slice(i, i + 8).join(''), 2));
      for (let p = 0; data.length < dc; p++) data.push(p % 2 ? 0x11 : 0xec);
      const blocks = []; let k = 0; groups.forEach(([n, len]) => { for (let i = 0; i < n; i++) { const d = data.slice(k, k + len); k += len; blocks.push({ d, e: rs(d, ecn) }); } });
      const cw = []; const maxD = Math.max(...blocks.map(b => b.d.length));
      for (let i = 0; i < maxD; i++) blocks.forEach(b => { if (i < b.d.length) cw.push(b.d[i]); });
      for (let i = 0; i < ecn; i++) blocks.forEach(b => cw.push(b.e[i]));
      const size = 17 + 4 * v, mod = [], fn = [];
      for (let y = 0; y < size; y++) { mod.push(new Array(size).fill(false)); fn.push(new Array(size).fill(false)); }
      const set = (x, y, d) => { mod[y][x] = d; fn[y][x] = true; };
      for (let i = 0; i < size; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
      [[3, 3], [size - 4, 3], [3, size - 4]].forEach(([cx, cy]) => { for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) { const x = cx + dx, y = cy + dy, dist = Math.max(Math.abs(dx), Math.abs(dy)); if (x >= 0 && x < size && y >= 0 && y < size) set(x, y, dist !== 2 && dist !== 4); } });
      const al = ALIGN[v], last = al.length - 1;
      al.forEach((ay, i) => al.forEach((ax, j) => { if ((i === 0 && j === 0) || (i === 0 && j === last) || (i === last && j === 0)) return; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(ax + dx, ay + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1); }));
      const format = mask => {
        const d = (0 << 3) | mask; let r = d; for (let i = 0; i < 10; i++) r = (r << 1) ^ ((r >>> 9) * 0x537);
        const b = ((d << 10) | r) ^ 0x5412, bit = i => ((b >>> i) & 1) === 1;
        for (let i = 0; i <= 5; i++) set(8, i, bit(i));
        set(8, 7, bit(6)); set(8, 8, bit(7)); set(7, 8, bit(8));
        for (let i = 9; i < 15; i++) set(14 - i, 8, bit(i));
        for (let i = 0; i < 8; i++) set(size - 1 - i, 8, bit(i));
        for (let i = 8; i < 15; i++) set(8, size - 15 + i, bit(i));
        set(8, size - 8, true);
      };
      format(0);
      if (v >= 7) { let r = v; for (let i = 0; i < 12; i++) r = (r << 1) ^ ((r >>> 11) * 0x1f25); const b = (v << 12) | r; for (let i = 0; i < 18; i++) { const d = ((b >>> i) & 1) === 1, a = size - 11 + i % 3, c = Math.floor(i / 3); set(a, c, d); set(c, a, d); } }
      let i = 0; const allBits = []; cw.forEach(c => { for (let j = 7; j >= 0; j--) allBits.push((c >>> j) & 1); });
      for (let right = size - 1; right >= 1; right -= 2) {
        if (right === 6) right = 5;
        for (let vert = 0; vert < size; vert++) for (let j = 0; j < 2; j++) {
          const x = right - j, up = ((right + 1) & 2) === 0, y = up ? size - 1 - vert : vert;
          if (!fn[y][x]) { mod[y][x] = i < allBits.length ? allBits[i] === 1 : false; i++; }
        }
      }
      const apply = m => { for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (!fn[y][x] && MASKS[m](y, x)) mod[y][x] = !mod[y][x]; };
      const penalty = () => {
        let p = 0, dark = 0;
        for (let pass = 0; pass < 2; pass++) for (let a = 0; a < size; a++) {
          let run = 1; const at = b => pass ? mod[b][a] : mod[a][b];
          for (let b = 1; b < size; b++) { if (at(b) === at(b - 1)) { run++; if (run === 5) p += 3; else if (run > 5) p++; } else run = 1; }
          for (let b = 0; b + 10 < size; b++) {
            const s = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0].map((q, t) => at(b + t) === !!q).every(Boolean), s2 = [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1].map((q, t) => at(b + t) === !!q).every(Boolean);
            if (s) p += 40; if (s2) p += 40;
          }
        }
        for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) { if (mod[y][x]) dark++; if (y < size - 1 && x < size - 1) { const c = mod[y][x]; if (c === mod[y][x + 1] && c === mod[y + 1][x] && c === mod[y + 1][x + 1]) p += 3; } }
        return p + (Math.ceil(Math.abs(dark * 20 - size * size * 10) / (size * size)) - 1) * 10;
      };
      let best = 0, bestP = Infinity;
      for (let m = 0; m < 8; m++) { apply(m); format(m); const p = penalty(); if (p < bestP) { bestP = p; best = m; } apply(m); }
      apply(best); format(best);
      return mod;
    }
    return encode;
  })();
  function qrPath(mat, x0, y0, cell) {
    let d = ''; mat.forEach((row, y) => { let x = 0; while (x < row.length) { if (!row[x]) { x++; continue; } let e = x; while (e < row.length && row[e]) e++; d += `M${P(x0 + x * cell)} ${P(y0 + y * cell)}h${P((e - x) * cell)}v${P(cell)}h${P(-(e - x) * cell)}Z`; x = e; } });
    return d;
  }

  /* ---------- server: issuing and verifying ---------- */
  const DEVICE = 'ct-device-id';
  function deviceId() {
    let d = ''; try { d = localStorage.getItem(DEVICE) || ''; } catch (e) {}
    if (!/^d_[a-f0-9]{24}$/.test(d)) { const a = new Uint8Array(12); (window.crypto || {}).getRandomValues ? crypto.getRandomValues(a) : a.forEach((_, i) => { a[i] = Math.random() * 256; }); d = 'd_' + Array.from(a, b => b.toString(16).padStart(2, '0')).join(''); try { localStorage.setItem(DEVICE, d); } catch (e) {} }
    return d;
  }
  const cfg = k => (window.Cert && window.Cert[k]) || '';
  const endpoint = () => String(cfg('endpoint') || window.CT_RECORDS_ENDPOINT || '').replace(/\/+$/, '');
  function verifyBase() { const v = cfg('verifyBase'); if (v) return String(v); let o = location.origin; try { if (endpoint()) o = new URL(endpoint(), location.href).origin; } catch (e) {} if (!/^https?:/.test(o)) o = 'https://chalktalkstudy.com'; return o + '/readyroom/verify.html'; }
  const verifyUrl = code => verifyBase() + '?c=' + encodeURIComponent(code);
  const verifyHost = () => verifyBase().replace(/^https?:\/\//, '').replace(/\.html$/, '').replace(/\/$/, '');
  function headers() { const h = { 'content-type': 'application/json', 'x-ct-device': deviceId() }; let t = cfg('token'); try { if (typeof t === 'function') t = t(); } catch (e) { t = ''; } if (t) h.authorization = 'Bearer ' + t; return h; }
  async function apiCall(method, p, body) {
    let res; try { res = await fetch(endpoint() + p, { method, headers: headers(), credentials: endpoint() ? 'omit' : 'same-origin', body: body ? JSON.stringify(body) : undefined }); }
    catch (e) { throw Object.assign(new Error('Couldn\'t issue your certificate, try again.'), { network: true }); }
    let j = {}; try { j = await res.json(); } catch (e) {}
    if (!res.ok) throw Object.assign(new Error(j.error || 'Couldn\'t issue your certificate, try again.'), { status: res.status, code: j.code });
    return j;
  }
  const siteOf = o => String(o.site || (location.pathname.split('/')[1] || '')).toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40);
  function issueRemote(o, name, score) {
    return apiCall('POST', '/api/cert/issue', { certId: o.id, title: o.title, issuer: o.issuer, kind: o.kind, detail: o.detail || '', note: o.note || '', name, score: score == null ? undefined : score,
      site: siteOf(o), modules: (o.modules || []).slice(0, 24), theme: o.theme || null, device: deviceId() });
  }
  async function sync(force) {
    const all = read(), ids = Object.keys(all).filter(id => all[id] && all[id].srv && all[id].code).slice(0, 25); if (!ids.length) return [];
    let last = 0; try { last = Number(localStorage.getItem('ct-certs-sync') || 0); } catch (e) {}
    if (!force && Date.now() - last < 6 * 3600e3) return [];
    try { localStorage.setItem('ct-certs-sync', String(Date.now())); } catch (e) {}
    const changed = [];
    await Promise.all(ids.map(id => fetch(endpoint() + '/api/cert/verify?c=' + encodeURIComponent(all[id].code), { credentials: endpoint() ? 'omit' : 'same-origin' }).then(r => r.json()).then(v => {
      if (!v || v.found === false) return; const cur = read(), r = cur[id]; if (!r) return;
      const nx = Object.assign({}, r, { name: v.name || r.name, date: v.date || r.date, score: v.score == null ? r.score : v.score, revoked: !!v.revoked });
      if (JSON.stringify(nx) !== JSON.stringify(r)) { cur[id] = nx; write(cur); changed.push(id); document.dispatchEvent(new CustomEvent('ct-cert-change', { detail: { id, record: nx } })); }
    }).catch(() => {})));
    return changed;
  }
  const today =() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const longDate = iso => { const p = String(iso).split('-').map(Number); const d = p.length === 3 && p.every(n => n > 0) ? new Date(p[0], p[1] - 1, p[2]) : new Date(); return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }); };

  /* ---------- drawing: build a list of shapes, then paint to SVG or canvas ---------- */
  const mctx = document.createElement('canvas').getContext('2d');
  const fontStr = (o) => `${o.style || 'normal'} ${o.weight || 400} ${o.size}px ${o.font}`;
  function measure(text, o) { mctx.font = fontStr(o); return mctx.measureText(text).width; }
  function fit(text, o, maxW, minSize) { let s = o.size; while (s > (minSize || 10) && measure(text, Object.assign({}, o, { size: s })) > maxW) s -= 1; return s; }
  function wrap(text, o, maxW, maxLines) {
    const words = String(text).split(/\s+/).filter(Boolean), lines = []; let cur = '';
    for (const w of words) { const t = cur ? cur + ' ' + w : w; if (measure(t, o) <= maxW || !cur) cur = t; else { lines.push(cur); cur = w; } }
    if (cur) lines.push(cur);
    if (lines.length > maxLines) { const keep = lines.slice(0, maxLines); let last = keep[maxLines - 1] + '…'; while (measure(last, o) > maxW && last.length > 2) last = last.slice(0, -2) + '…'; keep[maxLines - 1] = last; return keep; }
    return lines;
  }
  function spaced(text, o, x, anchor, ls) { // per-character x positions for tracked caps
    const ch = Array.from(text), ws = ch.map(c => measure(c, o)), total = ws.reduce((a, b) => a + b, 0) + ls * (ch.length - 1);
    let cx = anchor === 'middle' ? x - total / 2 : anchor === 'end' ? x - total : x; const xs = [];
    ws.forEach(w => { xs.push(cx); cx += w + ls; });
    return { xs, total };
  }
  const P = n => Math.round(n * 100) / 100;

  function poly(pts, close) { return pts.map((p, i) => (i ? 'L' : 'M') + P(p[0]) + ' ' + P(p[1])).join('') + (close ? 'Z' : ''); }
  function spiro(cx, cy, rad, R, r, d, rot) { // hypotrochoid, closed
    const g = (a, b) => b ? g(b, a % b) : a, turns = r / g(R, r), steps = 90 * turns, k = (R - r) / r, sc = rad / (R - r + d), pts = [];
    for (let i = 0; i <= steps; i++) { const t = i / steps * Math.PI * 2 * turns, x = (R - r) * Math.cos(t) + d * Math.cos(k * t), y = (R - r) * Math.sin(t) - d * Math.sin(k * t); const c = Math.cos(rot || 0), s = Math.sin(rot || 0); pts.push([cx + sc * (x * c - y * s), cy + sc * (x * s + y * c)]); }
    return poly(pts, true);
  }
  function waves(x0, y0, x1, y1, amp, period, phases) { // guilloche braid along a straight band
    const L = Math.hypot(x1 - x0, y1 - y0), ux = (x1 - x0) / L, uy = (y1 - y0) / L, nx = -uy, ny = ux, n = Math.max(2, Math.round(L / period)), steps = n * 14, out = [];
    phases.forEach(ph => { const pts = []; for (let i = 0; i <= steps; i++) { const t = i / steps, s = t * L, o = amp * Math.sin(t * n * Math.PI * 2 + ph) * Math.min(1, Math.sin(Math.PI * t) * 6); pts.push([x0 + ux * s + nx * o, y0 + uy * s + ny * o]); } out.push(poly(pts)); });
    return out.join('');
  }

  function layout(o, rec, T) {
    const S = [], add = s => (S.push(s), s);
    const disp = T.display, cx = W / 2;
    const code = rec.code || '', real = /^CT-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code), shownCode = real ? code : 'CT-····-····';
    const host = verifyHost();
    // paper
    add({ t: 'rect', x: 0, y: 0, w: W, h: H, fill: T.bg });
    add({ t: 'rect', x: 92, y: 92, w: W - 184, h: H - 184, fill: T.panel });
    // watermark rosette behind the text
    add({ t: 'path', d: spiro(cx, 400, 250, 13, 5, 4.2, 0), stroke: T.accent, sw: 0.6, op: T.dark ? 0.08 : 0.07 });
    add({ t: 'path', d: spiro(cx, 400, 200, 11, 4, 3.4, 0.3), stroke: T.accent, sw: 0.6, op: T.dark ? 0.07 : 0.06 });
    // faint diagonal watermark: the code and "verified", repeated (makes a cut-and-paste name edit obvious)
    if (real) {
      add({ t: 'clip', x: 92, y: 92, w: W - 184, h: H - 184 });
      const wm = `${code}  ·  VERIFY AT ${host.toUpperCase()}  ·  `.repeat(6);
      [-40, 190, 420, 650, 880].forEach(yy => add({ t: 'text', s: wm, x: cx, y: yy, rot: -24, font: T.mono, size: 22, weight: 700, fill: T.accent, op: T.dark ? 0.07 : 0.055, anchor: 'middle', base: 'middle' }));
      add({ t: 'unclip' });
    }
    // border: two rules with a guilloche braid between, rosettes on the corners
    add({ t: 'rect', x: 24, y: 24, w: W - 48, h: H - 48, stroke: T.accent, sw: 2.4 });
    add({ t: 'rect', x: 30, y: 30, w: W - 60, h: H - 60, stroke: T.accent, sw: 0.8, op: 0.8 });
    add({ t: 'rect', x: 76, y: 76, w: W - 152, h: H - 152, stroke: T.accent, sw: 0.8, op: 0.8 });
    add({ t: 'rect', x: 84, y: 84, w: W - 168, h: H - 168, stroke: T.accent, sw: 1.6 });
    // microtext border (between the two inner rules): readable only zoomed in, blurs when photocopied or retyped
    {
      const mO = { font: T.mono, size: 4.6, weight: 600 }, unit = `${shownCode} · ${String(o.issuer || 'Chalk Talk').toUpperCase()} · VERIFY AT ${host.toUpperCase()} · `;
      const run = len => { let s = ''; while (measure(s + unit, mO) < len) s += unit; return s.trim(); };
      const hz = run(W - 180), vt = run(H - 180);
      add({ t: 'text', s: hz, x: cx, y: 80, font: T.mono, size: 4.6, weight: 600, fill: T.accent, anchor: 'middle', base: 'middle' });
      add({ t: 'text', s: hz, x: cx, y: H - 80, font: T.mono, size: 4.6, weight: 600, fill: T.accent, anchor: 'middle', base: 'middle' });
      add({ t: 'text', s: vt, x: 80, y: H / 2, rot: -90, font: T.mono, size: 4.6, weight: 600, fill: T.accent, anchor: 'middle', base: 'middle' });
      add({ t: 'text', s: vt, x: W - 80, y: H / 2, rot: 90, font: T.mono, size: 4.6, weight: 600, fill: T.accent, anchor: 'middle', base: 'middle' });
    }
    const b = 53, ph = [0, Math.PI / 3, 2 * Math.PI / 3, Math.PI, 4 * Math.PI / 3, 5 * Math.PI / 3];
    const band = waves(b, b, W - b, b, 13, 26, ph) + waves(b, H - b, W - b, H - b, 13, 26, ph) + waves(b, b, b, H - b, 13, 26, ph) + waves(W - b, b, W - b, H - b, 13, 26, ph);
    add({ t: 'path', d: band, stroke: T.accent, sw: 0.7, op: 0.85 });
    [[b, b], [W - b, b], [b, H - b], [W - b, H - b]].forEach(([x, y]) => {
      add({ t: 'circle', cx: x, cy: y, r: 31, fill: T.bg, stroke: T.accent, sw: 1.4 });
      add({ t: 'path', d: spiro(x, y, 27, 8, 3, 2.6, 0), stroke: T.accent, sw: 0.7 });
      add({ t: 'path', d: spiro(x, y, 15, 7, 2, 1.6, 0.2), stroke: T.deep, sw: 0.7 });
      add({ t: 'circle', cx: x, cy: y, r: 3, fill: T.accent });
    });
    // inner corner flourishes
    [[110, 110, 1, 1], [W - 110, 110, -1, 1], [110, H - 110, 1, -1], [W - 110, H - 110, -1, -1]].forEach(([x, y, sx, sy]) => {
      add({ t: 'path', d: `M${x} ${y + sy * 46}L${x} ${y}L${x + sx * 46} ${y}M${x + sx * 8} ${y + sy * 30}L${x + sx * 8} ${y + sy * 8}L${x + sx * 30} ${y + sy * 8}`, stroke: T.accent, sw: 1, op: 0.7 });
      add({ t: 'circle', cx: x + sx * 8, cy: y + sy * 8, r: 2.2, fill: T.accent, op: 0.8 });
    });

    // text
    const txt = (text, x, y, f) => add(Object.assign({ t: 'text', s: text, x, y, font: disp, size: 20, weight: 400, fill: T.ink, anchor: 'middle' }, f));
    const caps = (text, x, y, f, ls) => { const o = Object.assign({ font: disp, size: 15, weight: 600 }, f); const sp = spaced(text, o, x, f.anchor || 'middle', ls); return Object.assign(txt(text, x, y, Object.assign({}, o, { xs: sp.xs, anchor: 'start' })), { width: sp.total }); };
    // code in the top-right corner
    txt('No. ' + shownCode, W - 164, 121, { font: T.mono, size: 11, weight: 600, fill: T.muted, anchor: 'end' });
    const issuer = String(o.issuer || 'Chalk Talk').toUpperCase();
    const iss = caps(issuer, cx, 140, { size: fit(issuer, { font: disp, size: 17, weight: 600 }, 600, 11), fill: T.accent }, 5);
    const half = iss.width / 2 + 24;
    add({ t: 'path', d: `M${cx - half - 80} 135L${cx - half} 135M${cx + half} 135L${cx + half + 80} 135`, stroke: T.accent, sw: 1 });
    add({ t: 'path', d: `M${cx - half - 86} 135l6 -6l6 6l-6 6zM${cx + half + 74} 135l6 -6l6 6l-6 6z`, fill: T.accent });
    const kind = String(o.kind || 'Certificate of Completion');
    txt(kind, cx, 204, { size: fit(kind, { font: disp, size: 58, weight: 600 }, 900, 30), weight: 600 });
    caps('THIS IS TO CERTIFY THAT', cx, 244, { size: 13, weight: 600, fill: T.muted }, 4);
    const name = String(rec.name || 'Your Name');
    const nameSize = fit(name, { font: disp, size: 70, style: 'italic', weight: 400 }, 860, 30);
    txt(name, cx, 312, { size: nameSize, style: 'italic', fill: T.ink });
    add({ t: 'path', d: `M${cx - 290} 336L${cx - 12} 336M${cx + 12} 336L${cx + 290} 336`, stroke: T.accent, sw: 1.2 });
    add({ t: 'path', d: `M${cx} 329l7 7l-7 7l-7 -7z`, fill: T.accent });
    txt('has successfully completed the course', cx, 372, { size: 19, style: 'italic', fill: T.muted });
    const title = String(o.title || 'Course');
    const tO = { font: disp, size: 38, weight: 700 }; let tl = [title];
    if (measure(title, tO) > 920) { tO.size = 34; tl = wrap(title, tO, 920, 2); if (tl.length > 1 || measure(tl[0], tO) > 920) tO.size = Math.min(...tl.map(l => fit(l, tO, 920, 22))); }
    let y = 416; tl.forEach((l, i) => txt(l, cx, y + i * (tO.size + 6), { size: tO.size, weight: 700 }));
    y += (tl.length - 1) * (tO.size + 6);
    const det = [o.detail, typeof o.score === 'number' && isFinite(o.score) ? `Final score ${Math.round(o.score)}%` : ''].filter(Boolean).join('  ·  ');
    if (det) { y += 36; txt(det, cx, y, { size: fit(det, { font: disp, size: 19, style: 'italic' }, 900, 12), style: 'italic', fill: T.muted }); }
    // The seal sits below everything above it: nothing printed above may come lower than SEAL_TOP - 12.
    const sx = cx, sy = 606, sr = 50, SEAL_TOP = sy - sr - 6;
    const mods = (Array.isArray(o.modules) ? o.modules : []).map(String).filter(Boolean);
    if (mods.length) {
      const shown = mods.slice(0, 12), more = mods.length - shown.length;
      const mO = { font: disp, size: 14, weight: 400 }, line = shown.join('   ·   ') + (more > 0 ? `   ·   +${more} more` : '');
      const lines = wrap(line, mO, 860, 3).map(s => s.replace(/^·\s+|\s+·$/g, ''));
      const first = y + 30, room = Math.max(0, Math.min(3, Math.floor((SEAL_TOP - 12 - first) / 19) + 1));
      lines.slice(0, room).forEach((l, i) => txt(l, cx, first + i * 19, { size: 14, fill: T.muted }));
    }

    // date (left) · seal (centre) · code (right) · QR (far right). Columns never meet: 240-480 | 544-656 | 720-940 | 972-1072
    const by = 640, lx = 360, rx = 830;
    txt(longDate(rec.date), lx, by - 12, { size: fit(longDate(rec.date), { font: disp, size: 22, weight: 600 }, 236, 14), weight: 600 });
    add({ t: 'path', d: `M${lx - 120} ${by}L${lx + 120} ${by}`, stroke: T.faint, sw: 1 });
    caps('DATE AWARDED', lx, by + 22, { size: 11, weight: 600, fill: T.muted }, 3);
    txt(shownCode, rx, by - 12, { font: T.mono, size: 20, weight: 700 });
    add({ t: 'path', d: `M${rx - 110} ${by}L${rx + 110} ${by}`, stroke: T.faint, sw: 1 });
    caps('VERIFICATION CODE', rx, by + 22, { size: 11, weight: 600, fill: T.muted }, 3);
    const qs = 100, qx = 972, qy = 548;
    if (real) {
      const mat = qr(verifyUrl(code)), n = mat.length, cell = (qs - 8) / n;
      add({ t: 'rect', x: qx, y: qy, w: qs, h: qs, fill: '#ffffff', stroke: T.faint, sw: 0.8 });
      add({ t: 'path', d: qrPath(mat, qx + 4, qy + 4, cell), fill: '#111111' });
    } else {
      add({ t: 'rect', x: qx, y: qy, w: qs, h: qs, stroke: T.faint, sw: 1 });
      txt('QR code', qx + qs / 2, qy + qs / 2 - 6, { size: 12, fill: T.faint, base: 'middle' });
      txt('after issuing', qx + qs / 2, qy + qs / 2 + 10, { size: 12, fill: T.faint, base: 'middle' });
    }
    caps('SCAN TO VERIFY', qx + qs / 2, qy + qs + 16, { size: 8.5, weight: 700, fill: T.muted }, 1.6);

    add({ t: 'path', d: `M${sx - 32} ${sy + 22}L${sx - 48} ${sy + 66}L${sx - 32} ${sy + 60}L${sx - 23} ${sy + 74}L${sx - 8} ${sy + 32}Z`, fill: T.deep });
    add({ t: 'path', d: `M${sx + 32} ${sy + 22}L${sx + 48} ${sy + 66}L${sx + 32} ${sy + 60}L${sx + 23} ${sy + 74}L${sx + 8} ${sy + 32}Z`, fill: T.deep });
    const star = []; for (let i = 0; i < 96; i++) { const a = i / 96 * Math.PI * 2, r = i % 2 ? sr : sr + 6; star.push([sx + r * Math.cos(a), sy + r * Math.sin(a)]); }
    add({ t: 'path', d: poly(star, true), fill: T.accent });
    add({ t: 'circle', cx: sx, cy: sy, r: sr - 6, stroke: T.onAccent, sw: 1.2, op: 0.75 });
    add({ t: 'circle', cx: sx, cy: sy, r: sr - 21, stroke: T.onAccent, sw: 1, op: 0.75 });
    add({ t: 'path', d: spiro(sx, sy, sr - 24, 9, 4, 3, 0), stroke: T.onAccent, sw: 0.6, op: 0.35 });
    const ring = `${issuer.length > 22 ? issuer.slice(0, 22).trim() : issuer} ★ VERIFIED COMPLETION ★ `;
    const rO = { font: disp, size: 8, weight: 700 }, rr = sr - 13, cw = Array.from(ring).map(c => measure(c, rO) + 1.5), circ = 2 * Math.PI * rr, sc = Math.min(2, circ / cw.reduce((a, b) => a + b, 0));
    let ang = -Math.PI / 2;
    Array.from(ring).forEach((c, i) => { const w = cw[i] * sc, a = ang + w / 2 / rr; add({ t: 'text', s: c, x: sx + rr * Math.cos(a), y: sy + rr * Math.sin(a), rot: a * 180 / Math.PI + 90, font: disp, size: rO.size, weight: 700, fill: T.onAccent, anchor: 'middle', base: 'middle' }); ang += w / rr; });
    const mono = (String(o.issuer || 'C').replace(/^the\s+/i, '').match(/[A-Za-z0-9]/) || ['C'])[0].toUpperCase();
    txt(mono, sx, sy + 1, { size: 30, weight: 700, fill: T.onAccent, base: 'middle' });
    txt(String(rec.date || today()).slice(0, 4), sx, sy + 20, { size: 8, weight: 700, fill: T.onAccent, base: 'middle' });

    // disclaimers + where to verify (all below the seal ribbons, which end at sy + 74 = 680)
    let nl = [];
    if (o.note) { const n = String(o.note), nS = { font: disp, size: 11.5, style: 'italic' }; nl = measure(n, nS) <= 960 ? [n] : wrap(n, nS, 960, 2); }
    const fy = nl.length ? 698 + nl.length * 13 + 6 : 708, fixO = { font: disp, size: 12.5, style: 'italic' };
    nl.forEach((l, i) => txt(l, cx, 698 + i * 13, { size: fit(l, { font: disp, size: 11.5, style: 'italic' }, 960, 8), style: 'italic', fill: T.muted }));
    txt(FIXED, cx, fy, { size: fit(FIXED, fixO, 960, 9), style: 'italic', fill: T.muted });
    const vl = `Verify at ${host}  ·  Code ${shownCode}`;
    txt(vl, cx, fy + 20, { font: T.mono, size: fit(vl, { font: T.mono, size: 12, weight: 600 }, 900, 8), weight: 600, fill: T.muted });
    return S;
  }

  let clipN = 0;
  function toSVG(S, label) {
    const out = S.map(s => {
      if (s.t === 'clip') { const id = 'ctc-clip-' + (++clipN) + '-' + Math.random().toString(36).slice(2, 7); return `<clipPath id="${id}"><rect x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}"/></clipPath><g clip-path="url(#${id})">`; }
      if (s.t === 'unclip') return '</g>';
      const op = s.op != null ? ` opacity="${s.op}"` : '', fs = (s.fill ? ` fill="${s.fill}"` : ' fill="none"') + (s.stroke ? ` stroke="${s.stroke}" stroke-width="${s.sw || 1}"` : '');
      if (s.t === 'rect') return `<rect x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}"${fs}${op}/>`;
      if (s.t === 'circle') return `<circle cx="${P(s.cx)}" cy="${P(s.cy)}" r="${s.r}"${fs}${op}/>`;
      if (s.t === 'path') return `<path d="${s.d}"${fs}${op} stroke-linejoin="round"/>`;
      const f = ` font-family='${s.font.replace(/'/g, '')}' font-size="${s.size}" font-weight="${s.weight || 400}"${s.style ? ` font-style="${s.style}"` : ''} fill="${s.fill}"${op}${s.base === 'middle' ? ' dominant-baseline="central"' : ''}`;
      if (s.rot != null) return `<text transform="translate(${P(s.x)} ${P(s.y)}) rotate(${P(s.rot)})" text-anchor="middle"${f}>${esc(s.s)}</text>`;
      if (s.xs) return `<text x="${s.xs.map(P).join(' ')}" y="${s.y}"${f}>${esc(s.s)}</text>`;
      return `<text x="${P(s.x)}" y="${P(s.y)}" text-anchor="${s.anchor}"${f}>${esc(s.s)}</text>`;
    }).join('');
    return `<svg class="ctc-svg" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(label)}">${out}</svg>`;
  }

  function toCanvas(S) {
    const k = PNG_W / W, c = document.createElement('canvas'); c.width = PNG_W; c.height = Math.round(H * k);
    const x = c.getContext('2d'); x.scale(k, k); x.lineJoin = 'round';
    S.forEach(s => {
      if (s.t === 'clip') { x.save(); x.beginPath(); x.rect(s.x, s.y, s.w, s.h); x.clip(); return; }
      if (s.t === 'unclip') { x.restore(); return; }
      x.save(); x.globalAlpha = s.op != null ? s.op : 1;
      const paint = p => { if (s.fill) { x.fillStyle = s.fill; p ? x.fill(p) : x.fill(); } if (s.stroke) { x.strokeStyle = s.stroke; x.lineWidth = s.sw || 1; p ? x.stroke(p) : x.stroke(); } };
      if (s.t === 'rect') { x.beginPath(); x.rect(s.x, s.y, s.w, s.h); paint(); }
      else if (s.t === 'circle') { x.beginPath(); x.arc(s.cx, s.cy, s.r, 0, Math.PI * 2); paint(); }
      else if (s.t === 'path') paint(new Path2D(s.d));
      else {
        x.font = fontStr(s); x.fillStyle = s.fill; x.textBaseline = s.base === 'middle' ? 'middle' : 'alphabetic';
        if (s.rot != null) { x.translate(s.x, s.y); x.rotate(s.rot * Math.PI / 180); x.textAlign = 'center'; x.fillText(s.s, 0, 0); }
        else if (s.xs) { x.textAlign = 'left'; Array.from(s.s).forEach((ch, i) => x.fillText(ch, s.xs[i], s.y)); }
        else { x.textAlign = s.anchor === 'middle' ? 'center' : s.anchor === 'end' ? 'right' : 'left'; x.fillText(s.s, s.x, s.y); }
      }
      x.restore();
    });
    return c;
  }

  /* ---------- styles ---------- */
  const CSS = `
.ctc-ov{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:12px;background:rgba(8,10,16,.72);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);animation:ctc-in .18s ease-out}
@keyframes ctc-in{from{opacity:0}to{opacity:1}}
@media (prefers-reduced-motion:reduce){.ctc-ov{animation:none}}
.ctc-dlg{position:relative;width:min(980px,100%);max-height:calc(100dvh - 24px);overflow:auto;border-radius:18px;padding:26px 26px 22px;box-shadow:0 30px 80px rgba(0,0,0,.45);background:var(--ctc-bg);color:var(--ctc-ink);font:16px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;text-align:left}
.ctc-dlg *{box-sizing:border-box}
.ctc-dlg h2{margin:0 40px 4px 0;font:600 clamp(22px,4vw,30px)/1.15 var(--ctc-font);color:var(--ctc-ink);letter-spacing:0}
.ctc-dlg .ctc-k{margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--ctc-accent)}
.ctc-dlg p{margin:0 0 12px;color:var(--ctc-muted)}
.ctc-x{position:absolute;top:14px;right:14px;width:40px;height:40px;border-radius:50%;border:1px solid var(--ctc-line);background:transparent;color:var(--ctc-ink);font-size:22px;line-height:1;cursor:pointer}
.ctc-row{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin:12px 0}
.ctc-dlg label{display:block;font-size:13px;font-weight:700;margin:0 0 6px;color:var(--ctc-ink)}
.ctc-in{flex:1 1 220px;min-width:0;height:48px;padding:0 14px;border-radius:12px;border:1.5px solid var(--ctc-line);background:var(--ctc-field);color:var(--ctc-ink);font:500 17px system-ui,sans-serif}
.ctc-in:focus{outline:none;border-color:var(--ctc-accent);box-shadow:0 0 0 3px var(--ctc-ring)}
.ctc-b{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:46px;padding:0 18px;border-radius:12px;border:1.5px solid var(--ctc-accent);background:var(--ctc-accent);color:var(--ctc-on);font:700 15px system-ui,sans-serif;cursor:pointer;text-decoration:none}
.ctc-b.ghost{background:transparent;color:var(--ctc-ink);border-color:var(--ctc-line)}
.ctc-b:focus-visible,.ctc-x:focus-visible{outline:3px solid var(--ctc-ring);outline-offset:2px}
.ctc-b[disabled]{opacity:.5;cursor:not-allowed}
.ctc-b[hidden]{display:none}
.ctc-prev{margin:14px 0 4px;border-radius:10px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,.25);line-height:0}
.ctc-svg{display:block;width:100%;height:auto}
.ctc-msg{min-height:1.4em;font-size:14px;margin:6px 0 0!important}
.ctc-small{font-size:12.5px!important;opacity:.85;margin:4px 0 0!important}
.ctc-protect,.ctc-preview,.ctc-verify-art{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}
.ctc-protect svg,.ctc-preview svg,.ctc-verify-art svg{-webkit-user-drag:none;pointer-events:none}
.ctc-dlg[aria-busy] .ctc-dl,.ctc-dlg[aria-busy] .ctc-pr{opacity:.6}
.ctc-err{color:#d33!important}
@media (max-width:520px){.ctc-dlg{padding:20px 14px 16px;border-radius:14px}.ctc-row .ctc-b{flex:1 1 auto}}
.ctc-btn{display:inline-flex;align-items:center;gap:8px;min-height:46px;padding:0 20px;border-radius:12px;border:0;cursor:pointer;font:700 15px/1 system-ui,-apple-system,"Segoe UI",sans-serif;background:var(--ctc-a,#a8842c);color:var(--ctc-o,#fff);box-shadow:0 6px 18px rgba(0,0,0,.18);transition:transform .15s}
.ctc-btn:hover{transform:translateY(-2px)}.ctc-btn:focus-visible{outline:3px solid currentColor;outline-offset:3px}
.ctc-hint{display:inline-flex;align-items:center;gap:8px;font:600 14px/1.4 system-ui,sans-serif;opacity:.85;margin:6px 0}
.ctc-wall{display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));font-family:system-ui,sans-serif}
.ctc-wall .ctc-card{display:block;width:100%;text-align:left;padding:16px;border-radius:14px;border:1px solid rgba(127,127,127,.3);background:rgba(127,127,127,.06);color:inherit;cursor:pointer;font:inherit}
.ctc-wall .ctc-card b{display:block;font-size:16px;margin:2px 0}.ctc-wall .ctc-card small{display:block;opacity:.7}
.ctc-wall-empty{opacity:.7;font-family:system-ui,sans-serif}
.ctc-preview{line-height:0;border-radius:10px;overflow:hidden;box-shadow:0 18px 50px rgba(0,0,0,.28)}
.ctc-print{display:none}
@media print{
  @page{size:landscape;margin:0}
  html.ctc-printing body>*:not(.ctc-print){display:none!important}
  html.ctc-printing .ctc-print{display:block!important;position:static;width:100%;margin:0}
  html.ctc-printing .ctc-print svg{width:100%;height:auto;page-break-inside:avoid;break-inside:avoid}
  html.ctc-printing,html.ctc-printing body{background:#fff!important;margin:0!important;padding:0!important}
  .ctc-print *{-webkit-print-color-adjust:exact;print-color-adjust:exact}
}`;
  function injectCSS() { if (document.getElementById('ctc-css')) return; const s = document.createElement('style'); s.id = 'ctc-css'; s.textContent = CSS; (document.head || document.documentElement).appendChild(s); }

  /* ---------- modal ---------- */
  let open = null;
  const FOCUS = 'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])';
  function norm(o) { o = Object.assign({}, o || {}); o.id = String(o.id || 'course').trim(); o.title = o.title || 'Course'; o.issuer = o.issuer || 'Chalk Talk'; o.kind = o.kind || 'Certificate of Completion'; return o; }

  function award(opts) {
    injectCSS();
    const o = norm(opts); REG[o.id] = o;
    if (open) open.close(null);
    const T = theme(o.theme), prevFocus = document.activeElement;
    const fontReady = ensureFont(T.font);
    return new Promise(resolve => {
      const ov = document.createElement('div'); ov.className = 'ctc-ov';
      const lineC = mix(T.ink, T.bg, 0.78);
      const vars = `--ctc-bg:${T.bg};--ctc-ink:${T.ink};--ctc-accent:${T.accent};--ctc-on:${T.onAccent};--ctc-muted:${T.muted};--ctc-line:${lineC};--ctc-field:${T.panel};--ctc-ring:${T.accent}55;--ctc-font:${T.display.replace(/"/g, "'")}`;
      const existing = read()[o.id];
      const saved = (existing && existing.name) || localStorage.getItem(NAME) || '';
      ov.innerHTML = `<div class="ctc-dlg" role="dialog" aria-modal="true" aria-labelledby="ctc-h" aria-describedby="ctc-d" style="${vars}">
<button type="button" class="ctc-x" aria-label="Close">×</button>
<p class="ctc-k">${esc(o.kind)}</p>
<h2 id="ctc-h">${existing ? 'Your certificate' : 'You earned your certificate'}</h2>
<p id="ctc-d">${esc(o.title)} · ${esc(o.issuer)}. Type your name the way it should be printed. Each certificate gets its own code that anyone can check.</p>
<form class="ctc-form" novalidate><label for="ctc-name">Name on certificate</label>
<div class="ctc-row" style="margin-top:0"><input id="ctc-name" class="ctc-in" maxlength="60" autocomplete="name" placeholder="Your full name" value="${esc(saved)}" required><button type="submit" class="ctc-b ctc-save">${existing && existing.srv ? 'Update name' : 'Issue certificate'}</button></div></form>
<div class="ctc-prev ctc-protect" aria-live="polite"></div>
<div class="ctc-row"><button type="button" class="ctc-b ctc-dl">⬇ Download PNG</button><button type="button" class="ctc-b ghost ctc-pr">🖨 Print</button><a class="ctc-b ghost ctc-vf" target="_blank" rel="noopener" hidden>Check it online</a><button type="button" class="ctc-b ghost ctc-done">Done</button></div>
<p class="ctc-msg" role="status"></p><p class="ctc-small">The PNG download is your official copy: its QR code and code open the public verification page.</p></div>`;
      document.body.appendChild(ov);
      const dlg = ov.querySelector('.ctc-dlg'), input = ov.querySelector('#ctc-name'), prev = ov.querySelector('.ctc-prev'), msg = ov.querySelector('.ctc-msg'), vf = ov.querySelector('.ctc-vf'), saveB = ov.querySelector('.ctc-save');
      const oldOverflow = document.documentElement.style.overflow; document.documentElement.style.overflow = 'hidden';
      // issued = the server's record for this certificate (code, date, name, score); null until issued
      let rec = null, issued = existing && existing.srv && existing.code ? { code: existing.code, date: existing.date, name: existing.name, score: existing.score, revoked: !!existing.revoked } : null, busy = null;
      const say = (t, err) => { msg.textContent = t; msg.classList.toggle('ctc-err', !!err); };
      const nameNow = () => input.value.replace(/\s+/g, ' ').trim();
      const scoreNow = () => typeof o.score === 'number' && isFinite(o.score) ? Math.round(o.score) : (existing && existing.score != null ? existing.score : null);
      const current = () => ({ name: nameNow(), date: issued ? issued.date : today(), code: issued ? issued.code : '', score: issued && issued.score != null ? issued.score : scoreNow() });
      const shapes = r => layout(Object.assign({}, o, { score: r.score == null ? undefined : r.score }), Object.assign({}, r, { name: r.name || 'Your Name' }), T);
      const draw = () => { const r = current(); prev.innerHTML = toSVG(shapes(r), `Certificate preview: ${o.kind}, ${o.title}, awarded to ${r.name || 'your name'}${r.code ? ', code ' + r.code : ''}`);
        if (issued) { vf.hidden = false; vf.href = verifyUrl(issued.code); saveB.textContent = 'Update name'; } };
      const store = r => {
        const all = read(), was = all[o.id] || {};
        all[o.id] = Object.assign({}, was, { name: r.name, date: r.date, code: r.code, score: r.score, srv: 1, revoked: !!r.revoked, title: o.title, issuer: o.issuer, kind: o.kind, detail: o.detail || '', theme: o.theme || null, note: o.note || '', modules: (o.modules || []).slice(0, 12), url: location.pathname, site: siteOf(o) });
        write(all); try { localStorage.setItem(NAME, r.name); } catch (e) {}
        rec = all[o.id]; return rec;
      };
      // Ask the server for this certificate (same person + course always gets the same code). Resolves to the record or null.
      const commit = () => {
        const name = nameNow(); if (name.length < 2) { say('Type your name first.', true); input.focus(); return Promise.resolve(null); }
        if (issued && issued.name === name && issued.fresh) return Promise.resolve(store(issued));
        if (busy) return busy;
        say('Issuing your certificate…'); dlg.setAttribute('aria-busy', 'true');
        busy = issueRemote(o, name, scoreNow()).then(r => {
          issued = { code: r.code, date: r.date, name: r.name, score: r.score, fresh: true }; store(issued); draw();
          say(`Issued. Verification code ${r.code}.`); return rec;
        }).catch(e => {
          if (e.network && issued && issued.name === name) { issued.fresh = true; say(''); return store(issued); } // offline, but this code was already issued by the server
          if (e.code === 'revoked') { const all = read(); if (all[o.id]) { all[o.id].revoked = true; write(all); } }
          say(e.network || !e.status || e.status >= 500 ? 'Couldn\'t issue your certificate, try again.' : e.message, true); return null;
        }).finally(() => { busy = null; dlg.removeAttribute('aria-busy'); });
        return busy;
      };
      let raf = 0; input.addEventListener('input', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); say(''); });
      ov.querySelector('.ctc-form').addEventListener('submit', e => { e.preventDefault(); commit(); });
      ov.querySelector('.ctc-dl').addEventListener('click', () => {
        commit().then(r => { if (!r) return;
          say('Preparing your PNG…');
          fontReady.then(() => {
            const c = toCanvas(shapes(current()));
            const file = `${o.id.replace(/[^a-z0-9-]+/gi, '-').toLowerCase()}-certificate-${issued.code}.png`;
            const done = blob => {
              if (!blob) { say('Could not create the image. Try Print instead.', true); return; }
              const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = file; a.rel = 'noopener'; document.body.appendChild(a); a.click(); a.remove();
              setTimeout(() => URL.revokeObjectURL(url), 30000);
              say('Downloaded. On a phone, check your Files or Downloads app.');
            };
            if (c.toBlob) c.toBlob(done, 'image/png'); else { try { fetch(c.toDataURL('image/png')).then(r => r.blob()).then(done); } catch (e) { done(null); } }
          });
        });
      });
      ov.querySelector('.ctc-pr').addEventListener('click', () => {
        commit().then(r => { if (!r) return;
          fontReady.then(() => {
            const box = document.createElement('div'); box.className = 'ctc-print'; box.innerHTML = toSVG(shapes(current()), `${o.kind}: ${o.title}`);
            document.body.appendChild(box); document.documentElement.classList.add('ctc-printing');
            const clean = () => { document.documentElement.classList.remove('ctc-printing'); box.remove(); removeEventListener('afterprint', clean); };
            addEventListener('afterprint', clean); window.print(); setTimeout(clean, 1500);
          });
        });
      });
      const close = val => {
        if (!ov.isConnected) return;
        ov.remove(); document.removeEventListener('keydown', onKey, true); document.documentElement.style.overflow = oldOverflow; open = null;
        try { if (prevFocus && prevFocus.focus) prevFocus.focus(); } catch (e) {}
        document.dispatchEvent(new CustomEvent('ct-cert-change', { detail: { id: o.id, record: rec } }));
        resolve(val === undefined ? rec : val);
      };
      ov.querySelector('.ctc-done').addEventListener('click', () => { if (nameNow().length >= 2) commit().then(() => close()); else close(); });
      ov.querySelector('.ctc-x').addEventListener('click', () => close());
      ov.addEventListener('mousedown', e => { if (e.target === ov) close(); });
      function onKey(e) {
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); return; }
        if (e.key === 'Tab') {
          const f = Array.from(dlg.querySelectorAll(FOCUS)).filter(el => el.offsetParent !== null || el === document.activeElement);
          if (!f.length) return; const first = f[0], last = f[f.length - 1];
          if (e.shiftKey && (document.activeElement === first || !dlg.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
          else if (!e.shiftKey && (document.activeElement === last || !dlg.contains(document.activeElement))) { e.preventDefault(); first.focus(); }
        }
      }
      document.addEventListener('keydown', onKey, true);
      open = { close };
      if (issued) rec = existing;
      draw(); fontReady.then(() => { if (ov.isConnected) draw(); });
      // Already have a name: issue (or refresh) right away, so the code and QR are real from the start.
      if (nameNow().length >= 2) commit();
      setTimeout(() => input.focus(), 30);
    });
  }

  /* ---------- buttons, hints, wall, preview ---------- */
  function button(opts) {
    injectCSS();
    const o = norm(opts); REG[o.id] = o; const T = theme(o.theme);
    const label = o.label || (has(o.id) ? '🎓 View your certificate' : '🎓 Get your certificate');
    return `<button type="button" class="ctc-btn${o.className ? ' ' + esc(o.className) : ''}" data-ct-cert="${esc(o.id)}" style="--ctc-a:${T.accent};--ctc-o:${T.onAccent}">${esc(label)}</button>`;
  }
  function hint(text, opts) { injectCSS(); return `<p class="ctc-hint${opts && opts.className ? ' ' + esc(opts.className) : ''}"><span aria-hidden="true">🎓</span><span>${esc(text)}</span></p>`; }
  function has(id) { const r = read()[id]; return !!(r && r.name && r.code); }
  function get(id) { const r = read()[id]; return r && r.name ? Object.assign({ id }, r) : null; }
  function list() { const all = read(); return Object.keys(all).filter(has).map(get).sort((a, b) => String(b.date).localeCompare(String(a.date))); }
  function wall() {
    injectCSS();
    const L = list();
    if (!L.length) return '<p class="ctc-wall-empty">No certificates yet. Finish a course to earn your first one.</p>';
    return `<div class="ctc-wall">${L.map(r => `<button type="button" class="ctc-card" data-ct-cert="${esc(r.id)}"><small>${esc(r.issuer || '')}</small><b>${esc(r.title || r.id)}</b><small>${esc(r.name)} · ${esc(longDate(r.date))}</small><small style="font-family:ui-monospace,monospace">${esc(r.code)}</small></button>`).join('')}</div>`;
  }
  function previewSVG(o) {
    const T = theme(o.theme), d = today();
    return toSVG(layout(o, { name: o.sampleName || 'Your Name Here', date: d, code: 'CT-SAMP-LE26' }, T), `Sample certificate: ${o.kind}, ${o.title}`);
  }
  function preview(opts) {
    injectCSS();
    const o = norm(opts); REG[o.id] = REG[o.id] || o;
    const T = theme(o.theme); ensureFont(T.font).then(() => document.querySelectorAll(`.ctc-preview[data-ct-preview="${window.CSS && window.CSS.escape ? window.CSS.escape(o.id) : o.id}"]`).forEach(el => { el.innerHTML = previewSVG(o); }));
    return `<div class="ctc-preview" data-ct-preview="${esc(o.id)}">${previewSVG(o)}</div>`;
  }
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('[data-ct-cert]'); if (!b) return;
    const id = b.getAttribute('data-ct-cert'), saved = read()[id] || {};
    const o = REG[id] || { id, title: saved.title, issuer: saved.issuer, kind: saved.kind, detail: saved.detail, theme: saved.theme, note: saved.note, modules: saved.modules, score: saved.score == null ? undefined : saved.score };
    e.preventDefault(); award(o);
  });

  // Re-render any certificate (e.g. the verifier page draws it from the server's record).
  function svg(opts, r) { injectCSS(); const o = norm(opts); const T = theme(o.theme); return toSVG(layout(Object.assign({}, o, { score: r && typeof r.score === 'number' ? r.score : o.score }), Object.assign({ name: 'Your Name', date: today(), code: '' }, r || {}), T), `${o.kind}: ${o.title}, awarded to ${(r && r.name) || ''}${r && r.code ? ', code ' + r.code : ''}`); }
  function png(opts, r) { const o = norm(opts), T = theme(o.theme); return ensureFont(T.font).then(() => toCanvas(layout(Object.assign({}, o, { score: r && typeof r.score === 'number' ? r.score : o.score }), Object.assign({ name: 'Your Name', date: today(), code: '' }, r || {}), T))); }
  // On-page previews: no right-click "Save image" and no drag-out. (Screenshots can't be blocked; the code and QR are what prove it's real.)
  ['contextmenu', 'dragstart'].forEach(ev => document.addEventListener(ev, e => { if (e.target && e.target.closest && e.target.closest('.ctc-protect,.ctc-preview,.ctc-verify-art,.ctc-print')) e.preventDefault(); }, true));

  const API = { __ct: 1, award, has, get, button, wall, hint, preview, list, code: codeFor, FIXED, svg, png, sync, verifyUrl, qr, deviceId, theme,
    endpoint: PRE.endpoint || window.CT_RECORDS_ENDPOINT || 'https://chalktalkstudy.com', verifyBase: PRE.verifyBase || 'https://chalktalkstudy.com/readyroom/verify.html', token: PRE.token || '' };
  window.Cert = API;
  setTimeout(() => { sync().catch(() => {}); }, 1500);
  if (document.head) injectCSS(); else document.addEventListener('DOMContentLoaded', injectCSS);
  document.dispatchEvent(new CustomEvent('ct-cert-ready'));
})();
