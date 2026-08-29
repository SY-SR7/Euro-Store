import { requireAdminContext } from '@/supabase-server';
import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/supabase-server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const querySchema = z.object({
  search: z.string().trim().max(100).optional().default(''),
});

export async function GET(request: Request) {
  const ctx = await requireAdminContext('customer_management', 'view');
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  try {
    const params = Object.fromEntries(new URL(request.url).searchParams.entries());
    const parsed = querySchema.safeParse(params);
    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid_query' }, { status: 400 });
    }

    const admin = createAdminSupabaseClient();
    const { data, error } = await admin.rpc('admin_search_customers', {
      p_limit: 100,
      ...(parsed.data.search ? { p_search: parsed.data.search } : {}),
    });
    if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });
    return NextResponse.json(data ?? []);
  } catch { return NextResponse.json({ error: 'server_error' }, { status: 500 }); }
}
