import fs from "node:fs";

/**
 * МЕГА-розіграш до мейджора.
 *
 * Безкоштовний: квитків немає, очок не коштує, одна участь на людину. Єдина
 * умова — підписка на канал, і вона справжня: `require_telegram` вмикає
 * перевірку через `getChatMember`, яку робить і картка (щоб намалювати
 * правильну кнопку), і маршрут участі (щоб вирішити). Поставити галочку й не
 * перевіряти тут неможливо — це одна й та сама колонка.
 *
 * Скін `major` вимагає міграції 0106: до неї перевірка на колонці знає лише
 * чотири події, і рядок не вставиться.
 *
 *   node scripts/major-giveaway.mjs          — показати
 *   node scripts/major-giveaway.mjs --apply  — створити або оновити
 */
const APPLY = process.argv.includes("--apply");

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

/* Кінець — 15 грудня включно, тобто остання мить цієї доби за Києвом.
   Не «15 грудня 00:00»: людина, яка прийде вранці п'ятнадцятого, має рацію,
   коли вважає, що встигла. */
const END = "2026-12-15T21:59:59Z";

/* Дев'ять призів, дев'ять переможців. Порядок у масиві — це порядок місць:
   перший бере мишу, дев'ятий USP. Окремого поля з номером немає свідомо —
   два джерела порядку рано чи пізно розійдуться. */
const PRIZES = [
  /* `fit` — найбільша частка висоти коробки. Без нього пістолети й ніж
     упираються у висоту й виглядають масивнішими за автомат, який упирається
     в ширину. Миша й джерсі квадратні — їм висота потрібна вся. */
  { title: "Logitech G PRO X3 SUPERSTRIKE", sub: "Lightspeed Wireless", img: "/prizes/logitech-pro-x3.png" },
  { title: "Ігрова джерсі NAVI", sub: "Natus Vincere", img: "/prizes/navi-jersey.png" },
  { title: "Nomad Knife", sub: "Forest DDPAT [FT]", img: "/prizes/nomad-forest-ddpat.png", fit: 0.66 },
  { title: "AK-47", sub: "Point Disarray [MW]", img: "/prizes/ak-point-disarray.webp" },
  { title: "Desert Eagle", sub: "Conspiracy [MW]", img: "/prizes/deagle-conspiracy.webp", fit: 0.52 },
  { title: "AWP", sub: "Fever Dream [MW]", img: "/prizes/awp-fever-dream.png" },
  { title: "M4A1-S", sub: "Decimator [FT]", img: "/prizes/m4a1s-decimator.png" },
  { title: "AK-47", sub: "Midnight Laminate [MW]", img: "/prizes/ak-midnight-laminate.webp" },
  { title: "USP-S", sub: "Cortex [MW]", img: "/prizes/usp-cortex.webp", fit: 0.58 },
];

const ROW = {
  slug: "mega-major-singapore-2026",
  prize: "МЕГА-розіграш до PGL Singapore Major 2026",
  sponsor: "CS2 UA",
  value_usd: 0,
  end_iso: END,
  end_label: "до 15 груд",
  min_points: 0,
  status: "open",
  skin: "major",
  cover: "oklch(0.665 0.262 29)",
  /* Банер 1600×740. Коробка картки — 3:1, тож по висоті він обрізається
     приблизно на чверть; композиція зібрана до центру й логотип стоїть
     посередині, тож центральна обрізка лишає в кадрі всі дев'ять предметів.
     Перевірено складанням тієї самої обрізки, а не на око. */
  image: "/brand/major-giveaway-banner.webp",
  description:
    "Мейджор у Сінгапурі — найбільша подія року, і ми відзначаємо її найбільшим " +
    "розіграшем: дев'ять призів, дев'ять переможців. Участь безкоштовна — " +
    "жодних квитків і жодних поінтів, достатньо бути підписаним на наш " +
    "Telegram-канал.",
  conditions: ["Підписка на Telegram-канал CS2 UA"],
  winners_count: PRIZES.length,
  prizes: PRIZES,
  entry_cost: 0,
  entry_currency: "points",
  max_tickets: 1,
  require_telegram: true,
  updated_at: new Date().toISOString(),
};

const kyiv = (s) => new Date(s).toLocaleString("uk-UA", { timeZone: "Europe/Kyiv" });

console.log(`${ROW.prize}`);
console.log(`  слаг        ${ROW.slug}`);
console.log(`  до          ${kyiv(ROW.end_iso)} (${ROW.end_label})`);
console.log(`  участь      ${ROW.entry_cost ? ROW.entry_cost + " очок" : "безкоштовна"}, квитків ${ROW.max_tickets}`);
console.log(`  умова       ${ROW.conditions.join("; ")}`);
console.log(`  перевірка   require_telegram = ${ROW.require_telegram}`);
console.log(`  переможців  ${ROW.winners_count}`);
console.log("  призи:");
ROW.prizes.forEach((p, i) => {
  const ok = fs.existsSync(new URL(`../public${p.img}`, import.meta.url));
  console.log(`   ${String(i + 1).padStart(2)}. ${p.title} · ${p.sub}  ${ok ? "" : "← НЕМАЄ КАРТИНКИ " + p.img}`);
});
if (ROW.prizes.some((p) => !fs.existsSync(new URL(`../public${p.img}`, import.meta.url)))) {
  throw new Error("не всі картинки на місці");
}
console.log(`  оформлення  скін «${ROW.skin}», обкладинка ${ROW.image}`);

/* Канал і бот — перевіряємо, що умова взагалі перевіряється. Розіграш, де
   галочка стоїть, а `getChatMember` не працює, пускає всіх. */
const channel = ENV.TELEGRAM_CHANNEL_ID;
if (!channel || !ENV.TELEGRAM_BOT_TOKEN) throw new Error("немає TELEGRAM_CHANNEL_ID або токена");
const probe = await (await fetch(
  `https://api.telegram.org/bot${ENV.TELEGRAM_BOT_TOKEN}/getChatMember`,
  { method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: channel, user_id: 777000 }) },
)).json();
if (!probe.ok) throw new Error("перевірка підписки не працює: " + JSON.stringify(probe).slice(0, 200));
console.log(`\nканал ${channel}: бот відповідає, статус тестового користувача «${probe.result.status}»`);

if (!APPLY) {
  console.log("\nпробний прогін. --apply щоб створити");
  process.exit(0);
}

const r = await fetch(API + "giveaways", {
  method: "POST",
  headers: { ...H, Prefer: "resolution=merge-duplicates,return=representation" },
  body: JSON.stringify(ROW),
});
if (!r.ok) throw new Error(`${r.status} ${(await r.text()).slice(0, 400)}`);
const [saved] = await r.json();
console.log(`\nстворено: /giveaways/${saved.slug}`);
console.log(`скін у базі: ${saved.skin}, require_telegram: ${saved.require_telegram}`);
