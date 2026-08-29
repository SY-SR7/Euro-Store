import type { SupabaseClient } from '@supabase/supabase-js';
import { Buffer } from 'buffer';
import type { Database, Json } from './types';
import { createInvoicePdf, type InvoiceOrder } from './invoice-pdf';

export type DatabaseQueryClient = {
  from: SupabaseClient<Database>['from'];
  rpc: SupabaseClient<Database>['rpc'];
};

type NotificationRole = Database['public']['Enums']['user_role'];
type NotificationType = Database['public']['Enums']['notification_type'];

export type CreateNotificationInput = {
  recipientId: string;
  recipientRole: NotificationRole;
  type: NotificationType;
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
  referenceId?: string | null;
  referenceType?: string | null;
  data?: Json | null;
  sentPush?: boolean;
  sentEmail?: boolean;
  sendPush?: boolean;
  sendEmail?: boolean;
};

export async function createInAppNotification(
  client: DatabaseQueryClient,
  input: CreateNotificationInput,
) {
  const inserted = await client.from('notifications').insert({
    recipient_id: input.recipientId,
    recipient_role: input.recipientRole,
    type: input.type,
    title_ar: input.titleAr,
    title_en: input.titleEn,
    body_ar: input.bodyAr,
    body_en: input.bodyEn,
    reference_id: input.referenceId ?? null,
    reference_type: input.referenceType ?? null,
    data: input.data ?? null,
    sent_push: input.sentPush ?? false,
    sent_email: input.sentEmail ?? false,
    push_required: input.sendPush ?? true,
    email_required: input.sendEmail ?? true,
    dispatching_at: new Date().toISOString(),
    dispatch_attempts: 1,
  }).select('id').single();

  if (inserted.error || !inserted.data) return inserted;

  const [sentPush, sentEmail] = await Promise.all([
    input.sentPush || input.sendPush === false ? Promise.resolve(Boolean(input.sentPush)) : trySendPush(client, input),
    input.sentEmail || input.sendEmail === false ? Promise.resolve(Boolean(input.sentEmail)) : trySendEmail(client, input),
  ]);

  const pushComplete = sentPush || input.sentPush || input.sendPush === false;
  const emailComplete = sentEmail || input.sentEmail || input.sendEmail === false;
  await client
    .from('notifications')
    .update({
      ...(sentPush ? { sent_push: true } : {}),
      ...(sentEmail ? { sent_email: true } : {}),
      dispatching_at: null,
      next_dispatch_at: pushComplete && emailComplete ? null : notificationRetryAt(1),
      last_dispatch_error: pushComplete && emailComplete ? null : 'delivery_failed',
    })
    .eq('id', inserted.data.id);

  return inserted;
}

export async function notifyRestockedVariant(
  client: DatabaseQueryClient,
  variantId: string,
) {
  const [{ data: variant }, { data: subscriptions, error }] = await Promise.all([
    client.from('product_variants').select('id, sku, products(name_ar, name_en)').eq('id', variantId).maybeSingle(),
    client.from('notify_me_subscriptions').select('id, customer_id').eq('product_variant_id', variantId).eq('is_notified', false),
  ]);
  if (error || !variant || !subscriptions?.length) return { notified: 0, error };

  const product = variant.products as { name_ar?: string; name_en?: string } | null;
  const notifiedSubscriptionIds: string[] = [];

  for (let offset = 0; offset < subscriptions.length; offset += 25) {
    const batch = subscriptions.slice(offset, offset + 25);
    const results = await Promise.all(batch.map(async (subscription) => {
      const result = await createInAppNotification(client, {
        recipientId: subscription.customer_id,
        recipientRole: 'customer',
        type: 'system',
        titleAr: 'عاد المنتج إلى المخزون',
        titleEn: 'Back in stock',
        bodyAr: `المنتج ${product?.name_ar || variant.sku} متوفر الآن.`,
        bodyEn: `${product?.name_en || variant.sku} is available again.`,
        referenceId: variantId,
        referenceType: 'product_variant',
        data: { event: 'back_in_stock', sku: variant.sku },
      });
      if (!result.error) notifiedSubscriptionIds.push(subscription.id);
    }));
    await Promise.all(results);
  }

  if (notifiedSubscriptionIds.length) {
    await client.from('notify_me_subscriptions').update({ is_notified: true }).in('id', notifiedSubscriptionIds);
  }
  return { notified: notifiedSubscriptionIds.length, error: null };
}

