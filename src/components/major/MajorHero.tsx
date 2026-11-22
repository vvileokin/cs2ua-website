import { CrownGlyph } from "@/components/layout/NavGlyphs";

/**
 * Шапка мейджора — намальована, а не фотографія.
 *
 * Перша версія брала `/brand/hero-major.webp`, і це була помилка, видна з
 * першого ж кадру: той файл — не ключовий арт події, а готовий банер із уже
 * вписаним у нього написом «ІНВАЙТИ НА PGL MAJOR SINGAPORE». Заголовок
 * сторінки лягав поверх чужого заголовка, і шапка читалася як дві афіші, що
 * налізли одна на одну. Арт із текстом усередині не можна підписувати — його
 * можна тільки показувати цілим.
 *
 * Тому тут композиція з того, що є в системі: кольори події, корона з
 * навігації і шрифт. Жодного нового файлу — і жодного тексту, якого ми не
 * писали.
 *
 * Світло одне й лежить унизу зліва. Це та сама мова, якою вже світиться
 * клітинка мейджора в бічній рейці (`.major-cell`): низький жар із-за
 * предмета, а не підсвітка згори. Дві речі на сайті, що належать одній події,
 * мають світитися однаково.
 *
 * Корона — водяний знак, а не іконка: вона більша за смугу, зрізана правим
 * краєм і стоїть майже в кольорі підкладки. Вона тут, щоб смуга не була
 * порожньою, а не щоб її читали.
 */
export function MajorHero({
  title,
  kicker,
  children,
}: {
  title: string;
  kicker: string;
  children?: React.ReactNode;
}) {
  return (
    <section
      className="relative isolate overflow-hidden rounded-2xl px-4 py-6 sm:px-7 sm:py-8"
      style={{
        backgroundColor: "var(--major-floor)",
        backgroundImage:
          "radial-gradient(42rem 26rem at 6% 128%, color-mix(in oklch, var(--major) 42%, transparent), transparent 64%)," +
          "radial-gradient(28rem 20rem at 92% -24%, color-mix(in oklch, var(--major-hot) 16%, transparent), transparent 62%)",
      }}
    >
      {/* Діагональна штриховка — те, з чого зроблені афіші подій: дуже тиха,
          і тільки щоб площина не читалася як порожня заливка. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.055]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(115deg, #fff 0 1px, transparent 1px 11px)",
        }}
      />

      <CrownGlyph
        aria-hidden
        className="pointer-events-none absolute -right-6 -top-6 h-40 w-auto text-[var(--major)] opacity-[0.1] sm:-right-4 sm:h-56"
      />

      <div className="relative">
        <p className="flex items-center gap-2 text-[0.6875rem] font-extrabold uppercase tracking-[0.16em] text-[var(--major-hot)]">
          <span className="size-1.5 rounded-full bg-[var(--major-hot)] shadow-[0_0_10px_var(--major-hot)]" />
          {kicker}
        </p>

        <h1 className="mt-2 text-balance text-[2.25rem] font-black uppercase leading-[0.95] tracking-[-0.03em] text-white sm:text-6xl">
          {title}
        </h1>

        {/* Коротка риска під назвою — єдина суцільна пляма кольору події в
            шапці. Повна лінія через усю смугу поділила б її навпіл; ця
            закінчується там, де закінчується слово. */}
        <span
          aria-hidden
          className="mt-3 block h-[3px] w-16 rounded-full bg-[var(--major-hot)] shadow-[0_0_14px_-2px_var(--major-hot)]"
        />

        {children && <div className="mt-4">{children}</div>}
      </div>
    </section>
  );
}
