import fs from "node:fs";

/**
 * Ставки на третій тур — лінія з betking.
 *
 * Матчі залили ввечері 25-го без питань, бо коефіцієнтів тоді ще не було.
 * Тепер вони є, і питання додаються окремо, не чіпаючи самих карток: рахунки,
 * вето й статус у них уже свої, і повторна заливка матчів їх би обнулила.
 *
 * Порядок сторін у лінії збігається з тим, у якому матчі заведені, тож
 * odds[0] — це завжди team_a. Звірено по кожній парі окремо, не на віру.
 *
 * Варто відзначити: на BETBOOM — НАВІ букмекер ставить фаворитом НАВІ
 * (1.61 проти 2.30), хоч BETBOOM вищі за очками на 220. Лінію беремо як є.
 *
 * Запуск: node scripts/pgl-round3-odds.mjs --apply
 */
const ENV = Object.fromEntries(
  fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/).filter((l) => l.includes("=")).map((l) => {
      const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);
const SB = ENV.NEXT_PUBLIC_SUPABASE_URL, KEY = ENV.SUPABASE_SERVICE_ROLE_KEY;
const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, "content-type": "application/json" };

const ODDS = [
  { id: "mongolz-vs-mouz",    names: ["The MongolZ", "MOUZ"],          odds: [3.33, 1.32] },
  { id: "nemiga-vs-aurora",   names: ["Nemiga", "Aurora"],             odds: [3.20, 1.35] },
  { id: "vitality-vs-fut",    names: ["Vitality", "FUT"],              odds: [1.26, 3.80] },
  { id: "ninez-vs-tyloo",     names: ["9z", "TYLOO"],                  odds: [1.40, 2.90] },
  { id: "spirit-vs-furia",    names: ["Spirit", "FURIA"],              odds: [1.47, 2.66] },
  { id: "liquid-vs-legacy",   names: ["Liquid", "Legacy"],             odds: [2.62, 1.48] },
  { id: "betboom-vs-natus",   names: ["BetBoom Team", "Natus Vincere"], odds: [2.30, 1.61] },
  { id: "g2-vs-sharks",       names: ["G2", "DENDELE"],                odds: [1.30, 3.50] },
];

const questions = ODDS.map((m) => {
  const [a, b] = m.id.split("-vs-");
  return {
    id: `q-${m.id}-pgl26-r3`,
    match_id: `${m.id}-pgl26-r3`,
    kind: "match_winner",
    title: "Переможець матчу",
    difficulty: "easy",
    status: "open",
    deadline_label: "до старту матчу",
    betting: true,
    live_odds: true,
    options: [
      { id: `${a}-w`, label: m.names[0], odds: m.odds[0], open: m.odds[0], reward: 50 },
      { id: `${b}-w`, label: m.names[1], odds: m.odds[1], open: m.odds[1], reward: 50 },
    ],
  };
});

console.log("матч                          коефіцієнти");
for (const m of ODDS)
  console.log(`  ${(m.names[0] + " — " + m.names[1]).padEnd(28)} ${m.odds[0]} / ${m.odds[1]}`);

if (!process.argv.includes("--apply")) {
  console.log("\nпробний прогін. --apply щоб відкрити ставки");
} else {
  const r = await fetch(`${SB}/rest/v1/questions`, {
    method: "POST", headers: { ...headers, Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify(questions),
  });
  if (!r.ok) throw new Error(`questions: ${r.status} ${await r.text()}`);
  /* Картка показує лічильник відкритих питань окремо від самих питань. */
  for (const m of ODDS) {
    const u = await fetch(`${SB}/rest/v1/matches?id=eq.${m.id}-pgl26-r3`, {
      method: "PATCH", headers, body: JSON.stringify({ open_questions: 1 }),
    });
    if (!u.ok) throw new Error(`${m.id}: ${u.status} ${await u.text()}`);
  }
  console.log(`\nвідкрито ставок: ${questions.length}`);
}
