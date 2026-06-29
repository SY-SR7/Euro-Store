import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/supabase-server';
import { createSupabaseAdminClientFromEnv } from '@eurostore/database';

type LoyaltyKey =
  | 'loyalty_earn_amount_syp'
  | 'loyalty_earn_points'
  | 'loyalty_redeem_points_per_syp'
  | 'loyalty_max_redeem_percent'
  | 'loyalty_referral_bonus_points';

interface SettingUpdate {
  key?: string;
  value?: string | number;
  description?: string;
}

const LOYALTY_KEYS: LoyaltyKey[] = [
  'loyalty_earn_amount_syp',
  'loyalty_earn_points',
  'loyalty_redeem_points_per_syp',
  'loyalty_max_redeem_percent',
  'loyalty_referral_bonus_points',
];

const DEFAULT_DESCRIPTIONS: Record<LoyaltyKey, string> = {
  loyalty_earn_amount_syp: 'المبلغ بالليرة السورية المطلوب صرفه حتى يدخل العميل في دورة كسب نقاط واحدة.',
  loyalty_earn_points: 'عدد النقاط التي يحصل عليها العميل مقابل كل دورة كسب.',
  loyalty_redeem_points_per_syp: 'عدد النقاط المطلوبة للحصول على خصم 1 ليرة سورية عند الاستبدال.',
  loyalty_max_redeem_percent: 'أقصى نسبة مئوية من الطلب يمكن دفعها باستخدام نقاط الولاء.',
  loyalty_referral_bonus_points: 'عدد نقاط المكافأة الممنوحة عند نجاح الإحالة.',
};

const LIMITS: Record<LoyaltyKey, { min: number; max: number }> = {
  loyalty_earn_amount_syp: { min: 1, max: 999999999 },
  loyalty_earn_points: { min: 0, max: 1000000 },
  loyalty_redeem_points_per_syp: { min: 1, max: 1000000 },
  loyalty_max_redeem_percent: { min: 0, max: 100 },
  loyalty_referral_bonus_points: { min: 0, max: 1000000 },
};

function isLoyaltyKey(key: string): key is LoyaltyKey {
  return (LOYALTY_KEYS as string[]).includes(key);
}

function normalizeSetting(update: SettingUpdate) {
  if (!update.key || !isLoyaltyKey(update.key)) {
    throw new Error(`Invalid loyalty setting key: ${update.key ?? '(empty)'}`);
  }

  const raw = String(update.value ?? '').trim();
  const numeric = Number(raw);

  if (!Number.isFinite(numeric)) {
    throw new Error(`Value for ${update.key} must be numeric`);
  }

  const value = Math.floor(numeric);
  const limits = LIMITS[update.key];

  if (value < limits.min || value > limits.max) {
    throw new Error(`Value for ${update.key} must be between ${limits.min} and ${limits.max}`);
  }

  return {
    key: update.key,
    value: String(value),
    description: update.description?.trim() || DEFAULT_DESCRIPTIONS[update.key],
    updated_at: new Date().toISOString(),
  };
}

async function requireAdmin() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function GET() {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createSupabaseAdminClientFromEnv();
  const { data, error } = await admin
    .from('system_settings')
    .select('key, value, description, updated_at')
    .order('key', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data ?? []);
}

export async function PATCH(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { updates?: SettingUpdate[] } | null;
  const updates = body?.updates;

  if (!Array.isArray(updates) || updates.length === 0) {
    return NextResponse.json({ error: 'updates array is required' }, { status: 400 });
  }

  let normalized: ReturnType<typeof normalizeSetting>[];

  try {
    normalized = updates.map(normalizeSetting);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Invalid settings payload' }, { status: 400 });
  }

  const admin = createSupabaseAdminClientFromEnv();
  const { data, error } = await admin
    .from('system_settings')
    .upsert(normalized as never, { onConflict: 'key' })
    .select('key, value, description, updated_at');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, data: data ?? [] });
}