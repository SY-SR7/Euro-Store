import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../utils/supabase';
import { registerPushNotifications } from '../utils/pushNotifications';
import { useCartStore, type CartItem } from '../store/cartStore';
import { apiFetch } from '../utils/api';
import { usePreferences } from './PreferencesContext';

type ServerCartItem = {
  itemType: 'variant' | 'bundle';
  itemId: string;
  variantId: string;
  productId: string;
  nameAr: string;
  nameEn: string;
  priceSyp: number;
  imageUrl: string | null;
  maxQuantity: number;
  quantity: number;
};

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  refreshCart: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({ user: null, session: null, isLoading: true, refreshCart: async () => undefined });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const cartItems = useCartStore((state) => state.items);
  const cartOwnerId = useCartStore((state) => state.ownerId);
  const cartHydrated = useCartStore((state) => state.hasHydrated);
  const replaceCartItems = useCartStore((state) => state.replaceItems);
  const cartSyncReady = useRef<string | null>(null);
  const { isAr } = usePreferences();

  const refreshCart = useCallback(async () => {
    const userId = session?.user?.id;
    if (!userId) return;
    const result = await apiFetch<{ cart: ServerCartItem[] }>('/api/cart');
    const normalized: CartItem[] = result.cart.map((item) => ({
      id: `${item.itemType}:${item.itemId}`,
      itemType: item.itemType,
      itemId: item.itemId,
      productId: item.productId,
      variantId: item.variantId,
      title: (isAr ? item.nameAr : item.nameEn) || item.nameAr || item.nameEn,
      price: Number(item.priceSyp),
      quantity: Number(item.quantity),
      imageUrl: item.imageUrl ?? '',
      maxQuantity: Number(item.maxQuantity),
    }));
    replaceCartItems(normalized, userId);
    cartSyncReady.current = userId;
  }, [isAr, replaceCartItems, session?.user?.id]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user) void registerPushNotifications().catch(() => undefined);
  }, [session?.user?.id]);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId || !cartHydrated) { cartSyncReady.current = null; return; }
    let cancelled = false;
    const synchronize = async () => {
      try {
        if (cartOwnerId === null && cartItems.length) {
          await apiFetch('/api/cart/merge', { method: 'POST', body: JSON.stringify({ items: cartItems.map((item) => ({ itemType: item.itemType, itemId: item.itemId, quantity: item.quantity })) }) });
        }
        if (cancelled) return;
        await refreshCart();
      } catch {
        cartSyncReady.current = null;
      }
    };
    void synchronize();
    return () => { cancelled = true; };
  }, [cartHydrated, refreshCart, session?.user?.id]);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId || cartSyncReady.current !== userId || cartOwnerId !== userId) return;
    const timer = setTimeout(() => {
      void apiFetch('/api/cart', {
        method: 'POST',
        body: JSON.stringify({ cart: cartItems.map((item) => ({ itemType: item.itemType, itemId: item.itemId, quantity: item.quantity })) }),
      }).catch(() => undefined);
    }, 350);
    return () => clearTimeout(timer);
  }, [cartItems, cartOwnerId, session?.user?.id]);

  return (
    <AuthContext.Provider value={{ user, session, isLoading, refreshCart }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

