import fs from "node:fs";

/**
 * Перший тур PGL Masters Bucharest 2026, 24 жовтня — вісім пар швейцарки.
 *
 * Пари тут не виводяться з посіву, як у EPL, а тягнуться жеребом усередині
 * кошиків: тому порядок узято зі сторінки події, а не порахований. Звідси ж і
 * те, що в першому турі зійшлись G2 з NAVI — дві команди з верхньої половини,
 * чого при посівному зведенні першого з дев'ятим не сталося б.
 *
 * Коефіцієнти від betking через HLTV, зняті вранці 24 жовтня. Варто сказати
 * окремо: на G2 — NAVI лінія ставить фаворитом NAVI (1.70 проти 2.14), хоча
 * за очками VRS G2 вищі на 278 пунктів. Букмекер бачить форму, рейтинг —
 * півроку результатів; ми ставимо те, що на лінії, і не правимо його під
 * модель.
 *
 * Очні зустрічі — зі сторінок матчів HLTV, серіями, а не картами. MOUZ з
 * Liquid і Legacy з Nemiga не грали жодного разу, тож там порожньо.
 *
 * Час у базі в UTC, HLTV показує київський (+3). Статус рахується від
 * поточного часу: матч, який уже почався, заливається як «live», решта — як
 * «upcoming». Тож скрипт можна ганяти серед дня, не правлячи його руками.
 *
 * Запуск: node scripts/pgl-round1.mjs --apply
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

const ROUND1 = [
  {
    a: "aurora", b: "mongolz", at: "2026-10-24T07:00:00+00:00",
    names: ["Aurora", "The MongolZ"], odds: [1.36, 3.10],
    h2h: { a: 2, b: 3, series: [
      S("2026-05-13", "PGL Astana 2026", "2:0", "a"),
      S("2026-03-27", "BLAST Open Rotterdam 2026", "2:0", "a"),
      S("2026-03-07", "ESL Pro League Season 23 Stage 2", "0:2", "b"),
      S("2025-10-19", "Thunderpick World Championship 2025", "1:2", "b"),
      S("2025-08-24", "Esports World Cup 2025", "0:2", "b"),
    ] },
  },
  {
    a: "fut", b: "tyloo", at: "2026-10-24T07:00:00+00:00",
    names: ["FUT", "TYLOO"], odds: [1.22, 4.20],
    h2h: { a: 2, b: 0, series: [
      S("2026-08-12", "Esports World Cup 2026", "1:0", "a"),
      S("2026-06-06", "IEM Cologne Major 2026 Stage 2", "1:0", "a"),
    ] },
  },
  {
    a: "spirit", b: "betboom", at: "2026-10-24T10:00:00+00:00",
    names: ["Spirit", "BetBoom Team"], odds: [1.25, 4.00],
    h2h: { a: 1, b: 0, series: [
      S("2026-06-06", "IEM Cologne Major 2026 Stage 2", "1:0", "a"),
    ] },
  },
  {
    a: "mouz", b: "liquid", at: "2026-10-24T10:00:00+00:00",
    names: ["MOUZ", "Liquid"], odds: [1.15, 5.33],
    h2h: null,
  },
  {
    a: "vitality", b: "ninez", at: "2026-10-24T13:00:00+00:00",
    names: ["Vitality", "9z"], odds: [1.12, 6.00],
    h2h: { a: 3, b: 2, series: [
      S("2026-08-29", "BLAST Open Porto 2026", "2:0", "a"),
      S("2026-06-12", "IEM Cologne Major 2026", "1:2", "b"),
      S("2026-03-19", "BLAST Open Rotterdam 2026", "2:0", "a"),
      S("2024-10-07", "IEM Rio 2024", "1:0", "a"),
      S("2024-05-30", "IEM Dallas 2024", "0:2", "b"),
    ] },
  },
  {
    a: "legacy", b: "nemiga", at: "2026-10-24T13:00:00+00:00",
    names: ["Legacy", "Nemiga"], odds: [1.35, 3.20],
    h2h: null,
  },
  {
    a: "g2", b: "natus", at: "2026-10-24T16:00:00+00:00",
    names: ["G2", "Natus Vincere"], odds: [2.14, 1.70],
    h2h: { a: 3, b: 1, series: [
      S("2026-10-03", "ESL Pro League Season 24", "0:2", "b"),
      S("2026-08-30", "BLAST Open Porto 2026", "2:0", "a"),
      S("2026-06-15", "IEM Cologne Major 2026", "2:1", "a"),
      S("2026-03-07", "ESL Pro League Season 23 Stage 2", "2:1", "a"),
    ] },
  },
  {
    a: "furia", b: "sharks", at: "2026-10-24T16:00:00+00:00",
    names: ["FURIA", "DENDELE"], odds: [1.20, 4.50],
    h2h: { a: 0, b: 1, series: [
      S("2026-07-25", "BLAST Bounty 2026 Season 2", "1:2", "b"),
    ] },
  },
];

const now = Date.now();
const matches = ROUND1.map((m) => ({
  id: `${m.a}-vs-${m.b}-pgl26`,
  tournament_slug: "pgl-masters-bucharest-2026",
  is_event: false,
  team_a: m.a, team_b: m.b,
  status: Date.parse(m.at) <= now ? "live" : "upcoming",
  format: "BO3",
  stage: "Швейцарка · тур 1",
  start_at: m.at,
  score_a: 0, score_b: 0,
  maps: [], veto: [],
  h2h: m.h2h,
  open_questions: 1,
  max_reward: 50,
}));

const questions = ROUND1.map((m) => ({
  id: `q-${m.a}-vs-${m.b}-pgl26`,
  match_id: `${m.a}-vs-${m.b}-pgl26`,
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
  const src = ROUND1.find((x) => `${x.a}-vs-${x.b}-pgl26` === m.id);
  console.log(
    `${(src.names[0] + " — " + src.names[1]).padEnd(30)} ${m.start_at.slice(11, 16)} UTC · ` +
    `${String(m.status).padEnd(8)} ${src.odds[0]} / ${src.odds[1]} (betking) · ` +
    `очні ${src.h2h ? `${src.h2h.a}:${src.h2h.b}` : "не грали"}`,
  );
}

if (!process.argv.includes("--apply")) {
  console.log("\nпробний прогін — нічого не записано. --apply щоб залити");
  process.exit(0);
}

await post("matches", matches);
await post("questions", questions);
console.log(`\nзаписано: ${matches.length} матчів і ${questions.length} питань`);
