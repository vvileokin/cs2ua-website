import fs from "node:fs";
const K = { O: 18.9, C: 244, N: 100 }, POW = 0.23, DAMP = 0.59;
const comp = (raw, k) => k * Math.pow(Math.max(raw, 0), POW);
const rawOf = (c, k) => Math.pow(Math.max(c, 1) / k, 1 / POW);
const j = JSON.parse(fs.readFileSync("vrs-details/100t.json", "utf8"));
const rows = (kk) => (j[kk] || []).map((s) => Number(s.split("|")[1]));
const mk = (kk, i, k) => { const sh = rows(kk), c = j.c[i], sr = rawOf(c, k); return { c, raw: sh.map((v) => v * sr / sh.reduce((a, b) => a + b, 0)) }; };
const O = mk("O", 2, K.O), C = mk("C", 3, K.C), N = mk("N", 1, K.N);
const push = (b, k, v) => { const r = b.raw.slice(); if (r.length >= 10) { const w = Math.min(...r); if (v <= w) return 0; r.splice(r.indexOf(w), 1); } r.push(v); const nx = comp(r.reduce((a, c2) => a + c2, 0), k); const d = nx - b.c; b.raw = r; b.c = nx; return d; };

console.log("LAN рядки:", JSON.stringify(rows("L")), "— усі по 47, приріст за перемогу 0\n");
let base = 0;
const w = Math.pow(75000 / 1e6, 0.3);
const det = (n) => { try { return JSON.parse(fs.readFileSync("vrs-details/" + n + ".json", "utf8")); } catch { return null; } };
const bOf = (n) => { const d = det(n); return d ? Math.min(1, rawOf(d.c[2], K.O) / 600000) : 0; };
const nOf = (n) => { const d = det(n); return d ? Math.min(1, rawOf(d.c[1], K.N) / 3.2) : 0.3; };
for (const [lbl, f] of [["Isurus", null], ["BESTIA", "bestia"], ["NRG", "nrg"]]) {
  const dc = push(C, K.C, (f ? bOf(f) : 0) * w), dn = push(N, K.N, (f ? nOf(f) : 0.3) * w);
  base += dc + dn;
  console.log(`  ${lbl.padEnd(8)} скальпи +${dc.toFixed(1)}  мережа +${dn.toFixed(1)}`);
}
const dO = push(O, K.O, 40000 - 2500 + Math.min(...O.raw) * 0);
console.log(`  призові $40 000 (замість $2 500): Bounty offered +${dO.toFixed(1)}`);
base += dO;
const T = { Isurus: 790, BESTIA: 1301, NRG: 1335 };
let tr = 0, me = 1473;
for (const [n, r] of Object.entries(T)) { const t = 32.5 / (1 + Math.exp((me - r) / 190)); tr += t; console.log(`  передача H2H проти ${n}: +${t.toFixed(2)}`); }
console.log(`\nбаза разом +${base.toFixed(1)}  ×(1−${DAMP}) = +${(base * (1 - DAMP)).toFixed(1)}`);
console.log(`передачі разом +${tr.toFixed(1)}`);
console.log(`РАЗОМ +${(base * (1 - DAMP) + tr).toFixed(1)}  →  ${(1473 + base * (1 - DAMP) + tr).toFixed(1)}   (Eternal Fire 1508)`);