export async function dispatchPendingNotifications(
  client: DatabaseQueryClient,
  limit = 100,
) {
  const { data: rows, error } = await client.rpc('claim_pending_notifications', {
    p_limit: Math.min(Math.max(limit, 1), 250),
  });

  if (error || !rows?.length) return { dispatched: 0, error };

  let dispatched = 0;
  for (const row of rows) {
    const input: CreateNotificationInput = {
      recipientId: row.recipient_id,
      recipientRole: row.recipient_role,
      type: row.type,
      titleAr: row.title_ar,
      titleEn: row.title_en,
      bodyAr: row.body_ar,
      bodyEn: row.body_en,
      referenceId: row.reference_id,
      referenceType: row.reference_type,
      data: row.data,
    };

    const [sentPush, sentEmail] = await Promise.all([
      row.sent_push || !row.push_required ? Promise.resolve(Boolean(row.sent_push)) : trySendPush(client, input),
      row.sent_email || !row.email_required ? Promise.resolve(Boolean(row.sent_email)) : trySendEmail(client, input),
    ]);

    const pushComplete = row.sent_push || !row.push_required || sentPush;
    const emailComplete = row.sent_email || !row.email_required || sentEmail;
    if (sentPush || sentEmail) {
      await client.from('notifications').update({
        sent_push: row.sent_push || sentPush,
        sent_email: row.sent_email || sentEmail,
        dispatching_at: null,
        next_dispatch_at: pushComplete && emailComplete ? null : notificationRetryAt(row.dispatch_attempts),
        last_dispatch_error: pushComplete && emailComplete ? null : 'delivery_failed',
      }).eq('id', row.id);
      dispatched += 1;
    } else {
      await client.from('notifications').update({
        dispatching_at: null,
        next_dispatch_at: notificationRetryAt(row.dispatch_attempts),
        last_dispatch_error: 'delivery_failed',
      }).eq('id', row.id);
    }
  }

  return { dispatched, error: null };
}

function notificationRetryAt(attempts: number): string {
  const exponent = Math.max(0, Math.min(attempts - 1, 7));
  const delayMinutes = Math.min(360, 5 * (2 ** exponent));
  return new Date(Date.now() + delayMinutes * 60_000).toISOString();
}

export async function notifyReferralRewardForOrder(
  client: DatabaseQueryClient,
  orderId: string,
  referredCustomerId: string,
) {
  const { data: referral } = await client
    .from('referrals')
    .select('referrer_id, points_awarded')
    .eq('referred_id', referredCustomerId)
    .eq('status', 'completed')
    .maybeSingle();
  if (!referral?.referrer_id || !referral.points_awarded) return { notified: false };

  const { data: existing } = await client
    .from('notifications')
    .select('id')
    .eq('recipient_id', referral.referrer_id)
    .eq('recipient_role', 'customer')
    .eq('type', 'loyalty_update')
    .eq('reference_id', orderId)
    .eq('reference_type', 'referral')
    .maybeSingle();
  if (existing) return { notified: false };

  await createInAppNotification(client, {
    recipientId: referral.referrer_id,
    recipientRole: 'customer',
    type: 'loyalty_update',
    titleAr: 'تمت إضافة مكافأة الإحالة',
    titleEn: 'Referral reward earned',
    bodyAr: `تمت إضافة ${referral.points_awarded.toLocaleString('ar-SY')} نقطة إلى رصيدك.`,
    bodyEn: `${referral.points_awarded} referral points were added to your balance.`,
    referenceId: orderId,
    referenceType: 'referral',
    data: { points: referral.points_awarded },
  });
  return { notified: true };
}

