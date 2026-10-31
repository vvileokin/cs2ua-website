import fs from "node:fs";
import path from "node:path";

/**
 * Стеля кожного, хто ще грає, в останній день.
 *
 * Питання два: чи гарантували Eternal Fire мейджор і що лишилось у fnatic.
 * Обидва зводяться до одного — скільки очок фізично може набрати той, хто
 * ще на турнірі. Рахується за формулою з витісненням у всіх компонентах і
 * компенсацією H2H; шум сюди не домішується, це саме стеля.
 *
 * Запуск: node ceiling-0111.mjs
 */
const K = { O: 19.4, C: 244, N: 100 };
const POW = 0.23, SLOT_CAP = 10, DAMP = 0.56, LAN_BASE = 47;
const weight = (p) => Math.pow(p / 1_000_000, 0.3);
const compOf = (r, k) => k * Math.pow(Math.max(r, 0), POW);
const rawOf = (c, k) => Math.pow(Math.max(c, 1) / k, 1 / POW);

const DET = {};
for (const f of fs.readdirSync("vrs-details")) {
  const j = JSON.parse(fs.readFileSync(path.join("vrs-details", f), "utf8"));
  const rows = (kk) => (j[kk] ?? []).map((s) => Number(s.split("|")[1]));
  const mk = (kk, i, k) => {
    const shown = rows(kk), comp = j.c[i], sum = rawOf(comp, k), scale = comp / sum;
    return { comp, raw: shown.map((v) => v / scale) };
  };
  DET[j.n] = { pts: j.p, lan: rows("L").slice().sort((a, b) => a - b),
               O: mk("O", 2, K.O), C: mk("C", 3, K.C), N: mk("N", 1, K.N) };
}

function run(team, legs) {
  const d = DET[team];
  const lan = d.lan.slice();
  const bk = { C: { raw: d.C.raw.slice(), comp: d.C.comp },
               N: { raw: d.N.raw.slice(), comp: d.N.comp },
               O: { raw: d.O.raw.slice(), comp: d.O.comp } };
  let acc = 0;
  const add = (b, k, v) => {
    if (b.raw.length >= SLOT_CAP) {
      const worst = Math.min(...b.raw);
      if (v <= worst) return 0;
      b.raw.splice(b.raw.indexOf(worst), 1);
    }
    b.raw.push(v);
    const was = b.comp;
    b.comp = compOf(b.raw.reduce((a, c) => a + c, 0), k);
    return b.comp - was;
  };
  for (const { wins, money, oppB, oppN, pool } of legs) {
    const wt = weight(pool);
    for (let i = 0; i < wins; i++) {
      const out = lan.length >= SLOT_CAP ? lan.shift() : 0;
      acc += LAN_BASE - out;
      lan.push(LAN_BASE); lan.sort((a, b) => a - b);
      acc += add(bk.C, K.C, oppB * wt) + add(bk.N, K.N, oppN * wt);
    }
    if (money) acc += add(bk.O, K.O, money);
  }
  return acc * (1 - DAMP);
}

const MCG = { pool: 190_000, oppB: 0.42, oppN: 0.55 };   // 1win — сильний суперник
const FS  = { pool: 75_000,  oppB: 0.20, oppN: 0.42 };
const RT  = { pool: 13_642,  oppB: 0.08, oppN: 0.30 };

const EF = DET["Eternal Fire"].pts, FN = DET["fnatic"].pts;
console.log(`Eternal Fire ${EF} (17-ті) · fnatic ${FN} (19-ті) — обидва дограли.\n`);

const CASES = {
  "HOTU": [
    ["виграти фінал Москви",      [{ ...MCG, wins: 1, money: 100_000 }]],
    ["програти фінал Москви",     [{ ...MCG, wins: 0, money: 50_000 }]],
  ],
  "100 Thieves": [
    ["виграти FiRe (3 перемоги)", [{ ...FS, wins: 3, money: 40_000 }]],
    ["фінал FiRe (2 перемоги)",   [{ ...FS, wins: 2, money: 15_000 }]],
    ["півфінал (1 перемога)",     [{ ...FS, wins: 1, money: 8_000 }]],
    ["виліт у чвертьфіналі",      [{ ...FS, wins: 0, money: 5_000 }]],
  ],
  "JiJieHao": [
    ["виграти HyperX",            [{ ...RT, wins: 2, money: 7_800 }]],
    ["програти фінал HyperX",     [{ ...RT, wins: 1, money: 3_500 }]],
  ],
};

for (const [team, list] of Object.entries(CASES)) {
  const now = DET[team].pts;
  console.log(`${team}  ${now}`);
  console.log(`    щоб обійти Eternal Fire (${EF}) треба +${EF - now + 1}` +
    `,  щоб обійти fnatic (${FN}) треба +${FN - now + 1}`);
  for (const [label, legs] of list) {
    const d = run(team, legs), end = Math.round(now + d);
    const marks = [end > EF ? "обходить EF" : null, end > FN ? "обходить fnatic" : null]
      .filter(Boolean).join(" · ");
    console.log(`    ${label.padEnd(28)}${("+" + Math.round(d)).padStart(5)}  →  ${end}` +
      (marks ? `   ${marks}` : ""));
  }
  console.log();
}

/* Консервативний варіант для HOTU: рядок за участь у Москві ($6 041, 19 очок)
   не додається поверх, а ПІДМІНЮЄТЬСЯ призовим за місце. Так приріст менший,
   і саме ця цифра — чесна нижня межа. */
function upgradeOnly(team, from, to) {
  const d = DET[team];
  const raw = d.O.raw.slice();
  const i = raw.reduce((best, v, k) => Math.abs(v - from) < Math.abs(raw[best] - from) ? k : best, 0);
  const was = d.O.comp;
  raw[i] = to;
  const now = compOf(raw.reduce((a, c) => a + c, 0), K.O);
  return (now - was) * (1 - DAMP);
}
const O = DET["HOTU"].O.raw;
const guess = O.reduce((b, v, k) => Math.abs(v - 6041) < Math.abs(O[b] - 6041) ? k : b, 0);
console.log(`HOTU: рядок за участь у Москві ≈ ${Math.round(O[guess])} у сирих одиницях\n`);
console.log("нижня межа HOTU, якщо призове підміняє рядок за участь:");
for (const [label, money, wins] of [["програти фінал", 50_000, 0], ["виграти фінал", 100_000, 1]]) {
  let d = upgradeOnly("HOTU", 6041, money);
  if (wins) d += run("HOTU", [{ ...MCG, wins, money: 0 }]);
  const end = Math.round(DET["HOTU"].pts + d);
  console.log(`  ${label.padEnd(18)}${("+" + Math.round(d)).padStart(5)}  →  ${end}` +
    `   ${end > FN ? "вище fnatic" : "НИЖЧЕ fnatic"}`);
}
