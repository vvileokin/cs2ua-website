import Image from "next/image";
import { PRIZES, PRIZE_TOP } from "@/lib/major-pickem";
import { cn } from "@/lib/utils";

/**
 * Що саме можна виграти.
 *
 * Очки самі по собі нікому не потрібні — вони тільки спосіб вишикувати людей
 * у рядок. Усе, що з цього рядка справді дістається гравцеві, — це десять
 * перших місць кожної стадії й десять перших підсумку, і без цієї таблиці
 * сторінка просить скласти картку, не кажучи навіщо.
 *
 * Правило нічиєї тут не описане — воно живе в міграції 0096 і проступає на
 * дошці межею десятки. Якщо колись знадобиться показати його словами, місце
 * для цього під таблицею.
 */
export function MajorPrizes({ stage }: { stage?: number }) {
  return (
    <section>
      <h2 className="mb-3 px-1 text-base font-extrabold text-ink">Призи</h2>

      <div className="major-plate major-divide overflow-hidden rounded-2xl">
        {PRIZES.map((p) => {
          const here = p.key === stage;
          return (
            <div
              key={String(p.key)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 sm:px-4",
                here && "bg-[color-mix(in_oklch,var(--major-hot)_10%,transparent)]",
              )}
            >
              {/* На широкому стадія — своя колонка, і п'ять підписів стоять
                  рівним стовпчиком. На телефоні колонка забирала шістдесят
                  пікселів із трьохсот, і назві скіна лишалося сто — «Desert
                  Eagle | Trigger Disc…». Там той самий підпис переїжджає
                  рядком вище над назвою: місця він уже не з'їдає, а порядок
                  читання не міняється. */}
              <span
                className={cn(
                  "hidden w-24 shrink-0 text-[0.6875rem] font-extrabold uppercase tracking-wide sm:block",
                  here ? "text-[var(--major-hot)]" : "text-ink-dim",
                )}
              >
                {p.label}
              </span>

              {/* Сам скін.
                  Назва «Desert Eagle | Trigger Discipline» нічого не каже
                  тому, хто його не бачив, — а побачивши, він упізнає його в
                  інвентарі з першого погляду. Коробка однакова для всіх
                  п'яти, бо стволи різної довжини: AWP вдвічі довша за Glock,
                  і якби кожен рядок підлаштовувався під свою картинку,
                  таблиця поїхала б сходинками. Зображення вписується в
                  коробку, не розтягуючись. */}
              <span className="flex h-8 w-24 shrink-0 items-center justify-center sm:h-11 sm:w-36">
                {/* Коробка однакова, ствол усередині — ні. Ширину задає
                    `scale`, тобто довжина справжньої зброї, тож AWP займає
                    рядок увесь, а Glock — трохи більше за третину. Центр у
                    всіх один, і картинки стоять на спільній осі, а не
                    кожна на своїй. */}
                <span className="relative h-full" style={{ width: `${p.scale * 100}%` }}>
                  <Image
                    src={p.img}
                    alt={p.skin}
                    fill
                    sizes="144px"
                    className="object-contain object-center"
                    /* Вихідні рендери тьмяні на темному тлі — вони
                       малювалися під світлий інвентар. Трохи насиченості й
                       світла повертають їм вигляд картинки, а не плями. */
                    style={{ filter: "saturate(1.35) brightness(1.12)" }}
                  />
                </span>
              </span>

              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    "block truncate text-[0.625rem] font-extrabold uppercase tracking-wide sm:hidden",
                    here ? "text-[var(--major-hot)]" : "text-ink-dim",
                  )}
                >
                  {p.label}
                </span>
                <span className="block truncate text-[0.8125rem] font-bold text-ink">
                  {p.skin}
                </span>
                <span className="hidden truncate text-[0.6875rem] text-ink-dim sm:block">
                  {p.wear} · ${p.unit.toFixed(2)}
                </span>
              </span>

              {/* Скільки людей це отримає — одна цифра, та сама в кожному
                  рядку. Вона тут не заради інформації, а заради того, щоб
                  «топ-10» читалося як правило, а не як обіцянка. */}
              <span className="tnum shrink-0 text-right text-[0.75rem] font-extrabold text-ink-muted">
                ×{PRIZE_TOP}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
