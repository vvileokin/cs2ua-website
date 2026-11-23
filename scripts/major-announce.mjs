import fs from "node:fs";

/**
 * Анонс пікемів на мейджор у бота — з картинкою.
 *
 * Відмінність від `pgl-announce.mjs` одна, але вона тягне за собою все інше:
 * тут не текст, а фото з підписом. Telegram це інший метод (`sendPhoto`), інша
 * межа довжини (1024 замість 4096) і, головне, інша логіка доставки: файл не
 * можна вантажити на кожен із чотирьохсот чатів. Тому він вантажиться рівно
 * один раз — у перший чат, — а далі по черзі йде `file_id`, який Telegram
 * повернув. Так само робить будь-яка розсилка з медіа.
 *
 * Емодзі власні, з пакунка події:
 *   t.me/addemoji/SingaporePickemWeb
 *
 * Сім плиток прапора складаються в одну смугу, тому порядок тут не вигаданий,
 * а взятий із самого пакунка. Усередині тега стоїть той самий гліф, що й у
 * пакунка: якщо бот колись втратить Premium, замість плиток лишиться сім
 * прапорів, а не сім скріпок.
 *
 * Черга — `tg_outbox`, як і в усіх інших розсилок: вона вміє і повтори, і
 * темп, і не дати людині те саме двічі.
 *
 * Запуск:
 *   node scripts/major-announce.mjs                 — показати, що піде
 *   node scripts/major-announce.mjs --test <handle> — надіслати одній людині
 *   node scripts/major-announce.mjs --apply         — поставити в чергу всім
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
const TOKEN = ENV.TELEGRAM_BOT_TOKEN;
const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, "content-type": "application/json" };

const KIND = "major-pickem";
const URL_SITE = "https://cs2ua.com/major";
/* Картинка лежить у репозиторії, а не в теці завантажень: скрипт мусить
   запускатися з будь-якої машини, а не з тієї, куди її колись поклали. */
const PHOTO = new URL("../public/brand/major-pickem-post.webp", import.meta.url);

/* --- Емодзі ---------------------------------------------------------------
   Беремо з пакунка, а не вписуємо ідентифікатори: вони міняються, коли
   пакунок перескладають, і вписані числа тихо перетворюються на порожнечу. */
const set = await (await fetch(
  `https://api.telegram.org/bot${TOKEN}/getStickerSet?name=SingaporePickemWeb`,
)).json();
if (!set.ok) throw new Error("пакунок емодзі не відкрився: " + JSON.stringify(set));

const flags = set.result.stickers.filter((s) => s.emoji === "🇸🇬");
const ua = set.result.stickers.find((s) => s.emoji === "🇺🇦");
if (flags.length < 7 || !ua) throw new Error("у пакунку не ті плитки");

const em = (s) => `<tg-emoji emoji-id="${s.custom_emoji_id}">${s.emoji}</tg-emoji>`;

/* --- Текст ----------------------------------------------------------------
   Підпис до фото, тому ліміт 1024 символи, а не 4096. Рахуємо його без
   тегів: Telegram міряє довжину по тексту, а не по розмітці. */
const TEXT =
  flags.slice(0, 7).map(em).join("") +
  "\n\n" +
  `<b>${em(ua)} Команда CS2UA знову запускає пікем на нашому сайті із призами! ` +
  "Правила прості: пікаєш команди — заробляєш бали — лутаєш призи.</b>" +
  "\n\n" +
  `<blockquote><b>⚡️ <a href="${URL_SITE}">А дізнатися більше можливо на нашому сайті, не гай часу — залітай!</a></b></blockquote>`;

const BUTTON = { text: "Встигни", url: URL_SITE };

const plain = TEXT
  .replace(/<tg-emoji[^>]*>(.*?)<\/tg-emoji>/g, "$1")
  .replace(/<\/?(b|blockquote)>/g, "")
  .replace(/<a [^>]*>(.*?)<\/a>/g, "$1");

