import { simulate, REGION } from "./engine-all.mjs";
const AM = Object.keys(REGION).filter((t) => REGION[t] === "americas");
const show = (lbl, F) => {
  const pts = simulate(F);
  const order = AM.slice().sort((a, b) => pts.get(b) - pts.get(a));
  console.log("  " + lbl.padEnd(40) +
    ["Wildcard", "BESTIA"].map((t) => `${t} ${pts.get(t).toFixed(0)} (${order.indexOf(t) + 1})`).join("   "));
};
console.log("дев'яте місце Америки, без шуму:");
show("BESTIA програють 100 Thieves", { "BESTIA|100 Thieves": "100 Thieves" });
show("BESTIA б'ють 100T, Wildcard у фіналі", { "BESTIA|100 Thieves": "BESTIA", "BARCA|Wildcard": "Wildcard", "BESTIA|Wildcard": "BESTIA" });
show("BESTIA титул, Wildcard програли BARCA", { "BESTIA|100 Thieves": "BESTIA", "BARCA|Wildcard": "BARCA", "BESTIA|BARCA": "BESTIA" });
show("…і Wildcard ще й програли за третє", { "BESTIA|100 Thieves": "BESTIA", "BARCA|Wildcard": "BARCA", "BESTIA|BARCA": "BESTIA", "100 Thieves|Wildcard": "100 Thieves" });
