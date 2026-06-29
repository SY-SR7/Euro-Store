import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/supabase-server';
import { createSupabaseAdminClientFromEnv } from '@eurostore/database';

export async function GET(request: Request) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const page  = Number(url.searchParams.get('page') ?? '1');
  const limit = 30;
  const from  = (page - 1) * limit;

  const admin = createSupabaseAdminClientFromEnv();
  const { data, error, count } = await admin
    .from('audit_logs')
    .select('id, actor_id, actor_role, action, entity_type, entity_id, before_state, after_state, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Map to shape expected by the frontend
  const mapped = (data ?? []).map((log) => ({
    ...log,
    target_table: log.entity_type,
    target_id:    log.entity_id,
    metadata:     log.after_state,
  }));

  return NextResponse.json({ data: mapped, total: count ?? 0 });
}

