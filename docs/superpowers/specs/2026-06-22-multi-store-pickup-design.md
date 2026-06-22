# Multi-Store Pickup — Design Spec

**Date:** 2026-06-22
**Status:** Approved for planning

## Problem

njs Florist now operates from **two physical store locations**, but the app is
built for a single store. Today:

- The app is **pickup-only** (the `Order` model's `delivery*` fields are
  repurposed for pickup).
- There is **one** store address, stored as the `pickup_address` app setting
  (default `"Jl. Sunset Road No. 88, Kuta, Bali"`).
- Checkout displays that single address; the customer never chooses a location.
- Pickup time **slots are global** (one shared `DeliverySlot` list + capacity).
- The admin orders list filters by status / search / date — there is **no
  store dimension**.

We need: customers choose which store to pick up from at checkout, and admins
can track and filter orders per store.

## Decisions (confirmed)

1. **Data model:** a proper `Store` table with an `Order.storeId` foreign key.
   Not lightweight settings entries. Scales beyond two stores and keeps order
   history accurate when an address is edited.
2. **Slots:** are **per-store**. Each `DeliverySlot` belongs to one store via a
   `storeId` foreign key. The customer's slot choices at checkout are filtered
   to the selected store, and each store's capacity is counted independently
   (its slots are distinct rows). The admin slot manager is scoped by store.
3. **Admin view:** add a **store filter + store column** to the existing orders
   list. No separate page per store. Analytics gets a per-store breakdown.
4. **Store 2 seed:** seeded with editable placeholder text; the owner edits the
   real address in admin.
5. **Per-store phone:** included as an optional field; address remains the
   primary store attribute.

## Architecture

### Data model (`src/prisma/schema.prisma`)

New model:

```prisma
model Store {
  id        String   @id @default(cuid())
  name      String
  address   String
  phone     String?
  mapsUrl   String?
  sortOrder Int      @default(0)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  orders Order[]
}
```

`Order` changes:

```prisma
  storeId String
  store   Store  @relation(fields: [storeId], references: [id])

  @@index([storeId, status])
```

`DeliverySlot` changes (per-store slots):

```prisma
  storeId String
  store   Store  @relation(fields: [storeId], references: [id])

  @@index([storeId])
```

And `Store` gains `slots DeliverySlot[]`. `DeliverySlotOverride` is unchanged —
it stays keyed by `slotId`, which now transitively belongs to a store.

### Migration & backfill (ordered, single migration)

1. Create the `Store` table.
2. Insert **Store 1** using the current `pickup_address` value
   (`name = business_name + " — Store 1"`, `address = <current pickup_address>`,
   `sortOrder = 0`).
3. Insert **Store 2** with placeholder text
   (`address = "Alamat toko kedua — ubah di Pengaturan"`, `sortOrder = 1`).
4. Add `Order.storeId` as **nullable**, backfill **all existing orders** to
   Store 1's id, then alter the column to **NOT NULL**.
5. Add `DeliverySlot.storeId` as **nullable**, backfill **all existing slots**
   to Store 1's id, then alter to **NOT NULL**. (Existing slots become Store 1's
   schedule; the owner adds Store 2's slots in admin.)
6. Add the `@@index([storeId, status])` on `Order` and `@@index([storeId])` on
   `DeliverySlot`.

The legacy `pickup_address` setting key is **retired from the settings UI** but
left in the DB/`DEFAULT_SETTINGS` so nothing reading it breaks mid-migration.
Seed script (`src/prisma/seed.ts`) is updated to upsert the two stores
idempotently.

### Customer checkout

- **`CheckoutForm`** (`src/components/checkout/checkout-form.tsx`): replace the
  static "Pickup di toko" address box with a **required store picker** — radio
  cards, one per active store, each showing name + address (+ phone if set).
  First active store is pre-selected. Because slots are per-store, the form
  tracks the selected `storeId` in client state and **filters the slot dropdown
  to that store's slots** (selecting a different store re-populates the slot
  options). Radio input name: `storeId`; slot select name: `slotId`.
- **Checkout page** (`src/app/(store)/checkout/page.tsx`): load active stores
  (ordered by `sortOrder`) and active slots **including each slot's `storeId`**,
  instead of the single `pickup_address` setting; pass both to the form so it
  can group slots by store on the client.
- **`submitCheckoutAction`** (`src/server/actions/checkout.actions.ts`): read
  `storeId` from form data; require it alongside the other mandatory fields.
- **`checkoutInputSchema`** (`src/server/validations/checkout.validation.ts`):
  add `storeId: z.string().min(1)`.
