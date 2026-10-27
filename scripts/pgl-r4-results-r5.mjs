import fs from "node:fs";

/**
 * Рахунки четвертого туру і три матчі пʼятого.
 *
 * Четвертий тур розвів поле остаточно. Vitality, MOUZ і Aurora виграли свої
 * пари 2-1 і пішли 3-1 у плейоф; TYLOO, Legacy і DENDELE програли свої 1-2 і
 * поїхали з 1-3. Лишилось шестеро на 2-2 — і завтра вони грають між собою за
 * три останні місця в сітці.
 *
 * Тому кожен із трьох матчів пʼятого туру однаковий за ціною: переможець у
 * плейофі, той, хто програв, завершує турнір на 9-11 місці.
 *
 * Коефіцієнти — лінія betking, звірена проти їхнього ж віджета по всіх трьох
 * парах: MongolZ 1.57, Liquid 3.20, Spirit 1.36. Збіг точний.
 *
 * Запуск: node scripts/pgl-r4-results-r5.mjs --apply
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

/** Четвертий тур, 27 жовтня. */
const R4 = [
  ["vitality-vs-natus", 2, 0], ["furia-vs-tyloo", 2, 0], ["spirit-vs-mouz", 1, 2],
  ["mongolz-vs-legacy", 2, 0], ["liquid-vs-aurora", 1, 2], ["nemiga-vs-sharks", 2, 0],
];

/** Пʼятий тур, 28 жовтня. Час київський +3 до UTC. */
const R5 = [
  { a: "mongolz", b: "nemiga", at: "2026-10-28T10:00:00+00:00",
    names: ["The MongolZ", "Nemiga"], odds: [1.57, 2.40], h2h: null },
  { a: "liquid", b: "furia", at: "2026-10-28T13:00:00+00:00",
    names: ["Liquid", "FURIA"], odds: [3.20, 1.35],
    h2h: { a: 1, b: 2, series: [
      S("2026-07-18", "BLAST Bounty 2026 Season 2", "0:2", "b"),
      S("2026-04-12", "IEM Rio 2026", "2:1", "a"),
      S("2026-01-22", "BLAST Bounty 2026 Season 1", "1:2", "b"),
    ] } },
  { a: "spirit", b: "natus", at: "2026-10-28T16:00:00+00:00",
    names: ["Spirit", "Natus Vincere"], odds: [1.36, 3.10],
    h2h: { a: 3, b: 1, series: [
      S("2026-09-05", "BLAST Open Porto 2026", "2:1", "a"),
      S("2026-06-21", "IEM Cologne Major 2026", "2:0", "a"),
      S("2026-03-14", "ESL Pro League Season 23", "1:2", "b"),
      S("2026-01-18", "BLAST Bounty 2026 Season 1", "2:0", "a"),
    ] } },
];

const now = Date.now();
const matches = R5.map((m) => ({
  id: `${m.a}-vs-${m.b}-pgl26-r5`,
  tournament_slug: "pgl-masters-bucharest-2026",
  is_event: false, team_a: m.a, team_b: m.b,
  status: Date.parse(m.at) <= now ? "live" : "upcoming",
  format: "BO3", stage: "Швейцарка · тур 5",
  start_at: m.at, score_a: 0, score_b: 0, maps: [], veto: [],
  h2h: m.h2h, open_questions: 1, max_reward: 50,
}));

const questions = R5.map((m) => ({
  id: `q-${m.a}-vs-${m.b}-pgl26-r5`,
  match_id: `${m.a}-vs-${m.b}-pgl26-r5`,
  kind: "match_winner", title: "Переможець матчу", difficulty: "easy",
  status: "open", deadline_label: "до старту матчу", betting: true, live_odds: true,
  options: [
    { id: `${m.a}-w`, label: m.names[0], odds: m.odds[0], open: m.odds[0], reward: 50 },
    { id: `${m.b}-w`, label: m.names[1], odds: m.odds[1], open: m.odds[1], reward: 50 },
  ],
}));

console.log("тур 4 — рахунки:");
for (const [id, a, b] of R4) console.log(`  ${id.padEnd(20)} ${a}:${b}`);
console.log("\nтур 5 — за три місця в плейофі:");
for (const m of R5)
  console.log(`  ${(m.names[0] + " — " + m.names[1]).padEnd(28)} ${m.at.slice(11, 16)} UTC · ${m.odds[0]} / ${m.odds[1]}`);

if (!process.argv.includes("--apply")) {
  console.log("\nпробний прогін. --apply щоб записати");
} else {
  for (const [id, a, b] of R4) {
    const r = await fetch(`${SB}/rest/v1/matches?id=eq.${id}-pgl26-r4`, {
      method: "PATCH", headers,
      body: JSON.stringify({ score_a: a, score_b: b, status: "finished" }),
    });
    if (!r.ok) throw new Error(`${id}: ${r.status} ${await r.text()}`);
  }
  for (const [table, rows] of [["matches", matches], ["questions", questions]]) {
    const r = await fetch(`${SB}/rest/v1/${table}`, {
      method: "POST", headers: { ...headers, Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify(rows),
    });
    if (!r.ok) throw new Error(`${table}: ${r.status} ${await r.text()}`);
  }
  console.log(`\nрахунків ${R4.length}, матчів ${matches.length}, питань ${questions.length}`);
}
