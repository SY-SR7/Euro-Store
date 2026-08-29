import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface WishlistItem {
  productId: string;
  variantId: string;
  title: string;
  price: number;
  imageUrl: string;
  maxQuantity: number;
}

interface WishlistStore {
  items: WishlistItem[];
  addItem: (item: WishlistItem) => void;
  removeItem: (productId: string) => void;
  hasItem: (productId: string) => boolean;
  replaceItems: (items: WishlistItem[]) => void;
  clearItems: () => void;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => set((state) => {
        if (state.items.find((i) => i.productId === item.productId)) return state;
        return { items: [...state.items, item] };
      }),
      removeItem: (productId) => set((state) => ({
        items: state.items.filter((i) => i.productId !== productId)
      })),
      hasItem: (productId) => !!get().items.find((i) => i.productId === productId),
      replaceItems: (items) => set({ items }),
      clearItems: () => set({ items: [] }),
    }),
    {
      name: 'eurostore-wishlist',
      storage: createJSONStorage(() => AsyncStorage),
      version: 2,
      migrate: (persisted, version) => version < 2 ? { items: [] } : persisted as WishlistStore,
    },
  ),
);