/* --- Куди ------------------------------------------------------------------ */
const test = process.argv.includes("--test")
  ? process.argv[process.argv.indexOf("--test") + 1]
  : null;
const APPLY = process.argv.includes("--apply");

const people = await (await fetch(
  `${SB}/rest/v1/profiles?select=id,handle,telegram_id&telegram_id=not.is.null`,
  { headers },
)).json();

console.log("── підпис ──");
console.log(plain.split("\n").map((l) => "  " + (l || "·")).join("\n"));
console.log(`\nсимволів у підписі: ${plain.length} із 1024`);
console.log(`кнопка: «${BUTTON.text}» → ${BUTTON.url}`);
console.log(`фото: ${fs.statSync(PHOTO).size} байт`);
console.log(`отримувачів із привʼязаним телеграмом: ${people.length}`);

if (!test && !APPLY) {
  console.log("\nпробний прогін. --test <handle> щоб надіслати собі, --apply щоб поставити в чергу всім");
  process.exit(0);
}

/* --- Завантаження фото ----------------------------------------------------
   Один раз, у вказаний чат. Повертає `file_id`, яким далі користується вся
   черга: вантажити триста кілобайт у чотириста чатів — це і довго, і зайво. */
async function sendPhoto(chatId) {
  const form = new FormData();
  form.set("chat_id", String(chatId));
  form.set("caption", TEXT);
  form.set("parse_mode", "HTML");
  form.set("reply_markup", JSON.stringify({ inline_keyboard: [[BUTTON]] }));
  form.set("photo", new Blob([fs.readFileSync(PHOTO)]), "major-pickem.webp");
  const r = await (await fetch(`https://api.telegram.org/bot${TOKEN}/sendPhoto`, {
    method: "POST", body: form,
  })).json();
  if (!r.ok) throw new Error("sendPhoto: " + JSON.stringify(r).slice(0, 400));
  const sizes = r.result.photo;
  return sizes[sizes.length - 1].file_id;
}

if (test) {
  const who = people.find((p) => p.handle === test);
  if (!who) {
    console.log(`\nнемає такого: «${test}». Приклади: ${people.slice(0, 5).map((p) => p.handle).join(", ")}`);
    process.exit(1);
  }
  const fileId = await sendPhoto(who.telegram_id);
  console.log(`\nнадіслано «${who.handle}». file_id:\n${fileId}`);
  console.log("\nйого ж використає черга — перевір повідомлення й запускай --apply");
  process.exit(0);
}

/* --- Черга ---------------------------------------------------------------- */
const already = await (await fetch(
  `${SB}/rest/v1/tg_outbox?select=user_id&kind=eq.${KIND}`, { headers },
)).json();
const seen = new Set(already.map((r) => r.user_id));
const fresh = people.filter((p) => !seen.has(p.id));

if (!fresh.length) {
  console.log("\nусі вже в черзі — нічого додавати");
  process.exit(0);
}

/* Фото вантажиться один раз, у перший чат черги. Він отримає повідомлення
   одразу, решта — коли чергу вичерпають. */
const fileId = await sendPhoto(fresh[0].telegram_id);
console.log(`\nфото завантажено, file_id ${fileId.slice(0, 24)}…`);

const rows = fresh.slice(1).map((p) => ({
  user_id: p.id,
  kind: KIND,
  payload: { text: TEXT, button: BUTTON, photo: fileId },
  dedupe_key: `${KIND}:${p.id}`,
}));

for (let i = 0; i < rows.length; i += 200) {
  const r = await fetch(`${SB}/rest/v1/tg_outbox`, {
    method: "POST", headers: { ...headers, Prefer: "resolution=ignore-duplicates" },
    body: JSON.stringify(rows.slice(i, i + 200)),
  });
  if (!r.ok) throw new Error("черга: " + (await r.text()).slice(0, 300));
}

console.log(`у черзі ${rows.length} (перший отримав одразу)`);
console.log(`надіслати: node scripts/tg-drain.mjs ${KIND} --apply`);
