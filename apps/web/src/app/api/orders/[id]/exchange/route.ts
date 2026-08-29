import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createInAppNotification } from '@eurostore/database';
import { hasExpectedFileSignature } from '@eurostore/shared';
import { createAdminSupabaseClient, getSessionClient } from '@/supabase-server';

const IMAGE_POLICIES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
} as const;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const fieldsSchema = z.object({
  order_item_id: z.string().uuid(),
  reason: z.string().trim().min(2).max(2000),
  customer_whatsapp: z.string().trim().min(7).max(30),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user } = await getSessionClient();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!(request.headers.get('content-type') ?? '').includes('multipart/form-data')) {
    return NextResponse.json({ error: 'multipart_required' }, { status: 415 });
  }

  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: 'invalid_form_data' }, { status: 400 });
  const parsed = fieldsSchema.safeParse({
    order_item_id: form.get('order_item_id'),
    reason: form.get('reason') ?? form.get('reason_ar'),
    customer_whatsapp: form.get('customer_whatsapp'),
  });
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });

  const admin = createAdminSupabaseClient();
  let orderQuery = admin.from('orders').select('id, customer_id, status, order_number, created_at, updated_at').eq('customer_id', user.id);
  orderQuery = z.string().uuid().safeParse((await params).id).success ? orderQuery.eq('id', (await params).id) : orderQuery.eq('order_number', (await params).id);
  const { data: order, error: orderError } = await orderQuery.maybeSingle();
  if (orderError) return NextResponse.json({ error: 'database_error' }, { status: 500 });
  if (!order) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (!order.status || !['delivered', 'completed'].includes(order.status)) return NextResponse.json({ error: 'exchange_not_eligible' }, { status: 422 });

  const [{ data: settingsRows }, { data: orderItem }, { data: statusHistory }] = await Promise.all([
    admin.from('system_settings').select('key, value').in('key', ['exchange_window_days', 'max_exchange_days', 'exchange_per_order_limit', 'exchange_proof_photo_limit']),
    admin.from('order_items').select('id, order_id').eq('id', parsed.data.order_item_id).eq('order_id', order.id).maybeSingle(),
    admin.from('order_status_history').select('created_at, to_status').eq('order_id', order.id).in('to_status', ['delivered', 'completed']).order('created_at', { ascending: false }).limit(1),
  ]);
  if (!orderItem) return NextResponse.json({ error: 'order_item_not_found' }, { status: 404 });

  const settings = Object.fromEntries((settingsRows ?? []).map((row) => [row.key, Number(row.value)]));
  const exchangeWindowDays = Number.isFinite(settings.exchange_window_days) ? settings.exchange_window_days : Number.isFinite(settings.max_exchange_days) ? settings.max_exchange_days : 7;
  const perOrderLimit = Number.isFinite(settings.exchange_per_order_limit) ? Math.max(1, settings.exchange_per_order_limit) : 1;
  const photoLimit = Number.isFinite(settings.exchange_proof_photo_limit) ? Math.min(10, Math.max(1, settings.exchange_proof_photo_limit)) : 3;
  const deliveredAtValue = statusHistory?.[0]?.created_at ?? order.updated_at ?? order.created_at;
  if (!deliveredAtValue) return NextResponse.json({ error: 'order_date_missing' }, { status: 409 });
  const deliveredAt = new Date(deliveredAtValue).getTime();
  if (Date.now() - deliveredAt > Math.max(0, exchangeWindowDays) * 24 * 60 * 60 * 1000) {
    return NextResponse.json({ error: 'exchange_window_expired', exchange_window_days: exchangeWindowDays }, { status: 422 });
  }

  const { count: existingCount, error: countError } = await admin.from('exchange_requests').select('id', { count: 'exact', head: true }).eq('order_id', order.id).neq('status', 'rejected');
  if (countError) return NextResponse.json({ error: 'database_error' }, { status: 500 });
  if ((existingCount ?? 0) >= perOrderLimit) return NextResponse.json({ error: 'exchange_limit_reached' }, { status: 409 });

  const files = form.getAll('images').filter((value): value is File => value instanceof File);
  if (files.length < 1 || files.length > photoLimit) return NextResponse.json({ error: 'invalid_image_count', photo_limit: photoLimit }, { status: 422 });
  for (const file of files) {
    if (!(file.type in IMAGE_POLICIES)) return NextResponse.json({ error: 'invalid_image_type' }, { status: 422 });
    if (file.size > MAX_IMAGE_SIZE) return NextResponse.json({ error: 'image_too_large' }, { status: 422 });
    if (!(await hasExpectedFileSignature(file, file.type))) return NextResponse.json({ error: 'image_signature_mismatch' }, { status: 422 });
  }

  const uploadedPaths: string[] = [];
  const imageObjectKeys: string[] = [];
  for (const file of files) {
    const extension = IMAGE_POLICIES[file.type as keyof typeof IMAGE_POLICIES];
    const storagePath = `${user.id}/${order.id}/${crypto.randomUUID()}.${extension}`;
    const { data: uploaded, error } = await admin.storage.from('exchange-images').upload(storagePath, file, { contentType: file.type, upsert: false });
    if (error || !uploaded) {
      if (uploadedPaths.length) await admin.storage.from('exchange-images').remove(uploadedPaths);
      return NextResponse.json({ error: 'image_upload_failed' }, { status: 500 });
    }
    uploadedPaths.push(uploaded.path);
    imageObjectKeys.push(`exchange-images/${uploaded.path}`);
  }

  const { data: exchange, error: exchangeError } = await admin.from('exchange_requests').insert({
    order_id: order.id,
    order_item_id: orderItem.id,
    customer_id: user.id,
    reason: parsed.data.reason,
    reason_ar: parsed.data.reason,
    reason_en: parsed.data.reason,
    customer_whatsapp: parsed.data.customer_whatsapp,
    status: 'pending',
  }).select('*').single();
  if (exchangeError || !exchange) {
    await admin.storage.from('exchange-images').remove(uploadedPaths);
    return NextResponse.json({ error: 'database_error' }, { status: 500 });
  }

  const { error: imagesError } = await admin.from('exchange_request_images').insert(imageObjectKeys.map((url) => ({ exchange_request_id: exchange.id, url })));
  if (imagesError) {
    await Promise.all([admin.from('exchange_requests').delete().eq('id', exchange.id), admin.storage.from('exchange-images').remove(uploadedPaths)]);
    return NextResponse.json({ error: 'database_error' }, { status: 500 });
  }

  const [admins, helpers] = await Promise.all([
    admin.from('admin_profiles').select('id').eq('is_active', true),
    admin.from('helper_profiles').select('id').eq('is_active', true),
  ]);
  await Promise.all([
    ...(admins.data ?? []).map((recipient) => createInAppNotification(admin, {
      recipientId: recipient.id, recipientRole: 'admin', type: 'exchange_update', titleAr: 'طلب استبدال جديد', titleEn: 'New exchange request', bodyAr: `طلب جديد للطلب ${order.order_number}`, bodyEn: `New request for order ${order.order_number}`, referenceId: exchange.id, referenceType: 'exchange', data: { order_id: order.id },
    })),
    ...(helpers.data ?? []).map((recipient) => createInAppNotification(admin, {
      recipientId: recipient.id, recipientRole: 'helper', type: 'exchange_update', titleAr: 'طلب استبدال جديد', titleEn: 'New exchange request', bodyAr: `طلب جديد للطلب ${order.order_number}`, bodyEn: `New request for order ${order.order_number}`, referenceId: exchange.id, referenceType: 'exchange', data: { order_id: order.id },
    })),
  ]);

  return NextResponse.json({ exchange_request: exchange }, { status: 201 });
}
