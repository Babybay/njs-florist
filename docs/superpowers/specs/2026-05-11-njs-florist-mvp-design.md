# njs Florist (Bali) — Phase 1 MVP Design

**Date:** 2026-05-11
**Author:** brainstormed with Claude
**Status:** Design approved, awaiting user review before implementation plan
**Companion document:** `florist_website_architecture_full_specs.md` (original full spec — all business rules, DB schema, code examples, and Phase 2–4 features live there; this document narrows it into an actionable MVP)

---

## 1. Constraints

- **Builder:** solo developer
- **Timeline:** 10–14 weeks for Phase 1 MVP (13-week plan with 1–3 weeks buffer)
- **Launch mode:** real florist business, but **soft-launch deferred** — build production-quality, integrate Midtrans against sandbox, real merchant account and go-live handled later
- **Language:** Bahasa Indonesia only. No English UI. No `next-intl` or other i18n library.
- **Scope discipline:** full recipe-based inventory is in MVP (non-negotiable per user). Everything else gets ruthlessly cut to fit the timeline.

---

## 2. Tech stack (final lock-in)

| Layer | Choice |
|---|---|
| Frontend + Backend | Next.js App Router + TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| Forms | react-hook-form + Zod (Zod schemas shared with server actions) |
| State (client) | DB-backed cart + minimal Zustand for optimistic UI |
| Database | PostgreSQL on **Neon** (serverless, branchable) |
| ORM | Prisma |
| Auth | **Clerk** (managed, role in Clerk publicMetadata) |
| Payment | **Midtrans Snap** (sandbox during dev) |
| Image storage | Cloudinary (signed uploads from server) |
| Email | Resend |
| Delayed jobs | **Upstash QStash** (per-order delayed message at `expiresAt`) |
| Cron backstop | Vercel cron, every 5 minutes |
| Money type | Integer rupiah (no decimals) |
| Testing | Vitest (unit) + Playwright (one happy-path E2E) |
| Errors | Sentry |
| Rate limiting | Upstash Ratelimit on checkout + webhook routes |
| Hosting | Vercel |

---

## 3. Architecture

### 3.1 Style

**Modular monolith.** One Next.js application; internally organized as business modules with strict ownership of their tables.

### 3.2 Folder layout

```
src/
  app/                                # Next.js routes — thin handlers only
    (store)/                          # customer-facing
      page.tsx                        # homepage
      shop/[[...filters]]/page.tsx
      product/[slug]/page.tsx
      cart/page.tsx
      checkout/page.tsx
      payment/{pending,success,failed}/page.tsx
      account/orders/page.tsx
      account/orders/[orderNumber]/page.tsx
      track/[orderNumber]/page.tsx    # guest order tracking (orderNumber + email)
      faq/page.tsx                    # static, Markdown-driven
      about/page.tsx
      contact/page.tsx
      terms/page.tsx
      privacy/page.tsx
    admin/                            # ADMIN + SUPER_ADMIN
      (dashboard)/page.tsx
      products/
      categories/
      inventory/{items,recipes,movements}/
      orders/
      delivery/
      discounts/
      users/
      settings/
    staff/
      florist/                        # FLORIST_STAFF preparation queue
      delivery/                       # DELIVERY_STAFF queue
    api/
      payments/midtrans/{create,webhook}/route.ts
      reservations/release/route.ts   # called by QStash + cron sweep
      cron/sweep-reservations/route.ts
      upload/cloudinary-signature/route.ts
      clerk/webhook/route.ts          # user.created / user.updated sync

  modules/                            # business logic — one folder per domain
    catalog/                          # products, variants, categories, addons
    inventory/                        # items, recipes, movements, availability calc
    reservations/                     # ACTIVE/COMMITTED/EXPIRED lifecycle
    cart/
    checkout/                         # orchestrator: cart -> order -> reservation -> payment
    payments/                         # Midtrans client + webhook handler
    orders/                           # status transitions, queries
    delivery/                         # slots, capacity, address
    discounts/
    notifications/                    # Resend wrappers
    users/                            # Clerk sync + role checks
    audit/                            # ActivityLog writer

  components/
    ui/                               # shadcn/ui primitives
    store/
    admin/
    staff/

  lib/
    db.ts                             # Prisma client singleton
    auth.ts                           # Clerk wrappers + getOrCreateUser + role helpers
    midtrans.ts
    cloudinary.ts
    resend.ts
    qstash.ts
    money.ts                          # IDR formatter, integer math helpers
    rbac.ts                           # permission matrix as code

  prisma/
    schema.prisma
    migrations/
    seed.ts

  types/                              # cross-module shared types only
  content/                            # FAQ.md, About.md, Terms.md, Privacy.md
```

