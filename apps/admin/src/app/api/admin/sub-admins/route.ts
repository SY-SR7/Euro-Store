import { NextResponse } from 'next/server';
import { z } from 'zod';
import { strongPasswordSchema } from '@eurostore/shared';
import { adminActionRatelimit } from '@/lib/ratelimit';
import { requireAdminContext, writeAuditLog } from '@/supabase-server';

export const dynamic = 'force-dynamic';

const createSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: strongPasswordSchema,
  display_name: z.string().trim().min(2).max(100),
}).strict();

function mapProfile(profile: { id: string; full_name: string | null; email: string; is_active: boolean | null; created_at: string | null }) {
  return {
    user_id: profile.id,
    display_name: profile.full_name,
    email: profile.email,
    is_active: profile.is_active ?? false,
    created_at: profile.created_at ?? '',
  };
}

export async function GET() {
  const ctx = await requireAdminContext('sub_admins', 'view');
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data, error } = await ctx.admin
    .from('sub_admin_profiles')
    .select('id, full_name, email, is_active, created_at')
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });

  return NextResponse.json((data ?? []).map(mapProfile));
}

export async function POST(request: Request) {
  const ctx = await requireAdminContext('sub_admins', 'create');
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const { success } = await adminActionRatelimit.limit(`${ctx.userId}:${ip}:sub-admin-create`);
  if (!success) return NextResponse.json({ error: 'too_many_requests' }, { status: 429 });

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });

  const { data: authData, error: authError } = await ctx.admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: { role: 'sub_admin' },
  });
  if (authError || !authData.user) {
    return NextResponse.json(
      { error: authError?.code === 'email_exists' ? 'email_exists' : 'account_create_failed' },
      { status: authError?.code === 'email_exists' ? 409 : 500 },
    );
  }

  const { data: profile, error: profileError } = await ctx.admin
    .from('sub_admin_profiles')
    .insert({
      id: authData.user.id,
      email: parsed.data.email,
      full_name: parsed.data.display_name,
      is_active: true,
      created_by: ctx.userId,
    })
    .select('id, full_name, email, is_active, created_at')
    .single();

  if (profileError || !profile) {
    await ctx.admin.auth.admin.deleteUser(authData.user.id);
    return NextResponse.json({ error: 'profile_create_failed' }, { status: 500 });
  }

  await writeAuditLog({
    admin: ctx.admin,
    actorId: ctx.userId,
    actorRole: ctx.role,
    action: 'sub_admin.created',
    entityType: 'sub_admin_profiles',
    entityId: profile.id,
    afterState: profile,
  });

  return NextResponse.json(mapProfile(profile), { status: 201 });
}
