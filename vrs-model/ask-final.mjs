import { simulate, LAST, EU_TEAMS, P0 } from "./engine.mjs";

/**
 * Умовне питання: якщо у фіналі Stake Ranked зустрінуться fnatic та Inner
 * Circle, чи проходять на мейджор обидва.
 *
 * Рахується відбором: звичайні прогони, з яких лишаються тільки ті, де в
 * фіналі справді ці двоє. Так зберігається весь контекст — що робили решта
 * турнірів і хто ще піднявся, — чого не дасть просто «додати їм очок за
 * перше й друге місце».
 */
const RUNS = Number(process.argv[2] ?? 120000);
const SLOTS = 18, PAIR = ["fnatic", "Inner Circle"];
const hit = { n: 0, both: 0, champ: 0, second: 0, neither: 0 };
const ptsSum = { champ: 0, second: 0 };
const place = { champ: 0, second: 0 };
let total = 0;

for (let i = 0; i < RUNS; i++) {
  const pts = simulate();
  total++;
  const f = [LAST.srChamp, LAST.srSecond];
  if (!PAIR.every((t) => f.includes(t))) continue;
  hit.n++;
  const champ = LAST.srChamp, second = LAST.srSecond;
  const higher = (t) => EU_TEAMS.reduce((a, o) => a + (o !== t && pts.get(o) > pts.get(t) ? 1 : 0), 0);
  const hC = higher(champ), hS = higher(second);
  ptsSum.champ += pts.get(champ); ptsSum.second += pts.get(second);
  place.champ += hC + 1; place.second += hS + 1;
  const inC = hC <= SLOTS - 1, inS = hS <= SLOTS - 1;
  if (inC && inS) hit.both++;
  else if (inC) hit.champ++;
  else if (inS) hit.second++;
  else hit.neither++;
}

const p = (x) => ((100 * x) / hit.n).toFixed(1).replace(".", ",") + "%";
console.log(`прогонів ${total}, із них фінал fnatic — Inner Circle: ${hit.n} (${((100 * hit.n) / total).toFixed(1)}%)\n`);
console.log(`переможець   ${(ptsSum.champ / hit.n).toFixed(0)} очок · місце ${(place.champ / hit.n).toFixed(1)}`);
console.log(`фіналіст     ${(ptsSum.second / hit.n).toFixed(0)} очок · місце ${(place.second / hit.n).toFixed(1)}\n`);
console.log(`пройшли обидва        ${p(hit.both)}`);
console.log(`тільки переможець     ${p(hit.champ)}`);
console.log(`тільки фіналіст       ${p(hit.second)}`);
console.log(`жоден                 ${p(hit.neither)}`);
console.log(`\nразом: переможець ${p(hit.both + hit.champ)} · фіналіст ${p(hit.both + hit.second)}`);
