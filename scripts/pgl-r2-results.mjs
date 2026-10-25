import fs from "node:fs";

/**
 * Рахунки другого туру PGL Masters Bucharest.
 *
 * Тур вийшов без жодної несподіванки в підсумку, але з двома великими по суті:
 * НАВІ зняли FURIA всуху і пішли 2-0, а Aurora відігрались за вчорашнє і
 * винесли G2, лишивши тих 0-2.
 *
 * Тільки рахунок і статус; виплати робить адмінка через `settle_bets`.
 *
 * Запуск: node scripts/pgl-r2-results.mjs --apply
 */
const ENV = Object.fromEntries(
  fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/).filter((l) => l.includes("=")).map((l) => {
      const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);
const SB = ENV.NEXT_PUBLIC_SUPABASE_URL, KEY = ENV.SUPABASE_SERVICE_ROLE_KEY;
const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, "content-type": "application/json" };

/** Зі сторінки результатів події, 25 жовтня. Ідентифікатори — з pgl-round2. */
const R2 = [
  ["furia-vs-natus", 0, 2], ["legacy-vs-sharks", 2, 0],
  ["g2-vs-aurora", 0, 2], ["mouz-vs-ninez", 2, 0],
  ["betboom-vs-nemiga", 2, 0], ["vitality-vs-mongolz", 2, 0],
  ["fut-vs-liquid", 2, 0], ["spirit-vs-tyloo", 2, 0],
];

console.log("матч                      рахунок");
for (const [id, a, b] of R2) console.log(`  ${id.padEnd(24)} ${a}:${b}`);

if (!process.argv.includes("--apply")) {
  console.log("\nпробний прогін. --apply щоб записати");
} else {
  for (const [id, a, b] of R2) {
    const r = await fetch(`${SB}/rest/v1/matches?id=eq.${id}-pgl26-r2`, {
      method: "PATCH", headers,
      body: JSON.stringify({ score_a: a, score_b: b, status: "finished" }),
    });
    if (!r.ok) throw new Error(`${id}: ${r.status} ${await r.text()}`);
  }
  console.log(`\nзаписано рахунків: ${R2.length}`);
  console.log("виплати — через адмінку, тут не чіпалось");
}
