"use client";

import * as React from "react";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { findTeam } from "@/lib/data";
import {
  ROLES,
  ROLE_CAP,
  ROLE_LABEL,
  ROLE_PRICE,
  ROLE_TITLE,
  isComplete,
  roleCounts,
  type PickRole,
  type PickemPicks,
} from "@/lib/major-pickem";
import { cn } from "@/lib/utils";

/**
 * Картка стадії — шістнадцять команд, десять виборів.
 *
 * Чому рядок із трьома кнопками, а не перетягування в кошики. Пікем у клієнті
 * CS зроблений як сітка плиток, у яку кидають команди, і на миші це добре.
 * Тут половина людей приходить із телефона, а drag&drop на тачі — це або
 * власна реалізація жестів, або бібліотека вагою з половину сторінки, і в
 * обох випадках щось обов'язково не доїде. Рядок із сегментованою групою
 * працює всюди однаково, читається з клавіатури і не потребує пояснень.
 *
 * Три ролі — це шкала, а не три різні речі: 3-0 вгорі, 0-3 внизу, прохід між
 * ними. Тому кнопки стоять в одному порядку в кожному рядку і пофарбовані як
 * градація одного кольору події, а не трьома чужими один одному відтінками.
 *
 * Переповнений кошик не мовчить і не підміняє вибір. Спроба поставити третю
 * команду на 3-0 нічого не змінює й підсвічує лічильник: мовчазна відмова
 * виглядає як поламана кнопка, а автозаміна забирає з картки те, що людина
 * туди свідомо поставила.
 */

const ROLE_STYLE: Record<PickRole, { on: string; off: string }> = {
  /* Верх шкали — найгучніше, що є на сторінці: суцільний вогонь події. */
  "3-0": {
    on: "bg-[var(--major-hot)] text-[var(--major-ink)] shadow-[0_0_18px_-6px_var(--major-hot)]",
    off: "text-ink-subtle hover:bg-fill-2 hover:text-ink",
  },
  /* Середина — той самий колір, але як обведення: прохід це більшість картки,
     і шість суцільних плашок у стовпці перетягнули б на себе всю увагу. */
  adv: {
    on: "bg-[color-mix(in_oklch,var(--major)_22%,transparent)] text-[var(--major-hot)] shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--major)_55%,transparent)]",
    off: "text-ink-subtle hover:bg-fill-2 hover:text-ink",
  },
  /* Низ — холодне й важке: не колір події, а її відсутність. */
  "0-3": {
    on: "bg-fill-3 text-ink-muted shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--ink)_18%,transparent)]",
    off: "text-ink-subtle hover:bg-fill-2 hover:text-ink",
  },
};

