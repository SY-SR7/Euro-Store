# EuroStore — Phase 0: Monorepo & Tooling Setup Checklist

> This is the first phase of development. Complete every item before writing any application code.
> Each checkbox represents a concrete task. Check it off when done.

---

## 0.1 Prerequisites (Local Machine)

- [ ] Node.js LTS (v20+) installed
- [ ] pnpm installed globally (`npm install -g pnpm`)
- [ ] Supabase CLI installed (`npm install -g supabase`)
- [ ] Git configured with user name + email
- [ ] GitHub repository created (private): `eurostore` or `euro-store`
- [ ] Vercel account connected to GitHub repository

---

## 0.2 Monorepo Initialization

- [ ] Create root directory `euro-store/`
- [ ] Initialize git: `git init && git branch -M main`
- [ ] Create `pnpm-workspace.yaml`:
  ```yaml
  packages:
    - 'apps/*'
    - 'packages/*'
  ```
- [ ] Create `package.json` (root) with workspace config + Turborepo
- [ ] Install Turborepo: `pnpm add -Dw turbo`
- [ ] Create `turbo.json` with pipeline for `lint`, `type-check`, `test`, `build`, `dev`

---

## 0.3 App Scaffolding

- [ ] `apps/web/` — `pnpm create next-app@latest web --typescript --tailwind --app --src-dir`
- [ ] `apps/admin/` — same as above
- [ ] `apps/helper/` — same as above
- [ ] `apps/partner/` — same as above
- [ ] `apps/mobile/` — `npx create-expo-app@latest mobile --template blank-typescript`
- [ ] Verify all 4 Next.js apps run: `pnpm turbo dev`
- [ ] Verify Expo app runs: `pnpm --filter mobile start`

---

## 0.4 Shared Packages

- [ ] `packages/config/` — shared ESLint + TypeScript + Tailwind configs
  - `eslint-config/index.js`
  - `tsconfig/base.json`, `tsconfig/nextjs.json`, `tsconfig/react-native.json`
  - `tailwind-config/index.js` (includes RTL plugin + brand tokens)
- [ ] `packages/ui/` — shared component library
  - `package.json` with `@eurostore/ui` name
  - Base components: Button, Card, Input, Modal, Toast (RTL-aware)
  - Design tokens from `DESIGN.md` as CSS custom properties
  - Playfair Display + Manrope fonts loaded via `next/font` or Google Fonts
- [ ] `packages/database/` — Supabase types + client
  - `supabase-client.ts` — creates the Supabase client (anon key for client, service role for server)
  - Types generated from Supabase schema (after DB migrations applied): `supabase gen types typescript`
- [ ] `packages/adapters/` — all adapter interfaces + implementations
  - `/interfaces/IEmailAdapter.ts`
  - `/interfaces/IPushAdapter.ts`
  - `/interfaces/IPaymentAdapter.ts`
  - `/interfaces/ISearchAdapter.ts`
  - `/interfaces/IStorageAdapter.ts`
  - `/implementations/` (concrete classes — implemented later in Phase 13)
- [ ] `packages/shared/` — utilities, constants, types, hooks
  - `constants/governorates.ts` — all 14 Syrian governorates
  - `constants/roles.ts` — user role enum
  - `types/index.ts` — shared TypeScript types
  - `utils/currency.ts` — SYP → USD conversion utility
  - `utils/qr.ts` — QR code generation utilities

---

## 0.5 Security Foundation (Must Be Done Before ANY Code)

- [ ] Create `.gitignore` at root — include `.env`, `.env.local`, `.env.*.local`, `node_modules/`, `.next/`, `dist/`
- [ ] Create `.env.example` at root with ALL required keys, empty values, and descriptive comments:
  ```bash
  # Supabase
  NEXT_PUBLIC_SUPABASE_URL=
  NEXT_PUBLIC_SUPABASE_ANON_KEY=
  SUPABASE_SERVICE_ROLE_KEY=          # SERVER ONLY — never prefix with NEXT_PUBLIC_

  # Auth
  GOOGLE_CLIENT_ID=
  GOOGLE_CLIENT_SECRET=

  # Security
  EXCHANGE_QR_SECRET=                 # Random 64-char secret for HS256 JWT signing

  # Email
  RESEND_API_KEY=

  # Push Notifications
  EXPO_ACCESS_TOKEN=
  FCM_SERVICE_ACCOUNT=                # JSON stringified Firebase service account

  # Payment [TBD]
  SHAM_CASH_API_KEY=
  SHAM_CASH_API_URL=
  SHAM_CASH_WEBHOOK_SECRET=

  # App Config
  NEXT_PUBLIC_APP_URL=                # e.g., https://eurostore.com
  ```
