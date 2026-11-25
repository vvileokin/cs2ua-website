import fs from "node:fs";
import { standings, outcome } from "./major-standings.mjs";

/**
 * Часткове нарахування: за кошики, які вже не зміняться.
 *
 * Після третього туру 3-0 і 0-3 остаточні. Трьох перемог поспіль після
 * поразки не буває, як і трьох поразок після перемоги, — отже обидва ці
 * кошики закриті назавжди, тоді як «пройде» зʼясується аж у п'ятому турі.
 * Тримати за вгадане очки ще два дні немає за що.
 *
 * Що робить скрипт:
 *   1. рахує таблицю з наших матчів і бере звідти тих, хто 3-0 і 0-3;
 *   2. дописує їх у `major_stages.actual` — не перезаписуючи те, що вже там;
 *   3. платить кожному за влучання в ці два кошики.
 *
 * Платить різницею, а не сумою: у `major_pickem.points` лежить те, що вже
 * заплачено, і в профіль іде тільки те, чого там бракує. Тому прогін можна
 * повторити скільки завгодно разів — другий додасть нуль. З тієї ж причини
 * `scored_at` лишається порожнім: картка ще не дорахована, і фінальне
 * нарахування має її побачити.
 *
 * ВАЖЛИВО. Фінальне нарахування — кнопка «Нарахувати» в адмінці — викликає
 * `score_major_stage`. Доки не прогнана міграція 0104, вона платить за картку
 * цілком, тобто нарахує за 3-0 і 0-3 удруге. 0104 вчить її доплачувати
 * різницю. Прогнати її треба до того, як стадію дограють.
 *
 *   node scripts/major-pay-decided.mjs          — показати
 *   node scripts/major-pay-decided.mjs --apply  — нарахувати
 */
const APPLY = process.argv.includes("--apply");
const STAGE = 1;
/** Кошики, які вже не зміняться. */
const DECIDED = ["3-0", "0-3"];
const PRICE = { "3-0": 150, adv: 50, "0-3": 150 };

