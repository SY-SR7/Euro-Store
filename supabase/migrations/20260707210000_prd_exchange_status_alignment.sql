-- Align exchange_requests.status with EuroStore_PRD.md §6.9.3.
-- Partner workflow details are kept in partner_stage, not in the public status state machine.

ALTER TABLE public.exchange_requests
  ADD COLUMN IF NOT EXISTS partner_stage TEXT
    CHECK (
      partner_stage IS NULL OR partner_stage IN (
        'awaiting_customer',
        'received_from_customer',
        'ready_for_pickup',
        'picked_up_by_delivery'
      )
    );

UPDATE public.exchange_requests
SET partner_stage = COALESCE(partner_stage, 'received_from_customer'),
    status = 'approved'
WHERE status::text = 'partner_received';

UPDATE public.exchange_requests
SET partner_stage = COALESCE(partner_stage, 'ready_for_pickup'),
    status = 'approved'
WHERE status::text = 'helper_assigned';

UPDATE public.exchange_requests
SET status = 'approved'
WHERE status::text IN ('qr_generated', 'qr_scanned');

UPDATE public.exchange_requests
SET status = 'rejected',
    rejection_reason = COALESCE(NULLIF(rejection_reason, ''), 'QR expired before processing')
WHERE status::text = 'expired';

ALTER TABLE public.exchange_requests
  DROP CONSTRAINT IF EXISTS exchange_requests_prd_status_check;

ALTER TABLE public.exchange_requests
  ADD CONSTRAINT exchange_requests_prd_status_check
  CHECK (
    status::text IN (
      'pending',
      'approved',
      'rejected',
      'item_received_by_shipping',
      'completed'
    )
  );
