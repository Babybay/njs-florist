# Multi-Store Pickup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let customers choose which of two physical stores to pick up from at checkout, and let admins filter/track orders per store.

**Architecture:** Add a `Store` Prisma model with an `Order.storeId` foreign key. Seed two stores (migrating the existing `pickup_address` into Store 1). Add a required store picker to checkout, surface the chosen store's address on every customer-facing pickup display, and add a store filter + column to the admin orders list plus a per-store analytics breakdown. Pickup time slots stay global.

**Tech Stack:** Next.js 16 (App Router, Server Components, Server Actions), Prisma 6 + PostgreSQL, Zod 4, Tailwind 4, Resend (email).

## Global Constraints

- **No test runner.** Verify every task with `npx tsc --noEmit` (type-check) and `npm run build` (must succeed), plus the manual steps stated in each task. Do not add vitest/jest.
- **Pickup-only.** The app does not do delivery; the `Order.delivery*` fields are repurposed for pickup. Do not rename them.
- **Prisma schema path:** all prisma commands take `--schema src/prisma/schema.prisma` (already wired into `npm run db:*` scripts).
- **Money is stored as integer IDR** (no decimals). Use `formatIDR` from `src/lib/money.ts` for display.
- **UI copy is Indonesian.** Match existing tone (e.g. "Pilih toko", "Toko pickup").
- **Follow existing patterns:** server logic in `src/server/services/*.service.ts`, server actions in `src/server/actions/*.actions.ts`, zod schemas in `src/server/validations/`. Settings UI uses the `Section`/`Field` helpers in `src/components/admin/settings-form.tsx`.
- `pickup_address` setting key stays in `DEFAULT_SETTINGS` (do not delete it) but is removed from the settings form UI.
- Commit after each task with a `feat:`/`refactor:` message. End every commit message with `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

---

### Task 1: `Store` model, migration, backfill, seed, and store service

**Files:**
- Modify: `src/prisma/schema.prisma` (add `Store` model; add `storeId`/`store`/index to `Order`)
- Create: `src/prisma/migrations/<timestamp>_add_stores/migration.sql` (generated then hand-edited)
- Create: `src/server/services/store.service.ts`
- Modify: `src/prisma/seed.ts` (upsert two stores idempotently)

**Interfaces:**
- Produces:
  - Prisma `Store { id, name, address, phone?, mapsUrl?, sortOrder, isActive, createdAt, updatedAt, orders }`
  - `Order.storeId: string` (NOT NULL) + `Order.store` relation
  - `store.service.ts` exports:
    - `listStores(): Promise<Store[]>` — all stores, ordered by `sortOrder` asc
    - `listActiveStores(): Promise<Store[]>` — `isActive: true`, ordered by `sortOrder` asc
    - `getStore(id: string): Promise<Store | null>`
    - `createStore(input: unknown): Promise<Store>`
    - `updateStore(id: string, input: unknown): Promise<Store>`
    - `setStoreActive(id: string, isActive: boolean): Promise<Store>`
    - `storeInputSchema` (zod) — `{ name: string(min1), address: string(min1), phone?: string, mapsUrl?: string, sortOrder?: number, isActive?: boolean }`

- [ ] **Step 1: Add the `Store` model and `Order` columns to the schema**

In `src/prisma/schema.prisma`, add this model (place it after the `User` model):

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

In the `Order` model, add the relation field (next to `userId`) — keep it nullable in the schema for now so the migration can backfill before enforcing:

```prisma
  storeId String?
  store   Store?  @relation(fields: [storeId], references: [id])
```

And add this index alongside the existing `Order` indexes:

```prisma
  @@index([storeId, status])
```

- [ ] **Step 2: Generate the migration as create-only (do not apply yet)**

Run: `npx prisma migrate dev --schema src/prisma/schema.prisma --name add_stores --create-only`
Expected: a new folder `src/prisma/migrations/<timestamp>_add_stores/` containing `migration.sql` that creates the `Store` table, adds nullable `storeId`, the FK, and the index. No data is applied yet.

- [ ] **Step 3: Hand-edit the migration to seed two stores and backfill orders**

Open the generated `migration.sql`. **After** the `CREATE TABLE "Store"` statement and **before** the `ALTER TABLE "Order" ... ADD CONSTRAINT` foreign-key line, insert the seed + backfill SQL below. (Postgres runs statements top-to-bottom, so the stores must exist before backfill.)

```sql
-- Seed two stores. Store 1 inherits the current pickup_address setting if present.
INSERT INTO "Store" ("id", "name", "address", "sortOrder", "isActive", "createdAt", "updatedAt")
VALUES (
  'store_seed_1',
  'njs Florist — Store 1',
  COALESCE((SELECT "value" FROM "AppSetting" WHERE "key" = 'pickup_address'), 'Jl. Sunset Road No. 88, Kuta, Bali'),
  0, true, now(), now()
);

