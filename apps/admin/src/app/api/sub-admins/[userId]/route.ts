import { NextResponse } from 'next/server';
import { createSupabaseAdminClientFromEnv } from '@eurostore/database';

interface Params {
  params: {
    userId: string;
  };
}

type PatchBody = {
  is_active?: boolean;
};

export async function PATCH(request: Request, { params }: Params) {
  try {
    const body = (await request.json()) as PatchBody;

    if (body.is_active === undefined) {
      return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
    }

    const admin = createSupabaseAdminClientFromEnv();

    const { data, error } = await admin
      .from('sub_admin_profiles')
      .update({ is_active: body.is_active } as never)
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