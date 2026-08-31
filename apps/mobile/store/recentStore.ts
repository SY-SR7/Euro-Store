import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { ProductCardProps } from '../components/ProductCard';

type RecentState = {
  items: ProductCardProps[];
  remember: (item: ProductCardProps) => void;
};

export const useRecentStore = create<RecentState>()(
  persist(
    (set) => ({
      items: [],
      remember: (item) => set((state) => ({ items: [item, ...state.items.filter((current) => current.id !== item.id)].slice(0, 8) })),
    }),
    { name: 'eurostore-recent-products', storage: createJSONStorage(() => AsyncStorage), version: 1 },
  ),
);
