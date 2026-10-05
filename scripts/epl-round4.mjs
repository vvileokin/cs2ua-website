import fs from "node:fs";

/**
 * Четвертий тур EPL S24, 6 жовтня — шість матчів.
 *
 * Їх шість, а не вісім, бо швейцарка вже почала виносити: хто дійшов до трьох
 * перемог, зіграв своє, хто до трьох поразок — поїхав.
 *
 * Коефіцієнти беремо в букмекера, де він їх виставив: Falcons — NAVI, FURIA —
 * Aurora і Legacy — M80 ідуть із betking через HLTV. На три ранні матчі ліній
 * ще немає, там рахує наша модель із маржею 5,8%.
 *
 * Варто знати, що на цих парах модель і букмекер розходяться сильніше за
 * звичне: на Falcons вона дає 75,8% проти 63,2% у букмекера, на Legacy — 77,0
 * проти 58,4. Різниця в тому, що очки VRS нічого не знають про форму тижня, а
 * букмекер знає; тому там, де лінія є, стоїть саме вона.
 *
 * Час у базі в UTC, HLTV показує київський (+3).
 *
 * Запуск: node scripts/epl-round4.mjs --apply
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
  const r = await fetch(`${SB}/rest/v1/${table}`, {
    method: "POST",
    headers: { ...headers, Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify(rows),
  });
  if (!r.ok) throw new Error(`${table}: ${r.status} ${await r.text()}`);
};

const S = (date, event, score, winner) => ({ date, event, score, winner });

const ROUND4 = [
  {
    a: "spirit", b: "onewin", at: "2026-10-06T12:00:00+00:00",
    names: ["Spirit", "1win"], odds: [1.10, 6.76], priced: "модель",
    h2h: null,
  },
  {
    a: "g2", b: "parivision", at: "2026-10-06T12:00:00+00:00",
    names: ["G2", "PARIVISION"], odds: [1.23, 4.07], priced: "модель",
    h2h: { a: 1, b: 1, series: [
      S("2026-05-12", "PGL Astana 2026", "2:1", "a"),
      S("2026-02-15", "PGL Cluj-Napoca 2026", "1:2", "b"),
    ] },
  },
  {
    a: "aurora", b: "furia", at: "2026-10-06T14:30:00+00:00",
    names: ["Aurora", "FURIA"], odds: [1.92, 1.84], priced: "betking",
    h2h: { a: 1, b: 3, series: [
      S("2026-08-20", "Esports World Cup 2026", "1:2", "b"),
      S("2026-06-20", "IEM Cologne Major 2026", "0:2", "b"),
      S("2026-03-21", "BLAST Open Rotterdam 2026", "2:0", "a"),
      S("2026-02-06", "IEM Kraków 2026", "0:2", "b"),
    ] },
  },
  {
    a: "ninez", b: "betboom", at: "2026-10-06T14:30:00+00:00",
    names: ["9z", "BETBOOM"], odds: [2.04, 1.76], priced: "модель",
    h2h: null,
  },
  {
    a: "natus", b: "falcons", at: "2026-10-06T17:00:00+00:00",
    names: ["Natus Vincere", "Falcons"], odds: [2.56, 1.49], priced: "betking",
    h2h: { a: 1, b: 3, series: [
      S("2026-06-15", "IEM Cologne Major 2026", "1:2", "b"),
      S("2026-03-20", "BLAST Open Rotterdam 2026", "2:1", "a"),
      S("2025-10-05", "ESL Pro League Season 22", "0:2", "b"),
      S("2025-04-22", "IEM Melbourne 2025", "1:2", "b"),
    ] },
  },
  {
    a: "m80", b: "legacy", at: "2026-10-06T17:00:00+00:00",
    names: ["M80", "Legacy"], odds: [2.26, 1.61], priced: "betking",
    h2h: { a: 0, b: 2, series: [
      S("2026-06-08", "IEM Cologne Major 2026 Stage 2", "0:2", "b"),
      S("2026-05-12", "IEM Atlanta 2026", "0:2", "b"),
    ] },
  },
];

const matches = ROUND4.map((m) => ({
  id: `${m.a}-vs-${m.b}-epl24`,
  tournament_slug: "esl-pro-league-s24",
  is_event: false,
  team_a: m.a, team_b: m.b,
  status: "upcoming",
  format: "BO3",
  stage: "Швейцарка · тур 4",
  start_at: m.at,
  score_a: 0, score_b: 0,
  maps: [], veto: [],
  h2h: m.h2h,
  open_questions: 1,
  max_reward: 50,
}));

const questions = ROUND4.map((m) => ({
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

for (const m of ROUND4) {
  console.log(
    `${(m.names[0] + " — " + m.names[1]).padEnd(28)} ${m.at.slice(11, 16)} UTC · ` +
    `${m.odds[0]} / ${m.odds[1]} (${m.priced}) · очні ${m.h2h ? `${m.h2h.a}:${m.h2h.b}` : "не грали"}`,
  );
}

if (!process.argv.includes("--apply")) {
  console.log("\nпробний прогін — нічого не записано. --apply щоб залити");
  process.exit(0);
}

await post("matches", matches);
await post("questions", questions);
console.log(`\nзаписано: ${matches.length} матчів і ${questions.length} питань`);
