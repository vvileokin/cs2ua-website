import fs from "node:fs";

/**
 * PGL Masters Bucharest 2026 — хто з ким і хто пройде.
 *
 * Що підтверджено сторінкою події на HLTV:
 *   · 24–31 жовтня, шістнадцять команд, Swiss Bo3, плейоф на вибування Bo3,
 *     гранд-фінал Bo5, є матч за третє місце;
 *   · склад — дванадцять за рейтингом плюс чотири переможці закритих
 *     кваліфікацій (Nemiga, Liquid, TYLOO, DENDELE);
 *   · «VRS date: Jul 6th 2026» — зріз рейтингу, за яким роздавали запрошення.
 *
 * Чого підтвердити не вдалося, і тому воно тут параметром, а не константою:
 *
 *   1) За яким зрізом сіють сітку. HLTV називає липневий, VPEsports — зріз за
 *      5 жовтня. Це різні посіви: у липні NAVI були десятими, у жовтні —
 *      тринадцятими, і першого ж тура вони дістають різних суперників.
 *   2) Сам механізм пар. Джерела на правила саме цього турніру немає. Беру
 *      мейджорну систему, яку PGL веде на своїх подіях: перший тур за посівом
 *      (перший з дев'ятим), далі всередині груп за Бухгольцем, вищий проти
 *      нижчого, з уникненням повторів.
 *
 * Тому прогін робиться двічі, під обидва посіви, і дивитись варто не на самі
 * числа, а на те, наскільки вони розходяться: це і є ціна незнання.
 *
 * Ймовірність перемоги — з різниці очок VRS за тим самим каліброваним
 * дільником, що й у прогнозі на мейджор.
 *
 * Запуск: node bucharest.mjs [кількість прогонів]
 */

const RUNS = Number(process.argv[2] ?? 40000);
/** Який зріз рейтингу вважаємо посівним: "july" (HLTV) чи "october" (VPEsports). */
const MODE = process.argv[3] ?? "july";
/** Чим розставляють усередині групи: "buch" (мейджорна система) чи "seed" (як ESL). */
const PAIR = process.argv[4] ?? "draw";

const seedSnap = JSON.parse(fs.readFileSync("vrs-live-0510.json", "utf8"));
const liveSnap = JSON.parse(fs.readFileSync("vrs-live.json", "utf8"));
const parse = (s) => s.rows.split(";").map((r) => {
  const [rank, team, pts] = r.split("|");
  return { rank: +rank, team, pts: +pts };
});
const seedTable = parse(seedSnap), liveTable = parse(liveSnap);

const FIELD = ["Spirit", "Vitality", "FURIA", "MOUZ", "Legacy", "FUT", "G2", "Aurora",
  "Natus Vincere", "BETBOOM", "The MongolZ", "9z", "Liquid", "TYLOO", "Nemiga", "DENDELE"];

/* Місця в липневому рейтингу — зі сторінки події на HLTV, де вони стоять
   першим числом біля кожної команди (другим іде поточне). */
const JULY = { Spirit: 1, Vitality: 2, MOUZ: 3, FURIA: 4, Aurora: 6, Legacy: 7, G2: 8,
  FUT: 9, "Natus Vincere": 10, BETBOOM: 14, "9z": 17, "The MongolZ": 21,
  Nemiga: 23, Liquid: 27, TYLOO: 33, DENDELE: 40 };

const seeds = (MODE === "july"
  ? FIELD.map((n) => ({ team: n, rank: JULY[n] }))
  : FIELD.map((n) => ({ team: n, rank: seedTable.find((r) => r.team === n).rank })))
  .sort((a, b) => a.rank - b.rank)
  .map((t, i) => ({ team: t.team, seed: i + 1 }));
const pts = new Map(FIELD.map((n) => [n, liveTable.find((r) => r.team === n)?.pts ?? 1000]));

const Q = Math.log(10) / 400, RD = 75, D = 817.4;
const gl = 1 / Math.sqrt(1 + (3 * Q * Q * RD * RD) / (Math.PI * Math.PI));
const pWin = (a, b) => 1 / (1 + Math.pow(10, (gl * (pts.get(a) - pts.get(b))) / -D));

/** Перший тур: перший з дев'ятим і далі. Він однаковий у кожному прогоні. */
const ROUND1 = Array.from({ length: 8 }, (_, i) => [seeds[i].team, seeds[i + 8].team]);

const seedOf = new Map(seeds.map((s) => [s.team, s.seed]));

