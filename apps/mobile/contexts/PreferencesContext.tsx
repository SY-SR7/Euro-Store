import AsyncStorage from '@react-native-async-storage/async-storage';
import { vars } from 'nativewind';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';

export type AppLocale = 'ar' | 'en';

const STORAGE_KEY = 'eurostore-mobile-preferences-v1';

const messages = {
  ar: {
    'common.back': 'الرجوع',
    'common.retry': 'إعادة المحاولة',
    'common.loading': 'جارٍ التحميل...',
    'common.save': 'حفظ',
    'common.cancel': 'إلغاء',
    'common.delete': 'حذف',
    'common.currency': 'ل.س',
    'common.addToCart': 'أضف للسلة',
    'common.unavailable': 'غير متوفر',
    'common.new': 'جديد',
    'common.sale': 'خصم {percent}%',
    'common.share': 'مشاركة',
    'common.error': 'حدث خطأ غير متوقع. حاول مرة أخرى.',
    'tabs.home': 'الرئيسية',
    'tabs.categories': 'التصنيفات',
    'tabs.cart': 'السلة',
    'tabs.account': 'حسابي',
    'home.shopNow': 'تسوق الآن',
    'home.latest': 'أحدث الإضافات',
    'home.viewAll': 'عرض الكل',
    'home.notifications': 'الإشعارات',
    'preferences.title': 'تفضيلات التطبيق',
    'preferences.language': 'اللغة',
    'preferences.arabic': 'العربية',
    'preferences.english': 'English',
    'profile.title': 'حسابي',
    'profile.signInTitle': 'سجّل الدخول لإدارة حسابك',
    'profile.guestBody': 'يمكنك متابعة تصفح المنتجات والسلة كضيف.',
    'profile.signIn': 'تسجيل الدخول أو إنشاء حساب',
    'profile.customer': 'عميل EuroStore',
    'profile.personal': 'البيانات الشخصية',
    'profile.addresses': 'عناوين التوصيل',
    'profile.loyalty': 'نقاط الولاء ورمز QR',
    'profile.orders': 'طلباتي',
    'profile.wishlist': 'المفضلة',
    'profile.exchanges': 'طلبات الاستبدال',
    'profile.notifications': 'الإشعارات',
    'profile.signOut': 'تسجيل الخروج',
    'profile.signOutError': 'حدث خطأ أثناء تسجيل الخروج.',
    'catalog.allProducts': 'كل المنتجات',
    'catalog.search': 'ابحث عن منتج',
    'catalog.filters': 'الفلاتر',
    'catalog.sort': 'الترتيب',
    'catalog.newest': 'الأحدث',
    'catalog.priceAsc': 'السعر: الأقل أولاً',
    'catalog.priceDesc': 'السعر: الأعلى أولاً',
    'catalog.popular': 'الأكثر طلباً',
    'catalog.noResults': 'لا توجد منتجات مطابقة.',
    'catalog.results': '{count} منتج',
    'catalog.clearFilters': 'مسح الفلاتر',
    'catalog.categories': 'الفئات',
    'catalog.brands': 'العلامات التجارية',
    'catalog.priceRange': 'نطاق السعر',
    'catalog.minPrice': 'أقل سعر',
    'catalog.maxPrice': 'أعلى سعر',
    'catalog.apply': 'تطبيق الفلاتر',
    'catalog.loadMore': 'عرض المزيد',
    'catalog.suggestions': 'اقتراحات البحث',
    'catalog.searchError': 'تعذر تحميل الكتالوج. تحقق من الاتصال وحاول مجدداً.',
    'product.notFound': 'المنتج غير موجود',
    'product.featured': 'منتج مميز',
    'product.description': 'الوصف',
    'product.noDescription': 'لا يوجد وصف متاح لهذا المنتج حالياً.',
    'product.totalPrice': 'السعر الإجمالي',
    'product.notify': 'نبّهني عند التوفر',
    'product.notifying': 'جارٍ الاشتراك...',
    'product.notifySuccessTitle': 'تم الاشتراك',
    'product.notifySuccessBody': 'سنرسل لك إشعاراً عند توفر هذا المنتج.',
    'product.notifyErrorTitle': 'تعذر الاشتراك',
    'product.notifyErrorBody': 'حاول مرة أخرى لاحقاً.',
    'product.selectOptions': 'اختر مواصفات المنتج',
    'product.sizeGuide': 'دليل المقاسات',
    'product.bundles': 'الحزم المتاحة',
    'product.reviews': 'تقييمات العملاء',
    'product.noReviews': 'لا توجد تقييمات بعد.',
    'product.share': 'مشاركة المنتج',
    'product.quantity': 'الكمية',
    'product.inStock': 'متوفر ({count})',
    'product.outOfStock': 'نفد المخزون',
    'product.chooseVariant': 'اختر المقاس واللون المتاحين',
    'product.bundleAdd': 'أضف الحزمة',
    'product.bundleItems': '{count} عناصر',
    'product.reviewCount': '{count} تقييم',
    'product.close': 'إغلاق',
    'product.loadError': 'تعذر تحميل تفاصيل المنتج.',
  },
  en: {
    'common.back': 'Back',
    'common.retry': 'Retry',
    'common.loading': 'Loading...',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.currency': 'SYP',
    'common.addToCart': 'Add to cart',
    'common.unavailable': 'Unavailable',
    'common.new': 'New',
    'common.sale': '{percent}% off',
    'common.share': 'Share',
    'common.error': 'Something went wrong. Please try again.',
    'tabs.home': 'Home',
    'tabs.categories': 'Categories',
    'tabs.cart': 'Cart',
    'tabs.account': 'Account',
    'home.shopNow': 'Shop now',
    'home.latest': 'Latest arrivals',
    'home.viewAll': 'View all',
    'home.notifications': 'Notifications',
    'preferences.title': 'App preferences',
    'preferences.language': 'Language',
    'preferences.arabic': 'العربية',
    'preferences.english': 'English',
    'profile.title': 'My account',
    'profile.signInTitle': 'Sign in to manage your account',
    'profile.guestBody': 'You can continue browsing products and your cart as a guest.',
    'profile.signIn': 'Sign in or create an account',
    'profile.customer': 'EuroStore customer',
    'profile.personal': 'Personal details',
    'profile.addresses': 'Delivery addresses',
    'profile.loyalty': 'Loyalty points and QR',
    'profile.orders': 'My orders',
    'profile.wishlist': 'Wishlist',
    'profile.exchanges': 'Exchange requests',
    'profile.notifications': 'Notifications',
    'profile.signOut': 'Sign out',
    'profile.signOutError': 'Could not sign out.',
    'catalog.allProducts': 'All products',
    'catalog.search': 'Search products',
    'catalog.filters': 'Filters',
    'catalog.sort': 'Sort',
    'catalog.newest': 'Newest',
    'catalog.priceAsc': 'Price: low to high',
    'catalog.priceDesc': 'Price: high to low',
    'catalog.popular': 'Most popular',
    'catalog.noResults': 'No matching products.',
    'catalog.results': '{count} products',
    'catalog.clearFilters': 'Clear filters',
    'catalog.categories': 'Categories',
    'catalog.brands': 'Brands',
    'catalog.priceRange': 'Price range',
    'catalog.minPrice': 'Minimum price',
    'catalog.maxPrice': 'Maximum price',
    'catalog.apply': 'Apply filters',
    'catalog.loadMore': 'Load more',
    'catalog.suggestions': 'Search suggestions',
    'catalog.searchError': 'The catalog could not be loaded. Check your connection and try again.',
    'product.notFound': 'Product not found',
    'product.featured': 'Featured product',
    'product.description': 'Description',
    'product.noDescription': 'No description is available for this product yet.',
    'product.totalPrice': 'Total price',
    'product.notify': 'Notify me',
    'product.notifying': 'Subscribing...',
    'product.notifySuccessTitle': 'Subscribed',
    'product.notifySuccessBody': 'We will notify you when this product is available.',
    'product.notifyErrorTitle': 'Could not subscribe',
    'product.notifyErrorBody': 'Please try again later.',
    'product.selectOptions': 'Choose product options',
    'product.sizeGuide': 'Size guide',
    'product.bundles': 'Available bundles',
    'product.reviews': 'Customer reviews',
    'product.noReviews': 'No reviews yet.',
    'product.share': 'Share product',
    'product.quantity': 'Quantity',
    'product.inStock': 'In stock ({count})',
    'product.outOfStock': 'Out of stock',
    'product.chooseVariant': 'Choose available size and color',
    'product.bundleAdd': 'Add bundle',
    'product.bundleItems': '{count} items',
    'product.reviewCount': '{count} reviews',
    'product.close': 'Close',
    'product.loadError': 'Product details could not be loaded.',
  },
} as const;

