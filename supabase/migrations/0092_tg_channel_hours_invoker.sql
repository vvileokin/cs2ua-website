-- CS2 UA — закриваємо tg_channel_hours. Run in Supabase → SQL Editor.
--
-- Помилка з 0091. Таблиця tg_channel_join має RLS без політик, тобто читати її
-- може тільки service role. Але в'юха над нею виконується з правами ВЛАСНИКА,
-- а не того, хто питає, — і через це обходила ту саму RLS, заради якої все
-- робилось. Перевірено живим запитом: анонімний ключ отримував на
-- tg_channel_hours код 200.
--
-- Журнал входів у канал — це список людей із юзернеймами й часом. Він не має
-- бути доступний нікому, крім service role.
--
-- security_invoker перемикає в'юху на права того, хто робить запит. Тоді RLS
-- базової таблиці застосовується як належить, і анонім бачить нуль рядків.
-- Права відкликаємо теж: по-перше, одного запобіжника мало, по-друге, без
-- grant в'юха зникає і зі схеми, яку PostgREST віддає назовні.

alter view public.tg_channel_hours set (security_invoker = on);

revoke all on public.tg_channel_hours from anon, authenticated;

comment on view public.tg_channel_hours is
  'Приріст каналу по годинах. security_invoker: читає лише service role.';
