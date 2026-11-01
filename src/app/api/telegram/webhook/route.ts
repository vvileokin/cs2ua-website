import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Who joined the channel, and when.
 *
 * This route only remembers. It makes no Bot API calls at all — there is no
 * code path here that touches a subscriber, only one that writes a row.
 *
 * It exists because the Bot API has no method that returns a channel's
 * subscribers. None: `getChatMemberCount` gives a number and
 * `getChatAdministrators` gives the admins, and that is the whole of what a
 * bot can ask about its own audience. A bot admin with `chat_member` in
 * `allowed_updates` does get an event for every join and leave, which is the
 * only way to see the stream at all — and only forward from the moment the
 * webhook is set.
 *
 * Telegram retries a webhook that is slow or errors, so this answers 200 to
 * anything it cannot use and does the least work it can: one insert, no
 * analysis. Reading the log is a separate concern and lives apart from the
 * thing that is catching it.
 */
export const dynamic = "force-dynamic";

type TgUser = {
  id: number;
  is_bot?: boolean;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
};

type ChatMemberUpdate = {
  chat?: { id?: number; username?: string };
  new_chat_member?: { status?: string; user?: TgUser };
  old_chat_member?: { status?: string };
};

const PRESENT = new Set(["member", "administrator", "creator"]);
const ABSENT = new Set(["left", "kicked"]);

/** The configured channel, as either `@handle` or a numeric id. */
function isOurChannel(chat: ChatMemberUpdate["chat"]): boolean {
  const want = process.env.TELEGRAM_CHANNEL_ID ?? "";
  if (!want || !chat) return false;
  if (want.startsWith("@")) return `@${chat.username ?? ""}` === want;
  return String(chat.id ?? "") === want;
}

export async function POST(request: Request) {
  // Telegram sends the secret back in a header, and that is the whole of the
  // authentication. Without it the URL is an open endpoint that anyone could
  // post invented joins to, and an invented join is worse than a missing one:
  // it is indistinguishable from a real one afterwards.
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret || request.headers.get("x-telegram-bot-api-secret-token") !== secret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let update: { chat_member?: ChatMemberUpdate };
  try {
    update = await request.json();
  } catch {
    return NextResponse.json({ ok: true, skipped: "unparseable" });
  }

  const ev = update.chat_member;
  if (!ev || !isOurChannel(ev.chat)) {
    return NextResponse.json({ ok: true, skipped: "not_ours" });
  }

  const user = ev.new_chat_member?.user;
  const before = ev.old_chat_member?.status ?? "";
  const after = ev.new_chat_member?.status ?? "";
  if (!user?.id) return NextResponse.json({ ok: true, skipped: "no_user" });

  const joined = ABSENT.has(before) && PRESENT.has(after);
  const left = PRESENT.has(before) && ABSENT.has(after);
  if (!joined && !left) return NextResponse.json({ ok: true, skipped: after });

  const admin = createAdminClient();

  if (left) {
    // Only stamps rows we already have. Someone leaving who joined before the
    // webhook existed is a no-op, which is correct: we never saw them arrive.
    await admin
      .from("tg_channel_join")
      .update({ left_at: new Date().toISOString() })
      .eq("user_id", user.id);
    return NextResponse.json({ ok: true, left: true });
  }

  const name = [user.first_name, user.last_name].filter(Boolean).join(" ");
  const { error } = await admin.from("tg_channel_join").upsert(
    {
      user_id: user.id,
      joined_at: new Date().toISOString(),
      left_at: null,
      username: user.username ?? null,
      name: name || null,
      is_bot: Boolean(user.is_bot),
      lang: user.language_code ?? null,
      raw: user,
    },
    { onConflict: "user_id" },
  );

  // A failed insert is logged and swallowed. Telegram answers a non-200 by
  // sending the same update again, so a row we cannot write would come back on
  // a loop — and the loop would be busiest exactly when the traffic is.
  if (error) console.error("tg_channel_join:", error.message);
  return NextResponse.json({ ok: true, joined: true });
}
