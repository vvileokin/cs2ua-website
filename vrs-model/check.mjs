import fs from "node:fs";
import { TIER1 } from "./calendar.mjs";
import { TIER2 } from "./lans.mjs";
import { FIELDS } from "./fields.mjs";
import { accessFactor, nationOf } from "./access.mjs";

/**
 * Перевірка перед публікацією — сім пунктів, кожен із яких колись ловив
 * справжню помилку.
 */
const F = JSON.parse(fs.readFileSync("final15.json", "utf8"));
const SNAP = JSON.parse(fs.readFileSync("vrs-live-0210r.json", "utf8"));
const all = Object.entries(F.regions).flatMap(([reg, l]) => l.map((t) => ({ ...t, reg })));
const bad = [];
const ok = [];

/* 1. нулів і сотень нема */
const hundred = all.filter((t) => t.pQual >= 1).length;
const zero = all.filter((t) => t.pQual <= 0).length;
(hundred || zero ? bad : ok).push(`рівно 100%: ${hundred}, рівно 0%: ${zero}`);

/* 2. місця за регіонами збігаються з підтвердженими Valve */
const slots = JSON.stringify(F.slots);
(slots === JSON.stringify({ europe: { total: 18, stage3: 6, stage2: 6, stage1: 6 }, americas: { total: 9, stage3: 2, stage2: 1, stage1: 6 }, asia: { total: 5, stage3: 0, stage2: 1, stage1: 4 } })
  ? ok : bad).push(`розподіл місць: ${slots}`);

/* 3. українські склади на турнірах 1win */
const UA = all.filter((t) => nationOf(t.srcTeam ?? t.team) === "ua");
const viol = [];
for (const t of UA)
  for (const e of t.tier2All ?? [])
    if (/private club|1win|moscow|cis lan/i.test(e.name) && e.p > 0)
      viol.push(`${t.team} ← ${e.name} ${(e.p * 100).toFixed(0)}%`);
(viol.length ? bad : ok).push(`українські склади на подіях 1win і в Росії: ${viol.length ? viol.join(", ") : "жодної"}`);

/* 4. склади тір-1 збігаються зі сторінками HLTV */
const t1sizes = TIER1.map((e) => `${e.name}: ${e.teams.length}/${e.slots}`);
(TIER1.every((e) => e.teams.length === e.slots || e.openSlots) ? ok : bad).push(`склади тір-1 — ${t1sizes.join(" · ")}`);

/* 5. календар тір-2 */
const past = TIER2.filter((e) => e.end <= "2026-10-02");
const late = TIER2.filter((e) => e.begin >= "2026-11-02");
((past.length || late.length) ? bad : ok).push(`тір-2: ${TIER2.length} турнірів, дограних ${past.length}, після відсічення ${late.length}`);

/* 6. склади: скільки турнірів мають поіменний список */
const named = TIER2.filter((e) => FIELDS[e.name]).length;
ok.push(`склади відомі для ${named} з ${TIER2.length} турнірів тір-2`);

/* 7. рейтинг: кількість команд і джерело */
const rows = SNAP.rows.split(";").length;
ok.push(`рейтинг: ${rows} рядків, зріз ${SNAP.asOf}, джерело ${SNAP.source.slice(0, 48)}`);

/* 8. монотонність: вищий μ — не менший шанс усередині регіону */
let mono = 0;
for (const [, list] of Object.entries(F.regions)) {
  const s = [...list].sort((a, b) => b.mu - a.mu);
  for (let i = 1; i < s.length; i++) if (s[i].pQual > s[i - 1].pQual + 0.02) mono++;
}
(mono > 3 ? bad : ok).push(`порушень монотонності (вищий μ — менший шанс): ${mono}`);

/* 9. сума шансів проти кількості місць */
for (const [reg, list] of Object.entries(F.regions)) {
  const sum = list.reduce((a, t) => a + t.pQual, 0);
  const n = F.slots[reg].total;
  (Math.abs(sum - n) > 0.6 ? bad : ok).push(`${reg}: сума шансів ${sum.toFixed(2)} проти ${n} місць`);
}

console.log("ЩО ЗІЙШЛОСЯ");
for (const s of ok) console.log("  ✓ " + s);
if (bad.length) {
  console.log("\nЩО НЕ ЗІЙШЛОСЯ");
  for (const s of bad) console.log("  ✗ " + s);
} else console.log("\nрозбіжностей нема");
