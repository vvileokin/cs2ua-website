import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { MajorMode } from "@/components/major/MajorMode";
import { findTeam } from "@/lib/data";
import {
  getMajorProjection, getTeamDetail, regionTeams, stageOf,
  type MajorTeamDetail, type DetailRow, type LadderRow,
} from "@/lib/db/major";
import { cn } from "@/lib/utils";

/** Слаг → назва в рейтингу HLTV. Та сама пара, що в скрипті заливки. */
const NAME: Record<string, string> = {
  natus: "Natus Vincere", b8: "B8", innercircle: "Inner Circle", g2: "G2",
  fnatic: "fnatic", fut: "FUT", astralis: "Astralis", eternalfire: "Eternal Fire",
};

export async function generateMetadata(
  { params }: { params: Promise<{ team: string }> },
): Promise<Metadata> {
  const { team } = await params;
  const name = NAME[team];
  if (!name) return { title: "Інвайти на мейджор" };
  return {
    title: `${name} — шанси на мейджор`,
    description: `З чого складаються очки VRS ${name}, що дасть кожен результат попереду і хто може обійти.`,
  };
}

/** Як на сторінці інвайтів: ні рівного нуля, ні рівної сотні. */
const pct = (v: number) =>
  v * 100 < 0.05 ? "<0,1%" : v * 100 > 99.95 ? ">99,9%" : (v * 100).toFixed(1).replace(".", ",") + "%";
const pp = (v: number) =>
  (v * 100 < 0.05 ? "<0,1" : (v * 100).toFixed(1).replace(".", ",")) + " п.";
const sign = (v: number) => (v >= 0 ? "+" : "−") + Math.abs(Math.round(v));
const money = (v: number) => "$" + v.toLocaleString("uk-UA").replace(/ /g, " ");

/** HLTV друкує дати як 24/10/26 — у тексті це читається гірше за «24 жовтня». */
const MONTH = ["січня", "лютого", "березня", "квітня", "травня", "червня",
               "липня", "серпня", "вересня", "жовтня", "листопада", "грудня"];
const dateOf = (s: string) => {
  const [d, m] = s.split("/").map(Number);
  return MONTH[m - 1] ? `${d} ${MONTH[m - 1]}` : s;
};

const tone = (p: number) =>
  p >= 0.85 ? "var(--major-hot)"
  : p >= 0.5 ? "var(--major)"
  : p >= 0.2 ? "color-mix(in oklch, var(--major) 62%, var(--ink-faint))"
  : "var(--ink-faint)";

