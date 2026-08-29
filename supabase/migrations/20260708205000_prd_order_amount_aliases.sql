DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'subtotal'
  ) THEN
    ALTER TABLE public.orders
      ADD COLUMN subtotal BIGINT GENERATED ALWAYS AS (subtotal_syp) STORED;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'discount_amount'
  ) THEN
    ALTER TABLE public.orders
      ADD COLUMN discount_amount BIGINT GENERATED ALWAYS AS (discount_syp) STORED;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'loyalty_discount_amount'
  ) THEN
    ALTER TABLE public.orders
      ADD COLUMN loyalty_discount_amount BIGINT GENERATED ALWAYS AS (loyalty_discount_syp) STORED;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'shipping_cost'
  ) THEN
    ALTER TABLE public.orders
      ADD COLUMN shipping_cost BIGINT GENERATED ALWAYS AS (shipping_syp) STORED;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'total_amount'
  ) THEN
    ALTER TABLE public.orders
      ADD COLUMN total_amount BIGINT GENERATED ALWAYS AS (total_syp) STORED;
  END IF;
END $$;
