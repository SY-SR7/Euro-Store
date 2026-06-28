-- Auth/profile policies required by Supabase Auth middleware.
-- Every portal identifies the signed-in user by auth.uid() and then reads only
-- that user's profile row to determine role and active status.

CREATE POLICY "customers_insert_own_profile"
  ON customer_profiles
  FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "admins_select_own_profile"
  ON admin_profiles
  FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "sub_admins_select_own_profile"
  ON sub_admin_profiles
  FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "helpers_select_own_profile"
  ON helper_profiles
  FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "partners_select_own_profile"
  ON partner_profiles
  FOR SELECT
  USING (id = auth.uid());
