import fs from "node:fs";

/**
 * Третій тур PGL Masters Bucharest, 26 жовтня — вісім пар.
 *
 * Тур, у якому швейцарка починає різати. Vitality — FUT і BETBOOM — НАВІ
 * грають за 3-0 і місце в плейофі; 9z — TYLOO і G2 — DENDELE грають за те,
 * щоб не поїхати додому з 0-3. Посередині чотири пари з рахунком 1-1.
 *
 * Коефіцієнтів на жоден матч ще немає — пари склались пізно ввечері, і лінії
 * виставлять уночі. Тому матчі заводяться без питань: картки стоять у сітці,
 * ставки відкриються окремим прогоном, коли буде що показувати.
 *
 * Очні — серіями зі сторінок матчів. Де HLTV обрізає список на десятій карті,
 * береться рівно стільки повних серій, скільки видно, і нічого не
 * добирається з голови.
 *
 * Запуск: node scripts/pgl-round3.mjs --apply
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

const R3 = [
  { a: "mongolz", b: "mouz", at: "2026-10-26T07:00:00+00:00", names: ["The MongolZ", "MOUZ"],
    h2h: { a: 1, b: 2, series: [
      S("2026-03-19", "BLAST Open Rotterdam 2026", "2:0", "a"),
      S("2026-03-08", "ESL Pro League Season 23 Stage 2", "0:2", "b"),
      S("2026-02-22", "PGL Cluj-Napoca 2026", "0:2", "b"),
    ] } },
  { a: "nemiga", b: "aurora", at: "2026-10-26T07:00:00+00:00", names: ["Nemiga", "Aurora"], h2h: null },
  { a: "vitality", b: "fut", at: "2026-10-26T10:00:00+00:00", names: ["Vitality", "FUT"],
    h2h: { a: 2, b: 0, series: [
      S("2026-08-31", "BLAST Open Porto 2026", "2:0", "a"),
      S("2026-06-11", "IEM Cologne Major 2026", "2:1", "a"),
    ] } },
  { a: "ninez", b: "tyloo", at: "2026-10-26T10:00:00+00:00", names: ["9z", "TYLOO"],
    h2h: { a: 2, b: 0, series: [
      S("2026-10-04", "ESL Pro League Season 24", "2:0", "a"),
      S("2026-07-09", "XSE Pro League Guangzhou 2026", "2:1", "a"),
    ] } },
  { a: "spirit", b: "furia", at: "2026-10-26T13:00:00+00:00", names: ["Spirit", "FURIA"],
    h2h: { a: 2, b: 1, series: [
      S("2026-08-31", "BLAST Open Porto 2026", "2:0", "a"),
      S("2026-05-11", "PGL Astana 2026", "2:1", "a"),
      S("2026-02-07", "IEM Kraków 2026", "1:2", "b"),
    ] } },
  { a: "liquid", b: "legacy", at: "2026-10-26T13:00:00+00:00", names: ["Liquid", "Legacy"], h2h: null },
  { a: "betboom", b: "natus", at: "2026-10-26T16:00:00+00:00", names: ["BetBoom Team", "Natus Vincere"],
    h2h: { a: 0, b: 1, series: [
      S("2026-05-17", "IEM Atlanta 2026", "0:2", "b"),
    ] } },
  { a: "g2", b: "sharks", at: "2026-10-26T16:00:00+00:00", names: ["G2", "DENDELE"], h2h: null },
];

const now = Date.now();
const matches = R3.map((m) => ({
  id: `${m.a}-vs-${m.b}-pgl26-r3`,
  tournament_slug: "pgl-masters-bucharest-2026",
  is_event: false,
  team_a: m.a, team_b: m.b,
  status: Date.parse(m.at) <= now ? "live" : "upcoming",
  format: "BO3",
  stage: "Швейцарка · тур 3",
  start_at: m.at,
  score_a: 0, score_b: 0,
  maps: [], veto: [],
  h2h: m.h2h,
  open_questions: 0,
  max_reward: 50,
}));

for (const m of R3)
  console.log(`${(m.names[0] + " — " + m.names[1]).padEnd(30)} ${m.at.slice(11, 16)} UTC · очні ${m.h2h ? `${m.h2h.a}:${m.h2h.b}` : "не грали"}`);

if (!process.argv.includes("--apply")) {
  console.log("\nпробний прогін. --apply щоб залити");
} else {
  const r = await fetch(`${SB}/rest/v1/matches`, {
    method: "POST", headers: { ...headers, Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify(matches),
  });
  if (!r.ok) throw new Error(`matches: ${r.status} ${await r.text()}`);
  console.log(`\nзаписано матчів: ${matches.length}, усі без питань — чекають на лінії`);
}
