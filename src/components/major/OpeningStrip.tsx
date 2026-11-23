import Image from "next/image";
import { BETKING_URL } from "@/components/ui/BetkingMark";
import { MajorCrest } from "./MajorCrest";
import { findTeam } from "@/lib/data";
import type { StageMatch } from "@/lib/db/pickem";
import { cn } from "@/lib/utils";

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

  /** Чи є хоч один коефіцієнт — від цього залежить ширина колонок. */
  const odds = matches.some((m) => m.oa && m.ob);

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
    <section className="major-plate rounded-[4px] px-3 py-3 sm:px-4">
      {/* Підпису «Перший тур» тут немає. Чотири години поспіль із парами під
          кожною — це розклад і ні що інше; слово над ним називало те, що й
          так видно, і забирало рядок у того, що треба прочитати. */}
      {/* На широкому — дві колонки замість чотирьох, коли є коефіцієнти.
          Пігулка з двома числами й логотипом займає приблизно стільки ж, як
          обидва теги разом, і в колонку на чверть ширини вона не вміщається
          разом із ними. Без коефіцієнтів ряд лишається вузьким, як був. */}
      <div
        className={cn(
          "grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-4",
          odds && "lg:grid-cols-2 lg:gap-x-8",
        )}
      >
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
                    className="flex items-center gap-1.5 rounded-[3px] bg-black/25 px-1.5 py-1"
                  >
                    <MajorCrest team={a} slug={m.a} size={20} />
                    <span className="min-w-0 flex-1 truncate text-[0.6875rem] font-bold text-ink-muted">
                      {a?.tag ?? m.a}
                    </span>
                    {/* Тире, а не «vs»: воно коротше за будь-яке слово і не
                        конкурує з тегами за увагу в рядку завширшки з палець. */}
                    {/* Коефіцієнти — тільки на ПК і тільки там, де вони є.
                        Біла пігулка посеред рядка: це чуже число на нашій
                        сторінці, і воно має виглядати як вставка, а не як
                        наша цифра. Логотип між двома числами каже, чиї вони,
                        без жодного підпису. */}
                    {m.oa && m.ob ? (
                      /* Пігулка веде до букмекера, як і всі інші його місця на
                         сайті: ті самі `target`, `rel="sponsored"` і те саме
                         посилання з реферальним кодом. Коефіцієнт, який нікуди
                         не веде, — це просто число; клікабельний — це вже
                         інтеграція, а саме нею він і є. */
                      <a
                        href={BETKING_URL}
                        target="_blank"
                        rel="noopener noreferrer sponsored"
                        aria-label={`BetKing: ${a?.name ?? m.a} ${m.oa.toFixed(2)}, ${b?.name ?? m.b} ${m.ob.toFixed(2)}`}
                        className="hidden shrink-0 items-center gap-2.5 rounded-[3px] bg-white px-2 py-0.5 transition-[filter] hover:brightness-95 lg:inline-flex"
                      >
                        <span className="tnum text-[0.6875rem] font-black text-[#E11322]">
                          {m.oa.toFixed(2)}
                        </span>
                        <Image
                          src="/brand/partner-betking.svg"
                          alt="BETKING"
                          width={44}
                          height={10}
                          className="h-2.5 w-auto"
                        />
                        <span className="tnum text-[0.6875rem] font-black text-[#E11322]">
                          {m.ob.toFixed(2)}
                        </span>
                      </a>
                    ) : null}
                    <span
                      aria-hidden
                      className={cn(
                        "text-[0.625rem] text-ink-faint",
                        m.oa && m.ob && "lg:hidden",
                      )}
                    >
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
