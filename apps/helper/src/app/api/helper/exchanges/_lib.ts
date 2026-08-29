import crypto from 'crypto';
import { cookies } from 'next/headers';
import { createSupabaseAdminClientFromEnv, createSupabaseServerClientFromEnv } from '@eurostore/database';
import { verifyExchangeQRToken } from '@eurostore/shared';

export type HelperContext = {
  admin: ReturnType<typeof createSupabaseAdminClientFromEnv>;
  userId: string;
};

export async function getHelperContext(): Promise<HelperContext | null> {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClientFromEnv({
    get: (name: string) => cookieStore.get(name)?.value,
    set: () => { /* Route handlers do not persist refreshed cookies here. */ },
    remove: () => { /* Route handlers do not persist refreshed cookies here. */ },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const admin = createSupabaseAdminClientFromEnv();
  const { data: helper } = await admin
    .from('helper_profiles')
    .select('id')
    .eq('id', user.id)
    .eq('is_active', true)
    .maybeSingle();

  if (!helper) return null;
  return { admin, userId: user.id };
}

export function getQrSecret() {
  const secret = process.env.QR_SECRET ?? process.env.EXCHANGE_QR_SECRET ?? '';
  if (secret.length < 32) throw new Error('exchange_qr_secret_too_short');
  return secret;
}

export async function fetchHelperExchange(ctx: HelperContext, exchangeId: string) {
  const { data: exchange, error } = await ctx.admin
    .from('exchange_requests')
    .select('id, order_id, order_item_id, customer_id, reason, reason_ar, reason_en, customer_whatsapp, status, resolution_path, partner_id, qr_code_expires_at, qr_code_used_at, replacement_variant_id, created_at, updated_at')
    .eq('id', exchangeId)
    .maybeSingle();

  if (error) throw error;
  if (!exchange) return null;

  const [customerResult, orderItemResult] = await Promise.all([
    ctx.admin
      .from('customer_profiles')
      .select('full_name, phone')
      .eq('id', exchange.customer_id)
      .maybeSingle(),
    exchange.order_item_id
      ? ctx.admin
          .from('order_items')
          .select('id, variant_id, quantity, product_snapshot')
          .eq('id', exchange.order_item_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (customerResult.error) throw customerResult.error;
  if (orderItemResult.error) throw orderItemResult.error;

  return {
    ...exchange,
    customer_profiles: customerResult.data,
    order_items: orderItemResult.data,
  };
}

export async function verifyHelperExchangeToken(ctx: HelperContext, rawToken: string) {
  const token = rawToken.trim();
  const payload = verifyExchangeQRToken(token, getQrSecret());
  const hash = crypto.createHash('sha256').update(token).digest('hex');

  const { error } = await ctx.admin.rpc('helper_scan_exchange_atomic', {
    p_exchange_request_id: payload.exchangeId,
    p_helper_id: ctx.userId,
    p_token_hash: hash,
  });
  if (error) {
    const knownErrors = [
      'invalid_scan_input', 'inactive_helper', 'token_not_found', 'token_already_used',
      'token_expired', 'exchange_not_found', 'not_helper_path', 'invalid_status',
    ] as const;
    const known = knownErrors.find((code) => error.message.includes(code));
    if (known) return { error: known };
    throw error;
  }

  const exchange = await fetchHelperExchange(ctx, payload.exchangeId);
  if (!exchange) return { error: 'exchange_not_found' as const };

  await ctx.admin.from('audit_logs').insert({
    actor_id: ctx.userId,
    actor_role: 'helper',
    action: 'exchange.qr_scanned',
    entity_type: 'exchange_requests',
    entity_id: exchange.id,
    before_state: { qr_code_used_at: null },
    after_state: { qr_code_used_at: exchange.qr_code_used_at },
    ip_address: null,
    user_agent: null,
  } as never);

  return { exchange };
}
