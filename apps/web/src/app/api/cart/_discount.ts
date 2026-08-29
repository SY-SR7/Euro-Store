import type { createAdminSupabaseClient } from '@/supabase-server';
import type { requireCustomer } from './_lib';
import type { Database } from '@eurostore/database';

type CustomerContext = NonNullable<Awaited<ReturnType<typeof requireCustomer>>>;
type AdminClient = ReturnType<typeof createAdminSupabaseClient>;
type Discount = Database['public']['Tables']['discount_codes']['Row'];

type DiscountValidationResult =
  | {
      ok: true;
      discount: Discount;
      discountAmount: number;
      subtotal: number;
    }
  | {
      ok: false;
      error: string;
      status: number;
      details?: Record<string, unknown>;
    };

async function getCartContext(admin: AdminClient, customerId: string) {
  const { data, error } = await admin
    .from('cart_items')
    .select('quantity, product_variant_id, product_variants(price_syp, product_id, products(category_id))')
    .eq('customer_id', customerId);

  if (error) throw error;

  const rows = data ?? [];
  const subtotal = rows.reduce((sum, item) => {
    return sum + Number(item.quantity ?? 0) * Number(item.product_variants?.price_syp ?? 0);
  }, 0);
  const productIds = new Set(
    rows
      .map((item) => item.product_variants?.product_id)
      .filter(Boolean)
      .map(String),
  );
  const categoryIds = new Set(
    rows
      .map((item) => item.product_variants?.products?.category_id)
      .filter(Boolean)
      .map(String),
  );

  return { subtotal, productIds, categoryIds };
}

export async function validateDiscountForCustomerCart(
  ctx: CustomerContext,
  rawCode: string,
): Promise<DiscountValidationResult> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return { ok: false, error: 'no_code', status: 400 };

  const [{ subtotal, productIds, categoryIds }, { data: discount }] = await Promise.all([
    getCartContext(ctx.admin, ctx.user.id),
    ctx.admin
      .from('discount_codes')
      .select('*')
      .eq('code', code)
      .maybeSingle(),
  ]);

  if (!discount) return { ok: false, error: 'invalid_code', status: 404 };
  if (!discount.is_active) return { ok: false, error: 'inactive', status: 422 };

  const now = new Date();
  const validFrom = discount.valid_from;
  const validUntil = discount.valid_until;
  const minCart = Number(discount.min_cart_value ?? discount.min_order_syp ?? 0);
  const maxUses = Number(discount.max_uses_total ?? discount.max_uses ?? 0);
  const usesCount = Number(discount.uses_count ?? discount.used_count ?? 0);
  const maxUsesPerUser = Number(discount.max_uses_per_user ?? 0);
  const eligibility = discount.eligibility;
  const scope = discount.scope;

  if (validFrom && now < new Date(validFrom)) return { ok: false, error: 'not_started', status: 422 };
  if (validUntil && now > new Date(validUntil)) return { ok: false, error: 'expired', status: 422 };
  if (eligibility === 'first_time_buyers') {
    const { count } = await ctx.admin
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('customer_id', ctx.user.id)
      .eq('status', 'completed');
    if ((count ?? 0) > 0) return { ok: false, error: 'first_time_buyers_only', status: 422 };
  }
  if (minCart && subtotal < minCart) {
    return { ok: false, error: 'min_cart_value', status: 422, details: { min_cart_value: minCart } };
  }

  const discountProductIds = new Set((discount.product_ids ?? []).map(String));
  const discountCategoryIds = new Set((discount.category_ids ?? []).map(String));
  const scopeMatches = scope === 'entire_store'
    || (scope === 'products' && [...productIds].some((id) => discountProductIds.has(id)))
    || (scope === 'categories' && [...categoryIds].some((id) => discountCategoryIds.has(id)));

  if (!scopeMatches) return { ok: false, error: 'scope_mismatch', status: 422 };
  if (maxUses && usesCount >= maxUses) return { ok: false, error: 'usage_limit_reached', status: 422 };
  if (maxUsesPerUser > 0) {
    const { count } = await ctx.admin
      .from('discount_code_usages')
      .select('id', { count: 'exact', head: true })
      .eq('customer_id', ctx.user.id)
      .eq('discount_code_id', discount.id);
    if ((count ?? 0) >= maxUsesPerUser) return { ok: false, error: 'user_usage_limit_reached', status: 422 };
  }

  const type = discount.type;
  const value = Number(discount.value);
  const rawAmount = type === 'percentage' ? Math.floor(subtotal * value / 100) : value;

  return {
    ok: true,
    discount,
    discountAmount: Math.min(Math.max(0, rawAmount), subtotal),
    subtotal,
  };
}