INSERT INTO "Store" ("id", "name", "address", "sortOrder", "isActive", "createdAt", "updatedAt")
VALUES (
  'store_seed_2',
  'njs Florist — Store 2',
  'Alamat toko kedua — ubah di Pengaturan',
  1, true, now(), now()
);

-- Backfill every existing order to Store 1.
UPDATE "Order" SET "storeId" = 'store_seed_1' WHERE "storeId" IS NULL;
```

Then append at the very end of the file (after the FK + index), to enforce NOT NULL now that every row has a value:

```sql
ALTER TABLE "Order" ALTER COLUMN "storeId" SET NOT NULL;
```

- [ ] **Step 4: Apply the migration**

Run: `npx prisma migrate dev --schema src/prisma/schema.prisma`
Expected: migration applies cleanly; `prisma generate` runs. No "column contains null values" error (the backfill ran first).

- [ ] **Step 5: Make the schema match the enforced NOT NULL**

Now that the DB column is NOT NULL, update `src/prisma/schema.prisma` to drop the `?` so the Prisma client types match:

```prisma
  storeId String
  store   Store  @relation(fields: [storeId], references: [id])
```

Run: `npx prisma generate --schema src/prisma/schema.prisma`
Expected: client regenerates; `order.storeId` is typed `string` (non-null).

- [ ] **Step 6: Create the store service**

Create `src/server/services/store.service.ts`:

```typescript
import { z } from "zod";
import { db } from "@/lib/db";

export const storeInputSchema = z.object({
  name: z.string().min(1, "Nama toko wajib diisi.").max(120),
  address: z.string().min(1, "Alamat toko wajib diisi.").max(500),
  phone: z.string().max(40).optional().or(z.literal("")),
  mapsUrl: z.string().max(500).optional().or(z.literal("")),
  sortOrder: z.coerce.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

function normalize(input: z.infer<typeof storeInputSchema>) {
  return {
    name: input.name,
    address: input.address,
    phone: input.phone ? input.phone : null,
    mapsUrl: input.mapsUrl ? input.mapsUrl : null,
    sortOrder: input.sortOrder ?? 0,
    isActive: input.isActive ?? true,
  };
}

export function listStores() {
  return db.store.findMany({ orderBy: { sortOrder: "asc" } });
}

export function listActiveStores() {
  return db.store.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } });
}

export function getStore(id: string) {
  return db.store.findUnique({ where: { id } });
}

export async function createStore(input: unknown) {
  const data = normalize(storeInputSchema.parse(input));
  return db.store.create({ data });
}

export async function updateStore(id: string, input: unknown) {
  const data = normalize(storeInputSchema.parse(input));
  return db.store.update({ where: { id }, data });
}

export function setStoreActive(id: string, isActive: boolean) {
  return db.store.update({ where: { id }, data: { isActive } });
}
```

- [ ] **Step 7: Make the seed idempotent**

In `src/prisma/seed.ts`, add a store upsert near the other seed data (use the same ids the migration used so reseeding a fresh DB matches). Insert this inside the seed's main function:

```typescript
  await prisma.store.upsert({
    where: { id: "store_seed_1" },
    update: {},
    create: {
      id: "store_seed_1",
      name: "njs Florist — Store 1",
      address: "Jl. Sunset Road No. 88, Kuta, Bali",
      sortOrder: 0,
      isActive: true,
    },
  });
  await prisma.store.upsert({
    where: { id: "store_seed_2" },
    update: {},
    create: {
      id: "store_seed_2",
      name: "njs Florist — Store 2",
      address: "Alamat toko kedua — ubah di Pengaturan",
      sortOrder: 1,
      isActive: true,
    },
  });
