import { randomBytes } from 'node:crypto';
import { createRequire } from 'node:module';

const requireFromWeb = createRequire(new URL('../apps/web/package.json', import.meta.url));
const { createClient } = requireFromWeb('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const baseUrl = (process.env.E2E_BASE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
if (!supabaseUrl || !anonKey || !serviceKey) throw new Error('Missing E2E Supabase credentials.');

const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
const anonymous = createClient(supabaseUrl, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
const marker = Date.now().toString(36);
const email = `codex-e2e-${marker}@eurostore.invalid`;
const password = `E2E!${randomBytes(18).toString('base64url')}aA1`;
const checks = [];
let userId = null;
let orderId = null;
let addressId = null;

function check(name, condition, details = {}) {
  checks.push({ name, ok: Boolean(condition), ...details });
  if (!condition) throw new Error(`check_failed:${name}:${JSON.stringify(details)}`);
}

async function request(path, options = {}, token = null) {
  const headers = { ...(options.body && !(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${baseUrl}${path}`, { ...options, headers });
  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json().catch(() => null) : await response.arrayBuffer();
  return { response, payload, contentType };
}

async function cleanup() {
  if (!userId) return;
  if (orderId) {
    await admin.from('discount_code_usages').delete().eq('order_id', orderId);
    await admin.from('order_status_history').delete().eq('order_id', orderId);
    await admin.from('order_items').delete().eq('order_id', orderId);
    await admin.from('orders').delete().eq('id', orderId);
  }
  await admin.from('notifications').delete().eq('recipient_id', userId);
  await admin.from('notify_me_subscriptions').delete().eq('customer_id', userId);
  await admin.from('wishlist_items').delete().eq('customer_id', userId);
  await admin.from('cart_items').delete().eq('customer_id', userId);
  await admin.from('cart_bundle_items').delete().eq('customer_id', userId);
  await admin.from('customer_addresses').delete().eq('customer_id', userId);
  await admin.from('loyalty_transactions').delete().eq('customer_id', userId);
  await admin.from('referrals').delete().or(`referrer_id.eq.${userId},referred_id.eq.${userId}`);
  await admin.from('customer_profiles').delete().eq('id', userId);
  await admin.storage.from('loyalty-qr-codes').remove([`${userId}/loyalty-qr.png`]);
  await admin.auth.admin.deleteUser(userId);
}

try {
  const health = await request('/api/products?per_page=1');
  check('public_catalog_available', health.response.status === 200, { status: health.response.status });

  const unauthorized = await request('/api/cart');
  check('cart_rejects_anonymous', unauthorized.response.status === 401, { status: unauthorized.response.status });

  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: 'Codex E2E Customer', role: 'customer' } });
  if (created.error || !created.data.user) throw created.error || new Error('user_not_created');
  userId = created.data.user.id;

  const registered = await admin.rpc('register_customer_profile', {
    p_customer_id: userId,
    p_full_name: 'Codex E2E Customer',
    p_email: email,
    p_phone: '0999999999',
    p_preferred_language: 'en',
  });
  if (registered.error) throw registered.error;

  const signedIn = await anonymous.auth.signInWithPassword({ email, password });
  if (signedIn.error || !signedIn.data.session) throw signedIn.error || new Error('session_not_created');
  const token = signedIn.data.session.access_token;

  const me = await request('/api/auth/me', {}, token);
  check('authenticated_profile', me.response.status === 200 && me.payload?.profile?.id === userId, { status: me.response.status });

  const variantResult = await admin.from('product_variants').select('id,product_id,stock_quantity,is_active,products!inner(status,is_active)').eq('is_active', true).gt('stock_quantity', 1).limit(10);
  if (variantResult.error) throw variantResult.error;
  const variant = (variantResult.data || []).find((row) => row.products?.status === 'published' && row.products?.is_active);
  if (!variant) throw new Error('no_safe_variant_for_e2e');
  const initialStock = Number(variant.stock_quantity);

  const addressCreate = await request('/api/addresses', { method: 'POST', body: JSON.stringify({ label: 'E2E', full_name: 'Codex E2E Customer', phone: '0999999999', governorate: 'damascus', city: 'Damascus', street: 'E2E isolated address', is_default: true }) }, token);
  addressId = addressCreate.payload?.id || addressCreate.payload?.address?.id || null;
  check('address_created', addressCreate.response.status === 201 || addressCreate.response.status === 200, { status: addressCreate.response.status });

  const cartWrite = await request('/api/cart', { method: 'POST', body: JSON.stringify({ cart: [{ itemType: 'variant', itemId: variant.id, quantity: 1 }] }) }, token);
  check('cart_written', cartWrite.response.status === 200, { status: cartWrite.response.status });
  const cartRead = await request('/api/cart', {}, token);
  check('cart_round_trip', cartRead.response.status === 200 && cartRead.payload?.cart?.some((item) => item.itemId === variant.id && item.quantity === 1), { status: cartRead.response.status });

  const orderBody = {
    address_snapshot: { full_name: 'Codex E2E Customer', phone: '0999999999', governorate: 'damascus', address: 'Damascus - E2E isolated address' },
    items: [{ variant_id: variant.id, item_type: 'variant', quantity: 1 }],
    loyalty_points_to_use: 0,
  };
  const shamCash = await request('/api/orders', { method: 'POST', body: JSON.stringify({ ...orderBody, payment_method: 'sham_cash' }) }, token);
  check('sham_cash_fails_closed', shamCash.response.status === 503 && shamCash.payload?.error === 'payment_method_unavailable', { status: shamCash.response.status });

  const idempotencyKey = `codex-e2e-${marker}`;
  const placed = await request('/api/orders', { method: 'POST', headers: { 'Idempotency-Key': idempotencyKey }, body: JSON.stringify({ ...orderBody, payment_method: 'cod' }) }, token);
  orderId = placed.payload?.order?.id || null;
  check('cod_order_placed', [200, 201].includes(placed.response.status) && Boolean(orderId), { status: placed.response.status, error: placed.payload?.error ?? null });

  const repeated = await request('/api/orders', { method: 'POST', headers: { 'Idempotency-Key': idempotencyKey }, body: JSON.stringify({ ...orderBody, payment_method: 'cod' }) }, token);
  check('order_idempotency', repeated.response.status === 200 && repeated.payload?.order?.id === orderId && repeated.payload?.idempotent === true, { status: repeated.response.status });

  const afterOrder = await admin.from('product_variants').select('stock_quantity').eq('id', variant.id).single();
  check('stock_decremented_once', Number(afterOrder.data?.stock_quantity) === initialStock - 1);

  const invoice = await request(`/api/orders/${orderId}/invoice`, {}, token);
  check('invoice_pdf_generated', invoice.response.status === 200 && invoice.contentType.includes('application/pdf') && invoice.payload.byteLength > 500, { status: invoice.response.status });

  const cancelled = await request(`/api/orders/${orderId}/cancel`, { method: 'POST' }, token);
  check('pending_order_cancelled', cancelled.response.status === 200, { status: cancelled.response.status });
  const [cancelledOrder, restoredVariant] = await Promise.all([
    admin.from('orders').select('status').eq('id', orderId).single(),
    admin.from('product_variants').select('stock_quantity').eq('id', variant.id).single(),
  ]);
  check('cancel_status_persisted', cancelledOrder.data?.status === 'cancelled');
  check('stock_restored', Number(restoredVariant.data?.stock_quantity) === initialStock);

  console.log(JSON.stringify({ passed: checks.length, failed: 0, cleanupPlanned: true, checks }, null, 2));
} finally {
  await cleanup();
  if (userId) {
    const profileCheck = await admin.from('customer_profiles').select('id').eq('id', userId).maybeSingle();
    const authCheck = await admin.auth.admin.getUserById(userId);
    console.log(JSON.stringify({ cleanup: { profileRemoved: !profileCheck.data, authUserRemoved: !authCheck.data?.user }, addressIdWasCreated: Boolean(addressId) }, null, 2));
  }
}
