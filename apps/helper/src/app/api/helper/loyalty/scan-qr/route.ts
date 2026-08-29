import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { createSupabaseAdminClientFromEnv, createSupabaseServerClientFromEnv } from '@eurostore/database';
import { verifyLoyaltyQRToken } from '@eurostore/shared';

const schema = z.object({
  qr_data: z.string().trim().min(20).max(4096),
}).strict();

const SETTING_DEFAULTS: Record<string, number> = {
  loyalty_earn_amount_syp: 1000,
  loyalty_earn_points: 10,
  loyalty_point_value_syp: 10,
  loyalty_min_redemption_pts: 100,
  loyalty_max_redemption_pct: 30,
};

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
    const { data: helper } = await admin
      .from('helper_profiles')
      .select('id')
      .eq('id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    if (!helper) return NextResponse.json({ error: 'Not a helper' }, { status: 403 });

    const parsed = schema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return NextResponse.json({ error: 'invalid_qr_data' }, { status: 400 });

    const secret = process.env.LOYALTY_QR_SECRET ?? process.env.QR_SECRET ?? '';
    if (secret.length < 32) return NextResponse.json({ error: 'qr_configuration_error' }, { status: 503 });
    let customerId: string;
    try {
      customerId = verifyLoyaltyQRToken(parsed.data.qr_data, secret).customerId;
    } catch (error) {
      const expired = error instanceof Error && error.name === 'TokenExpiredError';
      return NextResponse.json({ error: expired ? 'token_expired' : 'invalid_qr_data' }, { status: expired ? 410 : 400 });
    }
    const customerIdResult = z.string().uuid().safeParse(customerId);
    if (!customerIdResult.success) return NextResponse.json({ error: 'invalid_qr_data' }, { status: 400 });
    customerId = customerIdResult.data;
    const [customerRes, settingsRes] = await Promise.all([
      admin
        .from('customer_profiles')
        .select('id, full_name, loyalty_points, is_blocked')
        .eq('id', customerId)
        .maybeSingle(),
      admin
        .from('system_settings')
        .select('key, value')
        .in('key', Object.keys(SETTING_DEFAULTS)),
    ]);

    const customer = customerRes.data;
    if (!customer) return NextResponse.json({ error: 'customer_not_found' }, { status: 404 });
    if (customer.is_blocked) return NextResponse.json({ error: 'customer_blocked' }, { status: 403 });

    const settings = { ...SETTING_DEFAULTS };
    for (const row of settingsRes.data ?? []) {
      settings[row.key] = Number(row.value) || settings[row.key];
    }

    await admin.from('audit_logs').insert({
      actor_id: user.id,
      actor_role: 'helper',
      action: 'loyalty.qr_scanned',
      entity_type: 'customer_profiles',
      entity_id: customer.id,
      before_state: null,
      after_state: { customer_id: customer.id },
      ip_address: null,
      user_agent: null,
    });

    return NextResponse.json({
      customer: {
        id: customer.id,
        full_name: customer.full_name,
        loyalty_points: customer.loyalty_points,
      },
      loyalty_settings: {
        earn_amount_syp: settings.loyalty_earn_amount_syp,
        earn_points: settings.loyalty_earn_points,
        point_value_syp: settings.loyalty_point_value_syp,
        min_redemption_points: settings.loyalty_min_redemption_pts,
        max_redemption_pct: settings.loyalty_max_redemption_pct,
      },
    });
  } catch (err) {
    console.error('[POST /api/helper/loyalty/scan-qr]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
