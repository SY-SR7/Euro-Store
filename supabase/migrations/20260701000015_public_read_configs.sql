-- Allow anyone to read system settings (needed for frontend UI, loyalty, contact info)
CREATE POLICY "Allow public read access to system_settings"
  ON system_settings
  FOR SELECT
  TO public
  USING (true);

-- Allow anyone to read homepage sections (needed for dynamic homepage rendering)
CREATE POLICY "Allow public read access to homepage_sections"
  ON homepage_sections
  FOR SELECT
  TO public
  USING (true);

-- Allow anyone to read shipping rates
CREATE POLICY "Allow public read access to shipping_rates"
  ON shipping_rates
  FOR SELECT
  TO public
  USING (true);
