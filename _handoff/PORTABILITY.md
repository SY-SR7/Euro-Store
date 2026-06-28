# EuroStore Portability Contract

> Goal: moving hosting, domain, database, storage, email, or payment providers must be an environment/config operation plus provider adapter wiring, not a hunt through app code.

## Non-Negotiable Rules

1. No provider, domain, bucket URL, API base URL, email sender, callback URL, or CDN URL is hardcoded in application code.
2. App code reads runtime settings from `@eurostore/shared` config helpers or provider packages.
3. External services are accessed through `packages/adapters` or provider-owned packages, not directly from feature code.
4. Secrets stay in server-only env vars. Never add `NEXT_PUBLIC_` or `EXPO_PUBLIC_` to secrets.
5. Public URLs are configured through:
   - `NEXT_PUBLIC_APP_URL`
   - `NEXT_PUBLIC_ADMIN_URL`
   - `NEXT_PUBLIC_HELPER_URL`
   - `NEXT_PUBLIC_PARTNER_URL`
6. Provider selection is configured through:
   - `EUROSTORE_DEPLOYMENT_PROVIDER`
   - `EUROSTORE_DATABASE_PROVIDER`
   - `EUROSTORE_AUTH_PROVIDER`
   - `EUROSTORE_STORAGE_PROVIDER`
   - `EUROSTORE_EMAIL_PROVIDER`
   - `EUROSTORE_PAYMENT_PROVIDER`

## Provider Switch Matrix

| Area | Current | Future Examples | Switch Surface |
|------|---------|-----------------|----------------|
| Hosting | Vercel-compatible Next.js | Hostinger VPS, Node server, Cloudflare Pages | Deployment env + build command |
| Domain | Env configured | Any registrar/DNS | `NEXT_PUBLIC_*_URL`, OAuth callbacks, email DNS |
| Database | Supabase PostgreSQL | Hostinger PostgreSQL, managed Postgres | `EUROSTORE_DATABASE_PROVIDER`, `DATABASE_URL`, database package adapter |
| Auth | Supabase Auth | Auth.js, custom JWT | `EUROSTORE_AUTH_PROVIDER`, auth package implementation |
| Storage | Supabase Storage | S3, Cloudflare R2, Hostinger object storage | `EUROSTORE_STORAGE_PROVIDER`, storage adapter |
| Email | Resend | SMTP, Hostinger email | `EUROSTORE_EMAIL_PROVIDER`, email adapter |
| Payment | Sham Cash fail-closed implementation | Live Sham Cash, COD-only | `EUROSTORE_PAYMENT_PROVIDER`, payment adapter |

## Migration Checklist

1. Export data from the old provider.
2. Import data into the new provider.
3. Configure provider env vars in the new host dashboard.
4. Run database migrations against the new database.
5. Point DNS to the new host.
6. Update OAuth/callback URLs in provider dashboards.
7. Run smoke tests:
   - customer register/login
   - admin login + TOTP
   - product catalog read
   - private storage signed URL
   - order creation transaction
8. Keep old provider read-only until data consistency is verified.

## Code Review Gate

Reject any change that introduces:

- literal production domains in code
- direct S3/Supabase/Resend/ShamCash SDK calls outside their adapter/provider package
- provider-specific URLs in React components
- secrets in client env vars
- SQL connection strings outside env vars

## Current Gap

The project currently uses Supabase helpers in `@eurostore/database` and auth flows. This is acceptable for Phase 3, but any future provider must be implemented inside provider packages first. Feature code should not be rewritten for a migration.

Design experiment routes may still reference external inspiration/media URLs while visual direction is being explored. Before any experiment becomes production, media must move to the configured storage provider and be referenced from database/config, not hardcoded URLs.
