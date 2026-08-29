ALTER TABLE public.push_notification_tokens
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS user_role public.user_role;

UPDATE public.push_notification_tokens
SET user_id = customer_id,
    user_role = 'customer'
WHERE user_id IS NULL OR user_role IS NULL;

ALTER TABLE public.push_notification_tokens
  ALTER COLUMN customer_id DROP NOT NULL,
  ALTER COLUMN user_id SET NOT NULL,
  ALTER COLUMN user_role SET NOT NULL;

ALTER TABLE public.push_notification_tokens
  DROP CONSTRAINT IF EXISTS push_notification_tokens_customer_id_token_key,
  DROP CONSTRAINT IF EXISTS push_notification_tokens_role_customer_check,
  ADD CONSTRAINT push_notification_tokens_role_customer_check CHECK (
    (user_role = 'customer' AND customer_id = user_id)
    OR (user_role <> 'customer' AND customer_id IS NULL)
  );

CREATE UNIQUE INDEX IF NOT EXISTS push_notification_tokens_token_key
  ON public.push_notification_tokens(token);
CREATE INDEX IF NOT EXISTS push_notification_tokens_recipient_idx
  ON public.push_notification_tokens(user_id, user_role);

DROP POLICY IF EXISTS "Customer own push tokens" ON public.push_notification_tokens;
DROP POLICY IF EXISTS "Users read own push tokens" ON public.push_notification_tokens;
CREATE POLICY "Users read own push tokens"
  ON public.push_notification_tokens
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

REVOKE INSERT, UPDATE, DELETE ON TABLE public.push_notification_tokens FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.push_notification_tokens TO authenticated;
GRANT ALL ON TABLE public.push_notification_tokens TO service_role;
