import fs from "node:fs";

/** Перепрогравання швейцарки з бази — щоб побачити, де картка сідає не в ту колонку. */
const ENV = Object.fromEntries(
  fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/).filter((l) => l.includes("=")).map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);
const q = async (p) => (await fetch(`${ENV.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${p}`, {
  headers: { apikey: ENV.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${ENV.SUPABASE_SERVICE_ROLE_KEY}` },
})).json();

const all = await q("matches?select=id,team_a,team_b,score_a,score_b,status,stage,start_at&tournament_slug=eq.esl-pro-league-s24&order=start_at.asc");
/* Те саме правило, що в src/lib/swiss.ts: беремо те, що назвалось швейцаркою. */
const swiss = all.filter((m) => /швейцарк/i.test(m.stage ?? ""));

const rec = new Map();
const get = (s) => rec.get(s) ?? (rec.set(s, { w: 0, l: 0 }), rec.get(s));
const cols = new Map();

for (const m of swiss) {
  const ra = get(m.team_a), rb = get(m.team_b);
  const key = `${Math.min(ra.w, rb.w)}-${Math.min(ra.l, rb.l)}`;
  (cols.get(key) ?? cols.set(key, []).get(key)).push(
    `${m.team_a}(${ra.w}-${ra.l}) vs ${m.team_b}(${rb.w}-${rb.l})  [${m.stage}]`,
  );
  if (m.status === "finished" && m.score_a !== m.score_b) {
    const aWon = m.score_a > m.score_b;
    (aWon ? ra : rb).w++;
    (aWon ? rb : ra).l++;
  }
}

const EXPECT = { "0-0": 8, "1-0": 4, "0-1": 4, "2-0": 2, "1-1": 4, "0-2": 2, "2-1": 3, "1-2": 3, "2-2": 3 };
for (const [k, n] of Object.entries(EXPECT)) {
  const got = cols.get(k) ?? [];
  const flag = got.length === n ? "ok" : `!! очікувалось ${n}`;
  console.log(`\n${k}  — ${got.length} ${flag}`);
  for (const line of got) console.log("   ", line);
}
const extra = [...cols.keys()].filter((k) => !(k in EXPECT));
if (extra.length) console.log("\nколонки поза моделлю:", extra.map((k) => `${k}×${cols.get(k).length}`).join(", "));
