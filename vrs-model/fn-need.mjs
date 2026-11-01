import { simulate, REGION } from "./engine-all.mjs";

/**
 * Де саме мають спіткнутись 100 Thieves, щоб fnatic мали відчутний шанс.
 *
 * Прибиваємо фінал Москви за 1win (без цього fnatic не мають нічого) і по
 * черзі прибиваємо місце 100 Thieves на FiRe. Гроші за місце різні —
 * $40k / $15k / $6,5k / вже нараховані $2,5k — і саме вони вирішують, бо
 * fnatic не грають і стоять на 1482.
 */
const EU = Object.keys(REGION).filter((t) => REGION[t] === "europe");
const RUNS = 30000;
const SCEN = [
  ["100 Thieves беруть титул", { "100 Thieves|Isurus": "100 Thieves",
    "BESTIA|100 Thieves": "100 Thieves", "100 Thieves|BARCA": "100 Thieves",
    "100 Thieves|NRG": "100 Thieves", "100 Thieves|Wildcard": "100 Thieves" }],
  ["програли фінал (2 місце, $15k)", { "100 Thieves|Isurus": "100 Thieves",
    "BESTIA|100 Thieves": "100 Thieves", "100 Thieves|BARCA": "BARCA",
    "100 Thieves|NRG": "NRG", "100 Thieves|Wildcard": "Wildcard" }],
  ["програли півфінал BESTIA", { "100 Thieves|Isurus": "100 Thieves",
    "BESTIA|100 Thieves": "BESTIA" }],
  ["програли чвертьфінал Isurus", { "100 Thieves|Isurus": "Isurus" }],
];
console.log("прибито: 1win виграють фінал Москви\n");
console.log("що сталось із 100 Thieves           HOTU   100T  fnatic      μ fnatic  μ HOTU");
for (const [label, extra] of SCEN) {
  const force = { "HOTU|1win": "1win", ...extra };
  let hotu = 0, t100 = 0, fn = 0, mf = 0, mh = 0;
  for (let i = 0; i < RUNS; i++) {
    const pts = simulate(force);
    const order = EU.slice().sort((a, b) => pts.get(b) - pts.get(a));
    const pl = {}; order.forEach((t, k) => { pl[t] = k + 1; });
    if (pl["HOTU"] <= 18) hotu++;
    if (pl["100 Thieves"] <= 18) t100++;
    if (pl["fnatic"] <= 18) fn++;
    mf += pts.get("fnatic"); mh += pts.get("HOTU");
  }
  console.log("  " + label.padEnd(34) +
    [hotu, t100, fn].map((v) => (100 * v / RUNS).toFixed(0).padStart(5) + "%").join("") +
    (mf / RUNS).toFixed(0).padStart(13) + (mh / RUNS).toFixed(0).padStart(8));
}
