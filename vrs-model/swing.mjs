import fs from "node:fs";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";

/**
 * Чого вартий окремий матч у гонці за інвайт.
 *
 * Для кожного матчу дві гілки — перемога і поразка — і в кожній ймовірність
 * інвайта обох команд. На сторінці матчу це один рядок: «NAVI 39.3% → 44.9% /
 * 37.2%».
 *
 * Звідки береться зсув очок. З самого движка Valve, а не з наближення.
 *
 * Перша версія рахувала перехід очок як `KG · (результат − очікування)` — ту
 * саму величину, якою прогноз оцінює майбутні матчі. Вона симетрична: скільки
 * переможець додав, стільки програлий віддав. Заміряно в openvrs на тих самих
 * командах — так воно не працює. NAVI проти G2: перемога +20.3 (наближення
 * давало +22.5, близько), поразка −30.7 (наближення давало −7.7, тобто вчетверо
 * менше). Самому G2 матч не дає майже нічого: +2.3 за перемогу, −0.0 за поразку.
 *
 * Причина в тому, що VRS не обмін очками. Перемога заходить у кошик найкращих
 * перемог: у NAVI там слабші суперники, і G2 туди лягає великим числом, а в G2
 * кошик уже повний таких, і NAVI в ньому нічого не змінює. Поразка ж просто
 * псує власний рекорд, і компенсувати її нічим. Тому зсуви рахуються прогоном
 * самої моделі Valve з доданим гіпотетичним матчем, по разу на гілку.
 *
 * Далі патчений знімок таблиці VRS згодовується final15.mjs, і ймовірності
 * перераховуються для всього регіону — місць фіксована кількість, і перемога
 * однієї команди опускає всіх, хто поруч із межею.
 *
 * Чесні застереження:
 *   · дані openvrs закінчуються початком вересня, тож зсув заміряно на
 *     трохи старішій таблиці, ніж жива;
 *   · шкала openvrs і шкала HLTV не збігаються в абсолютних числах — звідси
 *     береться лише різниця, і вона лягає на живі очки;
 *   · гіпотетичний матч підвішується до останнього великого ЛАНу у вибірці,
 *     бо EPL S24 у ній ще немає; ваги події через це приблизні.
 *
 * Запуск:  node swing.mjs            — порахувати і надрукувати
 *          node swing.mjs --push     — ще й покласти в Supabase
 */

