import type { CartItem } from './cartStore';

export interface CartOrderItem {
  variant_id:  string;
  item_type:   'variant' | 'bundle';
  quantity:    number;
  unit_price:  number;
  total_price: number;
}

export function cartItemsToOrderPayload(items: CartItem[]): CartOrderItem[] {
  return items.map((i) => ({
    variant_id:  i.variantId,
    item_type:   i.itemType ?? 'variant',
    quantity:    i.quantity,
    unit_price:  i.priceSyp,
    total_price: i.priceSyp * i.quantity,
  }));
}

export function getCartSubtotal(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.priceSyp * i.quantity, 0);
}
