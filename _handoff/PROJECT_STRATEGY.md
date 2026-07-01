# EuroStore — Project Strategy

> **Every AI agent working on this project MUST read this file before writing any code.**
> Return to this document periodically to verify alignment with the strategy.

---

## 1. Project Classification

**Classification: LARGE / ENTERPRISE**

EuroStore is a full-stack, bilingual (Arabic/English) fashion e-commerce platform for the Syrian market. It is NOT a simple project. It spans 5 synchronized applications, 30+ database tables, complex business flows, and security-critical integrations. It will be publicly released and used by millions.

---

## 2. Core Philosophy

### 2.1 Security First — Always

This project will be used by millions of people storing personal and financial data. Every security rule in `SECURITY_RULES.md` is **mandatory from the first line of code**. No exceptions. No shortcuts. Security is not a feature added at the end — it is built into every decision.

> **Before writing any endpoint, ask yourself:**
> - Is input validated server-side?
> - Is the user authorized for this action (RLS + middleware)?
> - Are secrets in environment variables only?
> - Is this atomic where it must be?

### 2.2 Adapter Pattern — No Vendor Lock-in

Every external service is wrapped in a TypeScript interface. The business logic never calls a third-party SDK directly. This makes the platform migration-ready (see PRD Section 17).

```
IEmailAdapter → ResendAdapter (today) → NodemailerAdapter (tomorrow)
IPushAdapter  → ExpoFCMAdapter (today) → OneSignalAdapter (tomorrow)
IPaymentAdapter → ShamCashAdapter (today) → StripeAdapter (v2)
ISearchAdapter → SupabaseFTSAdapter (today) → AlgoliaAdapter (v2)
IStorageAdapter → SupabaseStorageAdapter (today) → CloudflareR2Adapter (v2)
```

### 2.3 PRD is the Single Source of Truth

The `EuroStore_PRD.md` is the only authoritative specification. If anything in the code contradicts the PRD, the PRD wins. Any deviation requires a PRD update with a changelog entry.

### 2.4 Monorepo Discipline

The project is a Turborepo monorepo. Shared code lives in `packages/`. Never duplicate logic between apps. Every package has a single responsibility.

### 2.5 Mobile-First & Responsive Excellence

**The entire project (Web, Admin, Partner, and Helper apps) is PRIMARILY targeted for mobile devices.** Desktop and horizontal screens are secondary.
- **Mobile-First CSS:** Every UI component MUST be styled for mobile first, then scaled up using Tailwind breakpoints (`md:`, `lg:`).
- **Zero Horizontal Overflow:** Horizontal scrolling on mobile is strictly prohibited. Always handle grids, tables, and long text to wrap or stack gracefully.
- **Touch Targets:** Buttons, inputs, and navigations must be thumb-friendly. Avoid annoying auto-zoom on iOS inputs by handling viewport correctly.

---

## 3. Architecture Overview

### 3.1 Repository Structure

```
euro-store/                          # Git repo root
├── apps/
│   ├── web/                         # Next.js 14 — Customer Storefront (eurostore.com)
│   ├── mobile/                      # Expo React Native — iOS + Android
│   ├── admin/                       # Next.js — Admin Panel (admin.eurostore.com)
│   ├── helper/                      # Next.js — Helper Portal (helper.eurostore.com)
│   └── partner/                     # Next.js — Partner Portal (partner.eurostore.com)
├── packages/
│   ├── ui/                          # Shared design system + component library
│   ├── database/                    # Supabase client, TypeScript types, migrations
│   ├── adapters/                    # Adapter interfaces + all service implementations
│   ├── config/                      # ESLint, TypeScript, Tailwind shared configs
│   └── shared/                      # Shared utilities, types, constants, hooks
├── supabase/
│   └── migrations/                  # All DB migrations (forward-only)
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
└── .env.example                     # All keys listed, no values, with comments
```

