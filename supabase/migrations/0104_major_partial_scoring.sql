-- CS2 UA — часткове нарахування: платити за те, що вже вирішено.
-- Run in Supabase → SQL Editor. Requires 0094, 0096, 0101.
--
-- Швейцарка дізнається свої підсумки не разом. Після третього туру остаточно
-- відомі дві ролі з трьох: 3-0 і 0-3 більше не зміняться ні в кого — трьох
-- перемог поспіль після поразки не буває, як і трьох поразок після перемоги.
-- А хто саме пройде, стане ясно аж наприкінці п'ятого.
--
-- Тримати за це очки ще два дні немає за що: людина вгадала, це вже сталося,
-- і вона це бачить у таблиці. Тому за 3-0 і 0-3 платимо одразу, за прохід —
-- коли стадія дограна.
--
-- Звідси й уся ця міграція. `score_major_stage` рахувала картку цілком і
-- додавала весь результат у профіль. Викликана після часткової виплати, вона
-- нарахувала б за 3-0 і 0-3 удруге — тим, хто вгадав обидва кошики, зайвих
-- шістсот очок.
--
-- Полагоджено найменшим можливим способом: без нової колонки й без нової
-- функції. Скільки вже заплачено, записано там, де йому й місце, — у
-- `major_pickem.points`. Повний підрахунок лишився тим самим, у профіль іде
-- різниця. Виходить, що функція не «платить», а «доводить до суми», і це
-- правильніше за будь-який прапорець: прапорець можна забути скинути, а
-- різниця рахується з того, що справді сталося.
--
-- Побічно вона стала безпечною до повтору. Другий виклик поспіль додасть
-- нуль, а не другу картку очок.
--
-- Решта без змін: ті самі ціни, той самий бонус за чисту картку, той самий
-- `updated_at`, якого не можна чіпати, бо він третій ключ тайбрейка (0096).

begin;

create or replace function public.score_major_stage(p_stage smallint)
returns table (user_id uuid, points integer, hits smallint)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_stage  record;
  v_rec    record;
  v_points integer;
  v_add    integer;
  v_hits   smallint;
  v_picks  integer;
begin
  select * into v_stage from public.major_stages s where s.stage = p_stage;
  if not found then
    raise exception 'Стадії % немає', p_stage;
  end if;

  if v_stage.actual is null
     or (select count(*) from jsonb_object_keys(v_stage.actual))
        <> public.major_roster(v_stage.kind) then
    raise exception 'major_stages.actual для стадії % не заповнений на % команд',
                    p_stage, public.major_roster(v_stage.kind);
  end if;

  select sum(s.cap) into v_picks from public.major_card_shape(v_stage.kind) s;

  for v_rec in
    select * from public.major_pickem c
     where c.stage = p_stage and c.scored_at is null
  loop
    select
      coalesce(sum(case when public.major_pick_hit(p.value, a.value)
                        then public.major_pick_price(p.value) else 0 end), 0),
      coalesce(sum(case when public.major_pick_hit(p.value, a.value)
                        then 1 else 0 end), 0)
      into v_points, v_hits
      from jsonb_each_text(v_rec.picks) p
      join jsonb_each_text(v_stage.actual) a on a.key = p.key;

    if v_hits = v_picks then
      v_points := v_points + public.major_perfect_bonus(v_stage.kind);
    end if;

    -- Доплата, а не виплата. `v_rec.points` — те, що вже лягло в профіль
    -- раніше (часткове нарахування за 3-0 і 0-3). Якщо не лягало нічого, це
    -- нуль, і поведінка рівно та сама, що була.
    v_add := v_points - coalesce(v_rec.points, 0);

    update public.major_pickem c
       set points = v_points, hits = v_hits, scored_at = now(), updated_at = c.updated_at
     where c.user_id = v_rec.user_id and c.stage = p_stage;

    if v_add <> 0 then
      update public.profiles
         set points = points + v_add
       where id = v_rec.user_id;
    end if;

    insert into public.notifications (user_id, kind, title)
    values (
      v_rec.user_id,
      'major',
      v_stage.title || ' · ' || v_hits || ' із ' || v_picks ||
      case when v_add > 0 then ', +' || v_add || ' очок'
           when v_add = 0 then ', за прохід нічого не додалось'
           else ', ' || v_add || ' очок'
      end
    );

    user_id := v_rec.user_id;
    points  := v_points;
    hits    := v_hits;
    return next;
  end loop;

  update public.major_stages s
     set scored_at = now(), updated_at = now()
   where s.stage = p_stage;
