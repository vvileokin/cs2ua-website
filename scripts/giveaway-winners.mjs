import fs from "node:fs";

/**
 * Переможці розіграшу з їхніми телеграмами.
 *
 * У профілі лежить тільки числовий `telegram_id` — його дає сам Telegram при
 * прив'язці акаунта, і він незмінний. Юзернейм там не зберігається навмисне:
 * людина може змінити його будь-коли, і збережена копія швидко стає брехнею.
 *
 * Тому юзернейм беремо живим: `getChat` бот-API повертає поточний @нік за
 * числовим id. Бот бачить лише тих, хто з ним уже взаємодіяв, — а всі, хто
 * прив'язав телеграм на сайті, взаємодіяли.
 *
 * Запуск: node scripts/giveaway-winners.mjs <slug>
 */

const slug = process.argv[2] ?? "epl-awp-ice-coaled";

const ENV = Object.fromEntries(
  fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/).filter((l) => l.includes("=")).map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);
const SB = ENV.NEXT_PUBLIC_SUPABASE_URL;
const KEY = ENV.SUPABASE_SERVICE_ROLE_KEY;
const BOT = ENV.TELEGRAM_BOT_TOKEN ?? ENV.BOT_TOKEN ?? ENV.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN;

const q = async (path) => {
  const r = await fetch(`${SB}/rest/v1/${path}`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  });
  if (!r.ok) throw new Error(`${path}: ${r.status} ${await r.text()}`);
  return r.json();
};

const winners = await q(`giveaway_winners?select=*&giveaway_slug=eq.${slug}`);
if (!winners.length) {
  console.log(`переможців за слаґом «${slug}» не знайдено`);
  process.exit(0);
}

const ids = [...new Set(winners.map((w) => w.user_id))];
const profiles = await q(`profiles?select=id,handle,telegram_id&id=in.(${ids.join(",")})`);
const byId = new Map(profiles.map((p) => [p.id, p]));

/** Поточний @нік за числовим id. */
async function username(tgId) {
  if (!tgId) return { state: "немає прив'язки" };
  if (!BOT) return { state: "немає токена бота" };
  const r = await fetch(`https://api.telegram.org/bot${BOT}/getChat?chat_id=${tgId}`);
  const d = await r.json().catch(() => ({}));
  if (!d.ok) return { state: `Telegram: ${d.description ?? r.status}` };
  const c = d.result ?? {};
  return {
    at: c.username ? `@${c.username}` : null,
    name: [c.first_name, c.last_name].filter(Boolean).join(" ") || null,
  };
}

console.log(`розіграш: ${slug} · переможців ${winners.length}\n`);
const order = winners.slice().sort((a, b) => (a.place ?? 0) - (b.place ?? 0));
for (const w of order) {
  const p = byId.get(w.user_id) ?? {};
  const u = await username(p.telegram_id);
  const tail = u.at
    ? `${u.at}${u.name ? ` (${u.name})` : ""}`
    : u.name
      ? `${u.name} — юзернейма немає, писати за id ${p.telegram_id}`
      : u.state;
  console.log(`${String(w.place ?? "·").padEnd(3)} ${(p.handle ?? "?").padEnd(20)} ${tail}`);
}
