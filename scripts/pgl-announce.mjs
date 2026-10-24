import fs from "node:fs";

/**
 * Анонс старту PGL Masters Bucharest у бота.
 *
 * Два абзаци через порожній рядок і кнопка. Емодзі — власні, з двох пакунків
 * івенту, і це єдина причина, чому тут скрипт, а не рядок у таблиці:
 * ідентифікатори треба знати наперед, а взяти їх можна лише з `getStickerSet`.
 *
 *   t.me/addemoji/BLASTWEB              — логотипи події та команд
 *   t.me/addemoji/PGLBucharestMatches   — локап «NAVI проти G2», сім плиток
 *
 * Пакунок матчу складається рівно в тій послідовності, в якій лежить: три
 * плитки NAVI, дві щита-розділювача, дві G2. Тому порядок тут не вигаданий, а
 * взятий із самого пакунка, і fallback-гліфи (🇪🇺 / 🆚) — ті самі, що в ньому.
 * Якщо бот колись втратить Premium, `send` зніме теги й лишить ці гліфи.
 *
 * Розсилка йде через `tg_outbox`, а не напряму: черга вже вміє і повтори, і
 * двадцять п'ять за прогін, і не дати одній людині те саме двічі. Пряма
 * розсилка на три з половиною сотні чатів — це або перевищений ліміт, або
 * половина доставлених.
 *
 * Запуск:
 *   node scripts/pgl-announce.mjs                 — показати текст
 *   node scripts/pgl-announce.mjs --test <handle> — надіслати одній людині
 *   node scripts/pgl-announce.mjs --apply         — поставити в чергу всім
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

/** Емодзі з пакунка: ідентифікатор і гліф, яким воно підміниться без Premium. */
const e = (id, glyph) => `<tg-emoji emoji-id="${id}">${glyph}</tg-emoji>`;

/** BLASTWEB #0 — синій щит PGL. */
const PGL = e("5395374587666018318", "🇷🇴");

/** PGLBucharestMatches, усі сім по порядку: NAVI · проти · G2. */
const DUEL = [
  ["5395799939752174514", "🇪🇺"],
  ["5397677162583075078", "🇪🇺"],
  ["5395724459996916190", "🇪🇺"],
  ["5395530877230953285", "🆚"],
  ["5397975997817595202", "🆚"],
  ["5395656711182785764", "🇪🇺"],
  ["5395701666605474463", "🇪🇺"],
].map(([id, g]) => e(id, g)).join("");

const TEXT =
  `${PGL} <b>Стартує останній тір-1 івент перед мейджор, на ньому ми дізнаємось, ` +
  `які команди вже 100% пройдуть на найбільший турнір сезону!</b>\n\n` +
  `${DUEL}— ще й з такого матчу усе почнеться...`;

const BUTTON = {
  text: "встигни запредіктити",
  url: "https://cs2ua.com/tournaments/pgl-masters-bucharest-2026",
};

const payload = { text: TEXT, button: BUTTON };

const get = async (path) => {
  const r = await fetch(`${SB}/rest/v1/${path}`, { headers });
  if (!r.ok) throw new Error(`${path}: ${r.status} ${await r.text()}`);
  return r.json();
};

const plain = TEXT
  .replace(/<tg-emoji[^>]*>(.*?)<\/tg-emoji>/g, "$1")
  .replace(/<\/?b>/g, "");
console.log("як прочитається без Premium:\n");
console.log(plain.split("\n").map((l) => "  " + l).join("\n"));
console.log(`\nкнопка: [ ${BUTTON.text} ] → ${BUTTON.url}`);
console.log(`емодзі: 1 з BLASTWEB + 7 з PGLBucharestMatches`);

const testAt = process.argv.indexOf("--test");
if (testAt > -1) {
  const handle = process.argv[testAt + 1];
  if (!handle) throw new Error("--test потребує хендла");
  const [who] = await get(
    `profiles?select=handle,telegram_id&handle=eq.${encodeURIComponent(handle)}&telegram_id=not.is.null`,
  );
  if (!who) throw new Error(`${handle}: не знайдено або без telegram_id`);
  const r = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: who.telegram_id,
      text: TEXT,
      parse_mode: "HTML",
      link_preview_options: { is_disabled: true },
      reply_markup: { inline_keyboard: [[{ text: BUTTON.text, url: BUTTON.url }]] },
    }),
  }).then((x) => x.json());
  console.log(`\nтест → ${who.handle}: ${r.ok ? "надіслано" : "ПОМИЛКА — " + r.description}`);
} else if (process.argv.includes("--apply")) {
  /* Беремо всіх, у кого є чат із ботом. Сторінками, бо PostgREST віддає
     тисячу за раз, а мовчки обрізаний список — це недоставлений анонс. */
  const people = [];
  for (let from = 0; ; from += 1000) {
    const page = await get(
      `profiles?select=id&telegram_id=not.is.null&order=id&offset=${from}&limit=1000`,
    );
    people.push(...page);
    if (page.length < 1000) break;
  }
  /* Через `tg_enqueue`, а не прямим insert: функція сама мовчки пропускає
     тих, у кого вимкнена ця категорія сповіщень, і тих, кому цей самий факт
     уже клали. Прямий insert обходив би і те, і те — і спіткнувся б об
     `dedupe_key`, який у таблиці not null саме для цього. */
  const DEDUPE = "announce:pgl26-start";
  let queued = 0, skipped = 0;
  for (const person of people) {
    const r = await fetch(`${SB}/rest/v1/rpc/tg_enqueue`, {
      method: "POST", headers,
      body: JSON.stringify({
        p_user: person.id,
        p_kind: "announce",
        p_payload: payload,
        p_dedupe: `${DEDUPE}:${person.id}`,
      }),
    });
    if (!r.ok) throw new Error(`tg_enqueue: ${r.status} ${await r.text()}`);
    (await r.json()) ? queued++ : skipped++;
  }
  console.log(`
у черзі: ${queued} повідомлень${skipped ? `, пропущено ${skipped} (вимкнені сповіщення або вже поставлено)` : ""}`);
  console.log("крон вибирає по 25 за прогін — розсилка розтягнеться приблизно на чверть години");
} else {
  console.log("\nпробний прогін. --test <handle> щоб глянути в себе, --apply щоб поставити всім");
}
