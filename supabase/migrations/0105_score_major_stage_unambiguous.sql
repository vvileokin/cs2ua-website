-- CS2 UA — нарахування за стадію більше не спотикається об власні імена.
-- Run in Supabase → SQL Editor. Requires 0094, 0096, 0101, 0104.
--
-- `score_major_stage` падала з `column reference "points" is ambiguous` —
-- тобто не нараховувала взагалі нічого. Помилка жила з 0094 і просто не мала
-- нагоди проявитися: функцію викликають один раз на стадію, а перша стадія
-- дограла тільки зараз.
--
-- Причина в тому, що функція повертає `table (user_id, points, hits)`. Для
-- PL/pgSQL це три змінні, видимі в усьому тілі. І коли далі в коді
-- трапляється звичайне `set points = points + v_points`, права частина — це
-- вже не колонка і не змінна, а обидва одразу, і Postgres відмовляється
-- вгадувати.
--
-- Лікується не перейменуванням вихідних параметрів: їхні імена — це імена
-- колонок у відповіді, їх читає адмінка. Лікується тим, що кожне звертання до
-- колонки в тілі отримує псевдонім таблиці. `pr.event_points`, `c.points` —
-- тут уже нема про що питати.
--
-- Заразом це повна копія функції з 0104 (доплата різниці, івентовий гаманець,
-- сповіщення), тож міграція самодостатня: вона приводить функцію до
-- правильного вигляду незалежно від того, яка версія лежить зараз.

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
    select c.user_id as uid, c.picks as picks, c.points as paid
      from public.major_pickem c
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

    -- Доплата, а не виплата: `paid` — те, що вже лягло в профіль раніше
    -- (часткове нарахування за кошики, які визначилися достроково).
    v_add := v_points - coalesce(v_rec.paid, 0);

    update public.major_pickem c
       set points     = v_points,
           hits       = v_hits,
           scored_at  = now(),
           updated_at = c.updated_at
     where c.user_id = v_rec.uid and c.stage = p_stage;

    if v_add <> 0 then
      -- Гаманець івентовий: ним же тут приймаються ставки.
      update public.profiles pr
         set event_points = pr.event_points + v_add
       where pr.id = v_rec.uid;
    end if;

    insert into public.notifications (user_id, kind, title)
    values (
      v_rec.uid,
      'major',
      v_stage.title || ' · ' || v_hits || ' із ' || v_picks ||
      case when v_add > 0 then ', +' || v_add || ' очок'
           when v_add = 0 then ', за прохід нічого не додалось'
           else ', ' || v_add || ' очок'
      end
    );

    user_id := v_rec.uid;
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

commit;

-- Перевірка:
--   select * from public.score_major_stage(1);
--   -- має повернути рядок на кожну незараховану картку, а не помилку
