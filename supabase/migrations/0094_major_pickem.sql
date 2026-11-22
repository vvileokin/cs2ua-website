-- CS2 UA — пікеми на PGL Major Singapore 2026. Run in Supabase → SQL Editor.
-- Requires 0060 (profiles), 0077 (major_projection).
--
-- Формат узято в самої гри, не вигаданий. Картка стадії — це десять виборів
-- із шістнадцяти команд:
--     двоє пройдуть 3-0
--     шестеро просто пройдуть далі
--     двоє вилетять 0-3
-- Рівно так влаштований пікем у клієнті CS, і саме тому він добре грається:
-- середина швейцарки передбачувана, а краї — ні. Назвати найсильнішого легко,
-- назвати того, хто візьме три поспіль, — ні.
--
-- Три стадії по шістнадцять. Склад першої відомий наперед, бо це шістнадцять
-- найнижчих за VRS; другу і третю доукомплектовує той, хто вийшов з
-- попередньої, тож їхні картки відкриються не раніше, ніж це стане відомо.
--
-- Ціни дзеркалять `src/lib/major-pickem.ts` і йдуть від рідкості, як у 0083:
--     3-0 вгадано        150
--     0-3 вгадано        150
--     прохід вгадано      50
--     уся картка         +500
-- Максимум за стадію — 1400.
--
-- Нараховується в сезонні поінти, а не в івентові: івент-гаманець прив'язаний
-- до турніру зі списку `event_tournaments`, Мейджор туди не заведений, і
-- заводити його тільки заради пікемів означало б відкрити обмінник на подію,
-- де більше нема на що ставити. Окремий залік пікемів живе у власній колонці
-- `points` цієї ж таблиці — звідси й окрема дошка.

begin;

-- ---------------------------------------------------------------------------
-- 1. Стадії
-- ---------------------------------------------------------------------------
-- Склад і час замка лежать у базі, а не в коді, бо обидва ще зміняться:
-- шістнадцять учасників другої стадії стануть відомі аж після першої, а час
-- першого матчу PGL може посунути. І те, і те — один UPDATE, без деплою.
create table if not exists public.major_stages (
  stage      smallint primary key check (stage between 1 and 3),
  title      text        not null,
  -- Слаги команд у нашому довіднику, рівно шістнадцять, коли стадія готова.
  -- Поки менше — картка не відкривається: вибирати нема з кого.
  teams      jsonb       not null default '[]'::jsonb,
  -- Замок. Час початку ПЕРШОГО матчу стадії: після нього картка не
  -- редагується нікому. Пікем, який можна правити після першої ж поразки
  -- фаворита, — це не прогноз.
  starts_at  timestamptz not null,
  -- Підсумок стадії тим самим словником кошиків, що і в 0083:
  -- {"heroic":"3-0","imperial":"0-3", ...} — усі шістнадцять.
  actual     jsonb,
  scored_at  timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.major_stages enable row level security;

-- Склад і час старту — публічні: без них сторінку нема чим малювати.
drop policy if exists "stages are public" on public.major_stages;
create policy "stages are public" on public.major_stages
  for select using (true);

grant select on public.major_stages to anon, authenticated;

-- Шістнадцять першої стадії — найнижчі за VRS у підсумковій таблиці 0077.
-- Час: 2026-11-24 06:00 UTC — початок HEROIC — Imperial, найранішого матчу
-- стадії за розкладом події.
insert into public.major_stages (stage, title, teams, starts_at)
values
  (1, 'Стадія 1',
   '["nip","parivision","heroic","faze","hundredthieves","eternalfire","liquid","ninez","m80","sharks","imperial","wildcard","bcgame","flyquest","chinggis","lynn"]'::jsonb,
   '2026-11-24 06:00:00+00'),
  -- Восьмеро відомих; решту вісім додасть той, хто вийде зі стадії 1.
  (2, 'Стадія 2',
   '["fut","nemiga","g2","onewin","natus","astralis","mibr","mongolz"]'::jsonb,
   '2026-11-28 06:00:00+00'),
  (3, 'Стадія 3',
   '["mouz","vitality","aurora","spirit","betboom","falcons","furia","legacy"]'::jsonb,
   '2026-12-02 06:00:00+00')
on conflict (stage) do nothing;

-- ---------------------------------------------------------------------------
-- 2. Форма картки
-- ---------------------------------------------------------------------------
-- {"heroic":"3-0","faze":"adv","lynn":"0-3", ...} — рівно десять пар:
-- двійка, шістка, двійка. Підзапит в `check` Postgres не дозволяє, тож умова
-- живе в незмінній функції — так само, як у 0083.
--
-- Чи належать слаги саме цій стадії, тут не перевіряється: таблиця стадій —
-- це інший рядок, і обмеження про нього не знає. Це робить RPC нижче, яка і
-- так читає стадію заради замка.
create or replace function public.major_pickem_shape_ok(p_picks jsonb)
returns boolean
language sql
immutable
as $$
  select
    jsonb_typeof(p_picks) = 'object'
    and (select count(*) from jsonb_object_keys(p_picks)) = 10
    and not exists (
      select 1
        from (values ('3-0', 2), ('adv', 6), ('0-3', 2)) as b(role, cap)
       where (select count(*) from jsonb_each_text(p_picks) e where e.value = b.role) <> b.cap
    );
$$;

-- ---------------------------------------------------------------------------
-- 3. Картки
-- ---------------------------------------------------------------------------
create table if not exists public.major_pickem (
  user_id    uuid        not null references auth.users (id) on delete cascade,
  stage      smallint    not null references public.major_stages (stage) on delete cascade,
  picks      jsonb       not null,
  points     integer     not null default 0,
  -- Скільки з десяти збіглося. Тримається окремо від очок, бо рівні
  -- («бронза — срібло — золото — діамант») рахуються від влучань, а не від
  -- суми: десять по п'ятдесят і два по сто п'ятдесят — різні картки з
  -- близькими сумами, і змішувати їх в одну шкалу нечесно.
  hits       smallint    not null default 0,
  scored_at  timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, stage)
);

