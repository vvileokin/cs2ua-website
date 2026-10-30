import { simulate, LAST, P0, REGION } from "./engine-all.mjs";

/**
 * За яких обставин на мейджор заїдуть ДВІ з трьох: B8, fnatic, Inner Circle.
 *
 * Відсоток сам по собі тут не відповідь. Питання в тому, що саме має
 * збігтися, — тож прогони, де пара проходить, відбираються окремо, і далі
 * дивимось, чим вони відрізняються від решти: хто виграв який турнір і хто з
 * тих, що вище, не втримався.
 *
 * Запуск: node pairs.mjs [прогонів]
 */
const RUNS = Number(process.argv[2] ?? 30000);
const SLOTS = { europe: 18, americas: 9, asia: 5 };
const WATCH = ["1win", "100 Thieves", "HOTU", "FaZe", "Nemiga", "HEROIC", "BIG", "Inner Circle", "fnatic", "B8"];

const runs = [];
for (let i = 0; i < RUNS; i++) {
  const pts = simulate();
  const eu = Object.keys(REGION).filter((t) => REGION[t] === "europe");
  const order = eu.slice().sort((a, b) => pts.get(b) - pts.get(a));
  const place = {};
  order.forEach((t, k) => { place[t] = k + 1; });
  runs.push({ place, pts: new Map(pts),
              sr: LAST.srChamp, sr2: LAST.srSecond, sr3: LAST.srThird, sr4: LAST.srFourth,
              tc: LAST.tcChamp, tc2: LAST.tcSecond, tcSemi: LAST.tcSemi,
              fs: LAST.fs100Tplace, mcg: LAST.mcgChamp });
}
const IN = (r, t) => r.place[t] <= SLOTS.europe;
const pc = (x, n) => (n ? ((100 * x) / n).toFixed(0) : "0") + "%";

const PAIRS = [["B8", "fnatic"], ["B8", "Inner Circle"], ["Inner Circle", "fnatic"]];
console.log(`прогонів ${RUNS}\n`);

for (const [a, b] of PAIRS) {
  const both = runs.filter((r) => IN(r, a) && IN(r, b));
  console.log(`${a} + ${b} — разом ${((100 * both.length) / RUNS).toFixed(1).replace(".", ",")}%`);
  if (!both.length) { console.log("  не трапилось жодного разу\n"); continue; }

  /* Що в цих прогонах робили самі ці двоє. */
  const srPlace = (r, t) => (r.sr === t ? 1 : r.sr2 === t ? 2 : r.sr3 === t ? 3 : r.sr4 === t ? 4 : 5);
  for (const t of [a, b]) {
    if (["fnatic", "Inner Circle"].includes(t)) {
      const d = {};
      for (const r of both) { const p = srPlace(r, t); d[p] = (d[p] ?? 0) + 1; }
      const s = Object.entries(d).sort((x, y) => y[1] - x[1])
        .map(([p, c]) => `${p === "5" ? "5-6" : p + "-те"} ${pc(c, both.length)}`).join(" · ");
      console.log(`  ${t.padEnd(14)}на Stake Ranked: ${s}`);
    }
    if (t === "B8") {
      const champ = both.filter((r) => r.tc === "B8").length;
      const fin = both.filter((r) => r.tc2 === "B8").length;
      console.log(`  B8            на Tesla Cup: виграли ${pc(champ, both.length)} · фінал ${pc(fin, both.length)}` +
        ` · далі ${pc(both.length - champ - fin, both.length)}`);
    }
  }

  /* Хто з тих, що зараз вище, у цих прогонах не втримався. */
  console.log("  кого доводиться обійти:");
  for (const t of WATCH) {
    if (t === a || t === b) continue;
    const outAll = runs.filter((r) => !IN(r, t)).length / RUNS;
    const outPair = both.filter((r) => !IN(r, t)).length / both.length;
    if (outPair < 0.15) continue;
    console.log(`    ${t.padEnd(16)}випадає ${(100 * outPair).toFixed(0)}% таких прогонів` +
      `   (звичайно ${(100 * outAll).toFixed(0)}%)`);
  }
  console.log();
}

/* Ще один кут: скільки з трьох заїде взагалі. */
const cnt = new Map();
for (const r of runs) {
  const k = ["B8", "fnatic", "Inner Circle"].filter((t) => IN(r, t)).length;
  cnt.set(k, (cnt.get(k) ?? 0) + 1);
}
console.log("скільки з трьох (B8 · fnatic · Inner Circle) заїде:");
for (const k of [...cnt.keys()].sort((x, y) => x - y))
  console.log(`  ${k}  ${((100 * cnt.get(k)) / RUNS).toFixed(1).replace(".", ",")}%`);
