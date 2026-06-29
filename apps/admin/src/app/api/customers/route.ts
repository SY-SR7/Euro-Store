import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') ?? '';
    const limit  = Math.min(100, parseInt(searchParams.get('limit') ?? '50'));

    const supabase = createAdminSupabaseClient();

    let query = supabase
      .from('customer_profiles')
      .select('id, full_name, phone, email, loyalty_points, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (search) {
      query = query.or(
        `full_name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`
      );
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(data ?? []);
  } catch {
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
