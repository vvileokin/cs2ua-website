import fs from "node:fs";
import path from "node:path";
import {
  run, simulate, DET, P0, EU_TEAMS, K, POW, SLOT_CAP, weight, compOf, rawOf, bounty0, network0,
} from "./engine.mjs";

/**
 * Дані для сторінки /major/[team] — по кожній нашій команді.
 *
 * Сторінка нічого не рахує, як і решта мейджора: HLTV не віддає таблицю
 * звичайному запиту, тож усе робиться тут і заливається в базу. Відрізняється
 * від major_projection тим, що це не про місце в таблиці, а про те, ЧОМУ воно
 * таке: з яких рядків складаються очки, скільком із них лишилось жити, що дасть
 * кожне місце на кожному турнірі попереду і скільком відсоткам проходу вартий
 * кожен конкретний матч.
 *
 * Запуск: node team-detail.mjs [прогонів] > team-detail.json
 */

const RUNS = Number(process.argv[2] ?? 30000);
const SENS_RUNS = Math.max(6000, Math.round(RUNS / 4));
const OURS = ["FUT", "G2", "Astralis", "Natus Vincere", "Inner Circle", "fnatic", "B8", "Eternal Fire"];

/* ---- дати рядків: вони потрібні сторінці, а рушієві ні ---- */
const ROWS = {};
for (const f of fs.readdirSync("vrs-details")) {
  const j = JSON.parse(fs.readFileSync(path.join("vrs-details", f), "utf8"));
  const parse = (k) => (j[k] ?? []).map((s) => {
    const [d, v] = s.split("|");
    return { date: d, pts: Number(v) };
  });
  ROWS[j.n] = { L: parse("L"), O: parse("O"), C: parse("C"), N: parse("N"), comp: j.c, pts: j.p };
}

const rec = (d) => (d <= 30 ? 1 : Math.max(0, 1 - (d - 30) / 152));
const AS_OF = Date.UTC(2026, 9, 28);
const daysOf = (iso) => {
  const [dd, mm, yy] = iso.split("/").map(Number);
  return Math.round((AS_OF - Date.UTC(2000 + yy, mm - 1, dd)) / 86400000);
};

/**
 * Турніри, що лишились, із драбиною призових і тим, скільки серій треба
 * виграти за кожне місце. Склади — зі сторінок подій HLTV.
 */
const EVENTS = [
  {
    name: "Stake Ranked Episode 5", prize: 100_000, when: "27–30 жовтня",
    oppB: 0.2, oppN: 0.55,
    teams: ["BIG", "Inner Circle", "fnatic", "Astralis", "magic", "Nemesis", "Eternal Fire", "MIBR"],
    /* Шлях із верхньої сітки, де четверо вже стоять після першого туру. Для
       тих, хто в нижній, перемог до того самого місця треба більше — це
       враховано окремо полем `lower`. */
    ladder: [
      { place: "1-ше", wins: 3, lower: 6, money: 25_000 },
      { place: "2-ге", wins: 2, lower: 5, money: 17_500 },
      { place: "3-тє", wins: 2, lower: 4, money: 13_500 },
      { place: "4-те", wins: 1, lower: 3, money: 11_000 },
      { place: "5-6", wins: 1, lower: 2, money: 9_000 },
      { place: "7-8", wins: 0, lower: 0, money: 7_500 },
    ],
    lowerBracket: ["Astralis", "magic", "Nemesis", "Eternal Fire"],
  },
  {
    name: "RLG Tesla Cup 2026", prize: 50_000, when: "27–29 жовтня",
    oppB: 0.18, oppN: 0.6, teams: ["B8", "FaZe", "HOTU", "GamerLegion", "Luminosity", "Envy"],
    /* B8 вже у плей-оф (2-1 K27), тож для них лишились півфінал і фінал —
       на одну перемогу менше за кожне місце, ніж було з групи. */
    ladder: [
      { place: "1-ше", wins: 2, money: 30_000 },
      { place: "2-ге", wins: 1, money: 12_000 },
      { place: "3-4", wins: 0, money: 5_000 },
    ],
  },
  {
    name: "Circuito Retake Season 13", prize: 14_300, when: "29 жовтня – 1 листопада",
    oppB: 0.05, oppN: 0.3, teams: ["Natus Vincere", "JiJieHao", "TYLOO"],
    ladder: [
      { place: "1-ше", wins: 5, money: 7_800 },
      { place: "2-ге", wins: 4, money: 3_500 },
      { place: "3-тє", wins: 3, money: 2_100 },
      { place: "4-те", wins: 2, money: 700 },
      { place: "вилетіли рано", wins: 1, money: 0 },
    ],
  },
  {
    name: "PGL Masters Bucharest", prize: 1_250_000, when: "24–31 жовтня",
    oppB: 0.7, oppN: 0.45, teams: ["FUT", "Natus Vincere"],
    ladder: [
      { place: "1-ше", wins: 3, money: 225_000 },
      { place: "2-ге", wins: 2, money: 100_000 },
      { place: "3-4", wins: 1, money: 50_000 },
      { place: "5-8", wins: 0, money: 50_000 },
    ],
  },
];

