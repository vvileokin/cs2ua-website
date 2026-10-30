import fs from "node:fs";

/** Чому в команди змінився відсоток: що саме зрушило між двома прогонами. */
const f = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const pick = (j, name) => {
  for (const [r, l] of Object.entries(j.regions)) {
    const t = l.find((x) => x.team === name);
    if (t) return { ...t, reg: r };
  }
  return null;
};
const A = f(process.argv[3] ?? "final15-0610d.json");
const B = f(process.argv[4] ?? "final15-0710.json");
const name = process.argv[2];
const a = pick(A, name), b = pick(B, name);
if (!a || !b) { console.log("немає:", name); process.exit(1); }

const n = (x) => (typeof x === "number" ? x.toFixed(1) : String(x));
const row = (label, x, y, fmt = n) =>
  console.log(`  ${label.padEnd(22)}${String(fmt(x)).padStart(9)} →${String(fmt(y)).padStart(9)}`);

console.log(`${name} (${b.reg})`);
row("очки VRS", a.live, b.live, (x) => x);
row("регіональне місце", a.rank, b.rank, (x) => x);
row("μ (прогноз очок)", a.mu, b.mu);
row("σ (невизначеність)", a.sd, b.sd);
row("очікуване місце", a.expRank, b.expRank);
row("форма", a.form ?? 0, b.form ?? 0);
row("seedFuture", a.seedFuture ?? 0, b.seedFuture ?? 0);
row("матчів попереду", a.matches ?? 0, b.matches ?? 0);
row("подій тір-2", a.tier2Events ?? 0, b.tier2Events ?? 0);
row("шанс на інвайт, %", 100 * a.pQual, 100 * b.pQual);

console.log("\n  тір-1 було:", JSON.stringify(a.tier1));
console.log("  тір-1 стало:", JSON.stringify(b.tier1));
console.log("  підтверджені тір-2 було:", JSON.stringify(a.knownT2));
console.log("  підтверджені тір-2 стало:", JSON.stringify(b.knownT2));

/* Скільки суперників стоїть між командою і межею — головне, чого не видно в
   самих очках: відсоток падає не лише коли падаєш ти, а й коли піднімаються ті,
   хто поруч. */
const slots = { europe: 18, americas: 9, asia: 5 }[b.reg];
const near = (j, t) => {
  const l = j.regions[t.reg].slice().sort((x, y) => y.pQual - x.pQual);
  const i = l.findIndex((x) => x.team === t.team);
  return { place: i + 1, above: l.slice(Math.max(0, i - 2), i).map((x) => `${x.team} ${(100 * x.pQual).toFixed(0)}%`), below: l.slice(i + 1, i + 3).map((x) => `${x.team} ${(100 * x.pQual).toFixed(0)}%`) };
};
const na = near(A, a), nb = near(B, b);
console.log(`\n  місце за відсотком у регіоні (місць ${slots}): ${na.place} → ${nb.place}`);
console.log("  зверху:", nb.above.join(", "));
console.log("  знизу: ", nb.below.join(", "));
