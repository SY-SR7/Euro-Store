import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSupabaseServerClientFromEnv, createSupabaseAdminClientFromEnv } from '@eurostore/database';

export async function GET(request: Request) {
  const cookieStore = cookies();
  const supabase = createSupabaseServerClientFromEnv(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const page  = Number(url.searchParams.get('page') ?? '1');
  const limit = 30;
  const from  = (page - 1) * limit;

  const admin = createSupabaseAdminClientFromEnv();
  const { data, error, count } = await admin
    .from('audit_logs')
    .select('id, actor_id, actor_role, action, target_table, target_id, metadata, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [], total: count ?? 0 });
}