import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { startOfDay } from "@/lib/utils";
import { getSetting, SETTING_KEYS } from "@/server/services/settings.service";

const ACTIVE_PICKUP_STATUSES = [
  "PAID",
  "PREPARING",
  "READY_FOR_DELIVERY",
  "OUT_FOR_DELIVERY",
] as const;

const PRODID = "-//njs Florist//Pickup Schedule//EN";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatLocalDateTime(date: Date, time: string) {
  // Local "floating" datetime per RFC 5545 (no Z suffix).
  // Format: YYYYMMDDTHHmmss
  const [hh = "0", mm = "0"] = time.split(":");
  const y = date.getFullYear();
  const mo = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  return `${y}${mo}${d}T${pad(Number(hh))}${pad(Number(mm))}00`;
}

function formatUtcTimestamp(date: Date) {
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
}

function escapeText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function foldLine(line: string) {
  // RFC 5545 line folding: max 75 octets per line, continuation prefixed with single space.
  if (line.length <= 75) return line;
  const chunks: string[] = [];
  let i = 0;
  while (i < line.length) {
    const size = i === 0 ? 75 : 74;
    chunks.push((i === 0 ? "" : " ") + line.slice(i, i + size));
    i += size;
  }
  return chunks.join("\r\n");
}

export async function buildCalendarFeed(): Promise<string> {
  const horizonStart = startOfDay(new Date());
  horizonStart.setDate(horizonStart.getDate() - 1); // include yesterday so today's pickups stay visible
  const horizonEnd = startOfDay(new Date());
  horizonEnd.setDate(horizonEnd.getDate() + 120);

  const [orders, slotRows, pickupAddress, businessName] = await Promise.all([
    db.order.findMany({
      where: {
        status: { in: [...ACTIVE_PICKUP_STATUSES] },
        deliveryDate: { gte: horizonStart, lte: horizonEnd },
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        recipientName: true,
        recipientPhone: true,
        senderName: true,
        cardMessage: true,
        deliveryDate: true,
        deliverySlotId: true,
        deliveryNotes: true,
        updatedAt: true,
        items: {
          select: { productName: true, variantName: true, quantity: true },
        },
      },
      orderBy: { deliveryDate: "asc" },
    }),
    db.deliverySlot.findMany({
      select: { id: true, label: true, startTime: true, endTime: true },
    }),
    getSetting(SETTING_KEYS.PICKUP_ADDRESS),
    getSetting(SETTING_KEYS.BUSINESS_NAME),
  ]);

  const slotById = new Map(slotRows.map((s) => [s.id, s]));

  const now = new Date();
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:${PRODID}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(`${businessName} — Pickup`)}`,
    "X-WR-TIMEZONE:Asia/Makassar",
  ];

  for (const order of orders) {
    const slot = slotById.get(order.deliverySlotId);
    if (!slot) continue;
    const itemSummary = order.items
      .map((it) => `${it.quantity}× ${it.productName} (${it.variantName})`)
      .join(", ");
    const description = [
      `Pesanan: ${order.orderNumber}`,
      `Status: ${order.status}`,
      `Penerima: ${order.recipientName} (${order.recipientPhone})`,
      `Pengirim: ${order.senderName}`,
      itemSummary ? `Items: ${itemSummary}` : null,
      order.cardMessage ? `Pesan kartu: ${order.cardMessage}` : null,
      order.deliveryNotes ? `Catatan: ${order.deliveryNotes}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const dtStart = formatLocalDateTime(order.deliveryDate, slot.startTime);
    const dtEnd = formatLocalDateTime(order.deliveryDate, slot.endTime);

    lines.push("BEGIN:VEVENT");
    lines.push(foldLine(`UID:order-${order.id}@njsflorist.id`));
    lines.push(`DTSTAMP:${formatUtcTimestamp(now)}`);
    lines.push(`LAST-MODIFIED:${formatUtcTimestamp(order.updatedAt)}`);
    lines.push(`DTSTART:${dtStart}`);
    lines.push(`DTEND:${dtEnd}`);
    lines.push(
      foldLine(
        `SUMMARY:${escapeText(`Pickup ${order.orderNumber} — ${order.recipientName}`)}`,
      ),
    );
    lines.push(foldLine(`LOCATION:${escapeText(pickupAddress)}`));
    lines.push(foldLine(`DESCRIPTION:${escapeText(description)}`));
    lines.push(`STATUS:${order.status === "OUT_FOR_DELIVERY" ? "TENTATIVE" : "CONFIRMED"}`);
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}

export async function getCalendarFeedUrl(): Promise<{
  url: string | null;
  configured: boolean;
}> {
  const secret = env.CALENDAR_FEED_SECRET;
  if (!secret) return { url: null, configured: false };
  const base = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  return {
    url: `${base}/api/calendar/orders.ics?token=${encodeURIComponent(secret)}`,
    configured: true,
  };
}
