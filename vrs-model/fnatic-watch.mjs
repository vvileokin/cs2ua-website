import fs from "node:fs";
import path from "node:path";

/**
 * Що має статись, щоб fnatic утримали вісімнадцяте місце.
 *
 * Вони дограли і стоять на 1487. Обійти їх можуть лише ті, хто ще грає, —
 * тож питання зводиться до стелі кожного переслідувача: скільки очок йому
 * фізично може дати його турнір. Рахується за формулою, з витісненням у всіх
 * чотирьох компонентах і компенсацією H2H.
 *
 * Запуск: node fnatic-watch.mjs
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

/** Один шлях: скільки перемог, над ким, за які гроші, на події якої ваги. */
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

const TARGET = 1487;   // fnatic
const MCG = { pool: 190_000, oppB: 0.30, oppN: 0.45 };
const FS  = { pool: 75_000,  oppB: 0.20, oppN: 0.42 };
const RT  = { pool: 13_642,  oppB: 0.08, oppN: 0.30 };

const CASES = {
  "HOTU": [
    ["виграти Moscow Cyber Games",       [{ ...MCG, wins: 2, money: 100_000 }]],
    ["програти фінал Москви",            [{ ...MCG, wins: 1, money: 50_000 }]],
    ["третє місце в Москві",             [{ ...MCG, wins: 1, money: 31_000 }]],
    ["четверте місце в Москві",          [{ ...MCG, wins: 0, money: 0 }]],
  ],
  "100 Thieves": [
    ["виграти FiRe Last Chance",         [{ ...FS, wins: 4, money: 40_000 }]],
    ["програти фінал FiRe",              [{ ...FS, wins: 3, money: 15_000 }]],
    ["півфінал FiRe",                    [{ ...FS, wins: 2, money: 8_000 }]],
    ["чвертьфінал FiRe",                 [{ ...FS, wins: 1, money: 5_000 }]],
  ],
  "JiJieHao": [
    ["виграти HyperX Retake",            [{ ...RT, wins: 4, money: 7_800 }]],
    ["програти фінал HyperX",            [{ ...RT, wins: 3, money: 3_500 }]],
  ],
  "1win": [
    ["виграти Moscow Cyber Games",       [{ ...MCG, wins: 2, money: 100_000 }]],
    ["програти фінал Москви",            [{ ...MCG, wins: 1, money: 50_000 }]],
    ["четверте місце в Москві",          [{ ...MCG, wins: 0, money: 0 }]],
  ],
};

console.log(`fnatic стоять на ${TARGET} і більше не грають.`);
console.log("Обійти їх може лише той, хто ще на турнірі:\n");
for (const [team, list] of Object.entries(CASES)) {
  const now = DET[team].pts;
  const gap = TARGET - now + 1;
  console.log(`${team}  ${now}   щоб обійти, треба +${gap}`);
  for (const [label, legs] of list) {
    const d = run(team, legs), end = Math.round(now + d);
    console.log(`    ${label.padEnd(32)}${("+" + Math.round(d)).padStart(5)}  →  ${end}` +
      `${end > TARGET ? "   обходить" : ""}`);
  }
  console.log();
}
