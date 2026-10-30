import fs from "node:fs";

/**
 * Кому на сторінці інвайтів не вистачає герба.
 *
 * Сторінка малює емблему, якщо команда знайшлася в каталозі сайту за назвою.
 * Тут той самий пошук, що й у публікації, тож список точно збігається з тим,
 * що побачить читач.
 */
const F = JSON.parse(fs.readFileSync("final15.json", "utf8"));
const src = fs.readFileSync(new URL("../src/lib/data.ts", import.meta.url), "utf8");
const catalogue = new Map();
for (const m of src.matchAll(/(\w+):\s*\{\s*slug:\s*"([^"]+)",\s*name:\s*"([^"]+)"/g))
  catalogue.set(m[3].toLowerCase().replace(/[^a-z0-9]/g, ""), m[2]);
const ALIAS = { betboom: "betboom", thunderdownunder: "thunder" };
const slugOf = (name) => {
  const k = String(name).toLowerCase().replace(/[^a-z0-9]/g, "");
  return catalogue.get(k) ?? ALIAS[k] ?? null;
};

const SLOTS = { europe: 18, americas: 9, asia: 5 };
const rows = [];
for (const [reg, list] of Object.entries(F.regions)) {
  const sorted = [...list].sort((a, b) => b.pQual - a.pQual);
  sorted.forEach((t, i) => rows.push({ reg, place: i + 1, team: t.team, p: t.pQual, slug: slugOf(t.team) }));
}

const missing = rows.filter((r) => !r.slug);
const inside = missing.filter((r) => r.place <= SLOTS[r.reg]);
const near = missing.filter((r) => r.place > SLOTS[r.reg] && r.p >= 0.05);

console.log(`у каталозі сайту: ${catalogue.size} команд · на сторінці: ${rows.length}`);
console.log(`з гербом: ${rows.filter((r) => r.slug).length} · без герба: ${missing.length}`);

const show = (title, list) => {
  console.log(`\n${title} (${list.length})`);
  for (const r of list)
    console.log(`  ${r.reg.padEnd(9)} ${String(r.place).padStart(3)} місце  ${r.team.padEnd(22)} ${(r.p * 100).toFixed(1)}%`);
};
show("ПОТРАПЛЯЮТЬ НА МЕЙДЖОР І БЕЗ ГЕРБА", inside);
show("БОРЮТЬСЯ (шанс від 5%) І БЕЗ ГЕРБА", near);
const rest = missing.filter((r) => !inside.includes(r) && !near.includes(r));
console.log(`\nрешта без герба — ${rest.length} команд нижче 5%: ${rest.slice(0, 30).map((r) => r.team).join(", ")}${rest.length > 30 ? " …" : ""}`);
