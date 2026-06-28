import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CartItem } from './cartUtils';

interface CartState {
  items: CartItem[];
  loading: boolean;
  setLoading: (loading: boolean) => void;
  addItem: (item: CartItem) => void;
  removeItem: (variantId: string) => void;
  updateQty: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  mergeWithServer: (serverItems: CartItem[]) => void;
}

const storage = createJSONStorage(() => localStorage, {
  reviver: (key, value) => {
    // Deserialize bigint strings (which we save as an object or just detect string if needed)
    if (typeof value === 'object' && value !== null && (value as any).__type === 'bigint') {
      return BigInt((value as any).value);
    }
    return value;
  },
  replacer: (key, value) => {
    if (typeof value === 'bigint') {
      return { __type: 'bigint', value: value.toString() };
    }
    return value;
  },
});

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      loading: false,

      setLoading: (loading) => set({ loading }),

      addItem: (item) =>
        set((state) => {
          const existing = state.items.find((i) => i.variantId === item.variantId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.variantId === item.variantId
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              ),
            };
          }
          return { items: [...state.items, item] };
        }),

      removeItem: (variantId) =>
        set((state) => ({
          items: state.items.filter((i) => i.variantId !== variantId),
        })),

      updateQty: (variantId, quantity) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.variantId === variantId ? { ...i, quantity } : i
          ),
        })),

      clearCart: () => set({ items: [] }),

      mergeWithServer: (serverItems) =>
        set(() => ({
          items: serverItems,
        })),
    }),
    {
      name: 'eurostore_guest_cart',
      storage,
    }
  )
);
