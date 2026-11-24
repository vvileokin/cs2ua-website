import fs from "node:fs";

/**
 * Лінія на матч, якого букмекер ще не виставив.
 *
 * Потрібна там, де BetKing відкрив ринок не на всі пари туру. Матч без
 * коефіцієнта лишається без питання, тобто без ставок узагалі, — а це
 * найцікавіші матчі дня.
 *
 * Числа не вигадуються. Крива ймовірності перемоги — та сама, що в
 * `vrs-model/fit-win.mjs`, перевірена на тридцяти двох лініях букмекерів:
 * Elo-подібна логістика з RD=75 і D=817.4 на очках VRS. Але сама по собі вона
 * дає чесну ймовірність, а не ціну, і дає її «взагалі», а не так, як цю
 * конкретну сітку оцінює ця конкретна контора.
 *
 * Тому спершу калібрування. Беруться всі пари події, на які лінія BetKing уже
 * була — і цей тур, і попередні: ціни відкриття лежать у питаннях, у полі
 * `open`, саме для цього. З кожної знімається маржа (`1/oa ÷ (1/oa+1/ob)`) —
 * і виходить, що про ці команди думає сам BetKing. Модель прикладається до тих самих пар, і різниця
 * між нею і ринком зводиться до одного числа: наскільки треба розтягнути або
 * стиснути розрив у рейтингу, щоб модель говорила те саме. Підбирається воно
 * найменшими квадратами в логітах — у них однаковий зсув коштує однаково і на
 * 1.10, і на 5.50, чого не скажеш про самі коефіцієнти.
 *
 * Потім назад: `1 / (p × маржа)`, де маржа — середня з тих самих відомих
 * ліній, і округлення до копійки. Виходить рядок, якого в BetKing немає, але
 * який стоїть на їхній шкалі й з їхньою маржею.
 *
 * Там, де на пару є чужа лінія, вона перемагає модель. Ринок — навіть чужий —
 * знає про склади, форму й новини все те, чого в рейтингу немає взагалі; у
 * нього береться ймовірність, а маржа підставляється наша. Модель лишається
 * для пар, на які не виставив ніхто.
 *
 * Перевірка друкується поруч: модель проти ринку на кожній відомій парі, і
 * чужа лінія (ggua) на новій парі, якщо вона є. Якщо калібрування промахується
 * на відомих, воно промахнеться й на нових, і це має бути видно одразу.
 *
 *   node scripts/major-line.mjs
 */
