import fs from "node:fs";

/**
 * Матчі, уже зіграні, але ще не в таблиці.
 *
 * Таблиця VRS на HLTV має дату, і ця дата відстає. Перевірено прямо: між
 * 19 і 20 жовтня Luminosity стоять на тих самих 1477 очках, хоч 20-го вони
 * двічі програли. Тобто прогін на снапшоті «20 жовтня» не бачить жодного
 * матчу, зіграного 20-го і 21-го, — а серед них є поразка Luminosity від
 * Nexus, команди з 1088 очками.
 *
 * Це не підкрутка під когось. Це той самий калібрований глікківський крок із
 * calib-step.mjs, прикладений до всіх зіграних матчів без винятку, і хто
 * виграв — підніметься, хто програв — опуститься, незалежно від того, чи це
 * комусь зручно.
 *
 * Чесно про межі методу. Крок асиметричний (перемоги ×2,16, поразки ×1,02),
 * бо VRS — не чистий Glicko: там чотири доданки, і три з них не бувають
 * відʼємними. На замкнутій сітці ця асиметрія створює очки з повітря, тому
 * окремо друкується сума накиданого, а режим SYMMETRIC=1 дає нульову суму
 * (обидва множники — середнє, 1,593) як межу чутливості.
 *
 * Запуск: node pending.mjs            → vrs-live-pending.json
 *         SYMMETRIC=1 node pending.mjs → vrs-live-pending-sym.json
 */

/* Призові події — це і є вага VRS: HLTV друкує її на сторінці турніру рівно
   як призовий фонд. Крок із calib-step.mjs заміряний на EPL, тобто на події
   зовсім іншого масштабу, і переносити його незмінним на кубок за п'ять тисяч
   немає підстав. Кривої ваги я не міряв, тому вона тут не захована в код, а
   стоїть окремим показником: WEIGHT_POWER=0 — крок повністю, без ваги;
   1 — лінійно за фондом щодо найбільшої події вікна. Публікуємо з поміткою,
   яке саме значення взяте. */
const POOL = {
  "Moscow CG": 181214, "CIS LAN 9": 50000, "DraculaN 7": 35000,
  "Circuit X Curitiba 4": 20000, "VOID Autumn Cup": 12000, "CCT": 10000,
  "ESL CL EU Cup 9": 5000,
};
const REF = 100000;
const POWER = Number(process.env.WEIGHT_POWER ?? 0);

/* Зіграно 20–21 жовтня, зі сторінки результатів HLTV. Переможець першим,
   третім — подія. Беремо лише матчі, де хоч одна сторона є в таблиці. */
const PLAYED = [
  // Digital Crusade DraculaN Season 7 — матч за третє місце
  ["Eternal Fire", "JiJieHao", "DraculaN 7"],
  // WINLINE MPKBK CIS LAN Season 9 — фінали
  ["Virtus.pro", "K27", "CIS LAN 9"], ["Virtus.pro", "UPGRADE", "CIS LAN 9"],
  ["Nemesis", "Black Phoenix", "CIS LAN 9"],
  // Circuit X Curitiba Season 4
  ["BESTIA", "Galorys", "Circuit X Curitiba 4"], ["Imperial", "ShindeN", "Circuit X Curitiba 4"],
  // MaceMedia VOID Autumn Cup 2026
  ["Rare Atom", "NEXVOID", "VOID Autumn Cup"], ["Lynn Vision", "Chinggis Warriors", "VOID Autumn Cup"],
  // CCT 2026 Europe Series 11 / 12 та Challengers Series 8
  ["BRUTE", "BAKS", "CCT"], ["INOX Division", "Black Phoenix", "CCT"],
  ["Nuclear TigeRES", "Illyrians", "CCT"], ["ex-Zero Tenacity", "ex-RUSTEC", "CCT"],
  ["ex-RUSTEC", "Saint Sinners", "CCT"], ["mellren", "Walczaki", "CCT"],
  ["Inner Circle Academy", "Spirit Academy", "CCT"], ["FORZE Reload", "LFO 10", "CCT"],
  ["Phantom Academy", "Banda Chuya", "CCT"], ["TitanFlow", "Ryvex", "CCT"],
  // CCT 2026 South America Series 7
  ["RED Canids Academy", "BESTIA Academy", "CCT"], ["BORRACHEIROS", "QUINTESSÊNCIA", "CCT"],
  ["Isurus", "Hacha", "CCT"], ["Grêmio", "Low Cortisol BR", "CCT"],
  // ESL Challenger League Season 52 Europe Cup 9
  ["MAYBE", "LPH", "ESL CL EU Cup 9"], ["WBT Academy", "LFO 10", "ESL CL EU Cup 9"],
  ["WBT Academy", "LPH", "ESL CL EU Cup 9"], ["LFO 10", "MAYBE", "ESL CL EU Cup 9"],
];

