import { NextResponse } from 'next/server';
import { createSupabaseAdminClientFromEnv } from '@eurostore/database';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get('page') ?? '1'));
    const limit = 30;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const admin = createSupabaseAdminClientFromEnv();

    const { data, error, count } = await admin
      .from('audit_logs')
      .select('id, actor_id, actor_role, action, entity_type, entity_id, before_state, after_state, created_at', {
        count: 'exact'
      })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const mapped = (data ?? []).map((log) => ({
      id: log.id,
      actor_id: log.actor_id,
      actor_role: log.actor_role,
      action: log.action,
      target_table: log.entity_type,
      target_id: log.entity_id,
      metadata: log.after_state,
      created_at: log.created_at
    }));

    return NextResponse.json({
      data: mapped,
      total: count ?? mapped.length
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'server_error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}