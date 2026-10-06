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
 * Чому залишок стелі показано окремим рядком. Межа тут не одна, а дві —
 * скільки золота на руках і скільки з тисячі ще не куплено, — і людина, яка
 * бачить одне число «доступно», не розуміє, чому воно менше за її баланс. Тому
 * під полем стоїть другий рядок, і тільки поки стеля справді тисне.
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
  const [limit, setLimit] = React.useState<number | null>(null);
  const [rate, setRate] = React.useState(3);
  const [cap, setCap] = React.useState(1000);
  const [capLeft, setCapLeft] = React.useState<number | null>(null);
  const [gold, setGold] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState<number | null>(null);

  const gem = eventGem(skin ?? runningEvent()?.skin);

  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setDone(null);
    setError(null);
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
  const problem =
    amount === 0
      ? null
      : amount > max
        ? `Доступно ${formatInt(max)}`
        : amount % rate !== 0
          ? `Сума має ділитись на ${rate}`
          : null;
  const valid = amount >= rate && amount <= max && amount % rate === 0;

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
    <Modal open={open} onClose={onClose} title="Обмін на поінти івенту">
      <div className="space-y-3">
        <p className="text-sm leading-relaxed text-ink-muted">
          {rate} CS2UA Points — 1 поінт івенту. За весь турнір можна купити{" "}
          <span className="font-semibold text-ink">{formatInt(cap)}</span>.
        </p>

        <div className="flex items-center justify-between rounded-xl surface-2 px-3 py-2.5">
          <span className="text-xs text-ink-subtle">Доступно до обміну</span>
          <span className="tnum flex items-center gap-1 font-mono text-sm font-extrabold text-accent">
            <BrandIcon name="points" className="size-4" />
            {limit === null ? "…" : formatInt(max)}
          </span>
        </div>

        {done !== null ? (
          <p className="tnum flex items-center justify-center gap-1 rounded-xl bg-success/10 px-3 py-3 text-sm font-bold text-success">
            Отримано +{formatInt(done)}
            <BrandIcon name={gem} className="size-4" />
          </p>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <input
                autoFocus
                type="text"
                inputMode="numeric"
                value={gold}
                placeholder="CS2UA Points"
                aria-label="Скільки CS2UA Points обміняти"
                onChange={(e) => setGold(e.target.value.replace(/\D/g, "").slice(0, 7))}
                className="tnum h-11 min-w-0 flex-1 rounded-xl border border-border bg-surface-2 px-3 font-mono text-sm font-bold text-ink outline-none placeholder:font-sans placeholder:font-medium placeholder:text-ink-subtle focus:border-accent focus-visible:outline-none! focus-visible:rounded-xl!"
              />
              <button
                onClick={() => setGold(String(max))}
                disabled={max < rate}
                className="h-11 shrink-0 rounded-xl border border-border px-3 text-xs font-semibold text-ink-muted transition-colors hover:bg-surface-2 disabled:opacity-40"
              >
                Усе
              </button>
            </div>

            {amount > 0 && (
              <p className="tnum flex h-11 items-center justify-center gap-1 rounded-xl surface-2 font-mono text-sm font-bold text-accent">
                <BrandIcon name="points" className="size-4" />
                {formatInt(amount)}
                <span className="mx-1.5 font-normal text-ink-subtle">÷ {rate}</span>
                <ArrowRight className="mr-1.5 size-3.5 shrink-0 text-ink-faint" strokeWidth={3} />
                <BrandIcon name={gem} className="size-4" />
                {formatInt(gain)}
              </p>
            )}

            {capLeft !== null && capLeft < cap && (
              <p className="text-center text-xs text-ink-subtle">
                Залишилось купити {formatInt(capLeft)} за цей івент
              </p>
            )}

            {(problem || error) && (
              <p role="alert" className="text-center text-xs font-semibold text-danger">
                {error ?? problem}
              </p>
            )}

            <button
              onClick={convert}
              disabled={!valid || busy}
              className={cn(
                "flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold transition-colors",
                "bg-accent text-accent-ink hover:bg-accent-hover",
                "disabled:cursor-not-allowed disabled:bg-surface-3 disabled:text-ink-faint",
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
