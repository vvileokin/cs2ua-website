"use client";

import * as React from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { BrandIcon } from "@/components/ui/BrandIcon";
import { refreshProfile } from "@/lib/supabase/use-profile";
import { eventGem, runningEvent, type EventSkin } from "@/lib/data";
import { cn, formatInt } from "@/lib/utils";

/**
 * Обмін сезонних поінтів на поінти івенту.
 *
 * Відкривається з двох місць, і обидва — там, де людина впирається в баланс:
 * з капсули гаманця у верхньому барі й з кнопки ставки, коли на неї не
 * вистачає. Другий вхід і є головний: обмінник потрібен не тоді, коли про нього
 * згадали, а тоді, коли ставка не проходить.
 *
 * Чому він виглядає саме так. Обмін — це дві валюти й стрілка між ними, тож
 * вікно побудоване навколо цієї пари, а не навколо поля вводу: два стовпці —
 * скільки віддаєш і скільки отримаєш, — із яких редагується лише лівий. Курс
 * стоїть рядком під ними, бо він одного разу прочитується і більше не потрібен;
 * окремим банером угорі він з'їдав третину вікна, щоб повідомити «3 → 1».
 *
 * Саме вікно вбране в кольори турніру — підлога, кант, шапка, — тож пара
 * стовпців не потребує власної рамки, щоб бути івентовою.
 *
 * Стеля показана смугою, а не числом у дужках. Межа тут не одна, а дві —
 * скільки золота на руках і скільки з тисячі ще не куплено, — і людина, яка
 * бачить одне «доступно», не розуміє, чому воно менше за її баланс. Смуга
 * відповідає на це одним поглядом.
 */
