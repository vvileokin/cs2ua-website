import fs from "node:fs";

/**
 * Другий тур EPL S24: вісім матчів із парами, часом, очними зустрічами й ставками.
 *
 * Пари й час узято з HLTV (сторінка події 8244), очні зустрічі — зі сторінки
 * кожного матчу, зведені з мап у серії: HLTV показує «Head to head» по мапах, а
 * картка матчу в нас рахує серії.
 *
 * Коефіцієнти там, де HLTV їх показує, — його; для трьох пар, яких у віджеті не
 * було (9z — TYLOO, G2 — 1win, BETBOOM — M80), вони пораховані моделлю з тією
 * самою маржею 5.8%, яку дають решта п'ять. Збіг моделі з букмекером на відомих
 * парах: 81.7 проти 77.3, 58.1 проти 57.4, 47.3 проти 45.0, 75.5 проти 74.9.
 *
 * Час у базі в UTC; HLTV показує київський, тобто +3.
 *
 * Запуск: node scripts/epl-round2.mjs --apply
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

const api = async (path, init = {}) => {
  const r = await fetch(`${SB}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "content-type": "application/json", ...(init.headers ?? {}) },
  });
  if (!r.ok) throw new Error(`${path}: ${r.status} ${await r.text()}`);
  /* PostgREST на вставці відповідає 201 із порожнім тілом, якщо не просити
     повернення рядків — json() на такому падає. */
  const body = await r.text();
  return body ? JSON.parse(body) : null;
};

const S = (date, event, score, winner) => ({ date, event, score, winner });

const ROUND2 = [
  {
    a: "spirit", b: "parivision", at: "2026-10-04T09:00:00+00:00",
    odds: [1.23, 4.20], names: ["Spirit", "PARIVISION"],
    h2h: { a: 0, b: 2, series: [
      S("2026-03-21", "BLAST Open Rotterdam 2026", "0:2", "b"),
      S("2026-01-23", "BLAST Bounty 2026 Season 1 Finals", "1:2", "b"),
    ] },
  },
  {
    a: "shinden", b: "legacy", at: "2026-10-04T09:00:00+00:00",
    odds: [4.50, 1.20], names: ["ShindeN", "Legacy"],
    /* Не грали між собою — краще без блоку, ніж із порожнім. */
    h2h: null,
  },
  {
    a: "falcons", b: "aurora", at: "2026-10-04T11:30:00+00:00",
    odds: [1.64, 2.21], names: ["Falcons", "Aurora"],
    h2h: { a: 0, b: 2, series: [
      S("2026-02-01", "IEM Kraków 2026", "1:2", "b"),
      S("2025-08-23", "Esports World Cup 2025", "0:2", "b"),
    ] },
  },
  {
    a: "ninez", b: "tyloo", at: "2026-10-04T11:30:00+00:00",
    odds: [1.50, 2.57], names: ["9z", "TYLOO"],
    h2h: { a: 2, b: 0, series: [
      S("2026-07-09", "XSE Pro League Guangzhou 2026", "2:1", "a"),
      S("2026-06-08", "IEM Cologne Major 2026 Stage 2", "2:0", "a"),
    ] },
  },
  {
    a: "furia", b: "mouz", at: "2026-10-04T14:00:00+00:00",
    odds: [2.09, 1.71], names: ["FURIA", "MOUZ"],
    h2h: { a: 3, b: 1, series: [
      S("2026-09-19", "StarLadder StarSeries Fall 2026", "2:1", "a"),
      S("2026-06-12", "IEM Cologne Major 2026", "2:1", "a"),
      S("2026-04-16", "IEM Rio 2026", "2:0", "a"),
      S("2025-11-05", "IEM Chengdu 2025", "1:2", "b"),
    ] },
  },
  {
    a: "g2", b: "onewin", at: "2026-10-04T14:00:00+00:00",
    odds: [1.23, 4.07], names: ["G2", "1win"],
    h2h: null,
  },
  {
    a: "vitality", b: "natus", at: "2026-10-04T16:30:00+00:00",
    odds: [1.26, 3.75], names: ["Vitality", "Natus Vincere"],
    h2h: { a: 3, b: 1, series: [
      S("2026-05-16", "IEM Atlanta 2026", "1:2", "b"),
      S("2026-05-03", "BLAST Rivals 2026 Season 1", "3:0", "a"),
      S("2026-04-17", "IEM Rio 2026", "2:0", "a"),
      S("2026-03-29", "BLAST Open Rotterdam 2026", "3:0", "a"),
    ] },
  },
  {
    a: "betboom", b: "m80", at: "2026-10-04T16:30:00+00:00",
    odds: [1.66, 2.18], names: ["BETBOOM", "M80"],
    h2h: { a: 3, b: 0, series: [
      S("2026-06-07", "IEM Cologne Major 2026 Stage 2", "1:0", "a"),
      S("2024-04-27", "ESL Pro League Season 19", "2:1", "a"),
      S("2024-04-23", "ESL Pro League Season 19", "2:1", "a"),
    ] },
  },
];

const matches = ROUND2.map((m) => ({
  id: `${m.a}-vs-${m.b}-epl24`,
  tournament_slug: "esl-pro-league-s24",
  is_event: false,
  team_a: m.a, team_b: m.b,
  status: "upcoming",
  format: "BO3",
  stage: "Швейцарка · тур 2",
  start_at: m.at,
  score_a: 0, score_b: 0,
  maps: [], veto: [],
  h2h: m.h2h,
  open_questions: 1,
  max_reward: 50,
}));

const questions = ROUND2.map((m) => ({
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

for (const m of matches) {
  const r = ROUND2.find((x) => `${x.a}-vs-${x.b}-epl24` === m.id);
  console.log(
    `${m.id.padEnd(30)} ${m.start_at.slice(11, 16)} UTC · ${r.odds[0]} / ${r.odds[1]}` +
    ` · очні ${r.h2h ? `${r.h2h.a}:${r.h2h.b} (${r.h2h.series.length})` : "немає"}`,
  );
}

if (!APPLY) {
  console.log("\nпробний прогін — нічого не записано. --apply щоб залити");
  process.exit(0);
}

await api("matches", {
  method: "POST",
  headers: { Prefer: "resolution=merge-duplicates" },
  body: JSON.stringify(matches),
});
await api("questions", {
  method: "POST",
  headers: { Prefer: "resolution=merge-duplicates" },
  body: JSON.stringify(questions),
});
console.log(`\nзаписано: ${matches.length} матчів і ${questions.length} питань`);
