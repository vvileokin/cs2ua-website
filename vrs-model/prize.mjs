import fs from "node:fs";

/**
 * Призові як окремий доданок VRS — скільки очок дають гроші.
 *
 * Привід: у прогнозі Mischief майже вся таблиця йде вниз до відсічення, а в
 * нас ні. Перевірка (decay.mjs) показала, що він неправий — ті, хто не грає,
 * за п'ять днів набрали медіанних +9, а не впали. Отже його числа — це шкала
 * його власного рушія, і порівнювати з HLTV їх у штуках не можна.
 *
 * Зате порівняння оголило справжню нашу діру. Калібрований крок рахує лише
 * результати матчів, а VRS складається з чотирьох доданків, і один із них —
 * зароблені призові. У наших залишках це видно прямо: ті, хто вилетів із
 * Private Club 2 і забрав по 7 500, вийшли на +26 і +34 краще за прогноз, а
 * Luminosity, які стали 13-16 на DraculaN, де не платять нічого, — на +3.
 *
 * Тут це міряється як належить: беремо дограний Private Club 2, рахуємо крок
 * по всіх чотирнадцяти серіях від таблиці 18 жовтня, зіставляємо з таблицею
 * 23-го і дивимось, чи лягає залишок на призові.
 *
 * Запуск: node prize.mjs
 */

const SERIES = [
  ["PARIVISION", "magic"], ["fnatic", "Liquid"], ["BIG", "PRIVATE"], ["The MongolZ", "Alliance"],
  ["PARIVISION", "fnatic"], ["BIG", "The MongolZ"], ["magic", "Liquid"], ["PRIVATE", "Alliance"],
  ["PRIVATE", "fnatic"], ["The MongolZ", "magic"], ["The MongolZ", "PRIVATE"],
  ["PARIVISION", "BIG"], ["The MongolZ", "BIG"], ["The MongolZ", "PARIVISION"],
];
const PRIZE = {
  "The MongolZ": 25000, "PARIVISION": 17500, "BIG": 13500, "PRIVATE": 11000,
  "fnatic": 9000, "magic": 9000, "Liquid": 7500, "Alliance": 7500,
};

const P = (f) => {
  const m = new Map();
  for (const s of JSON.parse(fs.readFileSync(f, "utf8")).rows.split(";")) {
    const c = s.split("|");
    const t = c.length >= 3 ? c[1] : c[0];
    if (!m.has(t)) m.set(t, +(c.length >= 3 ? c[2] : c[1]));
  }
  return m;
};
const was = P("vrs-table-1810.json"), now = P("vrs-live-2310.json");

const Q = Math.log(10) / 400, RD = 75, D = 817.4;
const gl = 1 / Math.sqrt(1 + (3 * Q * Q * RD * RD) / (Math.PI * Math.PI));
const KG = Q * (1 / (1 / (RD * RD) + Q * Q * gl * gl * 0.25)) * gl;
const E = (pa, pb) => 1 / (1 + Math.pow(10, (gl * (pa - pb)) / -D));
const { a: WIN_K, b: LOSS_K } = JSON.parse(fs.readFileSync("step-scale.json", "utf8"));

/* Крок прикладається послідовно, від поточних очок — як це робить рушій. */
const cur = new Map(Object.keys(PRIZE).map((t) => [t, was.get(t)]));
const step = new Map(Object.keys(PRIZE).map((t) => [t, 0]));
for (const [w, l] of SERIES) {
  const dw = WIN_K * KG * (1 - E(cur.get(w), cur.get(l)));
  const dl = LOSS_K * -KG * E(cur.get(l), cur.get(w));
  cur.set(w, cur.get(w) + dw); cur.set(l, cur.get(l) + dl);
  step.set(w, step.get(w) + dw); step.set(l, step.get(l) + dl);
}

/* Загальний дрейф таблиці за ці п'ять днів у тих, хто не грав, — +9 очок
   (decay.mjs). Віднімаємо, щоб не приписати його призовим. */
const DRIFT = 9;

console.log("1win Private Club Season 2 · 18 → 23 жовтня · 14 серій\n");
console.log("команда        призові   18.10   23.10   факт   крок   дрейф   лишок");
const pts = [];
for (const t of Object.keys(PRIZE).sort((a, b) => PRIZE[b] - PRIZE[a])) {
  const act = now.get(t) - was.get(t);
  const res = act - step.get(t) - DRIFT;
  pts.push({ t, prize: PRIZE[t], res });
  console.log(`  ${t.padEnd(13)}${String(PRIZE[t]).padStart(7)}${String(was.get(t)).padStart(8)}` +
    `${String(now.get(t)).padStart(8)}${((act >= 0 ? "+" : "") + act).padStart(7)}` +
    `${((step.get(t) >= 0 ? "+" : "") + step.get(t).toFixed(0)).padStart(7)}` +
    `${("+" + DRIFT).padStart(8)}${((res >= 0 ? "+" : "") + res.toFixed(0)).padStart(8)}`);
}

/* Регресія лишку на призові через початок координат: нуль грошей — нуль очок. */
const num = pts.reduce((s, r) => s + r.prize * r.res, 0);
const den = pts.reduce((s, r) => s + r.prize * r.prize, 0);
const k = num / den;
const pred = (p) => k * p;
const rms = Math.sqrt(pts.reduce((s, r) => s + (r.res - pred(r.prize)) ** 2, 0) / pts.length);
const rmsNo = Math.sqrt(pts.reduce((s, r) => s + r.res ** 2, 0) / pts.length);

console.log(`\nнахил: ${(1000 * k).toFixed(2)} очка на тисячу доларів`);
console.log(`похибка з призовими ${rms.toFixed(1)} очка, без них ${rmsNo.toFixed(1)}`);
console.log(k > 0 && rms < rmsNo
  ? "→ гроші справді дають очки, і крок без них систематично занижує"
  : "→ зв'язку з призовими не видно");
console.log("\nщо це означає для подій попереду (за цим нахилом):");
for (const [name, p] of [["Бухарест, 9-11 місце", 15625], ["Бухарест, 5-8", 25000],
  ["Бухарест, 3-тє", 68750], ["Бухарест, 1-ше", 225000], ["Tesla Cup, 1-ше", 30000],
  ["Stake Ranked 5, 1-ше", 25000], ["Retake 13, 1-ше", 9348], ["Moscow CG, 1-ше", 96646]])
  console.log(`  ${name.padEnd(24)}$${String(p).padStart(7)}  →  ${pred(p) >= 0 ? "+" : ""}${pred(p).toFixed(0)} очка`);
