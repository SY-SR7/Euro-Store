import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSupabaseServerClientFromEnv, createSupabaseAdminClientFromEnv } from '@eurostore/database';

/**
 * GET /api/helper/loyalty/preview-redeem?points=NUMBER&customer_id=UUID
 * يحسب قيمة النقاط بالليرة السورية ويتحقق من صحتها
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

    const pointsStr    = req.nextUrl.searchParams.get('points');
    const customerId   = req.nextUrl.searchParams.get('customer_id');
    const invoiceAmount = parseInt(req.nextUrl.searchParams.get('invoice_amount') ?? '0', 10);
    const pointsToRedeem = parseInt(pointsStr ?? '0', 10);
    if (!pointsToRedeem || pointsToRedeem <= 0 || !customerId)
      return NextResponse.json({ error: 'بيانات غير صحيحة' }, { status: 400 });

    // جلب الإعدادات والعميل
    const [settingsRes, customerRes] = await Promise.all([
      admin.from('system_settings').select('key, value')
        .in('key', ['loyalty_point_value_syp', 'loyalty_min_redemption_pts', 'loyalty_max_redemption_pct']),
      admin.from('customer_profiles').select('loyalty_points').eq('id', customerId).maybeSingle(),
    ]);

    const map: Record<string, number> = { loyalty_point_value_syp: 10, loyalty_min_redemption_pts: 100, loyalty_max_redemption_pct: 30 };
    for (const row of settingsRes.data ?? []) map[row.key] = Number(row.value) || map[row.key];

    const currentPoints = customerRes.data?.loyalty_points ?? 0;

    if (pointsToRedeem > currentPoints)
      return NextResponse.json({ error: `رصيد العميل (${currentPoints}) أقل من المطلوب` }, { status: 400 });
    if (pointsToRedeem < map.loyalty_min_redemption_pts)
      return NextResponse.json({ error: `الحد الأدنى للاسترداد ${map.loyalty_min_redemption_pts} نقطة` }, { status: 400 });

    const syp = pointsToRedeem * map.loyalty_point_value_syp;
    if (invoiceAmount > 0) {
      const maxSypValue = Math.floor(invoiceAmount * (map.loyalty_max_redemption_pct / 100));
      if (syp > maxSypValue) {
        return NextResponse.json({
          error: `لا يمكن أن يتجاوز الخصم ${map.loyalty_max_redemption_pct}% من الفاتورة`,
          max_syp_value: maxSypValue,
        }, { status: 400 });
      }
    }
    return NextResponse.json({ points: pointsToRedeem, syp });
  } catch (err) {
    console.error('[GET /api/helper/loyalty/preview-redeem]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