- **`createCheckoutOrder`** (`src/server/services/checkout.service.ts`):
  validate the store exists and `isActive`; persist `storeId` on the order.
  Reject inactive/unknown store with a clear error.
- **`validateDeliverySlot`** (`src/server/services/delivery.service.ts`): gains a
  `storeId` argument and asserts the chosen slot **belongs to that store**
  (`slot.storeId === storeId`), rejecting mismatches. Capacity counting is
  unchanged — because each store's slots are distinct rows, the existing
  count-by-`deliverySlotId` is already scoped per store.

### Customer-facing display

The chosen store's address (and phone, if set) replaces the global
`pickup_address` everywhere a **customer** sees pickup info. Each surface reads
`order.store` (include it in the relevant queries):

- Order confirmation **email** (`src/lib/resend.ts` / email builder).
- Public **track** page (`src/app/(store)/track/[orderNumber]`).
- **Account** order detail (`src/app/(store)/account/orders/[orderNumber]`).
- **Invoice** (`src/app/admin/invoices/[orderNumber]/page.tsx`) — uses
  `order.store.address` instead of `settings.pickup_address`.

### Admin

- **Orders list** (`src/app/admin/orders/page.tsx` + `listOrders` in
  `src/server/services/order.service.ts`): add `storeId?: string` to the
  `listOrders` filter (`where.storeId = ...`); include `store` in the result;
  render a **store filter** (chips/dropdown of active stores, mirroring the
  status filter, driven by a `store` search param) and a **store column/badge**
  per row.
- **Order detail** (`src/app/admin/orders/[id]`): show the store name + address.
- **Stores management:** a new **"Toko"** section in admin Settings
  (`src/components/admin/settings-form.tsx` or a dedicated stores panel +
  server action) to list / add / edit / deactivate stores
  (name, address, phone, mapsUrl, isActive, sortOrder). A `Store` service
  (`src/server/services/store.service.ts`) holds `listStores`,
  `listActiveStores`, `createStore`, `updateStore`, `setStoreActive` with zod
  validation.
- **Slot manager** (`src/app/admin/delivery`): slots are created and listed
  **per store**. The create form (`slot-create-form.tsx`) gains a store selector;
  `createDeliverySlot` + its action + schema accept `storeId`; the page groups
  the slot list by store. `listAllDeliverySlots` includes the store relation.
- **Analytics** (`src/app/admin/analytics`): add a per-store breakdown
  (order count + revenue grouped by `storeId`).
- **Calendar feed** (`src/server/services/calendar-feed.service.ts`): event
  `LOCATION` uses the order's `store.address` instead of the global
  `pickup_address` setting.

## Components & boundaries

| Unit | Responsibility | Depends on |
|------|----------------|------------|
| `Store` model + migration | Persist stores; FK from orders | Prisma |
| `store.service.ts` | Store CRUD + active-store reads + validation | db, zod |
| `CheckoutForm` store picker | Let customer pick a store + filter slots | active stores + slots |
| `createCheckoutOrder` | Validate store + slot-store match; persist `storeId` | store.service, delivery.service |
| Admin slot manager | Manage slots per store | delivery-slot.service, store.service |
| `listOrders` store filter | Query orders by store | db |
| Admin stores panel | Manage stores | store.service |
| Customer display surfaces | Show `order.store` address | order.store include |

## Error handling

- Checkout with missing `storeId` → form validation error
  ("Pilih toko pickup.").
- Checkout with unknown/inactive `storeId` → service throws; surfaced as a
  checkout error. (Guards against a store deactivated mid-session.)
- Deactivating a store must **not** break existing orders — `storeId` FK
  remains valid; inactive stores are simply hidden from the checkout picker.
- Store CRUD: name + address required; reject blank.

## Testing

- **Checkout validation:** rejects missing `storeId`; rejects inactive/unknown
  store; persists valid `storeId`.
- **`listOrders`:** `storeId` filter returns only that store's orders;
  combines correctly with status/date/q filters.
- **`store.service`:** create/update validation (blank name/address rejected);
  `listActiveStores` excludes inactive and orders by `sortOrder`.
- **Slot-store match:** `validateDeliverySlot` rejects a slot whose `storeId`
  differs from the order's chosen store.
- **Migration:** every pre-existing order **and** every pre-existing slot ends
  up with a non-null `storeId` pointing at Store 1.

## Out of scope (YAGNI)

- Per-store inventory/stock separation.
- Delivery (the app remains pickup-only).
- More than the seeded two stores at launch (the model supports N; admin can
  add more later).
