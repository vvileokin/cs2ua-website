import { simulate, P0 } from "./engine-all.mjs";

/**
 * Стеля 100 Thieves по всіх можливих фіналістах. Це єдине, що лишилось між
 * Eternal Fire і вилітом: решта команд під ними або не грають, або грають
 * турнір за $13 600.
 */
const T = "100 Thieves";
console.log("суперник у фіналі      100 Thieves    Eternal Fire   різниця");
for (const fin of ["BARCA", "NRG", "Wildcard"]) {
  const F = { [T + "|Isurus"]: T, ["BESTIA|" + T]: T, [T + "|" + fin]: T,
    "NRG|Wildcard": fin === "Wildcard" ? "Wildcard" : "NRG",
    ["BARCA|" + (fin === "Wildcard" ? "Wildcard" : "NRG")]: fin === "BARCA" ? "BARCA" : (fin === "Wildcard" ? "Wildcard" : "NRG") };
  const pts = simulate(F);
  const a = pts.get(T), b = pts.get("Eternal Fire");
  console.log("  " + fin.padEnd(20) + a.toFixed(1).padStart(8) + b.toFixed(1).padStart(16) +
    ((a - b) > 0 ? "+" : "") + (a - b).toFixed(1).padStart(10));
}
