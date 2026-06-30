-- Adds the customer blocking capability required by PRD section 5.2
-- ("Block/unblock customer") and 6.18. The column was specified in the
-- PRD's own schema draft (customer_profiles.is_blocked) but was never
-- carried into the live initial_schema migration.

ALTER TABLE customer_profiles
  ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_customer_profiles_is_blocked
  ON customer_profiles (is_blocked)
  WHERE is_blocked = TRUE;

COMMENT ON COLUMN customer_profiles.is_blocked IS
  'Set by admin/sub-admin via /admin/customers. Blocked customers should be prevented from checking out (enforced in app layer at checkout + login).';
