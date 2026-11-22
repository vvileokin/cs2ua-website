"use client";

import * as React from "react";
import { MajorCrest } from "./MajorCrest";
import { findTeam } from "@/lib/data";
import { cn } from "@/lib/utils";

/**
 * «Хто візьме мейджор».
 *
 * Це не пікем і очок не дає. Пікем — задача на розподіл: кошики мають
 * зійтися. Тут питання одне, відповідь одна, і цікава вона не тим, хто
 * вгадав, а тим, як відповіла спільнота цілком. Тому голос нічого не
 * коштує, нічого не приносить і міняється скільки завгодно, поки не
 * почався плей-оф.
 *
 * Результат відкритий одразу, на відміну від карток. Картки ховаються до
 * замка, бо інакше пікем перетворюється на «подивись, що вибрали інші». Тут
 * навпаки: подивитися, що вибрали інші, — це і є весь сенс.
 *
 * Без діаграми і без таблиці.
 *
 * Спершу тут було коло з секторами, потім вісім рядків зі смугами. Обидва
 * показували те саме двічі: спершу результат, під ним — сітку гербів, щоб
 * проголосувати. Тридцять дві команди й так мусять десь лежати, а разом із
 * рядками це пів екрана на одне питання.
 *
 * Тому результат живе просто в сітці: відсоток стоїть над своїм гербом.
 * Голосування і його підсумок — це один і той самий предмет, і розносити їх
 * на два блоки означало змушувати око ходити туди-сюди, щоб зіставити
 * команду з її числом.
 *
 * Кількість голосів у кожної прибрана: при ста учасниках «43» і «41%» — це
 * одне й те саме, сказане двічі. Загальне число лишилося в заголовку, бо без
 * нього відсоток ні про що не говорить: три голоси з дев'яти теж дають 33%.
 */

/**
 * Колір відсотка: лідер і всі інші.
 *
 * Шкала з трьох і більше відтінків тут пробувалася й пішла. Сходинки
 * «червоний — тьмяніший червоний — сірий» на око не шикуються в порядок:
 * сірий світліший за темно-червоний, і третє місце починало виглядати
 * помітнішим за друге. Два стани брешуть менше, а саме число й так стоїть
 * поруч і каже рівно те, що треба.
 */
function tone(rank: number) {
  return rank === 0 ? "var(--major-hot)" : "var(--ink-muted)";
}