```

(If `seed.ts` uses a different prisma client variable name, match it.)

- [ ] **Step 8: Verify**

Run: `npx tsc --noEmit`
Expected: no type errors.
Run: `npx prisma studio --schema src/prisma/schema.prisma` (optional) and confirm the `Store` table has 2 rows and every `Order` has a `storeId`. Alternatively run a quick query in studio or psql: every order's `storeId` is non-null and points at `store_seed_1`.

- [ ] **Step 9: Commit**

```bash
git add src/prisma/schema.prisma src/prisma/migrations src/prisma/seed.ts src/server/services/store.service.ts
git commit -m "feat(store): add Store model, migration, backfill, and store service"
```

---

### Task 2: Admin store management UI

**Files:**
- Create: `src/server/actions/store.actions.ts`
- Create: `src/components/admin/stores-panel.tsx`
- Modify: `src/app/admin/settings/page.tsx` (load stores, render the panel)

**Interfaces:**
- Consumes: `listStores`, `createStore`, `updateStore`, `setStoreActive` from `store.service.ts` (Task 1).
- Produces:
  - `store.actions.ts` exports `createStoreAction(formData: FormData)`, `updateStoreAction(id: string, formData: FormData)`, `toggleStoreActiveAction(id: string, isActive: boolean)` — each `"use server"`, each calls `revalidatePath("/admin/settings")` after writing.

- [ ] **Step 1: Create the store server actions**

Create `src/server/actions/store.actions.ts`:

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { createStore, updateStore, setStoreActive } from "@/server/services/store.service";

function read(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    address: String(formData.get("address") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    mapsUrl: String(formData.get("mapsUrl") ?? "").trim(),
    sortOrder: Number(formData.get("sortOrder") ?? 0),
    isActive: formData.get("isActive") === "on",
  };
}

export async function createStoreAction(formData: FormData) {
  await createStore(read(formData));
  revalidatePath("/admin/settings");
}

export async function updateStoreAction(id: string, formData: FormData) {
  await updateStore(id, read(formData));
  revalidatePath("/admin/settings");
}

export async function toggleStoreActiveAction(id: string, isActive: boolean) {
  await setStoreActive(id, isActive);
  revalidatePath("/admin/settings");
}
```

- [ ] **Step 2: Build the stores panel component**

Create `src/components/admin/stores-panel.tsx`. It renders each store as an editable form plus an "add store" form. Use the existing `Button` and `inputClass` from `@/components/admin/ui`.

```tsx
"use client";

import { useTransition } from "react";
import { Button, inputClass } from "@/components/admin/ui";
import {
  createStoreAction,
  updateStoreAction,
  toggleStoreActiveAction,
} from "@/server/actions/store.actions";

type Store = {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  mapsUrl: string | null;
  sortOrder: number;
  isActive: boolean;
};

export function StoresPanel({ stores }: { stores: Store[] }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="grid gap-4 rounded-lg border border-stone-200/80 bg-white p-5">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
        Toko pickup
      </p>

      {stores.map((store) => (
        <form
          key={store.id}
          action={(fd) => startTransition(() => updateStoreAction(store.id, fd))}
          className="grid gap-2 rounded-md border border-stone-200 p-3"
        >
          <div className="grid gap-2 sm:grid-cols-2">
            <input name="name" defaultValue={store.name} placeholder="Nama toko" className={inputClass()} />
            <input name="phone" defaultValue={store.phone ?? ""} placeholder="Telepon (opsional)" className={inputClass()} />
          </div>
          <input name="address" defaultValue={store.address} placeholder="Alamat" className={inputClass()} />
          <input name="mapsUrl" defaultValue={store.mapsUrl ?? ""} placeholder="Link Google Maps (opsional)" className={inputClass()} />
          <div className="grid gap-2 sm:grid-cols-[120px_auto]">
            <input name="sortOrder" type="number" min={0} defaultValue={store.sortOrder} placeholder="Urutan" className={inputClass()} />
            <label className="flex items-center gap-2 text-sm text-stone-700">
              <input type="checkbox" name="isActive" defaultChecked={store.isActive} className="h-4 w-4 accent-black" />
              Aktif (tampil di checkout)
            </label>
          </div>
          <div className="flex items-center gap-2">
            <Button type="submit" variant="primary" disabled={pending}>Simpan toko</Button>
            <button
              type="button"
              onClick={() => startTransition(() => toggleStoreActiveAction(store.id, !store.isActive))}
              className="text-xs font-medium text-stone-500 hover:text-stone-900"
            >
              {store.isActive ? "Nonaktifkan" : "Aktifkan"}
            </button>
          </div>
        </form>
      ))}

      <form
        action={(fd) => startTransition(() => createStoreAction(fd))}
        className="grid gap-2 rounded-md border border-dashed border-stone-300 p-3"
      >
        <p className="text-xs font-semibold text-stone-600">Tambah toko baru</p>
        <input name="name" placeholder="Nama toko" required className={inputClass()} />
        <input name="address" placeholder="Alamat" required className={inputClass()} />
        <input name="phone" placeholder="Telepon (opsional)" className={inputClass()} />
        <input name="mapsUrl" placeholder="Link Google Maps (opsional)" className={inputClass()} />
        <input name="sortOrder" type="number" min={0} defaultValue={0} className={inputClass()} />
        <label className="flex items-center gap-2 text-sm text-stone-700">
          <input type="checkbox" name="isActive" defaultChecked className="h-4 w-4 accent-black" />
          Aktif
        </label>
        <Button type="submit" disabled={pending}>Tambah toko</Button>
      </form>
    </div>
  );
}
```

