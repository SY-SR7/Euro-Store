CREATE OR REPLACE FUNCTION public.admin_report_data(
  p_type TEXT,
  p_from TIMESTAMPTZ,
  p_to TIMESTAMPTZ
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_result JSONB;
BEGIN
  IF p_to < p_from OR p_to - p_from > INTERVAL '366 days' THEN
    RAISE EXCEPTION 'invalid_date_range';
  END IF;

  IF p_type = 'sales' THEN
    WITH rows AS (
      SELECT o.created_at::DATE AS sale_date,
             COALESCE(p.name_ar, b.name_ar, oi.product_snapshot->>'name_ar', 'Unknown') AS product,
             COALESCE(c.name_ar, 'Uncategorized') AS category,
             COALESCE(br.name, 'Unbranded') AS brand,
             SUM(oi.quantity)::BIGINT AS units,
             SUM(oi.total_price_syp)::BIGINT AS revenue
      FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN product_variants pv ON pv.id = oi.variant_id
      LEFT JOIN products p ON p.id = pv.product_id
      LEFT JOIN product_bundles b ON b.id = oi.bundle_id
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN brands br ON br.id = p.brand_id
      WHERE o.created_at BETWEEN p_from AND p_to AND o.status IN ('delivered', 'completed')
      GROUP BY o.created_at::DATE, COALESCE(p.name_ar, b.name_ar, oi.product_snapshot->>'name_ar', 'Unknown'), COALESCE(c.name_ar, 'Uncategorized'), COALESCE(br.name, 'Unbranded')
      ORDER BY sale_date DESC, revenue DESC
    )
    SELECT jsonb_build_object(
      'rows', COALESCE(jsonb_agg(to_jsonb(rows)), '[]'::JSONB),
      'summary', jsonb_build_object('total_revenue', COALESCE(SUM(revenue), 0), 'units_sold', COALESCE(SUM(units), 0))
    ) INTO v_result FROM rows;

  ELSIF p_type = 'orders' THEN
    WITH rows AS (
      SELECT o.status::TEXT AS status,
             COALESCE(o.address_snapshot->>'governorate', o.address_snapshot->>'governorate_name', 'Unknown') AS governorate,
             o.payment_method::TEXT AS payment_method,
             COUNT(*)::BIGINT AS order_count,
             SUM(o.total_syp)::BIGINT AS revenue
      FROM orders o
      WHERE o.created_at BETWEEN p_from AND p_to
      GROUP BY o.status, governorate, o.payment_method
      ORDER BY order_count DESC
    )
    SELECT jsonb_build_object(
      'rows', COALESCE(jsonb_agg(to_jsonb(rows)), '[]'::JSONB),
      'summary', jsonb_build_object('order_count', COALESCE(SUM(order_count), 0), 'gross_order_value', COALESCE(SUM(revenue), 0))
    ) INTO v_result FROM rows;

  ELSIF p_type = 'customers' THEN
    WITH rows AS (
      SELECT CASE WHEN EXISTS (
               SELECT 1 FROM orders previous_order
               WHERE previous_order.customer_id = cp.id AND previous_order.created_at < p_from
             ) THEN 'returning' ELSE 'new' END AS customer_type,
             CASE WHEN cp.referred_by IS NULL THEN 'organic' ELSE 'referral' END AS acquisition_source,
             COUNT(*)::BIGINT AS customer_count
      FROM customer_profiles cp
      WHERE cp.created_at BETWEEN p_from AND p_to
      GROUP BY customer_type, acquisition_source
      ORDER BY customer_count DESC
    )
    SELECT jsonb_build_object(
      'rows', COALESCE(jsonb_agg(to_jsonb(rows)), '[]'::JSONB),
      'summary', jsonb_build_object('customers', COALESCE(SUM(customer_count), 0))
    ) INTO v_result FROM rows;

  ELSIF p_type = 'inventory' THEN
    WITH rows AS (
      SELECT pv.sku, p.name_ar AS product, pv.stock_quantity,
             COALESCE(pv.low_stock_threshold, 5) AS low_stock_threshold,
             (pv.stock_quantity <= COALESCE(pv.low_stock_threshold, 5)) AS is_low_stock,
             pv.is_active
      FROM product_variants pv
      JOIN products p ON p.id = pv.product_id
      ORDER BY is_low_stock DESC, pv.stock_quantity, pv.sku
    )
    SELECT jsonb_build_object(
      'rows', COALESCE(jsonb_agg(to_jsonb(rows)), '[]'::JSONB),
      'summary', jsonb_build_object(
        'sku_count', COUNT(*),
        'total_units', COALESCE(SUM(stock_quantity), 0),
        'low_stock_count', COUNT(*) FILTER (WHERE is_low_stock)
      )
    ) INTO v_result FROM rows;

  ELSIF p_type = 'loyalty' THEN
    WITH rows AS (
      SELECT CASE
               WHEN cp.loyalty_points = 0 THEN '0'
               WHEN cp.loyalty_points BETWEEN 1 AND 99 THEN '1-99'
               WHEN cp.loyalty_points BETWEEN 100 AND 499 THEN '100-499'
               WHEN cp.loyalty_points BETWEEN 500 AND 999 THEN '500-999'
               ELSE '1000+'
             END AS balance_band,
             COUNT(*)::BIGINT AS customer_count,
             SUM(cp.loyalty_points)::BIGINT AS points_balance
      FROM customer_profiles cp
      GROUP BY balance_band
      ORDER BY MIN(cp.loyalty_points)
    ), totals AS (
      SELECT COALESCE(SUM(points) FILTER (WHERE points > 0), 0)::BIGINT AS total_earned,
             COALESCE(ABS(SUM(points) FILTER (WHERE points < 0)), 0)::BIGINT AS total_spent
      FROM loyalty_points_transactions
      WHERE created_at BETWEEN p_from AND p_to
    )
    SELECT jsonb_build_object(
      'rows', COALESCE((SELECT jsonb_agg(to_jsonb(rows)) FROM rows), '[]'::JSONB),
      'summary', jsonb_build_object(
        'total_earned', totals.total_earned,
        'total_spent', totals.total_spent,
        'outstanding_balance', COALESCE((SELECT SUM(points_balance) FROM rows), 0)
      )
    ) INTO v_result FROM totals;

  ELSIF p_type = 'referral' THEN
    WITH rows AS (
      SELECT status, COUNT(*)::BIGINT AS referral_count,
             COALESCE(SUM(points_awarded), 0)::BIGINT AS points_paid_out
      FROM referrals
      WHERE created_at BETWEEN p_from AND p_to
      GROUP BY status
      ORDER BY referral_count DESC
    )
    SELECT jsonb_build_object(
      'rows', COALESCE(jsonb_agg(to_jsonb(rows)), '[]'::JSONB),
      'summary', jsonb_build_object(
        'total_referrals', COALESCE(SUM(referral_count), 0),
        'completed_referrals', COALESCE(SUM(referral_count) FILTER (WHERE status = 'completed'), 0),
        'conversion_rate', CASE WHEN SUM(referral_count) > 0 THEN ROUND(100.0 * SUM(referral_count) FILTER (WHERE status = 'completed') / SUM(referral_count), 2) ELSE 0 END,
        'points_paid_out', COALESCE(SUM(points_paid_out), 0)
      )
    ) INTO v_result FROM rows;

  ELSIF p_type = 'exchange' THEN
    WITH rows AS (
      SELECT status::TEXT AS status, COALESCE(resolution_path, 'unassigned') AS resolution_path,
             COUNT(*)::BIGINT AS request_count,
             ROUND(AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 3600)::NUMERIC, 2) AS average_resolution_hours
      FROM exchange_requests
      WHERE created_at BETWEEN p_from AND p_to
      GROUP BY status, COALESCE(resolution_path, 'unassigned')
      ORDER BY request_count DESC
    )
    SELECT jsonb_build_object(
      'rows', COALESCE(jsonb_agg(to_jsonb(rows)), '[]'::JSONB),
      'summary', jsonb_build_object('requests', COALESCE(SUM(request_count), 0))
    ) INTO v_result FROM rows;

  ELSIF p_type = 'search' THEN
    WITH rows AS (
      SELECT created_at::DATE AS search_date, lower(trim(query)) AS search_query,
             COUNT(*)::BIGINT AS search_count,
             ROUND(AVG(result_count)::NUMERIC, 2) AS average_results,
             COUNT(*) FILTER (WHERE result_count = 0)::BIGINT AS zero_result_count
      FROM search_analytics
      WHERE created_at BETWEEN p_from AND p_to AND trim(query) <> ''
      GROUP BY created_at::DATE, lower(trim(query))
      ORDER BY search_count DESC, search_date DESC
    )
    SELECT jsonb_build_object(
      'rows', COALESCE(jsonb_agg(to_jsonb(rows)), '[]'::JSONB),
      'summary', jsonb_build_object(
        'total_searches', COALESCE(SUM(search_count), 0),
        'zero_result_searches', COALESCE(SUM(zero_result_count), 0)
      )
    ) INTO v_result FROM rows;

  ELSIF p_type = 'discounts' THEN
    WITH eligible_orders AS (
      SELECT o.*,
             CASE WHEN EXISTS (
               SELECT 1 FROM orders previous_order
               WHERE previous_order.customer_id = o.customer_id
                 AND previous_order.created_at < o.created_at
                 AND previous_order.status IN ('delivered', 'completed')
             ) THEN 'returning' ELSE 'first_time' END AS customer_type
      FROM orders o
      WHERE o.created_at BETWEEN p_from AND p_to
        AND o.discount_code_id IS NOT NULL
        AND o.status IN ('delivered', 'completed')
    ), rows AS (
      SELECT dc.code, eo.customer_type, COUNT(*)::BIGINT AS usage_count,
             SUM(eo.total_syp)::BIGINT AS attributed_revenue,
             SUM(eo.discount_syp)::BIGINT AS discount_amount
      FROM eligible_orders eo
      JOIN discount_codes dc ON dc.id = eo.discount_code_id
      GROUP BY dc.code, eo.customer_type
      ORDER BY attributed_revenue DESC
    )
    SELECT jsonb_build_object(
      'rows', COALESCE(jsonb_agg(to_jsonb(rows)), '[]'::JSONB),
      'summary', jsonb_build_object(
        'redemptions', COALESCE(SUM(usage_count), 0),
        'attributed_revenue', COALESCE(SUM(attributed_revenue), 0),
        'discount_amount', COALESCE(SUM(discount_amount), 0)
      )
    ) INTO v_result FROM rows;

  ELSE
    RAISE EXCEPTION 'unknown_report_type';
  END IF;

  RETURN COALESCE(v_result, jsonb_build_object('rows', '[]'::JSONB, 'summary', '{}'::JSONB));
END;
$$;

REVOKE ALL ON FUNCTION public.admin_report_data(TEXT, TIMESTAMPTZ, TIMESTAMPTZ) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_report_data(TEXT, TIMESTAMPTZ, TIMESTAMPTZ) TO service_role;
