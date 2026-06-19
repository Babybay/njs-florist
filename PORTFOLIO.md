# 🌸 njs Florist — Full-Stack Florist Commerce & Operations Platform

> A production-grade e-commerce and back-office platform for a Bali-based florist —
> handling the full journey from storefront browsing to payment, inventory depletion,
> staff fulfillment, and pickup. Built on Next.js 16 (App Router) with a clean
> service-layer architecture.

<p>
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white">
  <img alt="React" src="https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white">
  <img alt="Prisma" src="https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&logoColor=white">
  <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-Supabase-4169E1?logo=postgresql&logoColor=white">
  <img alt="Tailwind" src="https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white">
</p>

**Live:** [njs-florist.vercel.app](https://njs-florist.vercel.app)

---

## Overview

njs Florist isn't a static storefront — it's a complete commerce **and operations** system.
The interesting domain challenge is that a florist sells *handcrafted* products: each bouquet
variant is assembled from raw materials (stems, wrappers, accessories), so "stock" isn't a
simple count — it's derived from a **bill of materials** against live inventory. The platform
models that end to end, then layers on payments, a staff fulfillment workflow, delivery-slot
scheduling, invoicing, and analytics.

Everything is localized for an Indonesian business (Bahasa UI, IDR currency, **WITA / UTC+8**
time handling, Midtrans payments, WhatsApp messaging).

---

## Tech Stack

| Layer | Choice |
|---|---|
| **Framework** | Next.js 16 — App Router, React Server Components, Server Actions, React Compiler |
| **UI** | React 19, Tailwind CSS 4, Motion (animations) |
| **Database** | PostgreSQL (Supabase) via Prisma 6 ORM with versioned migrations |
| **Auth** | Supabase Auth (SSR cookies), role-based access control |
| **Payments** | Midtrans (Snap) with webhook reconciliation |
| **Email** | Resend (transactional — order + pickup notifications) |
| **Messaging** | WhatsApp gateway (status updates, admin alerts) |
| **Media** | Cloudinary (product imagery) |
| **Validation** | Zod schemas at every mutation boundary |
| **Hosting** | Vercel |

---

## Architecture

```
src/
├── app/
│   ├── (store)/        # Customer storefront — catalog, cart, checkout, tracking, account
│   ├── admin/          # Back-office — dashboard, analytics, inventory, orders, invoices
│   ├── staff/          # Florist & delivery fulfillment views
│   └── api/            # Payment webhooks, calendar feed
├── server/
│   ├── services/       # 27 domain services — all business logic, framework-agnostic
│   ├── actions/        # 20 Server Actions — validated mutation entrypoints
│   └── validations/    # Zod schemas
├── prisma/             # Schema + migrations
└── lib/                # db client, auth, money/timezone utils, integrations
```

**Design principles**

- **Service layer over fat components.** All business logic lives in `src/server/services`,
  keeping pages and actions thin and the logic unit-testable.
- **Server Actions as the mutation surface**, each guarded by Zod validation and RBAC checks.
- **Caching with intent.** `React.cache()` deduplicates per-request DB reads; `unstable_cache`
  with **tag-based revalidation** keeps the catalog fast while staying fresh on edits.
- **Role-based access** across five roles: `SUPER_ADMIN`, `ADMIN`, `FLORIST_STAFF`,
  `DELIVERY_STAFF`, `CUSTOMER`.

---

## Feature Highlights

**Storefront** — Catalog with category filtering, search, price sorting · product galleries ·
cart with add-ons · multi-step checkout · order tracking · customer accounts · blog.

**Commerce & operations**
- **Inventory as a bill of materials** — each variant has a *recipe* of raw materials;
  product availability is computed as the minimum producible quantity across its recipe.
- **Stock reservation system** — checkout reserves materials with a 15-minute expiry; a lazy
  sweep releases stale reservations, preventing overselling without a cron dependency.
- **Order lifecycle state machine** — a 12-state flow (`PENDING_PAYMENT → PAID → PREPARING →
  READY_FOR_DELIVERY → … → COMPLETED`) with explicitly guarded transitions and a full audit history.
- **Delivery-slot scheduling** with per-slot capacity and date-specific overrides.
- **Invoicing** — printable invoices with line items, per-bouquet material usage, and totals.
- **Discounts**, **custom-bouquet inquiries**, and an **activity log** for admin edits.

**Admin analytics** — daily revenue ledger (with AOV, items sold, and a running balance),
period-over-period comparison, a selectable 7/30/90-day range, conversion stats, and
best-seller breakdowns.

---

## Engineering Deep-Dives

These are the parts I'm most proud of — where the domain forced real engineering decisions.

### 1. Transaction-safe checkout
The order, its line items, stock reservations, and discount-usage increments are written in a
**single atomic Prisma transaction**. Inventory levels are re-read *inside* the transaction so
concurrent checkouts see the latest value, and the external Midtrans payment call happens only
*after* the transaction commits — so a payment-gateway hiccup can never leave a half-written order.

### 2. Inventory as a bill of materials
A bouquet variant doesn't have a stock number — it has a **recipe**. Availability is
`min(floor(inventoryQty / quantityNeeded))` across every material in the recipe. Invoices then
reverse this to show exactly which raw materials (and how much) each bouquet consumed, plus an
aggregated materials pick-list for the florist.

### 3. Timezone-correct order/pay codes
Order codes follow `njs-YYYYMMDD####` with a sequence that **resets daily**. The catch: the shop
is in Bali (WITA / UTC+8) but servers run in UTC. The date and day boundaries are computed in
WITA, so the daily reset aligns to *local* midnight rather than drifting by 8 hours.

### 4. Performance
- **Request-level dedup** via `React.cache()` so a stat card and its detail list share one query.
- **Tag-based ISR caching** for catalog reads, invalidated precisely on catalog edits.
- Eliminated an **N+1** in product-page variant availability (per-variant queries → one batched query).
- Added **composite indexes** on the hottest filter paths — `Product(status, createdAt)` and
  `Order(status, createdAt)` — covering catalog listings, the dashboard, and analytics.

### 5. Status-driven notification pipeline
Order status changes fan out to **email (Resend)** and **WhatsApp**, fire-and-forget so they never
block the status update. The system degrades gracefully — when API keys are absent it logs stubs
instead of failing, keeping local development friction-free.

---

## Local Development

```bash
npm install
cp .env.example .env.local      # fill in DB, Supabase, Midtrans, Resend, Cloudinary keys
npm run db:migrate              # apply Prisma migrations
npm run db:seed                 # seed catalog, slots, settings
npm run dev
```

---

## Notes

Solo full-stack build — data modeling, business logic, UI, integrations, and deployment.
The domain (handcrafted products with material-derived stock, local payments, and a real
fulfillment workflow) made it a far richer problem than a typical CRUD storefront.
