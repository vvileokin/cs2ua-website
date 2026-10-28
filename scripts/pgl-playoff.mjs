import fs from "node:fs";

/**
 * Чвертьфінали PGL Masters Bucharest — 29 жовтня, зі ставками.
 *
 * Груповий етап дограно: НАВІ 2-1 Spirit і зайшли у вісімку з 3-2, Spirit
 * поїхали на 9-11. Сітка плей-оф уже має свої ідентифікатори в
 * `src/lib/playoff.ts` (`pgl26-qf1…gf`), тож матчі створюються саме під них —
 * інакше драбина на сторінці турніру лишиться порожньою, хоч матчі й будуть.
 *
 * Коефіцієнти — betking через HLTV, зняті 28 жовтня ввечері.
 * Час у базі в UTC. HLTV показує київський, а Київ із 25 жовтня на UTC+2, не
 * +3 — попередні скрипти цього туру писали «+3», бо робились до переходу, і
 * скопіювати з них зсув означало поставити всі матчі на годину раніше.
 *
 * Запуск: node scripts/pgl-playoff.mjs --apply
 */
const ENV = Object.fromEntries(
  fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/).filter((l) => l.includes("=")).map((l) => {
      const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);
const SB = ENV.NEXT_PUBLIC_SUPABASE_URL, KEY = ENV.SUPABASE_SERVICE_ROLE_KEY;
const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, "content-type": "application/json" };
const S = (date, event, score, winner) => ({ date, event, score, winner });

const QF = [
  { id: "pgl26-qf1", a: "fut", b: "nemiga", at: "2026-10-29T08:00:00+00:00",
    names: ["FUT", "Nemiga"], odds: [1.36, 3.10],
    h2h: { a: 1, b: 0, series: [
      S("2026-09-16", "SL StarSeries Fall 2026", "2:0", "a"),
    ] } },
  { id: "pgl26-qf2", a: "vitality", b: "natus", at: "2026-10-29T11:00:00+00:00",
    names: ["Vitality", "Natus Vincere"], odds: [1.36, 3.10],
    /* Грали два дні тому в тій самій швейцарці — 2-0 на користь Vitality. */
    h2h: { a: 3, b: 1, series: [
      S("2026-10-27", "PGL Masters Bucharest 2026", "2:0", "a"),
      S("2026-05-16", "IEM Atlanta 2026", "1:2", "b"),
      S("2026-05-03", "BLAST Rivals 2026 Season 1", "2:1", "a"),
      S("2026-02-08", "IEM Katowice 2026", "2:0", "a"),
    ] } },
  { id: "pgl26-qf3", a: "aurora", b: "mouz", at: "2026-10-29T14:00:00+00:00",
    names: ["Aurora", "MOUZ"], odds: [2.25, 1.64],
    h2h: { a: 1, b: 2, series: [
      S("2026-08-15", "Esports World Cup 2026", "0:2", "b"),
      S("2026-06-14", "IEM Cologne Major 2026", "2:1", "a"),
      S("2026-03-22", "ESL Pro League Season 23", "1:2", "b"),
    ] } },
  { id: "pgl26-qf4", a: "betboom", b: "furia", at: "2026-10-29T17:00:00+00:00",
    names: ["BetBoom Team", "FURIA"], odds: [2.43, 1.56],
    h2h: { a: 1, b: 1, series: [
      S("2026-10-18", "Thunderpick World Championship 2026", "0:2", "b"),
      S("2026-07-12", "XSE Pro League 2026", "2:1", "a"),
    ] } },
];

const now = Date.now();
const matches = QF.map((m) => ({
  id: m.id,
  tournament_slug: "pgl-masters-bucharest-2026",
  is_event: false, team_a: m.a, team_b: m.b,
  status: Date.parse(m.at) <= now ? "live" : "upcoming",
  format: "BO3", stage: "Плей-оф · чвертьфінал",
  start_at: m.at, score_a: 0, score_b: 0, maps: [], veto: [],
  h2h: m.h2h, open_questions: 1, max_reward: 50,
}));

/* Нагорода лежить усередині кожного варіанта, а не окремою колонкою таблиці —
   і `odds` там теж поруч із `open`, бо коефіцієнт на момент прийняття ставки
   відрізняється від того, з яким питання відкрили. */
const questions = QF.map((m) => ({
  id: `q-${m.id}`,
  match_id: m.id,
  kind: "match_winner", title: "Переможець матчу", difficulty: "easy",
  status: "open", deadline_label: "до старту матчу",
  /* Це ставка, а не прогноз: `betting` робить із питання лінію з коефіцієнтом,
     яка списує очки, замість картки з пласкими «+50». `live_odds` дозволяє
     коефіцієнту рухатись до старту — `open` лишається тим, з яким відкрили. */
  betting: true, live_odds: true,
  options: [
    { id: `${m.a}-w`, label: m.names[0], odds: m.odds[0], open: m.odds[0], reward: "50" },
    { id: `${m.b}-w`, label: m.names[1], odds: m.odds[1], open: m.odds[1], reward: "50" },
  ],
}));

console.log("чвертьфінали PGL Masters Bucharest, 29 жовтня\n");
for (const m of QF) {
  const kyiv = new Date(Date.parse(m.at) + 2 * 3600_000).toISOString().slice(11, 16);
  console.log(`  ${kyiv}  ${m.names[0].padEnd(16)}${String(m.odds[0]).padStart(5)}` +
    `   ${m.names[1].padEnd(16)}${String(m.odds[1]).padStart(5)}   ${m.id}`);
}

if (!process.argv.includes("--apply")) {
  console.log("\nпробний прогін. --apply щоб записати");
  process.exit(0);
}

const send = async (table, body) => {
  const r = await fetch(`${SB}/rest/v1/${table}`, {
    method: "POST",
    headers: { ...headers, Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`${table}: ${r.status} ${await r.text()}`);
};
await send("matches", matches);
await send("questions", questions);
console.log(`\nзаписано ${matches.length} матчів і ${questions.length} питань`);
