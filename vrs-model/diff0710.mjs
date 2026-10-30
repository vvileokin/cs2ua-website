import fs from "node:fs";

/** Що змінилось у відсотках на інвайт між двома прогонами. */
const f = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
/* Ключ — назва плюс регіон плюс глобальний ранг, а не сама назва. У таблиці
   VRS імена повторюються (дві Chinggis Warriors, дві CYBERSHOKE, три Johnny
   Speeds), і мапа за назвою лишала з пари слабшу — через що в першому ж звіті
   Chinggis Warriors показались на 675 очках замість 1067 і провалились нижче
   NEXVOID. Публікація цим не страждала: вона пише рядки за глобальним рангом. */
const flat = (j) => {
  const m = new Map();
  for (const [r, l] of Object.entries(j.regions)) for (const t of l) m.set(`${t.team}|${r}|${t.globalRank}`, { ...t, reg: r });
  return m;
};
const N = flat(f(process.argv[2] ?? "final15-0710.json"));
const O = flat(f(process.argv[3] ?? "final15-0610d.json"));
const pc = (x) => (100 * x).toFixed(1).padStart(5);

console.log("найбільші зміни (попередній прогін → цей):");
const d = [...N.values()]
  .map((t) => ({ t: t.team, reg: t.reg, now: t.pQual, was: [...O.values()].find((o) => o.team === t.team && o.reg === t.reg)?.pQual }))
  .filter((r) => r.was != null && Math.abs(r.now - r.was) >= 0.02)
  .sort((a, b) => Math.abs(b.now - b.was) - Math.abs(a.now - a.was));
for (const r of d.slice(0, 22))
  console.log(` ${r.t.padEnd(18)}${r.reg.padEnd(9)}${pc(r.was)} → ${pc(r.now)}  ${r.now > r.was ? "+" : ""}${(100 * (r.now - r.was)).toFixed(1)}`);

console.log("\nзняті новим правилом Valve:");
for (const t of ["BC.Game", "Sashi"]) {
  const here = [...N.values()].find((x) => x.team === t);
  const before = [...O.values()].find((x) => x.team === t);
  console.log(`  ${t.padEnd(10)}${here ? "ЩЕ В ТАБЛИЦІ" : "прибрано (було " + (before ? pc(before.pQual).trim() + "%" : "—") + ")"}`);
}

for (const [reg, n] of [["Азія", 8], ["Європа", 22], ["Америка", 12]]) {
  const key = { "Азія": "asia", "Європа": "europe", "Америка": "americas" }[reg];
  console.log(`\n${reg}:`);
  [...N.values()].filter((t) => t.reg === key).sort((a, b) => b.pQual - a.pQual).slice(0, n)
    .forEach((t, i) => console.log(`  ${String(i + 1).padStart(2)}. ${t.team.padEnd(20)}${pc(t.pQual)}%  · очки ${t.live}`));
}
