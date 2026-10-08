import fs from "node:fs";

/**
 * Чвертьфінали EPL S24, 9 жовтня.
 *
 * Швейцарка скінчилась: восьмеро пройшли, і сітка плейофа опублікована цілком,
 * тож пари відомі наперед — на відміну від кожного туру швейцарки, де їх
 * доводилось чекати.
 *
 * Коефіцієнтів у букмекера на ці матчі ще немає — лінії на плейоф він виставляє
 * ближче до дня. Тому тут рахує наша модель: ймовірність із різниці очок VRS за
 * тим самим дільником, що і прогноз (817,4) і глікківським g, зверху маржа
 * 5,8% — та сама, що в четвертому турі. Коли лінії з'являться, їх варто
 * перезалити: модель не знає ні форми тижня, ні того, хто як виглядав у
 * швейцарці.
 *
 * Півфінали й фінал сюди не заводяться: команд у них поки немає, а матч без
 * команд — це не матч, а рядок у розкладі. Сітка на сторінці турніру малює їх
 * порожніми картками сама.
 *
 * Час у базі в UTC, HLTV показує київський (+3).
 *
 * Запуск: node scripts/epl-playoff.mjs --apply
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

/* Очки VRS станом на 8 жовтня — з них і рахується лінія. */
const VRS = {
  Spirit: 2004, Vitality: 1961, MOUZ: 1945, Falcons: 1899,
  FURIA: 1834, Aurora: 1813, PARIVISION: 1607, "1win": 1555,
};
const Q = Math.log(10) / 400, RD = 75, D = 817.4, MARGIN = 0.058;
const gl = 1 / Math.sqrt(1 + (3 * Q * Q * RD * RD) / (Math.PI * Math.PI));
const win = (a, b) => 1 / (1 + Math.pow(10, (gl * (VRS[a] - VRS[b])) / -D));
/** Ціна з маржею, заокруглена до сотих — як їх показує букмекер. */
const price = (p) => Math.round((100 * (1 - MARGIN)) / p) / 100;

const S = (date, event, score, winner) => ({ date, event, score, winner });

const QF = [
  {
    a: "vitality", b: "parivision", at: "2026-10-09T11:00:00+00:00",
    names: ["Vitality", "PARIVISION"],
    h2h: { a: 2, b: 0, series: [
      S("2026-06-22", "IEM Cologne Major 2026", "2:0", "a"),
      S("2026-02-15", "IEM Kraków 2026", "2:1", "a"),
    ] },
  },
  {
    a: "onewin", b: "aurora", at: "2026-10-09T08:30:00+00:00",
    names: ["1win", "Aurora"],
    h2h: null,
  },
  {
    a: "falcons", b: "spirit", at: "2026-10-09T16:00:00+00:00",
    names: ["Falcons", "Spirit"],
    h2h: { a: 1, b: 3, series: [
      S("2026-08-22", "Esports World Cup 2026", "1:2", "b"),
      S("2026-06-21", "IEM Cologne Major 2026", "0:2", "b"),
      S("2026-03-22", "BLAST Open Rotterdam 2026", "2:1", "a"),
      S("2025-12-14", "BLAST World Final 2025", "1:2", "b"),
    ] },
  },
  {
    a: "furia", b: "mouz", at: "2026-10-09T13:30:00+00:00",
    names: ["FURIA", "MOUZ"],
    h2h: { a: 0, b: 2, series: [
      S("2026-10-04", "ESL Pro League Season 24", "0:2", "b"),
      S("2026-06-19", "IEM Cologne Major 2026", "1:2", "b"),
    ] },
  },
];

const matches = QF.map((m) => ({
  id: `${m.a}-vs-${m.b}-epl24`,
  tournament_slug: "esl-pro-league-s24",
  is_event: false,
  team_a: m.a, team_b: m.b,
  status: "upcoming",
  format: "BO3",
  stage: "Плейоф · чвертьфінал",
  start_at: m.at,
  score_a: 0, score_b: 0,
  maps: [], veto: [],
  h2h: m.h2h,
  open_questions: 1,
  max_reward: 50,
}));

const questions = QF.map((m) => {
  const p = win(m.names[0], m.names[1]);
  return {
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
      { id: `${m.a}-w`, label: m.names[0], odds: price(p), open: price(p), reward: 50 },
      { id: `${m.b}-w`, label: m.names[1], odds: price(1 - p), open: price(1 - p), reward: 50 },
    ],
  };
});

QF.forEach((m, i) => {
  const o = questions[i].options;
  console.log(
    `${(m.names[0] + " — " + m.names[1]).padEnd(26)} ${m.at.slice(11, 16)} UTC · ` +
    `${o[0].odds} / ${o[1].odds} (модель) · очні ${m.h2h ? `${m.h2h.a}:${m.h2h.b}` : "не грали"}`,
  );
});

if (!process.argv.includes("--apply")) {
  console.log("\nпробний прогін — нічого не записано. --apply щоб залити");
  process.exit(0);
}

await post("matches", matches);
await post("questions", questions);
console.log(`\nзаписано: ${matches.length} матчів і ${questions.length} питань`);
