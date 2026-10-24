import sharp from "sharp";

/**
 * Артворк PGL Masters Bucharest під ті самі розміри, що й у попередніх івентів.
 *
 * Банер прийшов один — ключовий арт відкритих кваліфікацій, 1920×1080, з
 * локапом посередині і написом OPEN QUALIFIERS у нижній третині. На картку
 * турніру цей напис не йде: подія вже не кваліфікація, а сам мейн-івент.
 * Тому з нього береться верхня частина — рівно до того місця, де починається
 * текст, — і виходить та сама композиція, що й на офіційному банері події:
 * локап у центрі синього поля з топографічними лініями і кутовими скобами.
 *
 * Камінь поінтів проходить ту саму нормалізацію, що й решта набору в
 * `brand-icons.mjs`: вибілене тло вирізається, вміст обтинається і ставиться
 * по центру артборда 128×128, інакше він не стане в рядок із сусідніми
 * іконками.
 *
 * Запуск: node scripts/pgl-art.mjs
 */
const SRC = "C:/Users/LNU/AppData/Local/Temp/claude/C--Users-LNU-Downloads-cs2-ua/2c786582-0939-414a-a921-6d1989e36ca5/images";
const OUT = "C:/Users/LNU/Downloads/cs2-ua/public/brand";
const ARTBOARD = 128;
/** Камінь гранчастий і широкий у плечах, тож трохи тісніше, ніж у EPL. */
const OPTICAL = 0.84;

/* --- банери ---------------------------------------------------------- */
/* Вікно обрізки. Локап стоїть по центру кадру, напис OPEN QUALIFIERS
   починається приблизно на 70% висоти — беремо 0…0.72 і зсуваємо вікно трохи
   вниз від самого верху, щоб локап не притискався до верхнього краю картки. */
const BANNER = await sharp(`${SRC}/40.webp`).metadata();
const crop = {
  left: 0,
  top: Math.round(BANNER.height * 0.02),
  width: BANNER.width,
  height: Math.round(BANNER.height * 0.70),
};

for (const j of [
  { to: `${OUT}/pgl-cover.webp`, w: 1000, h: 466 },
  { to: `${OUT}/hero-pgl.webp`, w: 1600, h: 596 },
]) {
  const info = await sharp(`${SRC}/40.webp`)
    .extract(crop)
    .resize(j.w, j.h, { fit: "cover" })
    .webp({ quality: 82 })
    .toFile(j.to);
  console.log(`${j.to.split("/").pop().padEnd(20)} ${info.width}×${info.height} · ${Math.round(info.size / 1024)} КБ`);
}

/* --- камінь поінтів --------------------------------------------------- */
const raw = await sharp(`${SRC}/42.webp`).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { data, info } = raw;
/* Біле тло стає прозорим. Поріг високий, бо найсвітліші грані самого каменю
   лежать близько до білого: 250 лишає відблиски на місці, 240 вже їх з'їдає. */
for (let i = 0; i < data.length; i += info.channels) {
  const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
  if (r > 250 && g > 250 && b > 250) data[i + 3] = 0;
}
const cut = sharp(data, { raw: { width: info.width, height: info.height, channels: info.channels } });
const trimmed = await cut.png().trim({ threshold: 1 }).toBuffer();
const box = Math.round(ARTBOARD * OPTICAL);
const fitted = await sharp(trimmed)
  .resize(box, box, { fit: "inside", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .toBuffer({ resolveWithObject: true });
const out = await sharp({
  create: { width: ARTBOARD, height: ARTBOARD, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
})
  .composite([{
    input: fitted.data,
    top: Math.round((ARTBOARD - fitted.info.height) / 2),
    left: Math.round((ARTBOARD - fitted.info.width) / 2),
  }])
  .webp({ quality: 90 })
  .toFile(`${OUT}/points-pgl.webp`);
console.log(`points-pgl.webp       ${out.width}×${out.height} · ${Math.round(out.size / 1024)} КБ · вміст ${fitted.info.width}×${fitted.info.height}`);
