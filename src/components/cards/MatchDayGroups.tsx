import { MatchCard } from "@/components/cards/MatchCard";
import { LiveBadge } from "@/components/ui/Badge";
import { EventMark } from "@/components/ui/EventMark";
import { groupMatchesByDay, getTournament, matchSkin, type Match } from "@/lib/data";

/** Matches split into day sections (live / today / tomorrow / dates / played). */
export function MatchDayGroups({ matches }: { matches: Match[] }) {
  const groups = groupMatchesByDay(matches);

  return (
    <div className="space-y-8">
      {groups.map((g) => (
        <section key={g.key} className="space-y-3">
          <div className="flex items-center gap-2.5">
            {g.live ? (
              <LiveBadge />
            ) : (
              <span className="size-1.5 rounded-full bg-ink-faint" />
            )}
            <h2 className="text-sm font-bold uppercase tracking-wide text-ink-muted">
              {g.label}
            </h2>
            <span className="tnum text-xs font-semibold text-ink-subtle">
              {g.items.length}
            </span>
          </div>
          <DayBody items={g.items} />
        </section>
      ))}
    </div>
  );
}

/**
 * День — це або один турнір, або кілька.
 *
 * Коли турнір один, його назва над сіткою стоїть раз; коли їх кілька, день
 * розпадається на підрозділи з назвою кожного. В обох випадках картка вільна
 * від рядка, який на ній усе одно не вміщався: вісім карток EPL підряд писали
 * «ESL Pro Leagu…» вісім разів і жодного разу не назвали турнір.
 *
 * Так само розставляють матчі HLTV і thespike: день, усередині — турніри.
 */
function DayBody({ items }: { items: Match[] }) {
  const order: string[] = [];
  const byTour = new Map<string, Match[]>();
  for (const m of items) {
    const key = m.tournamentSlug ?? m.tournamentName ?? "";
    if (!byTour.has(key)) { byTour.set(key, []); order.push(key); }
    byTour.get(key)!.push(m);
  }

  return (
    <div className="space-y-5">
      {order.map((key) => (
        <div key={key} className="space-y-2">
          <TourLabel match={byTour.get(key)![0]} count={byTour.get(key)!.length} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {byTour.get(key)!.map((m) => (
              <MatchCard key={m.id} match={m} hideTournament />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Шапка підрозділу: знак турніру, його повна назва і скільки матчів сьогодні. */
function TourLabel({ match, count }: { match: Match; count: number }) {
  const tour = getTournament(match.tournamentSlug);
  const skin = matchSkin(match, tour);
  const name = tour?.name ?? match.tournamentName;
  if (!name) return null;

  return (
    <div data-skin={skin} className="flex items-center gap-2 px-0.5 text-xs">
      {match.tournamentIcon ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={match.tournamentIcon}
          alt=""
          width={14}
          height={14}
          loading="lazy"
          decoding="async"
          className="size-3.5 shrink-0 object-contain"
        />
      ) : (
        <EventMark
          skin={skin}
          className={skin === "blast" ? "text-accent" : "text-[rgb(var(--skin-ring))]"}
        />
      )}
      <span className="truncate font-semibold text-ink">{name}</span>
      <span className="tnum shrink-0 font-mono text-ink-subtle">{count}</span>
    </div>
  );
}