Each module folder follows the same internal structure:

```
modules/<name>/
  schema.ts        # Zod schemas
  service.ts       # business logic (takes Prisma client / tx for composition)
  queries.ts       # read-side queries
  actions.ts       # server actions (thin: validate -> auth -> service -> result)
```

### 3.3 Module rules

1. **Modules own their tables.** Other modules never query another module's tables directly — they call its service.
2. **Server Actions are thin.** Validate input (Zod) → check auth/role → call service → return typed result. No business logic in actions.
3. **Services compose inside transactions.** Services accept a Prisma client (or transaction client) so they nest inside `prisma.$transaction(...)`.
4. **Checkout is the only cross-module orchestrator.** It's the one module allowed to call across boundaries (cart → reservations → payments → orders).
5. **RBAC lives in `lib/rbac.ts`** as the permission matrix in code; route handlers and server actions call `requireRole(...)` or `requirePermission(...)` from `lib/auth.ts`.

### 3.4 Auth flow

- Clerk owns signup/login UI and session.
- Clerk webhook (`user.created`, `user.updated`) syncs to local `User` table.
- **`getOrCreateUser(clerkUserId)`** is called on every authenticated request. If local row is missing, it is created on the fly from Clerk's API. The webhook is an optimization, not a critical-path dependency.
- Role lives in Clerk **publicMetadata** (`role: "ADMIN" | "FLORIST_STAFF" | ...`). SUPER_ADMIN can promote/demote via Clerk API from `/admin/users`.
- **Guest checkout allowed.** Order keyed to `userId: null` + recipient email. If the same email signs up later, orders are backfilled.

### 3.5 Security

- Webhook routes verify Midtrans signature *before* any work and return 200 fast.
- Admin/staff routes wrapped in middleware that checks role. Never trust the client.
- Cloudinary uploads use server-signed URLs.
- Checkout + webhook endpoints rate-limited via Upstash Ratelimit.
- Money/stock mutations always inside `prisma.$transaction` with `SELECT ... FOR UPDATE` on inventory rows during reservation commit.
- `webhook_events` idempotency table prevents double-processing of retried Midtrans webhooks.

---

## 4. Database

Schema is defined in the companion full-spec doc (Section 19, Prisma example). The MVP uses every model listed there:

`User`, `Category`, `Product`, `ProductImage`, `ProductVariant`, `Addon`, `ProductAddon`, `InventoryItem`, `VariantRecipe`, `StockMovement`, `StockReservation`, `Cart`, `CartItem`, `CartItemAddon`, `Order`, `OrderItem`, `OrderItemAddon`, `Payment`, `DeliverySlot`, `DiscountCode`, `ActivityLog`.

**Additions to that schema for this MVP:**

```prisma
model WebhookEvent {
  id           String   @id @default(cuid())
  provider     String                       // "MIDTRANS" | "CLERK"
  eventId      String                       // provider's idempotency key (e.g. Midtrans transaction_id)
  payload      Json
  processedAt  DateTime @default(now())

  @@unique([provider, eventId])
}
```

Inserted at the **start** of every webhook handler. Duplicate insert → return 200 without further work.

**Time zones:** all timestamps stored in UTC. Display in WITA (UTC+8) at the edge. Same-day cutoff (14:00) is evaluated in WITA.

**Money:** all amount fields are `Int` (rupiah). No `Decimal`.

