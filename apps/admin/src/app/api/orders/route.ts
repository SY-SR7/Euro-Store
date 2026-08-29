import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/supabase-server';
import { requireAdminContext } from '@/supabase-server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  status: z.string().trim().max(40).optional().default(''),
  search: z.string().trim().max(100).optional().default(''),
});

export async function GET(request: Request) {
  const ctx = await requireAdminContext('order_management', 'view');
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  try {
    const params = Object.fromEntries(new URL(request.url).searchParams.entries());
    const parsed = querySchema.safeParse(params);
    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid_query' }, { status: 400 });
    }

    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase.rpc('admin_list_orders', {
      p_page: parsed.data.page,
      p_limit: parsed.data.limit,
      ...(parsed.data.status ? { p_status: parsed.data.status } : {}),
      ...(parsed.data.search ? { p_search: parsed.data.search } : {}),
    });
    if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
