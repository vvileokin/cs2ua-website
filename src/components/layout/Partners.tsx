import { cn } from "@/lib/utils";
import { BETKING_URL } from "@/components/ui/BetkingMark";
import ticker from "./PartnerTicker.module.css";

// Per-partner heights tuned so the marks read at the same visual size.
// BetKing's lockup is much wider than it is tall (mark + wordmark, ~8:1), so
// it is matched to the row on width rather than on height — on height it would
// dominate everything standing next to it.
//
// Один партнер — це поки що список з одного. Решта коду свідомо лишилась
// списком: наступного партнера додають рядком сюди, і більше ніде. Єдине, що
// доведеться перечитати при цьому, — TICKER_PASSES нижче.
const partners = [
  {
    name: "BetKing",
    logo: "/brand/partner-betking.svg",
    url: BETKING_URL,
    row: "h-2.5",
    strip: "h-3",
    ticker: "h-[9px]",
    tickerLogo: "/brand/partner-betking.svg",
    offset: "",
    // Solid red artwork: greyscale turns it a muddy mid-grey, so it is forced
    // white instead and drops back to its own red on hover.
    idle: "brightness-0 invert",
    hover: "group-hover:brightness-100 group-hover:invert-0",
  },
];

/**
 * Partner logos — dim and unobtrusive by default, brighten on hover.
 * `layout="row"` for the sidebar footer, `layout="strip"` for wider footers.
 */
export function Partners({
  layout = "row",
  className,
}: {
  layout?: "row" | "strip";
  className?: string;
}) {
  return (
    <div
      className={cn(
        layout === "strip"
          ? "flex flex-wrap items-center justify-center gap-x-8 gap-y-4"
          : "flex items-center gap-4",
        className,
      )}
    >
      {partners.map((p) => (
        <a
          key={p.name}
          href={p.url}
          target="_blank"
          rel="noopener noreferrer sponsored"
          aria-label={p.name}
          className="group inline-flex items-center opacity-45 transition-opacity duration-300 hover:opacity-100 focus-visible:opacity-100"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={p.logo}
            alt={p.name}
            loading="lazy"
            decoding="async"
            className={cn(
              "w-auto transition-[filter] duration-300",
              p.idle,
              p.hover,
              layout === "strip" ? p.strip : p.row,
              p.offset,
            )}
          />
        </a>
      ))}
    </div>
  );
}

// Парне число проходів, щоб доріжка була двома однаковими половинами: зсув
// рівно на половину дає кадр, не відрізнити від початкового, і шва не видно.
//
// Рахується від половини, а не від усієї доріжки. Половина має бути не вужчою
// за екран, інакше в кадр потрапляє її край — тобто порожнеча між кінцем
// першої половини і початком другої. Лого BetKing у стрічці йде ~72px плюс
// px-6 з обох боків, разом ~120px на прохід; дванадцять проходів у половині —
// це ~1440px і з запасом перекриває найширший екран, на якому нижній бар ще
// існує (він зникає на lg, 1024px).
//
// Було дванадцять, коли партнерів було двоє: дванадцять проходів пари — це
// двадцять чотири лого, по дванадцять у половині. Партнер лишився один, тож
// щоб половина не схудла вдвічі, проходів стало вдвічі більше.
const TICKER_PASSES = 24;

/**
 * Partner ticker — the strip riding on top of the mobile bottom bar. Phones
 * have no sidebar, so this is where the partners live there. Only the first
 * pass is announced and focusable; the rest are the same links repeated for
 * the loop.
 */
export function PartnerTicker({ className }: { className?: string }) {
  return (
    <div
      aria-label="Партнери"
      role="group"
      // White in both themes: it is the partners' ribbon, not a surface of
      // this product, and their marks are drawn to be read on white.
      className={cn(ticker.ticker, "overflow-hidden bg-white", className)}
    >
      <div className={ticker.mask}>
        <div className={cn(ticker.track, "flex w-max items-center")}>
          {Array.from({ length: TICKER_PASSES }, (_, pass) =>
            partners.map((p) => (
              <a
                key={`${pass}-${p.name}`}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer sponsored"
                aria-label={pass === 0 ? p.name : undefined}
                aria-hidden={pass === 0 ? undefined : true}
                tabIndex={pass === 0 ? undefined : -1}
                className="flex h-7 shrink-0 items-center px-6"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.tickerLogo}
                  alt=""
                  decoding="async"
                  className={cn("w-auto", p.ticker)}
                />
              </a>
            )),
          )}
        </div>
      </div>
    </div>
  );
}
