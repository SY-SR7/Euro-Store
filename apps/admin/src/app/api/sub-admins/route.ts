import { NextResponse } from 'next/server';
import { createSupabaseAdminClientFromEnv } from '@eurostore/database';

export async function GET() {
  const supabase = createSupabaseAdminClientFromEnv();
  const { data, error } = await supabase
    .from('user_profiles')
    .select('user_id, display_name, is_active, created_at')
    .eq('role', 'sub_admin')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Enrich with email from auth.users via admin client
  const userIds = (data ?? []).map((p: { user_id: string }) => p.user_id);
  const enriched = await Promise.all(
    (data ?? []).map(async (profile: { user_id: string; display_name: string | null; is_active: boolean; created_at: string }) => {
      const { data: authUser } = await supabase.auth.admin.getUserById(profile.user_id);
      return {
        ...profile,
        email: authUser?.user?.email ?? '',
      };
    })
  );

  return NextResponse.json(enriched);
}

export async function POST(request: Request) {
  const { email, password, display_name } = await request.json() as {
    email: string;
    password: string;
    display_name: string;
  };

  if (!email || !password || password.length < 8) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  }

  const supabase = createSupabaseAdminClientFromEnv();

  // Create auth user
  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authErr || !authData.user) {
    return NextResponse.json({ error: authErr?.message ?? 'auth_failed' }, { status: 500 });
  }

  // Insert user_profile with role = sub_admin
  const { error: profileErr } = await supabase
    .from('user_profiles')
    .insert({
      user_id:      authData.user.id,
      role:         'sub_admin',
      display_name: display_name || null,
      is_active:    true,
    });

  if (profileErr) {
    // Rollback auth user
    await supabase.auth.admin.deleteUser(authData.user.id);
    return NextResponse.json({ error: profileErr.message }, { status: 500 });
  }

  return NextResponse.json({ user_id: authData.user.id }, { status: 201 });
}