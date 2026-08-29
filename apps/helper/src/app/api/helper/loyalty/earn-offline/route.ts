import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createInAppNotification, createSupabaseServerClientFromEnv, createSupabaseAdminClientFromEnv } from '@eurostore/database';
import { z } from 'zod';
import { offlineLoyaltyError, type OfflineLoyaltyResult } from '@/lib/offline-loyalty';

const schema = z.object({
  operation_id:   z.string().uuid(),
  customer_id:    z.string().uuid(),
  invoice_amount: z.number().int().positive(),
});

/**
 * POST /api/helper/loyalty/earn-offline
 * Helper يمنح نقاطاً للعميل بعد الشراء من المتجر الفعلي
 * PRD §6.10.4
 */
export async function POST(req: NextRequest) {
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

    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: 'بيانات غير صحيحة' }, { status: 400 });
    const { operation_id, customer_id, invoice_amount } = parsed.data;

    const { data, error: rpcError } = await admin.rpc('process_offline_loyalty_atomic', {
      p_operation_id: operation_id,
      p_customer_id: customer_id,
      p_helper_id: user.id,
      p_operation_type: 'earn',
      p_invoice_amount_syp: invoice_amount,
    });
    if (rpcError) {
      const mapped = offlineLoyaltyError(rpcError.message);
      return NextResponse.json({ error: mapped.error }, { status: mapped.status });
    }

    const result = data as unknown as OfflineLoyaltyResult;

    if (!result.replayed) await createInAppNotification(admin, {
      recipientId: customer_id,
      recipientRole: 'customer',
      type: 'loyalty_update',
      titleAr: 'تمت إضافة نقاط إلى رصيدك',
      titleEn: 'Loyalty points earned',
      bodyAr: `ربحت ${result.points.toLocaleString('ar-SY')} نقطة من عملية شراء داخل الفرع.`,
      bodyEn: `You earned ${result.points} points from an in-branch purchase.`,
      referenceType: 'loyalty',
      referenceId: operation_id,
      data: { points: result.points, invoice_amount, balance_after: result.balance_after },
    });

    return NextResponse.json({
      success: true,
      points_earned: result.points,
      balance_after: result.balance_after,
      replayed: result.replayed,
    });
  } catch (err) {
    console.error('[POST /api/helper/loyalty/earn-offline]', err);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}
