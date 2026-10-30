import fs from "node:fs";
import { LIVE } from "./vrs.mjs";

/**
 * Кваліфікації, що вирішують місце до відсічення — з того стану, в якому вони
 * насправді зараз.
 *
 * Кожна сітка описана своїм справжнім станом, знятим зі сторінки HLTV: зіграні
 * пари зафіксовані, незіграні розігруються. Формат теж узятий звідти.
 *
 * Стан на 13 вересня. Усі кваліфікації PGL Masters Bucharest дограні: Nemiga
 * взяли європейську, DENDELE південноамериканську, Liquid північноамериканську,
 * TYLOO — азійський фінал трьох. Усі четверо тепер у календарі серед учасників,
 * склад турніру повний, і розігрувати там більше нічого. Лишилась одна сітка —
 * плей-ін закритої кваліфікації Thunderpick.
 */

/* Перше входження, а не останнє: список іде за спаданням рейтингу, і десятки
   назв у ньому належать двом різним командам. Побудований звичайним способом —
   Map з усього списку — виграє останній, і HOTU дістають рейтинг команди з
   двохсот сімдесятого місця. Цей збіг бив по проєкту вже шість разів. */
const RATE = new Map();
for (const t of LIVE) if (!RATE.has(t.team)) RATE.set(t.team, t.points);
const FLOOR = 380;
const UNRANKED = new Set();
const rate = (n) => {
  const v = RATE.get(n);
  if (v === undefined) { UNRANKED.add(n); return FLOOR; }
  return v;
};

const D = 817.3976863341695;   // калібрований дільник моделі
const G = 0.972821;
const pMap = (a, b) => 1 / (1 + Math.pow(10, (G * (b - a)) / D));
const C = (n, r) => { let v = 1; for (let i = 0; i < r; i++) v = v * (n - i) / (i + 1); return v; };
const bo = (p, n) => { let s = 0; for (let w = (n + 1) / 2; w <= n; w++) s += C(n, w) * p ** w * (1 - p) ** (n - w); return s; };
const pSeries = (a, b, n) => bo(pMap(a, b), n);

let seed = 987654321 >>> 0;
const rnd = () => { seed ^= seed << 13; seed >>>= 0; seed ^= seed >> 17; seed ^= seed << 5; seed >>>= 0; return seed / 4294967296; };
const T = (n) => [n, rate(n)];
const play = (x, y, n) => (rnd() < pSeries(x[1], y[1], n) ? [x, y] : [y, x]);

const N = Number(process.argv[2] ?? 200000);
const tally = (names) => new Map(names.map((n) => [n, 0]));
const report = (title, sub, wins) => {
  console.log(`\n${title}`);
  if (sub) console.log(`  ${sub}`);
  console.log("  " + "команда".padEnd(22) + "VRS".padStart(6) + "проходить".padStart(12));
  const out = {};
  for (const [name, c] of [...wins].sort((a, b) => b[1] - a[1])) {
    out[name] = c / N;
    console.log("  " + name.padEnd(22) + String(rate(name)).padStart(6) + (c / N * 100).toFixed(1).padStart(11) + "%");
  }
  return out;
};
const simulate = (names, once) => {
  const wins = tally(names);
  for (let i = 0; i < N; i++) { const w = once()[0]; wins.set(w, wins.get(w) + 1); }
  return wins;
};

/* ------------------------------------------------------------------ */
/* PGL Masters Bucharest — усі чотири кваліфікації завершені           */
/* ------------------------------------------------------------------ */

console.log("\nPGL Masters Bucharest · кваліфікації завершені");
console.log("  Європа: Nemiga 3:0 B8 (12 вересня)");
console.log("  Південна Америка: DENDELE 3:1 Fluxo (13 вересня)");
console.log("  Північна Америка: Liquid 3:2 NRG, до того 2:1 Voca у втішному фіналі (13 вересня)");
console.log("  Азія: DEPO 2:0 FlyQuest, TYLOO 3:0 DEPO у фіналі (13 вересня)");

/* ------------------------------------------------------------------ */
/* Thunderpick World Championship — закрита кваліфікація               */
/* ------------------------------------------------------------------ */

/**
 * HOTU уже у фіналі: обіграли 100 Thieves 2:0 і BBL 2:1. У другому півфіналі
 * HEROIC, які пройшли 1win 2:1, грають проти Virtus.pro. Гранд-фінал у
 * розкладі HLTV стоїть як Bo3, хоча сторінка формату турніру пише Bo5; розклад —
 * це конкретний призначений матч, тож узято його.
 */
const TP_SEMI = ["HEROIC", "Virtus.pro"];
const TP_FINALIST = "HOTU";
const TP_FINAL_BO = 3;
const thunder = report(
  "Thunderpick World Championship · закрита кваліфікація · 1 місце",
  `${TP_FINALIST} у фіналі · півфінал ${TP_SEMI.join(" — ")} (Bo3) · фінал Bo${TP_FINAL_BO}`,
  simulate([TP_FINALIST, ...TP_SEMI], () => {
    const semi = play(T(TP_SEMI[0]), T(TP_SEMI[1]), 3)[0];
    return play(T(TP_FINALIST), semi, TP_FINAL_BO)[0];
  }));

/* Сіток Бухареста більше нема: місця розіграні, переможці в складі турніру.
   Файли лишаються порожніми, а не зникають, бо книга читає їх за назвою. */
fs.writeFileSync("qual.json", JSON.stringify({}, null, 1));
fs.writeFileSync("qual-buch-americas.json", JSON.stringify({}, null, 1));
fs.writeFileSync("qual-buch-asia.json", JSON.stringify({}, null, 1));
fs.writeFileSync("qual-thunder.json", JSON.stringify(thunder, null, 1));

if (UNRANKED.size) console.log(`\nпоза рейтингом (пораховані як ${FLOOR}): ${[...UNRANKED].join(", ")}`);
console.log(`\nзаписано 4 файли · ${N.toLocaleString("uk-UA")} розіграшів`);
