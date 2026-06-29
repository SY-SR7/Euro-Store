import { NextResponse } from 'next/server';
import { createSupabaseAdminClientFromEnv } from '@eurostore/database';

interface Params { params: { userId: string } }

export async function PATCH(request: Request, { params }: Params) {
  const { is_active } = await request.json() as { is_active: boolean };
  const supabase = createSupabaseAdminClientFromEnv();
  const { error } = await supabase
    .from('sub_admin_profiles')
    .update({ is_active })
    .eq('id', params.userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
