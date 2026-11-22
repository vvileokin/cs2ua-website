-- CS2 UA — четверта стадія (плей-оф) і правило, за яким визначається десятка.
-- Run in Supabase → SQL Editor. Requires 0094, 0095.
--
-- Навіщо все це разом.
--
-- Призи — скіни, і їх отримує перша десятка кожної стадії плюс перша десятка
-- підсумкової таблиці. П'ять роздач, а стадій у базі було три: плей-оф, за
-- який теж даються скіни, просто не існував. Це перше.
--
-- Друге важливіше. «Перша десятка» дотепер була не визначена. При десяти
-- виборах однакова сума в кількох людей — не виняток, а норма: ті самі 600
-- очок легко збереться в п'ятнадцятьох одночасно, і хтось із них мусить бути
-- одинадцятим. Доки порядок усередині рівних не описаний, роздавати по ньому
-- скіни не можна.
--
-- Нічия розв'язується так:
--     1. очки
--     2. влучання — при рівній сумі вище той, хто вгадав більше подій
--     3. час збереження картки, раніше — вище
--     4. id — щоб порядок був однаковий у будь-якому запиті
--
-- Третій пункт єдиний, на який гравець впливає сам і якого не можна
-- перехитрити: картка, подана за годину до замка, встигла врахувати і заміни
-- в складах, і новини. Хто поставив раніше й не правив — ризикував більше.
--
-- І третє: ціни стадій змінилися, тож чотири картки, збережені до цієї
-- міграції, скидаються. Вони складалися за іншим прайсом, жодна ще не
-- зарахована, і залишати їх означало б рахувати частину людей за старими
-- правилами.

begin;

-- ---------------------------------------------------------------------------
-- 1. Місце для четвертої стадії
-- ---------------------------------------------------------------------------
alter table public.major_stages drop constraint if exists major_stages_stage_check;
alter table public.major_stages
  add constraint major_stages_stage_check check (stage between 1 and 4);

-- Вид картки. Швейцарка і плей-оф — різні ігри: у першій шістнадцять команд і
-- три кошики на десять місць, у другому вісім команд і сітка. Усе, що з цього
-- випливає (склад, форма картки, ціни, бонус), береться з цього одного слова.
alter table public.major_stages
  add column if not exists kind text not null default 'swiss';
alter table public.major_stages drop constraint if exists major_stages_kind_check;
alter table public.major_stages
  add constraint major_stages_kind_check check (kind in ('swiss', 'playoff'));

comment on column public.major_stages.kind is
  'swiss — шістнадцять команд, картка 2/6/2; playoff — вісім команд, картка 1/1/2.';

-- Час — попередній. HLTV на сьогодні знає тільки, що «Stage 3 & Playoffs» іде
-- з 2 до 13 грудня; точної години першого чвертьфіналу ще не опублікували.
-- Це не заважає: стадія все одно не відкриється, поки в неї не впишуть вісім
-- команд, а на той час розклад уже буде відомий — і замок переставляється
-- одним UPDATE, без деплою.
insert into public.major_stages (stage, title, teams, starts_at, kind)
values (4, 'Плей-оф', '[]'::jsonb, '2026-12-10 06:00:00+00', 'playoff')
on conflict (stage) do nothing;

-- ---------------------------------------------------------------------------
-- 2. Ціни й форма — по видах стадії
-- ---------------------------------------------------------------------------
-- Ціни йдуть від рідкості, а не від важливості. Назвати найсильнішого легко,
-- назвати того, хто візьме три поспіль, — ні; тому краї швейцарки втричі
-- дорожчі за середину. Максимум за стадію однаковий — 1400 — і це не збіг:
-- кожна стадія це одна роздача призів, і жодна не має важити в підсумковій
-- таблиці більше за інші тільки тому, що в ній більше виборів.
--
--   швейцарка  3-0 ×2 по 150, adv ×6 по 50, 0-3 ×2 по 150, уся картка +500
--   плей-оф    champ 400, final 300, semi ×2 по 200,       уся картка +300
--
-- Дзеркалить `src/lib/major-pickem.ts`. Міняється тільки разом із ним.
create or replace function public.major_pick_roles()
returns text[]
language sql
immutable
as $$
  select array['3-0', 'adv', '0-3', 'champ', 'final', 'semi'];
