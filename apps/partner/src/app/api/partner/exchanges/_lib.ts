import crypto from 'crypto';
import { cookies } from 'next/headers';
import { createInAppNotification, createSupabaseAdminClientFromEnv, createSupabaseServerClientFromEnv } from '@eurostore/database';
import { verifyExchangeQRToken } from '@eurostore/shared';

export type PartnerContext = {
  admin: ReturnType<typeof createSupabaseAdminClientFromEnv>;
  userId: string;
};

export async function getPartnerContext(): Promise<PartnerContext | null> {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClientFromEnv({
    get: (name: string) => cookieStore.get(name)?.value,
    set: () => { /* API handlers write cookies through their response boundary. */ },
    remove: () => { /* API handlers write cookies through their response boundary. */ },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const admin = createSupabaseAdminClientFromEnv();
  const { data: partner } = await admin
    .from('partner_profiles')
    .select('id')
    .eq('id', user.id)
    .eq('is_active', true)
    .maybeSingle();

  if (!partner) return null;

  return { admin, userId: user.id };
}

export async function writePartnerExchangeAudit(
  ctx: PartnerContext,
  exchangeId: string,
  action: string,
  beforeState: Record<string, unknown> | null,
  afterState: Record<string, unknown> | null,
) {
  await ctx.admin.from('audit_logs').insert({
    actor_id: ctx.userId,
    actor_role: 'partner',
    action,
    entity_type: 'exchange_requests',
    entity_id: exchangeId,
    before_state: beforeState as never,
    after_state: afterState as never,
    ip_address: null,
    user_agent: null,
  });
}

export function getQrSecret() {
  const secret = process.env.QR_SECRET ?? process.env.EXCHANGE_QR_SECRET ?? '';
  if (secret.length < 32) throw new Error('exchange_qr_secret_too_short');
  return secret;
}

export async function fetchPartnerExchange(ctx: PartnerContext, exchangeId: string) {
  const { data, error } = await ctx.admin
    .from('exchange_requests')
    .select(`
      id, order_id, order_item_id, customer_id, reason, reason_ar, reason_en,
      status, partner_stage, resolution_path, partner_id, qr_code_expires_at,
      qr_code_used_at, created_at, updated_at,
      order_items!order_item_id ( id, quantity, product_snapshot )
    `)
    .eq('id', exchangeId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function verifyScannedExchangeToken(ctx: PartnerContext, rawToken: string) {
  const token = rawToken.trim();
  const payload = verifyExchangeQRToken(token, getQrSecret());
  const hash = crypto.createHash('sha256').update(token).digest('hex');

  const { data: tokenRecord, error: tokenError } = await ctx.admin
    .from('exchange_qr_tokens')
    .select('id, exchange_request_id, redeemed_at, expires_at')
    .eq('token_hash', hash)
    .maybeSingle();

  if (tokenError) throw tokenError;
  if (!tokenRecord) return { error: 'token_not_found' as const };
  if (tokenRecord.redeemed_at) return { error: 'token_already_used' as const };
  if (new Date(tokenRecord.expires_at) < new Date()) return { error: 'token_expired' as const };
  if (tokenRecord.exchange_request_id !== payload.exchangeId) return { error: 'token_mismatch' as const };

  const exchange = await fetchPartnerExchange(ctx, tokenRecord.exchange_request_id);
  if (!exchange) return { error: 'exchange_not_found' as const };
  if (exchange.resolution_path !== 'partner') return { error: 'not_partner_path' as const };
  if (exchange.partner_id && exchange.partner_id !== ctx.userId) return { error: 'assigned_to_other_partner' as const };
  if (exchange.status !== 'approved') {
    return { error: 'invalid_status' as const, exchange };
  }

  if (!exchange.partner_id) {
    const { data: assigned, error } = await ctx.admin
      .from('exchange_requests')
      .update({ partner_id: ctx.userId, updated_at: new Date().toISOString() })
      .eq('id', exchange.id)
      .is('partner_id', null)
      .eq('status', 'approved')
      .eq('resolution_path', 'partner')
      .select('partner_id')
      .maybeSingle();
    if (error) throw error;
    if (!assigned) {
      const latest = await fetchPartnerExchange(ctx, exchange.id);
      if (!latest || latest.partner_id !== ctx.userId) return { error: 'assigned_to_other_partner' as const };
      return { exchange: latest, tokenRecord };
    }
    exchange.partner_id = ctx.userId;
  }

  return { exchange, tokenRecord };
}

export async function transitionPartnerExchange(
  ctx: PartnerContext,
  exchangeId: string,
  fromStatuses: string[],
  targetStatus: string,
  action: string,
  extraUpdates: Record<string, unknown> = {},
) {
  const exchange = await fetchPartnerExchange(ctx, exchangeId);
  if (!exchange) return { error: 'exchange_not_found' as const };
  if (exchange.resolution_path !== 'partner') return { error: 'not_partner_path' as const };
  if (exchange.partner_id !== ctx.userId) return { error: 'not_assigned_to_partner' as const };
  if (!exchange.status) return { error: 'invalid_status' as const, exchange };
  if (exchange.status === targetStatus) return { exchange };
  if (!fromStatuses.includes(exchange.status)) {
    return { error: 'invalid_status' as const, exchange };
  }

  const now = new Date().toISOString();
  const update = {
    status: targetStatus,
    updated_at: now,
    ...extraUpdates,
  };

  let updateQuery = ctx.admin
    .from('exchange_requests')
    .update(update as never)
    .eq('id', exchangeId)
    .eq('partner_id', ctx.userId)
    .eq('status', exchange.status);
  updateQuery = exchange.partner_stage === null
    ? updateQuery.is('partner_stage', null)
    : updateQuery.eq('partner_stage', exchange.partner_stage);
  const { data: updated, error } = await updateQuery
    .select('id, status, partner_stage, updated_at')
    .maybeSingle();

  if (error) throw error;
  if (!updated) return { error: 'concurrent_transition' as const, exchange };

  await ctx.admin.from('exchange_status_history').insert({
    exchange_request_id: exchangeId,
    status: targetStatus,
    changed_by_id: ctx.userId,
    changed_by_role: 'partner',
    notes: action,
  } as never);

  await writePartnerExchangeAudit(
    ctx,
    exchangeId,
    action,
    { status: exchange.status },
    { status: targetStatus, ...extraUpdates },
  );

  await createInAppNotification(ctx.admin, {
    recipientId: exchange.customer_id,
    recipientRole: 'customer',
    type: 'exchange_update',
    titleAr: 'تحديث طلب الاستبدال',
    titleEn: 'Exchange update',
    bodyAr: targetStatus === 'item_received_by_shipping' ? 'تم استلام طلب الاستبدال من شركة الشحن.' : 'تم تحديث طلب الاستبدال.',
    bodyEn: targetStatus === 'item_received_by_shipping' ? 'Your exchange item was collected by shipping.' : 'Your exchange request was updated.',
    referenceId: exchangeId,
    referenceType: 'exchange',
    data: { status: targetStatus },
  });

  return { exchange: { ...exchange, ...updated } };
}

export async function transitionPartnerStage(
  ctx: PartnerContext,
  exchangeId: string,
  fromStages: Array<string | null>,
  targetStage: string,
  action: string,
  extraUpdates: Record<string, unknown> = {},
) {
  const exchange = await fetchPartnerExchange(ctx, exchangeId);
  if (!exchange) return { error: 'exchange_not_found' as const };
  if (exchange.resolution_path !== 'partner') return { error: 'not_partner_path' as const };
  if (exchange.partner_id !== ctx.userId) return { error: 'not_assigned_to_partner' as const };
  if (exchange.status !== 'approved') return { error: 'invalid_status' as const, exchange };
  if (exchange.partner_stage === targetStage) return { exchange };
  if (!fromStages.includes(exchange.partner_stage ?? null)) {
    return { error: 'invalid_stage' as const, exchange };
  }

  const now = new Date().toISOString();
  const update = {
    partner_stage: targetStage,
    updated_at: now,
    ...extraUpdates,
  };

  let updateQuery = ctx.admin
    .from('exchange_requests')
    .update(update as never)
    .eq('id', exchangeId)
    .eq('partner_id', ctx.userId)
    .eq('status', 'approved');
  updateQuery = exchange.partner_stage === null
    ? updateQuery.is('partner_stage', null)
    : updateQuery.eq('partner_stage', exchange.partner_stage);
  const { data: updated, error } = await updateQuery
    .select('id, status, partner_stage, updated_at, qr_code_used_at')
    .maybeSingle();

  if (error) throw error;
  if (!updated) return { error: 'concurrent_transition' as const, exchange };

  await ctx.admin.from('exchange_status_history').insert({
    exchange_request_id: exchangeId,
    status: targetStage,
    changed_by_id: ctx.userId,
    changed_by_role: 'partner',
    notes: action,
  } as never);

  await writePartnerExchangeAudit(
    ctx,
    exchangeId,
    action,
    { status: exchange.status, partner_stage: exchange.partner_stage },
    { status: exchange.status, partner_stage: targetStage, ...extraUpdates },
  );

  const stageLabels: Record<string, { ar: string; en: string }> = {
    received_from_customer: {
      ar: 'تم استلام منتج الاستبدال لدى الشريك.',
      en: 'Your exchange item was received by the partner.',
    },
    ready_for_pickup: {
      ar: 'طلب الاستبدال جاهز لاستلام شركة الشحن.',
      en: 'Your exchange item is ready for delivery pickup.',
    },
    picked_up_by_delivery: {
      ar: 'تم تسليم طلب الاستبدال لشركة الشحن.',
      en: 'Your exchange item was handed to delivery.',
    },
  };

  await createInAppNotification(ctx.admin, {
    recipientId: exchange.customer_id,
    recipientRole: 'customer',
    type: 'exchange_update',
    titleAr: 'تحديث طلب الاستبدال',
    titleEn: 'Exchange update',
    bodyAr: stageLabels[targetStage]?.ar ?? 'تم تحديث طلب الاستبدال.',
    bodyEn: stageLabels[targetStage]?.en ?? 'Your exchange request was updated.',
    referenceId: exchangeId,
    referenceType: 'exchange',
    data: { status: exchange.status, partner_stage: targetStage },
  });

  return { exchange: { ...exchange, ...updated } };
}
