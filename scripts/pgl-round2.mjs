import fs from "node:fs";

/**
 * Другий тур PGL Masters Bucharest, 25 жовтня — вісім пар.
 *
 * Швейцарка розійшлась надвоє: чотири матчі серед тих, хто виграв перший тур,
 * і чотири серед тих, хто програв. Перший тур вийшов різким — BETBOOM зняли
 * Spirit, Liquid зняли MOUZ, The MongolZ зняли Aurora, а НАВІ взяли G2 всуху,
 * — тож у верхній половині опинились ті, кого там не чекали.
 *
 * Коефіцієнти зі сторінок матчів HLTV. На BETBOOM — Nemiga лінії ще немає:
 * матч заводиться без питання, і ставку на нього можна буде відкрити, щойно
 * букмекер виставить ціну. Вигадувати коефіцієнт для події, на яку його ще
 * не дали, — це не прогноз, а малюнок.
 *
 * Очні зустрічі — серіями зі сторінок матчів. Там, де HLTV показує лише
 * десять останніх карт, береться рівно те, що видно, і нічого не добирається
 * з голови; у FURIA — НАВІ та Vitality — The MongolZ історія довша за вікно.
 *
 * Час у базі в UTC, HLTV показує київський (+3).
 *
 * Запуск: node scripts/pgl-round2.mjs --apply
 */

const ENV = Object.fromEntries(
  fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/).filter((l) => l.includes("=")).map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);
const SB = ENV.NEXT_PUBLIC_SUPABASE_URL;
const KEY = ENV.SUPABASE_SERVICE_ROLE_KEY;
const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, "content-type": "application/json" };