export default async function MajorTeamPage(
  { params }: { params: Promise<{ team: string }> },
) {
  const { team: slug } = await params;
  const name = NAME[slug];
  if (!name) notFound();

  const [stored, projection] = await Promise.all([getTeamDetail(slug), getMajorProjection()]);
  if (!stored) notFound();
  const { detail, asOf, runs } = stored;

  /* Місце й стадія беруться з того самого прогнозу, що й таблиця інвайтів, а
     не з payload — інакше сторінка команди й сторінка інвайтів могли б назвати
     різні місця для однієї команди в один день. */
  const row = projection?.teams.find((t) => t.team === name) ?? null;
  const slots = row && projection ? projection.meta.slots[row.region] : null;
  const place = row && projection
    ? regionTeams(projection, row.region).findIndex((t) => t.team === name) + 1
    : null;
  const stage = place && slots ? stageOf(place, slots) : null;
  const site = findTeam(slug);
  /* Відсоток — із того самого прогнозу, що й таблиця інвайтів. Payload несе
     свій, порахований окремим прогоном, і він відрізняється на десяті частки
     через Монте-Карло. Читач, який щойно бачив у таблиці 41,1%, не має
     зустріти тут 41,6% і гадати, якому числу вірити. */
  const pQual = row ? row.pQual : detail.pQual;

  return (
    <div className="space-y-5 sm:space-y-6">
      <MajorMode />

      <Link
        href="/major"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-subtle transition-colors hover:text-[var(--major-hot)]"
      >
        <span aria-hidden>←</span> Усі інвайти
      </Link>

      {/* Шапка. Та сама будова, що в рядку нашої команди на сторінці інвайтів:
          герб, назва, стадія, велике число. */}
      <section className="major-plate overflow-hidden rounded-2xl px-4 py-5 sm:px-6 sm:py-6">
        <div className="flex items-center gap-3 sm:gap-4">
          {site ? <TeamLogo team={site} size="lg" /> : <span className="size-14 shrink-0 rounded-xl bg-white/10" />}
          <div className="min-w-0 flex-1">
            <p className="truncate text-2xl font-bold text-white">{detail.team}</p>
            <p className="mt-0.5 text-sm text-white/55">
              <span className="tnum font-mono text-white/85">{detail.pts}</span> очок VRS
              {place ? <> · {place}-те місце в Європі</> : null}
              {stage ? <> · заходить у Stage {stage}</> : null}
            </p>
          </div>
          <span className="shrink-0 text-right">
            <span
              className="tnum block font-mono text-3xl font-bold leading-none"
              style={{ color: tone(pQual) }}
            >
              {pct(pQual)}
            </span>
            <span className="mt-1 block text-xs text-white/45">шанс на мейджор</span>
          </span>
        </div>
      </section>

      {/* 1. З чого складаються очки.
          Цього немає більше ніде, бо до 28 жовтня ми й самі не знали будови:
          модель рахувала приріст одним каліброваним кроком. HLTV друкує розклад,
          і він точний — сума компонентів збігається з підсумком до одиниці. */}
      <Components detail={detail} />

      {/* 2. Скільки коштує наступна перемога. Найважливіший блок сторінки:
          «LAN wins» вміщує рівно десять перемог, і в команди зі свіжим списком
          одинадцята не дає нічого. */}
      <LanCap detail={detail} />

      {/* 3. Календар із цінами за місце. */}
      {detail.events.length > 0 && <Events detail={detail} />}

      {/* 4. Ціна матчів у пунктах проходу. */}
      {detail.matches.length > 0 && <Matches detail={detail} />}

      {/* 5. Хто може обійти. */}
      {detail.chasers.length > 0 && <Chasers detail={detail} />}

      <p className="text-center text-[0.8125rem] leading-relaxed text-ink-subtle">
        Зріз VRS за {new Date(asOf + "T00:00:00Z").toLocaleDateString("uk-UA", { day: "numeric", month: "long", timeZone: "UTC" })}
        {runs ? <> · {runs.toLocaleString("uk-UA")} прогонів</> : null} · розклад очок із{" "}
        <a
          href="https://www.hltv.org/valve-ranking/teams"
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold text-ink underline decoration-[color-mix(in_oklch,var(--ink)_30%,transparent)] underline-offset-4 transition-colors hover:text-[var(--major-hot)]"
        >
          HLTV
        </a>
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ блоки */

/**
 * П'ять компонентів VRS однією смугою.
 *
 * Смуга, а не п'ять карточок із числами: читача цікавить не стільки «310 за
 * призові», скільки те, що призові — чверть усіх очок, а особисті зустрічі —
 * майже нічого. Пропорція видна тільки поряд.
 *
 * База 400 у смугу не входить. Вона однакова в усіх і нічого не розрізняє —
 * у смузі вона була б найдовшим сегментом, який не означає нічого.
 */
function Components({ detail }: { detail: MajorTeamDetail }) {
  const c = detail.components;
  const seg = [
    { key: "lan", label: "Перемоги на ЛАНі", v: c.lan, color: "var(--major-hot)",
      note: "Десять найсвіжіших перемог на ЛАНі, кожна по 48 очок, помножених на давнину." },
    { key: "offered", label: "Призові", v: c.offered, color: "color-mix(in oklch, var(--major) 92%, black)",
      note: "Десять найбільших призових за рік. Сума стиснута степенем 0,23 — удвічі більше грошей додає лише 17%." },
    { key: "collected", label: "Скальпи", v: c.collected, color: "color-mix(in oklch, var(--major) 72%, black)",
      note: "Десять найдорожчих перемог. Ціна залежить від призових суперника й ваги турніру." },
    { key: "network", label: "Мережа суперників", v: c.network, color: "color-mix(in oklch, var(--major) 52%, black)",
      note: "Наскільки різноманітні ті, кого ви били. Десять найкращих." },
    { key: "h2h", label: "Особисті зустрічі", v: c.h2h, color: "color-mix(in oklch, var(--major) 34%, black)",
      note: "Єдиний компонент, де очки забирають одне в одного. Перераховується щодня з нуля." },
  ];
  const total = seg.reduce((a, s) => a + Math.max(0, s.v), 0);

  return (
    <section className="major-card overflow-hidden rounded-2xl">
      <Head title="З чого складаються очки" hint={`400 база + ${total} за гру`} />

      <div className="px-4 pb-4 sm:px-5 sm:pb-5">
        <div className="flex h-3 overflow-hidden rounded-full bg-black/35 shadow-[0_1px_0_0_rgb(255_255_255/0.06)_inset]">
          {seg.map((s) => (
            <span
              key={s.key}
              title={`${s.label} — ${s.v}`}
              style={{ width: `${(Math.max(0, s.v) / total) * 100}%`, background: s.color }}
            />
          ))}
        </div>

        <dl className="mt-4 space-y-2.5">
          {seg.map((s) => (
            <div key={s.key} className="flex items-baseline gap-3">
              <span className="mt-1.5 size-2 shrink-0 rounded-full" style={{ background: s.color }} />
              <dt className="min-w-0 flex-1">
                <span className="text-sm font-semibold text-white">{s.label}</span>
                <span className="mt-0.5 block text-xs leading-relaxed text-white/45">{s.note}</span>
              </dt>
              <dd className="tnum shrink-0 font-mono text-base font-bold text-white">{s.v}</dd>
            </div>
          ))}
          <div className="flex items-baseline gap-3 border-t border-[color-mix(in_oklch,var(--major)_20%,transparent)] pt-2.5">
            <span className="mt-1.5 size-2 shrink-0 rounded-full bg-white/15" />
            <dt className="min-w-0 flex-1 text-sm font-semibold text-white/55">База, однакова в усіх</dt>
            <dd className="tnum shrink-0 font-mono text-base font-bold text-white/55">400</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}

/**
 * Межа в десять перемог — і що вона значить саме для цієї команди.
 *
 * Смужка з десяти комірок, відсортованих від найслабшої: саме найслабша піде
 * геть, коли приїде одинадцята. Тому підсвічена перша, а не остання.
 */
function LanCap({ detail }: { detail: MajorTeamDetail }) {
  const rows = detail.rows.lan.slice().sort((a, b) => a.pts - b.pts);
  const weakest = rows[0];
  const gain = detail.lanGain;
  const verdict = gain >= 30
    ? "Список застарілий — кожна нова перемога на ЛАНі дорога."
    : gain >= 10
      ? "Є куди рости, але дешевших рядків уже небагато."
      : "Список забитий свіжими перемогами. Чергова нічого не додасть.";

  return (
    <section className="major-card overflow-hidden rounded-2xl">
      <Head title="Скільки дасть наступна перемога" hint="межа — десять рядків" />

      <div className="px-4 pb-4 sm:px-5 sm:pb-5">
        <div className="flex items-end gap-4">
          <span
            className="tnum font-mono text-4xl font-bold leading-none"
            style={{ color: gain >= 30 ? "var(--major-hot)" : gain >= 10 ? "var(--major)" : "var(--ink-faint)" }}
          >
            +{gain}
          </span>
          <p className="min-w-0 flex-1 text-sm leading-relaxed text-white/60">
            {verdict}{" "}
            {!detail.lanFull ? (
              <>У списку {rows.length} із 10, тож нова перемога додає всі 48.</>
            ) : gain <= 5 ? (
              /* Коли список забитий свіжими, «вона важить уже стільки-то»
                 звучить як докір згаслому рядку, а згаслого там немає: він
                 такий самий новий. Тому інше речення, а не те саме з іншим
                 числом. */
              <>
                Найслабший рядок — перемога за{" "}
                <span className="whitespace-nowrap text-white/85">{dateOf(weakest.date)}</span>, і вона теж важить{" "}
                <span className="tnum font-mono text-white/85">{weakest.pts}</span>. Нова просто стане на її місце.
              </>
            ) : (
              <>
                У списку лишилась перемога за{" "}
                <span className="whitespace-nowrap text-white/85">{dateOf(weakest.date)}</span> — вона важить уже{" "}
                <span className="tnum font-mono text-white/85">{weakest.pts}</span>. Наступна викине її й додасть{" "}
                <span className="tnum font-mono text-white/85">48</span> замість неї.
              </>
            )}
          </p>
        </div>

        {/* Десять комірок. Висота кожної — її вага, тому згаслі видно відразу. */}
        <div className="mt-4 flex items-end gap-1">
          {Array.from({ length: 10 }).map((_, i) => {
            const r = rows[i];
            return (
              <div key={i} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                <span
                  className={cn(
                    "w-full rounded-sm",
                    i === 0 && detail.lanFull
                      ? "ring-1 ring-[var(--major-hot)]"
                      : undefined,
                  )}
                  title={r ? `${r.date} — ${r.pts} очок, давнина ${r.recency}%` : "вільне місце"}
                  style={{
                    height: `${r ? 8 + (r.pts / 48) * 40 : 8}px`,
                    background: r
                      ? `color-mix(in oklch, var(--major) ${30 + (r.pts / 48) * 60}%, black)`
                      : "rgb(255 255 255 / 0.06)",
                  }}
                />
                <span className="tnum font-mono text-[0.625rem] leading-none text-white/40">
                  {r ? r.pts : "—"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/**
 * Турніри попереду і ціна кожного місця, по компонентах.
 *
 * Не «виграєш — буде добре», а скільки саме очок і звідки вони приходять. Для
 * команди на межі це єдине, що насправді відповідає на питання «що нам
 * потрібно зробити».
 */
function Events({ detail }: { detail: MajorTeamDetail }) {
  return (
    <section className="major-card overflow-hidden rounded-2xl">
      <Head title="Що дасть кожен результат" hint="до відсічення 2 листопада" />

      <div className="major-divide">
        {detail.events.map((e) => (
          <div key={e.name} className="px-4 py-4 sm:px-5 sm:py-5">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <p className="text-base font-bold text-white">{e.name}</p>
              <p className="text-xs text-white/45">{e.when} · {money(e.prize)}</p>
            </div>

            <div className="-mx-4 mt-3 overflow-x-auto sm:mx-0">
              <table className="w-full min-w-[34rem] text-sm">
                <thead>
                  <tr className="text-left text-xs text-white/40">
                    <th className="px-4 pb-2 font-semibold sm:px-0">Місце</th>
                    <th className="px-2 pb-2 text-right font-semibold">Призові</th>
                    <th className="px-2 pb-2 text-right font-semibold">ЛАН</th>
                    <th className="px-2 pb-2 text-right font-semibold">Гроші</th>
                    <th className="px-2 pb-2 text-right font-semibold">Скальпи</th>
                    <th className="px-2 pb-2 text-right font-semibold">Мережа</th>
                    <th className="px-2 pb-2 text-right font-semibold">Усього</th>
                    <th className="px-4 pb-2 text-right font-semibold sm:px-0">Стане</th>
                  </tr>
                </thead>
                <tbody className="align-baseline">
                  {e.rows.map((r) => <LadderLine key={r.place} r={r} />)}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function LadderLine({ r }: { r: LadderRow }) {
  return (
    <tr className="border-t border-[color-mix(in_oklch,var(--major)_14%,transparent)]">
      <td className="px-4 py-2 font-semibold text-white sm:px-0">{r.place}</td>
      <td className="tnum px-2 py-2 text-right font-mono text-white/55">
        {r.money ? money(r.money) : "—"}
      </td>
      <td className="tnum px-2 py-2 text-right font-mono text-white/70">{sign(r.lan)}</td>
      <td className="tnum px-2 py-2 text-right font-mono text-white/70">{sign(r.offered)}</td>
      <td className="tnum px-2 py-2 text-right font-mono text-white/70">{sign(r.collected)}</td>
      <td className="tnum px-2 py-2 text-right font-mono text-white/70">{sign(r.network)}</td>
      <td className="tnum px-2 py-2 text-right font-mono font-bold text-[var(--major-hot)]">
        {sign(r.total)}
      </td>
      <td className="tnum px-4 py-2 text-right font-mono font-bold text-white sm:px-0">{r.after}</td>
    </tr>
  );
}

/**
 * Ціна матчу в пунктах проходу.
 *
 * Рахується прямо: той самий прогін двічі, з прибитим результатом у кожну
 * сторону. Різниця між гілками — це і є те, що матч вирішує. Тут видно й чужі
 * матчі, які впливають на нас не менше за свої: два матчі 1win у Москві важать
 * для НАВІ більше, ніж половина їхніх власних.
 */
function Matches({ detail }: { detail: MajorTeamDetail }) {
  return (
    <section className="major-card overflow-hidden rounded-2xl">
      <Head title="Скільком вартий кожен матч" hint="різниця між перемогою і поразкою" />

      <div className="major-divide">
        {detail.matches.map((m) => (
          <div key={m.a + m.b} className="px-4 py-3.5 sm:px-5 sm:py-4">
            <div className="flex items-baseline gap-3">
              <p className="min-w-0 flex-1 text-sm">
                <span className="font-bold text-white">{m.a}</span>
                <span className="text-white/35"> — </span>
                <span className="font-bold text-white">{m.b}</span>
                {!m.own && (
                  <span className="ml-2 rounded-md bg-white/8 px-1.5 py-0.5 align-middle text-[0.625rem] font-semibold uppercase tracking-wide text-white/50">
                    чужий
                  </span>
                )}
                <span className="mt-0.5 block text-xs text-white/40">
                  {m.when} · {m.event}
                  {m.pA != null && (
                    <> · лінія {(100 * m.pA).toFixed(0)}% / {(100 * (1 - m.pA)).toFixed(0)}%</>
                  )}
                </span>
              </p>
              <span className="tnum shrink-0 font-mono text-base font-bold text-[var(--major-hot)]">
                {pp(m.weight)}
              </span>
            </div>

            <div className="mt-2 flex gap-2 text-xs">
              <Branch label={`виграє ${m.a}`} v={m.qualIfA} />
              <Branch label={`виграє ${m.b}`} v={m.qualIfB} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Branch({ label, v }: { label: string; v: number }) {
  return (
    <span className="flex min-w-0 flex-1 items-baseline justify-between gap-2 rounded-lg bg-black/25 px-2.5 py-1.5">
      <span className="truncate text-white/50">{label}</span>
      <span className="tnum shrink-0 font-mono font-bold" style={{ color: tone(v) }}>{pct(v)}</span>
    </span>
  );
}

/**
 * Хто ще може обійти — і чим.
 *
 * Самого відсотка мало: сторінка має сказати, чому дехто безпечний. Команда,
 * якій треба шістдесят очок, але в якої список перемог забитий, не загроза
 * взагалі — і це видно лише з колонки «+за перемогу».
 */
function Chasers({ detail }: { detail: MajorTeamDetail }) {
  return (
    <section className="major-card overflow-hidden rounded-2xl">
      <Head title="Хто може обійти" hint={`${detail.pts} очок треба перестрибнути`} />

      <div className="-mx-0 overflow-x-auto">
        <table className="w-full min-w-[26rem] text-sm">
          <thead>
            <tr className="text-left text-xs text-white/40">
              <th className="px-4 pb-2 font-semibold sm:px-5">Команда</th>
              <th className="px-2 pb-2 text-right font-semibold">Очки</th>
              <th className="px-2 pb-2 text-right font-semibold">Треба</th>
              <th className="px-2 pb-2 text-right font-semibold">+за перемогу</th>
              <th className="px-4 pb-2 text-right font-semibold sm:px-5">Обійде</th>
            </tr>
          </thead>
          <tbody>
            {detail.chasers.map((c) => (
              <tr key={c.team} className="border-t border-[color-mix(in_oklch,var(--major)_14%,transparent)]">
                <td className="px-4 py-2.5 font-semibold text-white sm:px-5">{c.team}</td>
                <td className="tnum px-2 py-2.5 text-right font-mono text-white/70">{c.pts}</td>
                <td className="tnum px-2 py-2.5 text-right font-mono text-white/70">+{c.need}</td>
                <td className="tnum px-2 py-2.5 text-right font-mono">
                  {c.lanGain == null ? (
                    <span className="text-white/30">—</span>
                  ) : (
                    <span
                      className={cn(c.lanGain <= 5 ? "text-white/35" : "text-white/70")}
                      title={c.lanGain <= 5 ? "список перемог забитий — перемоги майже не дають очок" : undefined}
                    >
                      +{c.lanGain}
                    </span>
                  )}
                </td>
                <td className="tnum px-4 py-2.5 text-right font-mono font-bold sm:px-5" style={{ color: tone(c.pAbove) }}>
                  {pct(c.pAbove)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/** Спільна шапка блоку: назва ліворуч, підказка праворуч, тонка межа знизу. */
function Head({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 px-4 pb-3 pt-4 sm:px-5 sm:pt-5">
      <h2 className="text-base font-bold text-white">{title}</h2>
      {hint && <p className="text-xs text-white/40">{hint}</p>}
    </div>
  );
}
