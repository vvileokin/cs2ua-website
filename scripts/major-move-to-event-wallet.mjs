import fs from "node:fs";

/**
 * Перенести вже нараховане за картки з сезонного гаманця в мейджорський.
 *
 * Часткове нарахування за 3-0 і 0-3 пройшло в `profiles.points` — сезонні.
 * Це була помилка в суті, а не в коді: на мейджорі сезонними не можна
 * зробити нічого, бо ставки тут приймає івентовий гаманець (0102). Нагорода,
 * якою не можна скористатися там, де її дали, — це не нагорода.
 *
 * Скільки саме кому зарахували, видно точно: у `major_pickem.points` лежить
 * повна сума, нарахована за картку, і до часткового нарахування там у всіх
 * був нуль. Отже з сезонних треба зняти рівно це число, а в івентові —
 * додати.
 *
 * Запобіжник від повтору — файл поруч. Перед записом скрипт складає журнал
 * того, що саме переносить, і кладе його в `scripts/data/`. Якщо файл уже є,
 * другий прогін нічого не робить: він зняв би сезонні вдруге й загнав би
 * комусь баланс у мінус. Журнал лишається й сам по собі корисний — у ньому
 * видно, в кого скільки було до й після.
 *
 *   node scripts/major-move-to-event-wallet.mjs          — показати
 *   node scripts/major-move-to-event-wallet.mjs --apply  — перенести
 */
const APPLY = process.argv.includes("--apply");
const STAGE = 1;

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

const LOG = new URL("./data/major-wallet-move.json", import.meta.url);
if (fs.existsSync(LOG)) {
  console.log("перенесення вже було —", LOG.pathname);
  console.log("повторний прогін зняв би сезонні вдруге; якщо треба ще раз — прибрати файл свідомо");
  process.exit(0);
}

const cards = (await j(`major_pickem?select=user_id,points&stage=eq.${STAGE}`))
  .filter((c) => (c.points ?? 0) > 0);
if (!cards.length) {
  console.log("нема чого переносити");
  process.exit(0);
}

const ids = cards.map((c) => c.user_id);
const pr = Object.fromEntries(
  (await j(`profiles?select=id,handle,points,event_points&id=in.(${ids.join(",")})`))
    .map((p) => [p.id, p]),
);

const plan = cards.map((c) => {
  const p = pr[c.user_id];
  return {
    user_id: c.user_id,
    handle: p?.handle ?? "—",
    move: c.points,
    points: (p?.points ?? 0) - c.points,
    event_points: (p?.event_points ?? 0) + c.points,
  };
});

const total = plan.reduce((s, p) => s + p.move, 0);
console.log(`людей: ${plan.length}, разом: ${total} очок`);
/* Якщо в когось сезонних менше, ніж нарахували, — значить він устиг їх
   витратити, і просте віднімання загнало б баланс у мінус. Такого бути не
   мало (сезонними на мейджорі платити нічим), але мовчки псувати баланс
   гірше, ніж спинитися. */
const bad = plan.filter((p) => p.points < 0);
if (bad.length) {
  console.log("\nувага: у цих сезонні пішли б у мінус —");
  for (const p of bad) console.log(`  ${p.handle}: ${p.points}`);
  throw new Error("зупиняюсь, розбиратися руками");
}

console.log("\nперші десять:");
for (const p of plan.slice(0, 10)) {
  console.log(`  ${p.handle.padEnd(22)} −${String(p.move).padStart(4)} сезонних → +${p.move} мейджорських`);
}

if (!APPLY) {
  console.log("\nпробний прогін. --apply щоб перенести");
  process.exit(0);
}

fs.mkdirSync(new URL("./data/", import.meta.url), { recursive: true });
/* Журнал пишеться ДО запису, а не після: якщо посеред перенесення обірветься
   мережа, краще мати файл про те, що мало статися, ніж не мати нічого й не
   знати, докуди дійшло. */
fs.writeFileSync(LOG, JSON.stringify({
  at: new Date().toISOString(), stage: STAGE, total,
  moved: plan.map(({ user_id, handle, move, points, event_points }) =>
    ({ user_id, handle, move, points_after: points, event_points_after: event_points })),
}, null, 1));

let n = 0;
for (const p of plan) {
  const r = await fetch(API + `profiles?id=eq.${p.user_id}`, {
    method: "PATCH", headers: H,
    body: JSON.stringify({ points: p.points, event_points: p.event_points }),
  });
  if (!r.ok) throw new Error(`${p.handle}: ${r.status} ${await r.text()}`);
  n++;
}

console.log(`
перенесено: ${n} людей, ${total} очок`);
console.log("журнал:", LOG.pathname);
