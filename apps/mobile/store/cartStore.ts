import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type CartItem = {
  id: string;
  itemType: 'variant' | 'bundle';
  itemId: string;
  productId: string;
  variantId: string;
  title: string;
  nameAr?: string;
  nameEn?: string;
  sku?: string;
  price: number;
  quantity: number;
  imageUrl: string;
  maxQuantity: number;
};

type CartState = {
  items: CartItem[];
  ownerId: string | null;
  hasHydrated: boolean;
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  resetCart: () => void;
  replaceItems: (items: CartItem[], ownerId: string | null) => void;
  setHasHydrated: (value: boolean) => void;
  totalPrice: () => number;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      ownerId: null,
      hasHydrated: false,
      addItem: (item) => set((state) => {
        const existing = state.items.find((i) => i.itemType === item.itemType && i.itemId === item.itemId);
        if (existing) {
          return {
            items: state.items.map((i) =>
              i.itemType === item.itemType && i.itemId === item.itemId
                ? { ...i, quantity: Math.min(i.maxQuantity, i.quantity + item.quantity) }
                : i
            ),
          };
        }
        return { items: [...state.items, { ...item, id: `${item.itemType}:${item.itemId}` }] };
      }),
      removeItem: (id) => set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
      updateQuantity: (id, quantity) =>
        set((state) => ({
          items: state.items.map((i) => (
            i.id === id ? { ...i, quantity: Math.max(1, Math.min(i.maxQuantity, quantity)) } : i
          )),
        })),
      clearCart: () => set({ items: [] }),
      resetCart: () => set({ items: [], ownerId: null }),
      replaceItems: (items, ownerId) => set({ items, ownerId }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      totalPrice: () => get().items.reduce((total, item) => total + item.price * item.quantity, 0),
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => AsyncStorage),
      version: 3,
      migrate: (persisted, version) => {
        const state = persisted as { items?: CartItem[]; ownerId?: string | null };
        if (version < 3) {
          return {
            ...state,
            items: (state.items ?? []).map((item) => ({
              ...item,
              id: `variant:${item.variantId}`,
              itemType: 'variant' as const,
              itemId: item.variantId,
            })),
          };
        }
        return persisted as CartState;
      },
      partialize: (state) => ({ items: state.items, ownerId: state.ownerId }),
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
    }
  )
);

