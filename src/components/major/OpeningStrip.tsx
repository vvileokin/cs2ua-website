import { MajorCrest } from "./MajorCrest";
import { findTeam } from "@/lib/data";
import type { StageMatch } from "@/lib/db/pickem";

/**
 * Перший тур стадії.
 *
 * Перша версія була стрічкою, що їде вбік. Вісім однакових чипів в один ряд
 * не влізали ніколи, і внизу з'являлася горизонтальна смуга прокрутки — тобто
 * половина розкладу ховалася за краєм екрана, і щоб дізнатися, хто з ким
 * грає, треба було спершу здогадатися потягнути. Розклад, який треба шукати,
 * не виконує своєї роботи.
 *
 * Тут він розкладений стовпчиками за часом початку, і це не просто спосіб
 * умістити вісім пар без прокрутки. Матчі справді йдуть парами: о кожній
 * годині стартують два. Колонка на годину показує цю структуру сама собою —
 * видно, що тур іде чотирма хвилями, а не вісьмома окремими подіями, і
 * скільки їх лишилось до останньої.
 *
 * Час один на колонку, а не повторений у кожному рядку. Два однакові «08:00»
 * поруч — це не інформація, а шум, у якому тоне те єдине, чим рядки справді
 * різняться: хто грає.
 */
export function OpeningStrip({ matches }: { matches: StageMatch[] }) {
  if (!matches.length) return null;

  /* Групування по моменту старту, у хронологічному порядку. Ключем іде сам
     ISO, а не відформатована година: дві різні доби з однаковим «08:00»
     склеїлися б в одну колонку. */
  const slots = new Map<string, StageMatch[]>();
  for (const m of [...matches].sort((x, y) => x.at.localeCompare(y.at))) {
    const list = slots.get(m.at) ?? [];
    list.push(m);
    slots.set(m.at, list);
  }

  return (
    <section className="major-plate rounded-2xl px-3 py-3 sm:px-4">
      {/* Підпису «Перший тур» тут немає. Чотири години поспіль із парами під
          кожною — це розклад і ні що інше; слово над ним називало те, що й
          так видно, і забирало рядок у того, що треба прочитати. */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-4">
        {[...slots.entries()].map(([at, list]) => (
          <div key={at}>
            <p className="mb-1.5 flex items-center gap-1.5 text-[0.6875rem] font-extrabold tabular-nums text-[var(--major-hot)]">
              <span className="size-1 rounded-full bg-[var(--major-hot)]" />
              <time dateTime={at}>
                {new Date(at).toLocaleTimeString("uk-UA", {
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: "Europe/Kyiv",
                })}
              </time>
            </p>

            <div className="space-y-1">
              {list.map((m, i) => {
                const a = findTeam(m.a);
                const b = findTeam(m.b);
                return (
                  <div
                    key={`${m.a}-${m.b}-${i}`}
                    title={`${a?.name ?? m.a} — ${b?.name ?? m.b}`}
                    className="flex items-center gap-1.5 rounded-lg bg-black/25 px-1.5 py-1"
                  >
                    <MajorCrest team={a} slug={m.a} size={20} />
                    <span className="min-w-0 flex-1 truncate text-[0.6875rem] font-bold text-ink-muted">
                      {a?.tag ?? m.a}
                    </span>
                    {/* Тире, а не «vs»: воно коротше за будь-яке слово і не
                        конкурує з тегами за увагу в рядку завширшки з палець. */}
                    <span aria-hidden className="text-[0.625rem] text-ink-faint">
                      —
                    </span>
                    <span className="min-w-0 flex-1 truncate text-right text-[0.6875rem] font-bold text-ink-muted">
                      {b?.tag ?? m.b}
                    </span>
                    <MajorCrest team={b} slug={m.b} size={20} />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
