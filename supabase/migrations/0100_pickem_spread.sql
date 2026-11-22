-- CS2 UA — як розклалася спільнота, ще до замка. Run in Supabase → SQL Editor.
-- Requires 0094, 0096.
--
-- Картка показує, скільки людей зробило так само: поставив Lynn на 0:3 —
-- бачиш, що так зробили ще 64%. Це головне число в пікемі, бо воно єдине
-- каже, де ти йдеш проти натовпу.
--
-- Складність у тому, що до замка чужі картки закриті політикою (0094), і це
-- правильно: відкриті картки перетворили б пікем на «подивись, що вибрала
-- решта, і зроби так само». Агрегат — інша річ: він каже, скільки людей
-- так зробило, і нічого про те, хто саме.
--
-- Тому функція, а не в'юха, і не політика на читання. Та сама причина, що в
-- 0099: в'юсі з правами власника дозволено все, і межа тримається лише на її
-- тексті; у функції межа стоїть у сигнатурі — три колонки, жодного user_id.
--
-- І поріг. При двох картках «50% поставили Spirit на 3:0» — це не статистика,
-- а чужа картка, прочитана вголос. Поріг — п'ять: він прибирає саме цей
-- випадок, коли вибір видно поіменно, і не чекає, доки набереться натовп, бо
-- інакше в маленької спільноти відсотки не з'являться ніколи. Проти змови
-- чотирьох він не захистить — але від неї не захищає жоден поріг, окрім
-- такого, при якому функція марна.
--
-- Стоїть він у базі, а не на сторінці: правило про те, чого не можна
-- показувати, не має залежати від того, хто питає.

begin;

/** Скільки карток на стадії. Саме число ні про кого не каже. */
create or replace function public.major_pickem_count(p_stage smallint)
returns integer
language sql
security definer
stable
set search_path = public
as $$
  select count(*)::integer from public.major_pickem c where c.stage = p_stage;
$$;

/** Скільки карток поставило кожну команду в кожну роль. */
create or replace function public.major_pickem_spread(p_stage smallint)
returns table (team text, role text, cards integer)
language sql
security definer
stable
set search_path = public
as $$
  select e.key, e.value, count(*)::integer
    from public.major_pickem c
    cross join lateral jsonb_each_text(c.picks) e
   where c.stage = p_stage
     and public.major_pickem_count(p_stage) >= 5
   group by e.key, e.value;
$$;

comment on function public.major_pickem_spread(smallint) is
  'Розподіл виборів по стадії. Тільки агрегат; нижче п''яти карток не віддає нічого.';

revoke all on function public.major_pickem_count(smallint) from public;
revoke all on function public.major_pickem_spread(smallint) from public;
grant execute on function public.major_pickem_count(smallint) to anon, authenticated, service_role;
grant execute on function public.major_pickem_spread(smallint) to anon, authenticated, service_role;

commit;

-- Перевірка:
--   select public.major_pickem_count(1::smallint);
--   select * from public.major_pickem_spread(1::smallint) order by cards desc;
--   -- поки карток менше п'яти — порожньо, і це правильно
