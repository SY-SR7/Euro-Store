-- customer_profiles
CREATE POLICY "customers_select_own" ON customer_profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "customers_update_own" ON customer_profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "admins_all_customers" ON customer_profiles FOR ALL USING (EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid() AND is_active = true));

-- orders
CREATE POLICY "customers_select_own_orders" ON orders FOR SELECT USING (customer_id = auth.uid());
CREATE POLICY "customers_insert_own_orders" ON orders FOR INSERT WITH CHECK (customer_id = auth.uid());
CREATE POLICY "admins_helpers_all_orders" ON orders FOR ALL USING (
  EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid() AND is_active = true) OR
  EXISTS (SELECT 1 FROM helper_profiles WHERE id = auth.uid() AND is_active = true)
);

-- public catalog (products, categories, brands)
CREATE POLICY "public_select_products" ON products FOR SELECT USING (is_active = true);
CREATE POLICY "admins_all_products" ON products FOR ALL USING (EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid() AND is_active = true));

CREATE POLICY "public_select_categories" ON categories FOR SELECT USING (is_active = true);
CREATE POLICY "admins_all_categories" ON categories FOR ALL USING (EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid() AND is_active = true));

CREATE POLICY "public_select_brands" ON brands FOR SELECT USING (is_active = true);
CREATE POLICY "admins_all_brands" ON brands FOR ALL USING (EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid() AND is_active = true));

-- audit_logs
CREATE POLICY "admins_select_audit" ON audit_logs FOR SELECT USING (EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid() AND is_active = true));

-- loyalty_points_transactions
CREATE POLICY "customers_select_own_loyalty" ON loyalty_points_transactions FOR SELECT USING (customer_id = auth.uid());
CREATE POLICY "admins_helpers_all_loyalty" ON loyalty_points_transactions FOR SELECT USING (
  EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid() AND is_active = true) OR
  EXISTS (SELECT 1 FROM helper_profiles WHERE id = auth.uid() AND is_active = true)
);
