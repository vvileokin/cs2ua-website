import sharp from "sharp";

/**
 * Артворк EPL S24 під ті самі розміри, що й у попередніх івентів.
 *
 * Обкладинка картки малюється приблизно 800 на 300, герой — на всю ширину
 * стрічки. Камінь поінтів проходить через ту саму нормалізацію, що й решта
 * набору в `brand-icons.mjs`: вибілене тло вирізається, вміст обтинається і
 * ставиться по центру артборда 128×128, інакше він не стане в рядок із
 * сусідніми іконками.
 */
const SRC = "C:/Users/LNU/AppData/Local/Temp/claude/C--Users-LNU-Downloads-cs2-ua/2c786582-0939-414a-a921-6d1989e36ca5/images";
const OUT = "C:/Users/LNU/Downloads/cs2-ua/public/brand";
const ARTBOARD = 128;
/** Камінь майже квадратний і щільний, тож сидить усередині поля, як `points`. */
const OPTICAL = 0.86;

/* --- банери --- */
for (const j of [
  { from: `${SRC}/2.webp`, to: `${OUT}/epl-cover.webp`, w: 1000, h: 466 },
  { from: `${SRC}/3.webp`, to: `${OUT}/hero-epl.webp`, w: 1600, h: 596 },
]) {
  const info = await sharp(j.from).resize(j.w, j.h, { fit: "cover" }).webp({ quality: 82 }).toFile(j.to);
  console.log(`${j.to.split("/").pop().padEnd(20)} ${info.width}×${info.height} · ${Math.round(info.size / 1024)} КБ`);
}

/* --- камінь поінтів --- */
const raw = await sharp(`${SRC}/4.webp`).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
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
  .toFile(`${OUT}/points-epl.webp`);
console.log(`points-epl.webp       ${out.width}×${out.height} · ${Math.round(out.size / 1024)} КБ · вміст ${fitted.info.width}×${fitted.info.height}`);
