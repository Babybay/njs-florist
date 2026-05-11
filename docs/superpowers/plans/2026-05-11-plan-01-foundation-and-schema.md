# njs Florist — Plan 01: Foundation + Schema Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a deployable Next.js application with PostgreSQL (Neon), Prisma, Clerk authentication, role-based middleware, Sentry error reporting, a complete Prisma schema for the full e-commerce domain, a seed script with realistic sample data, and an empty admin shell ready for catalog work.

**Architecture:** Modular monolith on Next.js App Router. Auth lives in Clerk (role in `publicMetadata`). DB access via Prisma singleton. Module boundaries enforced by folder layout (`src/modules/<domain>/`). Role checks centralized in `lib/auth.ts` + `lib/rbac.ts`. Webhook user-sync is optimistic — `getOrCreateUser()` covers webhook drops.

**Tech Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS · shadcn/ui · Prisma · PostgreSQL (Neon) · Clerk · Sentry · Zod · Vitest · Vercel.

**Roadmap weeks covered:** Weeks 1–2 of the 13-week roadmap (see `docs/superpowers/specs/2026-05-11-njs-florist-mvp-design.md` §7).

**Scope reminder:** This plan does NOT include any business logic (no catalog CRUD, no cart, no checkout, no payments). Those land in Plans 02–12. This plan is foundation only.

---

## File structure created by this plan

```
njs florist/
├── .env.local.example
├── .gitignore
├── README.md
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
├── tsconfig.json
├── vercel.json
├── instrumentation.ts
├── sentry.client.config.ts
├── sentry.server.config.ts
├── sentry.edge.config.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── middleware.ts
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── globals.css
│   │   ├── admin/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── products/page.tsx
│   │   │   ├── categories/page.tsx
│   │   │   ├── inventory/page.tsx
│   │   │   ├── orders/page.tsx
│   │   │   ├── delivery/page.tsx
│   │   │   ├── discounts/page.tsx
│   │   │   ├── users/page.tsx
│   │   │   └── settings/page.tsx
│   │   └── api/
│   │       └── clerk/webhook/route.ts
│   ├── components/
│   │   └── ui/                        (populated by shadcn CLI as needed)
│   ├── lib/
│   │   ├── db.ts
│   │   ├── env.ts
│   │   ├── auth.ts
│   │   ├── rbac.ts
│   │   └── utils.ts
│   ├── modules/                       (folders only — content lands in later plans)
│   │   ├── catalog/
│   │   ├── inventory/
│   │   ├── reservations/
│   │   ├── cart/
│   │   ├── checkout/
│   │   ├── payments/
│   │   ├── orders/
│   │   ├── delivery/
│   │   ├── discounts/
│   │   ├── notifications/
│   │   ├── users/
│   │   └── audit/
│   └── types/
└── tests/
    ├── setup.ts
    └── unit/
        ├── rbac.test.ts
        └── auth.test.ts
```

---

## Prerequisites (one-time external setup)

Before starting Task 1, you need accounts on these services. **You** (the human) create the accounts; the plan tasks reference the env vars they produce.

- [ ] **GitHub** account + new empty repo named `njs-florist`
- [ ] **Vercel** account, linked to your GitHub
- [ ] **Neon** account → create a new project named `njs-florist`, copy the connection string
- [ ] **Clerk** account → create a new application, copy publishable key + secret key
- [ ] **Sentry** account → create a new Next.js project, copy DSN + auth token

(Cloudinary, Resend, Upstash, Midtrans accounts are needed in later plans, not this one.)

---

## Task 1: Initialize project with Next.js, TypeScript, Tailwind

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `tailwind.config.ts`
- Create: `postcss.config.mjs`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/globals.css`
- Create: `.gitignore`
- Create: `README.md`

- [ ] **Step 1: Run create-next-app**

Run from `D:\THE PROJECT\njs florist`:
```bash
npx create-next-app@latest . --typescript --tailwind --app --src-dir --import-alias "@/*" --no-eslint --use-npm
```

Expected: project files created in the current directory. If prompted to override existing files (the spec markdown), choose **No** for that file.

- [ ] **Step 2: Verify dev server runs**

```bash
npm run dev
```

Open `http://localhost:3000`. Expected: default Next.js welcome page renders. Stop the server (Ctrl+C).

- [ ] **Step 3: Initialize git**

```bash
git init
git add -A
git commit -m "chore: initial Next.js + TypeScript + Tailwind scaffold"
```

- [ ] **Step 4: Connect to GitHub**

Create empty repo `njs-florist` on GitHub if not done. Then:
```bash
git remote add origin https://github.com/<your-username>/njs-florist.git
git branch -M main
git push -u origin main
```

Expected: code visible on GitHub.

---

## Task 2: Replace homepage with project placeholder and add module folders

**Files:**
- Modify: `src/app/page.tsx`
- Create: `src/modules/.gitkeep` (and stub folders for each module)

- [ ] **Step 1: Replace homepage**

Overwrite `src/app/page.tsx` with:
```tsx
export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-pink-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-pink-900">njs Florist</h1>
        <p className="mt-2 text-pink-700">Bali · Bunga Segar untuk Setiap Momen</p>
        <p className="mt-8 text-sm text-pink-600">Coming soon.</p>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Create empty module folders with .gitkeep files**

```bash
mkdir -p src/modules/{catalog,inventory,reservations,cart,checkout,payments,orders,delivery,discounts,notifications,users,audit}
```

Then create a `.gitkeep` in each:
```bash
for dir in catalog inventory reservations cart checkout payments orders delivery discounts notifications users audit; do
  echo "" > "src/modules/$dir/.gitkeep"
done
```

- [ ] **Step 3: Create types folder**

```bash
mkdir -p src/types
echo "" > src/types/.gitkeep
```

- [ ] **Step 4: Verify build still works**

```bash
npm run build
```

Expected: build succeeds, no errors.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: scaffold module folders and placeholder homepage"
```

---

## Task 3: Set up environment variable validation with Zod

**Files:**
- Create: `src/lib/env.ts`
- Create: `.env.local.example`
- Modify: `.gitignore` (verify `.env.local` is ignored)

- [ ] **Step 1: Install Zod**

```bash
npm install zod
```

- [ ] **Step 2: Create env.ts with validation**

Create `src/lib/env.ts`:
```ts
import { z } from "zod";

const serverSchema = z.object({
  DATABASE_URL: z.string().url(),
  CLERK_SECRET_KEY: z.string().min(1),
  CLERK_WEBHOOK_SIGNING_SECRET: z.string().min(1).optional(),
  SENTRY_AUTH_TOKEN: z.string().min(1).optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

const clientSchema = z.object({
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url(),
});

const processEnv = {
  DATABASE_URL: process.env.DATABASE_URL,
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
  CLERK_WEBHOOK_SIGNING_SECRET: process.env.CLERK_WEBHOOK_SIGNING_SECRET,
  SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
};

const isServer = typeof window === "undefined";

const merged = isServer
  ? serverSchema.merge(clientSchema)
  : clientSchema;

const parsed = merged.safeParse(processEnv);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables");
}

export const env = parsed.data as z.infer<typeof serverSchema> & z.infer<typeof clientSchema>;
```

