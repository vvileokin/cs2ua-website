import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Ukrainian-locale integer formatting with a thin-space grouping. */
export function formatInt(n: number): string {
  return new Intl.NumberFormat("uk-UA").format(n);
}

/** Compact follower/prize formatting: 12 500 -> 12,5K. */
export function formatCompact(n: number): string {
  return new Intl.NumberFormat("uk-UA", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}

/**
 * Українське число: 1 картка, 2 картки, 5 карток.
 *
 * Жила в `PickemBoard`, доки той був серверним. Щойно дошці знадобився стан
 * для «· · ·», файл став клієнтським — і сторінка, яка з нього ж брала
 * `plural`, впала: серверний код не може викликати функцію з клієнтського
 * модуля. Чиста функція без розмітки не має жити в компоненті взагалі, тож
 * місце їй тут.
 */
export function plural(n: number, one: string, few: string, many: string) {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b > 1 && b < 5) return few;
  if (b === 1) return one;
  return many;
}