/** Ціна шляху по компонентах, із межею в десять рядків у кожному. */
function pricePath(team, wins, money, oppB, oppN, ev) {
  const d = DET[team];
  if (!d) return null;
  const wt = weight(ev);
  /* LAN wins — лінійний, але десять найсвіжіших. */
  let lanRows = d.lan.slice().sort((a, b) => a - b), lan = 0;
  for (let i = 0; i < wins; i++) {
    const out = lanRows.length >= SLOT_CAP ? lanRows.shift() : 0;
    lan += 48 - out;
    lanRows.push(48); lanRows.sort((a, b) => a - b);
  }
  /** Доданок у компонент «десять найкращих» із витісненням. */
  const bucket = (b, k, adds) => {
    const raw = b.raw.slice();
    let comp = b.comp;
    for (const v of adds) {
      if (raw.length >= SLOT_CAP) {
        const worst = Math.min(...raw);
        if (v <= worst) continue;
        raw.splice(raw.indexOf(worst), 1);
      }
      raw.push(v);
    }
    return compOf(raw.reduce((a, c) => a + c, 0), k) - comp;
  };
  const dC = bucket(d.C, K.C, Array(wins).fill(oppB * wt));
  const dN = bucket(d.N, K.N, Array(wins).fill(oppN * wt));
  const dO = money ? bucket(d.O, K.O, [money]) : 0;
  return {
    wins, money,
    lan: Math.round(lan), collected: Math.round(dC), network: Math.round(dN), offered: Math.round(dO),
    total: Math.round(lan + dC + dN + dO),
  };
}

/** Заплановані матчі: пара, лінія, і скільком пунктам проходу вона варта. */
const SCHEDULED = [
  { a: "Spirit", b: "Natus Vincere", when: "28 жовтня, 19:00", event: "PGL Masters Bucharest" },
  { a: "BIG", b: "fnatic", when: "28 жовтня, 18:00", event: "Stake Ranked Episode 5" },
  { a: "Inner Circle", b: "MIBR", when: "28 жовтня, 20:30", event: "Stake Ranked Episode 5" },
  { a: "Nemesis", b: "Eternal Fire", when: "28 жовтня, 15:30", event: "Stake Ranked Episode 5" },
  { a: "HOTU", b: "GamerLegion", when: "28 жовтня, 16:00", event: "RLG Tesla Cup 2026" },
  { a: "Luminosity", b: "Envy", when: "28 жовтня, 19:00", event: "RLG Tesla Cup 2026" },
  { a: "1win", b: "5star", when: "31 жовтня, 17:00", event: "Moscow Cyber Games" },
];

/* ---- базовий прогін ---- */
process.stderr.write(`базовий прогін, ${RUNS}…\n`);
const base = run({}, RUNS);
const qualOf = (t) => base.qual.get(t) / base.n;
const placeOf = (t) => base.placeSum.get(t) / base.n;

/**
 * Розподіл підсумкових очок усієї Європи — щоб кожному місцю в драбині
 * приписати не лише приріст, а й відсоток проходу.
 *
 * Драбина сама по собі відповідає на пів питання: «друге місце — це 1523
 * очки». Друга половина — чи цього досить, а це залежить від того, як
 * складеться решта таблиці.
 *
 * Наближення одне, і воно назване: вважається, що власний результат команди
 * не змінює чужих. Для турніру, де вона грає проти інших претендентів, це
 * трохи оптимістично — перемога над BIG одночасно і піднімає нас, і тримає
 * їх унизу, а тут враховано лише перше.
 */
process.stderr.write(`розподіл очок Європи, ${RUNS}…\n`);
const ladders = [];
for (let i = 0; i < RUNS; i++) {
  const p = simulate();
  ladders.push({
    col: EU_TEAMS.map((t) => p.get(t)).sort((a, b) => b - a),
    own: Object.fromEntries(OURS.map((t) => [t, p.get(t)])),
  });
}
/**
 * Частка прогонів, у яких команда з такими очками лишається в межах вісімнадцяти.
 *
 * Своє ж значення з прогону виключається окремо: у стовпчику воно стоїть разом
 * з усіма, і без цього команда рахувалась би суперником самій собі — причому в
 * один бік для одних значень і в інший для інших, через що крива переставала
 * бути зростальною (1480 давало більше за 1500).
 */
const qualAt = (pts, team) => {
  let ok = 0;
  for (const { col, own } of ladders) {
    let higher = 0;
    for (const v of col) { if (v > pts) higher++; else break; }
    if (own[team] > pts) higher--;
    if (higher <= 17) ok++;
  }
  return ok / ladders.length;
};

