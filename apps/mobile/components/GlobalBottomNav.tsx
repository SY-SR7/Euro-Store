import { router, usePathname } from 'expo-router';
import { Grid2X2, Heart, Home, ShoppingBag, UserRound } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Keyboard, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { usePreferences } from '../contexts/PreferencesContext';
import { useCartStore } from '../store/cartStore';

const HIDDEN_ROUTES = ['/login', '/onboarding', '/reset-password', '/verify-email'];

export function GlobalBottomNav() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { t } = usePreferences();
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const cartCount = useCartStore((state) => state.items.reduce((total, item) => total + item.quantity, 0));

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  if (keyboardVisible || HIDDEN_ROUTES.some((route) => pathname.startsWith(route))) return null;

  const items = [
    { href: '/(tabs)' as const, match: (path: string) => path === '/', icon: Home, label: t('tabs.home') },
    { href: '/(tabs)/categories' as const, match: (path: string) => path.startsWith('/categories'), icon: Grid2X2, label: t('tabs.categories') },
    { href: '/(tabs)/cart' as const, match: (path: string) => path.startsWith('/cart') || path.startsWith('/checkout'), icon: ShoppingBag, label: t('tabs.cart'), badge: cartCount },
    { href: '/(tabs)/wishlist' as const, match: (path: string) => path.startsWith('/wishlist'), icon: Heart, label: t('profile.wishlist'), protected: true },
    { href: '/(tabs)/profile' as const, match: (path: string) => ['/account', '/addresses', '/orders', '/loyalty', '/notifications', '/exchanges', '/exchange', '/faq', '/contact', '/privacy', '/terms'].some((route) => path.startsWith(route)), icon: UserRound, label: t('tabs.account'), protected: true },
  ];

  return (
    <View
      accessibilityRole="tablist"
      className="flex-row border-t border-border bg-background-card"
      style={{ minHeight: 64 + insets.bottom, paddingBottom: insets.bottom }}
    >
      {items.map((item) => {
        const active = item.match(pathname);
        const Icon = item.icon;
        return (
          <Pressable
            key={item.label}
            accessibilityRole="tab"
            accessibilityLabel={item.label}
            accessibilityState={{ selected: active }}
            onPress={() => item.protected && !user ? router.push('/login') : router.push(item.href)}
            className="min-h-16 flex-1 items-center justify-center"
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, transform: [{ scale: pressed ? 0.94 : 1 }] })}
          >
            <View className={`relative h-8 min-w-9 items-center justify-center rounded-full px-2 ${active ? 'border border-border-accent bg-primary/10' : ''}`}>
              <Icon size={22} color={active ? '#9A7209' : '#57534E'} strokeWidth={active ? 2.5 : 2} />
              {item.badge ? (
                <View className="absolute -end-2 -top-1 min-w-4 items-center justify-center rounded-full bg-error px-1">
                  <Text className="text-[9px] font-bold text-white">{item.badge > 99 ? '99+' : item.badge}</Text>
                </View>
              ) : null}
            </View>
            <Text className={`mt-0.5 text-[10px] ${active ? 'font-bold text-primary-dark' : 'font-medium text-text-secondary'}`}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
