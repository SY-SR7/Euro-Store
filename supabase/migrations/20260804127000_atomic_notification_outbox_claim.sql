ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS dispatching_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_notifications_dispatch_claim
  ON public.notifications (created_at)
  WHERE (
    (push_required = TRUE AND sent_push = FALSE)
    OR (email_required = TRUE AND sent_email = FALSE)
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
    WHERE (
      (push_required = TRUE AND sent_push = FALSE)
      OR (email_required = TRUE AND sent_email = FALSE)
    )
      AND (dispatching_at IS NULL OR dispatching_at < NOW() - INTERVAL '10 minutes')
    ORDER BY created_at ASC
    FOR UPDATE SKIP LOCKED
    LIMIT LEAST(GREATEST(p_limit, 1), 250)
  )
  UPDATE public.notifications AS notification
  SET dispatching_at = NOW()
  FROM claimed
  WHERE notification.id = claimed.id
  RETURNING notification.*;
$$;

REVOKE ALL ON FUNCTION public.claim_pending_notifications(INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_pending_notifications(INTEGER) TO service_role;