/* ---- ціна кожного матчу, для всіх наших одразу ---- */
process.stderr.write(`ціна матчів, ${SCHEDULED.length} × 2 × ${SENS_RUNS}…\n`);
const priced = [];
for (const m of SCHEDULED) {
  const key = m.a + "|" + m.b;
  const ifA = run({ [key]: m.a }, SENS_RUNS);
  const ifB = run({ [key]: m.b }, SENS_RUNS);
  priced.push({
    ...m,
    pA: ODDS_P(m.a, m.b),
    qualIfA: Object.fromEntries(OURS.map((t) => [t, ifA.qual.get(t) / ifA.n])),
    qualIfB: Object.fromEntries(OURS.map((t) => [t, ifB.qual.get(t) / ifB.n])),
  });
}
function ODDS_P(a, b) {
  const L = { "Spirit|Natus Vincere": 0.695, "BIG|fnatic": 0.523, "K27|B8": 0.477 };
  return L[a + "|" + b] ?? null;
}

/* ---- збірка ---- */
const out = { asOf: "2026-10-28", runs: RUNS, teams: {} };
for (const team of OURS) {
  const r = ROWS[team], d = DET[team];
  if (!r || !d) { process.stderr.write(`немає розкладу: ${team}\n`); continue; }
  const lanGain = r.L.length >= SLOT_CAP ? 48 - Math.min(...r.L.map((x) => x.pts)) : 48;

  const events = EVENTS.filter((e) => e.teams.includes(team)).map((e) => ({
    name: e.name, prize: e.prize, when: e.when,
    rows: e.ladder.map((l) => {
      const wins = e.lowerBracket?.includes(team) ? (l.lower ?? l.wins) : l.wins;
      const p = pricePath(team, wins, l.money, e.oppB, e.oppN, e.prize);
      const after = r.pts + (p?.total ?? 0);
      return { place: l.place, money: l.money, ...p, after, pQual: qualAt(after, team) };
    }),
  }));

  /* Хто може обійти: команди, нижчі за нас у таблиці, із ймовірністю
     закінчити вище. Беремо з того самого базового прогону. */
  const mine = P0.get(team);
  const chasers = EU_TEAMS
    .filter((t) => t !== team && P0.get(t) < mine)
    .map((t) => ({
      team: t, pts: P0.get(t), need: Math.round(mine - P0.get(t)),
      lanGain: DET[t] ? (DET[t].lan.length >= SLOT_CAP ? 48 - Math.min(...DET[t].lan) : 48) : null,
      pAbove: (base.pair.get(team + "|" + t) ?? 0) / base.n,
    }))
    .filter((c) => c.pAbove >= 0.002)
    .sort((a, b) => b.pAbove - a.pAbove)
    .slice(0, 10);

  const matches = priced
    .filter((m) => m.a === team || m.b === team ||
      Math.abs(m.qualIfA[team] - m.qualIfB[team]) >= 0.005)
    .map((m) => ({
      a: m.a, b: m.b, when: m.when, event: m.event,
      own: m.a === team || m.b === team,
      pA: m.pA,
      qualIfA: m.qualIfA[team], qualIfB: m.qualIfB[team],
      weight: Math.abs(m.qualIfA[team] - m.qualIfB[team]),
    }))
    .sort((x, y) => y.weight - x.weight);

  out.teams[team] = {
    team, pts: r.pts,
    pQual: qualOf(team), place: placeOf(team),
    components: {
      base: 400, lan: r.comp[0], network: r.comp[1], offered: r.comp[2],
      collected: r.comp[3], h2h: r.comp[4],
    },
    rows: {
      lan: r.L.map((x) => ({ ...x, days: daysOf(x.date), recency: Math.round(100 * rec(daysOf(x.date))) })),
      offered: r.O.map((x) => ({ ...x, days: daysOf(x.date), recency: Math.round(100 * rec(daysOf(x.date))) })),
      collected: r.C.map((x) => ({ ...x, days: daysOf(x.date) })),
      network: r.N.map((x) => ({ ...x, days: daysOf(x.date) })),
    },
    lanGain, lanFull: r.L.length >= SLOT_CAP,
    events, matches, chasers,
  };
}

process.stdout.write(JSON.stringify(out, null, 1));
process.stderr.write(`\nготово: ${Object.keys(out.teams).length} команд\n`);
for (const t of OURS)
  if (out.teams[t])
    process.stderr.write(`  ${t.padEnd(16)}${(100 * out.teams[t].pQual).toFixed(1).padStart(6)}%   ` +
      `місце ${out.teams[t].place.toFixed(1)}   +${out.teams[t].lanGain} за ЛАН-перемогу\n`);
