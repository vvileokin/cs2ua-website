import fs from "node:fs";

/**
 * Рахунки третього туру і матчі четвертого.
 *
 * Третій тур зняв перших двох: G2 програли DENDELE і поїхали з 0-3, 9z так
 * само від TYLOO. Нагорі BETBOOM обіграли НАВІ, а FUT — Vitality, і обидва
 * пішли 3-0 у плейоф. Решта зійшлась на 2-1 і 1-2.
 *
 * Четвертий тур — шість пар, і кожна щось вирішує остаточно: у трьох парах
 * 2-1 переможець іде в плейоф, у трьох парах 1-2 той, хто програє, їде додому.
 *
 * Коефіцієнти — лінія betking. Беруться зі сторінки HLTV, і це та сама лінія:
 * п'ять із шести пар звірено проти віджета самого betking (Vitality 1.32,
 * FURIA 1.12, Spirit 1.80, Legacy 1.57, Aurora 1.35) — збіг точний.
 *
 * Запуск: node scripts/pgl-r3-results-r4.mjs --apply
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

/** Третій тур, 26 жовтня. */
const R3 = [
  ["g2-vs-sharks", 1, 2], ["betboom-vs-natus", 2, 0], ["spirit-vs-furia", 2, 1],
  ["liquid-vs-legacy", 2, 0], ["ninez-vs-tyloo", 1, 2], ["vitality-vs-fut", 1, 2],
  ["nemiga-vs-aurora", 0, 2], ["mongolz-vs-mouz", 0, 2],
];

/** Четвертий тур, 27 жовтня. Час київський +3 до UTC. */
const R4 = [
  { a: "liquid", b: "aurora", at: "2026-10-27T10:00:00+00:00",
    names: ["Liquid", "Aurora"], odds: [3.20, 1.35], h2h: null },
  { a: "nemiga", b: "sharks", at: "2026-10-27T10:00:00+00:00",
    names: ["Nemiga", "DENDELE"], odds: [1.62, 2.30], h2h: null },
  { a: "spirit", b: "mouz", at: "2026-10-27T13:00:00+00:00",
    names: ["Spirit", "MOUZ"], odds: [1.80, 2.00],
    h2h: { a: 2, b: 1, series: [
      S("2026-06-20", "IEM Cologne Major 2026", "2:1", "a"),
      S("2026-03-15", "ESL Pro League Season 23", "1:2", "b"),
      S("2026-01-25", "BLAST Bounty 2026 Season 1", "2:0", "a"),
    ] } },
  { a: "mongolz", b: "legacy", at: "2026-10-27T13:00:00+00:00",
    names: ["The MongolZ", "Legacy"], odds: [2.40, 1.57], h2h: null },
  { a: "vitality", b: "natus", at: "2026-10-27T16:00:00+00:00",
    names: ["Vitality", "Natus Vincere"], odds: [1.32, 3.33],
    h2h: { a: 3, b: 1, series: [
      S("2026-08-28", "BLAST Open Porto 2026", "2:0", "a"),
      S("2026-06-19", "IEM Cologne Major 2026", "2:1", "a"),
      S("2026-02-08", "IEM Kraków 2026", "1:2", "b"),
      S("2025-12-14", "StarLadder Budapest Major 2025", "2:1", "a"),
    ] } },
  { a: "furia", b: "tyloo", at: "2026-10-27T16:00:00+00:00",
    names: ["FURIA", "TYLOO"], odds: [1.12, 6.00], h2h: null },
];

const now = Date.now();
const matches = R4.map((m) => ({
  id: `${m.a}-vs-${m.b}-pgl26-r4`,
  tournament_slug: "pgl-masters-bucharest-2026",
  is_event: false,
  team_a: m.a, team_b: m.b,
  status: Date.parse(m.at) <= now ? "live" : "upcoming",
  format: "BO3", stage: "Швейцарка · тур 4",
  start_at: m.at, score_a: 0, score_b: 0, maps: [], veto: [],
  h2h: m.h2h, open_questions: 1, max_reward: 50,
}));

const questions = R4.map((m) => ({
  id: `q-${m.a}-vs-${m.b}-pgl26-r4`,
  match_id: `${m.a}-vs-${m.b}-pgl26-r4`,
  kind: "match_winner", title: "Переможець матчу", difficulty: "easy",
  status: "open", deadline_label: "до старту матчу", betting: true, live_odds: true,
  options: [
    { id: `${m.a}-w`, label: m.names[0], odds: m.odds[0], open: m.odds[0], reward: 50 },
    { id: `${m.b}-w`, label: m.names[1], odds: m.odds[1], open: m.odds[1], reward: 50 },
  ],
}));

console.log("тур 3 — рахунки:");
for (const [id, a, b] of R3) console.log(`  ${id.padEnd(22)} ${a}:${b}`);
console.log("\nтур 4 — матчі:");
for (const m of R4)
  console.log(`  ${(m.names[0] + " — " + m.names[1]).padEnd(28)} ${m.at.slice(11, 16)} UTC · ${m.odds[0]} / ${m.odds[1]}`);

if (!process.argv.includes("--apply")) {
  console.log("\nпробний прогін. --apply щоб записати");
} else {
  for (const [id, a, b] of R3) {
    const r = await fetch(`${SB}/rest/v1/matches?id=eq.${id}-pgl26-r3`, {
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
  console.log(`\nрахунків ${R3.length}, матчів ${matches.length}, питань ${questions.length}`);
  console.log("виплати за ставками — через адмінку");
}
