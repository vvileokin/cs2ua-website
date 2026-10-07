import fs from "node:fs";

/**
 * П'ятий тур EPL S24, 7 жовтня — три матчі за три останні місця в плейофі.
 *
 * Їх троє, бо після четвертого туру швейцарка вже розібралась: Vitality і MOUZ
 * пройшли з 3-0, 1win, Aurora і Falcons — з 3-1, а G2, BETBOOM і Legacy
 * поїхали з 1-3. Лишилась шістка на 2-2, і вона грає між собою.
 *
 * Пари склались не випадково: у EPL сіють за початковим посівом турніру, а не
 * за Бухгольцем, і перший грає з шостим. Звідси Spirit — M80 (перший проти
 * останнього), PARIVISION — NAVI і FURIA — 9z.
 *
 * Коефіцієнти всюди від betking через HLTV — лінії виставлені на всі три.
 *
 * Очні зустрічі: Spirit і M80 не грали жодного разу, тож там порожньо. У
 * FURIA з 9z історія довга і доходить до 2024-го; лишаємо її цілою, бо
 * обрізати до 2026-го означало б показати 2:0 замість чесних 3:2.
 *
 * Час у базі в UTC, HLTV показує київський (+3).
 *
 * Запуск: node scripts/epl-round5.mjs --apply
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

const ROUND5 = [
  {
    a: "furia", b: "ninez", at: "2026-10-07T12:00:00+00:00",
    names: ["FURIA", "9z"], odds: [1.38, 3.00],
    h2h: { a: 3, b: 2, series: [
      S("2026-08-15", "Esports World Cup 2026", "2:1", "a"),
      S("2026-06-18", "IEM Cologne Major 2026", "2:1", "a"),
      S("2024-11-15", "Shanghai Major 2024 Americas RMR", "2:0", "a"),
      S("2024-04-18", "Global Esports Tour Rio 2024", "0:1", "b"),
      S("2024-02-24", "IEM Dallas 2024 SA Closed Qualifier", "1:2", "b"),
    ] },
  },
  {
    a: "parivision", b: "natus", at: "2026-10-07T14:30:00+00:00",
    names: ["PARIVISION", "Natus Vincere"], odds: [2.57, 1.50],
    h2h: { a: 0, b: 2, series: [
      S("2026-03-28", "BLAST Open Rotterdam 2026", "1:2", "b"),
      S("2026-01-31", "IEM Kraków 2026", "1:2", "b"),
    ] },
  },
  {
    a: "spirit", b: "m80", at: "2026-10-07T17:00:00+00:00",
    names: ["Spirit", "M80"], odds: [1.12, 6.00],
    h2h: null,
  },
];

const matches = ROUND5.map((m) => ({
  id: `${m.a}-vs-${m.b}-epl24`,
  tournament_slug: "esl-pro-league-s24",
  is_event: false,
  team_a: m.a, team_b: m.b,
  status: "upcoming",
  format: "BO3",
  stage: "Швейцарка · тур 5",
  start_at: m.at,
  score_a: 0, score_b: 0,
  maps: [], veto: [],
  h2h: m.h2h,
  open_questions: 1,
  max_reward: 50,
}));

const questions = ROUND5.map((m) => ({
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

for (const m of ROUND5) {
  console.log(
    `${(m.names[0] + " — " + m.names[1]).padEnd(28)} ${m.at.slice(11, 16)} UTC · ` +
    `${m.odds[0]} / ${m.odds[1]} (betking) · очні ${m.h2h ? `${m.h2h.a}:${m.h2h.b}` : "не грали"}`,
  );
}

if (!process.argv.includes("--apply")) {
  console.log("\nпробний прогін — нічого не записано. --apply щоб залити");
  process.exit(0);
}

await post("matches", matches);
await post("questions", questions);
console.log(`\nзаписано: ${matches.length} матчів і ${questions.length} питань`);
