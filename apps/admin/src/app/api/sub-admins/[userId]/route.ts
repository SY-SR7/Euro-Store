import { requireAdminContext } from '@/supabase-server';
import { NextResponse } from 'next/server';
import { createSupabaseAdminClientFromEnv } from '@eurostore/database';

interface Params {
  params: {
    userId: string;
  };
}

type PatchBody = {
  is_active?: boolean;
  display_name?: string;
  email?: string;
};

function mapProfile(profile: { id: string; full_name: string | null; email: string; is_active: boolean; created_at: string }) {
  return {
    user_id: profile.id,
    display_name: profile.full_name,
    email: profile.email,
    is_active: profile.is_active,
    created_at: profile.created_at,
  };
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(_request: Request, { params }: Params) {
  const ctx = await requireAdminContext();
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const admin = createSupabaseAdminClientFromEnv();
  const { data, error } = await admin
    .from('sub_admin_profiles')
    .select('id, full_name, email, is_active, created_at')
    .eq('id', params.userId)
    .single();

  if (error) return NextResponse.json({ error: error?.message || 'database_error' }, { status: 404 });
  return NextResponse.json(mapProfile(data));
}

export async function PATCH(request: Request, { params }: Params) {
  const ctx = await requireAdminContext();
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  try {
    const body = (await request.json()) as PatchBody;

    const update: Record<string, unknown> = {};
    if (typeof body.is_active === 'boolean') update.is_active = body.is_active;
    if (typeof body.display_name === 'string') update.full_name = body.display_name;
    if (typeof body.email === 'string' && body.email.includes('@')) update.email = body.email.trim();

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
    }

    const admin = createSupabaseAdminClientFromEnv();

    if (typeof update.email === 'string') {
      const { error: authError } = await admin.auth.admin.updateUserById(params.userId, {
        email: update.email,
        email_confirm: true,
      });
      if (authError) return NextResponse.json({ error: authError.message }, { status: 500 });
    }

    const { data, error } = await admin
      .from('sub_admin_profiles')
      .update(update)
      .eq('id', params.userId)
      .select('id, full_name, email, is_active, created_at')
      .single();

    if (error) {
      return NextResponse.json({ error: error?.message || 'database_error' }, { status: 500 });
    }

    return NextResponse.json(mapProfile(data));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'server_error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
