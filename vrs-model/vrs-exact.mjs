import fs from "node:fs";
import path from "node:path";

/**
 * VRS за опублікованою формулою, без жодного калібрування.
 *
 * Сторінка `/valve-ranking/teams/details/<дата>?lineup=<id через кому>` дає
 * повний розклад очок кожної команди по п'яти компонентах, із датами, давниною,
 * призовими, вагою події й множником суперника. З п'ятнадцяти таких сторінок
 * будова виходить уся:
 *
 *   VRS = 400 + LAN wins + Opp. network + Bounty offered + Bounty collected + H2H
 *
 *   recency(d) = 1 при d ≤ 30, далі max(0, 1 − (d−30)/152)
 *
 *   LAN wins       = Σ 48·recency по десяти НАЙСВІЖІШИХ перемогах на ЛАНі
 *   Bounty offered = 19,4 · (Σ призові·recency)^0,23            по десяти найкращих
 *   Bounty collect = 244  · (Σ bounty·recency·weight)^0,23      по десяти найкращих
 *   Opp. network   = ~100 · (Σ network·recency·weight)^0,23     по десяти найкращих
 *   H2H            — перерозподіл очок між суперниками, рахується щоразу з нуля
 *
 *   weight(призовий) ≈ (призовий / 1 000 000)^0,3
 *   підтверджені точки: $50k → 0,43 · $80k → 0,48 · $100k → 0,5 ·
 *                       $580k → 0,81 · $600k → 0,82 · $1M → 1,0
 *
 * Степінь 0,23 — головне, чого калібрований крок не бачив у принципі. Саме
 * вона відповідає на питання «чи великі турніри дають більше»: дають, але
 * вдвічі більше грошей додає лише 17% до компонента. Тому переможець
 * мільйонного ЛАНу й не бере +800, хоч призові й справді рахуються.
 *
 * Друге, не менш важливе: LAN wins — ЄДИНИЙ компонент без степеня, зате з
 * жорсткою межею в десять рядків. У команди, в якої всі десять свіжі (по 48),
 * нова перемога витісняє таку саму й додає нуль. Це перевіряється прямо з
 * розкладу й по командах різниться від +0 до +43.
 *
 * Запуск: node vrs-exact.mjs
 */

const K_O = 19.4, K_C = 244, K_N = 100, POW = 0.23;
const DIR = "vrs-details";
const rec = (d) => (d <= 30 ? 1 : Math.max(0, 1 - (d - 30) / 152));
const weight = (prize) => Math.pow(prize / 1_000_000, 0.3);

/** Обернення компонента в сиру суму: comp = K·raw^POW. */
const rawOf = (comp, K) => Math.pow(Math.max(comp, 1) / K, 1 / POW);
const compOf = (raw, K) => K * Math.pow(Math.max(raw, 0), POW);

const load = () => {
  const out = {};
  for (const f of fs.readdirSync(DIR)) {
    const j = JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8"));
    const lan = (j.L ?? []).map((s) => Number(s.split("|")[1]));
    out[j.n] = {
      pts: j.p, comp: { L: j.c[0], N: j.c[1], O: j.c[2], C: j.c[3], H: j.c[4] },
      lanRows: lan,
      /* Скільки дасть одна нова перемога на ЛАНі: 48 мінус найслабший рядок,
         якщо список повний. */
      lanGain: lan.length >= 10 ? 48 - Math.min(...lan) : 48,
      rawO: rawOf(j.c[2], K_O), rawC: rawOf(j.c[3], K_C), rawN: rawOf(j.c[1], K_N),
    };
  }
  return out;
};
const T = load();

/**
 * Приріст за турнірний шлях, порахований по компонентах.
 * wins — скільки серій виграно, prize — призові, oppB/oppN — середні множники
 * суперників, ev — призовий фонд події.
 */
const run = (name, wins, prize, oppB, oppN, ev) => {
  const t = T[name];
  if (!t) return null;
  const w = weight(ev);
  /* LAN wins: кожна перемога витісняє найслабший рядок. Після першої
     найслабшим стає наступний, тож рахуємо по черзі. */
  let rows = t.lanRows.slice().sort((a, b) => a - b), lan = 0;
  for (let i = 0; i < wins; i++) {
    const out = rows.length >= 10 ? rows.shift() : 0;
    lan += 48 - out;
    rows.push(48); rows.sort((a, b) => a - b);
  }
  const dO = compOf(t.rawO + prize, K_O) - t.comp.O;
  const dC = compOf(t.rawC + wins * oppB * w, K_C) - t.comp.C;
  const dN = compOf(t.rawN + wins * oppN * w, K_N) - t.comp.N;
  return { lan, dO, dC, dN, total: lan + dO + dC + dN };
};

console.log("СКІЛЬКИ ДАСТЬ ОДНА ПЕРЕМОГА НА ЛАНі В КОМПОНЕНТ «LAN WINS»");
console.log("(десять найсвіжіших по 48; у кого список свіжий — нова нічого не додає)\n");
console.log("команда             очки   компонент   +за перемогу");
for (const [n, t] of Object.entries(T).sort((a, b) => b[1].pts - a[1].pts))
  console.log(`  ${n.padEnd(18)}${String(t.pts).padStart(5)}${String(t.comp.L).padStart(12)}` +
    `${("+" + t.lanGain).padStart(15)}${t.lanGain <= 5 ? "   ← список заповнений" : ""}`);

