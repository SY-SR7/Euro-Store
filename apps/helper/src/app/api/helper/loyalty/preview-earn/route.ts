import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSupabaseServerClientFromEnv, createSupabaseAdminClientFromEnv } from '@eurostore/database';

/**
 * GET /api/helper/loyalty/preview-earn?amount=NUMBER
 * يحسب عدد النقاط التي سيكسبها العميل عن مبلغ الفاتورة
 */
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createSupabaseServerClientFromEnv({
      get: (name: string) => cookieStore.get(name)?.value,
      set: () => { /* Route handlers do not persist refreshed cookies here. */ },
      remove: () => { /* Route handlers do not persist refreshed cookies here. */ },
    });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = createSupabaseAdminClientFromEnv();
    const { data: helper } = await admin.from('helper_profiles').select('id').eq('id', user.id).eq('is_active', true).maybeSingle();
    if (!helper) return NextResponse.json({ error: 'Not a helper' }, { status: 403 });

    const amountStr = req.nextUrl.searchParams.get('amount');
    const amount = parseInt(amountStr ?? '0', 10);
    if (!amount || amount <= 0) return NextResponse.json({ error: 'مبلغ غير صحيح' }, { status: 400 });

    // جلب إعدادات الولاء
    const { data: settings } = await admin
      .from('system_settings')
      .select('key, value')
      .in('key', ['loyalty_earn_amount_syp', 'loyalty_earn_points']);

    const map: Record<string, number> = {
      loyalty_earn_amount_syp: 1000,
      loyalty_earn_points: 10,
    };
    for (const row of settings ?? []) map[row.key] = Number(row.value) || map[row.key];

    const points = Math.floor(amount / map.loyalty_earn_amount_syp) * map.loyalty_earn_points;
    return NextResponse.json({ points });
  } catch (err) {
    console.error('[GET /api/helper/loyalty/preview-earn]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