- [ ] **Step 3: Create .env.local.example**

```
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
CLERK_WEBHOOK_SIGNING_SECRET="whsec_..."

NEXT_PUBLIC_SENTRY_DSN="https://...@sentry.io/..."
SENTRY_AUTH_TOKEN="sntrys_..."

NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

- [ ] **Step 4: Verify .env.local is gitignored**

Open `.gitignore`. Confirm `.env*` or `.env.local` is present. If not, add:
```
.env*.local
```

- [ ] **Step 5: Create your local .env.local**

Copy `.env.local.example` to `.env.local`:
```bash
cp .env.local.example .env.local
```

You'll fill in real values as services are set up in later tasks. For now, put placeholder values that satisfy Zod (the URL must look like a URL):
```
DATABASE_URL="postgresql://x:x@localhost:5432/x"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_placeholder"
CLERK_SECRET_KEY="sk_test_placeholder"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/env.ts .env.local.example .gitignore
git commit -m "feat: add Zod-based env validation"
```

---

## Task 4: Install Prisma and create the Prisma client singleton

**Files:**
- Create: `prisma/schema.prisma`
- Create: `src/lib/db.ts`
- Modify: `package.json` (adds prisma scripts)
- Modify: `tsconfig.json` (verify paths)

- [ ] **Step 1: Install Prisma**

```bash
npm install -D prisma
npm install @prisma/client
```

- [ ] **Step 2: Initialize Prisma**

```bash
npx prisma init
```

This creates `prisma/schema.prisma` and adds `DATABASE_URL` to `.env`. Delete the `.env` Prisma created at the repo root — we use `.env.local`:
```bash
rm .env
```

- [ ] **Step 3: Replace prisma/schema.prisma with starter content**

Overwrite `prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Models added in Task 13 (full schema migration).
// Empty for now so prisma generate runs without errors.

model __PrismaBootstrap {
  id String @id @default(cuid())
}
```

- [ ] **Step 4: Create Prisma client singleton**

Create `src/lib/db.ts`:
```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
```

- [ ] **Step 5: Add Prisma scripts to package.json**

In `package.json`, add to `"scripts"`:
```json
"db:generate": "prisma generate",
"db:migrate": "prisma migrate dev",
"db:studio": "prisma studio",
"db:seed": "tsx prisma/seed.ts",
"db:reset": "prisma migrate reset"
```

Install tsx:
```bash
npm install -D tsx
```

- [ ] **Step 6: Set up Neon database**

In the Neon dashboard:
1. Create a new project named `njs-florist` if not done.
2. Copy the **pooled** connection string (`postgresql://...neondb?sslmode=require`).
3. Paste it into `.env.local` as `DATABASE_URL`.

- [ ] **Step 7: Run first migration to verify connectivity**

```bash
npx prisma migrate dev --name bootstrap
```

Expected: migration creates `__PrismaBootstrap` table, prints "Your database is now in sync with your schema."

- [ ] **Step 8: Commit**

```bash
git add prisma/ src/lib/db.ts package.json package-lock.json
git commit -m "feat: add Prisma + Neon + client singleton"
```

---

## Task 5: Install Clerk and wrap the app

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/middleware.ts` (create)
- Modify: `package.json`

- [ ] **Step 1: Install Clerk**

```bash
npm install @clerk/nextjs
```

- [ ] **Step 2: Get Clerk keys**

In the Clerk dashboard → API Keys, copy publishable + secret. Paste into `.env.local`:
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_xxx"
CLERK_SECRET_KEY="sk_test_xxx"
```

- [ ] **Step 3: Wrap root layout with ClerkProvider**

Overwrite `src/app/layout.tsx`:
```tsx
import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "njs Florist",
  description: "Toko bunga online di Bali",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="id">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

- [ ] **Step 4: Create Clerk middleware**

Create `src/middleware.ts`:
```ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/admin(.*)",
  "/staff(.*)",
  "/account(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
```

- [ ] **Step 5: Add sign-in / sign-up routes**

Create `src/app/sign-in/[[...sign-in]]/page.tsx`:
```tsx
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-pink-50">
      <SignIn />
    </div>
  );
}
```

Create `src/app/sign-up/[[...sign-up]]/page.tsx`:
```tsx
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-pink-50">
      <SignUp />
    </div>
  );
}
```

- [ ] **Step 6: Configure Clerk paths in .env.local**

Append to `.env.local`:
```
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
```

- [ ] **Step 7: Verify**

```bash
npm run dev
```

Visit `http://localhost:3000/sign-in`. Expected: Clerk's hosted sign-in component renders. Sign up with a test account.

Visit `http://localhost:3000/admin`. Expected: redirected to sign-in. After signing in, you'll see a 404 (admin pages don't exist yet) — that's fine.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: integrate Clerk auth with route protection"
```

---

## Task 6: Build RBAC permission matrix

**Files:**
- Create: `src/lib/rbac.ts`
- Create: `tests/unit/rbac.test.ts`
- Create: `vitest.config.ts`
- Create: `tests/setup.ts`
- Modify: `package.json` (add test script)

- [ ] **Step 1: Install Vitest**

```bash
npm install -D vitest @vitest/coverage-v8 @types/node
```

- [ ] **Step 2: Create Vitest config**

Create `vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

- [ ] **Step 3: Create test setup**

Create `tests/setup.ts`:
```ts
// Shared test setup. Empty for now; will hold mocks in later plans.
```

- [ ] **Step 4: Add test script**

In `package.json` scripts, add:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Write failing tests for RBAC**

Create `tests/unit/rbac.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { can, type Role, type Permission } from "@/lib/rbac";

describe("rbac", () => {
  it("SUPER_ADMIN can do everything", () => {
    const allActions: Permission[] = [
      "products.manage",
      "variants.manage",
      "stock.manage",
      "orders.view_all",
      "orders.update_preparation",
      "orders.update_delivery",
      "users.manage",
      "payments.configure",
      "orders.place",
      "orders.view_own",
    ];
    for (const action of allActions) {
      expect(can("SUPER_ADMIN", action)).toBe(true);
    }
  });

  it("ADMIN can manage catalog but not users or payment settings", () => {
    expect(can("ADMIN", "products.manage")).toBe(true);
    expect(can("ADMIN", "variants.manage")).toBe(true);
    expect(can("ADMIN", "stock.manage")).toBe(true);
    expect(can("ADMIN", "orders.view_all")).toBe(true);
    expect(can("ADMIN", "users.manage")).toBe(false);
    expect(can("ADMIN", "payments.configure")).toBe(false);
  });

  it("FLORIST_STAFF can only see orders and update preparation", () => {
    expect(can("FLORIST_STAFF", "orders.view_all")).toBe(true);
    expect(can("FLORIST_STAFF", "orders.update_preparation")).toBe(true);
    expect(can("FLORIST_STAFF", "products.manage")).toBe(false);
    expect(can("FLORIST_STAFF", "orders.update_delivery")).toBe(false);
  });

  it("DELIVERY_STAFF can only update delivery status", () => {
    expect(can("DELIVERY_STAFF", "orders.update_delivery")).toBe(true);
    expect(can("DELIVERY_STAFF", "orders.update_preparation")).toBe(false);
    expect(can("DELIVERY_STAFF", "products.manage")).toBe(false);
  });

  it("CUSTOMER can place and view own orders only", () => {
    expect(can("CUSTOMER", "orders.place")).toBe(true);
    expect(can("CUSTOMER", "orders.view_own")).toBe(true);
    expect(can("CUSTOMER", "orders.view_all")).toBe(false);
    expect(can("CUSTOMER", "products.manage")).toBe(false);
  });
});
```