const post = async (table, rows) => {
  if (!rows.length) return;
  const r = await fetch(`${SB}/rest/v1/${table}`, {
    method: "POST",
    headers: { ...headers, Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify(rows),
  });
  if (!r.ok) throw new Error(`${table}: ${r.status} ${await r.text()}`);
};

const S = (date, event, score, winner) => ({ date, event, score, winner });

const ROUND2 = [
  /* --- гілка 1-0 --- */
  {
    a: "fut", b: "liquid", at: "2026-10-25T07:00:00+00:00",
    names: ["FUT", "Liquid"], odds: [1.34, 3.02], h2h: null,
  },
  {
    a: "vitality", b: "mongolz", at: "2026-10-25T10:00:00+00:00",
    names: ["Vitality", "The MongolZ"], odds: [1.17, 4.83],
    h2h: { a: 3, b: 0, series: [
      S("2026-03-22", "BLAST Open Rotterdam 2026", "2:0", "a"),
      S("2026-02-21", "PGL Cluj-Napoca 2026", "2:0", "a"),
      S("2026-02-15", "PGL Cluj-Napoca 2026", "2:1", "a"),
    ] },
  },
  {
    a: "betboom", b: "nemiga", at: "2026-10-25T10:00:00+00:00",
    names: ["BetBoom Team", "Nemiga"], odds: null, h2h: null,
  },
  {
    a: "furia", b: "natus", at: "2026-10-25T16:00:00+00:00",
    names: ["FURIA", "Natus Vincere"], odds: [1.63, 2.15],
    h2h: { a: 2, b: 1, series: [
      S("2026-04-15", "IEM Rio 2026", "2:1", "a"),
      S("2026-02-02", "IEM Kraków 2026", "2:1", "a"),
      S("2025-12-13", "StarLadder Budapest Major 2025", "1:2", "b"),
    ] },
  },
  /* --- гілка 0-1 --- */
  {
    a: "spirit", b: "tyloo", at: "2026-10-25T07:00:00+00:00",
    names: ["Spirit", "TYLOO"], odds: [1.12, 5.50],
    h2h: { a: 1, b: 0, series: [
      S("2025-03-07", "ESL Pro League Season 21", "2:0", "a"),
    ] },
  },
  {
    a: "g2", b: "aurora", at: "2026-10-25T13:00:00+00:00",
    names: ["G2", "Aurora"], odds: [2.37, 1.56],
    h2h: { a: 2, b: 2, series: [
      S("2026-08-31", "BLAST Open Porto 2026", "2:1", "a"),
      S("2026-08-26", "BLAST Open Porto 2026", "2:0", "a"),
      S("2026-06-13", "IEM Cologne Major 2026", "0:2", "b"),
      S("2026-03-09", "ESL Pro League Season 23 Stage 2", "0:2", "b"),
    ] },
  },
  {
    a: "mouz", b: "ninez", at: "2026-10-25T13:00:00+00:00",
    names: ["MOUZ", "9z"], odds: [1.30, 3.42],
    h2h: { a: 1, b: 2, series: [
      S("2026-08-27", "BLAST Open Porto 2026", "2:0", "a"),
      S("2026-05-11", "PGL Astana 2026", "1:2", "b"),
      S("2026-03-21", "BLAST Open Rotterdam 2026", "0:2", "b"),
    ] },
  },
  {
    a: "legacy", b: "sharks", at: "2026-10-25T16:00:00+00:00",
    names: ["Legacy", "DENDELE"], odds: [1.30, 3.42],
    h2h: { a: 1, b: 1, series: [
      S("2026-01-17", "BetBoom RUSH B Summit Season 1", "1:2", "b"),
      S("2025-08-02", "Ace SA Masters 2025 Season 2", "2:0", "a"),
    ] },
  },
];

const now = Date.now();
const matches = ROUND2.map((m) => ({
  id: `${m.a}-vs-${m.b}-pgl26-r2`,
  tournament_slug: "pgl-masters-bucharest-2026",
  is_event: false,
  team_a: m.a, team_b: m.b,
  status: Date.parse(m.at) <= now ? "live" : "upcoming",
  format: "BO3",
  stage: "Швейцарка · тур 2",
  start_at: m.at,
  score_a: 0, score_b: 0,
  maps: [], veto: [],
  h2h: m.h2h,
  /* Без лінії немає й питання — картка стоїть у сітці, але ставку не приймає. */
  open_questions: m.odds ? 1 : 0,
  max_reward: 50,
}));

const questions = ROUND2.filter((m) => m.odds).map((m) => ({
  id: `q-${m.a}-vs-${m.b}-pgl26-r2`,
  match_id: `${m.a}-vs-${m.b}-pgl26-r2`,
  kind: "match_winner",
  title: "Переможець матчу",
  difficulty: "easy",
  status: "open",
  deadline_label: "до старту матчу",
  betting: true,
  live_odds: true,
  options: [
    { id: `${m.a}-w`, label: m.names[0], odds: m.odds[0], open: m.odds[0], reward: 50 },
    { id: `${m.b}-w`, label: m.names[1], odds: m.odds[1], open: m.odds[1], reward: 50 },
  ],
}));

for (const m of ROUND2) {
  console.log(
    `${(m.names[0] + " — " + m.names[1]).padEnd(30)} ${m.at.slice(11, 16)} UTC · ` +
    `${m.odds ? `${m.odds[0]} / ${m.odds[1]}` : "лінії ще нема".padEnd(13)} · ` +
    `очні ${m.h2h ? `${m.h2h.a}:${m.h2h.b}` : "не грали"}`,
  );
}
console.log(`\nматчів ${matches.length}, питань ${questions.length}`);

if (!process.argv.includes("--apply")) {
  console.log("\nпробний прогін — нічого не записано. --apply щоб залити");
} else {
  await post("matches", matches);
  await post("questions", questions);
  console.log(`\nзаписано: ${matches.length} матчів і ${questions.length} питань`);
  if (questions.length < matches.length) {
    console.log("BETBOOM — Nemiga без питання: додати, щойно зʼявиться лінія");
  }
}
