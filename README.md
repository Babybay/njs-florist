# njs Florist

Storefront, checkout, and admin workspace for **njs Florist Bali**, built on Next.js 16 (App Router), Prisma 6, Supabase Postgres, and Tailwind 4.

---

## Local development

```bash
# 1. Install dependencies (also runs `prisma generate`)
npm install

# 2. Copy env template and fill it in
cp .env.example .env.local

# 3. Apply database migrations
npm run db:migrate

# 4. (Optional) seed sample data
npm run db:seed

# 5. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Useful scripts

| Script              | What it does                                |
| ------------------- | ------------------------------------------- |
| `npm run dev`       | Start Next.js dev server                    |
| `npm run build`     | Production build                            |
| `npm run start`     | Serve the production build                  |
| `npm run db:migrate`| Run Prisma migrations (dev)                 |
| `npm run db:studio` | Open Prisma Studio                          |
| `npm run db:seed`   | Seed sample data                            |

---

## Deploy to Vercel

This repo is preconfigured to deploy on Vercel out of the box.

### 1 — Import the project

1. Push the repo to GitHub / GitLab / Bitbucket.
2. In the [Vercel dashboard](https://vercel.com/new), **Add New → Project** and import the repo.
3. Framework preset: **Next.js** (auto-detected).
4. Build & install commands: **leave as default** — `npm install` runs `postinstall` (`prisma generate`) and `next build` is run as the build step.

### 2 — Set environment variables

Copy every key from [`.env.example`](./.env.example) into **Project Settings → Environment Variables** for the **Production**, **Preview**, and **Development** scopes as appropriate. At minimum, the build needs:

- `DATABASE_URL` — pooled Postgres URL (e.g. Supabase `:6543` with `?pgbouncer=true`)
- `DIRECT_URL` — direct Postgres URL for migrations
- `NEXT_PUBLIC_APP_URL` — public origin of the deployed site (`https://your-domain.com`)

All other keys (Cloudinary, Resend, Midtrans, WhatsApp, Clerk, Supabase, Sentry, etc.) are optional — the app degrades gracefully when they're absent, but the related features are off.

### 3 — Region

[`vercel.json`](./vercel.json) pins Serverless Functions to **`sin1` (Singapore)** — the lowest-latency region for Bali / Indonesian traffic. Override in the dashboard if you need somewhere else.

### 4 — Database migrations

Vercel doesn't run `prisma migrate deploy` automatically. Run migrations from your local machine (or CI) against the production database before each release:

```bash
DATABASE_URL="<prod direct url>" npx prisma migrate deploy --schema src/prisma/schema.prisma
```

### 5 — Domain & assets

- Add your custom domain in **Project Settings → Domains** and update `NEXT_PUBLIC_APP_URL` to match.
- The logo lives at `public/logo.png` and is reused for the site header, admin shell, and app icons (`src/app/icon.png`, `src/app/apple-icon.png`).
- Remote image hosts are whitelisted in [`next.config.ts`](./next.config.ts) (`res.cloudinary.com`, `images.unsplash.com`, `*.supabase.co`). Add more there if you switch CDNs.

---

## Project structure

```
src/
  app/                 # Next.js App Router (storefront, admin, staff, auth)
    (store)/           # Public storefront routes
    admin/             # /admin workspace
    staff/             # Florist & delivery staff dashboards
    api/               # Route handlers (webhooks, cron, etc.)
  components/          # UI components, grouped by domain
  lib/                 # Cross-cutting helpers (auth, db, env, money, …)
  prisma/              # Schema, migrations, seed
  server/              # Services, server actions
public/                # Static assets (logo, favicons, etc.)
```

---

## Conventions

- This is **Next.js 16** — APIs and conventions may differ from older versions. When in doubt, check `node_modules/next/dist/docs/`.
- Environment variables are validated by Zod in [`src/lib/env.ts`](./src/lib/env.ts) — add a key there before using it.
- Prisma client target is `["native", "rhel-openssl-3.0.x"]` so the same binary works locally and on Vercel's Amazon Linux runtime.