const lightColors = {
    '--color-primary': '184 134 11',
    '--color-primary-dark': '154 114 9',
    '--color-primary-light': '212 175 55',
    '--color-background': '250 247 239',
    '--color-background-secondary': '243 238 227',
    '--color-background-card': '255 253 248',
    '--color-background-elevated': '255 255 255',
    '--color-text-primary': '28 25 23',
    '--color-text-secondary': '87 83 78',
    '--color-text-muted': '168 162 158',
    '--color-border': '232 220 195',
    '--color-border-accent': '215 190 121',
} as const;

type PreferencesContextValue = {
  locale: AppLocale;
  isAr: boolean;
  hydrated: boolean;
  setLocale: (locale: AppLocale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  l: (arabic: string, english: string) => string;
  formatCurrency: (value: number) => string;
  formatDate: (value: string | Date, includeTime?: boolean) => string;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>('ar');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        const saved = JSON.parse(raw) as { locale?: AppLocale };
        if (saved.locale === 'ar' || saved.locale === 'en') setLocaleState(saved.locale);
      })
      .catch(() => undefined)
      .finally(() => setHydrated(true));
  }, []);

  const persist = useCallback((nextLocale: AppLocale) => {
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ locale: nextLocale }));
  }, []);

  const setLocale = useCallback((next: AppLocale) => {
    setLocaleState(next);
    persist(next);
  }, [persist]);

  const t = useCallback((key: string, params?: Record<string, string | number>) => {
    const table = messages[locale] as Record<string, string>;
    return (table[key] ?? key).replace(/\{(\w+)\}/g, (_match, name: string) => String(params?.[name] ?? `{${name}}`));
  }, [locale]);

  const l = useCallback((arabic: string, english: string) => locale === 'ar' ? arabic : english, [locale]);

  const formatCurrency = useCallback((value: number) => {
    const formatted = Number(value || 0).toLocaleString(locale === 'ar' ? 'ar-SY' : 'en-US');
    return `${formatted} ${t('common.currency')}`;
  }, [locale, t]);

  const formatDate = useCallback((value: string | Date, includeTime = true) => {
    const date = value instanceof Date ? value : new Date(value);
    return includeTime
      ? date.toLocaleString(locale === 'ar' ? 'ar-SY' : 'en-US')
      : date.toLocaleDateString(locale === 'ar' ? 'ar-SY' : 'en-US');
  }, [locale]);

  const contextValue = useMemo<PreferencesContextValue>(() => ({
    locale,
    isAr: locale === 'ar',
    hydrated,
    setLocale,
    t,
    l,
    formatCurrency,
    formatDate,
  }), [formatCurrency, formatDate, hydrated, l, locale, setLocale, t]);

  return (
    <PreferencesContext.Provider value={contextValue}>
      <View
        className="flex-1 bg-background"
        style={[vars(lightColors), { direction: locale === 'ar' ? 'rtl' : 'ltr' }]}
      >
        {children}
      </View>
    </PreferencesContext.Provider>
  );
}

export function usePreferences(): PreferencesContextValue {
  const context = useContext(PreferencesContext);
  if (!context) throw new Error('usePreferences must be used within PreferencesProvider');
  return context;
}
