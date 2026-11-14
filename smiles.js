/* ChemFluent — SMILES → 2D skeletal structures (own parser + layout), wedges from @/@@, cis/trans from / \, and reaction schemes. */
'use strict';
const SMI = (() => {
  const VALS = { C: 4, N: 3, O: 2, S: 2, P: 3, F: 1, Cl: 1, Br: 1, I: 1, B: 3, H: 1 };
  function parse(s) {
    const atoms = [], bonds = [], ring = {}, stack = []; let prev = -1, bo = 1, bdir = null, i = 0;
    const addBond = (a, b, o, dir) => { const bd = { a, b, o, dir }; bonds.push(bd); atoms[a].nb.push(b); atoms[b].nb.push(a); atoms[a].nbOrder.push(b); atoms[b].nbOrder.push(a); return bd; };
    while (i < s.length) {
      const ch = s[i];
      if (ch === '(') { stack.push(prev); i++; continue; }
      if (ch === ')') { prev = stack.pop(); i++; continue; }
      if (ch === '-') { bo = 1; i++; continue; } if (ch === '=') { bo = 2; i++; continue; } if (ch === '#') { bo = 3; i++; continue; } if (ch === ':') { bo = 1.5; i++; continue; }
      if (ch === '/' || ch === '\\') { bdir = ch; i++; continue; } if (ch === '.') { prev = -1; i++; continue; }
      if (/[0-9%]/.test(ch)) { let n; if (ch === '%') { n = s.substr(i + 1, 2); i += 3; } else { n = ch; i++; } if (ring[n]) { const r = ring[n]; const o = bo !== 1 ? bo : r.bo; const bd = addBond(r.atom, prev, o, bdir || r.dir); bd.closure = true; atoms[prev].ringClose = (atoms[prev].ringClose || 0) + 1; delete ring[n]; } else { ring[n] = { atom: prev, bo, dir: bdir }; atoms[prev].nbOrder.push('R' + n); } bo = 1; bdir = null; continue; }
      let at;
      if (ch === '[') { const j = s.indexOf(']', i); const t = s.slice(i + 1, j); const m = t.match(/^(\d*)([A-Z][a-z]?|[cnosp])(@@|@)?(H(\d?))?([+-]+\d*)?$/); if (!m) throw new Error('bad atom ' + t); let q = 0; if (m[6]) { const d = m[6].match(/\d+/); q = (m[6][0] === '+' ? 1 : -1) * (d ? +d[0] : m[6].length); } at = { el: m[2].length === 1 && /[cnosp]/.test(m[2]) ? m[2].toUpperCase() : m[2], arom: /^[cnosp]$/.test(m[2]), q, hx: m[4] ? (m[5] ? +m[5] : 1) : 0, chir: m[3] || null, bracket: true }; i = j + 1; }
      else { const two = s.substr(i, 2); if (two === 'Cl' || two === 'Br') { at = { el: two }; i += 2; } else if (/[BCNOPSFI]/.test(ch)) { at = { el: ch }; i++; } else if (/[bcnops]/.test(ch)) { at = { el: ch.toUpperCase(), arom: true }; i++; } else throw new Error('bad char ' + ch); }
      at.nb = []; at.nbOrder = []; at.q = at.q || 0; at.idx = atoms.length; atoms.push(at); const k = atoms.length - 1;
      if (prev >= 0) { let o = bo; if (bo === 1 && atoms[prev].arom && at.arom) o = 1.5; addBond(prev, k, o, bdir); at.from = prev; }
      prev = k; bo = 1; bdir = null;
    }
    return { atoms, bonds };
  }
  // assign alternating double bonds in aromatic rings (Kekulé)
  function kekulize(M) { const ar = M.bonds.filter(b => b.o === 1.5); if (!ar.length) return; ar.forEach(b => b.o = 1); const need = M.atoms.map((a, i) => a.arom && !(a.el === 'N' && a.hx) && !(a.el === 'O' || a.el === 'S') && !(a.el === 'N' && M.atoms[i].nb.length === 3)); const cand = ar; const used = new Set();
    const go = k => { if (k === cand.length) return need.every((n, i) => !n || used.has(i)); const b = cand[k]; if (need[b.a] && need[b.b] && !used.has(b.a) && !used.has(b.b)) { used.add(b.a); used.add(b.b); b.o = 2; if (go(k + 1)) return true; b.o = 1; used.delete(b.a); used.delete(b.b); } return go(k + 1); };
    // try to satisfy every atom that needs a double bond
    const atomsNeeding = need.filter(Boolean).length; let ok = go(0); if (!ok) { cand.forEach(b => b.o = 1); } void atomsNeeding; }
  function rings(M) { const bi = (u, v) => M.bonds.findIndex(b => (b.a === u && b.b === v) || (b.a === v && b.b === u));
    const path = (s, t, skip, treeOnly) => { const prev = { [s]: -1 }, q = [s]; while (q.length) { const u = q.shift(); if (u === t) break; for (const v of M.atoms[u].nb) { const k = bi(u, v); if (k === skip || (treeOnly && M.bonds[k].closure)) continue; if (!(v in prev)) { prev[v] = u; q.push(v); } } } if (!(t in prev)) return null; const p = []; let u = t; while (u !== -1) { p.push(u); u = prev[u]; } return p; };
    const cands = []; M.bonds.forEach((cb, k) => { if (!cb.closure) return; [false, true].forEach(tr => { const p = path(cb.a, cb.b, k, tr); if (p) cands.push(p); }); });
    const edges = r => { const e = new Set(); r.forEach((u, j) => e.add(bi(u, r[(j + 1) % r.length]))); return e; };
    cands.sort((x, y) => x.length - y.length); const basis = [], out = []; const nClos = M.bonds.filter(b => b.closure).length;
    for (const r of cands) { if (out.length >= nClos) break; let v = edges(r); for (const bv of basis) { if (v.has(bv.piv)) { const nv = new Set(v); bv.set.forEach(e => nv.has(e) ? nv.delete(e) : nv.add(e)); v = nv; } } if (v.size) { const piv = Math.max(...v); basis.push({ set: v, piv }); out.push(r); } }
    return out; }
  const L = 50;
  function layout(M) {
    const n = M.atoms.length, P = Array(n).fill(null); const RR = rings(M); const inRing = new Set(RR.flat());
    const placeRing = (r, center) => { const k = r.length, R0 = L / (2 * Math.sin(Math.PI / k)); r.forEach((a, j) => { const t = -Math.PI / 2 + 2 * Math.PI * j / k + (k % 2 ? 0 : Math.PI / k); P[a] = [center[0] + R0 * Math.cos(t), center[1] + R0 * Math.sin(t)]; }); };
    const ringCenter = r => [r.reduce((s, a) => s + P[a][0], 0) / r.length, r.reduce((s, a) => s + P[a][1], 0) / r.length];
    const placedRings = new Set();
    const tryFused = () => { let prog = true; while (prog) { prog = false; RR.forEach((r, ri) => { if (placedRings.has(ri)) return; const done = r.filter(a => P[a]); if (done.length >= 2 && done.length < r.length) { // fuse across a shared edge
            const k = r.length; let s = -1; for (let j = 0; j < k; j++) if (P[r[j]] && P[r[(j + 1) % k]]) { s = j; break; } if (s < 0) return; const A = P[r[s]], B = P[r[(s + 1) % k]]; const mid = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2]; const other = RR.find((rr, rj) => rj !== ri && placedRings.has(rj) && rr.includes(r[s]) && rr.includes(r[(s + 1) % k])); const oc = other ? ringCenter(other) : [mid[0] + 1, mid[1]]; const dx = mid[0] - oc[0], dy = mid[1] - oc[1], dl = Math.hypot(dx, dy) || 1; const apo = L / (2 * Math.tan(Math.PI / k)); const C = [mid[0] + dx / dl * apo, mid[1] + dy / dl * apo]; const Rr = L / (2 * Math.sin(Math.PI / k)); const a0 = Math.atan2(A[1] - C[1], A[0] - C[0]), a1 = Math.atan2(B[1] - C[1], B[0] - C[0]); let step = 2 * Math.PI / k; let d = a1 - a0; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; const sgn = Math.sign(d) || 1; for (let j = 2; j < k; j++) { const a = r[(s + j) % k]; if (P[a]) continue; const t = a1 + sgn * step * (j - 1); P[a] = [C[0] + Rr * Math.cos(t), C[1] + Rr * Math.sin(t)]; } placedRings.add(ri); prog = true; } else if (done.length === r.length) placedRings.add(ri); }); } };
    // seed
    if (RR.length) { placeRing(RR[0], [0, 0]); placedRings.add(0); tryFused(); } else P[0] = [0, 0];
    const turn = Array(n).fill(0);
    const ang = (a, b) => Math.atan2(P[b][1] - P[a][1], P[b][0] - P[a][0]);
    const queue = P.map((p, i) => p ? i : -1).filter(i => i >= 0); const seen = new Set(queue);
    while (queue.length) { const u = queue.shift();
      RR.forEach((r, ri) => { if (placedRings.has(ri) || !r.includes(u) || r.some(a => a !== u && P[a])) return; // spiro: a new ring that shares only atom u
        const pr = RR.filter((rr, rj) => placedRings.has(rj) && rr.includes(u)); const c0 = pr.length ? ringCenter(pr[0]) : [P[u][0] - 1, P[u][1]]; const t = Math.atan2(P[u][1] - c0[1], P[u][0] - c0[0]);
        const k = r.length, Rr = L / (2 * Math.sin(Math.PI / k)), C = [P[u][0] + Rr * Math.cos(t), P[u][1] + Rr * Math.sin(t)], i0 = r.indexOf(u), a0 = Math.atan2(P[u][1] - C[1], P[u][0] - C[0]);
        r.forEach((a, jj) => { if (a === u) return; const tt = a0 + 2 * Math.PI * ((jj - i0 + k) % k) / k; P[a] = [C[0] + Rr * Math.cos(tt), C[1] + Rr * Math.sin(tt)]; if (!seen.has(a)) { seen.add(a); queue.push(a); } }); placedRings.add(ri); tryFused(); });
      const nbs = M.atoms[u].nb; const placed = nbs.filter(v => P[v]), fresh = nbs.filter(v => !P[v]); if (!fresh.length) continue; let angles = [];
      const deg = nbs.length; const triple = M.bonds.some(b => (b.a === u || b.b === u) && b.o === 3) || (M.bonds.filter(b => (b.a === u || b.b === u) && b.o === 2).length === 2);
      if (inRing.has(u) && placed.length >= 2) { const rr = RR.filter(r => r.includes(u)); const c = rr.map(ringCenter).reduce((s, p) => [s[0] + p[0] / rr.length, s[1] + p[1] / rr.length], [0, 0]); const out = Math.atan2(P[u][1] - c[1], P[u][0] - c[0]); if (fresh.length === 1) angles = [out]; else angles = fresh.map((_, j) => out + (j - (fresh.length - 1) / 2) * (Math.PI / 3)); }
      else if (placed.length === 0) { const base = [-Math.PI / 6, Math.PI / 6 + Math.PI * 2 / 3 * 2, Math.PI / 2 + Math.PI / 3 * 2, Math.PI]; angles = fresh.map((_, j) => fresh.length === 1 ? -Math.PI / 6 : -Math.PI / 6 + j * 2 * Math.PI / fresh.length); turn[u] = 1; void base; }
      else if (placed.length === 1) { const tin = ang(u, placed[0]); if (triple && fresh.length === 1) angles = [tin + Math.PI]; else if (deg === 2) { const pt = turn[placed[0]] || 1; turn[u] = -pt; angles = [tin + Math.PI - turn[u] * Math.PI / 3]; } else if (deg === 3) { angles = [tin + 2 * Math.PI / 3, tin - 2 * Math.PI / 3]; } else angles = [tin + Math.PI / 2, tin + Math.PI, tin - Math.PI / 2].slice(0, fresh.length); }
      else { const as = placed.map(v => ang(u, v)).sort((a, b) => a - b); let best = 0, bg = -1; for (let j = 0; j < as.length; j++) { const g = (as[(j + 1) % as.length] - as[j] + 2 * Math.PI) % (2 * Math.PI) || 2 * Math.PI; if (g > bg) { bg = g; best = j; } } angles = fresh.map((_, j) => as[best] + bg * (j + 1) / (fresh.length + 1)); }
      // ring substituent that starts a new ring system
      fresh.forEach((v, j) => { if (P[v]) return; const t = angles[j]; P[v] = [P[u][0] + L * Math.cos(t), P[u][1] + L * Math.sin(t)]; if (!turn[v]) turn[v] = j % 2 ? 1 : -1; const vr = RR.findIndex((r, ri) => !placedRings.has(ri) && r.includes(v)); if (vr >= 0 && !RR[vr].some(a => P[a] && a !== v)) { // place this new ring attached at v, pointing away from u
          const r = RR[vr], k = r.length, Rr = L / (2 * Math.sin(Math.PI / k)); const C = [P[v][0] + Rr * Math.cos(t), P[v][1] + Rr * Math.sin(t)]; const i0 = r.indexOf(v); const a0 = Math.atan2(P[v][1] - C[1], P[v][0] - C[0]); r.forEach((a, jj) => { if (a === v) return; const tt = a0 + 2 * Math.PI * ((jj - i0 + k) % k) / k; P[a] = [C[0] + Rr * Math.cos(tt), C[1] + Rr * Math.sin(tt)]; if (!seen.has(a)) { seen.add(a); queue.push(a); } }); placedRings.add(vr); tryFused(); P.forEach((p, ii) => { if (p && !seen.has(ii)) { seen.add(ii); queue.push(ii); } }); }
        if (!seen.has(v)) { seen.add(v); queue.push(v); } }); }
    // cis/trans from / and \ on double bonds: flip a substituent if needed
    M.bonds.filter(b => b.o === 2 && !inRing.has(b.a)).forEach(db => { const end = (x, y) => { const sub = M.bonds.find(b => b !== db && (b.a === x || b.b === x) && b.dir); if (!sub) return null; const other = sub.a === x ? sub.b : sub.a; // "up" means other is above x when written x/other? use SMILES semantics
        const up = (sub.a === x) === (sub.dir === '/'); return { other, up }; }; const e1 = end(db.a, db.b), e2 = end(db.b, db.a); if (!e1 || !e2) return; // trans if same symbol on both sides after normalising direction
      const wantCis = e1.up !== e2.up ? false : true; const side = (o, x, y) => { const ax = P[y][0] - P[x][0], ay = P[y][1] - P[x][1]; return Math.sign(ax * (P[o][1] - P[x][1]) - ay * (P[o][0] - P[x][0])); };
      const s1 = side(e1.other, db.a, db.b), s2 = side(e2.other, db.a, db.b); const isCis = s1 === s2; if (isCis !== wantCis) { // reflect the b-side branch across the double-bond axis
        const ax = P[db.b][0] - P[db.a][0], ay = P[db.b][1] - P[db.a][1], al = Math.hypot(ax, ay); const ux = ax / al, uy = ay / al; const branch = new Set([db.b]); const st = [db.b]; while (st.length) { const u = st.pop(); for (const v of M.atoms[u].nb) if (!branch.has(v) && v !== db.a) { branch.add(v); st.push(v); } } branch.delete(db.b); branch.forEach(v => { const px = P[v][0] - P[db.a][0], py = P[v][1] - P[db.a][1]; const d = px * ux + py * uy; P[v] = [P[db.a][0] + 2 * d * ux - px, P[db.a][1] + 2 * d * uy - py]; }); } });
    M.atoms.forEach((a, i) => { a.x = P[i] ? P[i][0] : 0; a.y = P[i] ? P[i][1] : 0; });
    M.rings = RR; return M;
  }
  // wedge/hash assignment from @ / @@
  const det3 = (a, b, c) => a[0] * (b[1] * c[2] - b[2] * c[1]) - a[1] * (b[0] * c[2] - b[2] * c[0]) + a[2] * (b[0] * c[1] - b[1] * c[0]);
  const CAL = (() => { const a = [0, 0, 1], b = [1, 0, -.3], c = [Math.cos(2.094), Math.sin(2.094), -.3], d = [Math.cos(4.189), Math.sin(4.189), -.3]; const sub = (p, q) => [p[0] - q[0], p[1] - q[1], p[2] - q[2]]; return Math.sign(det3(sub(b, a), sub(c, a), sub(d, a))); })();
  function stereo(M) { M.atoms.forEach((a, i) => { if (!a.chir) return; // neighbour order per SMILES: from-atom, implicit H, then others in written order (ring-closure digits in place)
      let order = []; if (a.from != null) order.push(a.from); if (a.hx) order.push('H'); a.nbOrder.forEach(x => { if (typeof x === 'string') { const cb = M.bonds.find(b => b.closure && (b.a === i || b.b === i) && !order.includes(b.a === i ? b.b : b.a) && x); if (cb) { const o = cb.a === i ? cb.b : cb.a; if (!order.includes(o)) order.push(o); } } else if (x !== a.from && !order.includes(x)) order.push(x); });
      if (a.from == null && a.hx) { order = ['H', ...order.filter(x => x !== 'H')]; }
      const drawn = order.filter(x => x !== 'H'); if (drawn.length < 3) return; // pick a bond to wedge: prefer a non-ring, single-bonded terminal-ish neighbour
      const cands = drawn.filter(v => { const b = M.bonds.find(bb => (bb.a === i && bb.b === v) || (bb.b === i && bb.a === v)); return b.o === 1 && !(M.rings || []).some(r => r.includes(i) && r.includes(v)); }); const pick = (cands.length ? cands : drawn).sort((x, y) => M.atoms[x].nb.length - M.atoms[y].nb.length)[0];
      const vec = (v, z) => { const dx = M.atoms[v].x - a.x, dy = -(M.atoms[v].y - a.y), l = Math.hypot(dx, dy) || 1; return [dx / l, dy / l, z]; };
      const vs = {}; drawn.forEach(v => vs[v] = vec(v, v === pick ? .9 : 0)); if (order.includes('H')) { const s = drawn.reduce((acc, v) => [acc[0] + vs[v][0], acc[1] + vs[v][1], acc[2] + vs[v][2]], [0, 0, 0]); const l = Math.hypot(...s) || 1; vs.H = [-s[0] / l, -s[1] / l, -s[2] / l - .3]; }
      const o = order.map(x => vs[x]); const sub = (p, q) => [p[0] - q[0], p[1] - q[1], p[2] - q[2]]; const sg = Math.sign(det3(sub(o[1], o[0]), sub(o[2], o[0]), sub(o[3], o[0]))); const want = a.chir === '@' ? CAL : -CAL; const b = M.bonds.find(bb => (bb.a === i && bb.b === pick) || (bb.b === i && bb.a === pick)); if (b.a !== i) { b.a = i; b.b = pick; } b.stereo = sg === want ? 'wedge' : 'hash'; }); return M; }
  function build(smi) { const M = parse(smi); kekulize(M); layout(M); stereo(M); return M; }
  const hOf = (M, i) => { const a = M.atoms[i]; if (a.bracket) return a.hx; let used = 0; M.bonds.forEach(b => { if (b.a === i || b.b === i) used += b.o; }); const v = VALS[a.el] || 0; let h = v - used + (a.el === 'N' || a.el === 'O' ? a.q : -Math.abs(a.q)); if (a.el === 'S' && used > 2) h = 0; return Math.max(0, h); };
  const sub = n => n > 1 ? `<tspan dy="5" font-size="72%">${n}</tspan><tspan dy="-5"></tspan>` : '';
  const qs = q => q ? `<tspan dy="-9" font-size="68%">${Math.abs(q) > 1 ? Math.abs(q) : ''}${q > 0 ? '+' : '−'}</tspan>` : '';
  function svg(smi, o = {}) { let M; try { M = build(smi); } catch (e) { return `<span class="smierr">${smi}</span>`; } const A = M.atoms; if (o.flip) A.forEach(a => a.x = -a.x); if (o.rot) { const t = o.rot * Math.PI / 180; A.forEach(a => { const x = a.x, y = a.y; a.x = x * Math.cos(t) - y * Math.sin(t); a.y = x * Math.sin(t) + y * Math.cos(t); }); }
    const show = i => { const a = A[i]; return a.el !== 'C' || a.q || o.allC || A.length === 1 || (o.showC && o.showC.includes(i)); }; const lab = i => { const a = A[i]; const h = hOf(M, i); let t = a.el; if (h) { const left = (a.nb.length === 1 && A[a.nb[0]].x > a.x) || (A.length === 1 && /^(F|Cl|Br|I|O|S)$/.test(a.el)); t = left ? `H${sub(h)}${a.el}` : `${a.el}H${sub(h)}`; } return t + qs(a.q); };
    const out = [], trim = (i, x, y, ox, oy) => { if (!show(i)) return [x, y]; const dx = ox - x, dy = oy - y, l = Math.hypot(dx, dy); return [x + dx / l * 14, y + dy / l * 14]; };
    const cx = A.reduce((s, a) => s + a.x, 0) / A.length, cy = A.reduce((s, a) => s + a.y, 0) / A.length;
    M.bonds.forEach((b, bi) => { const P = A[b.a], Q = A[b.b]; let [x1, y1] = trim(b.a, P.x, P.y, Q.x, Q.y), [x2, y2] = trim(b.b, Q.x, Q.y, P.x, P.y); const hl = o.hlBonds && o.hlBonds.includes(bi) ? ' hlb' : '';
      if (b.stereo === 'wedge') { const dx = x2 - x1, dy = y2 - y1, l = Math.hypot(dx, dy), nx = -dy / l * 6, ny = dx / l * 6; out.push(`<polygon class="wedge" points="${x1},${y1} ${x2 + nx},${y2 + ny} ${x2 - nx},${y2 - ny}"/>`); return; }
      if (b.stereo === 'hash') { for (let k = 1; k <= 7; k++) { const f = k / 7.5, w = 6.5 * f, px = x1 + (x2 - x1) * f, py = y1 + (y2 - y1) * f, l = Math.hypot(x2 - x1, y2 - y1), nx = -(y2 - y1) / l * w, ny = (x2 - x1) / l * w; out.push(`<line class="hash" x1="${(px + nx).toFixed(1)}" y1="${(py + ny).toFixed(1)}" x2="${(px - nx).toFixed(1)}" y2="${(py - ny).toFixed(1)}"/>`); } return; }
      out.push(`<line class="${hl}" x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`);
      if (b.o >= 2) { const dx = x2 - x1, dy = y2 - y1, l = Math.hypot(dx, dy); let nx = -dy / l, ny = dx / l; const inRingB = (M.rings || []).find(r => r.includes(b.a) && r.includes(b.b)); let tx, ty; if (inRingB) { tx = inRingB.reduce((s, a) => s + A[a].x, 0) / inRingB.length; ty = inRingB.reduce((s, a) => s + A[a].y, 0) / inRingB.length; } else { const nbs = [...A[b.a].nb, ...A[b.b].nb].filter(v => v !== b.a && v !== b.b); tx = nbs.length ? nbs.reduce((s, v) => s + A[v].x, 0) / nbs.length : cx; ty = nbs.length ? nbs.reduce((s, v) => s + A[v].y, 0) / nbs.length : cy; } const mx = (x1 + x2) / 2, my = (y1 + y2) / 2; if ((mx + nx - tx) ** 2 + (my + ny - ty) ** 2 > (mx - nx - tx) ** 2 + (my - ny - ty) ** 2) { nx = -nx; ny = -ny; }
        const centered = !inRingB && (b.o === 3 || (!show(b.a) && !show(b.b) && false)); const off = 7, sh = inRingB ? 7 : (show(b.a) || show(b.b) ? 0 : 3), ux = dx / l, uy = dy / l; const lines = b.o === 3 ? [off, -off] : centered ? [] : [off];
        lines.forEach(of => out.push(`<line class="${hl}" x1="${(x1 + nx * of + ux * sh).toFixed(1)}" y1="${(y1 + ny * of + uy * sh).toFixed(1)}" x2="${(x2 + nx * of - ux * sh).toFixed(1)}" y2="${(y2 + ny * of - uy * sh).toFixed(1)}"/>`)); } });
    A.forEach((a, i) => { if (o.hlAtoms && o.hlAtoms.includes(i)) out.unshift(`<circle class="hl" cx="${a.x}" cy="${a.y}" r="16"/>`); if (show(i)) out.push(`<text x="${a.x.toFixed(1)}" y="${a.y.toFixed(1)}" class="lab el-${a.el}">${lab(i)}</text>`); if (o.dots && o.dots[i]) out.push(o.dots[i](a)); });
    const xs = A.map(a => a.x), ys = A.map(a => a.y), pad = 26; const minx = Math.min(...xs) - pad - 12, miny = Math.min(...ys) - pad, w = Math.max(...xs) - minx + pad + 12, h = Math.max(...ys) - miny + pad; const sc = o.scale || 1;
    return `<svg class="mol smi" viewBox="${minx.toFixed(0)} ${miny.toFixed(0)} ${w.toFixed(0)} ${h.toFixed(0)}" width="${(w * .62 * sc).toFixed(0)}" role="img" aria-label="${o.aria || 'structure'}">${out.join('')}</svg>`; }
  function rxn(left, cond, right, o = {}) { const side = arr => arr.map((x, i) => (i ? '<span class="rxplus">+</span>' : '') + (x === '?' ? '<span class="rxq">?</span>' : x.startsWith('<') ? x : `<span class="rxm">${svg(x, { scale: o.scale })}</span>`)).join(''); return `<div class="rxn">${side(left)}<span class="rxarrow"><span class="rxc">${cond === '?' ? '<b class="rxq sm">?</b>' : cond || ''}</span><svg viewBox="0 0 120 16" width="120"><line x1="2" y1="8" x2="110" y2="8"/><polygon points="118,8 106,2 106,14"/></svg><span class="rxc2">${o.below || ''}</span></span>${side(right)}</div>`; }
  return { parse, build, svg, rxn };
})();
const smiSvg = SMI.svg, RXN2 = SMI.rxn;
