import "server-only";
import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Акаунти, яких не показують у рейтингах.
 *
 * Адміни грають разом з усіма — ставлять, вгадують, беруть участь у розіграшах,
 * — але в таблиці не стоять. Причина проста: вони бачать питання до того, як
 * воно відкрилося, і першого рядка з двохсоттисячним відривом це не змінює, зате
 * сама таблиця від нього перестає бути змаганням.
 *
 * Джерело — `admin_users`, а не хардкод ніка: доступ видають і забирають там, і
 * видимість у таблиці має ходити за доступом сама, без правки коду.
 *
 * Читаємо службовим ключем: у `admin_users` політика віддає кожному лише свій
 * рядок, тож звичайним клієнтом список вийшов би з одного себе.
 *
 * `cache` тримає відповідь у межах одного запиту — на сторінці турніру рейтинг,
 * мій рядок і підрахунок місця питають це тричі.
 */
export const unrankedIds = cache(async (): Promise<string[]> => {
  try {
    const { data, error } = await createAdminClient().from("admin_users").select("user_id");
    if (error || !data) return [];
    return data.map((r) => r.user_id as string);
  } catch {
    return [];
  }
});

/** Чи ховати цей акаунт із таблиць. */
export async function isUnranked(userId: string | undefined): Promise<boolean> {
  if (!userId) return false;
  return (await unrankedIds()).includes(userId);
}

/**
 * Вішає на запит «окрім схованих».
 *
 * Порожній список лишає запит незайманим: `id=not.in.()` PostgREST не приймає.
 */
export function exceptUnranked<T extends { not: (c: string, o: string, v: string) => T }>(
  query: T,
  hidden: string[],
): T {
  return hidden.length ? query.not("id", "in", `(${hidden.join(",")})`) : query;
}
