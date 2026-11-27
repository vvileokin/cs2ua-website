import fs from "node:fs";

/**
 * Монте-Карло по швейцарці стадії: шанси кожної команди і найкраща картка.
 *
 * Крива перемоги — та сама, що в `vrs-model/fit-win.mjs`: Elo-подібна
 * логістика на очках VRS, RD=75, D=817.4, перевірена на тридцяти двох лініях
 * букмекерів. Вирішальні матчі (на вихід і на виліт) грають BO3, і серія
 * підсилює фаворита: p²(3−2p).
 *
 * Пари першого туру беруться з таблиці матчів, а не вигадуються: жереб уже
 * відбувся, і саме від нього росте все дерево.
 *
 * Найкраща картка шукається перебором по очікуваних очках. Вибори незалежні
 * за цінністю — очки просто додаються, — тож достатньо перебрати, кого
 * поставити в «3:0» і кого у «0:3», а решту шести місць заповнити тими, у
 * кого найбільший очікуваний внесок за прохід.
 *
 * Сила команд береться не з голого рейтингу, а з ліній букмекера на цю ж
 * подію. Причина проста: рейтинг і ринок місцями різко не згодні. VRS ставить
 * NAVI (1590) майже врівень із PARIVISION (1559), а BetKing дає NAVI 70
 * відсотків; MIBR за рейтингом вищий за 100 Thieves, а за лінією — явний
 * аутсайдер. Грати картку проти букмекера на підставі числа, яке він сам
 * щойно спростував, — не стратегія.
 *
 * Тому спершу з усіх відомих ліній відновлюється сила кожної команди
 * (Бредлі — Террі з притяганням до рейтингу, як у `major-line.mjs`), і вже
 * нею грається швейцарка. Команда, якої в лініях не було, лишається зі своїм
 * рейтингом — це і є те притягання.
 *
 * Чого модель не знає все одно: складів, форми, новин і заміни гравця за
 * годину до матчу. Це оцінка, а не пророцтво.
 *
 *   node scripts/major-sim.mjs 2 [прогонів]
 */
const STAGE = Number(process.argv[2] ?? 2);
const RUNS = Number(process.argv[3] ?? 120000);

