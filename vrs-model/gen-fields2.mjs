import fs from "node:fs";
import { TIER2 } from "./lans.mjs";

/**
 * Склади тир-2 турнірів: { tbd, teams }.
 *
 * Джерело — реєстрації з таблиці дентена (reg-teams.json). Прийнятими там уже
 * пораховані тільки Confirmed / Signed up & Paid / PAID.
 *
 * `tbd` — скільки місць у сітці ще не роздано. Нуль закриває турнір для всіх,
 * кого нема в списку, тож рахується він від розміру сітки з календаря, а не
 * здогадом.
 *
 * Турніри, яких тут нема, модель лишає відкритими: відсутність даних — це не
 * «туди ніхто не їде».
 */
const reg = JSON.parse(fs.readFileSync(new URL("./reg-teams.json", import.meta.url), "utf8"));
/* Сторінка турніру головніша за реєстрацію: вона показує сітку, реєстрація —
   лише намір. Там же лежить `out` — хто вже вилетів із турніру, що йде. */
const page = JSON.parse(fs.readFileSync(new URL("./fields-page.json", import.meta.url), "utf8"));

/** Вкладка дентена зветься інакше, ніж рядок календаря. */
const SAME = { "VOID Autumn Cup 2026": "VOID Autumn Cup" };

const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "");
const byName = new Map(TIER2.map((e) => [norm(e.name), e]));

const FIELDS = {};
const notes = [];
for (const [rawName, info] of Object.entries(reg)) {
  const name = SAME[rawName] ?? rawName;
  const ev = byName.get(norm(name));
  if (!ev) { notes.push(`поза календарем: ${rawName}`); continue; }
  if (!info.teams.length && !info.accepted) { notes.push(`порожньо: ${name}`); continue; }
  const size = info.slots ?? ev.slots;
  const free = Math.max(0, size - info.accepted);
  FIELDS[ev.name] = { tbd: free, teams: info.teams };
  notes.push(`${ev.name}: прийнято ${info.accepted}/${size}, вільних ${free}, рейтингових ${info.teams.length}`);
}

for (const [name, v] of Object.entries(page)) {
  const ev = byName.get(norm(name));
  if (!ev) { notes.push(`сторінка поза календарем: ${name}`); continue; }
  FIELDS[ev.name] = { tbd: v.tbd, teams: v.teams, ...(v.out ? { out: v.out } : {}) };
  notes.push(`${ev.name}: зі сторінки HLTV — ${v.teams.length} команд, вільних ${v.tbd}${v.out ? `, вибули: ${v.out.join(", ")}` : ""}`);
}

const head = `/**
 * Опубліковані склади тир-2 турнірів: { tbd, teams }.
 * Зібрано 2 жовтня з реєстраційних таблиць у книзі дентена.
 * Файл збирається скриптом gen-fields2.mjs і руками не правиться.
 */
`;
const body = Object.entries(FIELDS)
  .sort((a, b) => a[0].localeCompare(b[0]))
  .map(([k, v]) => `  ${JSON.stringify(k)}: { tbd: ${v.tbd}, teams: ${JSON.stringify(v.teams)}${v.out ? `, out: ${JSON.stringify(v.out)}` : ""} },`)
  .join("\n");
fs.writeFileSync("fields.mjs", `${head}export const FIELDS = {\n${body}\n};\n`);
console.log(notes.join("\n"));
console.log(`\nскладів у файлі: ${Object.keys(FIELDS).length} з ${TIER2.length} турнірів попереду`);
console.log("без складу: " + TIER2.filter((e) => !FIELDS[e.name]).map((e) => e.name).join(", "));