---

## 5. Key business flows

All detailed business logic, examples, and code samples live in the companion full-spec doc. This section names the flows in scope and the design decisions specific to the MVP.

### 5.1 Variant availability
`min(inventoryItem.currentQty / recipe.quantityNeeded)` across all recipe rows for the variant. Variant with zero recipes is treated as **DRAFT** and cannot go ACTIVE.

### 5.2 Cart
DB-backed. Guest: keyed by `sessionId` cookie. Logged-in: keyed by `userId`. On login, guest cart merges into user cart. Cart **never** deducts stock; it revalidates availability on every view and on checkout.

### 5.3 Checkout (transactional)
Inside one `prisma.$transaction`:
1. Validate slot capacity for `deliveryDate + deliverySlotId`.
2. Recalculate pricing from current variant prices (snapshot into `OrderItem`).
3. Validate stock against recipes.
4. Create `Order` with status `PENDING_PAYMENT`.
5. Create `StockReservation` rows with `expiresAt = now + 15 min`.
6. Create `Payment` row, call Midtrans Snap, store token.
7. Schedule QStash delayed call to `/api/reservations/release` for this order at `expiresAt`.

### 5.4 Payment webhook (idempotent + transactional)
1. Verify Midtrans signature. Reject if invalid.
2. Insert into `webhook_events`. Duplicate → 200 OK, exit.
3. Inside `prisma.$transaction`:
   - Look up `Payment` by `providerOrderId`.
   - Map Midtrans status → internal `PaymentStatus` + `OrderStatus`.
   - Update `Payment` + `Order`.
   - If status is `PAID`: for each `ACTIVE` reservation on the order, `SELECT ... FOR UPDATE` the inventory row, decrement `currentQty`, mark reservation `COMMITTED`, write `StockMovement` row.
4. After transaction commits: send confirmation email via Resend.

### 5.5 Reservation release (QStash + cron sweep)
- **QStash trigger** at `expiresAt`: idempotent call to `/api/reservations/release` with `orderId`. Releases any reservations still `ACTIVE` on that order; marks them `EXPIRED`; sets `Order.status = EXPIRED`.
- **Cron sweep** every 5 minutes: backstop in case QStash drops or delays. Same logic, scoped to any reservation where `status = ACTIVE AND expiresAt < now`.

### 5.6 Order status transitions
`DRAFT → PENDING_PAYMENT → PAID → PREPARING → READY_FOR_DELIVERY → OUT_FOR_DELIVERY → DELIVERED → COMPLETED` (with branches to `EXPIRED`, `PAYMENT_FAILED`, `CANCELLED`, `REFUNDED`). Each transition is gated by role (see RBAC matrix in companion spec).

### 5.7 Delivery slots
Per slot: daily capacity. Slot is unavailable when `count(paid orders) >= capacity` for that date+slot. Same-day cutoff: 14:00 WITA (configurable in settings).

### 5.8 Pricing engine
```
subtotal       = sum(variant_unit_price * qty) + sum(addon_unit_price * qty)
delivery_fee   = settings.flat_fee   // MVP: flat; per-distance is Phase 2+
discount       = applyDiscountCode(subtotal, code)
total          = subtotal + delivery_fee - discount
```
All integers. Snapshot into `Order` and `OrderItem` rows.

---

## 6. MVP scope (Phase 1)

### In scope

**Customer storefront**
- Home, `/shop`, `/shop/[category]`, `/product/[slug]`
- Variant picker, add-ons, card message, delivery date + slot picker
- `/cart`, `/checkout`, `/payment/{pending,success,failed}`
- `/account/orders` (logged-in) and `/track/[orderNumber]` (guest, requires order number + email)
- Static pages: `/faq`, `/about`, `/contact`, `/terms`, `/privacy` (Markdown in `src/content/`)

