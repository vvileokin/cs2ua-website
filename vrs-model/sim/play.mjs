import { teamOf } from "./teams.mjs";
import { EVENTS, prizesFor } from "./events.mjs";

/**
 * Розіграш сіток: з кожного турніру виходить набір матчів і розподіл призових,
 * які потім додаються у дані й переганяються формулою Valve.
 *
 * Імовірність перемоги береться з нашої каліброваної шкали: дільник 817, а не
 * 400, бо виміряно на 932 матчах — Valve вдвічі впевненіший у фаворитах, ніж
 * життя.
 */
const D = 817.3976863341695;
const pMap = (a, b) => 1 / (1 + Math.pow(10, (b - a) / D));
const pBo3 = (p) => p * p * (3 - 2 * p);

/** Детермінований генератор: один і той самий номер прогону дає ту саму сітку. */
export function rng(seed) {
  let s = (seed >>> 0) || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

const ts = (d) => Math.floor(new Date(d + "T12:00:00Z").getTime() / 1000);

/* ---------- формати ---------- */

/** Одна гра: повертає індекс переможця. */
const play = (A, B, rate, rand, bo3 = true) => {
  const p = pMap(rate(A), rate(B));
  return rand() < (bo3 ? pBo3(p) : p) ? [A, B] : [B, A];
};

/** Плей-оф на вибування: повертає список місць згори вниз. */
function knockout(list, rate, rand, log) {
  let alive = [...list];
  const out = [];
  while (alive.length > 1) {
    const next = [];
    const losers = [];
    for (let i = 0; i < alive.length; i += 2) {
      if (i + 1 >= alive.length) { next.push(alive[i]); continue; }
      const [w, l] = play(alive[i], alive[i + 1], rate, rand);
      log(w, l);
      next.push(w); losers.push(l);
    }
    out.unshift(...losers);
    alive = next;
  }
  return [...alive, ...out];
}

/** Швейцарка до трьох перемог / трьох поразок. */
function swiss(list, rate, rand, log, advance) {
  const rec = new Map(list.map((t) => [t, { w: 0, l: 0 }]));
  let active = [...list];
  while (active.length) {
    const groups = new Map();
    for (const t of active) {
      const r = rec.get(t);
      const k = `${r.w}-${r.l}`;
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(t);
    }
    for (const g of groups.values()) {
      for (let i = 0; i + 1 < g.length; i += 2) {
        const [w, l] = play(g[i], g[i + 1], rate, rand);
        log(w, l);
        rec.get(w).w++; rec.get(l).l++;
      }
      /* Непарна група лишає одного без пари. Йому зараховується прохід без
         гри — інакше його запис не змінюється, він не вибуває і не проходить,
         і коло крутиться вічно. */
      if (g.length % 2 === 1) rec.get(g[g.length - 1]).w++;
    }
    active = active.filter((t) => rec.get(t).w < 3 && rec.get(t).l < 3);
  }
  const done = [...list].sort((a, b) => (rec.get(b).w - rec.get(b).l) - (rec.get(a).w - rec.get(a).l));
  return { through: done.slice(0, advance), rest: done.slice(advance) };
}

/** GSL-група на чотири: двоє проходять. */
function gslGroup(g, rate, rand, log) {
  const [a1, b1] = play(g[0], g[3], rate, rand); log(a1, b1);
  const [a2, b2] = play(g[1], g[2], rate, rand); log(a2, b2);
  const [win] = play(a1, a2, rate, rand); log(win, win === a1 ? a2 : a1);
  const [, elim] = play(b1, b2, rate, rand); log(b1 === elim ? b2 : b1, elim);
  const second = play(win === a1 ? a2 : a1, b1 === elim ? b2 : b1, rate, rand);
  log(second[0], second[1]);
  return { through: [win, second[0]], out: [second[1], elim] };
}

/**
 * Розіграти один турнір. Повертає список місць: placements[i] — команда, що
 * посіла i+1 місце (для спільних місць порядок усередині не має значення,
 * призові однакові).
 */
export function playEvent(ev, field, rate, rand) {
  const matches = [];
  const log = (w, l) => matches.push([w, l]);
  const f = [...field].sort((a, b) => rate(b) - rate(a));   // сіяння за рейтингом

  if (ev.format === "single4") return { placements: knockout(f, rate, rand, log), matches };
  if (ev.format === "double8" || ev.format === "gsl8") {
    if (f.length <= 4) return { placements: knockout(f, rate, rand, log), matches };
    const half = Math.ceil(f.length / 2);
    const gA = f.filter((_, i) => i % 2 === 0).slice(0, half);
    const gB = f.filter((_, i) => i % 2 === 1);
    const A = gA.length === 4 ? gslGroup(gA, rate, rand, log) : { through: knockout(gA, rate, rand, log).slice(0, 2), out: knockout(gA, rate, rand, () => {}).slice(2) };
    const B = gB.length === 4 ? gslGroup(gB, rate, rand, log) : { through: knockout(gB, rate, rand, log).slice(0, 2), out: knockout(gB, rate, rand, () => {}).slice(2) };
    const po = knockout([A.through[0], B.through[1], B.through[0], A.through[1]], rate, rand, log);
    return { placements: [...po, ...A.out, ...B.out], matches };
  }
  /* швейцарка: вісім проходять далі, решта за різницею */
  const adv = f.length >= 20 ? 8 : f.length >= 12 ? 8 : 4;
  const s = swiss(f, rate, rand, log, Math.min(adv, f.length));
  const po = knockout(s.through, rate, rand, log);
  return { placements: [...po, ...s.rest], matches };
}

/**
 * Зібрати світ одного прогону: усі турніри, усі матчі, усі призові.
 * Повертає { addMatches, addEvents } у форматі даних двигуна.
 */
export function buildWorld(seed, rate, pools = {}) {
  const rand = rng(seed);
  const addMatches = [];
  const addEvents = [];

  for (const ev of EVENTS) {
    /* Склад: названі команди плюс, де місця ще не роздані, випадкові з пулу. */
    let field = ev.teams.filter((n) => teamOf(n));
    if (ev.tbd && pools[ev.tbdPool]?.length) {
      const pool = pools[ev.tbdPool].filter((n) => !field.includes(n) && teamOf(n));
      for (let i = 0; i < ev.tbd && pool.length; i++) {
        const k = Math.floor(rand() * pool.length);
        field.push(pool.splice(k, 1)[0]);
      }
    }
    if (field.length < 4) continue;

    const { placements, matches } = playEvent(ev, field, rate, rand);
    const eventId = `sim-${ev.name.replace(/[^a-z0-9]/gi, "").toLowerCase()}`;
    const begin = ts(ev.begin), end = ts(ev.end);
    const prizes = prizesFor(ev, placements.length);

    matches.forEach(([w, l], i) => {
      const W = teamOf(w), L = teamOf(l);
      addMatches.push({
        matchStartTime: begin + Math.floor(((end - begin) * i) / Math.max(1, matches.length)),
        team1Id: W.id, team1Name: W.name, team1Image: "", team1Players: W.players,
        team2Id: L.id, team2Name: L.name, team2Image: "", team2Players: L.players,
        eventId, pagename: eventId, parentEventPage: eventId,
        matchId: `${eventId}-${seed}-${i}`,
        maps: [{ map: "sim", team1Score: 2, team2Score: 0 }],
        winningTeam: 1, forfeited: false, valveRanked: true, lan: !!ev.lan,
      });
    });

    addEvents.push({
      eventId, eventPage: eventId, parent: eventId, eventName: ev.name,
      prizePool: `$${ev.prize}`, lan: !!ev.lan, location: "", valveRanked: true, finished: true,
      fmt: begin, lmt: end,
      prizeDistribution: placements.map((t, i) => ({
        placement: String(i + 1), teamId: teamOf(t).id,
        prize: prizes[i] ?? 0, clubShare: prizes[i] ?? 0,
        shared: false, progress: false, qualifiedEvents: [],
      })),
    });
  }
  return { addMatches, addEvents };
}
