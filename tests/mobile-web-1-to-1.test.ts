import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const read = (path: string) => readFileSync(resolve(root, path), 'utf8');

const routePairs = [
  ['apps/web/src/app/(main)/page.tsx', 'apps/mobile/app/(tabs)/index.tsx'],
  ['apps/web/src/app/(main)/products/page.tsx', 'apps/mobile/app/products/index.tsx'],
  ['apps/web/src/app/(main)/products/[slug]/page.tsx', 'apps/mobile/app/products/[id].tsx'],
  ['apps/web/src/app/(main)/categories/page.tsx', 'apps/mobile/app/(tabs)/categories.tsx'],
  ['apps/web/src/app/(main)/categories/[slug]/page.tsx', 'apps/mobile/app/categories/[slug].tsx'],
  ['apps/web/src/app/(main)/cart/page.tsx', 'apps/mobile/app/(tabs)/cart.tsx'],
  ['apps/web/src/app/(main)/checkout/page.tsx', 'apps/mobile/app/checkout.tsx'],
  ['apps/web/src/app/(main)/checkout/success/page.tsx', 'apps/mobile/app/checkout/success.tsx'],
  ['apps/web/src/app/(main)/orders/page.tsx', 'apps/mobile/app/orders.tsx'],
  ['apps/web/src/app/(main)/orders/[orderNumber]/page.tsx', 'apps/mobile/app/orders/[id].tsx'],
  ['apps/web/src/app/(main)/wishlist/page.tsx', 'apps/mobile/app/(tabs)/wishlist.tsx'],
  ['apps/web/src/app/(main)/wishlist/[token]/page.tsx', 'apps/mobile/app/wishlist/[token].tsx'],
  ['apps/web/src/app/(main)/loyalty/page.tsx', 'apps/mobile/app/loyalty.tsx'],
  ['apps/web/src/app/(main)/notifications/page.tsx', 'apps/mobile/app/notifications.tsx'],
  ['apps/web/src/app/(main)/exchange/page.tsx', 'apps/mobile/app/exchanges.tsx'],
  ['apps/web/src/app/(main)/exchange/new/page.tsx', 'apps/mobile/app/exchange/new.tsx'],
  ['apps/web/src/app/(main)/exchange/[id]/page.tsx', 'apps/mobile/app/exchanges/[id].tsx'],
  ['apps/web/src/app/(main)/account/page.tsx', 'apps/mobile/app/(tabs)/profile.tsx'],
  ['apps/web/src/app/(main)/account/profile/page.tsx', 'apps/mobile/app/account.tsx'],
  ['apps/web/src/app/(main)/account/addresses/page.tsx', 'apps/mobile/app/addresses.tsx'],
  ['apps/web/src/app/(main)/offers/page.tsx', 'apps/mobile/app/offers.tsx'],
  ['apps/web/src/app/(main)/new-arrivals/page.tsx', 'apps/mobile/app/new-arrivals.tsx'],
  ['apps/web/src/app/(main)/collections/[slug]/page.tsx', 'apps/mobile/app/collections/[slug].tsx'],
  ['apps/web/src/app/(main)/faq/page.tsx', 'apps/mobile/app/faq.tsx'],
  ['apps/web/src/app/(main)/contact/page.tsx', 'apps/mobile/app/contact.tsx'],
  ['apps/web/src/app/(main)/privacy/page.tsx', 'apps/mobile/app/privacy.tsx'],
  ['apps/web/src/app/(main)/terms/page.tsx', 'apps/mobile/app/terms.tsx'],
] as const;

