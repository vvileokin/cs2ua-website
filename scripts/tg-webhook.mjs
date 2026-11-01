#!/usr/bin/env node
/**
 * Вмикає, показує й вимикає вебхук бота.
 *
 * Навіщо окремий скрипт. allowed_updates — не налаштування, яке можна
 * забути: Telegram НЕ надсилає chat_member, доки його там явно не назвати.
 * Бот може бути адміном каналу з усіма правами й не бачити жодного входу
 * просто тому, що в setWebhook цього слова не було. Саме це тут і робиться
 * правильно один раз.
 *
 *   node scripts/tg-webhook.mjs show
 *   node scripts/tg-webhook.mjs set https://cs2ua.com
 *   node scripts/tg-webhook.mjs delete
 *
 * Токен і секрет беруться з .env.local. Секрет — будь-який рядок; Telegram
 * вертатиме його в заголовку, і маршрут без нього відповідає 401.
 */
import fs from "node:fs";

const ENV_FILE = new URL("../.env.local", import.meta.url);
const env = {};
try {
  for (const line of fs.readFileSync(ENV_FILE, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
} catch {
  console.error("немає .env.local поруч із package.json");
  process.exit(1);
}

const TOKEN = env.TELEGRAM_BOT_TOKEN;
const SECRET = env.TELEGRAM_WEBHOOK_SECRET;
if (!TOKEN) { console.error("немає TELEGRAM_BOT_TOKEN"); process.exit(1); }

const api = async (method, body) => {
  const r = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  return r.json();
};

const [cmd, arg] = process.argv.slice(2);

if (cmd === "show") {
  const info = await api("getWebhookInfo");
  const w = info.result ?? {};
  console.log("адреса:          ", w.url || "— не встановлено —");
  console.log("allowed_updates: ", (w.allowed_updates ?? []).join(", ") || "— усі, крім chat_member —");
  console.log("черга:           ", w.pending_update_count ?? 0);
  if (w.last_error_message)
    console.log("остання помилка: ", w.last_error_message, "о", new Date((w.last_error_date ?? 0) * 1000).toISOString());
  if (!(w.allowed_updates ?? []).includes("chat_member"))
    console.log("\n! chat_member не ввімкнено — входи в канал НЕ приходитимуть");

} else if (cmd === "set") {
  if (!arg) { console.error("вкажи базову адресу: node scripts/tg-webhook.mjs set https://cs2ua.com"); process.exit(1); }
  if (!SECRET) { console.error("немає TELEGRAM_WEBHOOK_SECRET у .env.local"); process.exit(1); }
  const url = `${arg.replace(/\/+$/, "")}/api/telegram/webhook`;
  /* Тільки chat_member: нічого іншого бот через вебхук не споживає. */
  const res = await api("setWebhook", {
    url,
    secret_token: SECRET,
    allowed_updates: ["chat_member"],
    drop_pending_updates: true,
  });
  console.log(res.ok ? `увімкнено: ${url}` : `не вийшло: ${res.description}`);

} else if (cmd === "delete") {
  const res = await api("deleteWebhook", { drop_pending_updates: false });
  console.log(res.ok ? "вимкнено" : `не вийшло: ${res.description}`);

} else {
  console.log("node scripts/tg-webhook.mjs show | set <https://host> | delete");
}
