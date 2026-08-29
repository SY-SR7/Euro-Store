DROP POLICY IF EXISTS "Allow public read access to system_settings" ON public.system_settings;
REVOKE SELECT ON TABLE public.system_settings FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.system_settings TO service_role;
