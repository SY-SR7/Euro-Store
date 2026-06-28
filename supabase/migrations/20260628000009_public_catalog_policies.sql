CREATE POLICY "public_select_attribute_types"
  ON attribute_types
  FOR SELECT
  USING (true);

CREATE POLICY "public_select_attribute_values"
  ON attribute_values
  FOR SELECT
  USING (true);

CREATE POLICY "public_select_active_product_variants"
  ON product_variants
  FOR SELECT
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1
      FROM products
      WHERE products.id = product_variants.product_id
        AND products.is_active = true
    )
  );

CREATE POLICY "public_select_variant_attributes"
  ON variant_attributes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM product_variants
      JOIN products ON products.id = product_variants.product_id
      WHERE product_variants.id = variant_attributes.variant_id
        AND product_variants.is_active = true
        AND products.is_active = true
    )
  );

CREATE POLICY "public_select_product_images"
  ON product_images
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM products
      WHERE products.id = product_images.product_id
        AND products.is_active = true
    )
  );

CREATE POLICY "public_select_product_videos"
  ON product_videos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM products
      WHERE products.id = product_videos.product_id
        AND products.is_active = true
    )
  );

CREATE POLICY "public_select_active_shipping_rates"
  ON shipping_rates
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "public_select_active_homepage_sections"
  ON homepage_sections
  FOR SELECT
  USING (is_active = true);
