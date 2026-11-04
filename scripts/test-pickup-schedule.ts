import assert from "node:assert/strict";
import { test } from "node:test";
import type { Prisma } from "@prisma/client";
import { addPickupDays, earliestPickupDate, isPickupDateKey, parsePickupDate, pickupDateColumn, pickupDateKey, pickupDayBounds, pickupSlotStatus } from "../src/lib/pickup-schedule";
import { getPickupAvailability, occupyingPickupOrders } from "../src/server/services/pickup-availability.service";
import { slotCreateSchema, slotUpdateSchema } from "../src/server/services/delivery-slot.service";
import { checkoutInputSchema } from "../src/server/validations/checkout.validation";
import { createMidtransSnapTransaction } from "../src/lib/midtrans";

test("Bali dates cross midnight independently of the host timezone", () => {
  for (const timezone of ["UTC", "America/Los_Angeles", "Asia/Makassar"]) {
    const previous = process.env.TZ;
    process.env.TZ = timezone;
    try {
      assert.equal(pickupDateKey(new Date("2026-11-04T15:59:59Z")), "2026-11-04");
      assert.equal(pickupDateKey(new Date("2026-11-04T16:00:00Z")), "2026-11-05");
      assert.equal(parsePickupDate("2026-11-05").toISOString(), "2026-11-04T16:00:00.000Z");
    } finally { if (previous === undefined) delete process.env.TZ; else process.env.TZ = previous; }
  }
});
test("invalid and rolled-over calendar dates are rejected", () => {
  for (const value of ["", "2026-02-29", "2026-02-31", "2026-13-01", "2026-1-04", "2026-11-04T00:00:00Z"]) {
    assert.equal(isPickupDateKey(value), false);
    assert.throws(() => parsePickupDate(value));
  }
  assert.equal(isPickupDateKey("2028-02-29"), true);
});
test("calendar arithmetic handles leap days and year boundaries", () => {
  assert.equal(addPickupDays("2026-12-31", 1), "2027-01-01");
  assert.equal(addPickupDays("2028-02-28", 1), "2028-02-29");
  assert.equal(addPickupDays("2026-03-01", -1), "2026-02-28");
});
test("day bounds and date-only columns deliberately use different representations", () => {
  const { start, end } = pickupDayBounds("2026-11-05");
  assert.equal(start.toISOString(), "2026-11-04T16:00:00.000Z");
  assert.equal(end.toISOString(), "2026-11-05T16:00:00.000Z");
  assert.equal(pickupDateColumn("2026-11-05").toISOString(), "2026-11-05T00:00:00.000Z");
});
test("same-day cutoff changes at exactly 14:00 WITA", () => {
  assert.equal(earliestPickupDate(14, new Date("2026-11-04T05:59:59Z")), "2026-11-04");
  assert.equal(earliestPickupDate(14, new Date("2026-11-04T06:00:00Z")), "2026-11-05");
});
const base = { date: "2026-11-04", startTime: "13:00", isActive: true, capacity: 4, booked: 2, cutoffHour: 14, now: new Date("2026-11-04T04:00:00Z") };
test("elapsed windows, closed days, zero capacity, full windows and cutoffs are distinct", () => {
  assert.equal(pickupSlotStatus(base), "available");
  assert.equal(pickupSlotStatus({ ...base, date: "2026-11-03" }), "past");
  assert.equal(pickupSlotStatus({ ...base, startTime: "12:00" }), "past");
  assert.equal(pickupSlotStatus({ ...base, isActive: false }), "closed");
  assert.equal(pickupSlotStatus({ ...base, capacity: 0 }), "closed");
  assert.equal(pickupSlotStatus({ ...base, booked: 4 }), "full");
  assert.equal(pickupSlotStatus({ ...base, now: new Date("2026-11-04T06:00:00Z") }), "cutoff");
});
test("payment holds use a strict 15-minute expiry boundary", () => {
  const query = occupyingPickupOrders(new Date("2026-11-04T04:15:00Z"));
  const pending = query.OR?.[1];
  assert.equal(pending?.status, "PENDING_PAYMENT");
  assert.deepEqual(pending?.createdAt, { gt: new Date("2026-11-04T04:00:00Z") });
});
test("availability merges overrides, aggregates legacy times and never exposes staff notes", async () => {
  const reads: unknown[] = [];
  const client = {
    deliverySlot: { findMany: async (args: unknown) => { reads.push(args); return [
      { id: "morning", label: "Pagi", startTime: "10:00", endTime: "12:00", capacity: 4, isActive: true },
      { id: "evening", label: "Sore", startTime: "16:00", endTime: "18:00", capacity: 4, isActive: false },
    ]; } },
    deliverySlotOverride: { findMany: async () => [
      { slotId: "morning", date: pickupDateColumn("2026-11-05"), capacity: 2, isActive: null, note: "PRIVATE STAFF NOTE" },
      { slotId: "evening", date: pickupDateColumn("2026-11-05"), capacity: 3, isActive: true },
      { slotId: "morning", date: pickupDateColumn("2026-11-06"), capacity: null, isActive: false },
    ] },
    order: { groupBy: async (args: unknown) => { reads.push(args); return [
      { deliverySlotId: "morning", deliveryDate: parsePickupDate("2026-11-05"), _count: { _all: 1 } },
      { deliverySlotId: "morning", deliveryDate: new Date("2026-11-05T01:00:00Z"), _count: { _all: 1 } },
    ]; } },
  } as unknown as Pick<Prisma.TransactionClient, "deliverySlot" | "deliverySlotOverride" | "order">;
  const result = await getPickupAvailability("dalung", "2026-11-05", "2026-11-06", { client, cutoffHour: 14, now: base.now });
  assert.equal(result.days.length, 2);
  assert.equal(result.days[0].slots[0].status, "full");
  assert.equal(result.days[0].slots[0].remaining, 0);
  assert.equal(result.days[0].slots[1].status, "available");
  assert.equal(result.days[0].slots[1].remaining, 3);
  assert.equal(result.days[1].slots[0].status, "closed");
  assert.equal(result.days[1].slots[1].status, "closed");
  assert.equal(JSON.stringify(result).includes("PRIVATE"), false);
  assert.deepEqual(reads[0], { where: { storeId: "dalung" }, orderBy: { startTime: "asc" } });
});
test("slot templates reject reversed, equal or invalid times", () => {
  const input = { storeId: "dalung", label: "Pagi", startTime: "10:00", endTime: "12:00", capacity: 4 };
  assert.equal(slotCreateSchema.safeParse(input).success, true);
  for (const endTime of ["09:00", "10:00", "25:00"]) assert.equal(slotCreateSchema.safeParse({ ...input, endTime }).success, false);
  assert.equal(slotUpdateSchema.safeParse({ id: "slot", startTime: "15:00", endTime: "12:00" }).success, false);
});
test("checkout rejects unusable phone numbers and whitespace-only names", () => {
  const input = { cartId: "cart", storeId: "store", recipient: { name: "Ayu", phone: "+62 812-3456-7890", senderName: "Made" }, delivery: { date: parsePickupDate("2026-11-05"), slotId: "morning" } };
  assert.equal(checkoutInputSchema.safeParse(input).success, true);
  for (const phone of ["hellohello", "1234567", "1234567890123456", "........"]) {
    assert.equal(checkoutInputSchema.safeParse({ ...input, recipient: { ...input.recipient, phone } }).success, false);
  }
  assert.equal(checkoutInputSchema.safeParse({ ...input, recipient: { ...input.recipient, name: "  " } }).success, false);
});
test("Midtrans expiry starts at order creation and matches the slot hold", async () => {
  const previousFetch = globalThis.fetch;
  const previousKey = process.env.MIDTRANS_SERVER_KEY;
  process.env.MIDTRANS_SERVER_KEY = "test-key";
  let body: Record<string, unknown> = {};
  globalThis.fetch = async (_url, init) => {
    body = JSON.parse(String(init?.body));
    return Response.json({ token: "test-token", redirect_url: "https://example.test/pay" });
  };
  try {
    await createMidtransSnapTransaction({ orderNumber: "test-order", total: 1000, createdAt: new Date("2026-11-04T04:00:00Z"), items: [{ id: "flower", name: "Flower", price: 1000, quantity: 1 }] });
    assert.deepEqual(body.expiry, { start_time: "2026-11-04 04:00:00 +0000", unit: "minutes", duration: 15 });
    assert.deepEqual(body.page_expiry, { unit: "minutes", duration: 15 });
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.MIDTRANS_SERVER_KEY; else process.env.MIDTRANS_SERVER_KEY = previousKey;
  }
});