### 3.2 Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Web Apps | Next.js 14 (App Router) | 4 apps: web, admin, helper, partner |
| Mobile | Expo React Native | iOS + Android |
| Backend | Supabase (BaaS) | PostgreSQL + Auth + Storage + FTS + Realtime |
| Hosting | Vercel | Auto-deploy from GitHub |
| Email | Resend | Via `IEmailAdapter` |
| Push | Expo FCM + Firebase | Via `IPushAdapter` |
| Payment | Sham Cash (TBD) | Via `IPaymentAdapter` stub |
| Package Manager | pnpm | Workspaces + Turborepo |
| Language | TypeScript (strict mode) | 100% — no `any` without explicit reason |
| Styling | Tailwind CSS + RTL plugin | All apps + shared UI package |
| State Management | Zustand (client) + React Query (server) | Consistent across apps |
| Testing | Jest/Vitest (unit) + Playwright (E2E) | |

### 3.3 Database Principles

- **All PKs:** UUID v4 (`gen_random_uuid()`) — no sequential integer IDs in URLs
- **All timestamps:** `timestamptz` (UTC)
- **All monetary amounts:** `bigint` (whole SYP, no decimals)
- **RLS enabled on ALL tables** — this is non-negotiable
- **Every financial operation:** wrapped in ACID transaction with `SELECT FOR UPDATE`
- **All DB migrations:** forward-only in `supabase/migrations/`

### 3.4 User Roles & Portals

| Role | Portal | 2FA |
|------|--------|-----|
| Customer | web + mobile | None (email verification required) |
| Admin (Main) | admin.eurostore.com | TOTP mandatory — no bypass |
| Sub-Admin | admin.eurostore.com | TOTP mandatory |
| Helper | helper.eurostore.com | None |
| Partner | partner.eurostore.com | None |

---

## 4. Development Environments

| Environment | Branch | Supabase Project | URL |
|-------------|--------|------------------|-----|
| Development | `dev` | `eurostore-dev` | localhost |
| Staging | `staging` | `eurostore-staging` | staging.eurostore.com |
| Production | `main` | `eurostore-prod` | eurostore.com |

**Rule:** No direct pushes to `main`. All production deployments via PR from `staging`.

---

## 5. Design System

### 5.1 Brand Identity

**Aesthetic:** "Aura Elegance" — Modern Luxury. Dark mode primary. Editorial layouts. Metallic gold as the signature accent.

**Typography:**
- Headlines: Playfair Display (Serif — Vogue-style authority)
- Body/UI: Manrope (Sans-serif — readable, geometric)
- For Arabic headlines: high-contrast Naskh-style serif

**Primary Color:**
- Gold: `#C9A84C` (brand permanent)
- Gold Dark: `#A67C2E`
- Gold Light: `#E8D28A`
- Dark Background: `#0F0F0F` / `#1A1A1A` / `#242424`

### 5.2 RTL/LTR

- **Default:** Arabic RTL (`<html dir="rtl" lang="ar">`)
- All components must use CSS logical properties (`margin-inline-start`, etc.)
- Tailwind RTL plugin required
- Language toggle: persisted in `localStorage` key `eurostore_theme`
- User preference stored in `customer_profiles`

---

## 6. Critical Business Flows

### 6.1 Checkout (Atomic Operation)
```
Cart validate → Auth gate → Address → Discount → Points → Payment → 
  [SELECT FOR UPDATE: inventory lock] → Deduct stock → Create order → 
  Deduct points → Log discount usage → Audit log → Notify (push + email)
```

### 6.2 Exchange Flow (QR-Secured)
```
Customer submits request → Admin/Helper approves → 
  Server generates HS256 JWT QR (72h, single-use, EXCHANGE_QR_SECRET) → 
  Stored in private Supabase Storage bucket →
  Customer presents QR at branch/partner →
  Server validates: signature + expiry + qr_code_used_at IS NULL →
  Atomic update: mark used + adjust inventory + recalculate loyalty
```

### 6.3 Loyalty QR (Offline)
```
Customer shows permanent loyalty QR → Helper scans → 
  Decode customer_id → Helper enters SYP amount → 
  Atomic: loyalty_points += earned_points + log transaction → 
  Push + email notification
```

### 6.4 Order Status State Machine
```
Pending → Confirmed → Processing → Picked Up → Shipped → Delivered → Completed
       ↘ Cancelled (customer: Pending only; admin: up to Processing)
       ↘ Rejected (admin/helper, requires reason)
```

---

## 7. Security Requirements Summary

