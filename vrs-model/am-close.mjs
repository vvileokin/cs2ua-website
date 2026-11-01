import { simulate, P0, REGION, LAST } from "./engine-all.mjs";
const AM = Object.keys(REGION).filter((t) => REGION[t] === "americas");
const T = "100 Thieves";
const show = (lbl, F) => {
  const pts = simulate(F);
  const order = AM.slice().sort((a, b) => pts.get(b) - pts.get(a));
  const pl = (t) => order.indexOf(t) + 1;
  console.log("  " + lbl.padEnd(38) +
    ["Wildcard", "BESTIA", "Imperial", "NRG"].map((t) =>
      `${t} ${pts.get(t).toFixed(0)} (${pl(t)})`).join("  "));
};
console.log("хто бере дев'яте місце Америки (NOISE=0):");
show("BESTIA програють 100 Thieves", { ["BESTIA|" + T]: T });
show("BESTIA б'ють 100T, програють фінал", { ["BESTIA|" + T]: "BESTIA", "BARCA|Wildcard": "Wildcard", "BESTIA|Wildcard": "Wildcard" });
show("BESTIA б'ють 100T і беруть титул", { ["BESTIA|" + T]: "BESTIA", "BARCA|Wildcard": "Wildcard", "BESTIA|Wildcard": "BESTIA" });
show("…і BARCA вибивають Wildcard", { ["BESTIA|" + T]: "BESTIA", "BARCA|Wildcard": "BARCA", "BESTIA|BARCA": "BESTIA" });