const SYM = process.env.SYMMETRIC === "1";
const { a, b } = JSON.parse(fs.readFileSync("step-scale.json", "utf8"));
const mid = (a + b) / 2;
const WIN_K = SYM ? mid : a, LOSS_K = SYM ? mid : b;

const snap = JSON.parse(fs.readFileSync(process.env.VRS_FILE ?? "vrs-live.json", "utf8"));
const rows = snap.rows.split(";").map((s) => {
  const [rank, team, pts, reg] = s.split("|");
  return { rank: +rank, team, pts: +pts, reg };
});
/* Назва може повторюватись (другі склади) — крок застосовуємо до першої,
   сильнішої появи, бо на ЛАН їздить вона. */
const idx = new Map();
rows.forEach((r, i) => { if (!idx.has(r.team)) idx.set(r.team, i); });

const Q = Math.log(10) / 400, RD = 75, D = 817.4;
const gl = 1 / Math.sqrt(1 + (3 * Q * Q * RD * RD) / (Math.PI * Math.PI));
const KG = Q * (1 / (1 / (RD * RD) + Q * Q * gl * gl * 0.25)) * gl;
const E = (pa, pb) => 1 / (1 + Math.pow(10, (gl * (pa - pb)) / -D));

const moved = new Map();
let created = 0, used = 0, skipped = [];
for (const [win, lose, ev] of PLAYED) {
  if (!idx.has(win) || !idx.has(lose)) { skipped.push(`${win} / ${lose}`); continue; }
  const W = rows[idx.get(win)], L = rows[idx.get(lose)];
  const w = Math.pow((POOL[ev] ?? 5000) / REF, POWER);
  const dw = w * WIN_K * KG * (1 - E(W.pts, L.pts));
  const dl = w * LOSS_K * -KG * E(L.pts, W.pts);
  W.pts += dw; L.pts += dl;
  moved.set(win, (moved.get(win) ?? 0) + dw);
  moved.set(lose, (moved.get(lose) ?? 0) + dl);
  created += dw + dl; used++;
}

const out = rows.slice().sort((x, y) => y.pts - x.pts)
  .map((r, i) => `${i + 1}|${r.team}|${Math.round(r.pts)}|${r.reg}`).join(";");
const file = process.env.OUT_FILE ?? (SYM ? "vrs-live-pending-sym.json" : "vrs-live-pending.json");
fs.writeFileSync(file, JSON.stringify({
  /* Дата зрізу — не дата таблиці, а дата останнього врахованого матчу,
     бо саме це читає сторінка. */
  asOf: process.env.AS_OF ?? snap.asOf,
  source: snap.source,
  note: `${snap.note} · ПОВЕРХ: ${used} матчів, зіграних 20–21 жовтня і ще не внесених у таблицю, ` +
        `прикладено каліброваним кроком, вага події^${POWER}` +
        `${SYM ? ", симетричний режим (нульова сума)" : ""}.`,
  rows: out,
}));

console.log(`${file} · WEIGHT_POWER ${POWER} · матчів прикладено ${used}${skipped.length ? `, пропущено ${skipped.length} (поза таблицею: ${skipped.join(", ")})` : ""}`);
console.log(`сума накиданих очок: ${created >= 0 ? "+" : ""}${created.toFixed(1)}${SYM ? "" : "  ← асиметрія кроку"}\n`);
console.log("команда                зміна");
for (const [t, d] of [...moved].sort((x, y) => Math.abs(y[1]) - Math.abs(x[1])))
  console.log(`  ${t.padEnd(20)}${(d >= 0 ? "+" : "") + d.toFixed(1)}`);
