export interface CartItem {
  variantId: string;
  sku: string;
  name_ar: string;
  name_en: string;
  price_syp: bigint;
  quantity: number;
  imageUrl?: string;
}

export interface DiscountCode {
  id: string;
  code: string;
  discount_percentage: number | null;
  discount_amount_syp: bigint | null;
}

export function calculateSubtotal(items: CartItem[]): bigint {
  return items.reduce((acc, item) => {
    return acc + (item.price_syp * BigInt(item.quantity));
  }, BigInt(0));
}

export function applyDiscount(subtotal: bigint, code: DiscountCode): bigint {
  if (code.discount_amount_syp !== null) {
    return code.discount_amount_syp;
  }
  if (code.discount_percentage !== null) {
    return (subtotal * BigInt(code.discount_percentage)) / BigInt(100);
  }
  return BigInt(0);
}

export function calculateLoyaltyDiscount(points: number): bigint {
  // 100 pts = 500 SYP => 1 pt = 5 SYP
  return BigInt(points) * BigInt(5);
}

export function calculateShipping(
  governorate: string,
  subtotal: bigint,
  shippingRates: { governorate: string; base_rate_syp: bigint; free_shipping_threshold_syp: bigint | null }[]
): bigint {
  const rate = shippingRates.find((r) => r.governorate === governorate);
  if (!rate) return BigInt(0);

  if (rate.free_shipping_threshold_syp !== null && subtotal >= rate.free_shipping_threshold_syp) {
    return BigInt(0);
  }

  return rate.base_rate_syp;
}
