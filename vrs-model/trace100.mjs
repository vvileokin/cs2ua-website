import { simulate, P0 } from "./engine-all.mjs";
import fs from "node:fs";
/* Покрокова ціна титулу 100 Thieves: що саме додає кожен матч. */
const T = "100 Thieves";
const F = { [T+"|Isurus"]: T, ["BESTIA|"+T]: T, [T+"|NRG"]: T, [T+"|Wildcard"]: T,
            [T+"|BARCA"]: T, "NRG|Wildcard": "NRG", ["BARCA|NRG"]: "NRG" };
const src = fs.readFileSync("engine-all.mjs", "utf8");
console.log("старт:", P0.get(T));
const pts = simulate(F);
console.log("фініш:", pts.get(T).toFixed(2), " Δ =", (pts.get(T)-P0.get(T)).toFixed(2));
console.log("Eternal Fire:", pts.get("Eternal Fire").toFixed(2));
console.log("\nсуперники по дорозі (їхні очки на момент матчу важать):");
for (const t of ["Isurus","BESTIA","NRG","Wildcard","BARCA"])
  console.log("  " + t.padEnd(10) + P0.get(t) + " → " + pts.get(t).toFixed(0));