$$;

create or replace function public.major_pick_price(p_role text)
returns integer
language sql
immutable
as $$
  select case p_role
           when '3-0'   then 150
           when 'adv'   then 50
           when '0-3'   then 150
           when 'champ' then 400
           when 'final' then 300
           when 'semi'  then 200
           else 0
         end;
$$;

/* Влучання: роль збіглася з підсумком.
   Єдиний виняток — `adv`. Він збирає під себе всі кошики, що починаються з
   трійки (3-0, 3-1, 3-2), бо «пройшов далі» це справді кілька різних
   результатів. У плей-офі винятків немає: champ, final, semi, qf — рівно
   одне місце кожен. */
create or replace function public.major_pick_hit(p_role text, p_outcome text)
returns boolean
language sql
immutable
as $$
  select case
           when p_outcome is null then false
           when p_role = 'adv'    then left(p_outcome, 1) = '3'
           else p_role = p_outcome
         end;
$$;

/* Скільки команд має отримати кожну роль у картці цього виду. */
create or replace function public.major_card_shape(p_kind text)
returns table (role text, cap integer)
language sql
immutable
as $$
  select t.role, t.cap
    from (values
           ('swiss',   '3-0',   2),
           ('swiss',   'adv',   6),
           ('swiss',   '0-3',   2),
           ('playoff', 'champ', 1),
           ('playoff', 'final', 1),
           ('playoff', 'semi',  2)
         ) as t(kind, role, cap)
   where t.kind = p_kind;
$$;

/* Скільки команд у стадії цього виду. */
create or replace function public.major_roster(p_kind text)
returns integer
language sql
immutable
as $$
  select case p_kind when 'playoff' then 8 else 16 end;
$$;

/* Бонус за картку без жодної помилки. */
create or replace function public.major_perfect_bonus(p_kind text)
returns integer
language sql
immutable
as $$
  select case p_kind when 'playoff' then 300 else 500 end;
$$;

-- ---------------------------------------------------------------------------
-- 3. Перевірка форми
-- ---------------------------------------------------------------------------
-- Тепер їх дві, і це не дублювання.
--
-- Точну форму знає тільки стадія: та сама картка з чотирьох виборів правильна
-- для плей-офа й неправильна для швейцарки. А `check` на таблиці про стадію
-- не знає — підзапит у ньому Postgres не дозволяє, і бути він мусить
-- незмінним. Тож на таблиці лишається загальне твердження (словник, ключі
-- рахуються, значення — з відомого набору ролей), а точну форму перевіряє
-- RPC, яка й так читає стадію заради замка.
create or replace function public.major_pickem_shape_ok(p_picks jsonb)
returns boolean
language sql
immutable
as $$
  select
    jsonb_typeof(p_picks) = 'object'
    and (select count(*) from jsonb_object_keys(p_picks)) between 1 and 16
    and not exists (
      select 1 from jsonb_each_text(p_picks) e
       where e.value <> all (public.major_pick_roles())
    );
$$;

create or replace function public.major_pickem_shape_ok(p_picks jsonb, p_kind text)
returns boolean
language sql
immutable
as $$
  select
    jsonb_typeof(p_picks) = 'object'
    and exists (select 1 from public.major_card_shape(p_kind))
    and (select count(*) from jsonb_object_keys(p_picks))
        = (select sum(s.cap) from public.major_card_shape(p_kind) s)
    and not exists (
      select 1 from public.major_card_shape(p_kind) s
       where (select count(*) from jsonb_each_text(p_picks) e where e.value = s.role) <> s.cap
    );
$$;

-- ---------------------------------------------------------------------------
-- 4. Скидання карток, складених за старим прайсом
-- ---------------------------------------------------------------------------
-- Зі страховкою: якщо колись дійде до зарахованих карток, міграція впаде, а не
-- зітре їх мовчки. Зараховані очки вже лежать у `profiles.points`, і видалити
-- картку, не віднявши їх, означає розсинхронізувати два лічильники назавжди.
do $$
declare n integer;
begin
  select count(*) into n from public.major_pickem where scored_at is not null;
  if n > 0 then
    raise exception
      'Є % зарахованих карток. Скидати не можна: очки вже нараховані в profiles.points', n;
  end if;
