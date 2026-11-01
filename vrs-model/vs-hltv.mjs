import fs from "node:fs";

/**
 * Звірка нашого прогону з прогнозом HLTV.
 *
 * ГОЛОВНЕ, ЩО ТРЕБА ЗНАТИ ПРО ЇХНЮ ТАБЛИЦЮ: напис CLINCHED — це НЕ 100% і
 * навіть не поточна оцінка. Виноска під таблицею каже прямо: «The team ranks
 * into a spot itself in more than 99.5% of the simulated seasons… **Once
 * called, a team stays called unless that falls below 70%**». Тобто бейдж
 * липкий: його ставлять один раз і знімають лише нижче 70%.
 *
 * 1 листопада 2026 Eternal Fire стояли з написом CLINCHED, а в блоці
 * «SINCE YESTERDAY» того ж екрана — «89% → 97%». Справжнє число HLTV було 97.
 * Саме через цей бейдж і команда, і всі навколо казали «ми на 100% їдемо».
 *
 * Числа нижче вбиті руками зі сторінки /valve-ranking/teams/event/8302.
 */
const HIS = {
  /* знято 1 листопада, після результатів NRG—Wildcard і Imperial—Low Cortisol */
  europe: { "Eternal Fire": 97, HOTU: 59.2, "100 Thieves": 30.7, fnatic: 15.7 },
  americas: { Imperial: 99.5, Wildcard: 96, BESTIA: 4.3, NRG: 0.5 },
  asia: { "Chinggis Warriors": 99.5, "Lynn Vision": 97, TYLOO: 3 },
};
const F = JSON.parse(fs.readFileSync(process.argv[2] ?? "final15.json", "utf8"));
const NAME = { europe: "Європа", americas: "Америка", asia: "Азія" };
let tot = 0, n = 0;
for (const [reg, mine] of Object.entries(F.regions)) {
  const his = HIS[reg]; if (!his) continue;
  const best = new Map();
  for (const t of mine) { const c = best.get(t.team); if (!c || t.live > c.live) best.set(t.team, t); }
  console.log(`\n=== ${NAME[reg]}`);
  console.log("  команда             HLTV     ми   різниця");
  for (const [team, h] of Object.entries(his)) {
    if (!best.has(team)) { console.log(`  ${team.padEnd(20)}немає в нашій таблиці`); continue; }
    const our = 100 * best.get(team).pQual, d = our - h;
    tot += Math.abs(d); n++;
    console.log(`  ${team.padEnd(20)}${h.toFixed(1).padStart(5)}${our.toFixed(1).padStart(7)}` +
      `${(d > 0 ? "+" : "") + d.toFixed(1)}`.padStart(10));
  }
}
console.log(`\nсереднє розходження ${(tot / n).toFixed(1)} пп на ${n} командах`);
