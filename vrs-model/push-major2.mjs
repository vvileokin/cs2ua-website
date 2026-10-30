import fs from "node:fs";
import { URL_, KEY } from "./q.mjs";

/**
 * Публікує порахований прогноз на сайт.
 *
 * Одна команда, без розкочування. Модель рахується тут, бо HLTV не відповідає
 * на звичайний запит і рейтинг доводиться знімати браузером; сайт тільки читає.
 *
 * Перед заливкою поточні числа зберігаються в meta.prev — з них сторінка малює
 * стрілки «виросло/впало» відносно попереднього зрізу.
 *
 * Пробний прогін за замовчуванням; --apply пише.
 */
const APPLY = process.argv.includes("--apply");
const F = JSON.parse(fs.readFileSync("final15.json", "utf8"));
const S = fs.existsSync("sim.json") ? JSON.parse(fs.readFileSync("sim.json", "utf8")) : { runs: 0 };

/* Каталог сайту, щоб намалювати герб там, де він у нас є. */
const catalogue = (() => {
  const src = fs.readFileSync(new URL("../src/lib/data.ts", import.meta.url), "utf8");
  const out = new Map();
  for (const m of src.matchAll(/(\w+):\s*\{\s*slug:\s*"([^"]+)",\s*name:\s*"([^"]+)"/g))
    out.set(m[3].toLowerCase().replace(/[^a-z0-9]/g, ""), m[2]);
  return out;
})();
/* ENVY — це перейменований 3DMAX; поки в каталозі лежить старий герб,
   рядок показує його, а не лишається без емблеми. */
const ALIAS = { betboom: "betboom", thunderdownunder: "thunder", envy: "threedmax" };
const slugOf = (name) => {
  const k = String(name).toLowerCase().replace(/[^a-z0-9]/g, "");
  return catalogue.get(k) ?? ALIAS[k] ?? null;
};

const floor = (x) => (Number.isFinite(x) && x > 1e-6 ? x : 1e-6);

const rows = [];
for (const [region, list] of Object.entries(F.regions)) {
  for (const t of list) {
    rows.push({
      region, team: t.team, slug: slugOf(t.team),
      vrs: t.live, mu: Math.round(t.mu), sd: Math.round(t.sd),
      /* Ключ таблиці — місце в глобальному рейтингу: воно унікальне на всю
         таблицю, тоді як регіональне повторюється тричі (три перші місця). */
      vrs_rank: t.globalRank,
      /* Нижній хвіст таблиці дає числа на кшталт 1e-47, а колонка в базі —
         `real`, і такі значення вона відмовляється приймати. Підлога 1e-6 їх
         приймає і лишається ненульовою: на сторінці це однаково 0.0%. */
      p_qual: floor(t.pQual), p_stage3: floor(t.p3), p_stage2: floor(t.p2), p_stage1: floor(t.p1),
      projected: t.projected,
      place_lo: t.lo ?? null, place_hi: t.hi ?? null,
      tier1: t.tier1 ?? [],
      tier2: (t.tier2All ?? []).filter((x) => x.p >= 0.2)
        .map((x) => ({ name: x.name, p: Math.round(x.p * 1000) / 1000, confirmed: !!x.confirmed })),
      qual_by: (t.qualBy ?? []).map((x) => ({ name: x.name, p: Math.round(x.p * 1000) / 1000 })),
    });
  }
}

/** Календар для сторінки: три турніри тір-1 і всі LAN-и тір-2. */
const events = [
  ...F.tier1.map((e) => ({
    name: e.name, begin: e.begin, end: e.end ?? null, weight: e.weight,
    slots: e.slots ?? null, tier: 1, prize: e.prize ?? null,
    hasQualifier: !!e.openSlots,
  })),
  ...F.tier2.map((e) => ({
    name: e.name, begin: e.begin, end: e.end ?? null, weight: e.weight,
    slots: e.slots ?? null, tier: 2, prize: e.prize ?? null,
    hasQualifier: e.invite && e.invite !== "open",
  })),
];

const head = { apikey: KEY, Authorization: `Bearer ${KEY}` };

/* Те, що зараз на сайті, стає базою для стрілок. */
const prevMeta = await fetch(`${URL_}/rest/v1/major_meta?select=as_of,prev,prev_at`, { headers: head })
  .then((r) => r.json()).catch(() => []);
const metaNow = Array.isArray(prevMeta) ? prevMeta[0] : null;

/* KEEP_PREV лишає базу для стрілок без змін. Потрібно, коли сьогоднішній зріз
   перераховують удруге: інакше стрілки покажуть різницю між двома версіями
   моделі замість руху команд. */
let prevRows, prevAt;
/* PREV_FROM=<файл> — прямо вказати базу для стрілок. Потрібно рівно тоді,
   коли в базі лежить зіпсована база (наприклад, після падіння заливки її
   перезаписало сьогоднішнім же зрізом) і жодне автоматичне правило вже не
   відновить правильну. */
if (process.env.PREV_FROM) {
  const b = JSON.parse(fs.readFileSync(process.env.PREV_FROM, "utf8"));
  prevRows = b.rows; prevAt = b.asOf;
} else if (process.env.KEEP_PREV === "1") {
  /* Коли база в метаданих уже порожня (наслідок падіння), KEEP_PREV без
     запасної копії не має чого зберігати — тоді беремо копію з диска, інакше
     стрілки показали б різницю між двома версіями одного й того самого дня. */
  if (metaNow?.prev?.length) { prevRows = metaNow.prev; prevAt = metaNow.prev_at ?? null; }
  else if (fs.existsSync("prev-backup.json")) {
    const b = JSON.parse(fs.readFileSync("prev-backup.json", "utf8"));
    prevRows = b.rows; prevAt = b.asOf;
  } else { prevRows = []; prevAt = null; }
} else {
  prevRows = await fetch(`${URL_}/rest/v1/major_projection?select=region,team,p_qual&limit=1000`, { headers: head })
    .then((r) => r.json()).catch(() => []);
  prevAt = metaNow?.as_of ?? null;
}

/* Порожня база для стрілок — це не «перша заливка», це майже завжди слід
   падіння: скрипт спершу чистить таблицю, а потім пише, і якщо запис упав,
   наступний запуск читає базу з порожньої таблиці й тихо лишає сторінку без
   руху. Саме так і сталось 28 жовтня, коли вставка впала на дублі ключа.
   Тому: не мовчати, і мати запасну копію на диску. */
if (!Array.isArray(prevRows) || !prevRows.length) {
  if (fs.existsSync("prev-backup.json")) {
    const b = JSON.parse(fs.readFileSync("prev-backup.json", "utf8"));
    prevRows = b.rows; prevAt = b.asOf;
    console.log(`! база для стрілок у Supabase порожня — беру з prev-backup.json (${b.asOf}, ${b.rows.length} рядків)`);
  } else {
    console.log("! база для стрілок порожня і запасної копії немає — сторінка буде без руху");
  }
} else if (APPLY && prevAt && String(prevAt).slice(0, 10) !== F.asOf && !process.env.PREV_FROM) {
  /* Копія оновлюється тільки при справжній заливці і тільки коли те, що
     зараз у базі, — це інший день. Інакше повторний прогін того самого дня
     (чи пробний) затирав би вчорашню базу сьогоднішньою, і стрілки
     перетворювались би на різницю між двома версіями однієї моделі. */
  fs.writeFileSync("prev-backup.json", JSON.stringify({ asOf: prevAt, rows: prevRows }));
}

const meta = {
  id: true,
  as_of: F.asOf, cutoff: F.cutoff,
  event: "PGL Major Singapore",
  runs: S.runs ?? 0,
  slots: F.slots,
  events,
  source: F.source ?? "hltv.org/valve-ranking/teams",
  computed_at: new Date().toISOString(),
  prev: Array.isArray(prevRows) ? prevRows : [],
  prev_at: prevAt,
};

console.log(`зріз ${meta.as_of} · відсічення ${meta.cutoff} · прогонів ${meta.runs.toLocaleString("uk-UA")}`);
console.log(`команд: ${rows.length}  (${Object.entries(F.regions).map(([r, v]) => r + " " + v.length).join(" · ")})`);
console.log(`подій у календарі: ${events.length} · з гербом: ${rows.filter((r) => r.slug).length}`);
console.log(`попередній зріз: ${prevAt ?? "немає"} · рядків для стрілок: ${meta.prev.length}`);
console.log();
for (const r of rows.filter((x) => x.region === "europe").slice(0, 8))
  console.log("  " + String(r.projected).padStart(2) + "  " + r.team.padEnd(20) +
    String(r.vrs).padStart(5) + "  " + (r.p_qual * 100).toFixed(2).padStart(6) + "%  " + (r.slug ?? "—"));

if (!APPLY) {
  console.log(`\n(пробний прогін — нічого не записано. --apply щоб залити ${rows.length} рядків)`);
  process.exit(0);
}

const send = async (table, body, prefer) => {
  const r = await fetch(`${URL_}/rest/v1/${table}`, {
    method: "POST",
    headers: { ...head, "content-type": "application/json", Prefer: prefer },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`${table}: ${r.status} ${await r.text()}`);
};

/* Перевірка ПЕРЕД чисткою.
   Первинний ключ таблиці — глобальне місце, і воно має бути унікальним на всі
   три регіони. Коли два рядки його ділять (а таке буває з тезками, яким
   злиття за назвою віддало одне місце на двох), вставка падає з 23505 — але
   таблиця на той момент уже порожня. Один дешевий прохід тут рятує від
   напів-записаного стану, який потім треба розгрібати руками. */
const seen = new Map();
const bad = [];
for (const r of rows) {
  if (r.vrs_rank == null) bad.push(`${r.team}: немає vrs_rank`);
  else if (seen.has(r.vrs_rank)) bad.push(`місце ${r.vrs_rank} ділять ${seen.get(r.vrs_rank)} і ${r.team}`);
  else seen.set(r.vrs_rank, r.team);
  if (!Number.isFinite(r.p_qual)) bad.push(`${r.team}: p_qual не число`);
}
if (bad.length) {
  console.error(`
не заливаю, бо дані не пройдуть у таблицю (${bad.length}):`);
  for (const b of bad.slice(0, 10)) console.error("  " + b);
  process.exit(1);
}

const del = await fetch(`${URL_}/rest/v1/major_projection?region=neq.zzz`, {
  method: "DELETE", headers: { ...head, Prefer: "return=minimal" },
});
if (!del.ok) throw new Error(`очистка: ${del.status} ${await del.text()}`);

for (let i = 0; i < rows.length; i += 200)
  await send("major_projection", rows.slice(i, i + 200), "return=minimal");
await send("major_meta", meta, "resolution=merge-duplicates,return=minimal");

console.log(`\nзаписано: ${rows.length} команд · зріз ${meta.as_of} · стрілки від ${prevAt ?? "—"}`);
