import { simulate, LAST, REGION } from "./engine-all.mjs";

/**
 * Яке місце на турнірі веде на мейджор.
 *
 * Питання просте й саме його питають: «а якщо програємо фінал — ще є шанс?»
 * Відповідь не в середньому відсотку, а в розкладі за місцями: для кожного
 * місця на своєму турнірі рахується, як часто команда після нього все ж
 * опиняється в межах вісімнадцяти.
 *
 * Запуск: node place-to-major.mjs [прогонів]
 */
const RUNS = Number(process.argv[2] ?? 30000);
const EU = Object.keys(REGION).filter((t) => REGION[t] === "europe");

const acc = {};           // команда → місце → { n, in }
const bump = (t, place, ok) => {
  (acc[t] ??= {});
  (acc[t][place] ??= { n: 0, in: 0 });
  acc[t][place].n++; if (ok) acc[t][place].in++;
};

for (let i = 0; i < RUNS; i++) {
  const pts = simulate();
  const order = EU.slice().sort((a, b) => pts.get(b) - pts.get(a));
  const place = {};
  order.forEach((t, k) => { place[t] = k + 1; });
  const ok = (t) => place[t] <= 18;

  const sr = (t) => (LAST.srChamp === t ? 1 : LAST.srSecond === t ? 2
    : LAST.srThird === t ? 3 : LAST.srFourth === t ? 4 : 5);
  for (const t of ["fnatic", "Inner Circle"]) bump(t, sr(t), ok(t));
  const tc = LAST.tcChamp === "B8" ? 1 : LAST.tcSecond === "B8" ? 2 : 3;
  bump("B8", tc, ok("B8"));
}

const NAME_SR = { 1: "виграли турнір", 2: "програли гранд-фінал", 3: "третє місце",
                  4: "четверте місце", 5: "п'яте-шосте й нижче" };
const NAME_TC = { 1: "виграли Tesla Cup", 2: "програли фінал", 3: "півфінал програли (3-4)" };

for (const [t, names] of [["fnatic", NAME_SR], ["Inner Circle", NAME_SR], ["B8", NAME_TC]]) {
  console.log(`\n${t}`);
  const rows = Object.entries(acc[t]).sort((a, b) => +a[0] - +b[0]);
  for (const [p, v] of rows) {
    const share = (100 * v.n) / RUNS, win = (100 * v.in) / v.n;
    console.log(`  ${names[p].padEnd(26)}буває ${share.toFixed(0).padStart(3)}%   ` +
      `→ на мейджор ${win < 0.5 ? "<1" : win.toFixed(0)}%`);
  }
}
