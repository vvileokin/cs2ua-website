import { MajorCrest } from "./MajorCrest";
import { findTeam } from "@/lib/data";
import type { StageMatch } from "@/lib/db/pickem";

/**
 * Найближчі матчі стадії — тонка стрічка над вкладками.
 *
 * Вона не про результат і не про ставку: до старту стадії жодного результату
 * ще немає. Її робота — зробити шістнадцять слагів зі складу чимось, що вже
 * має дату. Поки пар не видно, стадія лишається списком команд; коли видно,
 * видно й те, що до першого матчу лишилось стільки-то, і що HEROIC грає з
 * Imperial, а не «десь колись».
 *
 * Тільки перший тур. Далі пари зводить швейцарка за результатами, і вписати
 * їх наперед неможливо — тож стрічка чесно закінчується там, де закінчується
 * відоме.
 *
 * Їде вбік, а не переноситься. Вісім пар у два ряди на телефоні з'їли б
 * півекрана ще до того, як людина побачить, за чим прийшла; один ряд із
 * прокруткою лишається смугою, якою й був задуманий.
 */
export function OpeningStrip({ matches }: { matches: StageMatch[] }) {
  if (!matches.length) return null;

  return (
    <div className="-mx-3 overflow-x-auto px-3 sm:mx-0 sm:px-0">
      <div className="flex min-w-max gap-1.5">
        {matches.map((m, i) => {
          const a = findTeam(m.a);
          const b = findTeam(m.b);
          return (
            <div
              key={`${m.a}-${m.b}-${i}`}
              title={`${a?.name ?? m.a} — ${b?.name ?? m.b}`}
              className="flex shrink-0 items-center gap-2 rounded-[4px] bg-[var(--major-floor)] px-2.5 py-2 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.07)]"
            >
              <MajorCrest team={a} slug={m.a} size={22} />
              <MajorCrest team={b} slug={m.b} size={22} />
              <time
                dateTime={m.at}
                className="tnum text-[0.6875rem] font-bold text-ink-dim"
              >
                {new Date(m.at).toLocaleString("uk-UA", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: "Europe/Kyiv",
                })}
              </time>
            </div>
          );
        })}
      </div>
    </div>
  );
}
