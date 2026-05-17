import { env } from "@/lib/env";
import { buildCalendarFeed } from "@/server/services/calendar-feed.service";

export const dynamic = "force-dynamic";

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function GET(request: Request) {
  const secret = env.CALENDAR_FEED_SECRET;
  if (!secret) {
    return new Response("Calendar feed is not configured.", { status: 503 });
  }

  const token = new URL(request.url).searchParams.get("token") ?? "";
  if (!timingSafeEqual(token, secret)) {
    return new Response("Forbidden.", { status: 403 });
  }

  const ics = await buildCalendarFeed();
  return new Response(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="njs-florist-pickup.ics"',
      "Cache-Control": "private, max-age=60",
    },
  });
}
