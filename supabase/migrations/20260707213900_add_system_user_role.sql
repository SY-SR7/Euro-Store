-- Allow audit logs to represent automated/system actors.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum
    WHERE enumlabel = 'system'
      AND enumtypid = 'user_role'::regtype
  ) THEN
    ALTER TYPE public.user_role ADD VALUE 'system';
  END IF;
END $$;
