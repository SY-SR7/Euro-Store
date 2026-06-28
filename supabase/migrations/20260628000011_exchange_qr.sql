-- Exchange QR token store (one active token per request)
CREATE TABLE IF NOT EXISTS exchange_qr_tokens (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  exchange_request_id UUID        NOT NULL REFERENCES exchange_requests(id) ON DELETE CASCADE,
  customer_id         UUID        NOT NULL,
  token_hash          TEXT        NOT NULL UNIQUE,   -- SHA-256 of raw JWT
  expires_at          TIMESTAMPTZ NOT NULL,
  redeemed_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE exchange_qr_tokens ENABLE ROW LEVEL SECURITY;

-- Helpers can read tokens to validate them (server-side only via service role)
CREATE POLICY "service_role_full_exchange_qr"
  ON exchange_qr_tokens
  FOR ALL
  USING (auth.role() = 'service_role');