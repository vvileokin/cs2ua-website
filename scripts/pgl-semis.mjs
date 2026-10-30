import fs from "node:fs";

/**
 * Півфінали PGL Masters Bucharest — 30 жовтня, зі ставками.
 *
 * Чвертьфінали дограно: Nemiga 2-1 FUT, Vitality 2-1 НАВІ, MOUZ 2-0 Aurora,
 * FURIA 2-0 BETBOOM. Ідентифікатори — ті, що вже чекають у playoff.ts.
 *
 * Коефіцієнти — betking через HLTV, зняті ввечері 29 жовтня.
 * Київ на UTC+2, тож час у базі — показаний мінус дві години.
 *
 * Запуск: node scripts/pgl-semis.mjs --apply
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

const SF = [
  { id: "pgl26-sf1", a: "nemiga", b: "vitality", at: "2026-10-30T12:00:00+00:00",
    names: ["Nemiga", "Vitality"], odds: [6.00, 1.12],
    /* Найбільший розрив у лінії за весь турнір: шість до одного. */
    h2h: { a: 0, b: 1, series: [
      S("2026-09-17", "SL StarSeries Fall 2026", "0:2", "b"),
    ] } },
  { id: "pgl26-sf2", a: "mouz", b: "furia", at: "2026-10-30T15:00:00+00:00",
    names: ["MOUZ", "FURIA"], odds: [1.55, 2.45],
    h2h: { a: 2, b: 1, series: [
      S("2026-08-23", "Esports World Cup 2026", "2:0", "a"),
      S("2026-06-19", "IEM Cologne Major 2026", "1:2", "b"),
      S("2026-03-08", "ESL Pro League Season 23", "2:1", "a"),
    ] } },
];

const now = Date.now();
const matches = SF.map((m) => ({
  id: m.id,
  tournament_slug: "pgl-masters-bucharest-2026",
  is_event: false, team_a: m.a, team_b: m.b,
  status: Date.parse(m.at) <= now ? "live" : "upcoming",
  format: "BO3", stage: "Плей-оф · півфінал",
  start_at: m.at, score_a: 0, score_b: 0, maps: [], veto: [],
  h2h: m.h2h, open_questions: 1, max_reward: 50,
}));

const questions = SF.map((m) => ({
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

console.log("півфінали PGL Masters Bucharest, 30 жовтня\n");
for (const m of SF) {
  const kyiv = new Date(Date.parse(m.at) + 2 * 3600_000).toISOString().slice(11, 16);
  console.log(`  ${kyiv}  ${m.names[0].padEnd(12)}${String(m.odds[0]).padStart(6)}` +
    `   ${m.names[1].padEnd(12)}${String(m.odds[1]).padStart(6)}   ${m.id}`);
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
console.log(`\nзаписано ${matches.length} матчів і ${questions.length} питань`);