alter table public.major_pickem drop constraint if exists major_pickem_shape;
alter table public.major_pickem
  add constraint major_pickem_shape check (public.major_pickem_shape_ok(picks));

alter table public.major_pickem enable row level security;

-- Своя картка видна завжди. Чужі — тільки після замка стадії.
--
-- Це й захист, і функція. До замка відкриті чужі картки перетворили б пікем
-- на змагання «хто зайде останнім»: достатньо подивитись, що вибрала решта.
-- Після замка міняти вже нічого не можна, і те саме знання стає цікавим —
-- саме з нього росте розподіл «скільки відсотків поставили на цю команду»,
-- який показує сторінка.
drop policy if exists "own card, and everyone's once locked" on public.major_pickem;
create policy "own card, and everyone's once locked" on public.major_pickem
  for select using (
    auth.uid() = user_id
    or exists (
      select 1 from public.major_stages s
       where s.stage = major_pickem.stage and now() >= s.starts_at
    )
  );

-- Писати напряму не можна нікому: і замок, і належність слагів стадії
-- перевіряє RPC. Політика на запис свідомо відсутня — при увімкненому RLS це
-- означає «заборонено», і єдиний шлях усередину лишається один.
grant select on public.major_pickem to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. Збереження картки
-- ---------------------------------------------------------------------------
create or replace function public.save_major_pickem(p_stage smallint, p_picks jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user  uuid := auth.uid();
  v_stage record;
  v_bad   text;
begin
  if v_user is null then
    return jsonb_build_object('ok', false, 'error', 'anon');
  end if;

  select * into v_stage from public.major_stages where stage = p_stage;
  -- `found`, а не `v_stage is null`: для record-змінної порівняння з null
  -- означає «всі поля порожні», що випадково збігається з «рядка немає» лише
  -- доти, доки в таблиці немає рядка з усіма null.
  if not found then
    return jsonb_build_object('ok', false, 'error', 'no_stage');
  end if;

  -- Стадія ще не укомплектована — вибирати нема з кого.
  if jsonb_array_length(v_stage.teams) <> 16 then
    return jsonb_build_object('ok', false, 'error', 'not_open');
  end if;

  if now() >= v_stage.starts_at then
    return jsonb_build_object('ok', false, 'error', 'locked',
                              'startsAt', v_stage.starts_at);
  end if;

  if not public.major_pickem_shape_ok(p_picks) then
    return jsonb_build_object('ok', false, 'error', 'bad_shape');
  end if;

  -- Кожен слаг має бути з цієї стадії. Інакше картка на шістнадцять команд
  -- приймала б кого завгодно — і при нарахуванні просто не знайшла б пари.
  select e.key into v_bad
    from jsonb_each_text(p_picks) e
   where not (v_stage.teams ? e.key)
   limit 1;
  if v_bad is not null then
    return jsonb_build_object('ok', false, 'error', 'bad_team', 'team', v_bad);
  end if;

  insert into public.major_pickem (user_id, stage, picks)
       values (v_user, p_stage, p_picks)
  on conflict (user_id, stage) do update
       set picks = excluded.picks, updated_at = now()
     where public.major_pickem.scored_at is null;

  return jsonb_build_object('ok', true, 'stage', p_stage);
end;
$$;

revoke all on function public.save_major_pickem(smallint, jsonb) from public, anon;
grant execute on function public.save_major_pickem(smallint, jsonb) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 5. Нарахування
-- ---------------------------------------------------------------------------
-- Викликається, коли стадія дограна і `actual` заповнений усіма шістнадцятьма.
-- Прохід — це будь-який кошик, що починається з трійки: 3-0, 3-1, 3-2.
create or replace function public.score_major_stage(p_stage smallint)
returns table (user_id uuid, points integer, hits smallint)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actual jsonb;
  v_rec    record;
  v_points integer;
  v_hits   smallint;
begin
  select s.actual into v_actual from public.major_stages s where s.stage = p_stage;
  if v_actual is null or (select count(*) from jsonb_object_keys(v_actual)) <> 16 then
    raise exception 'major_stages.actual для стадії % не заповнений на шістнадцять команд', p_stage;
  end if;

  for v_rec in
    select * from public.major_pickem c
     where c.stage = p_stage and c.scored_at is null
  loop
    select
      coalesce(sum(
        case
          when p.value = '3-0' and a.value = '3-0' then 150
          when p.value = '0-3' and a.value = '0-3' then 150
          when p.value = 'adv' and left(a.value, 1) = '3' then 50
          else 0
        end), 0),
      coalesce(sum(
        case
          when p.value = '3-0' and a.value = '3-0' then 1
          when p.value = '0-3' and a.value = '0-3' then 1
          when p.value = 'adv' and left(a.value, 1) = '3' then 1
          else 0
        end), 0)
      into v_points, v_hits
      from jsonb_each_text(v_rec.picks) p
      join jsonb_each_text(v_actual) a on a.key = p.key;

    if v_hits = 10 then
      v_points := v_points + 500;
    end if;

    update public.major_pickem c
       set points = v_points, hits = v_hits, scored_at = now(), updated_at = now()
     where c.user_id = v_rec.user_id and c.stage = p_stage;

    update public.profiles
       set points = points + v_points
     where id = v_rec.user_id;

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
-- його і в service_role — та сама пастка, що в 0035, 0070 і 0083.
grant execute on function public.score_major_stage(smallint) to service_role;

-- ---------------------------------------------------------------------------
-- 6. Окрема дошка пікемів
-- ---------------------------------------------------------------------------
-- Сума за всі зіграні стадії. Рахується по зарахованих картках, тож поки
-- жодна стадія не дограна, дошка чесно порожня.
--
-- `security_invoker` — щоб в'юха не обходила RLS таблиці під собою. Без нього
-- вона читає правами власника, і те, що закрите політикою, витікає через неї
-- всім. Саме на цьому попався `tg_channel_hours` у 0091, і полагодило його
-- 0092; тут одразу правильно.
--
-- Під RLS вище це працює рівно так, як треба: незіграні картки видно лише
-- своєму господареві, зіграні — всім, бо їхня стадія давно за замком.
drop view if exists public.major_pickem_board;
create view public.major_pickem_board
with (security_invoker = on) as
  select
    c.user_id,
    pr.handle,
    pr.avatar_url,
    sum(c.points)::integer                       as points,
    sum(c.hits)::integer                         as hits,
    count(*)::integer                            as stages,
    max(c.scored_at)                             as last_scored_at
  from public.major_pickem c
  join public.profiles pr on pr.id = c.user_id
 where c.scored_at is not null
 group by c.user_id, pr.handle, pr.avatar_url;

grant select on public.major_pickem_board to anon, authenticated;

commit;

-- Перевірка:
--   select stage, jsonb_array_length(teams) as teams, starts_at from public.major_stages;
--   select public.major_pickem_shape_ok('{"a":"3-0","b":"3-0","c":"adv","d":"adv","e":"adv","f":"adv","g":"adv","h":"adv","i":"0-3","j":"0-3"}'::jsonb);  -- true
--   select public.major_pickem_shape_ok('{"a":"3-0"}'::jsonb);  -- false
--
-- Коли стадія дограна:
--   update public.major_stages set actual = '{"heroic":"3-0", ...}'::jsonb where stage = 1;
--   select * from public.score_major_stage(1);
