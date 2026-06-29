import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  variantId:       string;
  productId:       string;
  productSlug:     string;
  nameAr:          string;
  nameEn:          string;
  sku:             string;
  priceSyp:        number;
  comparePriceSyp: number | null;
  imageUrl:        string | null;
  quantity:        number;
}

interface CartStore {
  items:      CartItem[];
  addItem:    (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (variantId: string) => void;
  updateQty:  (variantId: string, qty: number) => void;
  clearCart:  () => void;
  totalItems: () => number;
  totalSyp:   () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) =>
        set((state) => {
          const existing = state.items.find((i) => i.variantId === item.variantId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.variantId === item.variantId ? { ...i, quantity: i.quantity + 1 } : i
              ),
            };
          }
          return { items: [...state.items, { ...item, quantity: 1 }] };
        }),

      removeItem: (variantId) =>
        set((state) => ({ items: state.items.filter((i) => i.variantId !== variantId) })),

      updateQty: (variantId, qty) =>
        set((state) => {
          if (qty <= 0) return { items: state.items.filter((i) => i.variantId !== variantId) };
          return { items: state.items.map((i) => (i.variantId === variantId ? { ...i, quantity: qty } : i)) };
        }),

      clearCart:  () => set({ items: [] }),
      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      totalSyp:   () => get().items.reduce((sum, i) => sum + i.priceSyp * i.quantity, 0),
    }),
    { name: 'eurostore-cart', version: 1 }
  )
);