const ENV = Object.fromEntries(
  fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/).filter((l) => l.includes("=")).map((l) => {
      const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);
const API = ENV.NEXT_PUBLIC_SUPABASE_URL + "/rest/v1/";
const H = {
  apikey: ENV.SUPABASE_SERVICE_ROLE_KEY,
  Authorization: "Bearer " + ENV.SUPABASE_SERVICE_ROLE_KEY,
  "content-type": "application/json",
};
const j = async (q) => (await fetch(API + q, { headers: H })).json();

const [stage] = await j(`major_stages?select=stage,title,actual,scored_at&stage=eq.${STAGE}`);
if (!stage) throw new Error("немає стадії");
if (stage.scored_at) throw new Error("стадію вже зараховано — часткове нарахування тут ні до чого");

/* --- 1. Хто вже визначився ------------------------------------------- */
const rec = await standings();
const done = {};
for (const [team, r] of rec) {
  const o = outcome(r);
  if (o && DECIDED.includes(o)) done[team] = o;
}
console.log("визначилися остаточно:");
for (const [t, o] of Object.entries(done)) console.log(`  ${t.padEnd(14)} ${o}`);
if (Object.keys(done).length === 0) throw new Error("ще нічого не вирішено");

/* --- 2. Підсумок стадії ---------------------------------------------- */
/* Дописуємо, а не замінюємо: якщо підсумок уже вносили в адмінці, він
   головніший за те, що порахував цей скрипт. */
const actual = { ...done, ...(stage.actual ?? {}) };

/* --- 3. Скільки кому належить ---------------------------------------- */
const cards = await j(`major_pickem?select=user_id,picks,points,hits,scored_at&stage=eq.${STAGE}`);
const plan = [];
for (const c of cards) {
  if (c.scored_at) continue;
  const hits0 = c.hits ?? 0;
  let pts = 0, hits = 0;
  for (const [team, role] of Object.entries(c.picks ?? {})) {
    if (!DECIDED.includes(role)) continue;        // «прохід» чекає кінця стадії
    if (actual[team] !== role) continue;          // не вгадав — або ще не той кошик
    pts += PRICE[role];
    hits++;
  }
  plan.push({ ...c, pts, hits, hits0, add: pts - (c.points ?? 0) });
}
/* Писати треба не всім: у кого нічого не змінилося, тому нічого й не пишемо.
   А сказати треба всім — див. нижче. */
const writes = plan.filter((p) => p.add !== 0 || p.hits0 !== p.hits);

const total = plan.reduce((s, p) => s + p.add, 0);
const byHits = plan.reduce((m, p) => ((m[p.hits] = (m[p.hits] ?? 0) + 1), m), {});
console.log(`\nкарток: ${cards.length}, із них до запису: ${writes.length}`);
console.log("влучань у ці кошики:",
  Object.entries(byHits).sort().map(([h, n]) => `${h} — ${n}`).join(", ") || "немає");
console.log(`до нарахування: ${total} очок`);

if (!APPLY) {
  console.log("\nпробний прогін. --apply щоб нарахувати");
  process.exit(0);
}

/* --- 4. Записуємо ----------------------------------------------------- */
const patch = async (path, body) => {
  const r = await fetch(API + path, { method: "PATCH", headers: H, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`${path} → ${r.status} ${await r.text()}`);
};

await patch(`major_stages?stage=eq.${STAGE}`, { actual, updated_at: new Date().toISOString() });
console.log(`підсумок стадії: ${Object.keys(actual).length} команд із 16`);

/* Гаманець — івентовий, не сезонний. Ставки на мейджорі приймає саме він
   (0102), і нагорода, якою не можна скористатися там, де її дали, — це не
   нагорода. */
const profiles = Object.fromEntries(
  (await j(`profiles?select=id,event_points&id=in.(${writes.map((p) => p.user_id).join(",")})`))
    .map((p) => [p.id, p.event_points ?? 0]),
);

let n = 0;
for (const p of writes) {
  /* `updated_at` картки не чіпаємо: він третій ключ тайбрейка в таблиці
     стадії (0096), і зсунути його означало б тихо переставити людей
     місцями за те, що вони нічого не робили. */
  await patch(`major_pickem?user_id=eq.${p.user_id}&stage=eq.${STAGE}`,
    { points: p.pts, hits: p.hits });
  if (p.add !== 0) {
    await patch(`profiles?id=eq.${p.user_id}`,
      { event_points: (profiles[p.user_id] ?? 0) + p.add });
  }
  n++;
}
console.log(`оновлено карток: ${n}`);

/* --- 5. Сповіщення ---------------------------------------------------- */
/* Текст ділиться по « · »: до нього рядок напівжирним, після — пояснення.
   Шлеться всім, а не лише тим, кому щось нарахували. Для того, хто не вгадав,
   це теж новина: його 3-0 і 0-3 вже мертві, і він має знати чому, а не
   гадати, чому в сусіда очки побільшали, а в нього ні. Мовчання на цьому
   місці читається як «про мене забули».

   «Влучання» правильне в усіх числах від одного до чотирьох, а більше тут і
   не буває: кошики 3-0 і 0-3 разом — це чотири вибори. */
const rows = plan.map((p) => ({
  user_id: p.user_id,
  kind: "major",
  title:
    `${stage.title} · 3-0 і 0-3 вже відомі: ` +
    (p.hits
      ? `${p.hits} влучання з чотирьох, +${p.pts} мейджорських поінтів. `
      : "жодного влучання з чотирьох. ") +
    "Очки за прохід нарахуємо, коли стадія дограє.",
}));
for (let i = 0; i < rows.length; i += 200) {
  const r = await fetch(API + "notifications", {
    method: "POST", headers: H, body: JSON.stringify(rows.slice(i, i + 200)),
  });
  if (!r.ok) throw new Error("сповіщення: " + (await r.text()).slice(0, 300));
}
console.log(`сповіщень: ${rows.length}`);
console.log("\nНЕ ЗАБУТИ: міграція 0104 — інакше фінальне нарахування заплатить за це вдруге.");
