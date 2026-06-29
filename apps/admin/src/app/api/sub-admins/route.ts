import { NextResponse } from 'next/server';
import { createSupabaseAdminClientFromEnv } from '@eurostore/database';

export async function GET() {
  const supabase = createSupabaseAdminClientFromEnv();
  const { data, error } = await supabase
    .from('sub_admin_profiles')
    .select('id, full_name, email, is_active, created_at')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Map to shape expected by the frontend
  const mapped = (data ?? []).map((p) => ({
    user_id: p.id,
    display_name: p.full_name,
    email: p.email,
    is_active: p.is_active,
    created_at: p.created_at,
  }));

  return NextResponse.json(mapped);
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

  // Insert into sub_admin_profiles (id = auth user id)
  const { error: profileErr } = await supabase
    .from('sub_admin_profiles')
    .insert({
      id:        authData.user.id,
      email:     email,
      full_name: display_name || email,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

  if (profileErr) {
    await supabase.auth.admin.deleteUser(authData.user.id);
    return NextResponse.json({ error: profileErr.message }, { status: 500 });
  }

  return NextResponse.json({ user_id: authData.user.id }, { status: 201 });
}

