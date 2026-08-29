import { NextResponse } from 'next/server';
import { createSupabaseAdminClientFromEnv } from '@eurostore/database';
import { createServerSupabaseClient } from '../../../supabase-server';

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const admin = createSupabaseAdminClientFromEnv();
  const { data: helper } = await admin.from('helper_profiles').select('id').eq('id', user.id).eq('is_active', true).maybeSingle();
  if (!helper) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { data, error } = await supabase
    .from('orders')
    .select('id, order_number, status, total_syp, created_at, address_snapshot')
    .in('status', ['pending', 'confirmed', 'processing'])
    .order('created_at', { ascending: true })
    .limit(50);

  if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });
  return NextResponse.json(data);
}


