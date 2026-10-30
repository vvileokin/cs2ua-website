import { URL_, KEY } from "./q.mjs";

/**
 * Перший тур ESL Pro League S24 — матчі, коефіцієнти й історія зустрічей.
 *
 * Історія порахована з мап-за-мапою таблиці HLTV і зведена до зустрічей:
 * у нашій картці `a`/`b` — це виграні серії, а не карти, бо підпис під числом
 * каже «особисті зустрічі».
 */
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "content-type": "application/json" };

const MATCHES = [
  {
    a: "falcons", b: "tyloo", at: "2026-10-03T09:00:00Z", odds: [1.15, 5.33],
    h2h: { a: 2, b: 0, series: [
      { date: "2026-03-22", event: "BLAST Open Rotterdam 2026", score: "2:1", winner: "a" },
      { date: "2025-11-03", event: "IEM Chengdu 2025", score: "2:0", winner: "a" },
    ] },
  },
  {
    a: "legacy", b: "parivision", at: "2026-10-03T09:00:00Z", odds: [2.20, 1.67],
    h2h: { a: 2, b: 1, series: [
      { date: "2026-06-13", event: "IEM Cologne Major 2026", score: "2:0", winner: "a" },
      { date: "2026-04-04", event: "PGL Bucharest 2026", score: "1:2", winner: "b" },
      { date: "2026-03-03", event: "ESL Pro League S23 Stage 1", score: "2:0", winner: "a" },
    ] },
  },
  { a: "vitality", b: "onewin", at: "2026-10-03T11:30:00Z", odds: [1.07, 8.50], h2h: null },
  { a: "spirit", b: "shinden", at: "2026-10-03T11:30:00Z", odds: [1.01, 15.00], h2h: null },
  {
    a: "aurora", b: "ninez", at: "2026-10-03T14:00:00Z", odds: [1.42, 2.86],
    h2h: { a: 1, b: 0, series: [
      { date: "2026-06-14", event: "IEM Cologne Major 2026", score: "2:0", winner: "a" },
    ] },
  },
  {
    a: "mouz", b: "m80", at: "2026-10-03T14:00:00Z", odds: [1.15, 5.33],
    h2h: { a: 2, b: 0, series: [
      { date: "2026-05-21", event: "CS Asia Championships 2026", score: "2:1", winner: "a" },
      { date: "2025-09-05", event: "BLAST Open London 2025 Finals", score: "2:1", winner: "a" },
    ] },
  },
  {
    a: "g2", b: "natus", at: "2026-10-03T16:30:00Z", odds: [1.70, 2.14],
    h2h: { a: 3, b: 1, series: [
      { date: "2026-08-30", event: "BLAST Open Porto 2026", score: "2:0", winner: "a" },
      { date: "2026-06-15", event: "IEM Cologne Major 2026", score: "2:1", winner: "a" },
      { date: "2026-03-07", event: "ESL Pro League S23 Stage 2", score: "2:1", winner: "a" },
      { date: "2026-02-18", event: "PGL Cluj-Napoca 2026", score: "0:2", winner: "b" },
    ] },
  },
  {
    a: "furia", b: "betboom", at: "2026-10-03T16:30:00Z", odds: [1.47, 2.67],
    h2h: { a: 2, b: 1, series: [
      { date: "2026-06-13", event: "IEM Cologne Major 2026", score: "2:0", winner: "a" },
      { date: "2025-01-19", event: "BLAST Bounty 2025 Season 1", score: "1:2", winner: "b" },
      { date: "2024-06-05", event: "YaLLa Compass 2024", score: "1:0", winner: "a" },
    ] },
  },
];

/* Назви для підписів беруться з каталогу сайту, щоб вони збігалися з гербами. */
const fs = await import("node:fs");
const src = fs.readFileSync(new URL("../src/lib/data.ts", import.meta.url), "utf8");
const NAME = new Map();
for (const m of src.matchAll(/(\w+):\s*\{\s*slug:\s*"([^"]+)",\s*name:\s*"([^"]+)"/g)) NAME.set(m[2], m[3]);

const send = async (table, body, prefer = "resolution=merge-duplicates,return=minimal") => {
  const r = await fetch(`${URL_}/rest/v1/${table}`, { method: "POST", headers: { ...H, Prefer: prefer }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`${table}: ${r.status} ${await r.text()}`);
};

const rows = [], questions = [];
for (const m of MATCHES) {
  const id = `${m.a}-vs-${m.b}-epl24`;
  rows.push({
    id, tournament_slug: "esl-pro-league-s24", is_event: false,
    team_a: m.a, team_b: m.b, status: "upcoming", format: "BO3",
    stage: "Швейцарка · тур 1", start_at: m.at,
    maps: [], veto: [], h2h: m.h2h,
    open_questions: 1, max_reward: 50,
  });
  questions.push({
    id: `q-${id}`, match_id: id, kind: "match_winner", title: "Переможець матчу",
    difficulty: "easy", status: "open", deadline_label: "до старту матчу",
    betting: true, live_odds: true,
    options: [
      { id: `${m.a}-w`, label: NAME.get(m.a) ?? m.a, reward: 50, odds: m.odds[0], open: m.odds[0] },
      { id: `${m.b}-w`, label: NAME.get(m.b) ?? m.b, reward: 50, odds: m.odds[1], open: m.odds[1] },
    ],
  });
}

if (!process.argv.includes("--apply")) {
  console.log(rows.map((r) => `${r.id.padEnd(34)} ${r.stage} · ${r.start_at} · ${r.h2h ? `h2h ${r.h2h.a}:${r.h2h.b}` : "перша зустріч"}`).join("\n"));
  console.log(`\n(пробний прогін — ${rows.length} матчів і ${questions.length} питань. --apply щоб залити)`);
  process.exit(0);
}

await send("matches", rows);
await send("questions", questions);
console.log(`залито: ${rows.length} матчів, ${questions.length} питань зі ставками`);
