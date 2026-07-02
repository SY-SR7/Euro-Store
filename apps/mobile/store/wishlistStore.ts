import { create } from 'zustand';

export interface WishlistItem {
  productId: string;
  title: string;
  price: number;
  imageUrl: string;
}

interface WishlistStore {
  items: WishlistItem[];
  addItem: (item: WishlistItem) => void;
  removeItem: (productId: string) => void;
  hasItem: (productId: string) => boolean;
}

export const useWishlistStore = create<WishlistStore>((set, get) => ({
  items: [],
  addItem: (item) => set((state) => {
    if (state.items.find((i) => i.productId === item.productId)) return state;
    return { items: [...state.items, item] };
  }),
  removeItem: (productId) => set((state) => ({
    items: state.items.filter((i) => i.productId !== productId)
  })),
  hasItem: (productId) => {
    return !!get().items.find((i) => i.productId === productId);
  }
}));

