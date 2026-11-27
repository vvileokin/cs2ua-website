import fs from "node:fs";

/**
 * Анонс МЕГА-розіграшу — з картинкою.
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
 * Смуга — ВІСІМ плиток «РОЗІГРАШ ВІД CS2UA», і беруться вони з початку
 * пакунка та в зворотному порядку. Два незвичні правила, обидва здобуті
 * дослідом, а не здогадом: у пакунку тепер шістнадцять плиток прапора —
 * вісім нових для розіграшу й вісім старих для пікема, — а Telegram віддає
 * нові задом наперед. Складені «як є», вони дають «A 2UA CS ВІДАШІГРРОЗ».
 *
 * Тому перед надсиланням смуга збирається в картинку й на неї дивляться.
 * Інакше це не перевіряється ніяк: у відповіді API всі шістнадцять плиток
 * однакові й підписані тим самим прапором.
 *
 * Усередині тега стоїть той самий гліф, що й у пакунка: якщо бот колись
 * втратить Premium, замість плиток лишиться сім прапорів, а не сім скріпок.
 *
 * Черга — `tg_outbox`, як і в усіх інших розсилок: вона вміє і повтори, і
 * темп, і не дати людині те саме двічі.
 *
 * Свій `KIND`, і це не дрібниця: черга не дає людині те саме двічі за тим
 * самим видом, а всі, хто має телеграм, уже лежать у ній з попередніми
 * анонсами. Під чужим іменем ця розсилка не пішла б нікому.
 *
 * Запуск:
 *   node scripts/giveaway-announce.mjs                 — показати, що піде
 *   node scripts/giveaway-announce.mjs --test <handle> — надіслати одній людині
 *   node scripts/giveaway-announce.mjs --apply         — поставити в чергу всім
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

const KIND = "major-giveaway";
const URL_SITE = "https://cs2ua.com/giveaways/mega-major-singapore-2026";
/* Картинка лежить у репозиторії, а не в теці завантажень: скрипт мусить
   запускатися з будь-якої машини, а не з тієї, куди її колись поклали. */
const PHOTO = new URL("../public/brand/major-giveaway-post.jpg", import.meta.url);

/* --- Емодзі ---------------------------------------------------------------
   Беремо з пакунка, а не вписуємо ідентифікатори: вони міняються, коли
   пакунок перескладають, і вписані числа тихо перетворюються на порожнечу. */
const set = await (await fetch(
  `https://api.telegram.org/bot${TOKEN}/getStickerSet?name=SingaporePickemWeb`,
)).json();
if (!set.ok) throw new Error("пакунок емодзі не відкрився: " + JSON.stringify(set));

const flags = set.result.stickers.filter((s) => s.emoji === "🇸🇬");
const ua = set.result.stickers.find((s) => s.emoji === "🇺🇦");
if (flags.length < 8 || !ua) throw new Error("у пакунку не ті плитки");

const em = (s) => `<tg-emoji emoji-id="${s.custom_emoji_id}">${s.emoji}</tg-emoji>`;

/* --- Текст ----------------------------------------------------------------
   Підпис до фото, тому ліміт 1024 символи, а не 4096. Рахуємо його без
   тегів: Telegram міряє довжину по тексту, а не по розмітці. */
const TEXT =
  flags.slice(0, 8).reverse().map(em).join("") +
  "\n\n" +
  `<b>${em(ua)} Шановні підписники, ми розпочинаємо МЕГА-потужний розіграш на сайті в честь PGL Major Singapore 2026!</b>` +
  "\n\n" +
  `<blockquote><b>👉 <a href="${URL_SITE}">Умови розіграшу: підписка на наш телеграм канал та реєстрація на сайті через Телеграм для того щоб взяти участь.</a></b></blockquote>`;

const BUTTON = { text: "Увійти", url: URL_SITE };

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
  form.set("photo", new Blob([fs.readFileSync(PHOTO)]), "major-giveaway.jpg");
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

/* Фото вантажиться один раз, у перший чат, який його ПРИЙМЕ. Саме так, а
   не «в перший у списку»: людина могла заблокувати бота, і тоді Telegram
   відповідає 403. Перша версія бралася за `fresh[0]` наосліп, і через
   одного такого падала вся розсилка, не поставивши в чергу нікого.

   Хто відмовив — лишається в черзі нарівні з рештою: розбиратися, кому вже
   нічого не дійде, має вичерпувач черги, а не анонс. */
let fileId = null;
let host = -1;
const refused = [];
for (let i = 0; i < fresh.length && !fileId; i++) {
  try {
    fileId = await sendPhoto(fresh[i].telegram_id);
    host = i;
  } catch (e) {
    refused.push(`${fresh[i].handle ?? fresh[i].id}: ${String(e.message).slice(-70)}`);
  }
}
if (!fileId) throw new Error("жоден чат не прийняв фото: " + refused.join("; "));
if (refused.length) {
  console.log(`\nне прийняли фото, лишаються в черзі: ${refused.length}`);
  for (const r of refused.slice(0, 5)) console.log("  " + r);
}
console.log(`\nфото завантажено в чат «${fresh[host].handle}», file_id ${fileId.slice(0, 24)}…`);

const rows = fresh.filter((_, i) => i !== host).map((p) => ({
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
