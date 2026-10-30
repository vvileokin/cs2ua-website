import fs from "node:fs";
import path from "node:path";

/**
 * Скільки коштує виграти турнір — по кожному компоненту, за формулою.
 *
 * Питання, яке звучить просто, а відповідь має нерівну: мільйонний ЛАН і ЛАН
 * за п'ятдесят тисяч відрізняються в двадцять п'ять разів грошима, але не
 * очками. Степінь 0,23 на призових стискає різницю, межа в десять рядків
 * стискає перемоги, а H2H забирає назад більшу частину того, що лишилось.
 *
 * Запуск: node worth.mjs
 */
const K = { O: 19.4, C: 244, N: 100 };
const POW = 0.23, SLOT_CAP = 10, DAMP = 0.56;
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

/** Додати рядок у компонент «десять найкращих» із витісненням. */
const push = (b, k, v) => {
  const raw = b.raw.slice();
  if (raw.length >= SLOT_CAP) {
    const worst = Math.min(...raw);
    if (v <= worst) return 0;
    raw.splice(raw.indexOf(worst), 1);
  }
  raw.push(v);
  return compOf(raw.reduce((a, c) => a + c, 0), k) - b.comp;
};

/** Приріст за шлях: wins перемог над суперниками сили oppB, плюс призові. */
function worth(team, wins, money, oppB, oppN, ev) {
  const d = DET[team];
  if (!d) return null;
  const wt = weight(ev);
  let lanRows = d.lan.slice(), lan = 0;
  for (let i = 0; i < wins; i++) {
    const out = lanRows.length >= SLOT_CAP ? lanRows.shift() : 0;
    lan += 48 - out;
    lanRows.push(48); lanRows.sort((a, b) => a - b);
  }
  /* Компоненти «десять найкращих» наповнюються по черзі, а не одним махом. */
  const fill = (b, k, v, n) => {
    let acc = 0, cur = { raw: b.raw.slice(), comp: b.comp };
    for (let i = 0; i < n; i++) {
      const dd = push(cur, k, v);
      acc += dd; cur.comp += dd;
      if (cur.raw.length >= SLOT_CAP) {
        const w = Math.min(...cur.raw);
        if (v > w) { cur.raw.splice(cur.raw.indexOf(w), 1); cur.raw.push(v); }
      } else cur.raw.push(v);
    }
    return acc;
  };
  const dC = fill(d.C, K.C, oppB * wt, wins);
  const dN = fill(d.N, K.N, oppN * wt, wins);
  const dO = money ? push(d.O, K.O, money) : 0;
  const base = lan + dC + dN + dO;
  return { lan, dC, dN, dO, base, net: base * (1 - DAMP) };
}

const CASES = [
  ["Natus Vincere", 3, 450_000, 0.85, 0.45, 1_250_000, "виграти PGL Masters Bucharest"],
  ["Natus Vincere", 1, 137_500, 0.85, 0.45, 1_250_000, "дійти до півфіналу Бухареста"],
  ["B8", 2, 30_000, 0.18, 0.60, 50_000, "виграти RLG Tesla Cup"],
  ["fnatic", 2, 25_000, 0.20, 0.55, 100_000, "виграти Stake Ranked Episode 5"],
  ["Eternal Fire", 4, 25_000, 0.20, 0.55, 100_000, "виграти Stake Ranked із нижньої сітки"],
  ["Chinggis Warriors", 2, 1_800, 0.08, 0.30, 3_000, "виграти MESA Pro Series"],
  ["5star", 2, 1_800, 0.08, 0.30, 3_000, "виграти MESA Pro Series"],
  ["HOTU", 2, 100_000, 0.05, 0.40, 190_000, "виграти Moscow Cyber Games"],
  ["Imperial", 3, 12_000, 0.10, 0.35, 30_000, "виграти Gamers Club Masters"],
  ["FURIA", 3, 450_000, 0.85, 0.45, 1_250_000, "виграти PGL Masters Bucharest"],
];

console.log("що дасть перемога — по компонентах, із компенсацією H2H\n");
console.log("команда            турнір                              ЛАН  гроші  скальпи  мережа   разом   стане");
for (const [t, w, m, b, n, ev, label] of CASES) {
  const r = worth(t, w, m, b, n, ev);
  if (!r) { console.log(`  ${t}: немає розкладу`); continue; }
  console.log(`  ${t.padEnd(18)}${label.padEnd(36)}` +
    `${("+" + r.lan.toFixed(0)).padStart(5)}${("+" + r.dO.toFixed(0)).padStart(7)}` +
    `${("+" + r.dC.toFixed(0)).padStart(9)}${("+" + r.dN.toFixed(0)).padStart(8)}` +
    `${("+" + r.net.toFixed(0)).padStart(8)}${String(Math.round(DET[t].pts + r.net)).padStart(8)}`);
}

console.log("\nскільки доларів призових коштує одне очко VRS:");
for (const [t, w, m, b, n, ev, label] of CASES) {
  const r = worth(t, w, m, b, n, ev);
  if (!r || !m) continue;
  console.log(`  ${t.padEnd(18)}${label.padEnd(36)}$${m.toLocaleString("uk-UA").replace(/ /g, " ")}` +
    ` за ${r.net.toFixed(0)} очок  →  $${Math.round(m / r.net).toLocaleString("uk-UA").replace(/ /g, " ")} за очко`);
}
