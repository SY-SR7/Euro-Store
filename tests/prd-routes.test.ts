import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '..');

function source(path: string) {
  return readFileSync(resolve(root, path), 'utf8');
}

describe('PRD route contracts', () => {
  it('provides atomic item-level cart operations', () => {
    const createRoute = source('apps/web/src/app/api/cart/items/route.ts');
    const itemRoute = source('apps/web/src/app/api/cart/items/[id]/route.ts');
    const migration = source('supabase/migrations/20260805100000_atomic_cart_item_mutations.sql');

    expect(createRoute).toMatch(/export async function POST/);
    expect(createRoute).toContain("rpc('add_customer_cart_item'");
    expect(itemRoute).toMatch(/export async function PUT/);
    expect(itemRoute).toMatch(/export async function DELETE/);
    expect(itemRoute).toContain("rpc('set_customer_cart_item_quantity'");
    expect(itemRoute).toContain("rpc('remove_customer_cart_item'");
    expect(migration).toContain('FOR UPDATE OF pv');
    expect(migration).toContain('TO service_role');
    expect(migration).toContain('FROM PUBLIC, anon, authenticated');
  });

  it('does not use browser-native confirm or prompt dialogs', () => {
    const paths = [
      'apps/web/src/components/orders/OrderActions.tsx',
      'apps/web/src/app/(main)/account/addresses/AddressesClient.tsx',
      'apps/admin/src/app/(dashboard)/homepage/HomepageQuickAdmin.tsx',
      'apps/admin/src/app/(dashboard)/attribute-types/AttributeTypesQuickAdmin.tsx',
      'apps/admin/src/app/(dashboard)/exchanges/ExchangesQuickAdmin.tsx',
      'apps/admin/src/app/(dashboard)/products/ProductQuickAdmin.tsx',
    ];

    for (const path of paths) {
      expect(source(path)).not.toMatch(/\b(?:window\.)?(?:confirm|prompt)\s*\(/);
    }
  });

  it('keeps push tokens out of DELETE URL paths', () => {
    const pushRoute = source('apps/web/src/app/api/push-tokens/route.ts');
    expect(pushRoute).toMatch(/export async function DELETE/);
    expect(pushRoute).toMatch(/request\.json/);
  });

  it('uses an in-page authentication modal for protected web actions', () => {
    const layout = source('apps/web/src/app/(main)/layout.tsx');
    const provider = source('apps/web/src/components/auth/AuthModalProvider.tsx');
    const wishlist = source('apps/web/src/components/wishlist/WishlistProvider.tsx');

    expect(layout).toContain('<AuthModalProvider');
    expect(provider).toContain('role="dialog"');
    expect(provider).toContain("fetch('/api/auth/login'");
    expect(provider).toContain("fetch('/api/auth/register'");
    expect(wishlist).toContain('openAuth(window.location.pathname)');
  });

  it('does not depend on external placeholder image services', () => {
    const paths = [
      'apps/mobile/app/products/[id].tsx',
      'apps/mobile/app/(tabs)/index.tsx',
      'apps/mobile/app/(tabs)/categories.tsx',
    ];
    for (const path of paths) expect(source(path)).not.toContain('via.placeholder.com');
  });

  it('keeps mobile checkout on the authenticated server-side order contract', () => {
    const checkout = source('apps/mobile/app/checkout.tsx');
    const cartStore = source('apps/mobile/store/cartStore.ts');
    const mobileApi = source('apps/mobile/utils/api.ts');
    const serverAuth = source('apps/web/src/supabase-server.ts');

    expect(checkout).toContain("apiFetch<OrderResponse>('/api/orders'");
    expect(checkout).toContain("apiFetch<SavedAddress[]>('/api/addresses')");
    expect(checkout).toContain("apiFetch<LoyaltyData>('/api/customer/loyalty')");
    expect(checkout).toContain('loyalty_points_to_use');
    expect(checkout).toContain('/api/checkout/shipping?gov=');
    expect(checkout).toContain('variant_id: item.variantId');
    expect(checkout).toContain("'Idempotency-Key'");
    expect(checkout).not.toContain(".from('orders')");
    expect(checkout).not.toContain('EURO2026');
    expect(cartStore).toContain('variantId: string');
    expect(mobileApi).toContain("headers.set('Authorization', `Bearer ${session.access_token}`)");
    expect(mobileApi).toContain("headers.set('Origin'");
    expect(serverAuth).toContain("/^Bearer\\s+([^\\s]+)$/i");
  });

  it('does not ship placeholder EAS credentials', () => {
    const eas = source('apps/mobile/eas.json');
    expect(eas).not.toContain('PLACEHOLDER_URL');
    expect(eas).not.toContain('PLACEHOLDER_KEY');
    expect(eas).toContain('"environment": "production"');
  });

  it('keeps production mobile visuals provider-managed', () => {
    expect(source('apps/mobile/app/onboarding.tsx')).not.toContain('images.unsplash.com');
    expect(source('apps/mobile/app/(tabs)/index.tsx')).not.toContain('images.unsplash.com');
  });

  it('registers mobile push tokens through the protected API', () => {
    const push = source('apps/mobile/utils/pushNotifications.ts');
    expect(push).toContain("Notifications.getExpoPushTokenAsync");
    expect(push).toContain("apiFetch('/api/push-tokens'");
    expect(push).toContain("method: 'DELETE'");
  });

  it('keeps authenticated mobile carts server-backed without repeated guest merges', () => {
    const store = source('apps/mobile/store/cartStore.ts');
    const auth = source('apps/mobile/contexts/AuthContext.tsx');
    expect(store).toContain('ownerId: string | null');
    expect(store).toContain('hasHydrated: boolean');
    expect(auth).toContain("apiFetch('/api/cart/merge'");
    expect(auth).toContain("apiFetch<{ cart: ServerCartItem[] }>('/api/cart')");
    expect(auth).toContain('cartOwnerId === null && cartItems.length');
    expect(auth).toContain('cartSyncReady.current = userId');
  });

  it('connects mobile post-purchase features to protected production APIs', () => {
    const notify = source('apps/web/src/app/api/product-variants/[id]/notify-me/route.ts');
    const exchange = source('apps/mobile/app/exchange/new.tsx');
    const order = source('apps/mobile/app/orders/[id].tsx');
    expect(notify).toContain('safeParse(await params)');
    expect(exchange).toContain('ImagePicker.launchImageLibraryAsync');
    expect(exchange).toContain("form.append('images'");
    expect(exchange).toContain('/exchange`');
    expect(order).toContain("apiFetch('/api/reviews'");
    expect(order).toContain('/reorder`');
    expect(order).toContain('apiDownload(`/api/orders/${order.id}/invoice`');
  });
});