> Full detail in `SECURITY_RULES.md`. Summary for quick reference:

1. **No string concatenation in SQL** — parameterized queries always
2. **Server-side validation on ALL inputs** — never trust the client
3. **JWT stored in httpOnly + Secure + SameSite=Strict cookies** (web) / SecureStorage (mobile)
4. **TOTP mandatory for Admin/Sub-Admin** — no bypass path exists
5. **Rate limiting on all endpoints** (see PRD Section 10.5)
6. **No secrets in code or git** — `.env` + `.gitignore` from day 1
7. **No `NEXT_PUBLIC_` or `EXPO_PUBLIC_` prefix for secrets**
8. **`SELECT FOR UPDATE`** for all inventory/points operations
9. **Single-use + time-bound exchange QR codes** (HS256, verified server-side)
10. **RLS on ALL Supabase tables** — defense in depth
11. **Audit log on all admin/helper/partner actions**
12. **File uploads:** MIME + magic bytes validation, random rename, private storage
13. **No stack traces or DB details in error responses**
14. **UUID v4 PKs only** — no sequential IDs in URLs (IDOR prevention)

---

## 8. Development Methodology

### 8.1 Build Order (Dependency-First)

Build in this order to avoid circular dependencies:

```
Phase 0: Monorepo & Tooling Setup
Phase 1: Database (migrations, types, RLS, seed data)
Phase 2: Core Packages (adapters interfaces, shared utilities, UI primitives)
Phase 3: Auth System (all 5 roles, TOTP for admin)
Phase 4: Product Catalog (categories → brands → attributes → products → variants)
Phase 5: Cart & Checkout (guest cart, merge, atomic checkout)
Phase 6: Order Management (state machine, notifications)
Phase 7: Exchange System (QR generation, validation, paths A & B)
Phase 8: Loyalty & Referral (online + offline + referral flows)
Phase 9: Admin Panel (dashboard, reports, audit logs)
Phase 10: Helper Portal (order queue, loyalty QR, exchange QR)
Phase 11: Partner Portal (exchange queue, QR scanner)
Phase 12: Mobile App (feature parity with web customer app)
Phase 13: Integrations (Resend, Expo FCM, Sham Cash stub)
Phase 14: Testing (unit → integration → E2E)
Phase 15: Performance & Hardening
```

### 8.2 Quality Gates (Per Phase)

Before moving to the next phase:
- [ ] TypeScript compiles with zero errors (`strict: true`)
- [ ] ESLint passes with zero warnings
- [ ] Unit tests pass (≥80% coverage on business logic)
- [ ] RLS policies verified for all new tables
- [ ] No hardcoded secrets or mock data left in code
- [ ] API routes have rate limiting

### 8.3 PR Rules

- No direct pushes to `main` or `staging`
- All PRs require: lint ✅ + type-check ✅ + tests ✅
- Migration files must be reviewed before merging

---

## 9. Open TBD Items (Do Not Block Development)

These are unresolved but do not block building:

| # | Item | Action |
|---|------|--------|
| 1 | Sham Cash API | Build stub adapter; leave `[TBD]` comments in implementation |
| 2 | Performance targets (LCP, TTI, uptime SLA) | Use best practices; finalize with stakeholder |
| 3 | Delivery partner integration | Manual status updates for now |
| 4 | Exchange price difference settlement | No financial settlement in v1; handled offline |
| 5 | Domain TLD | Use `eurostore.com` as placeholder |
| 6 | Supabase hosting region | Configure in Supabase dashboard; note in Privacy Policy |
| 7 | Invoice logo / brand assets | Use placeholder; slot to swap in final assets |

---

## 10. Agent Handoff Protocol

When an AI agent finishes a work session:

1. Update `PROGRESS.md` with what was completed and what is next
2. Leave a clear `// TODO:` comment in code for any unfinished logic
3. Ensure no partial/broken code is committed (the app must always be in a runnable state after each commit)
4. Note any deviation from the PRD in `PROGRESS.md` with a reason
5. Re-read this file (`PROJECT_STRATEGY.md`) at the start of every new session

---

*This document is the architectural contract for EuroStore v1.0.*
*Last updated: 2026-06-28*