**Admin dashboard**
- Login + role gate
- Catalog: categories, products, variants, add-ons (full CRUD)
- Inventory: items, recipes, movements (manual IN/OUT/ADJUSTMENT), low-stock list
- Orders: list with filters, detail, status transitions, manual refund mark, print bouquet card, print delivery note
- Delivery slots: CRUD, capacity, block dates
- Discount codes: CRUD (fixed + percent only — see "explicitly cut" below)
- Users: list, promote/demote roles via Clerk API
- Settings: store info, flat delivery fee, same-day cutoff hour

**Staff dashboards**
- `/staff/florist`: paid orders queue, PAID→PREPARING→READY_FOR_DELIVERY transitions, print bouquet card
- `/staff/delivery`: ready orders queue, READY→OUT_FOR_DELIVERY→DELIVERED transitions, optional photo upload as proof

**Backend / business logic**
- Variant availability calc from recipes
- DB-backed cart (guest + logged-in, merge on login)
- Transactional checkout (order + reservations + Midtrans + QStash schedule)
- Midtrans webhook (signature verify + idempotency + transactional commit)
- QStash reservation release + cron sweep (every 5 min)
- Pricing engine, integer rupiah throughout
- Resend emails (Bahasa Indonesia): pending, paid, preparing, out for delivery, delivered; admin low-stock alert
- Activity log on all admin mutations

**Non-functional**
- All UI in Bahasa Indonesia
- Mobile-first responsive
- Sentry error reporting
- Vercel + Neon deploy
- Midtrans **sandbox** wired up; production credentials swap via env

### Explicitly cut from MVP (deferred)

**Phase 2 (post-launch, ~4–6 weeks):**
- Customer reviews/testimonials (needs moderation flow — not critical for launch)
- Product search (use category browse for MVP)
- Wishlist / favorites
- Multiple delivery addresses per customer
- Saved payment methods
- Abandoned cart email reminders
- BOGO / product-specific / free-delivery discount types (MVP: fixed + percent only)

**Phase 3 (~3–4 weeks):**
- WhatsApp notifications (Wati / Twilio)
- Refund automation (MVP: admin manually marks REFUNDED after issuing refund in Midtrans dashboard)
- Multi-warehouse / multi-location inventory
- Bulk order import / B2B portal
- Analytics dashboard (use Vercel Analytics + ad-hoc Postgres queries for MVP)

**Phase 4 (~2–3 weeks):**
- Custom bouquet inquiry form
- Customer segmentation / lifecycle emails
- Loyalty program

### Explicitly not in scope, ever (unless renegotiated)

- Blog / SEO content platform (replaced by static FAQ)
- Microservices split
- GraphQL
- Native mobile app
- AI features (bouquet recommendation, chatbot)
- Multi-tenant / multi-store

---

## 7. Roadmap

13-week plan, ~30–35 productive hours per week.

| Week | Focus | Ship at end of week |
|---|---|---|
| 1 | Foundation | Next.js + TS + Tailwind + shadcn/ui scaffolded. Prisma + Neon connected. Clerk integrated, role middleware working. Vercel preview deploys green. Sentry wired. |
| 2 | Schema + seed | Full Prisma schema migrated. Seed script for categories, products, variants, inventory items, recipes, delivery slots. Admin shell renders. |
| 3 | Catalog admin | CRUD for categories, products, variants, add-ons. Cloudinary signed upload working. Images display. |
| 4 | Inventory admin | CRUD for inventory items + variant recipes + stock movements. Low-stock list. Variant availability calc working with unit tests. |
| 5 | Storefront catalog | Home, `/shop`, category pages, `/product/[slug]` with variant picker, add-ons, card message, delivery date/slot picker, live availability. |
| 6 | Cart | DB-backed cart (guest + logged-in). Add/edit/remove. Availability revalidated on view. Cart merge on login. Pricing engine module + tests. |
| 7 | Checkout (no payment yet) | Checkout form (recipient, sender, anonymous, delivery, discount). Slot capacity validation. Order + reservation creation. Discount code apply. End-to-end without Midtrans (order stays `PENDING_PAYMENT`). |
| 8 | Midtrans integration | Snap transaction creation, redirect. Webhook with signature verify + idempotency + transactional commit. Reservation→committed→stock decrement→movement. QStash scheduling. 5-min cron sweep. **Full happy path in sandbox.** |
| 9 | Email + customer order pages | Resend templates (Indonesian) for all order statuses. `/account/orders`, `/track/[orderNumber]`. Order detail. Admin low-stock alert email. |
| 10 | Admin order management | `/admin/orders` list with filters, `/admin/orders/[id]` detail, status transitions, manual refund mark, print bouquet card, print delivery note. Discount codes CRUD. Delivery slots CRUD. |
| 11 | Staff dashboards | `/staff/florist` queue + transitions. `/staff/delivery` queue + transitions + photo proof. User management (role promote/demote via Clerk API). |
| 12 | Hardening | Rate limiting. RBAC audit on every server action. Activity log writes verified. Webhook idempotency stress test. Concurrent-checkout race test. Playwright happy-path E2E. Sentry sourcemaps. Settings page. Static pages (FAQ, About, Contact, Terms, Privacy). |
| 13 | Polish + soft-launch prep | Mobile device QA. Loading + error + empty states. SEO meta + OG images. Sitemap. Robots.txt. Performance pass. Deployment notes for future-you. |