function runOnce() {
  const rec = new Map(FIELD.map((t) => [t, { w: 0, l: 0, opps: [] }]));
  const played = new Set();
  const key = (a, b) => [a, b].sort().join("|");
  const pairsSeen = [];

  const playMatch = (a, b) => {
    const aw = Math.random() < pWin(a, b);
    const A = rec.get(a), B = rec.get(b);
    (aw ? A : B).w++; (aw ? B : A).l++;
    A.opps.push(b); B.opps.push(a);
    played.add(key(a, b));
    pairsSeen.push(key(a, b));
  };

  if (PAIR === "pots") {
    /* Знайдена система: перші вісім посіву грають із другими вісьмома, а хто
       саме з ким — жереб. Перевірено на трьох турнірах PGL (квітневий
       Бухарест, Астана, Клуж-Напока): у кожному перший тур ділиться рівно
       8 на 8, і в списку Liquipedia команда з верхнього кошика завжди стоїть
       першою. Саме це і означає «drawn based on the seeding». */
    const top = seeds.slice(0, 8).map((s) => s.team);
    const bot = seeds.slice(8).map((s) => s.team).sort(() => Math.random() - 0.5);
    top.forEach((t, i) => playMatch(t, bot[i]));
  } else if (PAIR === "draw") {
    /* Жереб: випадкове парування всіх шістнадцяти. Регламент каже «drawn based
       on the seeding», але квітневий турнір показує, що це не драбинка 1-9:
       там PARIVISION (посів 1) витягнули Legacy (6), а NRG (9) — Voca (14).
       Отже посів задає щось м'якше за жорсткі пари, і найчесніша модель — рівно
       ймовірне парування. */
    const pool = FIELD.slice();
    while (pool.length > 1) {
      const a = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
      const b = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
      playMatch(a, b);
    }
  } else {
    for (const [a, b] of ROUND1) playMatch(a, b);
  }

  for (let round = 2; round <= 5; round++) {
    const alive = FIELD.filter((t) => rec.get(t).w < 3 && rec.get(t).l < 3);
    if (!alive.length) break;
    /* Бухгольц — сума різниць суперників; саме він розставляє всередині групи. */
    const buch = (t) => rec.get(t).opps.reduce((s, o) => s + rec.get(o).w - rec.get(o).l, 0);
    const groups = new Map();
    for (const t of alive) {
      const g = `${rec.get(t).w}-${rec.get(t).l}`;
      (groups.get(g) ?? groups.set(g, []).get(g)).push(t);
    }
    for (const list of groups.values()) {
      const order = PAIR === "seed"
        ? list.slice().sort((a, b) => seedOf.get(a) - seedOf.get(b))
        : PAIR === "draw"
          /* Регламент: «teams are drawn an opponent which they have not yet
             played from their group». Жереб, і жодного Бухгольца. */
          ? list.slice().sort(() => Math.random() - 0.5)
          : list.slice().sort((a, b) => buch(b) - buch(a) || seedOf.get(a) - seedOf.get(b));
      const left = order.slice();
      while (left.length > 1) {
        const top = left.shift();
        /* Вищий грає з найнижчим, який ще не траплявся; якщо всі траплялись —
           беремо найнижчого попри повтор, бо інакше тур не складеться. */
        let idx = -1;
        for (let i = left.length - 1; i >= 0; i--) {
          if (!played.has(key(top, left[i]))) { idx = i; break; }
        }
        if (idx === -1) idx = left.length - 1;
        const opp = left.splice(idx, 1)[0];
        playMatch(top, opp);
      }
    }
  }
  return { rec, pairsSeen };
}

const adv = new Map(FIELD.map((t) => [t, 0]));
const perfect = new Map(FIELD.map((t) => [t, 0]));
const wipeout = new Map(FIELD.map((t) => [t, 0]));
const pairCount = new Map();

for (let i = 0; i < RUNS; i++) {
  const { rec, pairsSeen } = runOnce();
  for (const t of FIELD) {
    const r = rec.get(t);
    if (r.w >= 3) adv.set(t, adv.get(t) + 1);
    if (r.w === 3 && r.l === 0) perfect.set(t, perfect.get(t) + 1);
    if (r.l === 3 && r.w === 0) wipeout.set(t, wipeout.get(t) + 1);
  }
  for (const p of new Set(pairsSeen)) pairCount.set(p, (pairCount.get(p) ?? 0) + 1);
}

const pc = (n) => `${((100 * n) / RUNS).toFixed(1)}%`;

console.log(`PGL Masters Bucharest · 24–31 жовтня · ${RUNS} прогонів\n`);
console.log(PAIR === "draw"
  ? "перший тур — жереб, фіксованих пар немає; нижче драбинка 1-9 лише для порівняння:"
  : "перший тур (за посівом, він фіксований):");
ROUND1.forEach(([a, b], i) =>
  console.log(`  ${String(seedOf.get(a)).padStart(2)}. ${a.padEnd(15)} — ${b.padEnd(15)} ${String(seedOf.get(b)).padStart(2)}.` +
    `   ${(100 * pWin(a, b)).toFixed(0)}%`));

console.log("\nпрохід у плейоф (три перемоги):");
seeds.forEach((s) =>
  console.log(`  ${String(s.seed).padStart(2)}. ${s.team.padEnd(16)}${pc(adv.get(s.team)).padStart(7)}` +
    `   · 3-0 ${pc(perfect.get(s.team)).padStart(6)} · 0-3 ${pc(wipeout.get(s.team)).padStart(6)}`));

console.log("\nнайімовірніші пари за весь турнір (окрім першого туру):");
const r1 = new Set(ROUND1.map(([a, b]) => [a, b].sort().join("|")));
[...pairCount.entries()].filter(([k]) => !r1.has(k)).sort((a, b) => b[1] - a[1]).slice(0, 12)
  .forEach(([k, n]) => console.log(`  ${k.split("|").join(" — ").padEnd(34)}${pc(n)}`));

/* Запит на конкретну пару: PAIR_OF="A,B" — як часто вони взагалі зустрічаються
   за турнір, і OPP_OF="A" — повний розподіл суперників. Жереб означає, що
   наперед відома не пара, а саме такий розподіл. */
if (process.env.PAIR_OF) {
  const [x, y] = process.env.PAIR_OF.split(",");
  const k = [x, y].sort().join("|");
  console.log(`\n${x} — ${y}: зустрічаються у ${((100 * (pairCount.get(k) ?? 0)) / RUNS).toFixed(1)}% прогонів`);
}
if (process.env.OPP_OF) {
  const who = process.env.OPP_OF;
  console.log(`\nз ким ${who} зустрічається за турнір:`);
  [...pairCount.entries()]
    .filter(([k]) => k.split("|").includes(who))
    .map(([k, n]) => [k.split("|").find((t) => t !== who), n])
    .sort((a, b) => b[1] - a[1])
    .forEach(([t, n]) => console.log(`  ${t.padEnd(18)}${((100 * n) / RUNS).toFixed(1)}%`));
}