- [ ] **Step 3: Render the panel on the settings page and drop the legacy address field**

In `src/app/admin/settings/page.tsx`, import `listStores` and `StoresPanel`, load the stores, and render `<StoresPanel stores={stores} />` near the existing settings form. Then, in `src/components/admin/settings-form.tsx`, delete the `pickup_address` `<Field>` (lines defining `name="pickup_address"`) since the address now lives on the Store record. Leave the rest of the "Pickup" section (`same_day_cutoff_hour`, `delivery_fee`) intact.

Add to `src/app/admin/settings/page.tsx` (adapt to the file's existing structure):

```tsx
import { listStores } from "@/server/services/store.service";
import { StoresPanel } from "@/components/admin/stores-panel";
// ...
const stores = await listStores();
// ...render inside the page body:
<StoresPanel stores={stores} />
```

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit`
Expected: no type errors.
Run: `npm run build`
Expected: build succeeds.
Manual: start `npm run dev`, open `/admin/settings`, confirm both stores appear, edit Store 2's address and save (page revalidates with the new value), and confirm the old "Alamat pickup" single field is gone.

- [ ] **Step 5: Commit**

```bash
git add src/server/actions/store.actions.ts src/components/admin/stores-panel.tsx src/app/admin/settings/page.tsx src/components/admin/settings-form.tsx
git commit -m "feat(admin): manage pickup stores from settings"
```

---

### Task 3: Customer checkout store picker

**Files:**
- Modify: `src/server/validations/checkout.validation.ts` (add `storeId`)
- Modify: `src/server/services/checkout.service.ts` (validate + persist `storeId`)
- Modify: `src/server/actions/checkout.actions.ts` (read + pass `storeId`)
- Modify: `src/components/checkout/checkout-form.tsx` (store picker UI)
- Modify: `src/app/(store)/checkout/page.tsx` (load active stores)

**Interfaces:**
- Consumes: `listActiveStores` from `store.service.ts` (Task 1).
- Produces: orders persisted with a validated `storeId`.

- [ ] **Step 1: Add `storeId` to the checkout schema**

In `src/server/validations/checkout.validation.ts`, add `storeId` to the top-level object:

```typescript
export const checkoutInputSchema = z.object({
  cartId: z.string().min(1),
  userId: z.string().optional(),
  storeId: z.string().min(1),
  recipient: z.object({
    name: z.string().min(1),
    phone: z.string().min(1),
    senderName: z.string().min(1),
    isAnonymous: z.boolean().default(false),
    cardMessage: z.string().max(300).optional(),
  }),
  delivery: z.object({
    date: z.coerce.date(),
    slotId: z.string().min(1),
    address: z.string().optional().default(""),
    notes: z.string().optional(),
  }),
  discountCode: z.string().optional(),
});
```

- [ ] **Step 2: Validate + persist the store in the checkout service**

In `src/server/services/checkout.service.ts`:

Add near the top with the other imports:

```typescript
import { getStore } from "@/server/services/store.service";
```

After the cart is loaded and before `validateDeliverySlot` (around line 37), validate the store:

```typescript
  const store = await getStore(parsed.storeId);
  if (!store || !store.isActive) {
    throw new Error("Toko pickup tidak valid. Silakan pilih toko lain.");
  }
```

In the `tx.order.create({ data: { ... } })` block, add `storeId` to the data object (next to `userId`):

```typescript
          userId: parsed.userId,
          storeId: parsed.storeId,
```

- [ ] **Step 3: Read `storeId` in the checkout action**

In `src/server/actions/checkout.actions.ts`:

After the other `formData.get` reads (around line 33), add:

```typescript
  const storeId = String(formData.get("storeId") ?? "");
```

Update the required-fields guard (around line 35) to include the store:

```typescript
  if (!recipientName || !recipientPhone || !senderName || !deliveryDateRaw || !slotId || !storeId) {
    return { error: "Mohon lengkapi semua field wajib (termasuk toko pickup)." };
  }
```

Pass `storeId` into `createCheckoutOrder` (around line 48):

```typescript
    result = await createCheckoutOrder({
      cartId: cart.id,
      userId: sessionUser?.id,
      storeId,
      recipient: { name: recipientName, phone: recipientPhone, senderName, isAnonymous, cardMessage },
      delivery: { date: deliveryDate, slotId, address: "", notes },
      discountCode,
    });
```

- [ ] **Step 4: Replace the static address box with a store picker in the form**

In `src/components/checkout/checkout-form.tsx`:

Replace the `pickupAddress: string` prop with a `stores` prop and render radio cards. Change the props type and the static box. New top of the component:

```tsx
type Store = {
  id: string;
  name: string;
  address: string;
  phone: string | null;
};

export function CheckoutForm({
  slots,
  minDate,
  stores,
}: {
  slots: Slot[];
  minDate: string;
  stores: Store[];
}) {
  const [state, formAction, pending] = useActionState(submitCheckoutAction, initialState);
```

Replace the existing "Pickup di toko" box (the `<div>` at lines 34–37) with:

```tsx
      <fieldset className="grid gap-2 rounded-md border border-black/15 bg-[color:var(--blush)] px-4 py-3 text-sm text-black">
        <legend className="font-semibold uppercase tracking-[0.14em]">Pilih toko pickup *</legend>
        {stores.map((store, i) => (
          <label key={store.id} className="flex cursor-pointer gap-3 rounded-md border border-black/10 bg-white/70 p-3 has-[:checked]:border-black has-[:checked]:bg-white">
            <input
              type="radio"
              name="storeId"
              value={store.id}
              required
              defaultChecked={i === 0}
              className="mt-1 h-4 w-4 accent-black"
            />
            <span className="grid gap-0.5">
              <span className="font-semibold">{store.name}</span>
              <span className="text-black/75">{store.address}</span>
              {store.phone ? <span className="text-black/55">{store.phone}</span> : null}
            </span>
          </label>
        ))}
      </fieldset>
```

- [ ] **Step 5: Load active stores on the checkout page**

In `src/app/(store)/checkout/page.tsx`:

Add the import:

```typescript
import { listActiveStores } from "@/server/services/store.service";
```

Replace the `getSetting(SETTING_KEYS.PICKUP_ADDRESS)` entry in the `Promise.all` with `listActiveStores()`, and rename the destructured variable:

```typescript
  const [cart, slots, deliveryFee, cutoffHour, stores] = await Promise.all([
    loadActiveCartAction(),
    listActiveDeliverySlots(),
    getDeliveryFee(),
    getSettingNumber(SETTING_KEYS.SAME_DAY_CUTOFF_HOUR),
    listActiveStores(),
  ]);
```

Update the `<CheckoutForm .../>` call (line 84):

```tsx
          <CheckoutForm slots={slots} minDate={minDeliveryDate(cutoffHour)} stores={stores} />
```

(If `getSetting`/`SETTING_KEYS` become unused after this, remove the now-dead import to keep the build clean — but `SETTING_KEYS` is still used for `SAME_DAY_CUTOFF_HOUR`, so keep it.)

- [ ] **Step 6: Verify**

Run: `npx tsc --noEmit`
Expected: no type errors.
Run: `npm run build`
Expected: build succeeds.
Manual: `npm run dev`, add an item to cart, go to `/checkout`, confirm both stores render as radio cards with the first pre-selected. Complete a checkout and confirm (in Prisma Studio or the admin order detail) the new order's `storeId` matches the picked store.

- [ ] **Step 7: Commit**

```bash
git add src/server/validations/checkout.validation.ts src/server/services/checkout.service.ts src/server/actions/checkout.actions.ts src/components/checkout/checkout-form.tsx "src/app/(store)/checkout/page.tsx"
git commit -m "feat(checkout): let customer choose pickup store"
```

---

### Task 4: Show the chosen store on customer-facing surfaces

**Files:**
- Modify: `src/server/services/notification.service.ts` (confirmation email)
- Modify: `src/app/(store)/track/[orderNumber]/page.tsx` (public track page)
- Modify: `src/app/(store)/account/orders/[orderNumber]/page.tsx` (account order detail)
- Modify: `src/app/admin/invoices/[orderNumber]/page.tsx` (invoice)

**Interfaces:**
- Consumes: `Order.store` relation (Task 1). Each query that renders pickup info must `include: { store: true }`.

- [ ] **Step 1: Include the store in the confirmation email and show its address**

In `src/server/services/notification.service.ts`, in `sendOrderConfirmationEmail`, add `store: true` to the `include`:

```typescript
    include: {
      user: true,
      items: true,
      store: true,
    },
```

Then change the pickup sentence in the email HTML (line ~34) to name the store and address:

```typescript
      <p>Datang ke <strong>${order.store.name}</strong> (${order.store.address}) dengan menyebut nomor pesanan ${order.orderNumber}.</p>
```

- [ ] **Step 2: Show the store on the public track page**

In `src/app/(store)/track/[orderNumber]/page.tsx`, add `store: true` to the order `include`, then add a row next to the existing "Jadwal pickup" `<dt>/<dd>` pair (around line 82):

```tsx
              <dt className="text-black/55">Toko pickup</dt>
              <dd className="font-medium text-black">
                {order.store.name}
                <span className="block text-black/70">{order.store.address}</span>
              </dd>
```

- [ ] **Step 3: Show the store on the account order detail**

In `src/app/(store)/account/orders/[orderNumber]/page.tsx`, add `store: true` to the order `include`, then add the same Toko pickup `<dt>/<dd>` block next to the existing "Jadwal pickup" pair (around line 107):

```tsx
                <dt className="text-black/55">Toko pickup</dt>
                <dd className="font-medium text-black">
                  {order.store.name}
                  <span className="block text-black/70">{order.store.address}</span>
                </dd>
```

- [ ] **Step 4: Use the store address on the invoice**

In `src/server/services/invoice.service.ts`, add `store: true` to the `db.order.findUnique` `include` (the one around line 101 that the invoice page consumes).

In `src/app/admin/invoices/[orderNumber]/page.tsx`, replace the line:

```typescript
  const pickupAddress = settings.pickup_address || "";
```

with:

```typescript
  const pickupAddress = order.store?.address || "";
  const pickupStoreName = order.store?.name || "";
```

Then, wherever `pickupAddress` is rendered on the invoice, render `pickupStoreName` above it (search the file for `pickupAddress` usage and add the store name line next to it).

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit`
Expected: no type errors (the `store` relation is now non-null, so `order.store.name` is safe on track/account/email; the invoice uses optional chaining defensively).
Run: `npm run build`
Expected: build succeeds.
Manual: open a paid order's `/track/<orderNumber>`, the account order detail, and `/admin/invoices/<orderNumber>` — each shows the correct store name + address for that order.

- [ ] **Step 6: Commit**

```bash
git add src/server/services/notification.service.ts "src/app/(store)/track/[orderNumber]/page.tsx" "src/app/(store)/account/orders/[orderNumber]/page.tsx" src/server/services/invoice.service.ts "src/app/admin/invoices/[orderNumber]/page.tsx"
git commit -m "feat(orders): show chosen pickup store to customers and on invoice"
```

---

### Task 5: Admin orders list — store filter and column

**Files:**
- Modify: `src/server/services/order.service.ts` (`listOrders` store filter + include store)
- Modify: `src/app/admin/orders/page.tsx` (store filter UI + column)
- Modify: `src/app/admin/orders/[id]/page.tsx` (show store on detail) — adjust path if the detail file differs

**Interfaces:**
- Consumes: `listStores`/`listActiveStores` (Task 1), `Order.store` relation.
- Produces: `listOrders` accepts `storeId?: string`; returned orders include `store`.

- [ ] **Step 1: Add the store filter to `listOrders`**

In `src/server/services/order.service.ts`, extend the `listOrders` filter type and `where`:

```typescript
export async function listOrders(filter?: {
  statuses?: OrderStatus[];
  limit?: number;
  userId?: string;
  q?: string;
  fromDate?: Date;
  toDate?: Date;
  storeId?: string;
}) {
  const where: Record<string, unknown> = {};
  if (filter?.statuses && filter.statuses.length) where.status = { in: filter.statuses };
  if (filter?.userId) where.userId = filter.userId;
  if (filter?.storeId) where.storeId = filter.storeId;
  // ...existing q / date logic unchanged...

  return db.order.findMany({
    where: Object.keys(where).length ? where : undefined,
    include: { items: true, payments: true, store: true },
    orderBy: { createdAt: "desc" },
    take: filter?.limit,
  });
}
```

- [ ] **Step 2: Wire the store filter into the orders page**

In `src/app/admin/orders/page.tsx`:

Add to the imports:

```typescript
import { listStores } from "@/server/services/store.service";
```

Add `store` to the `searchParams` type and read it:

```typescript
  searchParams: Promise<{
    status?: string;
    q?: string;
    from?: string;
    to?: string;
    store?: string;
  }>;
```

Load stores and pass the filter (alongside the existing `listOrders` call):

```typescript
  const stores = await listStores();
  const orders = await listOrders({
    statuses: selectedStatuses.length ? selectedStatuses : undefined,
    q: sp.q?.trim() || undefined,
    fromDate: sp.from ? new Date(sp.from) : undefined,
    toDate: sp.to ? new Date(`${sp.to}T23:59:59`) : undefined,
    storeId: sp.store || undefined,
  });
```

Include `store` in the `hasFilters` check:

```typescript
  const hasFilters = sp.status || sp.q || sp.from || sp.to || sp.store;
```

- [ ] **Step 3: Render a store dropdown in the filter form and a store badge per row**

In the filter `<form>` (it uses `method="get"`), add a store `<select>`. Because `method="get"` only submits named controls, this select participates automatically. Add it inside the grid next to the date inputs:

```tsx
          <select name="store" defaultValue={sp.store ?? ""} className={inputClass()}>
            <option value="">Semua toko</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
```

(Adjust the grid `md:grid-cols-[...]` template to add one more column.)

In the orders table/list rows, render the store name. Find where each order row is rendered (the `orders.map(...)` block lower in the file) and add a small badge using the included relation:

```tsx
            <span className="rounded bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600">
              {order.store?.name ?? "—"}
            </span>
```

- [ ] **Step 4: Show the store on the admin order detail page**

Open `src/app/admin/orders/[id]/page.tsx`. Ensure the query that loads the order includes `store: true` (if it calls `findOrderByNumber` or a local `db.order.findUnique`, add `store: true` to its `include`). Then render the store name + address in the order summary section:

```tsx
              <dt className="...">Toko pickup</dt>
              <dd className="...">{order.store?.name} — {order.store?.address}</dd>
```

If the detail page reuses `findOrderByNumber` from `order.service.ts`, add `store: true` to that function's `include` as well:

```typescript
export function findOrderByNumber(orderNumber: string) {
  return db.order.findUnique({
    where: { orderNumber },
    include: { items: true, payments: true, reservations: true, store: true },
  });
}
```

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit`
Expected: no type errors.
Run: `npm run build`
Expected: build succeeds.
Manual: open `/admin/orders`, confirm a "Semua toko" dropdown appears, pick a store, and confirm the list narrows to that store's orders (URL gains `?store=<id>`) and each row shows a store badge. Open an order's detail and confirm the store is shown.

- [ ] **Step 6: Commit**

```bash
git add src/server/services/order.service.ts src/app/admin/orders/page.tsx "src/app/admin/orders/[id]/page.tsx"
git commit -m "feat(admin): filter and display orders by store"
```

---

### Task 6: Per-store analytics breakdown and calendar feed location

**Files:**
- Modify: `src/server/services/calendar-feed.service.ts` (use per-order store address)
- Modify: `src/app/admin/analytics/page.tsx` (per-store breakdown) — adjust to the analytics service if logic lives there

**Interfaces:**
- Consumes: `Order.store` relation, `db.order.groupBy`.

- [ ] **Step 1: Use the order's store address in the calendar feed**

In `src/server/services/calendar-feed.service.ts`:

In the `Promise.all` block (around line 60), add `store: { select: { name: true, address: true } }` to the orders query `include`/`select`, and remove the now-unneeded `getSetting(SETTING_KEYS.PICKUP_ADDRESS)` entry (keep `getSetting(SETTING_KEYS.BUSINESS_NAME)` for the calendar name). Update the destructure to drop `pickupAddress`:

```typescript
  const [orders, slotRows, businessName] = await Promise.all([
    db.order.findMany({
      // ...existing where/select, plus:
      // include: { items: ..., store: { select: { name: true, address: true } } }
    }),
    db.deliverySlot.findMany({
      select: { id: true, label: true, startTime: true, endTime: true },
    }),
    getSetting(SETTING_KEYS.BUSINESS_NAME),
  ]);
```

Then change the `LOCATION` line (around line 136) to use the order's store address inside the `for (const order of orders)` loop:

```typescript
    lines.push(foldLine(`LOCATION:${escapeText(order.store?.address ?? "")}`));
```

(If `order.store` is selected as above, this is per-order correct. Confirm the orders query in this file includes the `store` relation.)

- [ ] **Step 2: Add a per-store breakdown to analytics**

In `src/app/admin/analytics/page.tsx` (or the analytics service it calls), compute order count + revenue grouped by store. Add this query where the other analytics aggregates are built:

```typescript
import { db } from "@/lib/db";
import { listStores } from "@/server/services/store.service";
// ...
  const [stores, byStore] = await Promise.all([
    listStores(),
    db.order.groupBy({
      by: ["storeId"],
      where: { status: { in: ["PAID", "PREPARING", "READY_FOR_DELIVERY", "OUT_FOR_DELIVERY", "DELIVERED", "COMPLETED"] } },
      _count: { _all: true },
      _sum: { total: true },
    }),
  ]);

  const storeName = new Map(stores.map((s) => [s.id, s.name]));
  const storeRows = byStore.map((row) => ({
    name: storeName.get(row.storeId) ?? "—",
    orders: row._count._all,
    revenue: row._sum.total ?? 0,
  }));
```

Render `storeRows` as a small table (reuse the analytics page's existing card/table styling), e.g.:

```tsx
      <section className="rounded-lg border border-stone-200/80 bg-white p-5">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-stone-500">Per toko</p>
        <ul className="grid gap-2 text-sm">
          {storeRows.map((r) => (
            <li key={r.name} className="flex justify-between">
              <span>{r.name}</span>
              <span className="text-stone-600">{r.orders} pesanan · {formatIDR(r.revenue)}</span>
            </li>
          ))}
        </ul>
      </section>
```

(Import `formatIDR` from `@/lib/money` if not already imported on the page.)

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: no type errors.
Run: `npm run build`
Expected: build succeeds.
Manual: open `/admin/analytics` and confirm a "Per toko" section lists each store with its order count and revenue. Open `/api/calendar/orders.ics` and confirm each event's `LOCATION` reflects that order's store address (orders from different stores show different locations).

- [ ] **Step 4: Commit**

```bash
git add src/server/services/calendar-feed.service.ts src/app/admin/analytics/page.tsx
git commit -m "feat(admin): per-store analytics and calendar feed location"
```

---

## Self-Review Notes

- **Spec coverage:** Store model + migration/backfill + seed (Task 1) ✓; customer store picker + validation (Task 3) ✓; customer-facing display: email/track/account/invoice (Task 4) ✓; admin orders filter + column + detail (Task 5) ✓; stores management UI (Task 2) ✓; analytics breakdown + calendar feed (Task 6) ✓; error handling for missing/inactive store (Task 3 service guard + action guard) ✓; deactivating a store doesn't break existing orders (FK kept; inactive hidden from picker via `listActiveStores`) ✓; `pickup_address` retired from UI but kept in `DEFAULT_SETTINGS` (Task 2 Step 3) ✓.
- **Slots remain global** — no slot schema touched anywhere. ✓
- **Type consistency:** `storeId` is `string` (non-null) after Task 1 Step 5; all consumers (`order.store.name`/`.address`) rely on the non-null relation; invoice/calendar use optional chaining defensively only where the include is added in the same task.
- **Verification:** every task ends with `npx tsc --noEmit` + `npm run build` + manual steps (no test runner added, per the chosen approach).
