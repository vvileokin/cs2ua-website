import fs from "node:fs";
import path from "node:path";

/**
 * Куди ще можна було зареєструватись — і скільки це коштувало очок.
 *
 * Календар жовтня в Європі щільний, але не кожен турнір заважає кожному.
 * Тут беруться лише ті, що не перетинаються датами з тим, що команда
 * реально грала, і для кожного рахується приріст за формулою: ЛАН-перемоги
 * з витісненням, призові й дві «десятки» за суперників, мінус компенсація H2H.
 *
 * Запуск: node gap.mjs
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

function worth(team, wins, money, oppB, oppN, ev) {
  const d = DET[team];
  if (!d) return null;
  const wt = weight(ev);
  let lanRows = d.lan.slice(), lan = 0;
  for (let i = 0; i < wins; i++) {
    const out = lanRows.length >= SLOT_CAP ? lanRows.shift() : 0;
    lan += LAN_BASE - out;
    lanRows.push(LAN_BASE); lanRows.sort((a, b) => a - b);
  }
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
  return { lan, dC, dN, dO, net: base * (1 - DAMP) };
}

/* Турніри, що лягали у вільні дати. Сила суперників — за реальним полем. */
const EVENTS = [
  { n: "Stake Pulse Beat 3",  d: "12-17.10", pool: 80_000,  slots: 16, oppB: 0.22, oppN: 0.55,
    field: "fnatic, HOTU, 100 Thieves, Zero Tenacity, Sashi" },
  { n: "Private Club 2",      d: "19-22.10", pool: 100_000, slots: 8,  oppB: 0.45, oppN: 0.62,
    field: "PARIVISION, The MongolZ, Liquid, BIG, fnatic, Alliance" },
  { n: "CIS LAN 9",           d: "20-23.10", pool: 50_000,  slots: 16, oppB: 0.16, oppN: 0.48,
    field: "Nemiga, Amkal, Insilio, Monte" },
  { n: "DraculaN 7",          d: "19-23.10", pool: 35_000,  slots: 24, oppB: 0.12, oppN: 0.42,
    field: "Zero Tenacity, Sangal, Betera, Iberian Soul" },
  { n: "Roman Imperium IX",   d: "07-10.10", pool: 14_040,  slots: 16, oppB: 0.08, oppN: 0.35,
    field: "Betera, Rhyno, Spirit Academy" },
  { n: "Elisa Breakout 2",    d: "15-17.10", pool: 16_899,  slots: 8,  oppB: 0.14, oppN: 0.44,
    field: "ENCE, Sashi, HAVU, Permitta" },
];

/* Хто що грав — для перевірки, що дати не перетинаються. */
const PLAYED = {
  "B8":           [["01.10", "04.10", "Stake Ranked Ep 4"], ["27.10", "29.10", "RLG Tesla Cup"]],
  "Inner Circle": [["12.10", "17.10", "Stake Pulse Beat 3"], ["27.10", "30.10", "Stake Ranked Ep 5"]],
  "fnatic":       [["01.10", "04.10", "Stake Ranked Ep 4"], ["12.10", "17.10", "Stake Pulse Beat 3"],
                   ["19.10", "22.10", "Private Club 2"], ["27.10", "30.10", "Stake Ranked Ep 5"]],
};
const day = (s) => { const [d, m] = s.split("."); return +m * 100 + +d; };
const clash = (team, ev) => {
  const [a, b] = ev.d.split("-");
  const s = day(a + ".10"), e = day(b);
  return PLAYED[team].find(([x, y]) => day(x) <= e && s <= day(y));
};

const CUT = 1505;
for (const team of ["B8", "Inner Circle", "fnatic"]) {
  const now = DET[team].pts;
  console.log(`\n${team}  ${now} очок   до межі (${CUT}) треба +${CUT - now}`);
  console.log("  турнір                дати       призовий  вільно?   виграти  фінал  півфінал");
  for (const ev of EVENTS) {
    const c = clash(team, ev);
    const free = c ? `грали ${c[2]}` : "вільно";
    const nWin = ev.slots >= 16 ? 4 : ev.slots >= 8 ? 3 : 2;
    const mk = (wins, share) => {
      const r = worth(team, wins, Math.round(ev.pool * share), ev.oppB, ev.oppN, ev.pool);
      return r ? Math.round(r.net) : 0;
    };
    const w = mk(nWin, 0.35), f = mk(nWin - 1, 0.2), s = mk(Math.max(nWin - 2, 1), 0.1);
    const mark = (v) => { const t = now + v; return `+${v}${t >= CUT ? " ✓" : "  "}`; };
    console.log(`    ${ev.n.padEnd(20)}${ev.d.padEnd(11)}` +
      `$${String(ev.pool.toLocaleString("en-US")).padEnd(9)}${free.padEnd(10)}` +
      `${mark(w).padStart(8)}${mark(f).padStart(8)}${mark(s).padStart(8)}`);
  }
}
