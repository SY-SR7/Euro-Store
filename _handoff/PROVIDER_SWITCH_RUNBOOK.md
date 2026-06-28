# Provider Switch Runbook

## Hostinger-Or-Other Migration

Use this runbook when moving EuroStore to a new host or provider.

### 1. Hosting

- Set `EUROSTORE_DEPLOYMENT_PROVIDER`.
- Set all `NEXT_PUBLIC_*_URL` values to the new domains.
- Configure the same env vars in every app deployment: web, admin, helper, partner.

### 2. Database

- Set `EUROSTORE_DATABASE_PROVIDER`.
- For Supabase: set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.
- For PostgreSQL/Hostinger: set `DATABASE_URL` and `DATABASE_DIRECT_URL`.
- Run migrations from `supabase/migrations` or the generated SQL migration bundle.

### 3. Storage

- Set `EUROSTORE_STORAGE_PROVIDER`.
- For S3-compatible storage: set `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, and `S3_PUBLIC_BASE_URL`.
- Copy objects bucket-by-bucket before switching public URLs.

### 4. Email

- Set `EUROSTORE_EMAIL_PROVIDER`.
- For SMTP/Hostinger email: set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, and `EMAIL_FROM`.
- Confirm SPF, DKIM, and DMARC after DNS migration.

### 5. Auth

- Set `EUROSTORE_AUTH_PROVIDER`.
- Update OAuth redirect/callback URLs in the provider dashboard.
- Verify admin TOTP before opening the admin portal publicly.

### 6. Rollback

- Keep old env values saved in the hosting dashboard.
- Repoint DNS or redeploy with previous env vars.
- Do not delete old database/storage until backups and checksums are verified.