end;
$$;

revoke all on function public.score_major_stage(smallint) from public, anon, authenticated;
-- Службовому клієнту право треба повертати явно: `revoke from public` забирає
-- його і в service_role.
grant execute on function public.score_major_stage(smallint) to service_role;

-- ---------------------------------------------------------------------------
-- Дошки бачать часткові очки
-- ---------------------------------------------------------------------------
-- Друга половина тієї ж задачі. Очки за 3-0 і 0-3 уже в профілях, а обидві
-- таблиці лишалися порожні: вони беруть картки з `scored_at is not null`, а
-- часткове нарахування його свідомо не ставить — картка ще не дорахована, і
-- фінальне нарахування мусить її побачити.
--
-- Тож умова тепер інша: картка потрапляє в таблицю, щойно в її стадії
-- з'явився бодай один підсумок. Доки не зіграно нічого, не видно нічого — і
-- це не просто обережність: до першого результату всі картки по нулях, і
-- «таблиця» з них була б випадковим порядком ста вісімдесяти рядків.
--
-- Важливо, що входять усі картки стадії, а не лише ті, кому вже щось
-- нарахували. Нуль очок — це не «поза таблицею», це останнє місце, і людина
-- має бачити себе там, а не гадати, чому її немає. Тайбрейк не змінився, тож
-- і місця рахуються так само, як рахуватимуться наприкінці.

drop view if exists public.major_stage_board;
create view public.major_stage_board
with (security_invoker = on) as
  select
    c.stage,
    c.user_id,
    pr.handle,
    pr.avatar_url,
    c.points,
    c.hits,
    c.updated_at                                     as saved_at,
    row_number() over (
      partition by c.stage
      order by c.points desc, c.hits desc, c.updated_at asc, c.user_id asc
    )::integer                                       as rank
  from public.major_pickem c
  join public.profiles pr on pr.id = c.user_id
  join public.major_stages s on s.stage = c.stage
 where c.scored_at is not null
    or (s.actual is not null and s.actual <> '{}'::jsonb);

grant select on public.major_stage_board to anon, authenticated;

drop view if exists public.major_pickem_board;
create view public.major_pickem_board
with (security_invoker = on) as
  with totals as (
    select
      c.user_id,
      sum(c.points)::integer as points,
      sum(c.hits)::integer   as hits,
      count(*)::integer      as stages,
      max(c.scored_at)       as last_scored_at,
      max(c.updated_at)      as last_saved_at
    from public.major_pickem c
    join public.major_stages s on s.stage = c.stage
   where c.scored_at is not null
      or (s.actual is not null and s.actual <> '{}'::jsonb)
   group by c.user_id
  )
  select
    t.user_id,
    pr.handle,
    pr.avatar_url,
    t.points,
    t.hits,
    t.stages,
    t.last_scored_at,
    row_number() over (
      order by t.points desc, t.hits desc, t.last_saved_at asc, t.user_id asc
    )::integer as rank
  from totals t
  join public.profiles pr on pr.id = t.user_id;

grant select on public.major_pickem_board to anon, authenticated;

commit;

-- Перевірка:
--   select count(*) from public.major_pickem_board;   -- 182, а не 0
--   select rank, handle, points, hits from public.major_stage_board
--    where stage = 1 order by rank limit 10;
--
-- Перевірка доплати (після того, як стадія дограна й підсумок внесено на 16):
--   select points, hits from public.major_pickem where stage = 1 limit 5;
--   select * from public.score_major_stage(1);
--   -- у профіль має лягти різниця: якщо за 3-0 і 0-3 уже платили 300,
--   -- а картка коштує 450, додасться 150.
