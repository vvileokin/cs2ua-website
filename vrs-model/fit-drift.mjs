import fs from "node:fs";
/**
 * Дрейф таблиці поверх кроку: лінійна залежність залишку від рівня очок.
 *
 * verify-buch.mjs показав, що залишки не випадкові — вони вишикувані за
 * рівнем. Vitality на 2000 падають на 28 очок більше за прогноз, НАВІ на 1498
 * зростають на 29 більше, і між ними майже пряма. Це те, чого крок не бачить
 * у принципі: старі результати виходять із дванадцятимісячного вікна, і в тих,
 * у кого попереду великі здобутки, вони випадають важче.
 *
 * Таке саме явище decay.mjs намацав з іншого боку: команди, які не грали
 * взагалі, за п'ять днів набрали медіанних +9. Тут воно міряється як нахил.
 */
const ROWS = [
  ["Vitality",2000,7,-21],["MOUZ",1915,66,42],["FURIA",1899,-27,-32],["Spirit",1889,26,10],
  ["Aurora",1846,62,36],["BETBOOM",1763,45,50],["Legacy",1736,-23,-47],["G2",1679,-34,-40],
  ["FUT",1672,72,106],["9z",1555,-30,-36],["Nemiga",1537,8,-2],["The MongolZ",1534,28,55],
  ["Liquid",1512,23,27],["Natus Vincere",1498,32,61],["DENDELE",1364,25,28],["TYLOO",1241,36,45],
];
const DAYS = 3.1;                       // 24.10 20:09 → 27.10 21:35
const xs = ROWS.map(r => r[1]), res = ROWS.map(r => r[3] - r[2]);
const mx = xs.reduce((a,b)=>a+b,0)/xs.length, mr = res.reduce((a,b)=>a+b,0)/res.length;
let sxy = 0, sxx = 0;
for (let i = 0; i < xs.length; i++) { sxy += (xs[i]-mx)*(res[i]-mr); sxx += (xs[i]-mx)**2; }
const beta = sxy/sxx, alpha = mr - beta*mx;
const pred = xs.map(x => alpha + beta*x);
const ssTot = res.reduce((s,r)=>s+(r-mr)**2,0);
const ssRes = res.reduce((s,r,i)=>s+(r-pred[i])**2,0);
console.log(`n=${xs.length}  вікно ${DAYS} доби`);
console.log(`залишок = ${alpha.toFixed(1)} ${beta>=0?"+":"-"} ${Math.abs(beta).toFixed(4)}·очки`);
console.log(`нульовий рівень: ${(-alpha/beta).toFixed(0)} очок  ·  R² = ${(1-ssRes/ssTot).toFixed(2)}`);
console.log(`за добу: ${(beta/DAYS*100).toFixed(2)} очка на кожні 100 очок рейтингу вище нульового рівня`);
console.log(`\nрозкид навколо прямої: ${Math.sqrt(ssRes/(xs.length-2)).toFixed(1)} очка (було ${Math.sqrt(res.reduce((s,r)=>s+r*r,0)/xs.length).toFixed(1)} без неї)`);
console.log("\nщо це дає на 5 днів до відсічення:");
for (const p of [1900,1700,1560,1500,1450,1400,1350]) {
  const perDay = (alpha + beta*p)/DAYS;
  console.log(`  ${p} очок → ${(perDay*5>=0?"+":"")+(perDay*5).toFixed(0)} за 5 днів`);
}
console.log("\nпо командах:");
console.log("команда          очки  залишок  пряма  решта");
for (let i = 0; i < ROWS.length; i++)
  console.log(`  ${ROWS[i][0].padEnd(15)}${String(xs[i]).padStart(5)}` +
    `${((res[i]>=0?"+":"")+res[i]).padStart(9)}${((pred[i]>=0?"+":"")+pred[i].toFixed(0)).padStart(7)}` +
    `${((res[i]-pred[i]>=0?"+":"")+(res[i]-pred[i]).toFixed(0)).padStart(7)}`);