const ENV = Object.fromEntries(
  fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/).filter((l) => l.includes("=")).map((l) => {
      const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);
const API = ENV.NEXT_PUBLIC_SUPABASE_URL + "/rest/v1/";
const H = {
  apikey: ENV.SUPABASE_SERVICE_ROLE_KEY,
  Authorization: "Bearer " + ENV.SUPABASE_SERVICE_ROLE_KEY,
};
const j = async (q) => (await fetch(API + q, { headers: H })).json();

const [stage] = await j(`major_stages?select=stage,title,teams&stage=eq.${STAGE}`);
const proj = await j("major_projection?select=slug,vrs");
const PTS = new Map(proj.filter((r) => r.slug).map((r) => [r.slug, r.vrs]));
const FIELD = stage.teams;
for (const t of FIELD) if (!PTS.has(t)) throw new Error(`немає VRS: ${t}`);

const ms = await j(
  `matches?select=team_a,team_b,start_at&tournament_slug=eq.pgl-major-singapore-2026&stage=eq.${encodeURIComponent(stage.title)}&order=start_at`,
);
const OPEN = ms.filter((m) => FIELD.includes(m.team_a) && FIELD.includes(m.team_b))
  .slice(0, FIELD.length / 2).map((m) => [m.team_a, m.team_b]);
if (OPEN.length !== FIELD.length / 2) throw new Error(`пар першого туру ${OPEN.length}`);

const src = fs.readFileSync(new URL("../src/lib/data.ts", import.meta.url), "utf8");
const NAME = {};
for (const m of src.matchAll(/^\s{2}(\w[\w-]*): \{ slug: "([^"]+)", name: "([^"]+)"/gm)) NAME[m[2]] = m[3];

const Q = Math.log(10) / 400, RD = 75, D = 817.4;
const gl = 1 / Math.sqrt(1 + (3 * Q * Q * RD * RD) / (Math.PI * Math.PI));
const bo3 = (p) => p * p * (3 - 2 * p);
const unBo3 = (p) => {
  let lo = 0, hi = 1;
  for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (bo3(m) < p) lo = m; else hi = m; }
  return (lo + hi) / 2;
};

/* --- Сила команд із ліній ------------------------------------------------ */
const qs = await j("questions?select=match_id,options&id=like.q-major-*");
const allMs = await j(
  "matches?select=id,team_a,team_b,format&tournament_slug=eq.pgl-major-singapore-2026",
);
const BY = new Map(allMs.map((m) => [m.id, m]));
const obs = [];
for (const q of qs) {
  const m = BY.get(q.match_id);
  if (!m || !PTS.has(m.team_a) || !PTS.has(m.team_b)) continue;
  const oa = q.options?.find((o) => o.id === "oa")?.open;
  const ob = q.options?.find((o) => o.id === "ob")?.open;
  if (!oa || !ob) continue;
  const series = (1 / oa) / (1 / oa + 1 / ob);
  obs.push({ a: m.team_a, b: m.team_b, p: m.format === "BO3" ? unBo3(series) : series });
}

const RIDGE = 0.08;   // підібрано перехресною перевіркою в major-line.mjs
const known = [...new Set(obs.flatMap((o) => [o.a, o.b]))];
const universe = [...new Set([...known, ...FIELD])];
const mean = universe.reduce((s, t) => s + PTS.get(t), 0) / universe.length;
const prior = new Map(universe.map((t) => [t, (gl * (PTS.get(t) - mean)) / D * Math.log(10)]));
const str = new Map(prior);
for (let it = 0; it < 20000; it++) {
  const g = new Map(universe.map((t) => [t, 0]));
  for (const o of obs) {
    const e = 1 / (1 + Math.exp(-(str.get(o.a) - str.get(o.b)))) - o.p;
    g.set(o.a, g.get(o.a) + e);
    g.set(o.b, g.get(o.b) - e);
  }
  for (const t of universe) {
    g.set(t, g.get(t) + RIDGE * (str.get(t) - prior.get(t)));
    str.set(t, str.get(t) - 0.08 * g.get(t));
  }
}
console.log(`сил відновлено з ${obs.length} ліній; у калібруванні ${known.length} команд
`);

/** Ймовірність перемоги A на одній карті. */
const E1 = (a, b) => 1 / (1 + Math.exp(-(str.get(a) - str.get(b))));

const out = new Map(FIELD.map((t) => [t, { "3-0": 0, adv: 0, "0-3": 0 }]));
const LOG = new Uint8Array(RUNS * FIELD.length);   // 0 = 3:0, 1 = прохід, 2 = решта, 3 = 0:3

for (let i = 0; i < RUNS; i++) {
  const rec = new Map(FIELD.map((t) => [t, { w: 0, l: 0 }]));
  const met = new Set(), key = (a, b) => [a, b].sort().join("|");
  const play = (a, b) => {
    const r = rec.get(a), s = rec.get(b);
    const three = r.w === 2 || r.l === 2;           // на вихід або на виліт
    const p = three ? bo3(E1(a, b)) : E1(a, b);
    const aw = Math.random() < p;
    (aw ? r : s).w++; (aw ? s : r).l++;
    met.add(key(a, b));
  };

  for (const [a, b] of OPEN) play(a, b);

  for (let round = 2; round <= 5; round++) {
    const live = FIELD.filter((t) => rec.get(t).w < 3 && rec.get(t).l < 3);
    const buckets = new Map();
    for (const t of live) {
      const k = rec.get(t).w + "-" + rec.get(t).l;
      (buckets.get(k) ?? buckets.set(k, []).get(k)).push(t);
    }
    for (const pool of buckets.values()) {
      const left = pool.slice().sort(() => Math.random() - 0.5);
      while (left.length > 1) {
        const a = left.shift();
        let x = left.findIndex((b) => !met.has(key(a, b)));
        if (x < 0) x = 0;
        play(a, left.splice(x, 1)[0]);
      }
    }
  }

  for (let k = 0; k < FIELD.length; k++) {
    const t = FIELD[k], r = rec.get(t), o = out.get(t);
    let code = 2;
    if (r.w === 3 && r.l === 0) { o["3-0"]++; o.adv++; code = 0; }
    else if (r.w === 3) { o.adv++; code = 1; }
    else if (r.l === 3 && r.w === 0) { o["0-3"]++; code = 3; }
    LOG[i * FIELD.length + k] = code;
  }
}

const PRICE = { "3-0": 150, adv: 50, "0-3": 150 };
const rows = FIELD.map((t) => {
  const o = out.get(t);
  return { t, vrs: PTS.get(t), p: { "3-0": o["3-0"] / RUNS, adv: o.adv / RUNS, "0-3": o["0-3"] / RUNS } };
}).sort((a, b) => b.p.adv - a.p.adv);

const pad = (s, n) => String(s).padEnd(n);
console.log(`${stage.title}: ${RUNS} прогонів\n`);
console.log(pad("команда", 18), pad("VRS", 6), " 3:0     прохід    0:3");
for (const r of rows) {
  const f = (x) => (x * 100).toFixed(1).padStart(5) + "%";
  console.log(pad(NAME[r.t] ?? r.t, 18), pad(r.vrs, 6), f(r.p["3-0"]), " ", f(r.p.adv), " ", f(r.p["0-3"]));
}

/* --- Картка цілком ------------------------------------------------------ */
const IDX = new Map(FIELD.map((t, i) => [t, i]));
const EV = (t, role) => rows.find((r) => r.t === t).p[role] * PRICE[role];

function bestCard() {
  const n = FIELD.length;
  let best = null;
  for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) {
    for (let c = 0; c < n; c++) { if (c === a || c === b) continue;
      for (let d = c + 1; d < n; d++) { if (d === a || d === b) continue;
        const rest = FIELD.filter((_, i) => i !== a && i !== b && i !== c && i !== d)
          .map((t) => ({ t, ev: EV(t, "adv") })).sort((x, y) => y.ev - x.ev).slice(0, 6);
        const score = EV(FIELD[a], "3-0") + EV(FIELD[b], "3-0")
          + EV(FIELD[c], "0-3") + EV(FIELD[d], "0-3")
          + rest.reduce((s, r) => s + r.ev, 0);
        if (!best || score > best.score) best = {
          score, win: [FIELD[a], FIELD[b]], out: [FIELD[c], FIELD[d]], adv: rest.map((r) => r.t),
        };
      }
    }
  }
  return best;
}

