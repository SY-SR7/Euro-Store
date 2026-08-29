ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS push_required BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS email_required BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS notifications_pending_delivery_idx
  ON public.notifications(created_at)
  WHERE (push_required = TRUE AND sent_push = FALSE)
     OR (email_required = TRUE AND sent_email = FALSE);

CREATE OR REPLACE FUNCTION public.notify_admins_on_low_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_threshold INTEGER := COALESCE(NEW.low_stock_threshold, 5);
BEGIN
  IF NEW.stock_quantity <= v_threshold AND OLD.stock_quantity > COALESCE(OLD.low_stock_threshold, 5) THEN
    INSERT INTO public.notifications (
      recipient_id, recipient_role, type, title_ar, title_en, body_ar, body_en,
      reference_id, reference_type, data, push_required, email_required
    )
    SELECT
      profile.id,
      'admin'::public.user_role,
      'system'::public.notification_type,
      'تنبيه انخفاض المخزون',
      'Low stock alert',
      'وصل مخزون SKU ' || NEW.sku || ' إلى ' || NEW.stock_quantity,
      'SKU ' || NEW.sku || ' stock reached ' || NEW.stock_quantity,
      NEW.id,
      'product_variant',
      jsonb_build_object('event', 'low_stock', 'sku', NEW.sku, 'stock_quantity', NEW.stock_quantity, 'threshold', v_threshold),
      FALSE,
      TRUE
    FROM public.admin_profiles profile
    WHERE profile.is_active = TRUE;
  END IF;

  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.notify_admins_on_low_stock() FROM PUBLIC, anon, authenticated;
