import fs from "node:fs";

/**
 * Півфінали, матч за третє місце і фінал EPL S24 — уже зіграні.
 *
 * Чвертьфінали завелись наперед і заповнились самі, а ці чотири матчі
 * заводяться постфактум: коли створювався плейоф, команд у них ще не було, а
 * матч без команд — це рядок у розкладі, а не матч.
 *
 * Питань до них не чіпляємо навмисно. Ставка на матч, який уже дограно, —
 * не ставка; `open_questions: 0` і жодного рядка в questions.
 *
 * Матч за третє місце в сітку не входить — ні в нашу, ні в ESL: з нього нікуди
 * не виходять. Він лишається звичайним матчем турніру і видно його у списку.
 *
 * Запуск: node scripts/epl-playoff-finish.mjs --apply
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

const post = async (table, rows) => {
  const r = await fetch(`${SB}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      apikey: KEY, Authorization: `Bearer ${KEY}`,
      "content-type": "application/json", Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify(rows),
  });
  if (!r.ok) throw new Error(`${table}: ${r.status} ${await r.text()}`);
};

const S = (date, event, score, winner) => ({ date, event, score, winner });

/* Очні зустрічі зняті зі сторінок HLTV, а не з пам'яті: там вони списком мап, і
   серії складені з них. Із пари Aurora — Spirit HLTV підмішує матчі Eternal
   Fire (та сама організація до перейменування); вони сюди не йдуть — на сайті
   стоїть назва команди, і підписати чужу назву своєю означало б збрехати
   читачеві рахунком. */
const GAMES = [
  {
    a: "vitality", b: "aurora", at: "2026-10-10T13:45:00+00:00",
    stage: "Плейоф · півфінал", format: "BO3", score: [2, 1],
    h2h: { a: 3, b: 1, series: [
      S("2026-09-20", "StarLadder StarSeries Fall 2026", "3:1", "a"),
      S("2026-09-19", "StarLadder StarSeries Fall 2026", "1:2", "b"),
      S("2026-03-28", "BLAST Open Rotterdam 2026", "2:0", "a"),
      S("2026-02-20", "PGL Cluj-Napoca 2026", "2:0", "a"),
    ] },
  },
  {
    a: "spirit", b: "mouz", at: "2026-10-10T17:00:00+00:00",
    stage: "Плейоф · півфінал", format: "BO3", score: [1, 2],
    h2h: { a: 1, b: 2, series: [
      S("2026-10-05", "ESL Pro League Season 24", "0:2", "b"),
      S("2026-09-06", "BLAST Open Porto 2026", "3:1", "a"),
      S("2026-08-02", "BLAST Bounty 2026 Season 2 Finals", "1:3", "b"),
    ] },
  },
  {
    a: "aurora", b: "spirit", at: "2026-10-11T11:30:00+00:00",
    stage: "Плейоф · за 3-тє місце", format: "BO3", score: [2, 0],
    h2h: { a: 0, b: 1, series: [
      S("2026-06-12", "IEM Cologne Major 2026", "1:2", "b"),
    ] },
  },
  {
    a: "vitality", b: "mouz", at: "2026-10-11T15:00:00+00:00",
    stage: "Плейоф · фінал", format: "BO5", score: [3, 0],
    h2h: { a: 4, b: 1, series: [
      S("2026-09-05", "BLAST Open Porto 2026", "0:2", "b"),
      S("2026-06-13", "IEM Cologne Major 2026", "2:1", "a"),
      S("2026-02-16", "PGL Cluj-Napoca 2026", "2:0", "a"),
      S("2026-02-07", "IEM Kraków 2026", "2:0", "a"),
      S("2025-11-08", "IEM Chengdu 2025", "2:1", "a"),
    ] },
  },
];

const matches = GAMES.map((m) => ({
  id: `${m.a}-vs-${m.b}-epl24`,
  tournament_slug: "esl-pro-league-s24",
  is_event: false,
  team_a: m.a, team_b: m.b,
  status: "finished",
  format: m.format,
  stage: m.stage,
  start_at: m.at,
  score_a: m.score[0], score_b: m.score[1],
  maps: [], veto: [],
  h2h: m.h2h,
  open_questions: 0,
  max_reward: 0,
}));

for (const m of GAMES) {
  console.log(`${m.stage.padEnd(26)} ${(m.a + " " + m.score[0] + ":" + m.score[1] + " " + m.b).padEnd(28)} ${m.at.slice(0, 16)} ${m.format}`);
}

if (!process.argv.includes("--apply")) {
  console.log("\nпробний прогін — нічого не записано. --apply щоб залити");
  process.exit(0);
}

await post("matches", matches);
console.log(`\nзаписано: ${matches.length} матчів`);
