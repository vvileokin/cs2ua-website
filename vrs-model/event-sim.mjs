import fs from "node:fs";

/**
 * Скільки очок дасть конкретне місце на конкретному турнірі.
 *
 * Поріг «скільки треба» (threshold.mjs) сам по собі нічого не каже, бо ніхто
 * не набирає очки абстрактно. Тут той самий калібрований крок проганяється по
 * сітці події, і для кожного місця виходить середній приріст — тобто відповідь
 * уже в тому вигляді, в якому питають: «а якщо вони візьмуть турнір?»
 *
 * Формати спрощені до кількості перемог і поразок: GSL і подвійний виліт
 * однаково дають «скільком ти програв, доки вилетів». Жереб випадковий серед
 * тих, з ким ще не грали.
 *
 * Запуск: node event-sim.mjs "Tesla Cup" "FaZe,B8,..." [прогонів]
 */
const NAME = process.argv[2];
const FIELD = process.argv[3].split(",").map((s) => s.trim());
const RUNS = Number(process.argv[4] ?? 30000);
const LOSSES = Number(process.env.LOSSES ?? 2);   // подвійний виліт / GSL

const snap = JSON.parse(fs.readFileSync(process.env.VRS_FILE ?? "vrs-live-2410.json", "utf8"));
const pts = new Map();
for (const s of snap.rows.split(";")) { const [, t, p] = s.split("|"); if (!pts.has(t)) pts.set(t, +p); }
for (const t of FIELD) if (!pts.has(t)) { console.log("немає в таблиці:", t); process.exit(1); }

const Q = Math.log(10) / 400, RD = 75, D = 817.4;
const gl = 1 / Math.sqrt(1 + (3 * Q * Q * RD * RD) / (Math.PI * Math.PI));
const KG = Q * (1 / (1 / (RD * RD) + Q * Q * gl * gl * 0.25)) * gl;
const E = (a, b) => 1 / (1 + Math.pow(10, (gl * (pts.get(a) - pts.get(b))) / -D));
const { a: WIN_K, b: LOSS_K } = JSON.parse(fs.readFileSync("step-scale.json", "utf8"));

const acc = new Map(FIELD.map((t) => [t, new Map()]));
for (let i = 0; i < RUNS; i++) {
  const rec = new Map(FIELD.map((t) => [t, { w: 0, l: 0, d: 0 }]));
  const played = new Set(), key = (a, b) => [a, b].sort().join("|");
  const play = (a, b) => {
    const aw = Math.random() < E(a, b);
    const [win, lose] = aw ? [a, b] : [b, a];
    rec.get(win).w++; rec.get(lose).l++; played.add(key(a, b));
    rec.get(win).d += WIN_K * KG * (1 - E(win, lose));
    rec.get(lose).d += LOSS_K * -KG * E(lose, win);
  };
  for (let r = 0; r < 40; r++) {
    const alive = FIELD.filter((t) => rec.get(t).l < LOSSES);
    if (alive.length < 2) break;
    /* Пари серед тих, у кого однакова кількість поразок — так працює і GSL,
       і нижня/верхня сітка подвійного вильоту. */
    const groups = new Map();
    for (const t of alive) (groups.get(rec.get(t).l) ?? groups.set(rec.get(t).l, []).get(rec.get(t).l)).push(t);
    let any = false;
    for (const list of groups.values()) {
      const left = list.slice().sort(() => Math.random() - 0.5);
      while (left.length > 1) {
        const top = left.shift();
        let j = left.findIndex((o) => !played.has(key(top, o)));
        if (j === -1) j = 0;
        play(top, left.splice(j, 1)[0]); any = true;
      }
    }
    if (!any) break;
  }
  /* Місце — за кількістю перемог до вильоту; переможець лишається без поразок
     або з однією (нижня сітка). */
  const order = FIELD.slice().sort((a, b) => rec.get(b).w - rec.get(a).w || rec.get(a).l - rec.get(b).l);
  order.forEach((t, k) => {
    const g = acc.get(t), place = k + 1;
    const cur = g.get(place) ?? { n: 0, d: 0 };
    cur.n++; cur.d += rec.get(t).d; g.set(place, cur);
  });
}

console.log(`${NAME} · ${FIELD.length} команд · ${RUNS} прогонів · до ${LOSSES} поразок\n`);
console.log("команда            VRS   місце   частка   приріст   стане");
for (const t of FIELD.slice().sort((a, b) => pts.get(b) - pts.get(a))) {
  const g = [...acc.get(t)].sort((a, b) => a[0] - b[0]);
  const lines = g.filter(([, v]) => v.n / RUNS >= 0.03);
  lines.forEach(([place, v], i) => console.log(
    `  ${(i ? "" : t).padEnd(17)}${(i ? "" : String(pts.get(t))).padStart(5)}` +
    `${String(place).padStart(7)}${((100 * v.n) / RUNS).toFixed(0).padStart(8)}%` +
    `${((v.d / v.n >= 0 ? "+" : "") + (v.d / v.n).toFixed(0)).padStart(10)}` +
    `${String(Math.round(pts.get(t) + v.d / v.n)).padStart(8)}`));
}
