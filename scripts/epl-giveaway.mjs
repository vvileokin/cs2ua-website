import fs from "node:fs";

/**
 * Розіграш EPL S24: п'ять AWP | Крижане вугілля за поінти івенту.
 *
 * Квиток коштує 500 зелених — тих самих, якими ставлять на матчі турніру. Це
 * і є причина, чому розіграш чекає на міграцію 0084: до неї таблиця знала дві
 * валюти, сезонну і EWC, і рядок із `event` відхиляла перевіркою.
 *
 * П'ять переможців, по скіну кожному, до п'яти квитків на людину — як на EWC
 * торік. Підписка на канал перевіряється ботом під час купівлі квитка, не на
 * слово.
 *
 * Запуск: node scripts/epl-giveaway.mjs --apply
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

const GIVEAWAY = {
  slug: "epl-awp-ice-coaled",
  prize: "5× AWP | Крижане вугілля",
  sponsor: "CS2UA",
  value_usd: 0,
  end_iso: "2026-10-11T21:00:00+00:00",
  end_label: "до 11 жовтня",
  entrants: 0,
  min_points: 0,
  status: "open",
  /* Зелений івенту, той самий, що в акценті турніру. */
  cover: "oklch(0.78 0.16 118)",
  image: "https://jtfhbvsqldhroijkouqh.supabase.co/storage/v1/object/public/media/giveaways/1791233013341-eplawp.webp",
  skin: "epl",
  description:
    "П'ять AWP | Крижане вугілля розігруємо серед тих, хто грає на ESL Pro League Season 24. " +
    "Квиток коштує 500 поінтів івенту — тих самих, якими ти ставиш на матчі. Умови нижче.",
  conditions: [
    "Підписка на Telegram-канал CS2UA",
    "500 поінтів івенту за квиток",
    "До 5 квитків на людину",
    "Один переможець — один скін",
  ],
  winners_count: 5,
  entry_cost: 500,
  entry_currency: "event",
  max_tickets: 5,
  require_telegram: true,
};

if (!process.argv.includes("--apply")) {
  console.log(JSON.stringify(GIVEAWAY, null, 1));
  console.log("\nпробний прогін — нічого не записано. --apply щоб створити");
  process.exit(0);
}

const r = await fetch(`${SB}/rest/v1/giveaways`, {
  method: "POST",
  headers: {
    apikey: KEY, Authorization: `Bearer ${KEY}`,
    "content-type": "application/json",
    Prefer: "resolution=merge-duplicates",
  },
  body: JSON.stringify([GIVEAWAY]),
});

if (r.ok) {
  console.log("розіграш створено:", GIVEAWAY.slug);
} else {
  const text = await r.text();
  const needsMigration = text.includes("entry_currency") || text.includes("23514");
  console.error(r.status, text.slice(0, 300));
  if (needsMigration) {
    console.error(
      "\nСхоже, міграція 0084 ще не запущена: таблиця не приймає валюту «event».",
    );
  }
  process.exit(1);
}