const require = createRequire(import.meta.url);
const OPENVRS = new URL("./openvrs/", import.meta.url).pathname.replace(/^\//, "");
const { generateRanking } = require(`${OPENVRS}/model/ranking.js`);
const MATCHDATA = `${OPENVRS}/data/matchdata_sample_20260909.json`;
const dataset = require(MATCHDATA);

const ENV = Object.fromEntries(
  fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/).filter(l => l.includes("=")).map(l => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);
const SB = ENV.NEXT_PUBLIC_SUPABASE_URL;
const KEY = ENV.SUPABASE_SERVICE_ROLE_KEY;
const EVENT = process.env.EVENT_SLUG ?? "esl-pro-league-s24";

const api = async (path, init = {}) => {
  const r = await fetch(`${SB}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "content-type": "application/json", ...(init.headers ?? {}) },
  });
  if (!r.ok) throw new Error(`${path}: ${r.status} ${await r.text()}`);
  return r.status === 204 ? null : r.json();
};

const plain = s => String(s).toLowerCase().replace(/[^a-z0-9]/g, "");
/* Ті самі зведення імен, що й у прогнозі: HLTV пише «BETBOOM», опублікована
   таблиця — «BetBoom Team». */
const aka = { natusvincere: "navi", ninjasinpyjamas: "nip", betboomteam: "betboom", themongolz: "mongolz" };
const nrm = s => aka[plain(s)] ?? plain(s);

/* ---- бік Valve: скільки очок дає конкретний матч ------------------------- */

/**
 * Останній матч кожної команди у вибірці — звідти склад і ідентифікатор.
 *
 * Поруч лежить і скільки матчів вона зіграла: це те, чим відрізняють основу
 * від академії. Вибірка Liquipedia тримає і «Natus Vincere», і «Natus Vincere
 * Junior», і «Aurora Gaming», і «Aurora Young Blud» — за самою назвою вони
 * невідрізненні, за кількістю матчів відрізняються разів у десять.
 */
const rosterIndex = (() => {
  const out = new Map();
  for (const m of dataset.matches) {
    for (const side of [1, 2]) {
      const id = m[`team${side}Id`], name = m[`team${side}Name`];
      if (!id) continue;
      const key = nrm(name);
      const have = out.get(key) ?? { id, name, at: 0, players: [], games: 0 };
      have.games++;
      if (m.matchStartTime > have.at) {
        have.at = m.matchStartTime;
        have.id = id;
        have.players = m[`team${side}Players`];
      }
      out.set(key, have);
    }
  }
  return out;
})();

/** Перейменування, яких вибірка ще не знає. */
const RENAMED = { envy: "3DMAX" };

/**
 * Назва з таблиці VRS → склад у вибірці Liquipedia.
 *
 * Спершу точний збіг, бо він безпомилковий. Далі — назви, що містять шукану
 * («G2» → «G2 Esports», «Vitality» → «Team Vitality»), і з них береться та, що
 * зіграла найбільше матчів: основа завжди на порядок попереду свого
 * фарм-складу. Рішення друкується, щоб його можна було перевірити очима, а не
 * вірити на слово.
 */
function resolveRoster(wanted) {
  const want = nrm(RENAMED[nrm(wanted)] ?? wanted);
  const exact = rosterIndex.get(want);
  if (exact) return exact;

  /* Назва може бути з будь-якого боку: «Team Spirit» і «Spirit Esports» обидві
     містять «spirit», і жодна з них ним не починається. */
  const near = [...rosterIndex.entries()]
    .filter(([k]) => k.includes(want) || want.includes(k))
    .map(([, v]) => v)
    .sort((a, b) => b.games - a.games);
  return near[0] ?? null;
}

const lastTime = Math.max(...dataset.matches.map(m => m.matchStartTime));
/** Найсвіжіший великий ЛАН — під нього підвішуємо гіпотетичний матч. */
const stageEvent = dataset.events
  .filter(e => e.lan && e.valveRanked)
  .sort((a, b) => (b.lmt ?? 0) - (a.lmt ?? 0))[0];

const synthetic = (one, two, winner) => ([{
  matchStartTime: lastTime + 3600,
  team1Id: one.id, team1Name: one.name, team1Image: "", team1Players: one.players,
  team2Id: two.id, team2Name: two.name, team2Image: "", team2Players: two.players,
  eventId: stageEvent.eventId, pagename: stageEvent.eventPage, parentEventPage: stageEvent.parent,
  matchId: `synthetic_${nrm(one.name)}_${nrm(two.name)}`,
  maps: [
    { mapName: "inferno", team1Score: winner === 1 ? 13 : 7, team2Score: winner === 1 ? 7 : 13 },
    { mapName: "mirage", team1Score: winner === 1 ? 13 : 9, team2Score: winner === 1 ? 9 : 13 },
  ],
  winningTeam: winner, forfeited: false, valveRanked: true, lan: true,
}]);

const rank = (teams, name) => teams.find(t => nrm(t.name) === nrm(name))?.rankValue ?? null;

/**
 * Межа правдоподібності зсуву.
 *
 * Заміряні справжні значення тримаються в межах сотні: ShindeN за перемогу над
 * Spirit отримує +119, M80 над MOUZ +105 — це команди з тонким кошиком, що
 * б'ють гіганта, і така стрибанина реальна. А от 1win у вибірці Liquipedia
 * зіграв замало матчів, щоб узагалі стояти в рейтингу, і один доданий матч
 * піднімає його на +1176 — не зсув, а поява з нуля. Таке число мовчки псує і
 * сусідів по гілці, тож матч із ним просто не публікується.
 */
const MAX_DELTA = 250;

const [, valveBase] = generateRanking(-1, MATCHDATA, false);

/** Зсув очок обох команд у кожній гілці, прогоном моделі Valve. */
function valveDeltas(one, two) {
  const run = w => generateRanking(-1, MATCHDATA, false, undefined, undefined, undefined, undefined, undefined, synthetic(one, two, w))[1];
  const oneWins = run(1), twoWins = run(2);
  const d = (teams, name) => rank(teams, name) - rank(valveBase, name);
  /* Ключ — не назва зі вибірки Liquipedia, а та, під якою команда стоїть у
     таблиці VRS: далі цими числами патчиться саме вона. «Team Spirit» і
     «Spirit» — одна команда, і сплутати їх означає пропатчити нікого. */
  return {
    one: { win: d(oneWins, one.name), lose: d(twoWins, one.name) },
    two: { win: d(twoWins, two.name), lose: d(oneWins, two.name) },
  };
}

/* ---- бік прогнозу: що ці очки роблять із ймовірністю --------------------- */

const base = JSON.parse(fs.readFileSync("final15.json", "utf8"));
const { KG, D } = base;
const Q = Math.log(10) / 400, RD = 75;
const g = 1 / Math.sqrt(1 + (3 * Q * Q * RD * RD) / (Math.PI * Math.PI));
/** Калібрована ймовірність перемоги — лише для звірки, не для зсуву. */
const pWin = (r, ro) => 1 / (1 + Math.pow(10, (g * (r - ro)) / -D));

const snapshot = JSON.parse(fs.readFileSync(process.env.VRS_FILE ?? "vrs-live.json", "utf8"));
const rows = snapshot.rows.split(";").map(s => {
  const [rank, team, points, reg] = s.split("|");
  return { rank: +rank, team, points: +points, reg };
});
const byName = new Map(rows.map(r => [nrm(r.team), r]));

const pQualOf = (run, name) => {
  for (const region of Object.values(run.regions)) {
    const t = region.find(x => nrm(x.team) === nrm(name) || nrm(x.srcTeam) === nrm(name));
    if (t) return t.pQual;
  }
  return null;
};

/** Знімок із доданим результатом: очки зсуваються, таблиця перешиковується. */
function patched(deltas) {
  const moved = rows.map(r => ({ ...r, points: Math.round(r.points + (deltas[nrm(r.team)] ?? 0)) }));
  moved.sort((a, b) => b.points - a.points);
  return {
    ...snapshot,
    note: "гілка сценарію, не для публікації",
    rows: moved.map((r, i) => `${i + 1}|${r.team}|${r.points}|${r.reg}`).join(";"),
  };
}

function runBranch(tag, deltas) {
  const file = `.swing-${tag}.json`, out = `.swing-out-${tag}.json`;
  fs.writeFileSync(file, JSON.stringify(patched(deltas)));
  execFileSync(process.execPath, ["final15.mjs"], {
    env: { ...process.env, VRS_FILE: file, OUT_FILE: out },
    stdio: "ignore",
  });
  const run = JSON.parse(fs.readFileSync(out, "utf8"));
  fs.unlinkSync(file); fs.unlinkSync(out);
  return run;
}

/* ---- матчі ---------------------------------------------------------------- */

const matches = await api(
  `matches?select=id,team_a,team_b,status,start_at&tournament_slug=eq.${EVENT}&status=in.(upcoming,live)&order=start_at.asc`,
);
/* Слаг нашого каталогу → назва в таблиці VRS. Беремо з опублікованого
   прогнозу: там обидва імені вже зведені докупи й перевірені руками. */
const proj = await api("major_projection?select=slug,team&slug=not.is.null");
const nameOf = new Map(proj.map(r => [r.slug, r.team]));

console.log(`матчів: ${matches.length} · подія-носій: ${stageEvent.eventName}\n`);

const out = [];
for (const m of matches) {
  const nameA = nameOf.get(m.team_a), nameB = nameOf.get(m.team_b);
  const rowA = nameA && byName.get(nrm(nameA)), rowB = nameB && byName.get(nrm(nameB));
  const rosterA = nameA && resolveRoster(nameA), rosterB = nameB && resolveRoster(nameB);
  if (!rowA || !rowB || !rosterA || !rosterB) {
    console.log(`${m.id}: пропущено — немає в таблиці VRS або у вибірці матчів (${m.team_a} / ${m.team_b})`);
    continue;
  }

  const delta = valveDeltas(rosterA, rosterB);
  const wild = [delta.one.win, delta.one.lose, delta.two.win, delta.two.lose]
    .find(v => !Number.isFinite(v) || Math.abs(v) > MAX_DELTA);
  if (wild !== undefined) {
    console.log(`${m.id}: пропущено — зсув ${wild.toFixed(0)} очок неправдоподібний` +
      ` (команда майже не має матчів у вибірці)
`);
    continue;
  }
  const kA = nrm(nameA), kB = nrm(nameB);
  const aWins = runBranch("a", { [kA]: delta.one.win, [kB]: delta.two.lose });
  const bWins = runBranch("b", { [kA]: delta.one.lose, [kB]: delta.two.win });
  const e = pWin(rowA.points, rowB.points);

  console.log(`${m.id}`);
  console.log(`  склади: ${nameA} → ${rosterA.name} (${rosterA.games} матчів) · ${nameB} → ${rosterB.name} (${rosterB.games})`);
  const sgn = v => (v >= 0 ? "+" : "") + v.toFixed(1);
  console.log(`  очки: ${nameA} ${sgn(delta.one.win)} / ${sgn(delta.one.lose)}` +
    ` · ${nameB} ${sgn(delta.two.win)} / ${sgn(delta.two.lose)}`);

  for (const [slug, name, side] of [[m.team_a, nameA, "a"], [m.team_b, nameB, "b"]]) {
    const now = pQualOf(base, name);
    const win = pQualOf(side === "a" ? aWins : bWins, name);
    const lose = pQualOf(side === "a" ? bWins : aWins, name);
    if (now == null || win == null || lose == null) continue;

    const p = side === "a" ? e : 1 - e;
    out.push({ match_id: m.id, team_slug: slug, team_name: name, p_now: now, p_win: win, p_lose: lose, p_match: p });
    console.log(
      `  ${name.padEnd(18)} ${(now * 100).toFixed(1)}% → перемога ${(win * 100).toFixed(1)}%` +
      ` · поразка ${(lose * 100).toFixed(1)}%`,
    );
  }
  console.log();
}

fs.writeFileSync("swing.json", JSON.stringify({ asOf: base.asOf, event: EVENT, rows: out }, null, 1));
console.log(`записано swing.json · рядків ${out.length}`);

if (process.argv.includes("--push")) {
  await api("match_vrs_swing", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify(out.map(r => ({
      match_id: r.match_id, team_slug: r.team_slug,
      /* Нуль у real — нормально, а денормалізоване число — ні: публікація
         вмирала на «1.25e-47 is out of range for type real». */
      p_now: Math.max(1e-6, r.p_now), p_win: Math.max(1e-6, r.p_win),
      p_lose: Math.max(1e-6, r.p_lose), p_match: Math.max(1e-6, r.p_match),
      as_of: base.asOf, computed_at: new Date().toISOString(),
    }))),
  });
  console.log("опубліковано в match_vrs_swing");
}
