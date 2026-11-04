import assert from "node:assert/strict";
import { test } from "node:test";
import type { Prisma, PrismaClient } from "@prisma/client";
import { parseAdminOrderFilters } from "../src/lib/admin-order-filters";
import { settingUpdateSchema } from "../src/server/validations/settings.validation";
import { setStoreDayAvailability } from "../src/server/services/store-day.service";
import { pickupDateColumn } from "../src/lib/pickup-schedule";
import { loadTodayOrderSummary } from "../src/server/services/dashboard.service";
import { stockMovementInputSchema } from "../src/server/validations/inventory.validation";

test("order filters accept repeated native GET checkboxes and legacy comma-separated links", () => {
  assert.deepEqual(parseAdminOrderFilters({ status: ["PAID", "PREPARING", "PAID"] }).statuses, ["PAID", "PREPARING"]);
  assert.deepEqual(parseAdminOrderFilters({ status: "PAID,PREPARING" }).statuses, ["PAID", "PREPARING"]);
  assert.deepEqual(parseAdminOrderFilters({ status: ["INVALID", "PAID"] }).statuses, ["PAID"]);
});
test("order creation dates and pickup dates are independent filters in WITA", () => {
  const { filters, errors } = parseAdminOrderFilters({ from: "2026-11-04", to: "2026-11-04", pickup: "2026-11-06", store: "dalung" });
  assert.deepEqual(errors, []);
  assert.equal(filters.fromDate?.toISOString(), "2026-11-03T16:00:00.000Z");
  assert.equal(filters.toDate?.toISOString(), "2026-11-04T15:59:59.999Z");
  assert.equal(filters.pickupDate, "2026-11-06");
  assert.equal(filters.storeId, "dalung");
  assert.equal(filters.limit, 100);
});
test("malformed or reversed admin date filters produce an actionable error", () => {
  assert.equal(parseAdminOrderFilters({ from: "2026-02-31" }).errors.length, 1);
  assert.equal(parseAdminOrderFilters({ pickup: "not-a-date" }).errors.length, 1);
  const reversed = parseAdminOrderFilters({ from: "2026-11-05", to: "2026-11-04" });
  assert.match(reversed.errors[0], /Tanggal akhir/);
  assert.equal(reversed.filters.fromDate, undefined);
});
test("cutoff settings reject NaN, fractions, negative numbers and out-of-range hours", () => {
  for (const value of ["", "NaN", "24", "14.5", "-1", "Infinity", "14:00"]) assert.equal(settingUpdateSchema.safeParse({ key: "same_day_cutoff_hour", value }).success, false, value);
  for (const value of ["0", "14", "23"]) assert.equal(settingUpdateSchema.safeParse({ key: "same_day_cutoff_hour", value }).success, true);
});
test("service fee settings reject fractional, unsafe and negative rupiah amounts", () => {
  for (const value of ["", "-1", "0.5", "1e9", "1000000001", "Infinity"]) assert.equal(settingUpdateSchema.safeParse({ key: "delivery_fee", value }).success, false);
  assert.equal(settingUpdateSchema.safeParse({ key: "delivery_fee", value: "0" }).success, true);
  assert.equal(settingUpdateSchema.safeParse({ key: "business_name", value: "NJS Projects" }).success, true);
});
test("inventory rejects negative, zero-movement and fractional quantities before stock can change", () => {
  for (const type of ["IN", "OUT", "ADJUSTMENT"]) {
    for (const quantity of [-5, 1.5, NaN, Infinity]) assert.equal(stockMovementInputSchema.safeParse({ inventoryItemId: "rose", type, quantity }).success, false);
  }
  for (const type of ["IN", "OUT"]) assert.equal(stockMovementInputSchema.safeParse({ inventoryItemId: "rose", type, quantity: 0 }).success, false);
  assert.equal(stockMovementInputSchema.safeParse({ inventoryItemId: "rose", type: "ADJUSTMENT", quantity: 0 }).success, true);
});

test("whole-day close/open only updates the selected store and preserves custom capacities and notes", async () => {
  const operations: { name: string; input: unknown }[] = [];
  const tx = {
    deliverySlot: { findMany: async (input: unknown) => { operations.push({ name: "slots", input }); return [{ id: "a" }, { id: "b" }]; } },
    $executeRaw: async (_sql: unknown, key: string) => { operations.push({ name: "lock", input: key }); },
    deliverySlotOverride: { upsert: async (input: unknown) => { operations.push({ name: "upsert", input }); }, deleteMany: async (input: unknown) => { operations.push({ name: "delete", input }); } },
  };
  let transactions = 0;
  const client = { $transaction: async (callback: (client: typeof tx) => unknown) => { transactions++; return callback(tx); } } as unknown as Pick<PrismaClient, "$transaction">;
    for (const mode of ["close", "open"] as const) {
      operations.length = 0;
      assert.deepEqual(await setStoreDayAvailability("dalung", "2026-11-06", mode, client), { updated: 2 });
      assert.deepEqual(operations[0].input, { where: { storeId: "dalung" }, orderBy: { id: "asc" }, select: { id: true } });
      assert.deepEqual(operations.map((operation) => operation.name), ["slots", "lock", "lock", "upsert", "upsert"]);
      assert.equal(operations[1].input, "pickup:a:2026-11-06");
      const writes = operations.filter((operation) => operation.name === "upsert");
      for (const write of writes) {
        const input = write.input as { update: Record<string, unknown> };
        assert.deepEqual(input.update, { isActive: mode === "open" });
        assert.equal("capacity" in input.update, false);
        assert.equal("note" in input.update, false);
      }
    }
    assert.equal(transactions, 2);
});
test("reset-day removes only that store's overrides within one transaction", async () => {
  let deletion: unknown;
  const tx = { deliverySlot: { findMany: async () => [{ id: "dalung-a" }] }, $executeRaw: async () => 1,
    deliverySlotOverride: { deleteMany: async (input: unknown) => { deletion = input; } } };
  let transactions = 0;
  const client = { $transaction: async (callback: (client: typeof tx) => unknown) => { transactions++; return callback(tx); } } as unknown as Pick<PrismaClient, "$transaction">;
    await setStoreDayAvailability("dalung", "2026-11-06", "reset", client);
    assert.deepEqual(deletion, { where: { slotId: { in: ["dalung-a"] }, date: pickupDateColumn("2026-11-06") } });
    assert.equal(transactions, 1);
});
test("a store without slots fails without issuing any mutations", async () => {
  const tx = { deliverySlot: { findMany: async () => [] } };
  const client = { $transaction: async (callback: (client: typeof tx) => unknown) => callback(tx) } as unknown as Pick<PrismaClient, "$transaction">;
  await assert.rejects(() => setStoreDayAvailability("empty", "2026-11-06", "close", client), /belum memiliki slot/);
});
test("dashboard counts all grouped orders, rather than the six recent records", async () => {
  let queries = 0;
  const groupBy = async (input: { where: { createdAt?: unknown; deliveryDate?: unknown } }) => {
    queries++;
    return input.where.createdAt ? [{ status: "PAID", _count: { _all: 18 } }, { status: "PENDING_PAYMENT", _count: { _all: 7 } }]
      : [{ status: "PREPARING", _count: { _all: 9 } }, { status: "READY_FOR_DELIVERY", _count: { _all: 4 } }];
  };
    assert.deepEqual(await loadTodayOrderSummary({ order: { groupBy } } as unknown as Pick<Prisma.TransactionClient, "order">), { created: 25, pendingPayment: 7, pickups: 13, ready: 4 });
    assert.equal(queries, 2);
});
