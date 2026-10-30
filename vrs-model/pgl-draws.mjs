import fs from "node:fs";
import { execSync } from "node:child_process";

/**
 * Чи є в PGL система першого туру, чи це справді жереб.
 *
 * Регламент каже «match-ups are drawn based on the seeding», і з однієї події
 * неясно, що саме це означає: жорстку драбинку 1-9, кошики чи справжній жереб,
 * де посів лише розводить по кошиках. Тут збираються перші тури кількох
 * турнірів PGL і перевіряються на закономірність.
 *
 * Посів беремо з порядку учасників у Liquipedia: там вони перелічені в порядку
 * посіву, і це той самий порядок, який HLTV показує рангом на дату запрошення.
 *
 * Запуск: node pgl-draws.mjs
 */

const PAGES = ["PGL/2026/Bucharest", "PGL/2026/Astana", "PGL/2026/Cluj-Napoca", "PGL/2025/Masters"];
const UA = "cs2ua-vrs-model/1.0 (contact claudeparashalol@gmail.com)";

const wikitext = (page) => {
  const f = `lp-${page.replace(/\W+/g, "_")}.json`;
  if (!fs.existsSync(f)) {
    execSync(`curl -sL --compressed --max-time 60 -A "${UA}" ` +
      `"https://liquipedia.net/counterstrike/api.php?action=parse&page=${encodeURIComponent(page)}&prop=wikitext&format=json" -o ${f}`);
  }
  return JSON.parse(fs.readFileSync(f, "utf8"))?.parse?.wikitext?.["*"] ?? "";
};

/** Перший тур: пари зі списку матчів розділу «Round 1». */
function round1(w) {
  const i = w.indexOf("Round 1 Matches");
  if (i < 0) return [];
  const j = w.indexOf("Round 2", i);
  const seg = w.slice(i, j > -1 ? j : i + 6000);
  return [...seg.matchAll(/opponent1=\{\{TeamOpponent\|([^}|]*)[\s\S]{0,200}?opponent2=\{\{TeamOpponent\|([^}|]*)/g)]
    .map((m) => [m[1].trim().toLowerCase(), m[2].trim().toLowerCase()])
    .filter(([a, b]) => a && b);
}

/** Порядок учасників у розділі Participants — він же порядок посіву. */
function seedOrder(w) {
  const i = w.indexOf("==Participants==");
  if (i < 0) return [];
  const j = w.indexOf("\n==", i + 5);
  const seg = w.slice(i, j > -1 ? j : i + 20000);
  /* Тільки верхній рівень списку: у нотатках і складах те саме `{{Opponent|`
     трапляється ще раз, і без прив'язки до початку рядка їх набиралось 20. */
  return [...seg.matchAll(/\n\|\{\{Opponent\|([^|}\n]+)/g)].map((m) => m[1].trim().toLowerCase());
}

for (const page of PAGES) {
  const w = wikitext(page);
  const pairs = round1(w);
  const order = seedOrder(w);
  console.log(`\n=== ${page} · пар ${pairs.length} · учасників ${order.length}`);
  if (!pairs.length || order.length !== 16) {
    console.log("   даних бракує, пропускаю");
    continue;
  }
  /* Назви в матчах — короткі теги, у складі — повні. Зводимо через входження. */
  const seedOf = (tag) => {
    const k = order.findIndex((n) => n.replace(/\W/g, "").includes(tag.replace(/\W/g, "")) ||
      tag.replace(/\W/g, "").includes(n.replace(/\W/g, "")));
    return k < 0 ? null : k + 1;
  };
  const rows = pairs.map(([a, b]) => ({ a, b, sa: seedOf(a), sb: seedOf(b) }));
  const bad = rows.filter((r) => !r.sa || !r.sb);
  if (bad.length) console.log("   не зіставив:", bad.map((r) => `${r.a}/${r.b}`).join(", "));
  for (const r of rows) {
    if (!r.sa || !r.sb) continue;
    const [lo, hi] = [Math.min(r.sa, r.sb), Math.max(r.sa, r.sb)];
    console.log(`   ${String(lo).padStart(2)} ${r.a.padEnd(16)} — ${r.b.padEnd(16)} ${String(hi).padStart(2)}` +
      `   різниця ${String(hi - lo).padStart(2)} · сума ${lo + hi}`);
  }
  const ok = rows.filter((r) => r.sa && r.sb);
  const ladder = ok.every((r) => Math.abs(r.sa - r.sb) === 8);
  const pots = ok.every((r) => (Math.min(r.sa, r.sb) <= 8) !== (Math.max(r.sa, r.sb) <= 8));
  const sums = [...new Set(ok.map((r) => r.sa + r.sb))];
  console.log(`   драбинка 1-9: ${ladder ? "ТАК" : "ні"} · кошики верх/низ: ${pots ? "ТАК" : "ні"} · ` +
    `сум різних: ${sums.length} (${sums.sort((x, y) => x - y).join(", ")})`);
}
