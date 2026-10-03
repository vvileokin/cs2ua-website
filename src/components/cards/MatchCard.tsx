import type { CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ChevronRight } from "lucide-react";
import { TargetGlyph } from "@/components/layout/NavGlyphs";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { BrandIcon } from "@/components/ui/BrandIcon";
import { LiveBadge } from "@/components/ui/Badge";
import { EventMark } from "@/components/ui/EventMark";
import {
  getTournament,
  matchSkin,
  matchTeam,
  matchTimeLabel,
  type Match,
  type Team,
  isAuraSkin,
  eventGem,
} from "@/lib/data";
import { cn } from "@/lib/utils";

function TeamRow({
  team,
  score,
  leading,
  dim,
  showScore,
}: {
  team: Team;
  score: number;
  leading: boolean;
  dim: boolean;
  showScore: boolean;
}) {
  return (
    /* Impeccable: Crafted Team Row — the logo tile sits in its own pool of
       brand light; the losing side recedes rather than being greyed out. */
    <div
      className={cn(
        "flex items-center gap-2.5 transition-opacity duration-200",
        dim && "opacity-70",
      )}
    >
      <span
        className="relative inline-flex shrink-0 rounded-lg"
        style={{ boxShadow: `0 0 16px -10px ${team.brand}` }}
      >
        <TeamLogo team={team} size="cardCrest" />
      </span>
      <span
        className={cn(
          "min-w-0 flex-1 truncate text-sm font-semibold tracking-tight",
          dim ? "text-ink-subtle" : "text-ink",
        )}
      >
        {team.name}
      </span>
      {showScore && (
        <span
          className={cn(
            "tnum font-mono text-lg font-bold leading-none",
            leading
              ? "text-accent [text-shadow:0_0_14px_color-mix(in_oklch,var(--accent)_22%,transparent)]"
              : dim
                ? "text-ink-subtle"
                : "text-ink",
          )}
        >
          {score}
        </span>
      )}
    </div>
  );
}

