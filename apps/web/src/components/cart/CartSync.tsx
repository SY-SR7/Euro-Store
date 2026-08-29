'use client';
import { useEffect, useRef } from 'react';
import { useCartStore } from '@/lib/cart/cartStore';
import type { CartItem } from '@/lib/cart/cartStore';

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const item = value as Record<string, unknown>;
  return typeof item.variantId === 'string'
    && typeof item.productId === 'string'
    && typeof item.productSlug === 'string'
    && typeof item.nameAr === 'string'
    && typeof item.nameEn === 'string'
    && typeof item.sku === 'string'
    && typeof item.priceSyp === 'number'
    && typeof item.quantity === 'number';
}

export function CartSync({ isAuthenticated }: { isAuthenticated: boolean }) {
  const items = useCartStore((state) => state.items);
  const syncTimeout = useRef<NodeJS.Timeout | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) {
      if (useCartStore.getState().serverBacked) {
        useCartStore.setState({ items: [], serverBacked: false });
      }
      return;
    }

    const fetchCart = async () => {
      try {
        if (!useCartStore.persist.hasHydrated()) {
          await new Promise<void>((resolve) => {
            const unsubscribe = useCartStore.persist.onFinishHydration(() => {
              unsubscribe();
              resolve();
            });
          });
        }

        const guestItems = useCartStore.getState().items;
        useCartStore.getState().setServerBacked(true);
        if (guestItems.length > 0) {
          await fetch('/api/cart/merge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              items: guestItems.map((item) => ({
                itemType: item.itemType ?? 'variant',
                itemId: item.variantId,
                quantity: item.quantity,
              })),
            }),
          });
        }

        const res = await fetch('/api/cart');
        if (res.ok) {
          const payload: unknown = await res.json();
          if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
            const cart = (payload as Record<string, unknown>).cart;
            if (Array.isArray(cart)) useCartStore.setState({ items: cart.filter(isCartItem) });
          }
        }
        useCartStore.persist.clearStorage();
      } catch (err) {
        console.error('Failed to sync cart', err);
      } finally {
        initialized.current = true;
      }
    };

    void fetchCart();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !initialized.current) return;

    // Sync on changes, debounce to avoid spamming the API
    if (syncTimeout.current) clearTimeout(syncTimeout.current);

    async function saveCart() {
      try {
        const response = await fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cart: items.map((item) => ({
              itemType: item.itemType ?? 'variant',
              itemId: item.variantId,
              quantity: item.quantity,
            })),
          }),
        });
        if (!response.ok) console.error('Failed to save cart to server');
      } catch (err) {
        console.error('Failed to save cart to server', err);
      }
    }
    syncTimeout.current = setTimeout(() => { void saveCart(); }, 1000);

    return () => {
      if (syncTimeout.current) clearTimeout(syncTimeout.current);
    };
  }, [items, isAuthenticated]);

  return null;
}