export function ChampionPoll({
  teams,
  initialTally,
  initialVote,
  locked,
}: {
  /** Усі команди мейджора, у порядку посіву. */
  teams: string[];
  initialTally: Record<string, number>;
  initialVote: string | null;
  locked: boolean;
}) {
  const [tally, setTally] = React.useState(initialTally);
  const [vote, setVote] = React.useState(initialVote);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [note, setNote] = React.useState<string | null>(null);

  const total = Object.values(tally).reduce((s, n) => s + n, 0);

  const ranked = React.useMemo(
    () =>
      Object.entries(tally)
        .filter(([, n]) => n > 0)
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])),
    [tally],
  );

  /**
   * Місце кожної команди в поточному підрахунку.
   *
   * Потрібне тільки для кольору: перший, другий, усі інші.
   */
  const rankOf = React.useMemo(() => {
    const m: Record<string, number> = {};
    ranked.forEach(([slug], i) => (m[slug] = i));
    return m;
  }, [ranked]);

  /**
   * Порядок у сітці.
   *
   * Рахується один раз, із того підрахунку, що приїхав із сервера, і далі не
   * міняється. Живе пересортування було б чеснішим, але воно висмикує герби
   * з-під пальця: натиснув на команду — і вона поїхала на інше місце, разом
   * із усім рядом. Порядок оновиться при наступному заході, коли ніхто нічого
   * не натискає.
   */
  const order = React.useMemo(() => {
    const seed = new Map(teams.map((t, i) => [t, i]));
    return [...teams].sort(
      (a, b) =>
        (initialTally[b] ?? 0) - (initialTally[a] ?? 0) ||
        (seed.get(a) ?? 0) - (seed.get(b) ?? 0),
    );
  }, [teams, initialTally]);

  async function cast(team: string) {
    if (locked || busy || vote === team) return;
    const prev = vote;

    /* Оптимістично: клік по гербу має відповідати миттєво, бо весь сенс
       голосування — побачити, як зрушився рядок. Якщо сервер відмовить,
       повертаємо як було. */
    setBusy(team);
    setNote(null);
    setVote(team);
    setTally((t) => {
      const next = { ...t };
      if (prev) next[prev] = Math.max(0, (next[prev] ?? 0) - 1);
      next[team] = (next[team] ?? 0) + 1;
      return next;
    });

    try {
      const r = await fetch("/api/major/champion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setNote(j.error ?? "Голос не зберігся.");
        setVote(prev);
        setTally(initialTally);
      }
    } catch {
      setNote("Мережа не відповіла. Спробуй ще раз.");
      setVote(prev);
      setTally(initialTally);
    } finally {
      setBusy(null);
    }
  }

  return (
    <section>
      <h2 className="mb-3 flex flex-wrap items-baseline gap-x-2 px-1 text-base font-extrabold text-ink">
        Хто візьме мейджор
        {total > 0 && (
          <span className="text-[0.75rem] font-bold text-ink-dim">
            {total} {plural(total, "голос", "голоси", "голосів")}
          </span>
        )}
      </h2>

      <div className="major-plate overflow-hidden rounded-2xl p-3 sm:p-4">
        {locked && (
          <p className="mb-3 text-center text-[0.8125rem] text-ink-dim">
            Плей-оф почався — голосування закрите.
          </p>
        )}
        {total === 0 && !locked && (
          <p className="mb-3 text-center text-[0.8125rem] text-ink-subtle">
            Голосів ще немає. Обери команду — твій буде першим.
          </p>
        )}

        {/* Одна сітка на все: і результат, і бюлетень.
            Відсоток стоїть над своїм гербом, тож команду й число не треба
            зводити очима — вони вже разом. Герб із твоїм голосом залитий
            кольором події, як обрана команда в картці.

            Вісім колонок навіть на телефоні, і без тегів під гербами.
            Тридцять дві команди по чотири в ряд із підписами — це вісімсот
            пікселів на одне питання, тобто два з половиною екрани. Герб
            упізнають і без підпису, а відсоток мусять бачити всі й одразу,
            не гортаючи. Назва лишається в підказці й в озвученні. */}
        <div
          className={cn(
            "grid gap-1 sm:gap-1.5",
            "[grid-template-columns:repeat(8,minmax(0,1fr))]",
            "lg:[grid-template-columns:repeat(16,minmax(0,1fr))]",
          )}
        >
          {order.map((slug) => {
            const team = findTeam(slug);
            const mine = vote === slug;
            const n = tally[slug] ?? 0;
            const pct = total > 0 ? Math.round((n / total) * 100) : 0;
            const rank = rankOf[slug];

            return (
              <button
                key={slug}
                type="button"
                onClick={() => cast(slug)}
                disabled={!!busy || locked}
                aria-pressed={mine}
                aria-label={`${team?.name ?? slug}${total > 0 ? `, ${pct}%` : ""}`}
                title={team?.name ?? slug}
                className={cn(
                  "flex min-w-0 flex-col items-center rounded-md p-0.5 transition-colors duration-150",
                  mine || locked ? "cursor-default" : "hover:bg-white/[0.05]",
                  busy === slug && "opacity-60",
                )}
              >
                {/* Рядок під відсоток з'являється тільки тоді, коли є що
                    показувати. Поки голосів немає, його немає в жодної
                    команди — і сітка не починається з порожньої смуги. */}
                {total > 0 && (
                  <span
                    className="tnum text-[0.625rem] font-black leading-[0.875rem] sm:text-[0.6875rem]"
                    style={{ color: n > 0 ? tone(rank) : "var(--ink-faint)" }}
                  >
                    {n > 0 ? `${pct}%` : "·"}
                  </span>
                )}

                <MajorCrest team={team} slug={slug} fluid state={mine ? "active" : "idle"} />
              </button>
            );
          })}
        </div>

        {note && (
          <p className="mt-2 text-center text-[0.8125rem] font-semibold text-[var(--danger)]">
            {note}
          </p>
        )}
      </div>
    </section>
  );
}

/** Українське число: 1 голос, 2 голоси, 5 голосів. */
function plural(n: number, one: string, few: string, many: string) {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b > 1 && b < 5) return few;
  if (b === 1) return one;
  return many;
}
