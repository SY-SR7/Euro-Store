ALTER TABLE public.product_variants
  ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER CHECK (low_stock_threshold >= 0),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE OR REPLACE FUNCTION public.notify_admins_on_low_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_threshold INTEGER := COALESCE(NEW.low_stock_threshold, 5);
BEGIN
  IF NEW.stock_quantity <= v_threshold AND OLD.stock_quantity > COALESCE(OLD.low_stock_threshold, 5) THEN
    INSERT INTO public.notifications (
      recipient_id, recipient_role, type, title_ar, title_en, body_ar, body_en,
      reference_id, reference_type, data
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
      jsonb_build_object('event', 'low_stock', 'sku', NEW.sku, 'stock_quantity', NEW.stock_quantity, 'threshold', v_threshold)
    FROM public.admin_profiles profile
    WHERE profile.is_active = TRUE;
  END IF;

  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS product_variants_low_stock_notification ON public.product_variants;
CREATE TRIGGER product_variants_low_stock_notification
BEFORE UPDATE OF stock_quantity ON public.product_variants
FOR EACH ROW
EXECUTE FUNCTION public.notify_admins_on_low_stock();
