import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/supabase-server';

type LoyaltyKey =
  | 'loyalty_earn_amount_syp'
  | 'loyalty_earn_points'
  | 'loyalty_redeem_points_per_syp'
  | 'loyalty_max_redeem_percent'
  | 'loyalty_referral_bonus_points';

const LOYALTY_KEYS: LoyaltyKey[] = [
  'loyalty_earn_amount_syp',
  'loyalty_earn_points',
  'loyalty_redeem_points_per_syp',
  'loyalty_max_redeem_percent',
  'loyalty_referral_bonus_points',
];

const DEFAULT_DESC: Record<LoyaltyKey, string> = {
  loyalty_earn_amount_syp:       'المبلغ بالليرة السورية لكل دورة كسب نقاط.',
  loyalty_earn_points:           'عدد النقاط الممنوحة لكل دورة كسب.',
  loyalty_redeem_points_per_syp: 'عدد النقاط المطلوبة للحصول على خصم 1 ل.س.',
  loyalty_max_redeem_percent:    'أقصى نسبة من الطلب يمكن دفعها بالنقاط.',
  loyalty_referral_bonus_points: 'نقاط مكافأة الإحالة.',
};

const LIMITS: Record<LoyaltyKey, { min: number; max: number }> = {
  loyalty_earn_amount_syp:       { min: 1,   max: 999_999_999 },
  loyalty_earn_points:           { min: 0,   max: 1_000_000 },
  loyalty_redeem_points_per_syp: { min: 1,   max: 1_000_000 },
  loyalty_max_redeem_percent:    { min: 0,   max: 100 },
  loyalty_referral_bonus_points: { min: 0,   max: 1_000_000 },
};

export async function GET() {
  const admin = await requireAdminClient();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await admin
    .from('system_settings')
    .select('key, value, description, updated_at')
    .order('key');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdminClient();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null) as { updates?: { key?: string; value?: string | number }[] } | null;
  const updates = body?.updates;
  if (!Array.isArray(updates) || updates.length === 0)
    return NextResponse.json({ error: 'updates array required' }, { status: 400 });

  const normalized: { key: LoyaltyKey; value: string; description: string; updated_at: string }[] = [];
  for (const u of updates) {
    if (!u.key || !(LOYALTY_KEYS as string[]).includes(u.key))
      return NextResponse.json({ error: `Invalid key: ${u.key ?? ''}` }, { status: 400 });
    const k = u.key as LoyaltyKey;
    const n = Math.floor(Number(String(u.value ?? '').trim()));
    if (!Number.isFinite(n)) return NextResponse.json({ error: `${k} must be numeric` }, { status: 400 });
    const lim = LIMITS[k];
    if (n < lim.min || n > lim.max)
      return NextResponse.json({ error: `${k} must be between ${lim.min} and ${lim.max}` }, { status: 400 });
    normalized.push({ key: k, value: String(n), description: DEFAULT_DESC[k], updated_at: new Date().toISOString() });
  }

  const { data, error } = await admin
    .from('system_settings')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .upsert(normalized as any, { onConflict: 'key' })
    .select('key, value, description, updated_at');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, data: data ?? [] });
}