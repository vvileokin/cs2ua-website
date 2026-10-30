import { simulate, LAST, REGION } from "./engine-all.mjs";

/**
 * Що означає «100 Thieves мають провалити» і «HOTU мають програти Москву».
 *
 * Фраза «провалити» нічого не варта, доки не названо місце. Тут для кожного
 * місця на їхньому турнірі рахується, чи лишаються вони в межах вісімнадцяти —
 * і тоді видно, з якого саме результату вони перестають заважати.
 */
const RUNS = Number(process.argv[2] ?? 25000);
const EU = Object.keys(REGION).filter((t) => REGION[t] === "europe");
const acc = { t100: {}, hotu: {} };
const bump = (o, k, ok) => { (o[k] ??= { n: 0, in: 0 }); o[k].n++; if (ok) o[k].in++; };

for (let i = 0; i < RUNS; i++) {
  const pts = simulate();
  const order = EU.slice().sort((a, b) => pts.get(b) - pts.get(a));
  const place = {}; order.forEach((t, k) => { place[t] = k + 1; });
  bump(acc.t100, LAST.fs100Tplace, place["100 Thieves"] <= 18);
  bump(acc.hotu, LAST.mcgHotu, place["HOTU"] <= 18);
}

const FS = { 1: "виграли FiReSPORTS", 2: "програли фінал", 4: "програли чвертьфінал",
             8: "не вийшли з групи" };
const MC = { 1: "виграли Москву", 2: "програли фінал", 3: "третє місце", 4: "четверте" };
const show = (o, names, title) => {
  console.log(`\n${title}`);
  for (const [k, v] of Object.entries(o).sort((a, b) => +a[0] - +b[0])) {
    const share = (100 * v.n) / RUNS, win = (100 * v.in) / v.n;
    console.log(`  ${(names[k] ?? k).padEnd(26)}буває ${share.toFixed(0).padStart(3)}%` +
      `   → лишаються в 18 у ${win < 0.5 ? "<1" : win.toFixed(0)}%`);
  }
};
show(acc.t100, FS, "100 Thieves на FiReSPORTS Last Chance");
show(acc.hotu, MC, "HOTU у Moscow Cyber Games");
