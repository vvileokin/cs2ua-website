import Image from "next/image";
import { BETKING_URL } from "@/components/ui/BetkingMark";
import { MajorCrest } from "./MajorCrest";
import { findTeam } from "@/lib/data";
import { Link } from "@/i18n/navigation";
import type { OpeningLive, StageMatch } from "@/lib/db/pickem";
import { cn } from "@/lib/utils";

/**
 * Перший тур стадії.
 *
 * Перша версія була стрічкою, що їде вбік. Вісім однакових чипів в один ряд
 * не влізали ніколи, і внизу з'являлася горизонтальна смуга прокрутки — тобто
 * половина розкладу ховалася за краєм екрана, і щоб дізнатися, хто з ким
 * грає, треба було спершу здогадатися потягнути. Розклад, який треба шукати,
 * не виконує своєї роботи.
 *
 * Тут він розкладений стовпчиками за часом початку, і це не просто спосіб
 * умістити вісім пар без прокрутки. Матчі справді йдуть парами: о кожній
 * годині стартують два. Колонка на годину показує цю структуру сама собою —
 * видно, що тур іде чотирма хвилями, а не вісьмома окремими подіями, і
 * скільки їх лишилось до останньої.
 *
 * Час один на колонку, а не повторений у кожному рядку. Два однакові «08:00»
 * поруч — це не інформація, а шум, у якому тоне те єдине, чим рядки справді
 * різняться: хто грає.
 */
