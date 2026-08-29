ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
  ADD COLUMN IF NOT EXISTS cancelled_by_id UUID,
  ADD COLUMN IF NOT EXISTS cancelled_by_role public.user_role;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'orders'
      AND column_name = 'rejection_reason'
  ) THEN
    ALTER TABLE public.orders
      ADD COLUMN rejection_reason TEXT GENERATED ALWAYS AS (rejected_reason) STORED;
  END IF;
END $$;
