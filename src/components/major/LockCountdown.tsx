"use client";

import * as React from "react";

/**
 * Скільки лишилось до замка.
 *
 * Перший кадр — це абсолютна дата з сервера, і тільки після монтування вона
 * міняється на «через стільки-то». Інакше сервер і клієнт порахували б «через
 * скільки» в різні моменти часу й React посварився б на розбіжність — а
 * головне, користь від зворотного відліку починається тоді, коли він іде, а
 * не коли він намальований один раз у HTML.
 *
 * Хвилини, не секунди. Секундомір на дводенному інтервалі — це рух заради
 * руху: він смикає око щосекунди й не додає жодного рішення, яке людина могла
 * б на ньому побудувати. Остання година — інша річ, там секунди вже мають
 * вагу, і тільки там вони з'являються.
 */
function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return {
    d: Math.floor(s / 86400),
    h: Math.floor((s % 86400) / 3600),
    m: Math.floor((s % 3600) / 60),
    s: s % 60,
  };
}

export function LockCountdown({ at, className }: { at: string; className?: string }) {
  const target = React.useMemo(() => new Date(at).getTime(), [at]);
  const [left, setLeft] = React.useState<number | null>(null);

  React.useEffect(() => {
    const tick = () => setLeft(target - Date.now());
    tick();
    /* Поки більше за годину — раз на хвилину вистачає з головою. */
    const id = window.setInterval(tick, target - Date.now() > 3_600_000 ? 30_000 : 1000);
    return () => window.clearInterval(id);
  }, [target]);

  /* Прийменник належить компоненту, а не сторінці. Сторінка не знає, що саме
     тут буде надруковано: до монтування це абсолютна дата («о 08:00»), після —
     інтервал («через 1 д 17 год»), і «через» перед датою в першому кадрі дає
     «Закриється через 24 листопада о 08:00». */
  if (left === null) {
    return (
      <span className={className} suppressHydrationWarning>
        {new Date(at).toLocaleString("uk-UA", {
          day: "numeric",
          month: "long",
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Europe/Kyiv",
        })}
      </span>
    );
  }

  if (left <= 0) return <span className={className}>Закрито</span>;

  const { d, h, m, s } = parts(left);
  const text =
    d > 0 ? `${d} д ${h} год` : h > 0 ? `${h} год ${m} хв` : m > 0 ? `${m} хв ${s} с` : `${s} с`;

  return (
    <span className={className} suppressHydrationWarning>
      через {text}
    </span>
  );
}
