# EuroStore — Architecture Decision Records (ADR)

> This file documents every significant architectural decision made for EuroStore.
> All future agents must read this before making any structural decisions.
> Add a new entry for every decision that impacts how the codebase is structured.

---

## ADR-001: Turborepo Monorepo with pnpm

**Date:** 2026-06-28
**Status:** Accepted
**Context:** Five applications (web, mobile, admin, helper, partner) share significant amounts of code — the UI design system, database types, adapter interfaces, and utility functions.
**Decision:** Use Turborepo with pnpm workspaces. All shared code lives in `packages/`. Each app is in `apps/`. Tasks (lint, type-check, test, build) run in parallel via `turbo.json`.
**Consequences:**
- (+) Single source of truth for shared code
- (+) Consistent tooling (ESLint, TypeScript, Tailwind configs)
- (+) Fast CI via Turborepo caching
- (-) Initial setup complexity is higher than a single app
- (-) Developers must understand workspace dependency resolution

---

## ADR-002: Supabase as Backend Foundation

**Date:** 2026-06-28
**Status:** Accepted
**Context:** Need a backend that provides Auth, PostgreSQL, Storage, Realtime, and Full-Text Search out of the box, with a clear migration path to self-hosting.
**Decision:** Use Supabase as the primary backend layer. The Supabase client is the only direct SDK used; all other services go through adapter interfaces. The PostgreSQL database is the real value — not Supabase's proprietary features — so migration is feasible.
**Consequences:**
- (+) Rapid development with Auth + DB + Storage in one service
- (+) RLS at the database level = security by default
- (+) Easy migration path (see PRD Section 17.1)
- (-) Requires careful management of `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- (-) Supabase realtime has connection limits that may need monitoring at scale

---

## ADR-003: Adapter Pattern for All External Services

**Date:** 2026-06-28
**Status:** Accepted
**Context:** The platform must be vendor-independent. Email provider, push notifications, payment gateway, search engine, and file storage may all need to change without rewriting business logic.
**Decision:** Every external service is accessed ONLY through a TypeScript interface defined in `packages/adapters/`. The concrete implementation is injected. Swapping a service = writing a new adapter + updating the env var.

```
packages/adapters/
├── interfaces/
│   ├── IEmailAdapter.ts
│   ├── IPushAdapter.ts
│   ├── IPaymentAdapter.ts
│   ├── ISearchAdapter.ts
│   └── IStorageAdapter.ts
└── implementations/
    ├── ResendEmailAdapter.ts
    ├── ExpoFCMPushAdapter.ts
    ├── ShamCashPaymentAdapter.ts     # stub — TBD
    ├── SupabaseFTSSearchAdapter.ts
    └── SupabaseStorageAdapter.ts
