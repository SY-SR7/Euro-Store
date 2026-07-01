-- Migration: Add contact settings and fix loyalty settings keys
-- These settings are managed through the admin dashboard (Settings page)

INSERT INTO system_settings (key, value, description) VALUES
  ('contact_whatsapp', '963000000000', 'WhatsApp number with country code — displayed on contact page'),
  ('contact_email', 'support@eurostore.com', 'Support email address — displayed on contact page'),
  ('loyalty_point_value_syp', '10', 'SYP value of 1 loyalty point — 1 point = N SYP discount'),
  ('loyalty_min_redemption_pts', '100', 'Minimum points required to enable loyalty redemption at checkout'),
  ('loyalty_max_redemption_pct', '30', 'Maximum % of order total that can be paid by loyalty points'),
  ('loyalty_earn_amount_syp', '1000', 'SYP spent per earn cycle'),
  ('loyalty_earn_points', '10', 'Points earned per earn cycle'),
  ('referral_bonus_points', '50', 'Loyalty points awarded for a successful referral'),
  ('min_order_value_syp', '0', 'Minimum order value in SYP — 0 means disabled'),
  ('usd_exchange_rate', '15000', 'SYP per 1 USD — admin updates manually')
ON CONFLICT (key) DO UPDATE SET
  description = EXCLUDED.description;
-- Note: value is NOT updated on conflict to preserve admin customizations