describe('mobile web and native 1:1 contracts', () => {
  it.each(routePairs)('keeps a native route for web route %s', (web, mobile) => {
    expect(existsSync(resolve(root, web))).toBe(true);
    expect(existsSync(resolve(root, mobile))).toBe(true);
  });

  it('uses the same canonical home payload and no direct mobile business-table queries', () => {
    const webHome = read('apps/web/src/app/(main)/page.tsx');
    const homeRoute = read('apps/web/src/app/api/storefront/home/route.ts');
    const nativeHome = read('apps/mobile/app/(tabs)/index.tsx');
    const nativeSources = [
      'apps/mobile/app/(tabs)/index.tsx',
      'apps/mobile/app/(tabs)/categories.tsx',
      'apps/mobile/app/(tabs)/cart.tsx',
      'apps/mobile/app/(tabs)/wishlist.tsx',
      'apps/mobile/app/(tabs)/profile.tsx',
      'apps/mobile/app/products/index.tsx',
      'apps/mobile/app/products/[id].tsx',
      'apps/mobile/app/checkout.tsx',
      'apps/mobile/app/orders.tsx',
      'apps/mobile/app/orders/[id].tsx',
      'apps/mobile/app/exchanges.tsx',
      'apps/mobile/app/exchanges/[id].tsx',
      'apps/mobile/app/addresses.tsx',
      'apps/mobile/app/account.tsx',
      'apps/mobile/components/WishlistView.tsx',
    ].map(read).join('\n');

    expect(webHome).toContain('getStorefrontHomeData()');
    expect(homeRoute).toContain('getStorefrontHomeData()');
    expect(nativeHome).toContain("apiFetch<StorefrontHomeResponse>('/api/storefront/home')");
    expect(nativeSources).not.toMatch(/\.from\s*\(/);
  });

  it('keeps the five bottom-navigation destinations and their order identical', () => {
    const web = read('apps/web/src/components/layout/MobileBottomNav.tsx');
    const mobile = read('apps/mobile/components/GlobalBottomNav.tsx');
    const webOrder = ['home', 'categories', 'cart', 'wishlist', 'account'].map((key) => web.indexOf(`key: '${key}'`));
    const mobileOrder = ["'/(tabs)'", "'/(tabs)/categories'", "'/(tabs)/cart'", "'/(tabs)/wishlist'", "'/(tabs)/profile'"].map((href) => mobile.indexOf(`href: ${href}`));
    expect(webOrder.every((position) => position >= 0)).toBe(true);
    expect(mobileOrder.every((position) => position >= 0)).toBe(true);
    expect([...webOrder].sort((a, b) => a - b)).toEqual(webOrder);
    expect([...mobileOrder].sort((a, b) => a - b)).toEqual(mobileOrder);
    expect(web).toContain('h-16');
    expect(mobile).toContain('minHeight: 64 + insets.bottom');
  });

  it('keeps mobile header and hero measurements aligned with the web mobile design', () => {
    const webHeader = read('apps/web/src/components/layout/Header.tsx');
    const mobileHeader = read('apps/mobile/components/AppTopBar.tsx');
    const webHero = read('apps/web/src/components/home/HomeBannerCarousel.tsx');
    const mobileHero = read('apps/mobile/app/(tabs)/index.tsx');

    expect(webHeader).toContain('h-16');
    expect(mobileHeader).toContain('h-16');
    expect(mobileHeader).toContain('w-[218px]');
    expect(webHero).toContain('h-[82svh]');
    expect(mobileHero).toContain('* 0.82');
    expect(webHero).toContain('bg-black/45');
    expect(mobileHero).toContain('bg-black/45');
    expect(webHero).toContain('text-3xl');
    expect(mobileHero).toContain('text-3xl');
  });

  it('renders the exact same legal documents from the shared package', () => {
    const webPrivacy = read('apps/web/src/app/(main)/privacy/page.tsx');
    const mobilePrivacy = read('apps/mobile/app/privacy.tsx');
    const webTerms = read('apps/web/src/app/(main)/terms/page.tsx');
    const mobileTerms = read('apps/mobile/app/terms.tsx');
    expect(webPrivacy).toContain('privacyDocuments[locale]');
    expect(mobilePrivacy).toContain("privacyDocuments[isAr ? 'ar' : 'en']");
    expect(webTerms).toContain('termsDocuments[locale]');
    expect(mobileTerms).toContain("termsDocuments[isAr ? 'ar' : 'en']");
    expect(mobilePrivacy).toContain("from '@eurostore/shared/legal'");
    expect(mobileTerms).toContain("from '@eurostore/shared/legal'");
  });

  it('keeps category taps on the same category-detail operation as the web', () => {
    const webCategories = read('apps/web/src/app/(main)/categories/page.tsx');
    const mobileCategories = read('apps/mobile/app/(tabs)/categories.tsx');
    const mobileHome = read('apps/mobile/app/(tabs)/index.tsx');
    expect(webCategories).toContain('href={`/categories/${category.slug}`}');
    expect(mobileCategories).toContain("pathname: '/categories/[slug]'");
    expect(mobileHome).toContain("pathname: '/categories/[slug]'");
  });

  it('keeps the offers and new-arrivals editorial surfaces and locked catalog queries', () => {
    const webOffers = read('apps/web/src/app/(main)/offers/page.tsx');
    const mobileOffers = read('apps/mobile/app/offers.tsx');
    const webNew = read('apps/web/src/app/(main)/new-arrivals/page.tsx');
    const mobileNew = read('apps/mobile/app/new-arrivals.tsx');
    const mobileCatalog = read('apps/mobile/app/products/index.tsx');
    expect(webOffers).toContain('تخفيضات حصرية تصل حتى 25%');
    expect(mobileCatalog).toContain('تخفيضات حصرية تصل حتى 25%');
    expect(mobileOffers).toContain("sale: true, hero: 'offers'");
    expect(webNew).toContain('أحدث التشكيلات العالمية الأصلية');
    expect(mobileCatalog).toContain('أحدث التشكيلات العالمية الأصلية');
    expect(mobileNew).toContain("sort: 'newest', hero: 'new-arrivals'");
  });

  it('connects contact and newsletter operations to the same production APIs and migrations', () => {
    const webContact = read('apps/web/src/app/(main)/contact/ContactForm.tsx');
    const mobileContact = read('apps/mobile/app/contact.tsx');
    const webNewsletter = read('apps/web/src/components/home/VipClubNewsletter.tsx');
    const mobileHome = read('apps/mobile/app/(tabs)/index.tsx');
    expect(webContact).toContain('/api/storefront/contact');
    expect(mobileContact).toContain('/api/storefront/contact');
    expect(webNewsletter).toContain('/api/storefront/newsletter');
    expect(mobileHome).toContain('/api/storefront/newsletter');
    expect(read('supabase/migrations/20260830010000_support_messages.sql')).toMatch(/create table if not exists public\.support_messages/i);
    expect(read('supabase/migrations/20260830011000_newsletter_subscriptions.sql')).toMatch(/create table if not exists public\.newsletter_subscriptions/i);
  });

  it('uses supported modern native safe areas on every full-screen mobile surface', () => {
    const paths = routePairs.map(([, mobile]) => mobile).filter((path) => !path.endsWith('offers.tsx') && !path.endsWith('new-arrivals.tsx') && !path.includes('categories/[slug]'));
    const native = paths.map(read).join('\n');
    expect(native).not.toMatch(/import\s*\{[^}]*SafeAreaView[^}]*\}\s*from\s*['"]react-native['"]/s);
    expect(read('apps/mobile/app/_layout.tsx')).toContain('<SafeAreaProvider>');
  });
});
