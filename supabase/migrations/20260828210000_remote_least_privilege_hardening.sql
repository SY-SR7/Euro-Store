-- Hosted projects created with older defaults may retain broad table grants
-- even when RLS blocks every write. Remove the unused capabilities entirely.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON TABLE
    public.admin_profiles,
    public.sub_admin_profiles,
    public.sub_admin_permissions,
    public.audit_logs,
    public.system_settings,
    public.payment_transactions,
    public.exchange_qr_tokens
  FROM PUBLIC, anon, authenticated;

-- This legacy helper exists on some hosted projects but not on clean installs.
DO $migration$
BEGIN
  IF to_regprocedure('public.rls_auto_enable()') IS NOT NULL THEN
    REVOKE ALL ON FUNCTION public.rls_auto_enable()
      FROM PUBLIC, anon, authenticated;
  END IF;
END
$migration$;
