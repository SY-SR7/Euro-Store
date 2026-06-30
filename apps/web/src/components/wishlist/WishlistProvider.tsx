'use client';
/* eslint-disable */
import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';

type WishlistContextValue = {
  ids: Set<string>;
  loading: boolean;
  loggedIn: boolean;
  toggle: (productId: string) => Promise<void>;
};

const WishlistContext = createContext<WishlistContextValue>({
  ids: new Set(),
  loading: true,
  loggedIn: false,
  toggle: async () => {},
});

export function useWishlist() {
  return useContext(WishlistContext);
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/wishlist');
      const data = await res.json();
      setLoggedIn(!!data.authenticated);
      setIds(new Set((data.items ?? []).map((i: any) => i.product_id)));
    } catch {
      setLoggedIn(false);
      setIds(new Set());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggle = useCallback(async (productId: string) => {
    if (!loggedIn) {
      window.location.href = '/auth/login?next=' + encodeURIComponent(window.location.pathname);
      return;
    }
    // Optimistic update
    setIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
    try {
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId }),
      });
      if (!res.ok) throw new Error('failed');
      const data = await res.json();
      setIds((prev) => {
        const next = new Set(prev);
        if (data.in_wishlist) next.add(productId);
        else next.delete(productId);
        return next;
      });
    } catch {
      // Rollback on failure
      setIds((prev) => {
        const next = new Set(prev);
        if (next.has(productId)) next.delete(productId);
        else next.add(productId);
        return next;
      });
    }
  }, [loggedIn]);

  return (
    <WishlistContext.Provider value={{ ids, loading, loggedIn, toggle }}>
      {children}
    </WishlistContext.Provider>
  );
}
