"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Згортана панель сітки.
 *
 * Обидві сітки EPL разом — це майже два екрани, через які доводиться
 * прокручувати повз усе інше на сторінці. Згортання повертає читачеві вибір:
 * швейцарка цікава, поки вона йде, плейоф — коли почався, і рідко обидві
 * одночасно.
 *
 * Заголовок — кнопка на всю ширину, а не хрестик у кутку: смуга і є та річ,
 * яку згортають, тож тицяти можна в будь-яке її місце. Та сама панель, що
 * стояла на Porto, тільки вбрана в поточний івент через `skin-aura-card`.
 *
 * Вміст розмонтовується, а не ховається класом: усередині сітки з власним
 * горизонтальним прокручуванням, і згорнута панель, яка все ще займає місце в
 * потоці, лишала б по собі смугу прокрутки без вмісту.
 */
export function BracketPanel({
  label,
  defaultOpen = true,
  children,
}: {
  label: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div className="skin-aura-card overflow-hidden rounded-xl">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="text-sm font-extrabold tracking-tight text-white">{label}</span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-white/45 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}