export function MatchCard({
  match,
  /**
   * Назву турніру винесено в заголовок групи над карткою.
   *
   * На сторінці матчів поспіль стоять вісім карток одного турніру, і кожна
   * повторювала його назву — обрізану до «ESL Pro Leagu…», бо на неї немає
   * ширини. Повторене і обрізане водночас: рядок не називає турнір і забирає
   * місце. Там, де група вже його назвала, картка лишає тільки стадію.
   */
  hideTournament = false,
}: {
  match: Match;
  hideTournament?: boolean;
}) {
  const t = useTranslations("matches");
  const tour = getTournament(match.tournamentSlug);
  const isEvent = match.isEvent ?? tour?.isEvent ?? false;
  const skin = matchSkin(match, tour);
  const isLive = match.status === "live";
  const isFinished = match.status === "finished";
  const showScore = isLive || isFinished;
  const hasQuestions = match.openQuestions > 0;
  const aLead = match.scoreA > match.scoreB;
  const bLead = match.scoreB > match.scoreA;

  return (
    /* Impeccable: Crafted Match Card — lit from the top corners by the two
       teams' own brand colours, so a card for NAVI vs FaZe can't be mistaken
       for any other match. Live gets a filament of red across the top edge
       instead of a red box. */
    <Link
      href={`/matches/${match.id}`}
      data-skin={skin}
      style={
        {
          "--team-a": matchTeam(match, "a").brand,
          "--team-b": matchTeam(match, "b").brand,
          // BLAST's two-tone red/blue is its identity, so it keeps the exact
          // pair its old event skin used. Every other tournament lights both
          // bottom corners with its own accent. Same treatment everywhere, own
          // colour: no tournament is the odd one out.
          ...(skin === "blast"
            ? { "--tour-a": "rgb(255 12 60)", "--tour-b": "rgb(46 86 255)" }
            : isAuraSkin(skin)
              ? { "--tour-a": "rgb(var(--skin-glow))", "--tour-b": "rgb(var(--skin-deep))" }
              : tour?.accent
                ? { "--tour-a": tour.accent, "--tour-b": tour.accent }
                : {}),
        } as CSSProperties
      }
      className={cn(
        // One plate for every match. Event cards used to get `event-aura-soft`
        // plus a white ring, so a BLAST card sat next to a Stake card looking
        // like a different component — brighter, outlined, differently lit. The
        // event is already named twice in the header (icon + tournament name);
        // it doesn't also need its own chassis.
        "group lift relative flex h-full flex-col overflow-hidden rounded-2xl focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2",
        isAuraSkin(skin) ? "skin-match" : "surface-1 match-plate",
        isLive && "rail-live",
      )}
    >
      <div className="relative flex items-center justify-between gap-2 px-3.5 pt-2.5 sm:px-4 sm:pt-3">
        <span className="flex min-w-0 items-center gap-2 text-xs text-ink-subtle">
          {hideTournament ? (
            match.stage && <span className="truncate font-medium">{match.stage}</span>
          ) : (
            <>
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
            /* Повний локап: картка матчу називає турнір словами поруч зі
               знаком, тож знак може бути власним знаком івенту. Висоту кожного
               знака тримає сам EventMark — вони намальовані в різних
               пропорціях, і спільний розмір ламав половину з них. */
            <EventMark
              skin={skin}
              className={skin === "blast" ? "text-accent" : "text-[rgb(var(--skin-ring))]"}
            />
          )}
          {/* Full name, trimmed by CSS only when it genuinely doesn't fit. */}
          <span className="truncate font-medium">{tour?.name ?? match.tournamentName}</span>
          {match.stage && <span className="text-ink-faint max-sm:hidden">·</span>}
          {match.stage && <span className="shrink-0 max-sm:hidden">{match.stage}</span>}
            </>
          )}
        </span>
        {/* Impeccable: Crafted Header Rail — the kickoff sits here on every
            width now.

            It used to drop off phones and reappear in the rail below, on the
            grounds that it was fighting the tournament name for a 240px line.
            It lost that fight in every form it was given down there: dim text
            after the format, bold text before it, then a plate. The rail is
            simply the wrong place — it holds the facts that rarely change, and
            a reader looks to the top of a card for when something happens.

            The name yields instead. It truncates, which is what `truncate` is
            for, and it is the repeated value on a screen of cards from one
            tournament — while the time is the one that differs on every row.
            The stage stands down on phones for the same reason. */}
        {isLive ? (
          <LiveBadge />
        ) : (
          <span
            className={cn(
              "shrink-0 whitespace-nowrap text-xs font-semibold",
              isFinished
                ? "text-ink-subtle"
                : isAuraSkin(skin)
                  ? "text-[rgb(var(--skin-ring))]"
                  // The product's own yellow on an unskinned card. Azure is the
                  // link colour and read as one — a kickoff time is not
                  // somewhere to go, it is the fact the card is about, and it
                  // should wear the brand rather than borrow from navigation.
                  // Skinned cards keep their event's ring, as before.
                  : "text-accent",
            )}
          >
            {matchTimeLabel(match)}
          </span>
        )}
      </div>

      <div className="relative space-y-2 px-3.5 py-2.5 sm:px-4 sm:py-3">
        <TeamRow team={matchTeam(match, "a")} score={match.scoreA} leading={aLead} dim={isFinished && bLead} showScore={showScore} />
        <TeamRow team={matchTeam(match, "b")} score={match.scoreB} leading={bLead} dim={isFinished && aLead} showScore={showScore} />
      </div>

      {/* Hairline of light instead of a hard divider — reads as a seam, not a rule. */}
      <div className="relative mt-auto flex items-center justify-between px-3.5 py-2 shadow-[0_-1px_0_0_color-mix(in_oklch,var(--ink)_7%,transparent)] sm:px-4 sm:py-2.5">
        {hasQuestions ? (
          <>
            <span className="flex min-w-0 items-center gap-1.5 text-xs font-semibold text-ink-muted">
              {/* Формат стоїть тут, а не в окремій смузі над цим рядком. Та
                  смуга несла два слова — «BO3» і стан матчу — і коштувала
                  картці третьої горизонтальної панелі довкола двох рядків
                  змісту. Стан і так сказано: лайв горить у шапці, рахунок
                  говорить, що матч зіграно, а «прогнози відкриті» — те саме, що
                  «1 ставка · до ×5.86» праворуч. */}
              <span className="shrink-0 text-ink-subtle">{match.format}</span>
              <span aria-hidden className="text-ink-faint">·</span>
              <TargetGlyph
                className={cn(
                  "size-3.5 shrink-0",
                  isAuraSkin(skin) ? "text-[rgb(var(--skin-ring))]" : "text-accent",
                )}
              />
              {/* "Питання" was the admin's word for the row in the database,
                  not the player's word for the thing they do with it — nobody
                  answers a quiz here, they call a match. Staking matches say so
                  outright, since what's on offer there is a different deal. */}
              {match.betting
                ? t("bets", { count: match.openQuestions })
                : t("predictions", { count: match.openQuestions })}
            </span>
            <span className="flex items-center gap-1 text-xs">
              <span className="text-ink-subtle">{t("upTo")}</span>
              {match.betting && match.maxOdds ? (
                // A coefficient, not a payout: what a staking question is worth
                // depends on the stake, so quoting a points figure here would
                // promise a number the card cannot know.
                <span
                  className={cn(
                    "tnum font-mono font-bold leading-none",
                    isAuraSkin(skin) ? "text-[rgb(var(--skin-ring))]" : "text-accent",
                  )}
                >
                  ×{match.maxOdds.toFixed(2)}
                </span>
              ) : (
                <span className={cn("tnum flex items-center gap-1 font-mono font-bold leading-none", isAuraSkin(skin) ? "text-[rgb(var(--skin-ring))]" : "text-accent")}>
                  <BrandIcon name={eventGem(skin)} className="size-3.5" />
                  +{match.maxReward}
                </span>
              )}
              <ChevronRight className="size-4 text-ink-subtle transition-transform duration-200 group-hover:translate-x-0.5" />
            </span>
          </>
        ) : (
          <>
            <span className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-ink-subtle">
              <span className="shrink-0">{match.format}</span>
              <span aria-hidden className="text-ink-faint">·</span>
              <span className="truncate">{isFinished ? t("finishedLabel") : "Деталі матчу"}</span>
            </span>
            <ChevronRight className="size-4 text-ink-subtle transition-transform duration-200 group-hover:translate-x-0.5" />
          </>
        )}
      </div>
    </Link>
  );
}