const ENV = Object.fromEntries(
  fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/).filter((l) => l.includes("=")).map((l) => {
      const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);
const API = ENV.NEXT_PUBLIC_SUPABASE_URL + "/rest/v1/";
const H = { apikey: ENV.SUPABASE_SERVICE_ROLE_KEY, Authorization: "Bearer " + ENV.SUPABASE_SERVICE_ROLE_KEY };
const j = async (q) => (await fetch(API + q, { headers: H })).json();

/** Пари без лінії — те, заради чого все це. Формат важить: у BO3 та сама
    перевага по карті дає більшу перевагу в серії. */
const WANT = [
  ["imperial", "flyquest", "BO3"],
  ["bcgame", "chinggis", "BO3"],
];
/** Чужа лінія на них, якщо є. Перемагає модель: ринок знає більше. */
const FOREIGN = {};
/** Лінії, яких ще немає в базі, — щоб калібрування бачило і їх теж. */
const EXTRA = {
  "heroic-vs-m80": [1.68, 2.17],
  "eternalfire-vs-hundredthieves": [2.25, 1.64],
  "parivision-vs-faze": [1.70, 2.14],
  "wildcard-vs-lynn": [1.73, 2.10],
  "ninez-vs-sharks": [1.62, 2.29],
  "nip-vs-liquid": [2.10, 1.73],
};

const proj = await j("major_projection?select=slug,vrs");
const PTS = new Map(proj.filter((r) => r.slug).map((r) => [r.slug, r.vrs]));

/* Калібрувальна вибірка — усі ціни відкриття, які вже є в базі. Беруться
   саме `open`, а не поточні: поточні рухає гра, що вже йде, і матч, у якому
   хтось веде 10:3, сказав би про силу команд не те, що було відомо до
   початку. */
const qs = await j("questions?select=match_id,options&id=like.q-major-*");
const ms = await j(`matches?select=id,team_a,team_b,format&tournament_slug=eq.pgl-major-singapore-2026`);
const BY = new Map(ms.map((m) => [m.id, m]));

const Q = Math.log(10) / 400, RD = 75, D = 817.4;
const gl = 1 / Math.sqrt(1 + (3 * Q * Q * RD * RD) / (Math.PI * Math.PI));
/** Ймовірність перемоги A в одній карті, з розтягом розриву на `k`. */
const p1 = (a, b, k = 1) =>
  1 / (1 + Math.pow(10, (k * gl * (PTS.get(a) - PTS.get(b))) / -D));

const logit = (p) => Math.log(p / (1 - p));
let MARGIN = 1;
/** Ціна на ймовірність: книга ставить `p × маржа`, коефіцієнт — обернене. */
const price = (p) => 1 / (p * MARGIN);
/** Ринкова ймовірність: з пари коефіцієнтів знімається маржа. */
const devig = ([oa, ob]) => (1 / oa) / (1 / oa + 1 / ob);

/* Серія з трьох карт підсилює фаворита: p²(3−2p). Калібрування ж іде по
   силі на одній карті, інакше BO1 і BO3 говорили б різними одиницями й
   тягнули б підгонку в різні боки. Тому ринкова ймовірність серії спершу
   зводиться назад до карти — функція монотонна, тож ділення відрізка
   знаходить корінь без жодної алгебри. */
const bo3 = (q) => q * q * (3 - 2 * q);
const unBo3 = (p) => {
  let lo = 0, hi = 1;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (bo3(mid) < p) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
};

const obs = [];
const add = (m, oa, ob) => {
  if (!oa || !ob) return;
  if (!PTS.has(m.team_a) || !PTS.has(m.team_b)) return;
  const series = devig([oa, ob]);
  obs.push({
    id: m.id, team_a: m.team_a, team_b: m.team_b, o: [oa, ob],
    bo: m.format === "BO3" ? 3 : 1,
    series,
    /* Саме по цьому підганяються сили. */
    market: m.format === "BO3" ? unBo3(series) : series,
  });
};
for (const q of qs) {
  const m = BY.get(q.match_id);
  if (!m) continue;
  add(m, q.options?.find((o) => o.id === "oa")?.open, q.options?.find((o) => o.id === "ob")?.open);
}
for (const [id, [oa, ob]] of Object.entries(EXTRA)) {
  const m = BY.get(id);
  if (!m) { console.warn(`  (пропущено, немає матчу: ${id})`); continue; }
  if (obs.some((o) => o.id === id)) continue;
  add(m, oa, ob);
}
if (obs.length < 4) throw new Error(`замало ліній для калібрування: ${obs.length}`);

/* Сила команди за версією BetKing.
   Однієї ручки — розтягу розриву в рейтингу — не вистачає, і видно чому:
   на краях шкали модель збігається з ринком (HEROIC — Chinggis: 86% проти
   83%), а в середині він систематично рішучіший за неї (Liquid — Wildcard:
   57% проти 70%). Монотонним перетягуванням одного числа це не лікується,
   бо річ не в масштабі: ринок просто розставляє ці команди інакше, ніж
   рейтинг. Liquid проти BC.Game він оцінює як складнішу гру, ніж Liquid
   проти Wildcard, хоча за VRS BC.Game слабша.

   Тому замість підганяння кривої — пряма підгонка сил. Кожній команді
   шукається число, і ймовірність пари це логістика від їхньої різниці
   (Бредлі — Террі). Чотирнадцять ліній на шістнадцять команд — менше рівнянь,
   ніж невідомих, тож сили притягуються до рейтингових: там, де ринок про
   команду мовчить, лишається те, що про неї каже VRS, а де говорить —
   перемагає ринок. `RIDGE` і є силою того притягання.

   Це не «краща модель узагалі». Це реконструкція чужої думки: нас цікавить
   не хто насправді сильніший, а яку ціну на цю пару поставив би той самий
   букмекер, що поставив решту. */
const teams = [...new Set(obs.flatMap((m) => [m.team_a, m.team_b]))];
const vrsMean = teams.reduce((s2, t) => s2 + PTS.get(t), 0) / teams.length;
/* Рейтинг у логіти — тією ж кривою, що й модель, щоб притягання і дані
   говорили в одних одиницях. */
const prior = new Map(teams.map((t) => [t, (gl * (PTS.get(t) - vrsMean)) / D * Math.log(10)]));

/** Підгонка сил при заданій силі притягання до рейтингу. */
function fit(sample, ridge) {
  const str = new Map(prior);
  for (let it = 0; it < 20000; it++) {
    const g = new Map(teams.map((t) => [t, 0]));
    for (const m of sample) {
      const d = str.get(m.team_a) - str.get(m.team_b);
      const e = 1 / (1 + Math.exp(-d)) - m.market;
      g.set(m.team_a, g.get(m.team_a) + e);
      g.set(m.team_b, g.get(m.team_b) - e);
    }
    for (const t of teams) {
      g.set(t, g.get(t) + ridge * (str.get(t) - prior.get(t)));
      str.set(t, str.get(t) - 0.08 * g.get(t));
    }
  }
  return str;
}

/* Скільки саме притягати — вирішує перехресна перевірка, а не смак. Кожна
   лінія по черзі виймається з вибірки, сили підганяються без неї, і її ціна
   передбачається наосліп. Надто слабке притягання дає сили, які ідеально
   повторюють ті лінії, що бачили, і промахуються на тій, що не бачили;
   надто сильне зводить усе назад до рейтингу. Береться середина. */
let pick = { ridge: 0.35, err: Infinity };
for (const ridge of [0.03, 0.05, 0.08, 0.12, 0.18, 0.25, 0.35, 0.5, 0.7, 1.0, 1.5]) {
  let e = 0;
  for (let i = 0; i < obs.length; i++) {
    const out = obs[i];
    const st = fit(obs.filter((_, k) => k !== i), ridge);
    const p = 1 / (1 + Math.exp(-(st.get(out.team_a) - st.get(out.team_b))));
    e += (logit(p) - logit(out.market)) ** 2;
  }
  e = Math.sqrt(e / obs.length);
  if (e < pick.err) pick = { ridge, err: e };
  console.log(`  притягання ${String(ridge).padStart(4)} → наосліп ${e.toFixed(3)} логіта`);
}
const RIDGE = pick.ridge;
console.log(`обрано притягання ${RIDGE} (наосліп ${pick.err.toFixed(3)})
`);
const str = fit(obs, RIDGE);

/** Ймовірність за підігнаними силами. */
const pBT = (a, b) => 1 / (1 + Math.exp(-((str.get(a) ?? prior.get(a) ?? 0) - (str.get(b) ?? prior.get(b) ?? 0))));

/* Розтяг розриву для чистої моделі — запасний шлях для команди, якої в
   жодній відомій лінії не було: сил для неї не з чого брати. */
let best = { k: 1, err: Infinity };
for (let k = 0.2; k <= 3.0001; k += 0.002) {
  let e = 0;
  for (const m of obs) e += (logit(p1(m.team_a, m.team_b, k)) - logit(m.market)) ** 2;
  if (e < best.err) best = { k, err: e };
}
const K = best.k;
MARGIN = obs.reduce((s2, m) => s2 + 1 / m.o[0] + 1 / m.o[1], 0) / obs.length;

const rms = (f) => Math.sqrt(
  obs.reduce((s2, m) => s2 + (logit(f(m)) - logit(m.market)) ** 2, 0) / obs.length);
console.log(`ліній для калібрування: ${obs.length}   маржа ${((MARGIN - 1) * 100).toFixed(2)}%`);
console.log(`похибка: рейтинг ${rms((m) => p1(m.team_a, m.team_b, K)).toFixed(3)}` +
  `, сили ${rms((m) => pBT(m.team_a, m.team_b)).toFixed(3)} логіта\n`);
console.log("звірка на відомих   сили → ринок BetKing");
for (const m of obs) {
  const map = pBT(m.team_a, m.team_b);
  const p = m.bo === 3 ? bo3(map) : map;
  const back = [price(p), price(1 - p)];
  console.log(
    `  ${m.id.padEnd(26)} ${m.bo === 3 ? "BO3" : "BO1"}  ${(p * 100).toFixed(1)}% / ${(m.series * 100).toFixed(1)}%` +
    `   ${back[0].toFixed(2)} ${back[1].toFixed(2)}  (у них ${m.o[0].toFixed(2)} ${m.o[1].toFixed(2)})`,
  );
}

console.log("\nнова лінія");
for (const [a, b, format] of WANT) {
  for (const t of [a, b]) if (!PTS.has(t)) throw new Error(`немає VRS: ${t}`);
  const f = FOREIGN[`${a}|${b}`];
  /* Чужа лінія, якщо є, інакше сили, інакше голий рейтинг. */
  const known = teams.includes(a) && teams.includes(b);
  const map = known ? pBT(a, b) : p1(a, b, K);
  const p = f ? devig(f) : format === "BO3" ? bo3(map) : map;
  const oa = Math.round(price(p) * 100) / 100;
  const ob = Math.round(price(1 - p) * 100) / 100;
  console.log(
    `  "${a}-vs-${b}": [${oa.toFixed(2)}, ${ob.toFixed(2)}],` +
    `   ${format}  ${a} ${(p * 100).toFixed(1)}%` +
    (format === "BO3" ? ` (по карті ${(map * 100).toFixed(1)}%)` : "") + "  " +
    (f
      ? `з чужої лінії ${f[0].toFixed(2)} ${f[1].toFixed(2)}`
      : `із сил BetKing (голий рейтинг дав би ${(p1(a, b, K) * 100).toFixed(1)}% по карті)`),
  );
}