/* Призові Stake Ranked Episode 5 і Tesla Cup — зі сторінок подій. */
const SR = { 1: 25000, 2: 17500, 3: 13500, 4: 11000, 5: 9000, 7: 7500 };
const TC = { 1: 30000, 2: 12000, 3: 5000, 4: 3000 };
const WINS_SR = { 1: 3, 2: 2, 3: 2, 4: 1, 5: 1, 7: 0 };   // шлях із верхньої сітки

console.log("\n\nSTAKE RANKED EPISODE 5 — приріст за місцем, за формулою");
console.log("суперники там мають bounty близько 0,2 і network 0,55; вага події 0,5\n");
console.log("команда          28.10   місце   перемог   LAN   призові   bounty   network   усього   стане   треба");
for (const n of ["BIG", "Inner Circle", "fnatic"]) {
  const need = 1499 - T[n].pts;
  for (const pl of [1, 2, 3, 4]) {
    const r = run(n, WINS_SR[pl], SR[pl], 0.2, 0.55, 100000);
    const v = T[n].pts + r.total;
    console.log(`  ${(pl === 1 ? n : "").padEnd(15)}${(pl === 1 ? String(T[n].pts) : "").padStart(6)}` +
      `${String(pl).padStart(8)}${String(WINS_SR[pl]).padStart(10)}` +
      `${("+" + r.lan.toFixed(0)).padStart(6)}${("+" + r.dO.toFixed(0)).padStart(10)}` +
      `${("+" + r.dC.toFixed(0)).padStart(9)}${("+" + r.dN.toFixed(0)).padStart(10)}` +
      `${("+" + r.total.toFixed(0)).padStart(9)}${String(Math.round(v)).padStart(8)}` +
      `${(pl === 1 ? "+" + need : "").padStart(8)}${v >= 1499 ? "  ✓" : ""}`);
  }
}

console.log("\n\n100 THIEVES — FiReSPORTS Last Chance, $75 000, суперники слабкі");
console.log("(bounty близько 0,08, network 0,45, вага 0,47; їм треба +" + (1499 - T["100 Thieves"].pts) + ")\n");
console.log("  місце          перемог   LAN   призові   bounty   network   усього   стане");
for (const [pl, wins, prize] of [[1, 6, 40000], [2, 5, 15000], [3, 4, 6500], [4, 3, 3500], ["5-8", 2, 2500], ["9-16", 1, 0]]) {
  const r = run("100 Thieves", wins, prize, 0.08, 0.45, 75000);
  const v = T["100 Thieves"].pts + r.total;
  console.log(`  ${String(pl).padEnd(13)}${String(wins).padStart(8)}` +
    `${("+" + r.lan.toFixed(0)).padStart(6)}${("+" + r.dO.toFixed(0)).padStart(10)}` +
    `${("+" + r.dC.toFixed(0)).padStart(9)}${("+" + r.dN.toFixed(0)).padStart(10)}` +
    `${("+" + r.total.toFixed(0)).padStart(9)}${String(Math.round(v)).padStart(8)}${v >= 1499 ? "  ✓" : ""}`);
}

console.log("\n\n1win — Moscow Cyber Games, 15 млн рублів (~$190 000), два матчі");
console.log("(суперники 5star і The Huns: bounty близько 0,05, network 0,4, вага 0,58)\n");
console.log("  результат              перемог   LAN   призові   bounty   network   усього   стане");
for (const [lab, wins, prize] of [["виграли турнір", 2, 100000], ["фінал", 1, 50000],
                                   ["третє місце", 1, 31000], ["четверте", 0, 6000]]) {
  const r = run("1win", wins, prize, 0.05, 0.4, 190000);
  const v = T["1win"].pts + r.total;
  console.log(`  ${lab.padEnd(22)}${String(wins).padStart(8)}` +
    `${("+" + r.lan.toFixed(0)).padStart(6)}${("+" + r.dO.toFixed(0)).padStart(10)}` +
    `${("+" + r.dC.toFixed(0)).padStart(9)}${("+" + r.dN.toFixed(0)).padStart(10)}` +
    `${("+" + r.total.toFixed(0)).padStart(9)}${String(Math.round(v)).padStart(8)}` +
    `${v < 1499 ? "   ← нижче НАВІ" : ""}`);
}

console.log("\n\nНАВІ — що дає сценарій «програли Spirit + два техлузи»");
const navi = T["Natus Vincere"];
console.log(`  зараз ${navi.pts}`);
console.log(`  компонент LAN wins ${navi.comp.L}, найслабший рядок ${Math.min(...navi.lanRows)} —`);
console.log(`  отже кожна НОВА перемога на ЛАНі дала б їм +${navi.lanGain}, найбільше в усій таблиці.`);
console.log(`  Призові за 9-11 місце Бухареста ($31 250) уже в розкладі за 27 жовтня.`);
console.log(`  Технічна поразка не забирає нічого з перших чотирьох компонентів —`);
console.log(`  вони складаються тільки з перемог. Забирає лише H2H: зараз ${navi.comp.H}.`);
console.log(`\n  Тобто за формулою два техлузи коштують НАВІ не «−50 очок рейтингу»,`);
console.log(`  а рівно стільки, скільки H2H віддасть суперникам, плюс нуль приросту`);
console.log(`  там, де перемоги дали б +${navi.lanGain} за кожну.`);