export function PickemCard({
  stage,
  teams,
  initial,
  locked,
}: {
  stage: number;
  teams: string[];
  initial: PickemPicks;
  /** Стадія почалася — картка лише для читання. */
  locked: boolean;
}) {
  const [picks, setPicks] = React.useState<PickemPicks>(initial);
  const [saving, setSaving] = React.useState(false);
  const [note, setNote] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);
  /* Яку роль підсвітити як переповнену. Скидається таймером, бо це
     реакція на дію, а не стан картки. */
  const [full, setFull] = React.useState<PickRole | null>(null);

  React.useEffect(() => {
    if (!full) return;
    const id = window.setTimeout(() => setFull(null), 1200);
    return () => window.clearTimeout(id);
  }, [full]);

  const counts = roleCounts(picks);
  const complete = isComplete(picks);
  /* Збережене порівнюється з поточним, щоб кнопка не пропонувала зберегти те,
     що вже збережене, і не мовчала, коли є що зберігати. */
  const dirty = JSON.stringify(picks) !== JSON.stringify(initial);

  function toggle(team: string, role: PickRole) {
    if (locked) return;
    setSaved(false);
    setPicks((prev) => {
      const next = { ...prev };
      if (next[team] === role) {
        delete next[team];
        return next;
      }
      // Місце в кошику рахується без цієї команди: перестановка всередині
      // ролі, яку вона вже займає, не має впиратися у власний же вибір.
      const taken = Object.entries(next).filter(([t, r]) => r === role && t !== team).length;
      if (taken >= ROLE_CAP[role]) {
        setFull(role);
        return prev;
      }
      next[team] = role;
      return next;
    });
  }

  async function save() {
    if (!complete || saving) return;
    setSaving(true);
    setNote(null);
    try {
      const r = await fetch("/api/major/pickem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage, picks }),
      });
      const j = await r.json();
      if (!r.ok) {
        setNote(j.error ?? "Не вдалося зберегти.");
      } else {
        setSaved(true);
      }
    } catch {
      setNote("Мережа не відповіла. Спробуй ще раз.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      {/* Лічильники. Стоять зверху і липнуть до верху на довгому списку:
          єдине питання, яке виникає посеред заповнення, — «скільки ще», і
          відповідь не має лишатися за межами екрана. */}
      <div className="sticky top-14 z-20 -mx-3 bg-bg/95 px-3 py-2 backdrop-blur sm:top-16 sm:-mx-1 sm:px-1">
        <div className="grid grid-cols-3 gap-2">
          {ROLES.map((role) => {
            const done = counts[role] === ROLE_CAP[role];
            return (
              <div
                key={role}
                className={cn(
                  "rounded-lg px-3 py-2 transition-colors duration-200",
                  full === role
                    ? "bg-[color-mix(in_oklch,var(--major)_28%,transparent)]"
                    : "bg-surface",
                )}
              >
                <p className="truncate text-[0.6875rem] font-semibold uppercase tracking-wide text-ink-dim">
                  {ROLE_TITLE[role]}
                </p>
                <p className="mt-0.5 flex items-baseline gap-1.5">
                  <span
                    className={cn(
                      "tnum text-base font-extrabold leading-none",
                      done ? "text-[var(--major-hot)]" : "text-ink",
                    )}
                  >
                    {counts[role]}/{ROLE_CAP[role]}
                  </span>
                  <span className="text-[0.6875rem] font-bold text-ink-dim">
                    ×{ROLE_PRICE[role]}
                  </span>
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="major-plate major-divide overflow-hidden rounded-2xl">
        {teams.map((slug) => {
          const team = findTeam(slug);
          const role = picks[slug];
          return (
            <div key={slug} className="flex items-center gap-3 px-3 py-2 sm:px-4">
              {/* Склади стадій приходять з бази, а довідник команд лежить у
                  коді — отже слаг може виявитись таким, якого тут ще немає.
                  Рядок у цьому разі лишається робочим: вибір важливіший за
                  герб, і картка не має ламатися через нову команду. */}
              {team ? (
                <TeamLogo team={team} size="sm" />
              ) : (
                <span className="size-7 shrink-0 rounded-md bg-fill-2" aria-hidden />
              )}
              <span
                className={cn(
                  "min-w-0 flex-1 truncate text-sm font-bold",
                  role ? "text-ink" : "text-ink-muted",
                )}
              >
                {team?.name ?? slug}
              </span>

              <div
                role="group"
                aria-label={team?.name ?? slug}
                className="flex shrink-0 gap-1"
              >
                {ROLES.map((r) => {
                  const on = role === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      disabled={locked}
                      aria-pressed={on}
                      aria-label={`${team?.name ?? slug}: ${ROLE_TITLE[r]}`}
                      onClick={() => toggle(slug, r)}
                      className={cn(
                        "h-8 rounded-md px-2 text-[0.75rem] font-extrabold tabular-nums transition-all duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] sm:h-9 sm:px-2.5 sm:text-[0.8125rem]",
                        // Прохід — найдовше слово з трьох, решта двоє — по три
                        // символи. Без спільної ширини група стрибає з рядка
                        // в рядок разом із тим, що в ній вибрано.
                        r === "adv" ? "min-w-[4.25rem]" : "min-w-[2.75rem]",
                        on ? ROLE_STYLE[r].on : ROLE_STYLE[r].off,
                        locked && "cursor-default",
                      )}
                    >
                      {ROLE_LABEL[r]}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {!locked && (
        <div className="flex flex-wrap items-center justify-end gap-3">
          {note && <p className="flex-1 text-sm font-semibold text-[var(--danger)]">{note}</p>}
          {!note && saved && !dirty && (
            <p className="flex-1 text-sm font-semibold text-[var(--success)]">
              Картку збережено. Поки стадія не почалась, її ще можна міняти.
            </p>
          )}
          {!note && !saved && !complete && (
            <p className="flex-1 text-sm text-ink-subtle">
              Лишилось обрати{" "}
              {ROLES.filter((r) => counts[r] < ROLE_CAP[r])
                .map((r) => `${ROLE_CAP[r] - counts[r]} на ${ROLE_LABEL[r].toLowerCase()}`)
                .join(", ")}
              .
            </p>
          )}
          <button
            type="button"
            onClick={save}
            disabled={!complete || saving || !dirty}
            className={cn(
              "h-11 rounded-full px-6 text-sm font-extrabold transition-colors duration-150",
              complete && dirty && !saving
                ? "bg-accent text-accent-ink hover:bg-accent-hover"
                : "cursor-default bg-fill-2 text-ink-faint",
            )}
          >
            {saving ? "Зберігаю…" : dirty ? "Зберегти картку" : "Збережено"}
          </button>
        </div>
      )}
    </div>
  );
}
