import fs from "node:fs";
import path from "node:path";

/**
 * Те саме, але для двох турнірів підряд.
 *
 * Два турніри не дають подвійного приросту: перемоги йдуть в один список на
 * десять рядків, і другий турнір витісняє вже не слабкий старий рядок, а
 * свіжий рядок першого. Тому вважати треба послідовно, одним списком.
 *
 * Запуск: node gap2.mjs
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

/** Один прохід по шляху з кількох турнірів; стан списків переноситься. */
function path2(team, legs) {
  const d = DET[team];
  const lanRows = d.lan.slice();
  const bk = { C: { raw: d.C.raw.slice(), comp: d.C.comp },
               N: { raw: d.N.raw.slice(), comp: d.N.comp },
               O: { raw: d.O.raw.slice(), comp: d.O.comp } };
  let lan = 0, dC = 0, dN = 0, dO = 0;

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
      const out = lanRows.length >= SLOT_CAP ? lanRows.shift() : 0;
      lan += LAN_BASE - out;
      lanRows.push(LAN_BASE); lanRows.sort((a, b) => a - b);
      dC += add(bk.C, K.C, oppB * wt);
      dN += add(bk.N, K.N, oppN * wt);
    }
    if (money) dO += add(bk.O, K.O, money);
  }
  return { lan, dC, dN, dO, net: (lan + dC + dN + dO) * (1 - DAMP) };
}

const EV = {
  pulse:   { pool: 80_000,  oppB: 0.22, oppN: 0.55 },
  private: { pool: 100_000, oppB: 0.45, oppN: 0.62 },
  cis:     { pool: 50_000,  oppB: 0.16, oppN: 0.48 },
  drac:    { pool: 35_000,  oppB: 0.12, oppN: 0.42 },
  roman:   { pool: 14_040,  oppB: 0.08, oppN: 0.35 },
};
const leg = (key, wins, share) =>
  ({ ...EV[key], wins, money: Math.round(EV[key].pool * share) });

const CUT = 1505;
const PATHS = {
  "B8": [
    ["Private Club 2 — виграти",                       [leg("private", 3, 0.35)]],
    ["Pulse Beat 3 — виграти",                         [leg("pulse", 4, 0.35)]],
    ["Pulse Beat 3 фінал + Private Club 2 фінал",      [leg("pulse", 3, 0.2), leg("private", 2, 0.2)]],
    ["Pulse Beat 3 півфінал + Private Club 2 півфінал",[leg("pulse", 2, 0.1), leg("private", 1, 0.1)]],
    ["Roman Imperium + CIS LAN — обидва виграти",      [leg("roman", 4, 0.35), leg("cis", 4, 0.35)]],
    ["Roman Imperium + DraculaN — обидва фінали",      [leg("roman", 3, 0.2), leg("drac", 3, 0.2)]],
    ["три дрібні: Roman + Pulse + CIS, усюди півфінал",[leg("roman", 2, 0.1), leg("pulse", 2, 0.1), leg("cis", 2, 0.1)]],
  ],
  "Inner Circle": [
    ["Private Club 2 — виграти",                       [leg("private", 3, 0.35)]],
    ["Private Club 2 + CIS LAN — обидва виграти",      [leg("private", 3, 0.35), leg("cis", 4, 0.35)]],
    ["Roman + Private Club 2 — обидва виграти",        [leg("roman", 4, 0.35), leg("private", 3, 0.35)]],
    ["Roman + CIS + DraculaN — усі три виграти",       [leg("roman", 4, 0.35), leg("cis", 4, 0.35), leg("drac", 5, 0.35)]],
    ["Roman + Private + CIS — усюди фінал",            [leg("roman", 3, 0.2), leg("private", 2, 0.2), leg("cis", 3, 0.2)]],
  ],
  "fnatic": [
    ["Roman Imperium — виграти (єдині вільні дати)",   [leg("roman", 4, 0.35)]],
  ],
};

for (const [team, list] of Object.entries(PATHS)) {
  const now = DET[team].pts;
  console.log(`\n${team}  ${now}   треба +${CUT - now} до межі ${CUT}`);
  for (const [label, legs] of list) {
    const r = path2(team, legs);
    const t = Math.round(now + r.net);
    console.log(`    ${label.padEnd(44)}${("+" + Math.round(r.net)).padStart(5)}  →  ${t}` +
      `${t >= CUT ? "  ✓ проходить" : ""}`);
  }
}

/* Обмін, який B8 зробили 3 жовтня: віддали слот на Stake Ranked ($100k)
   і поїхали на Tesla Cup ($50k). Дати перетинаються, тож це або-або. */
console.log("\nобмін 3 жовтня — Stake Ranked Ep 5 проти Tesla Cup (дати збігаються)");
const SR = { pool: 100_000, oppB: 0.42, oppN: 0.60 };
const TC = { pool: 50_000,  oppB: 0.18, oppN: 0.50 };
for (const [label, e, wins, share] of [
  ["Tesla Cup — виграли (що сталось)",  TC, 2, 0.6],
  ["Stake Ranked — виграти",            SR, 3, 0.25],
  ["Stake Ranked — фінал",              SR, 2, 0.17],
  ["Stake Ranked — півфінал (3-4)",     SR, 1, 0.1],
]) {
  const r = path2("B8", [{ ...e, wins, money: Math.round(e.pool * share) }]);
  console.log(`    ${label.padEnd(36)}${("+" + Math.round(r.net)).padStart(5)}` +
    `  →  ${Math.round(DET["B8"].pts - 47 + r.net)}`);
}
