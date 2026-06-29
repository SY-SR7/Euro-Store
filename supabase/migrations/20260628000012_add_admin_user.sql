DO $$
DECLARE
  v_admin_id UUID := 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d'::uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'eurostore.private@gmail.com') THEN
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at
    ) VALUES (
      v_admin_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'eurostore.private@gmail.com', crypt('admin123', gen_salt('bf')),
      NOW(), '{"provider":"email","providers":["email"]}', '{}',
      NOW(), NOW()
    );

    INSERT INTO auth.identities (
      id, user_id, provider_id, identity_data, provider, created_at, updated_at
    ) VALUES (
      v_admin_id, v_admin_id, v_admin_id::text, format('{"sub":"%s","email":"%s"}', v_admin_id, 'eurostore.private@gmail.com')::jsonb, 'email', NOW(), NOW()
    );

    INSERT INTO public.admin_profiles (id, full_name, email, is_active)
    VALUES (v_admin_id, 'Euro Store Admin', 'eurostore.private@gmail.com', true);
  END IF;
END $$;
