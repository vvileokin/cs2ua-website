import fs from "node:fs";
import path from "node:path";

/**
 * Точне старіння очок VRS до відсічення — за опублікованою формулою.
 *
 * Те, що я цілий день називав «фоном таблиці» й закривав симетричним шумом
 * σ=15, насправді ніякий не шум. HLTV публікує повний розклад кожної команди
 * (`/valve-ranking/teams/details/<дата>?lineup=<id через кому>`), і з нього
 * видно всю будову:
 *
 *   VRS = 400 + LAN wins + Opp. network + Bounty offered + Bounty collected + H2H
 *
 * і давнина кожного рядка:
 *
 *   recency(d) = 1,                       якщо d ≤ 30
 *                max(0, 1 − (d−30)/152),  далі
 *
 * Перевірено на дев'яти датах НАВІ до цілого відсотка, а сама сума — на
 * п'ятнадцяти командах до одиниці.
 *
 * Отже рух таблиці без жодного матчу обчислюється наперед: кожен рядок має
 * свою дату, значення в ньому пропорційне давнині, і до 2 листопада давнина
 * стане меншою на відому величину. Жодного калібрування тут немає.
 *
 * Чого цей розрахунок не бачить:
 *  • «10 найкращих» — коли рядок старіє, його може підмінити одинадцятий,
 *    якого на сторінці не показують. Для LAN wins це неважливо (там «10
 *    найсвіжіших», і нічого не входить саме собою), для решти трьох
 *    компонентів оцінка старіння виходить трохи завищена — тобто це межа
 *    зверху, а не точка.
 *  • H2H перераховується щоразу з нуля, бо залежить від рейтингів усіх
 *    суперників. Тут він старіє пропорційно, і це наближення.
 *
 * Запуск: node decay-exact.mjs [дата відсічення]
 */

const CUT = process.argv[2] ?? "2026-11-02";
const AS_OF = new Date(Date.UTC(2026, 9, 28));
const CUT_D = new Date(CUT + "T00:00:00Z");
const SPAN = Math.round((CUT_D - AS_OF) / 86400000);

const rec = (d) => (d <= 30 ? 1 : Math.max(0, 1 - (d - 30) / 152));
const daysOf = (iso, at) => {
  const [dd, mm, yy] = iso.split("/").map(Number);
  return Math.round((at - Date.UTC(2000 + yy, mm - 1, dd)) / 86400000);
};

/** Нове значення компонента через SPAN днів. */
const aged = (rows, at0, at1) => {
  let now = 0, then = 0, lost = [];
  for (const r of rows) {
    const [iso, v] = r.split("|");
    const pts = Number(v);
    const d0 = daysOf(iso, at0), r0 = rec(d0), r1 = rec(d0 + SPAN);
    now += pts;
    /* Нерозкладене значення рядка: показане ділимо на його ж давнину. Нижче
       3% давнини воно стає шумом поділу, тож такий рядок просто згасає. */
    if (r0 < 0.03) { lost.push([iso, pts, 0]); continue; }
    const base = pts / r0, next = base * r1;
    then += next;
    if (pts - next >= 1) lost.push([iso, pts, next]);
  }
  return { now, then, lost };
};

const DIR = "vrs-details";
const files = fs.readdirSync(DIR).filter((f) => f.endsWith(".json"));
const KEY = ["L", "N", "O", "C"];
const LABEL = { L: "LAN wins", N: "Opp. network", O: "Bounty offered", C: "Bounty collected" };
const IDX = { L: 0, N: 1, O: 2, C: 3 };

const out = [];
for (const f of files) {
  const j = JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8"));
  const parts = {};
  let sumThen = 0;
  for (const k of KEY) {
    const a = aged(j[k] ?? [], AS_OF, CUT_D);
    /* Показана сума компонента — єдина правда; дрібні розбіжності від
       округлення рядків переносимо на прогноз, а не ховаємо. */
    const shown = j.c[IDX[k]];
    const scale = a.now > 0 ? shown / a.now : 1;
    parts[k] = { now: shown, then: a.then * scale, lost: a.lost };
    sumThen += parts[k].then;
  }
  /* H2H: тих рядків я не збирав для всіх, тож він старіє пропорційно до
     середньої давнини решти — наближення, і воно позначене. */
  const h2hNow = j.c[4];
  const ratio = sumThen / KEY.reduce((s, k) => s + parts[k].now, 0);
  const h2hThen = h2hNow * ratio;
  const pThen = 400 + sumThen + h2hThen;
  out.push({ team: j.n, now: j.p, then: Math.round(pThen), d: Math.round(pThen - j.p), parts, h2hNow, h2hThen });
}

out.sort((a, b) => b.now - a.now);
console.log(`точне старіння 28 жовтня → ${CUT} (${SPAN} діб), без жодного матчу\n`);
console.log("команда             зараз   ${CUT.slice(5)}    рух    LAN    net    offer   collect   H2H".replace("${CUT.slice(5)}", "2 лист"));
for (const r of out) {
  const dd = (k) => {
    const v = r.parts[k].then - r.parts[k].now;
    return ((v >= 0 ? "+" : "") + v.toFixed(0)).padStart(7);
  };
  console.log(`  ${r.team.padEnd(18)}${String(r.now).padStart(5)}${String(r.then).padStart(9)}` +
    `${((r.d >= 0 ? "+" : "") + r.d).padStart(7)}` + dd("L") + dd("N") + dd("O") + dd("C") +
    `${((r.h2hThen - r.h2hNow >= 0 ? "+" : "") + (r.h2hThen - r.h2hNow).toFixed(0)).padStart(8)}`);
}

const navi = out.find((r) => r.team === "Natus Vincere");
console.log(`\nвідносно НАВІ (їхнє старіння ${navi.d}):`);
for (const r of out) {
  if (r.team === "Natus Vincere") continue;
  const rel = r.d - navi.d;
  console.log(`  ${r.team.padEnd(18)}${((rel >= 0 ? "+" : "") + rel).padStart(5)}` +
    `   ${rel > 2 ? "старіє повільніше за НАВІ — проти нас" : rel < -2 ? "старіє швидше за НАВІ — на нашу користь" : "старіє так само"}`);
}

console.log(`\nщо саме згасає в НАВІ до ${CUT}:`);
for (const k of KEY) {
  const l = navi.parts[k].lost.filter(([, a, b]) => a - b >= 1);
  if (!l.length) continue;
  console.log(`  ${LABEL[k]}:`);
  for (const [iso, a, b] of l)
    console.log(`    ${iso}   ${a} → ${b.toFixed(0)}   (${(b - a).toFixed(0)})`);
}

/* Ще одна річ, яку видно просто з розкладу: у кого компонент «LAN wins»
   упритул до межі. Там десять найсвіжіших перемог, кожна по 48 — отже в
   команди з повним списком нова перемога витісняє майже таку саму й додає
   майже нічого, а в команди з прорідженим списком додає всі 48. */
console.log("\nскільки дасть одна нова перемога на ЛАНі в компонент LAN wins:");
for (const r of out) {
  const j = JSON.parse(fs.readFileSync(path.join(DIR, files.find((f) =>
    JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8")).n === r.team)), "utf8"));
  const rows = (j.L ?? []).map((s) => Number(s.split("|")[1]));
  const displaced = rows.length >= 10 ? Math.min(...rows) : 0;
  console.log(`  ${r.team.padEnd(18)}+${String(48 - displaced).padStart(2)}   ` +
    `(у списку ${rows.length}, найслабша ${displaced || "—"})`);
}