- [ ] **Step 6: Run tests to verify they fail**

```bash
npm test
```

Expected: fail with module-not-found or similar.

- [ ] **Step 7: Implement rbac.ts**

Create `src/lib/rbac.ts`:
```ts
export type Role =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "FLORIST_STAFF"
  | "DELIVERY_STAFF"
  | "CUSTOMER";

export type Permission =
  | "products.manage"
  | "variants.manage"
  | "stock.manage"
  | "orders.view_all"
  | "orders.update_preparation"
  | "orders.update_delivery"
  | "users.manage"
  | "payments.configure"
  | "orders.place"
  | "orders.view_own";

const matrix: Record<Role, Permission[]> = {
  SUPER_ADMIN: [
    "products.manage",
    "variants.manage",
    "stock.manage",
    "orders.view_all",
    "orders.update_preparation",
    "orders.update_delivery",
    "users.manage",
    "payments.configure",
    "orders.place",
    "orders.view_own",
  ],
  ADMIN: [
    "products.manage",
    "variants.manage",
    "stock.manage",
    "orders.view_all",
    "orders.update_preparation",
    "orders.update_delivery",
  ],
  FLORIST_STAFF: ["orders.view_all", "orders.update_preparation"],
  DELIVERY_STAFF: ["orders.view_all", "orders.update_delivery"],
  CUSTOMER: ["orders.place", "orders.view_own"],
};

export function can(role: Role, permission: Permission): boolean {
  return matrix[role]?.includes(permission) ?? false;
}
```

- [ ] **Step 8: Run tests to verify they pass**

```bash
npm test
```

Expected: all 5 tests pass.

- [ ] **Step 9: Commit**

```bash
git add src/lib/rbac.ts tests/ vitest.config.ts package.json package-lock.json
git commit -m "feat: add RBAC permission matrix with tests"
```

---

## Task 7: Build auth helpers (requireRole, getOrCreateUser)

**Files:**
- Modify: `prisma/schema.prisma` (add User model)
- Create: `src/lib/auth.ts`
- Create: `tests/unit/auth.test.ts`

- [ ] **Step 1: Add User model to Prisma schema**

Replace `prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  SUPER_ADMIN
  ADMIN
  FLORIST_STAFF
  DELIVERY_STAFF
  CUSTOMER
}

model User {
  id          String   @id @default(cuid())
  clerkUserId String?  @unique
  email       String   @unique
  name        String?
  phone       String?
  role        Role     @default(CUSTOMER)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

- [ ] **Step 2: Migrate**

```bash
npx prisma migrate dev --name add_user
```

Expected: migration runs, creates `User` table.

- [ ] **Step 3: Write failing test for getOrCreateUser**

Create `tests/unit/auth.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("@clerk/nextjs/server", () => ({
  clerkClient: vi.fn(async () => ({
    users: {
      getUser: vi.fn(async (id: string) => ({
        id,
        emailAddresses: [{ emailAddress: "test@example.com" }],
        firstName: "Test",
        lastName: "User",
        publicMetadata: { role: "CUSTOMER" },
      })),
    },
  })),
}));

const { getOrCreateUser } = await import("@/lib/auth");
const { db } = await import("@/lib/db");

