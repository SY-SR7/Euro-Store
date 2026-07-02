import { requireAdminContext } from '@/supabase-server';
import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const ctx = await requireAdminContext();
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') ?? '';
    const admin = createAdminSupabaseClient();
    let query = admin
      .from('customer_profiles')
      .select('id,full_name,phone,email,created_at,loyalty_points,referral_code,is_blocked')
      .order('created_at', { ascending: false })
      .limit(100);
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
    }
    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error?.message || 'database_error' }, { status: 500 });
    return NextResponse.json(data ?? []);
  } catch { return NextResponse.json({ error: 'server_error' }, { status: 500 }); }
}