import { NextResponse } from 'next/server';
import { createAdminSupabaseClient, getSessionClient } from '@/supabase-server';
import { createPrivateStorageUrlMap } from '@eurostore/database';
import { createLoyaltyQrObject } from '@/app/api/auth/_lib';

export const dynamic = 'force-dynamic';

const SETTING_DEFAULTS: Record<string, number> = {
  loyalty_earn_amount_syp: 1000,
  loyalty_earn_points: 10,
  loyalty_point_value_syp: 10,
  loyalty_min_redemption_pts: 100,
  loyalty_max_redemption_pct: 30,
};

export async function GET() {
  const { client, user } = await getSessionClient();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const admin = createAdminSupabaseClient();

  const [profileRes, transactionsRes, settingsRes] = await Promise.all([
    client
      .from('customer_profiles')
      .select('id, full_name, loyalty_points, referral_code, qr_code_url, loyalty_qr_version')
      .eq('id', user.id)
      .single(),
    client
      .from('loyalty_points_transactions')
      .select('id, type, points, balance_after, notes, created_at')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
    admin
      .from('system_settings')
      .select('key, value')
      .in('key', Object.keys(SETTING_DEFAULTS)),
  ]);

  if (profileRes.error) {
    return NextResponse.json({ error: 'profile_not_found' }, { status: 404 });
  }

  const settings = { ...SETTING_DEFAULTS };
  for (const row of settingsRes.data ?? []) {
    settings[row.key] = Number(row.value) || settings[row.key];
  }

  let qrObjectKey = profileRes.data.qr_code_url;
  if (profileRes.data.loyalty_qr_version !== 2 || !qrObjectKey) {
    const regenerated = await createLoyaltyQrObject(admin, user.id);
    if (regenerated) {
      qrObjectKey = regenerated;
      await admin.from('customer_profiles').update({ qr_code_url: regenerated, loyalty_qr_version: 2 }).eq('id', user.id);
    } else {
      qrObjectKey = null;
    }
  }
  const qrUrls = await createPrivateStorageUrlMap(admin, 'loyalty-qr-codes', [qrObjectKey], 300);
  const customer = {
    ...profileRes.data,
    loyalty_qr_version: qrObjectKey ? 2 : profileRes.data.loyalty_qr_version,
    qr_code_url: qrObjectKey ? qrUrls.get(qrObjectKey) ?? null : null,
  };

  return NextResponse.json({
    customer,
    balance: profileRes.data.loyalty_points ?? 0,
    summary: {
      point_value_syp: settings.loyalty_point_value_syp,
      earn_amount_syp: settings.loyalty_earn_amount_syp,
      earn_points: settings.loyalty_earn_points,
      min_redemption_points: settings.loyalty_min_redemption_pts,
      max_redemption_pct: settings.loyalty_max_redemption_pct,
      redeemable_value_syp: (profileRes.data.loyalty_points ?? 0) * settings.loyalty_point_value_syp,
    },
    recent_transactions: transactionsRes.data ?? [],
  });
}
