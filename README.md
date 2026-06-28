# EuroStore — متجر يورو

> **بلاتفورم أزياء ثنائي اللغة (عربي/إنجليزي) للسوق السورية**
> A bilingual Arabic/English fashion e-commerce platform built for the Syrian market.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-000000?logo=nextdotjs)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)](https://supabase.com/)
[![Turborepo](https://img.shields.io/badge/Turborepo-monorepo-EF4444?logo=turborepo)](https://turbo.build/)
[![pnpm](https://img.shields.io/badge/pnpm-10.x-F69220?logo=pnpm)](https://pnpm.io/)

---

## 🗂️ Monorepo Structure

```
euro-store/
├── apps/
│   ├── web/           # Customer storefront — eurostore.com          (Next.js 14)
│   ├── admin/         # Admin panel — admin.eurostore.com            (Next.js 14)
│   ├── helper/        # Helper portal — helper.eurostore.com         (Next.js 14)
│   ├── partner/       # Partner portal — partner.eurostore.com       (Next.js 14)
│   └── mobile/        # iOS + Android customer app                   (Expo)
│
├── packages/
│   ├── ui/            # Shared design system + component library
│   ├── database/      # Supabase client, TypeScript types, migrations
│   ├── adapters/      # IEmailAdapter, IPushAdapter, IPaymentAdapter, etc.
│   ├── config/        # Shared ESLint, TypeScript, Tailwind configs
│   └── shared/        # Shared utilities, types, constants, hooks
│
├── supabase/
│   ├── migrations/    # Forward-only SQL migrations
│   └── seed/          # Development seed data
│
├── .github/
│   └── workflows/     # CI/CD pipelines
│
├── turbo.json         # Turborepo pipeline config
├── pnpm-workspace.yaml
├── package.json       # Root workspace package
├── tsconfig.json      # Base TypeScript config (extended by each app/package)
└── .env.example       # Environment variable template (safe to commit)
```

---

## ✨ Features

- 🌐 **Bilingual** — Arabic RTL (default) + English LTR, seamless toggle
- 🛍️ **Full e-commerce** — Products, variants, cart, checkout, order tracking
- 🔄 **Exchange system** — QR-secured product exchanges (72h single-use HS256 JWT)
- 💎 **Loyalty points** — Online (orders) + offline (QR scan at branch) accumulation
- 👥 **5 user roles** — Customer, Admin, Sub-Admin, Helper, Partner
- 🔐 **Admin TOTP 2FA** — Mandatory, no bypass path
- 📱 **Mobile app** — iOS + Android via Expo React Native
- ⚡ **Real-time** — Order tracking via Supabase Realtime
- 🇸🇾 **Syrian market** — SYP pricing, 14 governorates, Sham Cash payment

---

## 🚀 Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | ≥ 20.x | [nodejs.org](https://nodejs.org/) |
| pnpm | 10.x | `npm install -g pnpm` |
| Supabase CLI | latest | [supabase.com/docs/guides/cli](https://supabase.com/docs/guides/cli) |
| Git | latest | [git-scm.com](https://git-scm.com/) |

---

## 🏁 Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/your-org/euro-store.git
cd euro-store
pnpm install
```

### 2. Set Up Environment Variables

```bash
# Copy the example file to each app you'll be working on
cp .env.example apps/web/.env.local
cp .env.example apps/admin/.env.local

# Fill in your Supabase credentials and other secrets
# NEVER commit .env.local files
```

### 3. Set Up Supabase (Local Development)

```bash
# Start local Supabase stack (PostgreSQL + Auth + Storage)
supabase start

# Apply all migrations
supabase db push

# Seed development data
supabase db seed
```

### 4. Run Development Servers

```bash
# Run ALL apps in parallel (via Turborepo)
pnpm dev

# Or run a specific app
pnpm --filter web dev
pnpm --filter admin dev
pnpm --filter mobile dev
```

### 5. Build for Production

```bash
pnpm build
```

---

## 🌐 App URLs

| App | Development | Production |
|-----|-------------|------------|
| Customer Web | http://localhost:3000 | https://eurostore.com |
| Admin Panel | http://localhost:3001 | https://admin.eurostore.com |
| Helper Portal | http://localhost:3002 | https://helper.eurostore.com |
| Partner Portal | http://localhost:3003 | https://partner.eurostore.com |
| Mobile (Expo) | Expo Go / Simulator | App Store / Google Play |

---

## 🛠️ Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Web Apps | Next.js 14 (App Router) | 4 apps: web, admin, helper, partner |
| Mobile | Expo React Native | iOS + Android |
| Backend | Supabase | PostgreSQL + Auth + Storage + FTS + Realtime |
| Hosting | Vercel | Auto-deploy from GitHub |
| Email | Resend | Via `IEmailAdapter` interface |
| Push | Expo FCM + Firebase | Via `IPushAdapter` interface |
| Payment | Sham Cash [TBD] | Via `IPaymentAdapter` stub |
| Monorepo | Turborepo + pnpm | Workspaces + caching |
| Language | TypeScript 5 (strict) | 100% — no `any` |
| Styling | Tailwind CSS + RTL plugin | CSS logical properties |
| Animation | Framer Motion + Lenis | Scroll-driven, cinematic |
| State | Zustand (client) + React Query | Consistent across apps |
| Testing | Vitest (unit) + Playwright (E2E) | |
| Linting | ESLint + Prettier | Shared config in `packages/config` |

---

## 🔐 Security

> **⚠️ Critical Security Notes:**

- **NEVER** commit `.env.local` or any file containing real secrets
- **NEVER** put `SUPABASE_SERVICE_ROLE_KEY` in any `NEXT_PUBLIC_*` variable
- **NEVER** put `EXCHANGE_QR_SECRET` in client-side code
- All API routes have rate limiting — do not remove it
- RLS is enabled on every Supabase table — do not disable it
- Admin TOTP 2FA is mandatory — there is no bypass
- All JWTs are stored in httpOnly + Secure + SameSite=Strict cookies only

See [`_handoff/SECURITY_RULES.md`](./_handoff/SECURITY_RULES.md) for the full security specification.

---

## 📋 Development Commands

```bash
pnpm dev              # Run all apps in dev mode (Turborepo)
pnpm build            # Build all apps and packages
pnpm lint             # Lint all workspaces
pnpm type-check       # TypeScript check all workspaces
pnpm test             # Run all tests

# Target a specific workspace
pnpm --filter web dev
pnpm --filter @eurostore/ui build
pnpm --filter admin lint
```

---

## 📖 Documentation

- [`_handoff/PROJECT_STRATEGY.md`](./_handoff/PROJECT_STRATEGY.md) — Architecture & strategy
- [`_handoff/SECURITY_RULES.md`](./_handoff/SECURITY_RULES.md) — Security requirements
- [`_handoff/EuroStore_PRD.md`](./_handoff/EuroStore_PRD.md) — Full product specification
- [`_handoff/PROGRESS.md`](./_handoff/PROGRESS.md) — Current build progress

---

## 🏗️ Build Phases

| Phase | Status | Description |
|-------|--------|-------------|
| 0 | ✅ In Progress | Monorepo & tooling setup |
| 1 | ⏳ Pending | Database (migrations, RLS, types) |
| 2 | ⏳ Pending | Core packages (adapters, shared, UI) |
| 3 | ⏳ Pending | Auth system (all 5 roles, TOTP) |
| 4 | ⏳ Pending | Product catalog |
| 5 | ⏳ Pending | Cart & checkout (atomic) |
| 6 | ⏳ Pending | Order management |
| 7 | ⏳ Pending | Exchange system (QR) |
| 8 | ⏳ Pending | Loyalty & referral |
| 9–15 | ⏳ Pending | Admin, Helper, Partner, Mobile, Testing |

---

*Built with ❤️ for Syria — EuroStore v1.0*
