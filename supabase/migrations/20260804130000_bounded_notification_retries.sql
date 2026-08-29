ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS dispatch_attempts INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_dispatch_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS last_dispatch_error TEXT;

ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_dispatch_attempts_check;
ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_dispatch_attempts_check
  CHECK (dispatch_attempts >= 0 AND dispatch_attempts <= 10);

DROP INDEX IF EXISTS public.idx_notifications_dispatch_claim;
CREATE INDEX idx_notifications_dispatch_claim
  ON public.notifications (next_dispatch_at, created_at)
  WHERE (
    dispatch_attempts < 10
    AND (
      (push_required = TRUE AND sent_push = FALSE)
      OR (email_required = TRUE AND sent_email = FALSE)
    )
  );

CREATE OR REPLACE FUNCTION public.claim_pending_notifications(p_limit INTEGER DEFAULT 100)
RETURNS SETOF public.notifications
LANGUAGE sql
SECURITY DEFINER
SET search_path TO pg_catalog, public, pg_temp
AS $$
  WITH claimed AS (
    SELECT id
    FROM public.notifications
    WHERE dispatch_attempts < 10
      AND (next_dispatch_at IS NULL OR next_dispatch_at <= NOW())
      AND (
        (push_required = TRUE AND sent_push = FALSE)
        OR (email_required = TRUE AND sent_email = FALSE)
      )
      AND (dispatching_at IS NULL OR dispatching_at < NOW() - INTERVAL '10 minutes')
    ORDER BY next_dispatch_at ASC NULLS FIRST, created_at ASC
    FOR UPDATE SKIP LOCKED
    LIMIT LEAST(GREATEST(p_limit, 1), 250)
  )
  UPDATE public.notifications AS notification
  SET dispatching_at = NOW(),
      dispatch_attempts = dispatch_attempts + 1
  FROM claimed
  WHERE notification.id = claimed.id
  RETURNING notification.*;
$$;

REVOKE ALL ON FUNCTION public.claim_pending_notifications(INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_pending_notifications(INTEGER) TO service_role;
