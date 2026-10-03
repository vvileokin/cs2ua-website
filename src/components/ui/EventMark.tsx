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
  if (skin === "porto")
    return <PortoMark className={cn(caps ? "h-2.5" : "h-3.5", "w-auto shrink-0", className)} />;
  if (skin === "ewc")
    return <EwcMark className={cn(caps ? "h-[0.4375rem]" : "h-2", "w-auto shrink-0", className)} />;
  if (skin === "epl")
    return <EplMark className={cn(caps ? "h-3" : "h-4", "w-auto shrink-0", className)} />;
  if (skin === "blast")
    return <BlastMark className={cn(caps ? "size-[0.6875rem]" : "size-3.5", "shrink-0", className)} />;
  return null;
}
