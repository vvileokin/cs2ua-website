import { simulate, P0, REGION } from "./engine-all.mjs";
const EU = Object.keys(REGION).filter((t) => REGION[t] === "europe");
const T = "100 Thieves";
console.log("останнє європейське місце — усе в одному матчі\n");
console.log("фінал FiRe               EF   100 Thieves   fnatic    HOTU   18-те місце");
for (const [lbl, w] of [["100 Thieves виграють", T], ["Wildcard відіграються", "Wildcard"]]) {
  const pts = simulate({ [T + "|Wildcard"]: w });
  const order = EU.slice().sort((a, b) => pts.get(b) - pts.get(a));
  console.log("  " + lbl.padEnd(24) +
    ["Eternal Fire", T, "fnatic", "HOTU"].map((t) => pts.get(t).toFixed(0).padStart(6)).join("") +
    "   " + order[17]);
}
