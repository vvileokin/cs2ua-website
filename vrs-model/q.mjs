import fs from "node:fs";

/**
 * Доступ до бази сайту для скриптів моделі.
 *
 * Ключ не лежить тут і не лежить у репозиторії: читається з `.env.local`
 * сайту, який на рівень вище. Шлях рахується від самого файла, а не від того,
 * звідки запустили, — інакше скрипт працює лише з однієї теки.
 */
const ENV_FILE = new URL("../.env.local", import.meta.url);
const env = Object.fromEntries(
  fs.readFileSync(ENV_FILE, "utf8")
    .split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);
export const URL_ = env.NEXT_PUBLIC_SUPABASE_URL;
export const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
export async function q(path) {
  const r = await fetch(`${URL_}/rest/v1/${path}`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, Prefer: "count=exact" },
  });
  const t = await r.text();
  try { return JSON.parse(t); } catch { return t; }
}
