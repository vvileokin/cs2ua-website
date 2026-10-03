-- CS2 UA — картка швейцарки EPL S24: розкласти шістнадцять по шести кошиках.
-- Run in Supabase → SQL Editor. Requires 0060, 0079, 0082.
--
-- Швейцарка на шістнадцять із виходом по трьох перемогах має незмінну форму:
-- двоє закінчують 3-0, троє 3-1, троє 3-2, троє 2-3, троє 1-3, двоє 0-3.
-- Через це картка — не список фаворитів, а розкладка всього поля, і вгадати
-- крайні кошики набагато важче за середні: туди треба назвати не найсильнішого,
-- а того, хто пройде без поразки, і не найслабшого, а того, хто посиплеться.
--
-- Ціни дзеркалять `src/lib/epl-swiss.ts`:
--     точний кошик 3-0 або 0-3   150
--     точний кошик у середині      60
--     сторона вгадана, кошик ні    20
--     уся картка точно            +500
--
-- Одна картка на гравця. Закривається першим матчем турніру — так само, як
-- група Porto закривалася своїм першим матчем, і з тієї ж причини: статус у
-- таблиці ставить людина, а час старту не забуває ніхто.

create table if not exists public.epl_swiss (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  -- { "spirit": "3-0", "tyloo": "0-3", ... } — рівно шістнадцять пар.
  picks      jsonb not null,
  points     integer not null default 0,
  scored_at  timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint epl_swiss_sixteen check (jsonb_typeof(picks) = 'object' and (select count(*) from jsonb_object_keys(picks)) = 16)
);

alter table public.epl_swiss enable row level security;

drop policy if exists "own epl card readable" on public.epl_swiss;
create policy "own epl card readable" on public.epl_swiss
  for select using (auth.uid() = user_id);

drop policy if exists "own epl card writable" on public.epl_swiss;
create policy "own epl card writable" on public.epl_swiss
  for insert with check (auth.uid() = user_id);

drop policy if exists "own epl card updatable" on public.epl_swiss;
create policy "own epl card updatable" on public.epl_swiss
  for update using (auth.uid() = user_id and scored_at is null)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Місткість кошиків
-- ---------------------------------------------------------------------------
-- Перевірка в самій базі, а не лише в маршруті: картка з чотирма трійками
-- нулями не може бути правильною ні за яких обставин, і дешевше не дати її
-- записати, ніж потім пояснювати нарахування.
create or replace function public.epl_swiss_shape_ok(p_picks jsonb)
returns boolean
language sql
immutable
as $$
  select coalesce(bool_and(ok), false) from (
    select (select count(*) from jsonb_each_text(p_picks) where value = b.bucket) = b.cap as ok
      from (values ('3-0', 2), ('3-1', 3), ('3-2', 3), ('2-3', 3), ('1-3', 3), ('0-3', 2))
        as b(bucket, cap)
  ) t;
$$;

alter table public.epl_swiss drop constraint if exists epl_swiss_shape;
alter table public.epl_swiss
  add constraint epl_swiss_shape check (public.epl_swiss_shape_ok(picks));

-- ---------------------------------------------------------------------------
-- Нарахування
-- ---------------------------------------------------------------------------
-- Викликається адміном один раз, коли швейцарка дограна і підсумок відомий.
-- `p_actual` має ту саму форму, що й картка. Нараховує в івент-гаманець і
-- ставить позначку участі, бо заповнена картка — це дія на турнірі.
create or replace function public.score_epl_swiss(p_actual jsonb)
returns table (user_id uuid, points integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rec record;
  v_points integer;
  v_exact integer;
begin
  for v_rec in select * from public.epl_swiss where scored_at is null loop
    v_points := 0;
    v_exact := 0;
    select
      coalesce(sum(
        case
          when p.value = a.value and p.value in ('3-0', '0-3') then 150
          when p.value = a.value then 60
          when left(p.value, 1) = left(a.value, 1) then 20
          else 0
        end), 0),
      coalesce(sum(case when p.value = a.value then 1 else 0 end), 0)
      into v_points, v_exact
      from jsonb_each_text(v_rec.picks) p
      join jsonb_each_text(p_actual) a on a.key = p.key;

    if v_exact = 16 then
      v_points := v_points + 500;
    end if;

    update public.epl_swiss
       set points = v_points, scored_at = now(), updated_at = now()
     where epl_swiss.user_id = v_rec.user_id;

    update public.profiles
       set event_points = event_points + v_points,
           event_joined_at = coalesce(event_joined_at, now())
     where id = v_rec.user_id;

    user_id := v_rec.user_id;
    points := v_points;
    return next;
  end loop;
end;
$$;

revoke all on function public.score_epl_swiss(jsonb) from public, anon, authenticated;

grant select, insert, update on public.epl_swiss to authenticated;

-- Перевірка:
--   select public.epl_swiss_shape_ok('{"spirit":"3-0"}'::jsonb);  -- false
--   select count(*) from public.epl_swiss;
