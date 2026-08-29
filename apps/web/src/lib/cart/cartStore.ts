import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface CartItem {
  itemType?:       'variant' | 'bundle';
  variantId:       string;
  productId:       string;
  productSlug:     string;
  nameAr:          string;
  nameEn:          string;
  sku:             string;
  priceSyp:        number;
  comparePriceSyp: number | null;
  imageUrl:        string | null;
  maxQuantity?:    number;
  quantity:        number;
}

interface CartStore {
  items:      CartItem[];
  serverBacked: boolean;
  setServerBacked: (value: boolean) => void;
  addItem:    (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (variantId: string, itemType?: 'variant' | 'bundle') => void;
  updateQty:  (variantId: string, qty: number, itemType?: 'variant' | 'bundle') => void;
  clearCart:  () => void;
  totalItems: () => number;
  totalSyp:   () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      serverBacked: false,
      setServerBacked: (value) => set({ serverBacked: value }),

      addItem: (item) =>
        set((state) => {
          const itemType = item.itemType ?? 'variant';
          const existing = state.items.find((i) => i.variantId === item.variantId && (i.itemType ?? 'variant') === itemType);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.variantId === item.variantId && (i.itemType ?? 'variant') === itemType
                  ? { ...i, quantity: Math.min(i.maxQuantity ?? 99, 99, i.quantity + 1) }
                  : i
              ),
            };
          }
          return { items: [...state.items, { ...item, itemType, quantity: 1 }] };
        }),

      removeItem: (variantId, itemType = 'variant') =>
        set((state) => ({ items: state.items.filter((i) => i.variantId !== variantId || (i.itemType ?? 'variant') !== itemType) })),

      updateQty: (variantId, qty, itemType = 'variant') =>
        set((state) => {
          if (qty <= 0) return { items: state.items.filter((i) => i.variantId !== variantId || (i.itemType ?? 'variant') !== itemType) };
          return { items: state.items.map((i) => (
            i.variantId === variantId && (i.itemType ?? 'variant') === itemType
              ? { ...i, quantity: Math.min(i.maxQuantity ?? 99, 99, qty) }
              : i
          )) };
        }),

      clearCart:  () => set({ items: [] }),
      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      totalSyp:   () => get().items.reduce((sum, i) => sum + i.priceSyp * i.quantity, 0),
    }),
    {
      name: 'eurostore_guest_cart',
      version: 3,
      migrate: (persisted) => {
        const state = persisted as Partial<CartStore>;
        return {
          ...state,
          items: (state.items ?? []).map((item) => ({ ...item, itemType: item.itemType ?? 'variant' })),
        } as CartStore;
      },
      storage: createJSONStorage(() => ({
        getItem: (name) => sessionStorage.getItem(name),
        setItem: (name, value) => {
          try {
            const persisted = JSON.parse(value) as { state?: { serverBacked?: boolean } };
            if (persisted.state?.serverBacked) {
              sessionStorage.removeItem(name);
              return;
            }
          } catch {
            sessionStorage.removeItem(name);
            return;
          }
          sessionStorage.setItem(name, value);
        },
        removeItem: (name) => sessionStorage.removeItem(name),
      })),
    }
  )
);
