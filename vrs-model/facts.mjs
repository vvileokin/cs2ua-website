import { simulate, P0, REGION } from "./engine-all.mjs";

/**
 * Відповіді, а не описи.
 *
 * Таблиця відсотків каже, ЩО буде. Цей файл відповідає на питання, які
 * насправді питають: кому вже нічого не треба, кому чого бракує, який матч
 * коштує найбільше і що саме має статись, щоб когось викинуло.
 *
 * Запуск: node facts.mjs [прогонів]
 */
const RUNS = Number(process.argv[2] ?? 25000);
const SLOTS = { europe: 18, americas: 9, asia: 5 };

/* ---- збір сирих прогонів: по кожному зберігаємо всю таблицю ---- */
const runs = [];
for (let i = 0; i < RUNS; i++) {
  const pts = simulate();
  const row = {};
  for (const reg of ["europe", "americas", "asia"]) {
    const list = Object.keys(REGION).filter((t) => REGION[t] === reg);
    const order = list.slice().sort((a, b) => pts.get(b) - pts.get(a));
    order.forEach((t, k) => { row[t] = k + 1; });
  }
  runs.push({ place: row, pts: new Map(pts) });
}
const share = (f) => runs.filter(f).length / runs.length;
const pct = (v) => (v > 0.999 ? ">99,9" : v < 0.001 ? "<0,1" : (100 * v).toFixed(1).replace(".", ",")) + "%";
const inAt = (r, t) => r.place[t] <= SLOTS[REGION[t]];

console.log("=== 1. Кому вже нічого не треба ===");
console.log("(жоден прогін не виводить їх за межу — тобто ніякий результат уже не завадить)\n");
for (const t of Object.keys(REGION)) {
  const bad = runs.filter((r) => !inAt(r, t)).length;
  const p = 1 - bad / runs.length;
  if (p > 0.999 && P0.get(t) < 1800) {
    const worst = Math.max(...runs.map((r) => r.place[t]));
    console.log(`  ${t.padEnd(18)}${String(P0.get(t)).padStart(5)}   найгірше місце у ${RUNS} прогонах — ${worst}`);
  }
}

console.log("\n=== 2. Скільки очок бракує тим, хто на межі ===");
console.log("(межа — очки 18-ї/9-ї/5-ї команди регіону в кінці)\n");
for (const reg of ["europe", "americas", "asia"]) {
  const cut = runs.map((r) => {
    const list = Object.keys(REGION).filter((t) => REGION[t] === reg);
    return list.map((t) => r.pts.get(t)).sort((a, b) => b - a)[SLOTS[reg] - 1];
  });
  const med = cut.slice().sort((a, b) => a - b)[Math.floor(cut.length / 2)];
  console.log(`  ${{ europe: "Європа", americas: "Америка", asia: "Азія" }[reg]}: межа стане ≈ ${med.toFixed(0)} очок`);
  const bubble = Object.keys(REGION).filter((t) => REGION[t] === reg)
    .map((t) => ({ t, p: share((r) => inAt(r, t)) }))
    .filter((x) => x.p > 0.02 && x.p < 0.97)
    .sort((a, b) => b.p - a.p);
  for (const b of bubble)
    console.log(`    ${b.t.padEnd(18)}${String(P0.get(b.t)).padStart(5)}  треба ще ${Math.max(0, Math.round(med - P0.get(b.t)))}  ·  ${pct(b.p)}`);
}

console.log("\n=== 3. Чи можуть пройти обидва / всі одразу ===");
const pairs = [["B8", "fnatic"], ["B8", "100 Thieves"], ["fnatic", "Inner Circle"],
               ["fnatic", "BIG"], ["Inner Circle", "BIG"]];
for (const [a, b] of pairs)
  console.log(`  ${(a + " і " + b).padEnd(30)}разом ${pct(share((r) => inAt(r, a) && inAt(r, b)))}` +
    `   ·   жоден ${pct(share((r) => !inAt(r, a) && !inAt(r, b)))}`);
const ours = ["Natus Vincere", "FUT", "G2", "Astralis", "B8", "fnatic", "Inner Circle", "Eternal Fire"];
const cnt = new Map();
for (const r of runs) { const k = ours.filter((t) => inAt(r, t)).length; cnt.set(k, (cnt.get(k) ?? 0) + 1); }
console.log("\n  скільки наших вісьмох поїде:");
for (const k of [...cnt.keys()].sort((a, b) => a - b))
  console.log(`    ${k} команд${k === 1 ? "а" : k < 5 ? "и" : ""}  ${pct(cnt.get(k) / runs.length)}`);

console.log("\n=== 4. Що має статись, щоб Lynn Vision вилетіли ===");
console.log("(вони не грають жодного матчу — отже залежать тільки від інших)\n");
const lvOut = runs.filter((r) => !inAt(r, "Lynn Vision"));
console.log(`  вилітають у ${pct(lvOut.length / runs.length)} прогонів. Хто їх обходить:`);
for (const t of ["5star", "Chinggis Warriors", "FlyQuest", "TYLOO", "NEXVOID"]) {
  const over = lvOut.filter((r) => r.pts.get(t) > r.pts.get("Lynn Vision")).length;
  if (over / Math.max(1, lvOut.length) > 0.05)
    console.log(`    ${t.padEnd(18)}${((100 * over) / lvOut.length).toFixed(0)}% таких прогонів`);
}

console.log("\n=== 5. Найдорожчий матч завтра ===");
console.log("(різниця у відсотку проходу між перемогою і поразкою)\n");
const MATCHES = [
  ["FUT", "Nemiga"], ["Vitality", "Natus Vincere"], ["Aurora", "MOUZ"], ["BETBOOM", "FURIA"],
  ["B8", "HOTU"], ["Eternal Fire", "BIG"], ["Astralis", "Inner Circle"], ["fnatic", "MIBR"],
  ["5star", "Chinggis Warriors"],
];
const rows = [];
for (const [a, b] of MATCHES) {
  for (const who of [a, b]) {
    const won = runs.filter((r) => r.pts.get(who) > r.pts.get(who === a ? b : a));
    const lost = runs.filter((r) => r.pts.get(who) <= r.pts.get(who === a ? b : a));
    if (won.length < 200 || lost.length < 200) continue;
    const pw = won.filter((r) => inAt(r, who)).length / won.length;
    const pl = lost.filter((r) => inAt(r, who)).length / lost.length;
    rows.push({ m: `${a} — ${b}`, who, pw, pl, d: Math.abs(pw - pl) });
  }
}
rows.sort((x, y) => y.d - x.d);
for (const r of rows.slice(0, 8))
  console.log(`  ${r.m.padEnd(28)}${r.who.padEnd(18)}виграє ${pct(r.pw).padStart(7)}  програє ${pct(r.pl).padStart(7)}  ·  ${(100 * r.d).toFixed(0)} п.`);
