import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSupabaseServerClientFromEnv, createSupabaseAdminClientFromEnv } from '@eurostore/database';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const cookieStore = cookies();
  const supabase    = createSupabaseServerClientFromEnv(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { status } = await req.json() as { status?: string };
  const allowed = ['pending', 'approved', 'rejected', 'completed'];
  if (!status || !allowed.includes(status))
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });

  const admin = createSupabaseAdminClientFromEnv();
  const { data, error } = await admin
    .from('exchange_requests')
    .update({ status })
    .eq('id', params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await admin.from('audit_logs').insert({
    actor_id  : user.id,
    actor_role: 'admin',
    action    : `exchange.status.${status}`,
    target_id : params.id,
    metadata  : {},
  });

  return NextResponse.json(data);
}