import { NextResponse } from 'next/server';
import { createSupabaseAdminClientFromEnv } from '@eurostore/database';

interface Params { params: { userId: string } }

export async function PATCH(request: Request, { params }: Params) {
  const { is_active } = await request.json() as { is_active: boolean };
  const supabase = createSupabaseAdminClientFromEnv();
  const { error } = await supabase
    .from('user_profiles')
    .update({ is_active })
    .eq('user_id', params.userId)
    .eq('role', 'sub_admin');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}