async function trySendPush(
  client: DatabaseQueryClient,
  input: CreateNotificationInput,
): Promise<boolean> {
  const accessToken = process.env.EXPO_ACCESS_TOKEN?.trim();
  if (!accessToken) return false;

  try {
    const { data: tokens, error } = await client
      .from('push_notification_tokens')
      .select('token')
      .eq('user_id', input.recipientId)
      .eq('user_role', input.recipientRole);

    if (error || !tokens?.length) return false;

    const language = await getRecipientLanguage(client, input.recipientRole, input.recipientId);
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tokens.map((row) => ({
        to: row.token,
        title: language === 'en' ? input.titleEn : input.titleAr,
        body: language === 'en' ? input.bodyEn : input.bodyAr,
        data: {
          type: input.type,
          reference_id: input.referenceId ?? '',
          reference_type: input.referenceType ?? '',
        },
        sound: 'default',
      }))),
    });

    if (!response.ok) return false;

    const payload = await response.json().catch(() => null) as {
      data?: Array<{ status?: string; details?: { error?: string } }>;
    } | null;
    if (!Array.isArray(payload?.data) || payload.data.length !== tokens.length) return false;

    const invalidTokens = payload.data.flatMap((ticket, index) =>
      ticket.status === 'error' && ticket.details?.error === 'DeviceNotRegistered'
        ? [tokens[index].token]
        : [],
    );
    if (invalidTokens.length) {
      await client
        .from('push_notification_tokens')
        .delete()
        .eq('user_id', input.recipientId)
        .eq('user_role', input.recipientRole)
        .in('token', invalidTokens);
    }

    return payload.data.some((ticket) => ticket.status === 'ok');
  } catch {
    return false;
  }
}

async function getRecipientLanguage(
  client: DatabaseQueryClient,
  role: NotificationRole,
  recipientId: string,
): Promise<'ar' | 'en'> {
  if (role !== 'customer') return 'ar';
  const { data } = await client
    .from('customer_profiles')
    .select('preferred_language')
    .eq('id', recipientId)
    .maybeSingle();
  return data?.preferred_language === 'en' ? 'en' : 'ar';
}

async function trySendEmail(
  client: DatabaseQueryClient,
  input: CreateNotificationInput,
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim() ?? process.env.EMAIL_FROM?.trim();
  if (!apiKey || !from) return false;

  const recipient = await getRecipientContact(client, input.recipientRole, input.recipientId);
  if (!recipient) return false;

  try {
    const confirmedOrder = input.recipientRole === 'customer'
      && input.type === 'order_update'
      && input.referenceType === 'order'
      && input.referenceId
      && notificationStatus(input.data) === 'confirmed'
      ? await buildConfirmedOrderEmail(client, input.referenceId, input.recipientId, recipient.language)
      : null;
    const subject = confirmedOrder?.subject
      ?? (recipient.language === 'en' ? input.titleEn : input.titleAr);
    const body = recipient.language === 'en' ? input.bodyEn : input.bodyAr;
    const direction = recipient.language === 'en' ? 'ltr' : 'rtl';

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [recipient.email],
        subject,
        html: confirmedOrder?.html
          ?? `<div dir="${direction}"><h1>${escapeHtml(subject)}</h1><p>${escapeHtml(body)}</p></div>`,
        ...(confirmedOrder ? { attachments: [confirmedOrder.attachment] } : {}),
      }),
    });

    return response.ok;
  } catch {
    return false;
  }
}

async function getRecipientContact(
  client: DatabaseQueryClient,
  role: NotificationRole,
  recipientId: string,
): Promise<{ email: string; language: 'ar' | 'en' } | null> {
  const tableByRole: Partial<Record<NotificationRole, keyof Database['public']['Tables']>> = {
    customer: 'customer_profiles',
    admin: 'admin_profiles',
    sub_admin: 'sub_admin_profiles',
    helper: 'helper_profiles',
    partner: 'partner_profiles',
  };
  const table = tableByRole[role];
  if (!table) return null;

  const { data } = await client
    .from(table as any)
    .select(role === 'customer' ? 'email, preferred_language' : 'email')
    .eq('id', recipientId)
    .maybeSingle();

  const profile = data as { email?: unknown; preferred_language?: unknown } | null;
  const email = profile?.email;
  if (typeof email !== 'string' || !email.includes('@')) return null;
  return { email, language: profile?.preferred_language === 'en' ? 'en' : 'ar' };
}

function notificationStatus(data: Json | null | undefined): string | null {
  if (!data || Array.isArray(data) || typeof data !== 'object') return null;
  const status = (data as Record<string, Json | undefined>).status;
  return typeof status === 'string' ? status : null;
}