export function EventConvertModal({
  open,
  onClose,
  skin,
}: {
  open: boolean;
  onClose: () => void;
  skin?: EventSkin | null;
}) {
  const dress = skin ?? runningEvent()?.skin ?? null;
  const gem = eventGem(dress);

  const [limit, setLimit] = React.useState<number | null>(null);
  const [rate, setRate] = React.useState(3);
  const [cap, setCap] = React.useState(1000);
  const [capLeft, setCapLeft] = React.useState<number | null>(null);
  const [gold, setGold] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setDone(null);
    setError(null);
    setGold("");
    fetch("/api/event-convert", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled || !d.ok) return;
        setRate(d.rate ?? 3);
        setCap(d.cap ?? 1000);
        setCapLeft(d.ready === false ? 0 : (d.capLeft ?? 0));
        setLimit(d.ready === false ? 0 : (d.limit ?? 0));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [open]);

  const amount = Number(gold || 0);
  const gain = Math.floor(amount / rate);
  const max = limit ?? 0;
  const bought = capLeft === null ? 0 : cap - capLeft;

  const problem =
    amount === 0
      ? null
      : amount > max
        ? `Доступно ${formatInt(max)}`
        : amount % rate !== 0
          ? `Сума має ділитись на ${rate}`
          : null;
  const valid = amount >= rate && amount <= max && amount % rate === 0;

  /* Пресети кратні курсу і обрізані по тому, що людина реально може віддати:
     кнопка, яка пропонує суму, більшу за дозволену, — це відмова, намальована
     як пропозиція. */
  const chips = [rate * 50, rate * 100, rate * 200].filter((c) => c <= max);

  async function convert() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/event-convert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gold: amount }),
    });
    const out = await res.json().catch(() => ({}));
    setBusy(false);
    if (!out.ok) {
      setError(
        {
          over_cap: `Залишилось ${formatInt(out.capLeft ?? 0)} за івент`,
          poor: "Не вистачає CS2UA Points",
          bad_amount: `Сума має ділитись на ${rate}`,
        }[out.error as string] ?? "Не вдалося обміняти",
      );
      return;
    }
    setDone(out.gained ?? gain);
    setGold("");
    setCapLeft(out.capLeft ?? Math.max((capLeft ?? 0) - gain, 0));
    setLimit(Math.floor(Math.min(out.points ?? 0, (out.capLeft ?? 0) * rate) / rate) * rate);
    refreshProfile();
  }

  return (
    <Modal open={open} onClose={onClose} title="Обмін на поінти івенту" skin={dress}>
      <div className="space-y-3">
        {done !== null ? (
          <p className="tnum flex items-center justify-center gap-1.5 rounded-xl bg-[rgb(var(--skin-glow)/0.16)] px-3 py-3.5 text-sm font-bold text-[rgb(var(--skin-coin))] shadow-[inset_0_0_0_1px_rgb(var(--skin-ring)/0.35)]">
            Отримано +{formatInt(done)}
            <BrandIcon name={gem} className="size-4" />
          </p>
        ) : (
          <>
            {/* Дві колонки замість поля і рядка під ним: ліва редагується,
                права показує, що з цього вийде. Обмін — це пара, і виглядати
                він має парою. */}
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <label className="min-w-0">
                <span className="mb-1 block text-[0.6875rem] font-semibold text-ink-subtle">Віддаєш</span>
                <span className="flex h-12 items-center gap-1.5 rounded-xl bg-black/30 px-2.5 shadow-[inset_0_0_0_1px_rgb(var(--skin-ring)/0.22)] focus-within:shadow-[inset_0_0_0_1px_rgb(var(--skin-ring)/0.75)]">
                  <BrandIcon name="points" className="size-4 shrink-0" />
                  <input
                    autoFocus
                    type="text"
                    inputMode="numeric"
                    value={gold}
                    placeholder="0"
                    aria-label="Скільки CS2UA Points обміняти"
                    onChange={(e) => setGold(e.target.value.replace(/\D/g, "").slice(0, 7))}
                    className="tnum w-full min-w-0 bg-transparent font-mono text-base font-extrabold text-ink outline-none placeholder:text-ink-faint focus-visible:outline-none!"
                  />
                </span>
              </label>

              <ArrowRight className="mt-5 size-3.5 shrink-0 text-ink-faint" strokeWidth={3} />

              <div className="min-w-0">
                <span className="mb-1 block text-[0.6875rem] font-semibold text-ink-subtle">Отримаєш</span>
                {/* Не поле: обидва боки редагувати нема сенсу, а те, що виглядає
                    як поле і не приймає ввід, читається як зламане. */}
                <output className="tnum flex h-12 items-center gap-1.5 rounded-xl bg-[rgb(var(--skin-glow)/0.14)] px-2.5 font-mono text-base font-extrabold text-[rgb(var(--skin-coin))] shadow-[inset_0_0_0_1px_rgb(var(--skin-ring)/0.3)]">
                  <BrandIcon name={gem} className="size-4 shrink-0" />
                  {formatInt(gain)}
                </output>
              </div>
            </div>

            {/* Курс одним рядком між парою і пресетами: він пояснює стрілку
                вище, а не відкриває вікно. */}
            <p className="tnum flex items-center justify-center gap-1.5 font-mono text-xs font-semibold text-[rgb(var(--skin-ring)/0.85)]">
              <BrandIcon name="points" className="size-3.5" />
              {rate}
              <span className="text-ink-faint">=</span>
              <BrandIcon name={gem} className="size-3.5" />1
            </p>

            <div className="flex gap-1.5">
              {chips.map((c) => (
                <button
                  key={c}
                  onClick={() => setGold(String(c))}
                  className={cn(
                    "tnum h-9 flex-1 rounded-lg font-mono text-xs font-bold transition-colors",
                    amount === c
                      ? "bg-[rgb(var(--skin-ring))] text-black"
                      : "bg-black/30 text-ink-muted hover:bg-black/45",
                  )}
                >
                  {formatInt(c)}
                </button>
              ))}
              <button
                onClick={() => setGold(String(max))}
                disabled={max < rate}
                className={cn(
                  "h-9 flex-1 rounded-lg text-xs font-bold transition-colors disabled:opacity-35",
                  amount === max && max >= rate
                    ? "bg-[rgb(var(--skin-ring))] text-black"
                    : "bg-black/30 text-ink-muted hover:bg-black/45",
                )}
              >
                Усе
              </button>
            </div>

            {/* Скільки з тисячі вже витрачено. Смуга лишається на місці й коли
                не куплено нічого: порожня шкала теж відповідь, а поява блоку
                після першого обміну зсувала б кнопку під пальцем. */}
            {/* Проміжки тут не рівні навмисне. Смуга — це картинка того самого
                числа, що стоїть рядком вище, тож вона тулиться до нього; а
                «доступно» — вже інша думка, і йому потрібне своє повітря. Рівні
                шість пікселів ставили смугу посередині між двома рядками, і
                вона читалась як окремий третій елемент. */}
            <div className="rounded-xl bg-black/30 px-3 py-2.5 shadow-[inset_0_0_0_1px_rgb(var(--skin-ring)/0.14)]">
              <div className="flex items-baseline justify-between text-[0.6875rem]">
                <span className="text-ink-subtle">Куплено за івент</span>
                <span className="tnum font-mono font-bold text-ink">
                  {capLeft === null ? "…" : formatInt(bought)}
                  <span className="text-ink-faint"> / {formatInt(cap)}</span>
                </span>
              </div>
              <div className="mt-1 h-1 overflow-hidden rounded-full bg-[rgb(var(--skin-ring)/0.14)]">
                <div
                  className="h-full rounded-full bg-[rgb(var(--skin-ring))] transition-[width] duration-300"
                  style={{ width: `${Math.min(100, (100 * (bought + gain)) / cap)}%` }}
                />
              </div>
              <p className="tnum mt-2 text-[0.6875rem] text-ink-subtle">
                Доступно до обміну {limit === null ? "…" : formatInt(max)} CS2UA Points
              </p>
            </div>

            {(problem || error) && (
              <p role="alert" className="text-center text-xs font-semibold text-danger">
                {error ?? problem}
              </p>
            )}

            <button
              onClick={convert}
              disabled={!valid || busy}
              className={cn(
                "flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold transition-[filter,background-color]",
                "bg-[rgb(var(--skin-ring))] text-black hover:brightness-110",
                "disabled:cursor-not-allowed disabled:bg-black/35 disabled:text-white/30 disabled:hover:brightness-100",
              )}
            >
              {busy && <Loader2 className="size-4 animate-spin" />}
              Обміняти
            </button>
          </>
        )}
      </div>
    </Modal>
  );
}