- [ ] Create `.env.local` files in each app (from `.env.example`) — NEVER commit
- [ ] Verify `.env.local` is in `.gitignore` — `git check-ignore -v .env.local`
- [ ] Set up Vercel environment variables (dev, staging, prod scopes)
- [ ] Create `packages/config/security-headers.js` — Next.js security headers config:
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Content-Security-Policy: ...` (restrictive, no unsafe-inline)
- [ ] Apply security headers in `next.config.js` for all 4 Next.js apps

---

## 0.6 Database Project Setup

- [ ] Create Supabase project: `eurostore-dev` (development)
- [ ] Create Supabase project: `eurostore-staging` (staging)
- [ ] Create Supabase project: `eurostore-prod` (production)
- [ ] Initialize Supabase CLI in repo: `supabase init`
- [ ] Create `supabase/migrations/` directory
- [ ] Create first migration: `20260628000001_initial_schema.sql`
  - All `CREATE TABLE` statements from PRD Section 7.2 (in dependency order)
  - All `CREATE INDEX` statements from PRD Section 7.3
  - All FTS triggers from PRD Section 7.4
  - All RLS policies from PRD Section 7.5
  - Seed data: 14 Syrian governorates in `shipping_rates`, homepage section configs
- [ ] Apply migration to dev: `supabase db push --project-ref {dev-ref}`
- [ ] Generate TypeScript types: `supabase gen types typescript --project-id {dev-ref} > packages/database/src/types.ts`
- [ ] Create Supabase Storage buckets:
  - `product-images` (public)
  - `product-videos` (public)
  - `exchange-images` (private)
  - `loyalty-qr-codes` (private)
  - `exchange-qr-codes` (private)

---

## 0.7 CI/CD Pipeline

- [ ] Create `.github/workflows/ci.yml` with pipeline:
  1. `pnpm install` (cached)
  2. `pnpm turbo lint`
  3. `pnpm turbo type-check`
  4. `pnpm turbo test`
  5. `pnpm turbo build`
- [ ] Connect repo to Vercel — enable Preview deployments for all branches
- [ ] Configure Vercel: staging branch → staging.eurostore.com; main branch → eurostore.com
- [ ] Verify CI passes on an empty commit

---

## 0.8 Design System Foundation

- [ ] Load fonts in `packages/ui/`:
  - Playfair Display (Google Fonts) — headlines
  - Manrope (Google Fonts) — body/UI
  - Arabic: Noto Naskh Arabic or IBM Plex Arabic — for Arabic headlines
- [ ] Configure Tailwind with brand tokens in `packages/config/tailwind-config/index.js`:
  - Gold: `#C9A84C`, `#A67C2E`, `#E8D28A`
  - Dark backgrounds: `#0F0F0F`, `#1A1A1A`, `#242424`
  - All CSS custom properties from `DESIGN.md`
- [ ] Install and configure `tailwindcss-rtl` or use logical CSS properties
- [ ] Create global CSS file with `:root` and `[data-theme="dark"]` custom properties (from PRD 11.2)
- [ ] Implement theme toggle logic (localStorage `eurostore_theme`, respects `prefers-color-scheme`)
- [ ] Create base layout component with RTL/LTR direction switching

---

## 0.9 Rate Limiting Middleware

- [ ] Install `@upstash/ratelimit` or equivalent
- [ ] Create `packages/shared/middleware/rate-limit.ts` with rate limit configs:
  - Auth endpoints: 10 req / 15 min per IP
  - Admin login: 5 req / 15 min per IP
  - TOTP verification: 3 attempts → 30 min lockout
  - General API: 100 req / 1 min per user
  - Public search + product list: 60 req / 1 min per IP
- [ ] Apply middleware to all Next.js API routes via `middleware.ts`

---

## 0.10 Phase 0 Completion Gate

Before moving to Phase 1, verify:

- [ ] `pnpm turbo lint` passes with zero errors
- [ ] `pnpm turbo type-check` passes with zero errors
- [ ] All 4 Next.js apps build successfully: `pnpm turbo build`
- [ ] Expo app compiles with no TypeScript errors
- [ ] Supabase migration applied to dev project with all tables + RLS
- [ ] All Supabase Storage buckets created
- [ ] `.env.local` is confirmed in `.gitignore` (no accidental secret commits)
- [ ] Security headers verified in browser for all Next.js apps
- [ ] Rate limiting middleware integrated
- [ ] CI pipeline passes on GitHub Actions

---

## Notes

- Do not write any feature code until all Phase 0 items are checked off.
- The monorepo structure must be stable before adding application logic.
- If any tooling decision needs to change, create a new ADR in `ARCHITECTURE_DECISIONS.md`.

---

*Proceed to Phase 1 (Database) only after Phase 0 is 100% complete.*
