import fs from "node:fs";

/**
 * Рахунки першого туру PGL Masters Bucharest.
 *
 * Тільки рахунок і статус. Виплати за ставками тут не чіпаються: їх робить
 * адмінка через `settle_bets`, і робити це повз неї означало б обійти і
 * перевірку коефіцієнта на момент прийняття, і запис у сезонну колонку.
 *
 * Запуск: node scripts/pgl-r1-results.mjs --apply
 */
const ENV = Object.fromEntries(
  fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/).filter((l) => l.includes("=")).map((l) => {
      const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);
const SB = ENV.NEXT_PUBLIC_SUPABASE_URL, KEY = ENV.SUPABASE_SERVICE_ROLE_KEY;
const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, "content-type": "application/json" };

/** Зі сторінки результатів події, 24 жовтня. */
const R1 = [
  ["aurora-vs-mongolz", 1, 2], ["fut-vs-tyloo", 2, 0],
  ["spirit-vs-betboom", 1, 2], ["mouz-vs-liquid", 1, 2],
  ["vitality-vs-ninez", 2, 0], ["legacy-vs-nemiga", 0, 2],
  ["g2-vs-natus", 0, 2], ["furia-vs-sharks", 2, 0],
];

console.log("матч                     рахунок  переможець");
for (const [id, a, b] of R1)
  console.log(`  ${id.padEnd(22)} ${a}:${b}      ${a > b ? id.split("-vs-")[0] : id.split("-vs-")[1]}`);

if (!process.argv.includes("--apply")) {
  console.log("\nпробний прогін. --apply щоб записати");
} else {
  for (const [id, a, b] of R1) {
    const r = await fetch(`${SB}/rest/v1/matches?id=eq.${id}-pgl26`, {
      method: "PATCH", headers,
      body: JSON.stringify({ score_a: a, score_b: b, status: "finished" }),
    });
    if (!r.ok) throw new Error(`${id}: ${r.status} ${await r.text()}`);
  }
  console.log(`\nзаписано рахунків: ${R1.length}`);
  console.log("виплати за ставками — через адмінку (settle_bets), тут не чіпалось");
}
