import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/supabase-server';

export const dynamic = 'force-dynamic';

const LOYALTY_KEYS = [
  'loyalty_earn_amount_syp', 'loyalty_earn_points', 'loyalty_redeem_points_per_syp',
  'loyalty_max_redeem_percent', 'loyalty_referral_bonus_points',
];

export async function GET() {
  try {
    const admin = createAdminSupabaseClient();
    const { data, error } = await admin
      .from('system_settings')
      .select('key, value, description')
      .in('key', LOYALTY_KEYS)
      .order('key');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? []);
  } catch { return NextResponse.json({ error: 'server_error' }, { status: 500 }); }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = createAdminSupabaseClient();
    const body = await req.json() as { key: string; value: string }[];
    if (!Array.isArray(body) || body.length === 0)
      return NextResponse.json({ error: 'expected array of {key, value}' }, { status: 400 });

    const results = await Promise.all(
      body
        .filter(item => LOYALTY_KEYS.includes(item.key))
        .map(item => admin.from('system_settings').update({ value: item.value } as never).eq('key', item.key))
    );
    const errors = results.filter(r => r.error).map(r => r.error!.message);
    if (errors.length > 0) return NextResponse.json({ error: errors.join('; ') }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: 'server_error' }, { status: 500 }); }
}