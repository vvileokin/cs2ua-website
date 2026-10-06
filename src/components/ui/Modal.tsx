"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  skin,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Вбирає вікно в кольори івенту: підлога, кант і розділювач шапки. */
  skin?: string | null;
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        data-skin={skin ?? undefined}
        className={cn(
          "relative flex max-h-[92dvh] w-full max-w-md flex-col rounded-t-xl shadow-[0_-8px_40px_-12px_rgba(0,0,0,0.8)]",
          "sm:max-h-[88dvh] sm:rounded-xl",
          "pb-[env(safe-area-inset-bottom)] sm:pb-0",
          /* Вбране вікно бере підлогу івенту замість сірої поверхні, і кант по
             краю — щоб плита читалась як та сама річ, що й банер турніру, а не
             як системне вікно, у яке поклали кольорові кнопки. */
          skin
            ? "bg-[var(--skin-base)] shadow-[0_-8px_40px_-12px_rgba(0,0,0,0.8),inset_0_0_0_1px_rgb(var(--skin-ring)/0.3)]"
            : "surface-1",
        )}
      >
        {/* Висоту шапки диктує не напис, а хрестик: при 36 пікселях він
            розсував смугу до шістдесяти, і над вікном на пів екрана висіла
            порожня планка. Вісім на вісім (32px) лишають ціль більшою за
            сорокачотирипіксельний мінімум разом із власним падінгом смуги і
            знімають дванадцять пікселів висоти.

            Напис несе `leading-none`: при 16px його типовий рядок — 24px, тож
            чотири з них були півінтерліньяжем під гліфами і читались як ще
            один проміжок. */}
        <div
          className={cn(
            "flex shrink-0 items-center justify-between px-5 py-2",
            skin
              ? "shadow-[0_1px_0_0_rgb(var(--skin-ring)/0.22)]"
              : "shadow-[0_1px_0_0_color-mix(in_oklch,var(--ink)_7%,transparent)]",
          )}
        >
          <h2 className="text-base font-bold leading-none text-ink">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Закрити"
            className={cn(
              "-mr-1 grid size-8 place-items-center rounded-lg text-ink-muted transition-colors hover:text-ink",
              skin ? "hover:bg-[rgb(var(--skin-ring)/0.16)]" : "hover:bg-surface-2",
            )}
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4 pt-2">{children}</div>
        {footer && (
          <div className="flex shrink-0 items-center justify-end gap-2 shadow-[0_-1px_0_0_color-mix(in_oklch,var(--ink)_7%,transparent)] px-5 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
