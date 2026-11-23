import { Link } from "@/i18n/navigation";
import { ChevronRight } from "lucide-react";
import { LockCountdown } from "./LockCountdown";
import { cn } from "@/lib/utils";

/**
 * Дорога мейджора — чотири стадії підряд.
 *
 * Сторінка турніру в нас у всіх однакова: банер, вкладки, сітка. Для події на
 * три дні це правда, для мейджора — ні. Мейджор це не одна сітка, а дорога:
 * шістнадцять грають, вісім проходять далі, там знову шістнадцять, і так
 * тричі, перш ніж починається плейоф. Жодна інша подія на сайті такої форми
 * не має, і саме вона має зустрічати на сторінці першою — бо з неї випливає
 * все інше, включно з тим, навіщо тут картка.
 *
 * Звідси й вигляд: чотири рівні плити, як вкладки стадій на сторінці пікемів,
 * з тими самими прямими кутами й тим самим багряним. Сторінка події і
 * сторінка пікемів — це дві кімнати одного будинку, а не два різні сайти.
 *
 * Унизу рядок із єдиним, що просить дії просто зараз: скільки лишилось до
 * замка відкритої стадії. Він же і є посиланням на картку — бо відповідь на
 * «ще п'ятнадцять годин» одна, і це не «добре».
 */

export type RoadStage = {
  stage: number;
  title: string;
  kind: string;
  startsAt: string;
  teams: string[];
};

function dayLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("uk-UA", {
    day: "numeric",
    month: "short",
    timeZone: "Europe/Kyiv",
  });
}

/** Чи стадія вже почалася. Винесено з тіла компонента: час — не чиста
 *  величина, і читати його під час рендера не можна. */
function hasStarted(s: RoadStage, now = Date.now()): boolean {
  return now >= new Date(s.startsAt).getTime();
}

export function MajorRoad({ stages }: { stages: RoadStage[] }) {
  if (!stages.length) return null;

  const started = (s: RoadStage) => hasStarted(s);

  /* Поточна — остання, що почалася; якщо ще жодна, то перша. */
  const live = [...stages].reverse().find(started) ?? stages[0];
  /* Відкрита — найближча, що ще не почалася і має ПОВНИЙ склад. Саме її
     картку можна скласти, і саме її замок відлічується внизу.

     Повний, а не «хоч якийсь»: друга й третя стадії весь час стоять із
     вісьмома вписаними наперед, і за слабшою умовою рядок обіцяв би картку,
     якої ще немає — на сторінці пікемів у неї на місці «чекаємо, хто вийде». */
  const open = stages.find(
    (s) => !started(s) && s.teams.length === (s.kind === "playoff" ? 8 : 16),
  );

  return (
    <section className="major-plate overflow-hidden rounded-[4px]">
      <div className="grid grid-cols-4 gap-px bg-white/10">
        {stages.map((s) => {
          const here = s.stage === live.stage;
          const done = started(s) && !here;
          return (
            <div
              key={s.stage}
              className={cn(
                "px-2 py-2.5 text-center sm:px-3",
                here ? "bg-[var(--major-hot)]" : "bg-[var(--major-floor)]",
              )}
            >
              <p
                className={cn(
                  "truncate text-[0.625rem] font-black uppercase tracking-[0.08em] sm:text-[0.6875rem]",
                  here ? "text-[var(--major-ink)]" : done ? "text-ink-dim" : "text-ink-muted",
                )}
              >
                {s.title}
              </p>
              <p
                className={cn(
                  "mt-0.5 truncate text-[0.625rem] font-bold tabular-nums",
                  here ? "text-[var(--major-ink)]/75" : "text-ink-dim",
                )}
              >
                {/* Дата старту, а не проміжок: кінця стадії ми не знаємо —
                    він залежить від того, як швидко вісімка набереться. */}
                {dayLabel(s.startsAt)}
              </p>
            </div>
          );
        })}
      </div>

      {open && (
        <Link
          href="/major"
          className="flex items-center gap-2 border-t border-white/[0.07] px-3 py-2.5 transition-colors hover:bg-white/[0.04] sm:px-4"
        >
          <span className="size-1.5 shrink-0 rounded-full bg-[var(--major-hot)] shadow-[0_0_10px_var(--major-hot)]" />
          {/* Дія, а не опис. «Картка на «Стадія 1» закриється…» переказувало
              те, що вже написано на плиті над ним, і займало два рядки, щоб
              сказати одне слово. Лишилось, власне, слово — і час, якого воно
              варте. */}
          <span className="flex-1 text-[0.8125rem] font-semibold text-ink">
            Зробити пікем
          </span>
          <LockCountdown
            at={open.startsAt}
            className="shrink-0 text-[0.8125rem] font-extrabold text-[var(--major-hot)]"
          />
          <ChevronRight className="size-4 shrink-0 text-ink-dim" />
        </Link>
      )}
    </section>
  );
}