describe("getOrCreateUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns existing user when found", async () => {
    const existing = {
      id: "u1",
      clerkUserId: "clerk_abc",
      email: "test@example.com",
      name: "Test User",
      phone: null,
      role: "CUSTOMER" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    vi.mocked(db.user.findUnique).mockResolvedValueOnce(existing);

    const user = await getOrCreateUser("clerk_abc");

    expect(user).toEqual(existing);
    expect(db.user.create).not.toHaveBeenCalled();
  });

  it("creates user from Clerk when not found locally", async () => {
    vi.mocked(db.user.findUnique).mockResolvedValueOnce(null);
    const created = {
      id: "u2",
      clerkUserId: "clerk_abc",
      email: "test@example.com",
      name: "Test User",
      phone: null,
      role: "CUSTOMER" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    vi.mocked(db.user.create).mockResolvedValueOnce(created);

    const user = await getOrCreateUser("clerk_abc");

    expect(user).toEqual(created);
    expect(db.user.create).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

```bash
npm test
```

Expected: fail with module-not-found for `@/lib/auth`.

- [ ] **Step 5: Implement auth.ts**

Create `src/lib/auth.ts`:
```ts
import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { can, type Permission, type Role } from "@/lib/rbac";

export async function getOrCreateUser(clerkUserId: string) {
  const existing = await db.user.findUnique({ where: { clerkUserId } });
  if (existing) return existing;

  const client = await clerkClient();
  const clerkUser = await client.users.getUser(clerkUserId);
  const email = clerkUser.emailAddresses[0]?.emailAddress;
  if (!email) throw new Error("Clerk user has no email");
  const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null;
  const role = (clerkUser.publicMetadata?.role as Role) ?? "CUSTOMER";

  return db.user.create({
    data: {
      clerkUserId,
      email,
      name,
      role,
    },
  });
}

export async function getCurrentUser() {
  const { userId } = await auth();
  if (!userId) return null;
  return getOrCreateUser(userId);
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  return user;
}

export async function requireRole(...allowed: Role[]) {
  const user = await requireUser();
  if (!allowed.includes(user.role)) {
    redirect("/");
  }
  return user;
}

export async function requirePermission(permission: Permission) {
  const user = await requireUser();
  if (!can(user.role, permission)) {
    redirect("/");
  }
  return user;
}
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
npm test
```

Expected: both new tests pass alongside the RBAC tests.

- [ ] **Step 7: Commit**

```bash
git add prisma/ src/lib/auth.ts tests/unit/auth.test.ts
git commit -m "feat: add auth helpers with getOrCreateUser fallback"
```

---

## Task 8: Create Clerk webhook for user sync

**Files:**
- Create: `src/app/api/clerk/webhook/route.ts`
- Modify: `package.json` (adds svix)

- [ ] **Step 1: Install Svix**

Svix is what Clerk uses to sign webhooks.
```bash
npm install svix
```

- [ ] **Step 2: Defer Clerk webhook configuration until Vercel deploy**

Webhook needs a public URL, which you'll have after Task 11. **Do not configure the webhook in Clerk yet.** Just write the route handler in this task. Set a placeholder value in `.env.local` so env validation passes:
```
CLERK_WEBHOOK_SIGNING_SECRET="whsec_placeholder_will_be_set_after_vercel_deploy"
```
The real signing secret is added in Task 11 Step 7.

- [ ] **Step 3: Create webhook route**

Create `src/app/api/clerk/webhook/route.ts`:
```ts
import { headers } from "next/headers";
import { Webhook } from "svix";
import { db } from "@/lib/db";
import { type Role } from "@/lib/rbac";

type ClerkWebhookEvent = {
  type: "user.created" | "user.updated" | "user.deleted";
  data: {
    id: string;
    email_addresses?: { email_address: string; id: string }[];
    primary_email_address_id?: string;
    first_name?: string | null;
    last_name?: string | null;
    public_metadata?: { role?: Role };
  };
};

export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
  if (!secret) {
    return new Response("Webhook secret not configured", { status: 500 });
  }

  const headerList = await headers();
  const svixId = headerList.get("svix-id");
  const svixTimestamp = headerList.get("svix-timestamp");
  const svixSignature = headerList.get("svix-signature");
  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing Svix headers", { status: 400 });
  }

  const body = await req.text();
  const wh = new Webhook(secret);

  let evt: ClerkWebhookEvent;
  try {
    evt = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkWebhookEvent;
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  const clerkUserId = evt.data.id;

  if (evt.type === "user.deleted") {
    await db.user.deleteMany({ where: { clerkUserId } });
    return new Response("ok", { status: 200 });
  }

  const primaryEmail =
    evt.data.email_addresses?.find(
      (e) => e.id === evt.data.primary_email_address_id
    )?.email_address ?? evt.data.email_addresses?.[0]?.email_address;

  if (!primaryEmail) {
    return new Response("No email", { status: 400 });
  }

  const name =
    [evt.data.first_name, evt.data.last_name].filter(Boolean).join(" ") || null;
  const role = (evt.data.public_metadata?.role as Role) ?? "CUSTOMER";

  await db.user.upsert({
    where: { clerkUserId },
    update: { email: primaryEmail, name, role },
    create: { clerkUserId, email: primaryEmail, name, role },
  });

  return new Response("ok", { status: 200 });
}
```

- [ ] **Step 4: Verify route does not error on build**

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add Clerk user-sync webhook"
```

---

## Task 9: Install shadcn/ui and add base components

**Files:**
- Create: `components.json`
- Create: `src/lib/utils.ts`
- Multiple files in `src/components/ui/`
- Modify: `src/app/globals.css`, `tailwind.config.ts`

- [ ] **Step 1: Run shadcn init**

```bash
npx shadcn@latest init
```

Choose:
- Style: New York
- Base color: Stone
- CSS variables: Yes

This writes `components.json`, updates `globals.css` and `tailwind.config.ts`, and creates `src/lib/utils.ts`.

- [ ] **Step 2: Install commonly-used components**

```bash
npx shadcn@latest add button input label card table dialog dropdown-menu select textarea form
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: install shadcn/ui + base components"
```

---

## Task 10: Build admin layout shell with role gate

**Files:**
- Create: `src/app/admin/layout.tsx`
- Create: `src/app/admin/page.tsx`
- Create: `src/app/admin/products/page.tsx`
- Create: `src/app/admin/categories/page.tsx`
- Create: `src/app/admin/inventory/page.tsx`
- Create: `src/app/admin/orders/page.tsx`
- Create: `src/app/admin/delivery/page.tsx`
- Create: `src/app/admin/discounts/page.tsx`
- Create: `src/app/admin/users/page.tsx`
- Create: `src/app/admin/settings/page.tsx`

- [ ] **Step 1: Create admin layout**

Create `src/app/admin/layout.tsx`:
```tsx
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { UserButton } from "@clerk/nextjs";

const nav = [
  { href: "/admin", label: "Beranda" },
  { href: "/admin/products", label: "Produk" },
  { href: "/admin/categories", label: "Kategori" },
  { href: "/admin/inventory", label: "Inventaris" },
  { href: "/admin/orders", label: "Pesanan" },
  { href: "/admin/delivery", label: "Pengiriman" },
  { href: "/admin/discounts", label: "Diskon" },
  { href: "/admin/users", label: "Pengguna" },
  { href: "/admin/settings", label: "Pengaturan" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole("SUPER_ADMIN", "ADMIN");

  return (
    <div className="flex min-h-screen">
      <aside className="w-60 border-r bg-stone-50 p-4">
        <Link href="/admin" className="block text-xl font-bold text-pink-900">
          njs Florist
        </Link>
        <p className="text-xs text-stone-500">Admin</p>
        <nav className="mt-6 space-y-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded px-3 py-2 text-sm hover:bg-stone-200"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex-1">
        <header className="flex items-center justify-end border-b p-4">
          <UserButton />
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create admin home page**

Create `src/app/admin/page.tsx`:
```tsx
export default function AdminHomePage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="mt-2 text-stone-600">
        Selamat datang di panel admin njs Florist. Pilih menu di sebelah kiri untuk mulai.
      </p>
    </div>
  );
}
```

- [ ] **Step 3: Create empty stub pages for each admin section**

Create each file with the exact content shown. The body text references the plan number where that subsystem is implemented.

`src/app/admin/products/page.tsx`:
```tsx
export default function ProductsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Produk</h1>
      <p className="mt-2 text-stone-600">Manajemen produk akan diimplementasikan di Plan 02.</p>
    </div>
  );
}
```

`src/app/admin/categories/page.tsx`:
```tsx
export default function CategoriesPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Kategori</h1>
      <p className="mt-2 text-stone-600">Manajemen kategori akan diimplementasikan di Plan 02.</p>
    </div>
  );
}
```

`src/app/admin/inventory/page.tsx`:
```tsx
export default function InventoryPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Inventaris</h1>
      <p className="mt-2 text-stone-600">Manajemen inventaris akan diimplementasikan di Plan 03.</p>
    </div>
  );
}
```

`src/app/admin/orders/page.tsx`:
```tsx
export default function OrdersPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Pesanan</h1>
      <p className="mt-2 text-stone-600">Manajemen pesanan akan diimplementasikan di Plan 09.</p>
    </div>
  );
}
```

`src/app/admin/delivery/page.tsx`:
```tsx
export default function DeliveryPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Pengiriman</h1>
      <p className="mt-2 text-stone-600">Manajemen slot pengiriman akan diimplementasikan di Plan 09.</p>
    </div>
  );
}
```

`src/app/admin/discounts/page.tsx`:
```tsx
export default function DiscountsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Diskon</h1>
      <p className="mt-2 text-stone-600">Manajemen kode diskon akan diimplementasikan di Plan 09.</p>
    </div>
  );
}
```

`src/app/admin/users/page.tsx`:
```tsx
export default function UsersPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Pengguna</h1>
      <p className="mt-2 text-stone-600">Manajemen pengguna akan diimplementasikan di Plan 10.</p>
    </div>
  );
}
```

`src/app/admin/settings/page.tsx`:
```tsx
export default function SettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Pengaturan</h1>
      <p className="mt-2 text-stone-600">Pengaturan toko akan diimplementasikan di Plan 11.</p>
    </div>
  );
}
```

- [ ] **Step 4: Create your admin account and promote it to SUPER_ADMIN**

1. Run `npm run dev` and visit `http://localhost:3000/sign-up`. Sign up with your real email.
2. In the Clerk dashboard → Users, find the user you just created.
3. Open the user → "Metadata" tab → "Public metadata".
4. Set value to: `{ "role": "SUPER_ADMIN" }`. Save.
5. Sign out and back in for the new role to take effect.

(Self-service role management UI comes in Plan 10. For now this manual promotion is the only way to grant admin access.)

- [ ] **Step 5: Verify admin renders**

```bash
npm run dev
```

Visit `http://localhost:3000/admin`. Sign in if needed. Expected: sidebar nav with 9 items, "Dashboard" heading. Click each nav link — each should show its placeholder page.

- [ ] **Step 6: Commit**

```bash
git add src/app/admin/
git commit -m "feat: add admin shell with role gate and stub pages"
```

---

## Task 11: Deploy to Vercel and verify preview

**Files:**
- Create: `vercel.json`

- [ ] **Step 1: Push current state to GitHub**

```bash
git push
```

- [ ] **Step 2: Import project to Vercel**

In Vercel dashboard:
1. Add New → Project → Import the GitHub repo.
2. Framework preset: Next.js (auto-detected).
3. Build & Output: defaults.
4. **Do not deploy yet** — add env vars first.

- [ ] **Step 3: Add env vars in Vercel**

In project Settings → Environment Variables, add for both "Preview" and "Production":
- `DATABASE_URL` — Neon connection string (the pooled one)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `CLERK_WEBHOOK_SIGNING_SECRET`
- `NEXT_PUBLIC_APP_URL` — set to `https://<your-vercel-domain>.vercel.app` (you'll know after first deploy; update once known)
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`
- `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/`
- `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/`

- [ ] **Step 4: Create vercel.json with Prisma generate hook**

Create `vercel.json`:
```json
{
  "buildCommand": "prisma generate && next build"
}
```

- [ ] **Step 5: Commit and deploy**

```bash
git add vercel.json
git commit -m "chore: configure Vercel build to run prisma generate"
git push
```

Vercel auto-deploys.

- [ ] **Step 6: Verify preview**

When deploy completes, visit the preview URL. Expected:
- Homepage renders with "njs Florist" hero.
- `/sign-in` shows Clerk UI.
- After signing in with your SUPER_ADMIN account, `/admin` renders.

- [ ] **Step 7: Update Clerk webhook URL**

In Clerk dashboard → Webhooks → your endpoint, update the URL to `https://<vercel-domain>/api/clerk/webhook`. Save.

Trigger a test event from Clerk dashboard. Expected: 200 OK response.

- [ ] **Step 8: Update NEXT_PUBLIC_APP_URL in Vercel env vars**

Set it to the actual production domain (or current preview). Redeploy if needed.

---

## Task 12: Set up Sentry error reporting

**Files:**
- Create: `sentry.client.config.ts`
- Create: `sentry.server.config.ts`
- Create: `sentry.edge.config.ts`
- Create: `instrumentation.ts`
- Modify: `next.config.ts`

- [ ] **Step 1: Run Sentry wizard**

```bash
npx @sentry/wizard@latest -i nextjs
```

Follow prompts:
- Select your Sentry org + project (or create new).
- Let it modify `next.config.ts`, add config files, etc.
- It writes `SENTRY_AUTH_TOKEN` and `NEXT_PUBLIC_SENTRY_DSN` to `.env.sentry-build-plugin` or `.env.local`. Move them into `.env.local` if not already there.

- [ ] **Step 2: Confirm config files exist**

Verify these were created:
- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`
- `instrumentation.ts` (or in `src/instrumentation.ts`)

- [ ] **Step 3: Lower default sample rates for dev**

Open each Sentry config file and set:
```ts
tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 0,
replaysSessionSampleRate: 0,
replaysOnErrorSampleRate: 1.0,
```

(Sentry traces add noise during dev; we only want errors.)

- [ ] **Step 4: Add a test error to verify wiring**

Add a temporary throw in `src/app/page.tsx`:
```tsx
if (typeof window !== "undefined" && new URLSearchParams(window.location.search).has("sentry-test")) {
  throw new Error("Sentry test error");
}
```

Wait — this won't work in a server component. Instead, add a temporary route. Create `src/app/sentry-test/page.tsx`:
```tsx
export default function SentryTest() {
  throw new Error("Sentry test error from njs Florist");
}
```

Run `npm run dev`, visit `http://localhost:3000/sentry-test`. Expected: error rendered. Open Sentry dashboard — the event should appear within ~30 seconds.

- [ ] **Step 5: Delete the test route**

```bash
rm -rf src/app/sentry-test
```

- [ ] **Step 6: Add SENTRY_AUTH_TOKEN to Vercel env vars**

Same env var pages as Task 11. Add `SENTRY_AUTH_TOKEN` and `NEXT_PUBLIC_SENTRY_DSN` for Preview + Production.

- [ ] **Step 7: Commit and deploy**

```bash
git add -A
git commit -m "feat: integrate Sentry error reporting"
git push
```

Verify preview build succeeds.

---

## Task 13: Write the full Prisma schema

**Files:**
- Modify: `prisma/schema.prisma`

This task adds every model needed for the entire MVP. Later plans add columns or relations as scope clarifies but don't add new top-level models (any addition gets renegotiated against this schema).

- [ ] **Step 1: Replace prisma/schema.prisma**

Overwrite `prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================================
// Enums
// ============================================================

enum Role {
  SUPER_ADMIN
  ADMIN
  FLORIST_STAFF
  DELIVERY_STAFF
  CUSTOMER
}

enum ProductStatus {
  DRAFT
  ACTIVE
  ARCHIVED
}

enum OrderStatus {
  DRAFT
  PENDING_PAYMENT
  PAID
  PREPARING
  READY_FOR_DELIVERY
  OUT_FOR_DELIVERY
  DELIVERED
  COMPLETED
  PAYMENT_FAILED
  EXPIRED
  CANCELLED
  REFUNDED
}

enum PaymentStatus {
  PENDING
  PAID
  FAILED
  EXPIRED
  CANCELLED
  REFUNDED
}

enum StockMovementType {
  IN
  OUT
  RESERVED
  RELEASED
  ADJUSTMENT
}

enum ReservationStatus {
  ACTIVE
  COMMITTED
  EXPIRED
  CANCELLED
}

enum DiscountType {
  FIXED
  PERCENT
}

// ============================================================
// Users
// ============================================================

model User {
  id          String   @id @default(cuid())
  clerkUserId String?  @unique
  email       String   @unique
  name        String?
  phone       String?
  role        Role     @default(CUSTOMER)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  orders Order[]
  carts  Cart[]
}

// ============================================================
// Catalog
// ============================================================

model Category {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  imageUrl  String?
  sortOrder Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  products Product[]
}

model Product {
  id                String        @id @default(cuid())
  categoryId        String
  name              String
  slug              String        @unique
  description       String
  basePrice         Int
  status            ProductStatus @default(DRAFT)
  isSameDayEligible Boolean       @default(false)
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt

  category Category         @relation(fields: [categoryId], references: [id])
  images   ProductImage[]
  variants ProductVariant[]
  addons   ProductAddon[]
}

model ProductImage {
  id        String @id @default(cuid())
  productId String
  url       String
  altText   String?
  sortOrder Int    @default(0)

  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)
}

model ProductVariant {
  id          String  @id @default(cuid())
  productId   String
  name        String
  size        String?
  color       String?
  wrapper     String?
  priceAdjust Int     @default(0)
  sku         String  @unique
  isActive    Boolean @default(true)

  product    Product         @relation(fields: [productId], references: [id], onDelete: Cascade)
  recipes    VariantRecipe[]
  cartItems  CartItem[]
  orderItems OrderItem[]
}

model Addon {
  id          String  @id @default(cuid())
  name        String
  price       Int
  stockItemId String?
  isActive    Boolean @default(true)

  productAddons   ProductAddon[]
  cartItemAddons  CartItemAddon[]
  orderItemAddons OrderItemAddon[]
}

model ProductAddon {
  id        String @id @default(cuid())
  productId String
  addonId   String

  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  addon   Addon   @relation(fields: [addonId], references: [id])

  @@unique([productId, addonId])
}

// ============================================================
// Inventory
// ============================================================

model InventoryItem {
  id           String   @id @default(cuid())
  name         String
  unit         String
  sku          String   @unique
  currentQty   Int      @default(0)
  reorderLevel Int      @default(0)
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  recipes      VariantRecipe[]
  movements    StockMovement[]
  reservations StockReservation[]
}

model VariantRecipe {
  id              String @id @default(cuid())
  variantId       String
  inventoryItemId String
  quantityNeeded  Int

  variant       ProductVariant @relation(fields: [variantId], references: [id], onDelete: Cascade)
  inventoryItem InventoryItem  @relation(fields: [inventoryItemId], references: [id])

  @@unique([variantId, inventoryItemId])
}

model StockMovement {
  id              String            @id @default(cuid())
  inventoryItemId String
  type            StockMovementType
  quantity        Int
  reason          String?
  orderId         String?
  createdById     String?
  createdAt       DateTime          @default(now())

  inventoryItem InventoryItem @relation(fields: [inventoryItemId], references: [id])
}

model StockReservation {
  id              String            @id @default(cuid())
  orderId         String
  inventoryItemId String
  quantity        Int
  status          ReservationStatus @default(ACTIVE)
  expiresAt       DateTime
  createdAt       DateTime          @default(now())

  order         Order         @relation(fields: [orderId], references: [id])
  inventoryItem InventoryItem @relation(fields: [inventoryItemId], references: [id])

  @@index([status, expiresAt])
}

// ============================================================
// Cart
// ============================================================

model Cart {
  id        String   @id @default(cuid())
  userId    String?
  sessionId String?  @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user  User?      @relation(fields: [userId], references: [id])
  items CartItem[]

  @@index([userId])
}

model CartItem {
  id          String  @id @default(cuid())
  cartId      String
  productId   String
  variantId   String
  quantity    Int
  cardMessage String?

  cart    Cart            @relation(fields: [cartId], references: [id], onDelete: Cascade)
  variant ProductVariant  @relation(fields: [variantId], references: [id])
  addons  CartItemAddon[]
}

model CartItemAddon {
  id         String @id @default(cuid())
  cartItemId String
  addonId    String
  quantity   Int

  cartItem CartItem @relation(fields: [cartItemId], references: [id], onDelete: Cascade)
  addon    Addon    @relation(fields: [addonId], references: [id])
}

// ============================================================
// Orders
// ============================================================

model Order {
  id              String      @id @default(cuid())
  orderNumber     String      @unique
  userId          String?
  status          OrderStatus @default(PENDING_PAYMENT)
  subtotal        Int
  deliveryFee     Int
  discountAmount  Int         @default(0)
  total           Int
  discountCodeId  String?
  recipientName   String
  recipientPhone  String
  recipientEmail  String?
  senderName      String
  isAnonymous     Boolean     @default(false)
  cardMessage     String?
  deliveryDate    DateTime
  deliverySlotId  String
  deliveryAddress String
  deliveryMapsUrl String?
  deliveryNotes   String?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  user         User?              @relation(fields: [userId], references: [id])
  deliverySlot DeliverySlot       @relation(fields: [deliverySlotId], references: [id])
  discountCode DiscountCode?      @relation(fields: [discountCodeId], references: [id])
  items        OrderItem[]
  payments     Payment[]
  reservations StockReservation[]

  @@index([status, deliveryDate])
  @@index([userId])
}

model OrderItem {
  id          String @id @default(cuid())
  orderId     String
  productId   String
  variantId   String
  productName String
  variantName String
  unitPrice   Int
  quantity    Int
  totalPrice  Int

  order   Order            @relation(fields: [orderId], references: [id], onDelete: Cascade)
  variant ProductVariant   @relation(fields: [variantId], references: [id])
  addons  OrderItemAddon[]
}

model OrderItemAddon {
  id          String @id @default(cuid())
  orderItemId String
  addonId     String
  addonName   String
  unitPrice   Int
  quantity    Int
  totalPrice  Int

  orderItem OrderItem @relation(fields: [orderItemId], references: [id], onDelete: Cascade)
  addon     Addon     @relation(fields: [addonId], references: [id])
}

// ============================================================
// Payments
// ============================================================

model Payment {
  id              String        @id @default(cuid())
  orderId         String
  provider        String
  providerOrderId String        @unique
  providerToken   String?
  redirectUrl     String?
  status          PaymentStatus @default(PENDING)
  amount          Int
  paidAt          DateTime?
  rawResponse     Json?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  order Order @relation(fields: [orderId], references: [id])
}

model WebhookEvent {
  id          String   @id @default(cuid())
  provider    String
  eventId     String
  payload     Json
  processedAt DateTime @default(now())

  @@unique([provider, eventId])
}

// ============================================================
// Delivery
// ============================================================

model DeliverySlot {
  id        String   @id @default(cuid())
  label     String
  startTime String
  endTime   String
  capacity  Int
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())

  orders Order[]
}

model DeliveryBlockedDate {
  id        String   @id @default(cuid())
  date      DateTime @unique
  reason    String?
  createdAt DateTime @default(now())
}

// ============================================================
// Discounts
// ============================================================

model DiscountCode {
  id        String       @id @default(cuid())
  code      String       @unique
  type      DiscountType
  value     Int
  minSpend  Int?
  maxUses   Int?
  usedCount Int          @default(0)
  startsAt  DateTime?
  endsAt    DateTime?
  isActive  Boolean      @default(true)
  createdAt DateTime     @default(now())
  updatedAt DateTime     @updatedAt

  orders Order[]
}

// ============================================================
// Settings & Audit
// ============================================================

model AppSetting {
  key       String   @id
  value     String
  updatedAt DateTime @updatedAt
}

model ActivityLog {
  id        String   @id @default(cuid())
  actorId   String?
  action    String
  entity    String
  entityId  String?
  metadata  Json?
  createdAt DateTime @default(now())

  @@index([entity, entityId])
  @@index([createdAt])
}
```

- [ ] **Step 2: Migrate**

```bash
npx prisma migrate dev --name full_schema
```

Expected: migration applies cleanly, prints "Your database is now in sync with your schema."

- [ ] **Step 3: Verify with Prisma Studio**

```bash
npm run db:studio
```

Open the URL it prints (usually `http://localhost:5555`). Confirm every model is visible and the User table still has your dev user (or that it was wiped — that's fine, Clerk will re-create on next login via `getOrCreateUser`).

- [ ] **Step 4: Commit**

```bash
git add prisma/
git commit -m "feat: add full Prisma schema for entire MVP domain"
```

---

## Task 14: Write the seed script

**Files:**
- Create: `prisma/seed.ts`
- Modify: `package.json` (point Prisma at seed command)

- [ ] **Step 1: Add Prisma seed config to package.json**

Add to root of `package.json`:
```json
"prisma": {
  "seed": "tsx prisma/seed.ts"
}
```

- [ ] **Step 2: Create seed script**

Create `prisma/seed.ts`:
```ts
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("Seeding…");

  // --------- AppSettings ---------
  await db.appSetting.upsert({
    where: { key: "delivery_fee_idr" },
    create: { key: "delivery_fee_idr", value: "35000" },
    update: { value: "35000" },
  });
  await db.appSetting.upsert({
    where: { key: "same_day_cutoff_hour_wita" },
    create: { key: "same_day_cutoff_hour_wita", value: "14" },
    update: { value: "14" },
  });
  await db.appSetting.upsert({
    where: { key: "store_name" },
    create: { key: "store_name", value: "njs Florist" },
    update: { value: "njs Florist" },
  });

  // --------- Categories ---------
  const categories = [
    { name: "Bunga Ulang Tahun", slug: "ulang-tahun", sortOrder: 1 },
    { name: "Bunga Pernikahan", slug: "pernikahan", sortOrder: 2 },
    { name: "Bunga Duka Cita", slug: "duka-cita", sortOrder: 3 },
    { name: "Bunga Awet (Preserved)", slug: "preserved", sortOrder: 4 },
    { name: "Flower Box", slug: "flower-box", sortOrder: 5 },
  ];
  for (const c of categories) {
    await db.category.upsert({
      where: { slug: c.slug },
      create: c,
      update: c,
    });
  }

  // --------- Inventory items ---------
  const items = [
    { sku: "RAW-ROSE-RED", name: "Mawar Merah", unit: "tangkai", currentQty: 300, reorderLevel: 50 },
    { sku: "RAW-ROSE-WHITE", name: "Mawar Putih", unit: "tangkai", currentQty: 180, reorderLevel: 50 },
    { sku: "RAW-BABYBREATH", name: "Baby Breath", unit: "ikat", currentQty: 40, reorderLevel: 10 },
    { sku: "RAW-WRAP-PREMIUM", name: "Wrapper Premium", unit: "pcs", currentQty: 100, reorderLevel: 20 },
    { sku: "RAW-WRAP-STD", name: "Wrapper Standard", unit: "pcs", currentQty: 200, reorderLevel: 30 },
    { sku: "RAW-RIBBON", name: "Pita", unit: "pcs", currentQty: 150, reorderLevel: 30 },
    { sku: "RAW-VASE-GLASS", name: "Vas Kaca", unit: "pcs", currentQty: 30, reorderLevel: 10 },
    { sku: "RAW-TUBE", name: "Water Tube", unit: "pcs", currentQty: 500, reorderLevel: 100 },
  ];
  for (const item of items) {
    await db.inventoryItem.upsert({
      where: { sku: item.sku },
      create: item,
      update: item,
    });
  }

  // --------- Sample product with variants & recipes ---------
  const birthdayCategory = await db.category.findUnique({
    where: { slug: "ulang-tahun" },
  });
  if (!birthdayCategory) throw new Error("Seed: category missing");

  const product = await db.product.upsert({
    where: { slug: "romantic-mawar-merah" },
    create: {
      slug: "romantic-mawar-merah",
      name: "Romantic Mawar Merah",
      description:
        "Buket mawar merah segar dipadu baby breath, dibungkus rapi dengan wrapper dan pita.",
      basePrice: 350000,
      status: "ACTIVE",
      isSameDayEligible: true,
      categoryId: birthdayCategory.id,
    },
    update: {
      name: "Romantic Mawar Merah",
      basePrice: 350000,
      status: "ACTIVE",
      isSameDayEligible: true,
      categoryId: birthdayCategory.id,
    },
  });

  const rose = await db.inventoryItem.findUniqueOrThrow({ where: { sku: "RAW-ROSE-RED" } });
  const baby = await db.inventoryItem.findUniqueOrThrow({ where: { sku: "RAW-BABYBREATH" } });
  const wrapPremium = await db.inventoryItem.findUniqueOrThrow({ where: { sku: "RAW-WRAP-PREMIUM" } });
  const wrapStd = await db.inventoryItem.findUniqueOrThrow({ where: { sku: "RAW-WRAP-STD" } });
  const ribbon = await db.inventoryItem.findUniqueOrThrow({ where: { sku: "RAW-RIBBON" } });
  const tube = await db.inventoryItem.findUniqueOrThrow({ where: { sku: "RAW-TUBE" } });

  const variants = [
    {
      sku: "RMM-S-RED-STD",
      name: "Small / Standard",
      size: "Small",
      color: "Merah",
      wrapper: "Standard",
      priceAdjust: 0,
      recipe: [
        { item: rose, qty: 12 },
        { item: baby, qty: 1 },
        { item: wrapStd, qty: 1 },
        { item: ribbon, qty: 1 },
        { item: tube, qty: 1 },
      ],
    },
    {
      sku: "RMM-M-RED-PREMIUM",
      name: "Medium / Premium",
      size: "Medium",
      color: "Merah",
      wrapper: "Premium",
      priceAdjust: 150000,
      recipe: [
        { item: rose, qty: 24 },
        { item: baby, qty: 3 },
        { item: wrapPremium, qty: 1 },
        { item: ribbon, qty: 1 },
        { item: tube, qty: 1 },
      ],
    },
    {
      sku: "RMM-L-RED-PREMIUM",
      name: "Large / Premium",
      size: "Large",
      color: "Merah",
      wrapper: "Premium",
      priceAdjust: 300000,
      recipe: [
        { item: rose, qty: 36 },
        { item: baby, qty: 4 },
        { item: wrapPremium, qty: 1 },
        { item: ribbon, qty: 2 },
        { item: tube, qty: 2 },
      ],
    },
  ];

  for (const v of variants) {
    const variant = await db.productVariant.upsert({
      where: { sku: v.sku },
      create: {
        sku: v.sku,
        productId: product.id,
        name: v.name,
        size: v.size,
        color: v.color,
        wrapper: v.wrapper,
        priceAdjust: v.priceAdjust,
        isActive: true,
      },
      update: {
        name: v.name,
        priceAdjust: v.priceAdjust,
        isActive: true,
      },
    });

    for (const r of v.recipe) {
      await db.variantRecipe.upsert({
        where: {
          variantId_inventoryItemId: {
            variantId: variant.id,
            inventoryItemId: r.item.id,
          },
        },
        create: {
          variantId: variant.id,
          inventoryItemId: r.item.id,
          quantityNeeded: r.qty,
        },
        update: { quantityNeeded: r.qty },
      });
    }
  }

  // --------- Add-ons ---------
  const addons = [
    { name: "Kartu Ucapan", price: 15000 },
    { name: "Vas Kaca", price: 75000 },
    { name: "Coklat", price: 50000 },
    { name: "Teddy Bear", price: 90000 },
  ];
  for (const a of addons) {
    const existing = await db.addon.findFirst({ where: { name: a.name } });
    if (existing) {
      await db.addon.update({ where: { id: existing.id }, data: { price: a.price, isActive: true } });
    } else {
      await db.addon.create({ data: { ...a, isActive: true } });
    }
  }

  // Attach all addons to the sample product
  const allAddons = await db.addon.findMany();
  for (const addon of allAddons) {
    await db.productAddon.upsert({
      where: { productId_addonId: { productId: product.id, addonId: addon.id } },
      create: { productId: product.id, addonId: addon.id },
      update: {},
    });
  }

  // --------- Delivery slots ---------
  const slots = [
    { label: "09:00 - 11:00", startTime: "09:00", endTime: "11:00", capacity: 8 },
    { label: "11:00 - 13:00", startTime: "11:00", endTime: "13:00", capacity: 8 },
    { label: "13:00 - 15:00", startTime: "13:00", endTime: "15:00", capacity: 8 },
    { label: "15:00 - 17:00", startTime: "15:00", endTime: "17:00", capacity: 8 },
    { label: "17:00 - 19:00", startTime: "17:00", endTime: "19:00", capacity: 6 },
  ];
  for (const s of slots) {
    const existing = await db.deliverySlot.findFirst({ where: { label: s.label } });
    if (existing) {
      await db.deliverySlot.update({ where: { id: existing.id }, data: s });
    } else {
      await db.deliverySlot.create({ data: s });
    }
  }

  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
```

- [ ] **Step 3: Run the seed script**

```bash
npm run db:seed
```

Expected: prints "Seeding…" then "Seeding complete." with no errors.

- [ ] **Step 4: Verify in Prisma Studio**

```bash
npm run db:studio
```

Confirm:
- 5 categories
- 8 inventory items
- 1 product with 3 variants
- 3 × ~5 recipe rows
- 4 add-ons attached to the product
- 5 delivery slots
- 3 app settings

- [ ] **Step 5: Commit**

```bash
git add prisma/seed.ts package.json
git commit -m "feat: add seed script with categories, sample product, variants, recipes, slots"
```

---

## Task 15: Write README with setup instructions

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Replace README**

Overwrite `README.md`:
```markdown
# njs Florist

E-commerce website for njs Florist (Bali, Indonesia). Modular monolith built with Next.js App Router, PostgreSQL on Neon, Clerk auth, Midtrans payments.

## Local setup

1. Clone the repo.
2. `cp .env.local.example .env.local` and fill in real values:
   - `DATABASE_URL` — Neon pooled connection string
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY` — from Clerk dashboard
   - `CLERK_WEBHOOK_SIGNING_SECRET` — from Clerk webhook config
   - `NEXT_PUBLIC_SENTRY_DSN` + `SENTRY_AUTH_TOKEN` — from Sentry project
   - `NEXT_PUBLIC_APP_URL` — `http://localhost:3000` locally
3. `npm install`
4. `npx prisma migrate dev`
5. `npm run db:seed`
6. `npm run dev`
7. Sign up at `/sign-up`. To promote your account, in Clerk dashboard set the user's `publicMetadata` to `{ "role": "SUPER_ADMIN" }`.

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Local dev server on port 3000 |
| `npm run build` | Production build |
| `npm run test` | Run Vitest unit tests |
| `npm run db:migrate` | Apply migrations |
| `npm run db:seed` | Seed sample data |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:reset` | Drop and recreate DB (destructive) |

## Architecture

See `docs/superpowers/specs/2026-05-11-njs-florist-mvp-design.md`.

## Plans

Implementation work is broken into 12 plans, one per subsystem, in `docs/superpowers/plans/`. Execute them in order.
```

- [ ] **Step 2: Commit and push**

```bash
git add README.md
git commit -m "docs: add setup README"
git push
```

---

## Task 16: Final verification

- [ ] **Step 1: Reset the project locally and walk the setup**

Imagine you're a new developer. Wipe `node_modules` and `.next`:
```bash
rm -rf node_modules .next
npm install
npm run build
npm test
```

Expected:
- `npm install` completes without error.
- `npm run build` succeeds.
- `npm test` shows all RBAC + auth tests pass.

- [ ] **Step 2: Verify Vercel preview is green**

Push to `main` (or open a PR). Check the Vercel deployment.

Expected:
- Build succeeds in Vercel.
- Preview URL renders homepage.
- `/sign-in` works.
- `/admin` accessible to your SUPER_ADMIN account.
- Clerk webhook deliveries return 200.

- [ ] **Step 3: Tag the milestone**

```bash
git tag plan-01-foundation-complete
git push --tags
```

- [ ] **Step 4: Final commit if anything was tweaked during verification**

```bash
git status
# commit anything outstanding with: git commit -m "chore: plan 01 verification fixes"
git push
```

---

## Acceptance criteria for Plan 01

When all tasks above are complete, the following must be true. Do not declare the plan done until every box is verifiable:

- [ ] `npm run build` succeeds locally with no warnings related to schema or env.
- [ ] `npm test` shows all RBAC + auth unit tests passing (≥ 7 tests).
- [ ] Visiting the Vercel preview URL renders the "njs Florist" homepage.
- [ ] `/sign-in` and `/sign-up` show the Clerk UI.
- [ ] After signing in as the dev account (with `SUPER_ADMIN` in Clerk publicMetadata), `/admin` renders the sidebar shell with 9 nav items.
- [ ] Each admin nav link routes to a placeholder page with an Indonesian heading.
- [ ] `prisma migrate status` reports no pending migrations.
- [ ] `npm run db:seed` is idempotent — running it twice does not error and does not duplicate rows.
- [ ] Prisma Studio shows: 5 categories, 8 inventory items, 1 product, 3 variants, 15 recipe rows, 4 add-ons, 5 delivery slots, 3 app settings.
- [ ] Clerk webhook deliveries to `/api/clerk/webhook` return HTTP 200.
- [ ] Sentry project has at least one event from the test error in Task 12 (later deleted).
- [ ] No secrets are committed (`.env.local` is gitignored).