end
$$;

delete from public.major_pickem;

-- Тепер, коли таблиця порожня, можна безпечно переставити обмеження.
alter table public.major_pickem drop constraint if exists major_pickem_shape;
alter table public.major_pickem
  add constraint major_pickem_shape check (public.major_pickem_shape_ok(picks));

-- ---------------------------------------------------------------------------
-- 5. Збереження картки — по формі своєї стадії
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
  if jsonb_array_length(v_stage.teams) <> public.major_roster(v_stage.kind) then
    return jsonb_build_object('ok', false, 'error', 'not_open');
  end if;

  if now() >= v_stage.starts_at then
    return jsonb_build_object('ok', false, 'error', 'locked',
                              'startsAt', v_stage.starts_at);
  end if;

  if not public.major_pickem_shape_ok(p_picks, v_stage.kind) then
    return jsonb_build_object('ok', false, 'error', 'bad_shape');
  end if;

  -- Кожен слаг має бути з цієї стадії. Інакше картка приймала б кого завгодно
  -- — і при нарахуванні просто не знайшла б пари.
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
-- 6. Нарахування — однією формулою на обидва види
-- ---------------------------------------------------------------------------
-- Одна формула на обидва види: ціну дає `major_pick_price`, влучання —
-- `major_pick_hit`, бонус за повну картку — `major_perfect_bonus`.
--
-- `updated_at` при нарахуванні НЕ чіпається, і це тепер принципово: з 0096
-- час збереження картки — третій ключ тайбрейка, тобто частина правила, за
-- яким видаються скіни. Якби нарахування переставляло його на `now()`, усі
-- картки стадії отримали б майже однаковий час у момент підбиття підсумків —
-- і тайбрейк перетворився б на порядок, у якому цикл їх обійшов.
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

    update public.major_pickem c
       set points = v_points, hits = v_hits, scored_at = now(), updated_at = c.updated_at
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
-- 7. Дошки з місцями
-- ---------------------------------------------------------------------------
-- Місце рахує база, а не сторінка. Тайбрейк — це правило про всіх разом: щоб
-- сказати, хто десятий, треба бачити всі картки одночасно, а сторінка бачить
-- сторінку. Номер, за яким видається скін, має бути однаковий у будь-якому
-- запиті — тому він обчислюється там, де лежать дані.
--
-- `security_invoker` — щоб в'юха не обходила RLS таблиці під собою. Без нього
-- вона читає правами власника, і те, що закрите політикою, витікає через неї
-- всім. Саме на цьому попався `tg_channel_hours` у 0091. Тут це безпечно й по
-- суті: у дошку потрапляють тільки зараховані картки, а їхня стадія давно за
-- замком, тож видно їх і так усім — і місця в усіх збігаються.
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
 where c.scored_at is not null;

grant select on public.major_stage_board to anon, authenticated;

-- Підсумкова таблиця — сума за всі зіграні стадії. Той самий тайбрейк, тільки
-- час береться останній: у підсумку важить не одна картка, а те, коли людина
-- закінчила правити останню з них.
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
   where c.scored_at is not null
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
--   select stage, kind, title, jsonb_array_length(teams) as teams, starts_at
--     from public.major_stages order by stage;              -- чотири рядки, 4 → playoff/0
--   select count(*) from public.major_pickem;               -- 0
--   select public.major_pickem_shape_ok(
--            '{"spirit":"champ","vitality":"final","mouz":"semi","navi":"semi"}'::jsonb,
--            'playoff');                                    -- true
--   select public.major_pickem_shape_ok(
--            '{"spirit":"champ","vitality":"final","mouz":"semi","navi":"semi"}'::jsonb,
--            'swiss');                                      -- false
--
-- Коли стадія дограна:
--   update public.major_stages set actual = '{"heroic":"3-0", ...}'::jsonb where stage = 1;
--   select * from public.score_major_stage(1);
--   select rank, handle, points, hits from public.major_stage_board
--    where stage = 1 and rank <= 10 order by rank;          -- кому їдуть скіни
