import fs from "node:fs";

/**
 * Скільки Stake Ranked Episode 5 дасть за кожне місце.
 *
 * Привід — Episode 4: Astralis там узяли +159 очок, Nemiga +77, fnatic +48.
 * Якщо мій симулятор дає переможцю вдвічі менше, то вся відповідь про НАВІ
 * завищена, бо BIG, Inner Circle і fnatic мають дістати до межі лише +46…+52.
 * Тут та сама сітка, що й у chasers-2810.mjs, але записується приріст у
 * розрізі місця — щоб порівняти з тим, що сталося насправді місяць тому.
 */
const RUNS = Number(process.argv[2] ?? 200000);
const EU = JSON.parse(fs.readFileSync("eu-2810.json", "utf8"));
const P0 = new Map();
for (const s of EU.rows.split(";")) { const [, t, p] = s.split("|"); P0.set(t, +p); }
P0.set("MIBR", 1586);

const Q = Math.log(10) / 400, RD = 75, D = 817.4;
const gl = 1 / Math.sqrt(1 + (3 * Q * Q * RD * RD) / (Math.PI * Math.PI));
const KG = Q * (1 / (1 / (RD * RD) + Q * Q * gl * gl * 0.25)) * gl;
const { a: WIN_K, b: LOSS_K } = JSON.parse(fs.readFileSync("step-scale.json", "utf8"));
const Eof = (pa, pb) => 1 / (1 + Math.pow(10, (gl * (pa - pb)) / -D));

const FIELD = ["fnatic", "BIG", "Inner Circle", "MIBR", "Astralis", "magic", "Nemesis", "Eternal Fire"];
const acc = new Map(FIELD.map((t) => [t, new Map()]));
const PLACE = { 1: "1-ше", 2: "2-ге", 3: "3-тє", 4: "4-те", 5: "5-6", 7: "7-8" };

for (let run = 0; run < RUNS; run++) {
  const pts = new Map(P0);
  const d = new Map(FIELD.map((t) => [t, 0]));
  const play = (a, b) => {
    const ea = Eof(pts.get(a), pts.get(b));
    const aw = Math.random() < ea;
    const [w, l] = aw ? [a, b] : [b, a];
    const ew = aw ? ea : 1 - ea;
    const g = WIN_K * KG * (1 - ew), s = LOSS_K * KG * (1 - ew);
    pts.set(w, pts.get(w) + g); pts.set(l, pts.get(l) - s);
    d.set(w, d.get(w) + g); d.set(l, d.get(l) - s);
    return w;
  };
  const otr = (p, w) => (p[0] === w ? p[1] : p[0]);

  /* Перший тур дограно 27 жовтня. */
  const ub1 = ["fnatic", "BIG"], ub2 = ["Inner Circle", "MIBR"];
  const a = play(...ub1), b = otr(ub1, a);
  const c = play(...ub2), e = otr(ub2, c);
  const ubf = play(a, c), ubfL = ubf === a ? c : a;
  const lb1 = play("Astralis", "magic"), lb1L = lb1 === "Astralis" ? "magic" : "Astralis";
  const lb2 = play("Nemesis", "Eternal Fire"), lb2L = lb2 === "Nemesis" ? "Eternal Fire" : "Nemesis";
  const q1 = play(b, lb2), q1L = q1 === b ? lb2 : b;
  const q2 = play(e, lb1), q2L = q2 === e ? lb1 : e;
  const sf = play(q1, q2), sfL = sf === q1 ? q2 : q1;
  const lbf = play(ubfL, sf), lbfL = lbf === ubfL ? sf : ubfL;
  const champ = play(ubf, lbf), second = champ === ubf ? lbf : ubf;

  const place = new Map([[champ, 1], [second, 2], [lbfL, 3], [sfL, 4],
                         [q1L, 5], [q2L, 5], [lb1L, 7], [lb2L, 7]]);
  for (const t of FIELD) {
    const k = place.get(t), g = acc.get(t);
    const cur = g.get(k) ?? { n: 0, s: 0, max: -1e9 };
    cur.n++; cur.s += d.get(t); cur.max = Math.max(cur.max, d.get(t));
    g.set(k, cur);
  }
}

console.log(`Stake Ranked Episode 5 · стан після першого туру · ${RUNS} прогонів\n`);
console.log("команда          28.10   місце   шанс   приріст   стане   треба до 1499");
for (const t of FIELD.slice().sort((x, y) => P0.get(y) - P0.get(x))) {
  const need = 1499 - P0.get(t);
  const rows = [...acc.get(t)].sort((x, y) => x[0] - y[0]);
  rows.forEach(([k, v], i) => {
    const avg = v.s / v.n;
    console.log(`  ${(i ? "" : t).padEnd(15)}${(i ? "" : String(P0.get(t))).padStart(6)}` +
      `${PLACE[k].padStart(8)}${((100 * v.n) / RUNS).toFixed(0).padStart(6)}%` +
      `${((avg >= 0 ? "+" : "") + avg.toFixed(0)).padStart(10)}` +
      `${String(Math.round(P0.get(t) + avg)).padStart(8)}` +
      `${(i ? "" : (need > 0 ? "+" + need : "уже вище")).padStart(16)}` +
      `${P0.get(t) + avg >= 1499 ? "   ✓" : ""}`);
  });
}
console.log("\nдля порівняння — Episode 4 насправді ($100 000, той самий формат):");
console.log("  Astralis +159 (дійшли до гранд-фіналу з нижньої сітки, шість серій)");
console.log("  Nemiga    +77  ·  fnatic +48  ·  Luminosity +22  ·  B8 +17");
console.log("  BIG        -6  ·  FaZe   -7  ·  Alliance -13");
