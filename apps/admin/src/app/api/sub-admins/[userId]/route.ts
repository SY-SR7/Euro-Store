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

export async function PATCH(request: Request, { params }: Params) {
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
      .update(update as never)
      .eq('id', params.userId)
      .select('id, full_name, email, is_active, created_at')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      user_id: data.id,
      display_name: data.full_name,
      email: data.email,
      is_active: data.is_active,
      created_at: data.created_at
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'server_error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
