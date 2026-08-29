import crypto from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createInAppNotification } from '@eurostore/database';
import { generateExchangeQRToken } from '@eurostore/shared';
import type { Database } from '@eurostore/database';

export async function getExchangeQrExpiryHours(admin: SupabaseClient<Database>) {
  const { data } = await admin
    .from('system_settings')
    .select('value')
    .eq('key', 'exchange_qr_expiry_hours')
    .maybeSingle();

  const parsed = Number.parseInt(data?.value ?? '72', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 72;
}

export async function writeExchangeHistory(
  admin: SupabaseClient<Database>,
  exchangeId: string,
  status: string,
  actorId: string,
  actorRole: string,
  notes?: string | null,
) {
  await admin.from('exchange_status_history').insert({
    exchange_request_id: exchangeId,
    status,
    changed_by_id: actorId,
    changed_by_role: actorRole,
    notes: notes ?? null,
  } as never);
}

export function createExchangeQrToken(exchangeId: string, customerId: string, expiresAt: string) {
  const secret = process.env.QR_SECRET ?? process.env.EXCHANGE_QR_SECRET ?? '';
  if (secret.length < 32) throw new Error('exchange_qr_secret_too_short');
  const token = generateExchangeQRToken({ exchangeId, customerId }, secret, { expiresAt });
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  return { token, tokenHash, expiresAt };
}

export async function notifyExchangeCustomer(
  admin: SupabaseClient<Database>,
  customerId: string,
  exchangeId: string,
  status: string,
  titleAr: string,
  titleEn: string,
  bodyAr: string,
  bodyEn: string,
) {
  await createInAppNotification(admin, {
    recipientId: customerId,
    recipientRole: 'customer',
    type: 'exchange_update',
    titleAr,
    titleEn,
    bodyAr,
    bodyEn,
    referenceId: exchangeId,
    referenceType: 'exchange',
    data: { status },
  });
}
