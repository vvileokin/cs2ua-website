import fs from "node:fs";

/**
 * How far a rating really travels in a month — including the months that end a team.
 *
 * The first version of this measurement asked only "how big is the spread", got
 * σ ≈ 100, and handed the model a normal distribution. That is how a projection
 * two months out ends up printing 100.00%: under a normal curve a 600-point gap
 * is unbridgeable, so the leaders are certainties and everyone below is a zero.
 *
 * Two things were being thrown away.
 *
 * The first is the shape. σ in the 21–40 band is 120, but the largest single
 * month observed is 816 — just under seven standard deviations. A normal curve
 * puts that at one in ten billion; it happened inside eight snapshots. Ratings
 * do not wander, they lurch: a roster change, a break-out run, a collapse. The
 * spread is the same, the tails are nothing alike.
 *
 * The second is the teams that vanish. The old loop skipped any side missing
 * from the next table, which quietly deleted every worst case from the sample —
 * the disbands, the roster gut-jobs, the org pull-outs. Measuring volatility
 * only on the survivors is how you conclude that nothing ever goes badly wrong.
 *
 * So this measures both: a Student-t fitted to the observed kurtosis, and the
 * rate at which teams simply stop existing.
 */
const B = "https://raw.githubusercontent.com/ValveSoftware/counter-strike_regional_standings/main/invitation/2026";
const SNAPS = ["2026_01_05","2026_02_02","2026_03_02","2026_04_06","2026_05_04","2026_06_01","2026_07_06","2026_08_03"];
const norm = s => String(s).toLowerCase().replace(/[^a-z0-9]/g, "");

const tables = [];
for (const s of SNAPS) {
  const md = await fetch(`${B}/standings_global_${s}.md`).then(r => r.text());
  const m = new Map(), dup = new Set();
  for (const line of md.split("\n")) {
    const x = line.match(/^\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*([^|]+?)\s*\|/);
    if (!x) continue;
    const k = norm(x[3]);
    if (m.has(k)) dup.add(k); else m.set(k, +x[2]);
  }
  for (const k of dup) m.delete(k);
  tables.push({ snap: s, m });
}

const BANDS = ["топ-10", "11–20", "21–40", "41–120"];
const bandOf = i => i < 10 ? BANDS[0] : i < 20 ? BANDS[1] : i < 40 ? BANDS[2] : BANDS[3];
const buckets = Object.fromEntries(BANDS.map(b => [b, []]));
const gone = Object.fromEntries(BANDS.map(b => [b, { out: 0, seen: 0 }]));

for (let i = 0; i < tables.length - 1; i++) {
  const a = tables[i].m, b = tables[i + 1].m;
  const ranked = [...a.entries()].sort((x, y) => y[1] - x[1]);
  ranked.forEach(([k, v], idx) => {
    if (idx >= 120) return;
    const band = bandOf(idx);
    gone[band].seen++;
    if (!b.has(k)) { gone[band].out++; return; }   // vanished — counted, not skipped
    buckets[band].push(b.get(k) - v);
  });
}

/** Moments, and the ν of the Student-t whose excess kurtosis matches. */
const moments = arr => {
  const n = arr.length;
  const mean = arr.reduce((a, b) => a + b, 0) / n;
  const m2 = arr.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
  const m4 = arr.reduce((a, b) => a + (b - mean) ** 4, 0) / n;
  const sd = Math.sqrt(arr.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1));
  const kurt = m4 / (m2 * m2) - 3;                       // excess kurtosis
  // t with ν degrees of freedom has excess kurtosis 6/(ν−4)
  const nu = kurt > 0.2 ? Math.max(2.5, Math.min(12, 6 / kurt + 4)) : 12;
  return { n, mean, sd, kurt, nu, max: Math.max(...arr.map(Math.abs)) };
};

console.log("  зміна рейтингу за місяць — розмах, форма хвоста, і хто зник\n");
console.log("  " + "група".padEnd(9) + "n".padStart(6) + "серед.".padStart(9) + "σ".padStart(8) +
            "куртозис".padStart(11) + "ν".padStart(7) + "макс".padStart(7) + "зникли".padStart(9));
const out = {};
for (const band of BANDS) {
  const s = moments(buckets[band]);
  const h = gone[band].out / gone[band].seen;
  out[band] = { ...s, dropRate: h, dropOut: gone[band].out, dropSeen: gone[band].seen };
  console.log("  " + band.padEnd(9) + String(s.n).padStart(6) + s.mean.toFixed(1).padStart(9) +
              s.sd.toFixed(1).padStart(8) + s.kurt.toFixed(2).padStart(11) + s.nu.toFixed(1).padStart(7) +
              s.max.toFixed(0).padStart(7) + `${(h * 100).toFixed(1)}%`.padStart(9));
}

/* What a normal curve would have said about the largest month actually seen. */
console.log("\n  наскільки нормальний розподіл бреше про найбільший реальний місяць:");
for (const band of BANDS) {
  const s = out[band];
  const z = s.max / s.sd;
  const pNorm = 2 * (1 - (1 - 0.5 * Math.exp(-0.717 * z - 0.416 * z * z)));
  console.log("  " + band.padEnd(9) + `макс ${s.max.toFixed(0)} = ${z.toFixed(1)}σ · за нормою таке раз на ${(1 / Math.max(pNorm, 1e-18)).toExponential(1)} спостережень`);
}

fs.writeFileSync("noise2.json", JSON.stringify(out, null, 1));
console.log("\n  → noise2.json");