export function OpeningStrip({
  matches,
  live = {},
}: {
  matches: StageMatch[];
  /** Заведені матчі, ключем — пара слагів за абеткою. Порожньо, доки їх не
   *  імпортували: тоді рядок лишається просто розкладом. */
  live?: Record<string, OpeningLive>;
}) {
  if (!matches.length) return null;

  /** Чи є хоч один коефіцієнт — від цього залежить ширина колонок. */
  const odds = matches.some((m) => m.oa && m.ob);

  /* Групування по моменту старту, у хронологічному порядку. Ключем іде сам
     ISO, а не відформатована година: дві різні доби з однаковим «08:00»
     склеїлися б в одну колонку. */
  /* Два джерела часу, і в кожного своя робота.
     `m.at` — розклад стадії, тобто хвиля: о котрій годині ця пара мала йти.
     `startAt` у матчі — коли вона пішла насправді, і воно повзе за турніром.

     Спершу тут безумовно вигравав матч, бо в розкладі години були зміщені на
     дві. Це виправлено в даних, зате вилізло протилежне: сьому годину
     затримали на п'ять і десять хвилин, час у двох матчів став різним — і
     колонка на пару розсипалася на дві колонки по одному матчу.

     Тому поріг. Хвилини запізнення — це та сама хвиля, і вона лишається
     однією колонкою з часом за розкладом. Три чверті години — це вже інша
     хвиля, і тоді перемагає матч: саме так виглядала б і повторна помилка на
     дві години. */
  const DRIFT = 45 * 60_000;
  const at = (m: StageMatch) => {
    const real = live[[m.a, m.b].sort().join("|")]?.startAt;
    if (!real) return m.at;
    const off = Math.abs(new Date(real).getTime() - new Date(m.at).getTime());
    return off >= DRIFT ? real : m.at;
  };

  const slots = new Map<string, StageMatch[]>();
  for (const m of [...matches].sort((x, y) => at(x).localeCompare(at(y)))) {
    const key = at(m);
    const list = slots.get(key) ?? [];
    list.push(m);
    slots.set(key, list);
  }

  return (
    <section className="major-plate rounded-[4px] px-3 py-3 sm:px-4">
      {/* Підпису «Перший тур» тут немає. Чотири години поспіль із парами під
          кожною — це розклад і ні що інше; слово над ним називало те, що й
          так видно, і забирало рядок у того, що треба прочитати. */}
      {/* На широкому — дві колонки замість чотирьох, коли є коефіцієнти.
          Пігулка з двома числами й логотипом займає приблизно стільки ж, як
          обидва теги разом, і в колонку на чверть ширини вона не вміщається
          разом із ними. Без коефіцієнтів ряд лишається вузьким, як був. */}
      <div
        className={cn(
          "grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-4",
          odds && "lg:grid-cols-2 lg:gap-x-8",
        )}
      >
        {[...slots.entries()].map(([slot, list]) => {
          const hits = list.map((m) => live[[m.a, m.b].sort().join("|")]);
          const now = hits.some((h) => h?.live);
          /* «Позаду» — тільки коли заведені всі матчі години й усі дограні.
             Напівзаповнена година не пригашується: сірий час над парою, що
             ще не почалась, читався б як скасовану. */
          const done = hits.every((h) => h?.status === "finished");
          return (
          <div key={slot}>
            {/* Три стани години, і вони читаються згори вниз як хід туру:
                попереду — червоним, іде — білим із живою крапкою і словом,
                позаду — пригашено.

                Слово «LIVE» тут не окраса. Перша спроба красила годину в
                `--live` і вважала справу зробленою, але на цій сторінці все
                червоне: `--live` і `--major-hot` різняться на сотi — вживу
                колонка, що йде, не відрізнялася від тієї, що буде за годину.
                Відрізняє білий час і слово поруч; пульс крапки це
                підтверджує, але сам по собі в статиці нічого не каже. */}
            <p
              className={cn(
                "mb-1.5 flex items-center gap-1.5 text-[0.6875rem] font-extrabold tabular-nums",
                now ? "text-white" : done ? "text-ink-faint" : "text-[var(--major-hot)]",
              )}
            >
              <span
                className={cn(
                  "size-1 rounded-full",
                  now
                    ? "live-dot bg-live"
                    : done
                      ? "bg-ink-faint"
                      : "bg-[var(--major-hot)]",
                )}
              />
              <time dateTime={slot}>
                {new Date(slot).toLocaleTimeString("uk-UA", {
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: "Europe/Kyiv",
                })}
              </time>
              {now && (
                <span className="text-[0.5625rem] font-black tracking-wide text-live">
                  LIVE
                </span>
              )}
            </p>

            <div className="space-y-1">
              {list.map((m, i) => {
                const a = findTeam(m.a);
                const b = findTeam(m.b);
                const hit = live[[m.a, m.b].sort().join("|")];
                /* Рахунок пишеться в порядку пари, а не матчу: у таблиці
                   матчів команди могли завести навпаки, і тоді 2:0 стало б
                   0:2 просто через порядок стовпців.

                   Порівнюються слаги, а не абетка. Перша версія брала
                   «перевернуто» з того, чи `team_a > team_b` — тобто
                   припускала, що в розкладі команди стоять за абеткою. Вони
                   там не за абеткою, і чотири рахунки з восьми малювалися
                   задом наперед. */
                const flipped = !!hit && hit.teamA !== m.a;
                const sa = hit ? (flipped ? hit.scoreB : hit.scoreA) : 0;
                const sb = hit ? (flipped ? hit.scoreA : hit.scoreB) : 0;
                /* Рахунок показуємо, щойно матч пішов, а не лише коли
                   дограний: нуль-нуль у живому матчі — теж відповідь на
                   питання «що там зараз». */
                const played = !!hit && (hit.live || hit.status === "finished");

                const row = (
                  <>
                    <MajorCrest team={a} slug={m.a} size={20} />
                    <span className="min-w-0 flex-1 truncate text-[0.6875rem] font-bold text-ink-muted">
                      {a?.tag ?? m.a}
                    </span>
                    {/* Тире, а не «vs»: воно коротше за будь-яке слово і не
                        конкурує з тегами за увагу в рядку завширшки з палець. */}
                    {/* Коефіцієнти — тільки на ПК і тільки там, де вони є.
                        Біла пігулка посеред рядка: це чуже число на нашій
                        сторінці, і воно має виглядати як вставка, а не як
                        наша цифра. Логотип між двома числами каже, чиї вони,
                        без жодного підпису. */}
                    {m.oa && m.ob && !played ? (
                      /* Пігулка веде до букмекера, як і всі інші його місця на
                         сайті: ті самі `target`, `rel="sponsored"` і те саме
                         посилання з реферальним кодом. Коефіцієнт, який нікуди
                         не веде, — це просто число; клікабельний — це вже
                         інтеграція, а саме нею він і є. */
                      <a
                        href={BETKING_URL}
                        target="_blank"
                        rel="noopener noreferrer sponsored"
                        aria-label={`BetKing: ${a?.name ?? m.a} ${m.oa.toFixed(2)}, ${b?.name ?? m.b} ${m.ob.toFixed(2)}`}
                        /* `relative` тут не про розташування. Рядок накритий
                           посиланням на матч (див. нижче), а воно позиційоване
                           — і без власного позиціювання пігулка опинилася б
                           під ним і перестала б натискатися. */
                        className="relative hidden shrink-0 items-center gap-2.5 rounded-[3px] bg-white px-2 py-0.5 transition-[filter] hover:brightness-95 lg:inline-flex"
                      >
                        <span className="tnum text-[0.6875rem] font-black text-[#E11322]">
                          {m.oa.toFixed(2)}
                        </span>
                        <Image
                          src="/brand/partner-betking.svg"
                          alt="BETKING"
                          width={44}
                          height={10}
                          className="h-2.5 w-auto"
                        />
                        <span className="tnum text-[0.6875rem] font-black text-[#E11322]">
                          {m.ob.toFixed(2)}
                        </span>
                      </a>
                    ) : null}
                    {played ? (
                      /* Зіграний матч показує рахунок замість тире: коефіцієнти
                         після початку вже нічого не варті, а рахунок — єдине,
                         по що на цей рядок дивляться. */
                      <span
                        className={cn(
                          "tnum shrink-0 text-[0.6875rem] font-black",
                          hit?.live ? "text-live" : "text-ink",
                        )}
                      >
                        {sa}:{sb}
                      </span>
                    ) : (
                      <span
                        aria-hidden
                        className={cn(
                          "text-[0.625rem] text-ink-faint",
                          m.oa && m.ob && "lg:hidden",
                        )}
                      >
                        —
                      </span>
                    )}
                    <span className="min-w-0 flex-1 truncate text-right text-[0.6875rem] font-bold text-ink-muted">
                      {b?.tag ?? m.b}
                    </span>
                    <MajorCrest team={b} slug={m.b} size={20} />
                  </>
                );

                /* Матч є — рядок стає посиланням на його сторінку, де є і
                   склад, і ставки. Немає — лишається тим, чим був. */
                /* Матч, що йде, обведений червоним. Самого червоного
                   рахунку мало: він стоїть посеред рядка, завширшки в три
                   символи, і в колонці з чотирьох пар його треба шукати.
                   Рамка обводить увесь рядок, і шукати не треба. */
                const cls = cn(
                  "relative flex items-center gap-1.5 rounded-[3px] bg-black/25 px-1.5 py-1",
                  hit && "transition-colors hover:bg-black/40",
                  hit?.live &&
                    "bg-[color-mix(in_oklch,var(--live)_12%,oklch(0_0_0_/_0.25))] ring-1 ring-inset ring-[color-mix(in_oklch,var(--live)_42%,transparent)]",
                );
                const title = `${a?.name ?? m.a} — ${b?.name ?? m.b}`;

                /* Посилання на матч накриває рядок, а не обгортає його.
                   Обгортало — і тоді пігулка букмекера, яка теж посилання,
                   опинялася всередині нього. Вкладене `<a>` недійсне: браузер
                   розриває розмітку на свій лад, React бачить інше дерево, ніж
                   надіслав сервер, і вся сторінка перемальовується наново на
                   кожному завантаженні. Накриття лишає обидва посилання
                   сусідами й кожне веде туди, куди має. */
                return (
                  <div key={`${m.a}-${m.b}-${i}`} title={title} className={cls}>
                    {hit && (
                      <Link
                        href={`/matches/${hit.id}`}
                        aria-label={title}
                        className="absolute inset-0 rounded-[3px]"
                      />
                    )}
                    {row}
                  </div>
                );
              })}
            </div>
          </div>
          );
        })}
      </div>
    </section>
  );
}
