import { requireAdminContext } from '@/supabase-server';
import { NextResponse } from 'next/server';
import { createSupabaseAdminClientFromEnv } from '@eurostore/database';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const ctx = await requireAdminContext();
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

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

import { z } from 'zod';
import { adminActionRatelimit } from '@/lib/ratelimit';

const subAdminSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(/[A-Z]/, 'Requires uppercase').regex(/[0-9]/, 'Requires number'),
  display_name: z.string().min(2).max(50),
});

export async function POST(request: Request) {
  const ctx = await requireAdminContext();
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  // Rate Limiting
  const ip = request.headers.get('x-forwarded-for') ?? 'anonymous';
  const { success } = await adminActionRatelimit.limit(ip);
  if (!success) {
    return NextResponse.json({ error: 'too_many_requests' }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = subAdminSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_input', details: parsed.error.flatten() }, { status: 400 });
  }
  const { email, password, display_name } = parsed.data;

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

