-- Migration: 20260707180001_add_exchange_statuses.sql
-- PRD §6.9.3 only adds item_received_by_shipping to the exchange status machine.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'item_received_by_shipping' AND enumtypid = 'exchange_status'::regtype) THEN
        ALTER TYPE exchange_status ADD VALUE 'item_received_by_shipping';
    END IF;
END $$;
