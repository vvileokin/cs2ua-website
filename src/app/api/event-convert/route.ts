import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** Three season points buy one event point. */
export const RATE = 3;

/** And no more than this many event points per person, per event. */
export const CAP = 1000;

/**
 * What this player may still exchange.
 *
 * The limit is two ceilings at once: the gold they hold, and the part of the
 * thousand they have not spent yet. Whichever bites first is the answer, and it
 * is floored to a whole multiple of the rate so the figure the modal offers as
 * "all" is a figure the exchange will actually accept.
 *
 * Unlike the World Cup exchange this needs no `earned` column. There, winnings
 * landed in the season total and could be fed back in, so only season earnings
 * were allowed to convert. Here the thousand caps the whole loop from above,
 * however much the player wins — one counter is enough.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: true, signedIn: false, limit: 0, rate: RATE, cap: CAP });
  }

  const { data, error } = await createAdminClient()
    .from("profiles")
    .select("points, event_points, event_converted")
    .eq("id", user.id)
    .maybeSingle();

  // Before migration 0088 the column does not exist; the exchange simply isn't
  // offered rather than the bet slip failing.
  if (error) {
    return NextResponse.json({ ok: true, signedIn: true, ready: false, limit: 0, rate: RATE, cap: CAP });
  }

  const capLeft = Math.max(CAP - (data?.event_converted ?? 0), 0);
  const limit = Math.floor(Math.min(data?.points ?? 0, capLeft * RATE) / RATE) * RATE;

  return NextResponse.json({
    ok: true,
    signedIn: true,
    ready: true,
    rate: RATE,
    cap: CAP,
    capLeft,
    limit,
    points: data?.points ?? 0,
    eventPoints: data?.event_points ?? 0,
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const gold = Number(body?.gold);
  if (!Number.isInteger(gold) || gold < RATE) {
    return NextResponse.json({ ok: false, error: "bad_amount" }, { status: 400 });
  }

  // Both ceilings are re-checked inside `convert_to_event`, under a row lock.
  // Checking them here would be reading a balance another request can move
  // between the read and the write.
  const { data, error } = await createAdminClient().rpc("convert_to_event", {
    p_user: user.id,
    p_gold: gold,
  });
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
