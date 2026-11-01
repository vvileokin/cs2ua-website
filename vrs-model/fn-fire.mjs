import { simulate, REGION, LAST } from "./engine-all.mjs";

/**
 * Твердження Udknud: якщо HOTU беруть друге місце в Москві, а FiRe виграють
 * BESTIA або BARCA — fnatic проходять; якщо FiRe виграють Wildcard або
 * 100 Thieves — шанси fnatic малі.
 *
 * Перевіряємо прямо: прибиваємо переможця Москви й дивимось на останнє
 * європейське місце по тому, хто взяв FiRe.
 */
const EU = Object.keys(REGION).filter((t) => REGION[t] === "europe");
const RUNS = 60000;
for (const [lbl, mcg] of [["1win беруть Москву (HOTU другі)", "1win"], ["HOTU беруть Москву", "HOTU"]]) {
  const box = new Map();
  for (let i = 0; i < RUNS; i++) {
    const pts = simulate({ "HOTU|1win": mcg });
    const order = EU.slice().sort((a, b) => pts.get(b) - pts.get(a));
    const place = {}; order.forEach((t, k) => { place[t] = k + 1; });
    const k = LAST.fsChamp;
    if (!box.has(k)) box.set(k, { n: 0, hotu: 0, fn: 0, t100: 0, ef: 0 });
    const b = box.get(k); b.n++;
    if (place["HOTU"] <= 18) b.hotu++;
    if (place["fnatic"] <= 18) b.fn++;
    if (place["100 Thieves"] <= 18) b.t100++;
    if (place["Eternal Fire"] <= 18) b.ef++;
  }
  console.log(`\n=== ${lbl}`);
  console.log("  FiRe виграли       частка    HOTU  fnatic    100T      EF");
  for (const [k, b] of [...box].sort((a, b2) => b2[1].n - a[1].n))
    console.log("  " + k.padEnd(16) + (100 * b.n / RUNS).toFixed(0).padStart(6) + "%" +
      [b.hotu, b.fn, b.t100, b.ef].map((v) => (100 * v / b.n).toFixed(0).padStart(7) + "%").join(""));
}
