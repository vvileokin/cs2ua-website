import fs from "node:fs";
import { URL_, KEY } from "./q.mjs";

/**
 * Повертає стрілкам учорашню базу.
 *
 * Сьогодні таблиця публікувалась двічі: спершу з новим рейтингом, потім ще раз
 * із оновленими реєстраціями. Друга заливка записала в meta.prev числа першої,
 * і стрілки на сторінці почали показувати різницю за сорок хвилин замість
 * різниці за добу — тобто майже нічого там, де насправді рух був у двадцять
 * пунктів. (Для цього в push-major2 є KEEP_PREV=1; треба було ним скористатись.)
 *
 * Тут база береться з учорашнього опублікованого прогону і кладеться назад.
 *
 * Запуск: node fix-prev.mjs [final15-0610d.json] [2026-10-06] --apply
 */
const file = process.argv[2] ?? "final15-0610d.json";
const at = process.argv[3] ?? "2026-10-06";
const F = JSON.parse(fs.readFileSync(file, "utf8"));

const prev = [];
for (const [region, list] of Object.entries(F.regions))
  for (const t of list) prev.push({ region, team: t.team, p_qual: t.pQual });

console.log(`база: ${file} (${at}) · рядків ${prev.length}`);

if (!process.argv.includes("--apply")) {
  console.log("пробний прогін — нічого не записано. --apply щоб повернути");
  process.exit(0);
}

const head = { apikey: KEY, Authorization: `Bearer ${KEY}`, "content-type": "application/json" };
const r = await fetch(`${URL_}/rest/v1/major_meta?id=is.true`, {
  method: "PATCH",
  headers: { ...head, Prefer: "return=minimal" },
  body: JSON.stringify({ prev, prev_at: at }),
});
if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
console.log("стрілки тепер рахуються від", at);