async function buildConfirmedOrderEmail(
  client: DatabaseQueryClient,
  orderId: string,
  customerId: string,
  language: 'ar' | 'en',
) {
  const { data } = await client
    .from('orders')
    .select(`
      order_number, status, payment_status, payment_method, subtotal_syp, discount_syp,
      loyalty_discount_syp, shipping_syp, total_syp, loyalty_points_used,
      loyalty_points_earned, notes, address_snapshot, created_at,
      order_items(quantity, unit_price_syp, total_price_syp, product_snapshot)
    `)
    .eq('id', orderId)
    .eq('customer_id', customerId)
    .maybeSingle();
  if (!data) return null;

  const order = data as unknown as InvoiceOrder;
  const english = language === 'en';
  const direction = english ? 'ltr' : 'rtl';
  const locale = english ? 'en-US' : 'ar-SY';
  const address = order.address_snapshot ?? {};
  const addressText = [
    address.governorate,
    address.city,
    address.street,
    address.address,
    address.building,
    address.floor,
  ].filter(Boolean).map(String).join(english ? ', ' : '، ');
  const itemRows = order.order_items.map((item) => {
    const snapshot = item.product_snapshot ?? {};
    const name = english
      ? snapshot.name_en || snapshot.name_ar || snapshot.name || snapshot.sku
      : snapshot.name_ar || snapshot.name_en || snapshot.name || snapshot.sku;
    return `<tr>
      <td>${escapeHtml(String(name ?? '-'))}</td>
      <td>${Number(item.quantity).toLocaleString(locale)}</td>
      <td>${formatEmailMoney(item.unit_price_syp, locale)}</td>
      <td>${formatEmailMoney(item.total_price_syp, locale)}</td>
    </tr>`;
  }).join('');
  const configuredOrigin = process.env.PUBLIC_WEB_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim();
  const orderUrl = safeOrderUrl(configuredOrigin, order.order_number);
  const subject = english
    ? `Your order ${order.order_number} has been confirmed`
    : `تم تأكيد طلبك رقم ${order.order_number}`;
  const labels = english ? {
    heading: 'Your order is confirmed', order: 'Order', items: 'Items', quantity: 'Quantity',
    unit: 'Unit price', total: 'Total', delivery: 'Delivery address', payment: 'Payment method',
    cod: 'Cash on delivery', sham: 'Sham Cash', view: 'View order', invoice: 'Your PDF invoice is attached.',
  } : {
    heading: 'تم تأكيد طلبك', order: 'الطلب', items: 'المنتجات', quantity: 'الكمية',
    unit: 'سعر الوحدة', total: 'الإجمالي', delivery: 'عنوان التوصيل', payment: 'طريقة الدفع',
    cod: 'الدفع عند الاستلام', sham: 'شام كاش', view: 'عرض الطلب', invoice: 'أرفقنا فاتورة الطلب بصيغة PDF.',
  };
  const pdf = await createInvoicePdf(order);

  return {
    subject,
    html: `<div dir="${direction}" style="font-family:Arial,sans-serif;line-height:1.6;color:#1f1b16">
      <h1>${labels.heading}</h1>
      <p><strong>${labels.order}:</strong> ${escapeHtml(order.order_number)}</p>
      <table style="width:100%;border-collapse:collapse" border="1" cellpadding="8">
        <thead><tr><th>${labels.items}</th><th>${labels.quantity}</th><th>${labels.unit}</th><th>${labels.total}</th></tr></thead>
        <tbody>${itemRows}</tbody>
      </table>
      <p><strong>${labels.delivery}:</strong> ${escapeHtml(addressText || '-')}</p>
      <p><strong>${labels.payment}:</strong> ${order.payment_method === 'sham_cash' ? labels.sham : labels.cod}</p>
      <p><strong>${labels.total}:</strong> ${formatEmailMoney(order.total_syp, locale)}</p>
      <p>${labels.invoice}</p>
      ${orderUrl ? `<p><a href="${escapeHtml(orderUrl)}">${labels.view}</a></p>` : ''}
    </div>`,
    attachment: {
      filename: `invoice-${order.order_number.replace(/[^A-Za-z0-9_-]/g, '')}.pdf`,
      content: Buffer.from(pdf).toString('base64'),
    },
  };
}

function safeOrderUrl(origin: string | undefined, orderNumber: string): string | null {
  if (!origin) return null;
  try {
    const url = new URL(origin);
    if (!['https:', 'http:'].includes(url.protocol)) return null;
    url.pathname = `/orders/${encodeURIComponent(orderNumber)}`;
    url.search = '';
    url.hash = '';
    return url.toString();
  } catch {
    return null;
  }
}

function formatEmailMoney(value: unknown, locale: string): string {
  return `${Number(value || 0).toLocaleString(locale)} ${locale === 'en-US' ? 'SYP' : 'ل.س'}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
