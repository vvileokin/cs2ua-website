-- CS2 UA — PGL Masters Bucharest 2026 закривається. Run in Supabase → SQL Editor.
-- Requires 0079, 0088, 0089.
--
-- Турнір дограно 31 жовтня. На руках лишилось 383 527 івент-поінтів на 744
-- профілях, із них 338 300 у тих, хто за весь турнір не зробив жодної дії, і
-- 45 227 у шістдесяти восьми, хто грав.
--
-- Виплачувати за них нічого не треба, і це не рішення, а властивість системи:
-- `settle_bets` (0075) кладе `payout - stake` одразу в `points`, а програна
-- ставка сезонних не знімає. Отже прибуток із івент-поінтів уже давно в
-- сезонній колонці — рівно так само закривали Porto, EWC і EPL S24. Закриття
-- тільки обнуляє гаманець.

begin;

-- ---------------------------------------------------------------------------
-- 1. Турнір виходить зі списку
-- ---------------------------------------------------------------------------
-- Після цього рядка івент-поінти нема де витратити: з 0079 їх приймає лише
-- матч турніру зі списку, решта ставок живе на сезонних.
delete from public.event_tournaments where slug = 'pgl-masters-bucharest-2026';

-- ---------------------------------------------------------------------------
-- 2. Повернення тим, хто купував
-- ---------------------------------------------------------------------------
-- Цього кроку не було в попередніх закриттях, і раніше він був не потрібен:
-- гаманець складався з безплатних 500, і обнулити їх нікого не кривдило.
--
-- З 0088 з'явився обмінник, і він працює в бік «сезонні → івентові» за курсом
-- 3:1. Шістнадцятеро ним скористались і віддали 24 654 сезонних за 8 218
-- івентових. Восьмеро з них не встигли витратити все: на руках лишилось 2 095
-- куплених поінтів. Обнулити їх мовчки означало б забрати те, за що людина
-- заплатила своїми ж сезонними.
--
-- Повертаємо за тим самим курсом і тільки куплене: `least` відсікає безплатну
-- частину гаманця, щоб ніхто не отримав сезонних за подарований внесок.
-- Разом це 2 095 × 3 = 6 285 сезонних на вісьмох.
update public.profiles
   set points = points + least(event_points, event_converted) * 3
 where event_converted > 0
   and event_points > 0;

-- ---------------------------------------------------------------------------
-- 3. Гаманці в нуль
-- ---------------------------------------------------------------------------
-- `event_joined_at` і `event_converted` скидаються разом із балансом — так
-- само, як це робить відкриття нового турніру в 0089. Дошка порожніє, ліміт
-- обмінника звільняється, і наступна подія починається з чистого аркуша.
update public.profiles
   set event_points    = 0,
       event_joined_at = null,
       event_converted = 0;

-- ---------------------------------------------------------------------------
-- 4. Обмінник більше не продає те, що нема де витратити
-- ---------------------------------------------------------------------------
-- Пастка, знайдена при закритті: `convert_to_event` ніде не питав, чи є
-- взагалі активний турнір. Тобто зараз, після рядка 1, людина могла б і далі
-- міняти сезонні на івентові — назавжди, бо прийняти їх більше нікому.
-- Додаємо перевірку на початку: немає відкритого турніру — немає обміну.
create or replace function public.convert_to_event(p_user uuid, p_gold integer)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rate      constant integer := 3;
  v_cap       constant integer := 1000;
  v_points    integer;
  v_converted integer;
  v_gain      integer;
  v_left      integer;
begin
  if auth.uid() is not null and auth.uid() <> p_user then
    return jsonb_build_object('ok', false, 'error', 'forbidden');
  end if;

  -- Без відкритого турніру куплені поінти нікуди не підуть.
  if not exists (select 1 from public.event_tournaments) then
    return jsonb_build_object('ok', false, 'error', 'no_event');
  end if;

  if p_gold is null or p_gold < v_rate or p_gold % v_rate <> 0 then
    return jsonb_build_object('ok', false, 'error', 'bad_amount');
  end if;
  select points, event_converted into v_points, v_converted
    from public.profiles where id = p_user for update;
  if v_points is null then
    return jsonb_build_object('ok', false, 'error', 'no_profile');
  end if;
  v_gain := p_gold / v_rate;
  v_left := greatest(v_cap - v_converted, 0);
  if v_gain > v_left then
    return jsonb_build_object('ok', false, 'error', 'over_cap',
                              'capLeft', v_left, 'limit', v_left * v_rate);
  end if;
  if p_gold > v_points then
    return jsonb_build_object('ok', false, 'error', 'poor', 'points', v_points);
  end if;

  update public.profiles
     set points          = points - p_gold,
         event_points    = event_points + v_gain,
         event_converted = event_converted + v_gain
   where id = p_user;

  return jsonb_build_object('ok', true, 'spent', p_gold, 'gained', v_gain,
                            'capLeft', v_left - v_gain,
                            'points', v_points - p_gold);
end;
$$;

revoke execute on function public.convert_to_event(uuid, integer) from public, anon;
grant execute on function public.convert_to_event(uuid, integer) to authenticated, service_role;

commit;
