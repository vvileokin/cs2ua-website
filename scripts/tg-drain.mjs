import fs from "node:fs";

/**
 * Вичерпати чергу бота руками.
 *
 * `/api/cron/telegram` існує, але в `vercel.json` його ніколи не було — там
 * стоять лише pandascore і valve-standings. Тобто черга наповнювалась із
 * серпня і не доставила жодного рядка: на момент написання в ній 524 записи,
 * і в усіх `sent_at` порожній.
 *
 * Крон я дописую окремо, але розсилку, яка потрібна зараз, цей скрипт робить
 * сам. Він свідомо не бере всю чергу: серед неї сто сімдесят три сповіщення
 * про дуелі з серпня і вересня, і надіслати людині «ти виграв дуель» через два
 * місяці — гірше, ніж не надіслати нічого. Тому вид вказується аргументом.
 *
 * Темп — двадцять повідомлень на секунду. Ліміт Telegram на розсилку близько
 * тридцяти, і впертися в нього означає отримати 429 з `retry_after` на весь
 * залишок.
 *
 * Запуск:
 *   node scripts/tg-drain.mjs announce            — показати, що піде
 *   node scripts/tg-drain.mjs announce --apply    — надіслати
 */

const KIND = process.argv[2];
if (!KIND || KIND.startsWith("--")) {
  console.log("вкажи вид: node scripts/tg-drain.mjs announce [--apply]");
  process.exit(1);
}
const APPLY = process.argv.includes("--apply");

const ENV = Object.fromEntries(
  fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/).filter((l) => l.includes("=")).map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);
const SB = ENV.NEXT_PUBLIC_SUPABASE_URL;
const KEY = ENV.SUPABASE_SERVICE_ROLE_KEY;
const TOKEN = ENV.TELEGRAM_BOT_TOKEN;
const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, "content-type": "application/json" };

const rows = await (await fetch(
  `${SB}/rest/v1/tg_outbox?select=id,user_id,kind,payload&kind=eq.${KIND}` +
  `&sent_at=is.null&failed_at=is.null&order=id`,
  { headers },
)).json();

if (!Array.isArray(rows) || !rows.length) {
  console.log(`нічого не чекає у виді «${KIND}»`);
} else {
  /* Чати читаємо одним запитом на всіх, а не по одному на рядок. */
  const ids = [...new Set(rows.map((r) => r.user_id))];
  const chats = new Map();
  for (let i = 0; i < ids.length; i += 200) {
    const page = await (await fetch(
      `${SB}/rest/v1/profiles?select=id,telegram_id&id=in.(${ids.slice(i, i + 200).join(",")})`,
      { headers },
    )).json();
    for (const p of page) if (p.telegram_id) chats.set(p.id, p.telegram_id);
  }

  const ready = rows.filter((r) => chats.has(r.user_id));
  console.log(`вид «${KIND}»: ${rows.length} у черзі, ${ready.length} з привʼязаним чатом`);
  if (ready.length) {
    const t = String(ready[0].payload?.text ?? "")
      .replace(/<tg-emoji[^>]*>(.*?)<\/tg-emoji>/g, "$1").replace(/<\/?b>/g, "");
    console.log("\nперший рядок черги:\n" + t.split("\n").map((l) => "  " + (l || "·")).join("\n"));
  }

  if (!APPLY) {
    console.log("\nпробний прогін. --apply щоб надіслати");
  } else {
    let sent = 0, failed = 0;
    const started = Date.now();
    for (const [i, r] of ready.entries()) {
      const p = r.payload ?? {};
      const body = {
        chat_id: chats.get(r.user_id),
        text: String(p.text ?? ""),
        parse_mode: "HTML",
        link_preview_options: { is_disabled: true },
        ...(p.button?.text && p.button?.url
          ? { reply_markup: { inline_keyboard: [[{ text: p.button.text, url: p.button.url }]] } }
          : {}),
      };
      let out = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      }).then((x) => x.json());

      /* Без Premium бот не має права на власні емодзі — тоді шлемо те саме з
         гліфами замість тегів, як це робить `send` у telegram-notify. */
      if (!out.ok && /emoji/i.test(String(out.description ?? ""))) {
        body.text = body.text.replace(/<tg-emoji[^>]*>(.*?)<\/tg-emoji>/g, "$1");
        out = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
          method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        }).then((x) => x.json());
      }

      await fetch(`${SB}/rest/v1/tg_outbox?id=eq.${r.id}`, {
        method: "PATCH", headers,
        body: JSON.stringify(out.ok
          ? { sent_at: new Date().toISOString(), attempts: 1 }
          : { failed_at: new Date().toISOString(), attempts: 1, error: String(out.description ?? "unknown") }),
      });

      out.ok ? sent++ : failed++;
      if (!out.ok && failed <= 5) console.log(`  ✗ ${out.description}`);
      /* 20/с: ліміт Telegram близько тридцяти, і 429 коштує дорожче за паузу. */
      if (i % 20 === 19) await new Promise((x) => setTimeout(x, 1000));
    }
    console.log(`\nнадіслано ${sent}, не вдалось ${failed}, за ${Math.round((Date.now() - started) / 1000)} с`);
  }
}
