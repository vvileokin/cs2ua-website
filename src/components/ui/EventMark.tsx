import { BlastMark } from "@/components/ui/BlastMark";
import { PortoMark } from "@/components/ui/PortoMark";
import { EwcMark } from "@/components/ui/EwcMark";
import { EplMark } from "@/components/ui/EplMark";
import type { EventSkin } from "@/lib/data";
import { cn } from "@/lib/utils";

/**
 * Знак івенту для текстового рядка.
 *
 * Чотири локапи намальовані в різних пропорціях: BLAST квадратний, EWC — довга
 * низька стрічка, Porto і EPL вертикальні. Тому висоту задає сам знак, а не
 * місце виклику: один спільний клас розміру робив EWC смужкою завтовшки з
 * волосину, а EPL — стовпчиком, вищим за рядок, у якому він стоїть.
 *
 * Колір береться з currentColor, тож рядок фарбує знак разом із текстом.
 */
export function EventMark({
  skin,
  size = "row",
  className,
}: {
  skin?: EventSkin | null;
  /** «row» — поруч із назвою турніру, «caps» — у рядку дрібною капітеллю. */
  size?: "row" | "caps";
  className?: string;
}) {
  const caps = size === "caps";
  /* Розмір стоїть і в класах, і інлайном.

     Ширина окремо від висоти, бо Safari на iPhone не виводить її з viewBox:
     при `height: 16px` і `width: auto` він бере власну, і вертикальний локап
     582×779 розповзається на півбанера, аж поки його не підріже заокруглений
     кут картки. А інлайн — тому, що блокувальники реклами ріжуть окремі чанки
     з /_next/static: сторінка лишається оформленою з інших чанків, але саме
     цього класу вже немає, і знак знову стає на весь екран. Інлайновий стиль
     не залежить від того, чи доїхав CSS. */
  const box = (w: number, h: number) => ({ width: w, height: h });

  if (skin === "porto")
    return (
      <PortoMark
        className={cn(caps ? "h-2.5 w-3.5" : "h-3.5 w-5", "shrink-0", className)}
        style={caps ? box(14, 10) : box(20, 14)}
      />
    );
  if (skin === "ewc")
    return (
      <EwcMark
        className={cn(caps ? "h-[0.4375rem] w-[2.1875rem]" : "h-2 w-10", "shrink-0", className)}
        style={caps ? box(35, 7) : box(40, 8)}
      />
    );
  if (skin === "epl")
    return (
      <EplMark
        className={cn(caps ? "h-3 w-[0.5625rem]" : "h-4 w-3", "shrink-0", className)}
        style={caps ? box(9, 12) : box(12, 16)}
      />
    );
  if (skin === "blast")
    return (
      <BlastMark
        className={cn(caps ? "size-[0.6875rem]" : "size-3.5", "shrink-0", className)}
        style={caps ? box(11, 11) : box(14, 14)}
      />
    );
  return null;
}
