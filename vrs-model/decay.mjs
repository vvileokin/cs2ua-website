import fs from "node:fs";

/**
 * Чи падають очки в команди, яка не грає.
 *
 * Привід — прогноз Mischief: у нього майже вся таблиця до відсічення йде вниз
 * (Falcons -60, Virtus.pro -76, HEROIC -35), а наша модель тримає всіх
 * приблизно на місці. Один із двох помиляється, і це перевіряється фактом, а
 * не суперечкою: у VRS шестимісячне вікно, старі результати з нього
 * випадають, і команда, яка нічого не грає, має просідати сама по собі.
 *
 * Міряємо на тих, хто справді не грав. Список тих, хто грав, зібраний зі
 * сторінки результатів HLTV за 19-23 жовтня; усі інші в таблиці — контрольна
 * група, і їхній медіанний зсув і є чистим дрейфом.
 *
 * Запуск: node decay.mjs
 */

/* Усі, хто з'являвся в результатах 19-23 жовтня. */
const PLAYED = `Iberian Soul ASTRAL BBL Luminosity Envy INFINITE SAW HYPERSPIRIT JiJieHao Nexus
HEROIC SINNERS FaZe Eternal Fire BASEMENT BOYS BC.Game WBT PARIVISION fnatic BIG The MongolZ
magic Liquid PRIVATE Alliance Betclic Nemesis K27 WW NEXORA TrafficPills UPGRADE NEXVOID
Vitalem Aerem Chinggis Warriors WXM Lynn Vision Morningstar Rare Atom Alter Ego aimclub NT
Sashi MOUZ NXT Drama Leo Bayankhongor Insiders Virtus.pro Black Phoenix ex-CYBERSHOKE
BESTIA Galorys Imperial ShindeN Turma do Pagode BARCA Fluxo paiN Yawara your end 6yuBoJlbl
ex-6666 WBT Academy Dark Moon MEIA NOITE Procyon Quintessence Ryvex Lavked HAVU LFO 10 KAMUI
DONSTU Banda Chuya UNiTY Metizport Sangal Acend Rune Eaters FORZE Reload benched gods MAYBE
LPH Four Magic BET-M mellren Bushido Wildcats Just Players Butterfly GenOne Spirit Academy
BAKS Azuolas Illyrians Zetta LOS NINOS DAMAJUANA Hacha Martians Low Cortisol BR Grêmio
RED Canids Academy BESTIA Academy BORRACHEIROS QUINTESSÊNCIA Isurus BRUTE INOX Division
Nuclear TigeRES ex-Zero Tenacity ex-RUSTEC Saint Sinners Walczaki Inner Circle Academy
Phantom Academy TitanFlow BlinkDagger Betclic Apogee Esports`
  .split(/\s*\n\s*|,\s*/).join(" ").split(/\s{2,}| (?=[A-ZА-Я0-9])/).map(s => s.trim()).filter(Boolean);

/* Назви з кількох слів розбились — склеюємо назад за тим, що є в таблиці. */
const P = (f) => {
  const m = new Map();
  for (const s of JSON.parse(fs.readFileSync(f, "utf8")).rows.split(";")) {
    const c = s.split("|");
    const t = c.length >= 3 ? c[1] : c[0];
    const p = +(c.length >= 3 ? c[2] : c[1]);
    if (!m.has(t)) m.set(t, p);
  }
  return m;
};
const was = P("vrs-table-1810.json"), now = P("vrs-live-2310.json");

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const played = new Set(PLAYED.map(norm));
/* Будь-яка назва з таблиці, що міститься в рядку списку, рахується зіграною —
   щоб «Inner Circle Academy» не лишилось у контрольній групі через пробіл. */
const raw = norm(PLAYED.join(" "));

const idle = [], busy = [];
for (const [t, p] of was) {
  if (!now.has(t)) continue;
  const d = now.get(t) - p;
  (played.has(norm(t)) || raw.includes(norm(t)) ? busy : idle).push({ t, p, d });
}

const stat = (a, label) => {
  if (a.length < 4) return;
  const d = a.map((x) => x.d).sort((x, y) => x - y);
  const q = (k) => d[Math.floor(d.length * k)];
  console.log(`${label.padEnd(26)}${String(a.length).padStart(5)}${String(q(0.5)).padStart(10)}` +
    `${(d.reduce((s, x) => s + x, 0) / d.length).toFixed(1).padStart(10)}` +
    `${("  " + q(0.25) + " … " + q(0.75)).padStart(14)}`);
};

console.log("18 → 23 жовтня, 5 днів\n");
console.log("група                     команд   медіана   середнє      чверті");
stat(idle, "не грали");
stat(busy, "грали");
console.log();
const bands = [[1450, 2100], [1300, 1450], [1150, 1300], [900, 1150]];
for (const [lo, hi] of bands)
  stat(idle.filter((x) => x.p >= lo && x.p < hi), `не грали, ${lo}-${hi}`);

console.log("\nнайбільші падіння серед тих, хто не грав:");
idle.sort((a, b) => a.d - b.d).slice(0, 10)
  .forEach((x) => console.log(`  ${x.t.padEnd(22)}${String(x.p).padStart(5)} → ${String(now.get(x.t)).padStart(5)}  ${(x.d >= 0 ? "+" : "") + x.d}`));

const med = idle.map((x) => x.d).sort((a, b) => a - b)[Math.floor(idle.length / 2)];
console.log(`\nза 9 днів до відсічення це дало б близько ${(med * 9 / 5).toFixed(0)} очка команді, яка не грає.`);