```

**Consequences:**
- (+) Zero business logic changes when switching vendors
- (+) Easy to test with mock adapters
- (-) Slightly more abstraction layers to navigate

---

## ADR-004: All Prices in SYP as bigint

**Date:** 2026-06-28
**Status:** Accepted
**Context:** The platform deals with Syrian Pounds, which can be very large numbers (inflation context). Floating point arithmetic is dangerous for currency.
**Decision:** All monetary amounts stored as `bigint` in PostgreSQL (whole Syrian Pounds, no decimals/cents). USD display is calculated at runtime: `syp_price / usd_exchange_rate`. The exchange rate is admin-managed in `system_settings`.
**Consequences:**
- (+) No floating-point rounding errors in financial calculations
- (+) Simple arithmetic for SYP-only operations
- (-) USD display is approximate (by design — admin manages the rate manually)

---

## ADR-005: UUID v4 as All Primary Keys

**Date:** 2026-06-28
**Status:** Accepted
**Context:** Sequential integer IDs in URLs are a direct IDOR (Insecure Direct Object Reference) vulnerability. An attacker can enumerate resources by incrementing an ID.
**Decision:** Every table uses `gen_random_uuid()` as its primary key. No sequential integer auto-increment IDs will appear in any URL, API path, or client-facing identifier. The one exception is `order_number` (format: `EUR-XXXXXXXX`), which is a user-friendly display field, not a database key — the actual PK is still UUID.
**Consequences:**
- (+) Prevents enumeration attacks (BOLA/IDOR)
- (+) Database PK is independent of display identifier
- (-) UUIDs are longer and less human-readable (acceptable trade-off)
- (-) Slightly larger index sizes (negligible at expected scale)

---

## ADR-006: httpOnly Cookies for JWT Storage (Web)

**Date:** 2026-06-28
**Status:** Accepted
**Context:** Storing JWTs in `localStorage` exposes them to XSS attacks. Any injected script can steal `localStorage` contents.
**Decision:** On the web apps, JWT access tokens and refresh tokens are stored exclusively in `httpOnly + Secure + SameSite=Strict` cookies. The client JavaScript cannot access these cookies. For mobile, use Expo's `SecureStorage`.
**Consequences:**
- (+) Tokens are immune to XSS theft
- (+) SameSite=Strict prevents CSRF for state-modifying requests
- (-) More complex logout logic (must call server to clear cookie)
- (-) Cross-origin requests require careful CORS configuration

---

## ADR-007: TOTP Mandatory for Admin/Sub-Admin — No Bypass

**Date:** 2026-06-28
**Status:** Accepted
**Context:** Admin accounts have full system access including financial data and customer PII. A compromised admin account is catastrophic.
**Decision:** Admin login is a mandatory 2-step process: (1) email + password → partial_token (5min TTL), then (2) TOTP code → full JWT. There is NO bypass path. A new admin account that has not set up TOTP cannot access any admin feature — they are redirected to TOTP setup before anything else.
**Consequences:**
- (+) Significantly raises the bar for account compromise
- (+) Meets security best practices for privileged access
- (-) Admin setup UX has a mandatory TOTP enrollment step
- (-) Admins must not lose access to their TOTP device (recovery procedure needed — TBD)

---

## ADR-008: SELECT FOR UPDATE for Inventory and Loyalty Operations

**Date:** 2026-06-28
**Status:** Accepted
**Context:** Two customers could simultaneously attempt to buy the last item in stock, or two helpers could simultaneously award loyalty points for the same QR scan. Race conditions here cause data integrity violations.
**Decision:** All operations that read and then write to `product_variants.stock_quantity` or `customer_profiles.loyalty_points` use `SELECT FOR UPDATE` within a PostgreSQL transaction. These operations are implemented as PostgreSQL RPC functions (stored procedures) to ensure atomicity, not multi-step client-side calls.
**Consequences:**
- (+) Zero race conditions on critical financial operations
- (+) ACID guarantees on checkout and loyalty flows
- (-) Slightly higher DB lock contention under high load (acceptable for v1 Syria scale)
- (-) Complex multi-step flows must be encapsulated in RPC functions

---

## ADR-009: Exchange QR as HS256 JWT

**Date:** 2026-06-28
**Status:** Accepted
**Context:** Exchange QR codes must be: (a) unforgeable, (b) time-limited, (c) single-use. A raw UUID would be guessable; a plain token would not encode expiry.
**Decision:** Exchange QR codes are HS256 JWTs with payload `{ exchange_request_id, iat, exp }`, signed with `EXCHANGE_QR_SECRET` (env var, never client-visible). The QR image is generated server-side and stored in a private Supabase Storage bucket, served via signed URLs. Validation on scan: verify signature → verify `exp` not passed → verify `qr_code_used_at IS NULL` → mark used atomically.
**Consequences:**
- (+) Cryptographically unforgeable
- (+) Expiry is encoded in the token itself
- (+) Single-use enforced at the database level
- (-) If `EXCHANGE_QR_SECRET` is leaked, all QRs are forgeable — rotate immediately

---

## ADR-010: Arabic RTL as Default, English LTR as Secondary

**Date:** 2026-06-28
**Status:** Accepted
**Context:** The primary market is Syrian Arabic speakers. The platform must feel native in Arabic, not like a translated English app.
**Decision:** All apps default to Arabic RTL (`<html dir="rtl" lang="ar">`). All components use CSS logical properties (`padding-inline-start`, `margin-inline-end`) so the layout mirrors correctly in both directions without conditional CSS. English is the secondary language. Tailwind RTL plugin is required.
**Consequences:**
- (+) Premium feel for Arabic-speaking users
- (+) Component library is RTL-native, not RTL-patched
- (-) All UI components must be tested in both RTL and LTR
- (-) Tailwind RTL plugin adds build configuration complexity

---

## ADR-011: File Uploads via Server (Not Direct Client Upload)

**Date:** 2026-06-28
**Status:** Accepted
**Context:** Direct client uploads to Supabase Storage would require exposing the service role key or complex bucket policies. More importantly, file validation (MIME type, magic bytes, max size, random renaming) must happen server-side.
**Decision:** All file uploads go through the API server: client → multipart POST to API route → server validates (MIME + magic bytes + size) → renames to UUID-based filename → uploads to Supabase Storage → returns the stored URL. Clients never upload directly to Supabase.
**Consequences:**
- (+) File validation happens server-side (security requirement)
- (+) Files are renamed to UUIDs (no path traversal, no filename injection)
- (+) `SERVICE_ROLE_KEY` stays server-only
- (-) Server handles upload bandwidth (acceptable for v1 scale)

---

*Add new ADRs below this line.*

---

## ADR-012: Provider Portability Contract

**Date:** 2026-06-28
**Status:** Accepted
**Context:** EuroStore may move from the initial hosting/data stack to Hostinger or another provider for domain, hosting, database, storage, email, or payment services.
**Decision:** Provider choices are runtime configuration, not application code. Domains and providers are selected by env vars; vendor SDKs stay inside `packages/database` or `packages/adapters`. Feature code must not hardcode provider URLs or call external service SDKs directly.
**Consequences:**
- (+) Moving domains/hosting/storage/email can be done by changing env and DNS/provider dashboards.
- (+) Database/auth migrations are isolated to provider packages instead of feature pages.
- (+) Code review has a clear portability gate.
- (-) More upfront adapter/config discipline is required.
- (-) Non-Supabase database/auth providers still need implementation inside provider packages before switching production env.