**Buffer:** Weeks 14–16 if needed for Midtrans quirks, race-condition fixes, design polish.

**Don't compress:** Week 4 (recipes + availability), Weeks 7–8 (transactional checkout + webhook). Bugs here leak money.

---

## 8. Risks & mitigations

| # | Risk | Mitigation |
|---|---|---|
| 1 | Concurrent webhook delivery double-deducts stock | `webhook_events` idempotency insert at start; `SELECT ... FOR UPDATE` on inventory rows; stress test in Week 12 with parallel curl calls |
| 2 | QStash reservation-release job dropped or delayed | Vercel cron sweep every 5 minutes as backstop; sweep route idempotent (no duplicate `RELEASED` movement) |
| 3 | Price changes between cart and checkout cause disputes | Snapshot `unitPrice` into `OrderItem` at order creation; show locked total before Midtrans redirect |
| 4 | Recipe-based availability wrong due to missing/incomplete recipe | Variant with zero recipes cannot leave DRAFT; admin warning if any recipe item is inactive or zero-stock; recipe-completeness report |
| 5 | Clerk user-sync webhook dropped | `getOrCreateUser(clerkUserId)` on every authenticated request — webhook is optimization, not requirement |

### Lower but real

- **Cloudinary signed upload misconfiguration** — test in Week 3, not Week 12
- **Time zones (UTC in DB, WITA at edge)** — decide and document in Week 2
- **Long Indonesian product names break narrow layouts** — test with real Indonesian strings, not Lorem Ipsum
- **Same-day cutoff edge case (13:59 → 14:01)** — show cutoff time and current server time on date picker
- **Vendor cost ramp** — Clerk, Neon, QStash, Vercel free tiers will be hit at real traffic. Budget Rp 500k–1.5M/mo (~$30–100) from month 2 onward

### Not worrying about

- Horizontal scaling (Vercel + Neon handle florist traffic without thought)
- Microservice extraction (not needed at this scale)
- ORM lock-in (Prisma → Drizzle is a weekend if ever needed)
- DB choice (Postgres is the right answer)

---

## 9. References

- **Full architecture & business rules:** `florist_website_architecture_full_specs.md` (sections 1–31, Prisma schema in §19, code examples in §20)
- **Permission matrix:** companion spec §5
- **Order status flow:** companion spec §16
- **Folder architecture (initial sketch):** companion spec §29 — this design refines that layout (see §3.2 above)

---

## 10. Open items handed to the implementation plan

These are deliberately not designed here — they belong in the implementation plan, not the design doc:

- Exact Zod schemas per server action
- Exact Resend email templates (Indonesian copy)
- Exact shadcn/ui component list per page
- Per-page loading and error states
- Seed data values (sample products, prices, materials)
- Production env var names and Vercel project settings
- Vercel cron schedule string (every 5 min)
- QStash signing key handling

These will be specified by the implementation plan that follows this design.
