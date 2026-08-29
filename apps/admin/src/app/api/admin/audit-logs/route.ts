import { NextResponse } from 'next/server';
import { requireAdminContext } from '@/supabase-server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const filtersSchema = z.object({
  page: z.coerce.number().int().min(1).max(100_000).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(50),
  action: z.string().trim().max(120).optional(),
  entity_type: z.string().trim().max(120).optional(),
  actor_role: z.enum(['admin', 'sub_admin', 'helper', 'partner', 'customer', 'system']).optional(),
  actor_id: z.string().uuid().optional(),
  date_from: z.string().datetime({ offset: true }).optional(),
  date_to: z.string().datetime({ offset: true }).optional(),
  format: z.enum(['json', 'csv']).default('json'),
});

function csvValue(value: unknown): string {
  const raw = value === null || value === undefined
    ? ''
    : typeof value === 'object' ? JSON.stringify(value) : String(value);
  const safe = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replaceAll('"', '""')}"`;
}

export async function GET(request: Request) {
  const ctx = await requireAdminContext('audit_log', 'view');
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const params = Object.fromEntries(new URL(request.url).searchParams.entries());
  const parsed = filtersSchema.safeParse(params);
  if (!parsed.success) return NextResponse.json({ error: 'invalid_filters' }, { status: 400 });
  const filters = parsed.data;
  const from = (filters.page - 1) * filters.per_page;
  const to = from + filters.per_page - 1;

  let query = ctx.admin
    .from('audit_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (filters.action) query = query.eq('action', filters.action);
  if (filters.entity_type) query = query.eq('entity_type', filters.entity_type);
  if (filters.actor_role) query = query.eq('actor_role', filters.actor_role);
  if (filters.actor_id) query = query.eq('actor_id', filters.actor_id);
  if (filters.date_from) query = query.gte('created_at', filters.date_from);
  if (filters.date_to) query = query.lte('created_at', filters.date_to);
  query = filters.format === 'csv' ? query.range(0, 9_999) : query.range(from, to);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });

  if (filters.format === 'csv') {
    const columns = ['id', 'created_at', 'actor_id', 'actor_role', 'action', 'entity_type', 'entity_id', 'before_state', 'after_state', 'ip_address'];
    const csv = [
      columns.map(csvValue).join(','),
      ...(data ?? []).map((row) => columns.map((column) => csvValue((row as Record<string, unknown>)[column])).join(',')),
    ].join('\r\n');
    return new NextResponse(`\uFEFF${csv}`, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="audit-logs.csv"',
        'Cache-Control': 'private, no-store',
      },
    });
  }

  return NextResponse.json({ data: data ?? [], total: count ?? 0, page: filters.page, per_page: filters.per_page });
}