function run(card) {
  const picks = [
    ...card.win.map((t) => [IDX.get(t), 0]),
    ...card.adv.map((t) => [IDX.get(t), 1]),
    ...card.out.map((t) => [IDX.get(t), 3]),
  ];
  let perfect = 0, sum = 0, hitsSum = 0;
  const dist = new Array(11).fill(0);
  for (let i = 0; i < RUNS; i++) {
    const base = i * FIELD.length;
    let pts = 0, hits = 0;
    for (const [k, want] of picks) {
      const got = LOG[base + k];
      const ok = want === 1 ? got <= 1 : got === want;
      if (ok) { hits++; pts += want === 1 ? 50 : 150; }
    }
    if (hits === 10) { perfect++; pts += 500; }
    sum += pts; hitsSum += hits; dist[hits]++;
  }
  return { p: perfect / RUNS, ev: sum / RUNS, hits: hitsSum / RUNS, dist };
}

const best = bestCard();
console.log("\n— найкраща картка за очікуваними очками —");
console.log("3:0   ", best.win.map((t) => NAME[t] ?? t).join(", "));
console.log("прохід", best.adv.map((t) => NAME[t] ?? t).join(", "));
console.log("0:3   ", best.out.map((t) => NAME[t] ?? t).join(", "));
const r1 = run(best);
console.log(`очікувано ${r1.ev.toFixed(0)} очок, влучань ${r1.hits.toFixed(2)}/10`);
console.log("розподіл влучань:");
r1.dist.forEach((n, k) => { if (n) console.log(`  ${k}/10 — ${((n / RUNS) * 100).toFixed(2)}%`); });

/* Чужа картка, якщо її передали. Рахується по тих самих збережених
   прогонах, тож порівняння чесне: не дві різні симуляції, а дві картки в
   одному й тому самому світі. */
const given = process.argv.includes("--card")
  ? JSON.parse(process.argv[process.argv.indexOf("--card") + 1])
  : null;
if (given) {
  const card = {
    win: Object.keys(given).filter((t) => given[t] === "3-0"),
    adv: Object.keys(given).filter((t) => given[t] === "adv"),
    out: Object.keys(given).filter((t) => given[t] === "0-3"),
  };
  const r2 = run(card);
  console.log("\n— передана картка —");
  console.log("3:0   ", card.win.map((t) => NAME[t] ?? t).join(", "));
  console.log("прохід", card.adv.map((t) => NAME[t] ?? t).join(", "));
  console.log("0:3   ", card.out.map((t) => NAME[t] ?? t).join(", "));
  console.log(`очікувано ${r2.ev.toFixed(0)} очок, влучань ${r2.hits.toFixed(2)}/10`);
  console.log(`різниця з найкращою: ${(r2.ev - r1.ev).toFixed(0)} очок`);
}

console.log("\nJSON для картки:");
console.log(JSON.stringify(Object.fromEntries([
  ...best.win.map((t) => [t, "3-0"]),
  ...best.adv.map((t) => [t, "adv"]),
  ...best.out.map((t) => [t, "0-3"]),
])));
