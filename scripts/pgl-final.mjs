import fs from "node:fs";

/**
 * Гранд-фінал і бронза PGL Masters Bucharest — 31 жовтня, зі ставками.
 *
 * Півфінали дограно: Nemiga 2-0 Vitality, FURIA 2-1 MOUZ. Nemiga вперше
 * у фіналі події такого рівня, і лінія це бачить — 3.10 проти 1.36.
 *
 * Коефіцієнти — betking через HLTV. Київ на UTC+2, тож 13:00 за Києвом
 * у базі стоїть як 11:00.
 *
 * Запуск: node scripts/pgl-final.mjs --apply
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

const M = [
  { id: "pgl26-gf", a: "nemiga", b: "furia", at: "2026-10-31T11:00:00+00:00",
    names: ["Nemiga", "FURIA"], odds: [3.10, 1.36], format: "BO5",
    stage: "Плей-оф · гранд-фінал",
    /* Жодного разу не грали між собою — у фінал ідуть наосліп. */
    h2h: { a: 0, b: 0, series: [] } },
  { id: "pgl26-bronze", a: "vitality", b: "mouz", at: "2026-10-31T08:00:00+00:00",
    names: ["Vitality", "MOUZ"], odds: [1.76, 2.03], format: "BO3",
    stage: "Плей-оф · матч за третє місце",
    h2h: { a: 2, b: 1, series: [
      S("2026-10-11", "ESL Pro League Season 24", "3:0", "a"),
      S("2026-09-05", "BLAST Open Porto 2026", "0:2", "b"),
      S("2026-06-13", "IEM Cologne Major 2026", "2:1", "a"),
    ] } },
];

const now = Date.now();
const matches = M.map((m) => ({
  id: m.id,
  tournament_slug: "pgl-masters-bucharest-2026",
  is_event: false, team_a: m.a, team_b: m.b,
  status: Date.parse(m.at) <= now ? "live" : "upcoming",
  format: m.format, stage: m.stage,
  start_at: m.at, score_a: 0, score_b: 0, maps: [], veto: [],
  h2h: m.h2h, open_questions: 1, max_reward: 50,
}));

const questions = M.map((m) => ({
  id: `q-${m.id}`,
  match_id: m.id,
  kind: "match_winner", title: "Переможець матчу", difficulty: "easy",
  status: "open", deadline_label: "до старту матчу",
  betting: true, live_odds: true,
  options: [
    { id: `${m.a}-w`, label: m.names[0], odds: m.odds[0], open: m.odds[0], reward: "50" },
    { id: `${m.b}-w`, label: m.names[1], odds: m.odds[1], open: m.odds[1], reward: "50" },
  ],
}));

console.log("PGL Masters Bucharest, 31 жовтня\n");
for (const m of M) {
  const kyiv = new Date(Date.parse(m.at) + 2 * 3600_000).toISOString().slice(11, 16);
  console.log(`  ${kyiv}  ${m.names[0].padEnd(10)}${String(m.odds[0]).padStart(6)}` +
    `   ${m.names[1].padEnd(10)}${String(m.odds[1]).padStart(6)}   ${m.format}  ${m.id}`);
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
console.log(`\nзаписано ${matches.length} матчі і ${questions.length} питання`);
