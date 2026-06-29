import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSupabaseServerClientFromEnv, createSupabaseAdminClientFromEnv } from '@eurostore/database';

export async function GET() {
  const cookieStore = cookies();
  const supabase = createSupabaseServerClientFromEnv(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const admin = createSupabaseAdminClientFromEnv();
  const { data, error } = await admin
    .from('customer_profiles')
    .select('id, user_id, full_name, phone, loyalty_points, referral_code, created_at')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}