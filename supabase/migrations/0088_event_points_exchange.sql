-- CS2 UA — обмінник сезонних поінтів на поінти івенту.
-- Run in Supabase → SQL Editor. Requires 0060, 0082.
--
-- Курс: 3 сезонних = 1 поінт івенту. Стеля — 1000 поінтів івенту на людину за
-- весь турнір, тобто 3000 сезонних.
--
-- Навіщо стеля саме така. Правило з 0075: виграна ставка кладе прибуток і в
-- сезонну колонку, програна сезонних не чіпає. Без межі це друкарський верстат
-- — обміняв, виграв, прибуток упав у сезонні, обміняв знову. На EWC це
-- закривали окремою колонкою `ewc_earned_points`, яка пам'ятала, скільки золота
-- прийшло з івенту, і дозволяла міняти лише решту. Тут простіше: межа в 1000
-- обмежує весь цикл зверху незалежно від того, скільки людина виграла, тож
-- достатньо одного лічильника, скільки вже куплено.
--
-- Лічильник іде за івентом, а не за сезоном: наступний турнір відкривається тим
-- самим рухом, що й у 0082, і має обнулити його разом із гаманцем —
--
--     update public.profiles set event_points = 500, event_joined_at = null,
--                                event_converted = 0;
--
-- Обмін навмисне не ставить `event_joined_at`. На дошці стоїть той, хто зіграв,
-- а не той, хто купив фішки; вступ лишається за першою справжньою дією —
-- ставкою, дуеллю чи зарахованим прогнозом.

begin;

alter table public.profiles
  add column if not exists event_converted integer not null default 0;

-- ---------------------------------------------------------------------------
-- Сам обмін
-- ---------------------------------------------------------------------------
-- Рахунок під блокуванням рядка: перевіряти залишок у роуті означало б читати
-- баланс, який інший запит встигне зрушити між читанням і записом.

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

  -- Тільки цілі поінти івенту, щоб нічого не губилось на заокругленні в жоден
  -- бік — те саме правило, що й на EWC з його кратністю п'яти.
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

-- Перевірка після запуску:
--   select handle, points, event_points, event_converted
--     from public.profiles where event_converted > 0 order by event_converted desc;
