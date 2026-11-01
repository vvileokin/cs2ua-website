import { simulate, P0 } from "./engine-all.mjs";
const T = "100 Thieves";
const cases = [
  ["100T б'ють BESTIA, програють фінал Wildcard", { "HOTU|1win": "1win", ["BESTIA|"+T]: T, "BARCA|Wildcard": "Wildcard", [T+"|Wildcard"]: "Wildcard" }],
  ["100T б'ють BESTIA, програють фінал BARCA",    { "HOTU|1win": "1win", ["BESTIA|"+T]: T, "BARCA|Wildcard": "BARCA", [T+"|BARCA"]: "BARCA" }],
  ["100T програють BESTIA у півфіналі",           { "HOTU|1win": "1win", ["BESTIA|"+T]: "BESTIA" }],
  ["100T беруть титул",                            { "HOTU|1win": "1win", ["BESTIA|"+T]: T, "BARCA|Wildcard": "Wildcard", [T+"|Wildcard"]: T }],
];
console.log("усюди прибито: 1win виграють фінал Москви, HOTU другі\n");
console.log("сценарій                                      fnatic    HOTU    100T      EF");
for (const [lbl, F] of cases) {
  const pts = simulate(F);
  console.log("  " + lbl.padEnd(44) +
    ["fnatic","HOTU",T,"Eternal Fire"].map((t) => pts.get(t).toFixed(0).padStart(7)).join(""));
}
