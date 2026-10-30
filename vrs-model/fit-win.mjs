import fs from "node:fs";
/**
 * Крива ймовірності перемоги від різниці очок VRS, зіставлена з лінією
 * букмекера.
 *
 * Привід: крок калібрувався на спостережених рухах таблиці, і для цього
 * однієї логістики з D=817.4 досить. Але та сама крива в симуляції визначає,
 * хто виграє матч, а на великих розривах вона плоска: 100 Thieves проти BARCA
 * дає 75%, а лінія дала б 90%. Якщо E занижене, то і крок KG(1−E) завищений,
 * і фаворит набирає більше, ніж набирає насправді.
 *
 * Тут беруться всі пари PGL Masters Bucharest зі ставками з beting-лінії та
 * очками з таблиці того ж дня, маржа знімається пропорційно, і шукається D,
 * яке мінімізує логарифмічну втрату.
 */
const M = [
  ["2410","Aurora","The MongolZ",1.36,3.10],["2410","FUT","TYLOO",1.22,4.20],
  ["2410","Spirit","BETBOOM",1.25,4.00],["2410","MOUZ","Liquid",1.15,5.33],
  ["2410","Vitality","9z",1.12,6.00],["2410","Legacy","Nemiga",1.35,3.20],
  ["2410","G2","Natus Vincere",2.14,1.70],["2410","FURIA","DENDELE",1.20,4.50],
  ["2510","FUT","Liquid",1.34,3.02],["2510","Vitality","The MongolZ",1.17,4.83],
  ["2510","FURIA","Natus Vincere",1.63,2.15],["2510","Spirit","TYLOO",1.12,5.50],
  ["2510","G2","Aurora",2.37,1.56],["2510","MOUZ","9z",1.30,3.42],
  ["2510","Legacy","DENDELE",1.30,3.42],
  ["2610","The MongolZ","MOUZ",3.33,1.32],["2610","Nemiga","Aurora",3.20,1.35],
  ["2610","Vitality","FUT",1.26,3.80],["2610","9z","TYLOO",1.40,2.90],
  ["2610","Spirit","FURIA",1.47,2.66],["2610","Liquid","Legacy",2.62,1.48],
  ["2610","BETBOOM","Natus Vincere",2.30,1.61],["2610","G2","DENDELE",1.30,3.50],
  ["2710","Liquid","Aurora",3.20,1.35],["2710","Nemiga","DENDELE",1.62,2.30],
  ["2710","Spirit","MOUZ",1.80,2.00],["2710","The MongolZ","Legacy",2.40,1.57],
  ["2710","Vitality","Natus Vincere",1.32,3.33],["2710","FURIA","TYLOO",1.12,6.00],
  ["2810","The MongolZ","Nemiga",1.57,2.40],["2810","Liquid","FURIA",3.20,1.35],
  ["2810","Spirit","Natus Vincere",1.36,3.10],
];
const SNAP = { "2410":"vrs-live-2410.json","2510":"vrs-live-2510.json","2610":"vrs-live-2610.json",
               "2710":"vrs-live-2710.json","2810":"vrs-live-2710.json" };
const tbl = {};
for (const [k,f] of Object.entries(SNAP)) {
  const m = new Map();
  for (const s of JSON.parse(fs.readFileSync(f,"utf8")).rows.split(";")) {
    const c = s.split("|"); if (!m.has(c[1])) m.set(c[1], +c[2]);
  }
  tbl[k] = m;
}
const ALIAS = { "BETBOOM":"BETBOOM" };
const rows = [];
for (const [d,a,b,oa,ob] of M) {
  const pa = tbl[d].get(ALIAS[a] ?? a), pb = tbl[d].get(ALIAS[b] ?? b);
  if (pa == null || pb == null) { console.log("немає очок:", a, b, d); continue; }
  const ia = 1/oa, ib = 1/ob, s = ia+ib;
  rows.push({ d, a, b, gap: pa-pb, p: ia/s });   // p — ринкова ймовірність для a
}
const Q = Math.log(10)/400, RD = 75;
const gl = 1/Math.sqrt(1 + (3*Q*Q*RD*RD)/(Math.PI*Math.PI));
const E = (gap, D) => 1/(1 + Math.pow(10, (gl*gap)/-D));
const loss = (D) => -rows.reduce((s,r)=> s + r.p*Math.log(E(r.gap,D)) + (1-r.p)*Math.log(1-E(r.gap,D)), 0)/rows.length;
let best = { D: 0, l: 1e9 };
for (let D = 200; D <= 1400; D += 2) { const l = loss(D); if (l < best.l) best = { D, l }; }
console.log(`пар: ${rows.length}`);
console.log(`найкраще D = ${best.D}  (втрата ${best.l.toFixed(4)})`);
console.log(`чинне  D = 817.4         (втрата ${loss(817.4).toFixed(4)})`);
console.log("\nрозрив   ринок   D=817   найкраще   різниця(817)");
for (const r of rows.slice().sort((x,y)=>x.gap-y.gap)) {
  const e1 = E(r.gap, 817.4), e2 = E(r.gap, best.D);
  console.log(String(Math.round(r.gap)).padStart(6) + (100*r.p).toFixed(0).padStart(8) + "%" +
    (100*e1).toFixed(0).padStart(7) + "%" + (100*e2).toFixed(0).padStart(10) + "%" +
    ((100*(e1-r.p)>=0?"+":"") + (100*(e1-r.p)).toFixed(0)).padStart(13) + `   ${r.a} – ${r.b}`);
}
/* Залишок як функція розриву: чи плоска крива саме на великих розривах. */
console.log("\nсередня різниця (D=817) за кошиками розриву:");
for (const [lo,hi] of [[0,80],[80,200],[200,350],[350,700]]) {
  const g = rows.filter(r=>Math.abs(r.gap)>=lo && Math.abs(r.gap)<hi);
  if (!g.length) continue;
  const d = g.reduce((s,r)=>{const e=E(Math.abs(r.gap),817.4); const p=r.gap>=0?r.p:1-r.p; return s+(e-p);},0)/g.length;
  console.log(`  ${lo}–${hi}: n=${g.length}  модель мінус ринок ${(100*d>=0?"+":"")+(100*d).toFixed(1)} в.п.`);
}
