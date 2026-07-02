import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface RecentProduct {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  priceSyp: number;
  imageUrl: string | null;
  brandName?: string | null;
  viewedAt: number;
}

interface RecentStore {
  items: RecentProduct[];
  addRecent: (product: Omit<RecentProduct, 'viewedAt'>) => void;
  clearRecent: () => void;
}

export const useRecentStore = create<RecentStore>()(
  persist(
    (set) => ({
      items: [],
      addRecent: (product) =>
        set((state) => {
          // Remove if it already exists to move it to the top
          const filtered = state.items.filter((p) => p.id !== product.id);
          const newItem = { ...product, viewedAt: Date.now() };
          // Keep only the last 12 items
          const newItems = [newItem, ...filtered].slice(0, 12);
          return { items: newItems };
        }),
      clearRecent: () => set({ items: [] }),
    }),
    { name: 'eurostore-recent', version: 1 }
  )
);

