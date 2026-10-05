import fs from "node:fs";

/**
 * Третій тур EPL S24, 5 жовтня.
 *
 * Пари й час — із HLTV, очні зустрічі — з їхніх же сторінок матчів, зведені з
 * мап у серії. Усе інше рахуємо самі: коефіцієнти йдуть із нашої моделі на
 * свіжому зрізі VRS (5 жовтня) з маржею 5,8% — тією, яку букмекер показував на
 * парах першого й другого турів.
 *
 * Чотири пари грають уперше в історії: ShindeN — G2, 9z — NAVI, Legacy — 1win
 * і PARIVISION уже зустрічалися, а решта троє ні. У таких матчах блок очних
 * просто не малюється: порожня таблиця гірша за її відсутність.
 *
 * Час у базі в UTC, HLTV показує київський (+3).
 *
 * Запуск: node scripts/epl-round3.mjs --apply
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
const APPLY = process.argv.includes("--apply");

const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, "content-type": "application/json" };
const post = async (table, rows) => {
  const r = await fetch(`${SB}/rest/v1/${table}`, {
    method: "POST",
    headers: { ...headers, Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify(rows),
  });
  if (!r.ok) throw new Error(`${table}: ${r.status} ${await r.text()}`);
};

const S = (date, event, score, winner) => ({ date, event, score, winner });

const ROUND3 = [
  {
    a: "parivision", b: "furia", at: "2026-10-05T09:00:00+00:00",
    names: ["PARIVISION", "FURIA"], odds: [3.27, 1.33],
    h2h: { a: 1, b: 2, series: [
      S("2026-09-09", "FISSURE Playground 3", "0:2", "b"),
      S("2026-02-17", "PGL Cluj-Napoca 2026", "1:2", "b"),
      S("2026-01-24", "BLAST Bounty 2026 Season 1 Finals", "2:0", "a"),
    ] },
  },
  {
    a: "shinden", b: "g2", at: "2026-10-05T09:00:00+00:00",
    names: ["ShindeN", "G2"], odds: [6.89, 1.10], h2h: null,
  },
  {
    a: "ninez", b: "natus", at: "2026-10-05T11:30:00+00:00",
    names: ["9z", "Natus Vincere"], odds: [1.75, 2.05], h2h: null,
  },
  {
    a: "legacy", b: "onewin", at: "2026-10-05T11:30:00+00:00",
    names: ["Legacy", "1win"], odds: [1.20, 4.39], h2h: null,
  },
  {
    a: "spirit", b: "mouz", at: "2026-10-05T14:00:00+00:00",
    names: ["Spirit", "MOUZ"], odds: [1.58, 2.36],
    h2h: { a: 2, b: 1, series: [
      S("2026-09-06", "BLAST Open Porto 2026", "3:1", "a"),
      S("2026-08-02", "BLAST Bounty 2026 Season 2 Finals", "1:3", "b"),
      S("2026-05-16", "PGL Astana 2026", "2:0", "a"),
    ] },
  },
  {
    a: "m80", b: "tyloo", at: "2026-10-05T14:00:00+00:00",
    names: ["M80", "TYLOO"], odds: [1.59, 2.34],
    h2h: { a: 1, b: 1, series: [
      S("2025-11-30", "StarLadder Budapest Major 2025 Stage 2", "1:0", "a"),
      S("2025-06-07", "BLAST.tv Austin Major 2025 Stage 2", "0:1", "b"),
    ] },
  },
  {
    a: "vitality", b: "falcons", at: "2026-10-05T16:30:00+00:00",
    names: ["Vitality", "Falcons"], odds: [1.81, 1.98],
    /* Чотири серії поспіль за Falcons — рідкісний випадок, коли очні кажуть
       більше за рейтинг: за очками команди майже рівні. */
    h2h: { a: 0, b: 4, series: [
      S("2026-06-20", "IEM Cologne Major 2026", "1:2", "b"),
      S("2026-04-16", "IEM Rio 2026", "1:2", "b"),
      S("2026-01-24", "BLAST Bounty 2026 Season 1 Finals", "1:2", "b"),
      S("2025-11-15", "BLAST Rivals 2025 Season 2", "0:2", "b"),
    ] },
  },
  {
    a: "aurora", b: "betboom", at: "2026-10-05T16:30:00+00:00",
    names: ["Aurora", "BETBOOM"], odds: [1.63, 2.24],
    h2h: { a: 3, b: 1, series: [
      S("2026-06-18", "IEM Cologne Major 2026", "2:0", "a"),
      S("2024-06-06", "YaLLa Compass 2024", "0:1", "b"),
      S("2024-05-21", "CCT Global Finals 2024", "2:1", "a"),
      S("2024-04-19", "Esports World Cup 2024 Europe Closed Qualifier", "2:1", "a"),
    ] },
  },
];

const matches = ROUND3.map((m) => ({
  id: `${m.a}-vs-${m.b}-epl24`,
  tournament_slug: "esl-pro-league-s24",
  is_event: false,
  team_a: m.a, team_b: m.b,
  status: "upcoming",
  format: "BO3",
  stage: "Швейцарка · тур 3",
  start_at: m.at,
  score_a: 0, score_b: 0,
  maps: [], veto: [],
  h2h: m.h2h,
  open_questions: 1,
  max_reward: 50,
}));

const questions = ROUND3.map((m) => ({
  id: `q-${m.a}-vs-${m.b}-epl24`,
  match_id: `${m.a}-vs-${m.b}-epl24`,
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

for (const m of ROUND3) {
  console.log(
    `${(m.a + " vs " + m.b).padEnd(26)} ${m.at.slice(11, 16)} UTC · ${m.odds[0]} / ${m.odds[1]}` +
    ` · очні ${m.h2h ? `${m.h2h.a}:${m.h2h.b}` : "не грали"}`,
  );
}

if (!APPLY) {
  console.log("\nпробний прогін — нічого не записано. --apply щоб залити");
  process.exit(0);
}

await post("matches", matches);
await post("questions", questions);
console.log(`\nзаписано: ${matches.length} матчів і ${questions.length} питань`);
