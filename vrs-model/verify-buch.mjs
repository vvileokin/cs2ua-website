import fs from "node:fs";
/**
 * Перевірка кроку на самому Бухаресті.
 *
 * Це найпряміший тест, який взагалі можна поставити перед сценарієм: двадцять
 * дві серії другого, третього і четвертого туру, таблиця до них (24 жовтня,
 * після першого туру) і таблиця після них (27 жовтня, 21:35). Нічого іншого
 * ці шістнадцять команд у вікні не грали.
 */
const NAME = { aurora:"Aurora", mongolz:"The MongolZ", fut:"FUT", tyloo:"TYLOO",
  spirit:"Spirit", betboom:"BETBOOM", mouz:"MOUZ", liquid:"Liquid", vitality:"Vitality",
  ninez:"9z", legacy:"Legacy", nemiga:"Nemiga", g2:"G2", natus:"Natus Vincere",
  furia:"FURIA", sharks:"DENDELE" };
const R = [
  ["furia-vs-natus",0,2],["legacy-vs-sharks",2,0],["g2-vs-aurora",0,2],["mouz-vs-ninez",2,0],
  ["betboom-vs-nemiga",2,0],["vitality-vs-mongolz",2,0],["fut-vs-liquid",2,0],["spirit-vs-tyloo",2,0],
  ["g2-vs-sharks",1,2],["betboom-vs-natus",2,0],["spirit-vs-furia",2,1],["liquid-vs-legacy",2,0],
  ["ninez-vs-tyloo",1,2],["vitality-vs-fut",1,2],["nemiga-vs-aurora",0,2],["mongolz-vs-mouz",0,2],
  ["vitality-vs-natus",2,0],["furia-vs-tyloo",2,0],["spirit-vs-mouz",1,2],["mongolz-vs-legacy",2,0],
  ["liquid-vs-aurora",1,2],["nemiga-vs-sharks",2,0],
];
const P = (f) => { const m=new Map();
  for (const s of JSON.parse(fs.readFileSync(f,"utf8")).rows.split(";")) { const c=s.split("|"); if(!m.has(c[1]))m.set(c[1],+c[2]); }
  return m; };
const was = P("vrs-live-2410b.json"), now = P("vrs-live-2710.json");
const Q=Math.log(10)/400, RD=75, D=817.4;
const gl=1/Math.sqrt(1+(3*Q*Q*RD*RD)/(Math.PI*Math.PI));
const KG=Q*(1/(1/(RD*RD)+Q*Q*gl*gl*0.25))*gl;
const {a:WIN_K,b:LOSS_K}=JSON.parse(fs.readFileSync("step-scale.json","utf8"));
const E=(a,b)=>1/(1+Math.pow(10,(gl*(a-b))/-D));
const cur=new Map(), step=new Map();
for (const k of Object.values(NAME)) { cur.set(k, was.get(k)); step.set(k, 0); }
for (const [id,a,b] of R) {
  const [x,y]=id.split("-vs-").map(s=>NAME[s]);
  const [w,l]=a>b?[x,y]:[y,x];
  const e=E(cur.get(w),cur.get(l));
  const dw=WIN_K*KG*(1-e), dl=-LOSS_K*KG*(1-e>0?E(cur.get(l),cur.get(w)):0);
  cur.set(w,cur.get(w)+dw); cur.set(l,cur.get(l)+dl);
  step.set(w,step.get(w)+dw); step.set(l,step.get(l)+dl);
}
console.log("22 серії, 24.10 (після першого туру) → 27.10 21:35\n");
console.log("команда          24.10   прогноз    факт   різниця");
let se=0,n=0;
const rows=Object.values(NAME).map(t=>({t, w:was.get(t), pred:step.get(t), act:now.get(t)-was.get(t)}))
  .sort((a,b)=>b.act-a.act);
for (const r of rows) {
  const d=r.pred-r.act; se+=d*d; n++;
  console.log(`  ${r.t.padEnd(15)}${String(r.w).padStart(5)}` +
    `${((r.pred>=0?"+":"")+r.pred.toFixed(0)).padStart(10)}` +
    `${((r.act>=0?"+":"")+r.act).padStart(8)}` +
    `${((d>=0?"+":"")+d.toFixed(0)).padStart(10)}`);
}
console.log(`\nсередньоквадратична похибка ${Math.sqrt(se/n).toFixed(1)} очка на команду`);
const bias=rows.reduce((s,r)=>s+(r.pred-r.act),0)/n;
console.log(`систематичний зсув ${(bias>=0?"+":"")+bias.toFixed(1)} (додатне — модель завищує рух)`);
const wn=rows.filter(r=>r.act>0), ln=rows.filter(r=>r.act<=0);
console.log(`у тих, хто зростав: зсув ${(wn.reduce((s,r)=>s+r.pred-r.act,0)/wn.length).toFixed(1)}  ·  у тих, хто падав: ${(ln.reduce((s,r)=>s+r.pred-r.act,0)/ln.length).toFixed(1)}`);
