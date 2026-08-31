import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, ShieldCheck, ShoppingBag, Star, UserRound } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../utils/supabase';
import { router } from 'expo-router';
import { unregisterPushNotifications } from '../../utils/pushNotifications';
import { useWishlistStore } from '../../store/wishlistStore';
import { useCartStore } from '../../store/cartStore';
import { PreferencesPanel } from '../../components/PreferencesPanel';
import { usePreferences } from '../../contexts/PreferencesContext';
import { apiFetch } from '../../utils/api';

type AccountSummary = { fullName: string; phone: string; referralCode: string; orderCount: number; loyaltyPoints: number; unreadCount: number };

export default function ProfileScreen() {
  const { user } = useAuth();
  const clearWishlist = useWishlistStore((state) => state.clearItems);
  const resetCart = useCartStore((state) => state.resetCart);
  const { isAr, t, l } = usePreferences();
  const [summary, setSummary] = useState<AccountSummary>({ fullName: '', phone: '', referralCode: '', orderCount: 0, loyaltyPoints: 0, unreadCount: 0 });
  const arrow = isAr ? '<' : '>';

  useEffect(() => {
    if (!user) return;
    void Promise.all([
      apiFetch<{ profile: { full_name?: string | null; phone?: string | null; referral_code?: string | null; loyalty_points?: number | null } }>('/api/profile'),
      apiFetch<{ total: number }>('/api/orders'),
      apiFetch<{ count?: number }>('/api/notifications/unread-count'),
    ]).then(([profileResult, ordersResult, notificationResult]) => setSummary({
      fullName: profileResult.profile.full_name ?? '',
      phone: profileResult.profile.phone ?? '',
      referralCode: profileResult.profile.referral_code ?? '',
      loyaltyPoints: Number(profileResult.profile.loyalty_points ?? 0),
      orderCount: Number(ordersResult.total ?? 0),
      unreadCount: Number(notificationResult.count ?? 0),
    })).catch(() => undefined);
  }, [user]);

  const handleSignOut = async () => {
    await unregisterPushNotifications().catch(() => undefined);
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert(t('common.error'), t('profile.signOutError'));
    } else {
      clearWishlist();
      resetCart();
    }
  };

  return (
    <SafeAreaView className='flex-1 bg-background'>
      <View className='border-b border-border bg-background-card px-6 py-5'>
        <Text className='text-3xl font-black text-text-primary'>{t('profile.title')}</Text>
      </View>

      <ScrollView className='flex-1 px-6' contentContainerStyle={{ flexGrow: 1, paddingVertical: 24 }}>
        {!user ? (
          <View className='flex-1'>
            <View className='w-full items-center rounded-2xl border border-border bg-background-card p-6'>
              <View className='mb-4 h-20 w-20 items-center justify-center rounded-full bg-primary/10'>
                <UserRound size={36} color='#B8860B' strokeWidth={1.7} />
              </View>
              <Text className='mb-3 text-center text-xl font-black text-text-primary'>
                {t('profile.signInTitle')}
              </Text>
              <Text className='mb-6 text-center leading-6 text-text-secondary'>{t('profile.guestBody')}</Text>
              <View className='mb-6 w-full flex-row items-center justify-center gap-2 border-y border-border py-4'>
                <ShieldCheck size={18} color='#B8860B' />
                <Text className='text-sm font-bold text-text-secondary'>{l('حساب آمن ومزامنة للطلبات والمفضلة', 'Secure account with synced orders and wishlist')}</Text>
              </View>
            <TouchableOpacity accessibilityRole='button' className='min-h-14 w-full items-center justify-center rounded-xl bg-primary px-4' onPress={() => router.push('/login')}>
              <Text className='text-center text-lg font-bold text-text-primary'>{t('profile.signIn')}</Text>
            </TouchableOpacity>
            </View>
            <View className="mt-8 w-full"><PreferencesPanel /></View>
            <StoreLinks />
          </View>
        ) : (
        <>
        <View className='bg-background-secondary p-6 rounded-2xl border border-border items-center mb-6'>
          <View className='w-20 h-20 bg-primary/20 rounded-full items-center justify-center mb-4 border border-primary/50'>
            <Text className='text-3xl text-primary font-bold'>
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <Text className='text-text-primary font-bold text-lg mb-1'>{user?.email}</Text>
          <Text className='text-text-secondary text-sm'>{summary.fullName || String(user.user_metadata?.full_name ?? t('profile.customer'))}</Text>
          {summary.phone ? <Text className='mt-1 text-xs text-text-muted'>{summary.phone}</Text> : null}
          {summary.referralCode ? <Text className='mt-1 text-xs font-bold text-primary'>{l('رمز الدعوة', 'Referral')}: {summary.referralCode}</Text> : null}
        </View>

        <View className='mb-6 flex-row gap-3'>
          <TouchableOpacity accessibilityRole='button' accessibilityLabel={t('profile.orders')} onPress={() => router.push('/orders')} className='flex-1 items-center rounded-xl border border-border bg-background-card p-3'><ShoppingBag size={20} color='#B8860B' /><Text className='mt-2 text-lg font-black text-text-primary'>{summary.orderCount}</Text><Text className='text-[10px] text-text-secondary'>{t('profile.orders')}</Text></TouchableOpacity>
          <TouchableOpacity accessibilityRole='button' accessibilityLabel={t('profile.loyalty')} onPress={() => router.push('/loyalty')} className='flex-1 items-center rounded-xl border border-border bg-background-card p-3'><Star size={20} color='#B8860B' /><Text className='mt-2 text-lg font-black text-text-primary'>{summary.loyaltyPoints}</Text><Text className='text-[10px] text-text-secondary'>{l('نقطة', 'Points')}</Text></TouchableOpacity>
          <TouchableOpacity accessibilityRole='button' accessibilityLabel={t('profile.notifications')} onPress={() => router.push('/notifications')} className='flex-1 items-center rounded-xl border border-border bg-background-card p-3'><Bell size={20} color='#B8860B' /><Text className='mt-2 text-lg font-black text-text-primary'>{summary.unreadCount}</Text><Text className='text-[10px] text-text-secondary'>{l('غير مقروء', 'Unread')}</Text></TouchableOpacity>
        </View>

        <View className='space-y-4 flex-1'>
          <TouchableOpacity accessibilityRole='button' className='bg-background-secondary p-4 rounded-xl border border-border flex-row justify-between items-center mb-3' onPress={() => router.push('/account')}>
            <Text className='text-text-primary font-bold text-base'>{t('profile.personal')}</Text><Text className='text-text-secondary font-bold'>{arrow}</Text>
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole='button' className='bg-background-secondary p-4 rounded-xl border border-border flex-row justify-between items-center mb-3' onPress={() => router.push('/addresses')}>
            <Text className='text-text-primary font-bold text-base'>{t('profile.addresses')}</Text><Text className='text-text-secondary font-bold'>{arrow}</Text>
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole='button' className='bg-background-secondary p-4 rounded-xl border border-border flex-row justify-between items-center mb-3' onPress={() => router.push('/loyalty')}>
            <Text className='text-text-primary font-bold text-base'>{t('profile.loyalty')}</Text><Text className='text-text-secondary font-bold'>{arrow}</Text>
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole='button'
            className='bg-background-secondary p-4 rounded-xl border border-border flex-row justify-between items-center mb-3'
            onPress={() => router.push('/orders')}
          >
            <Text className='text-text-primary font-bold text-base'>{t('profile.orders')}</Text>
            <Text className='text-text-secondary font-bold'>{arrow}</Text>
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole='button'
            className='bg-background-secondary p-4 rounded-xl border border-border flex-row justify-between items-center mb-3'
            onPress={() => router.push('/(tabs)/wishlist')}
          >
            <Text className='text-text-primary font-bold text-base'>{t('profile.wishlist')}</Text>
            <Text className='text-text-secondary font-bold'>{arrow}</Text>
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole='button' className='bg-background-secondary p-4 rounded-xl border border-border flex-row justify-between items-center mb-3' onPress={() => router.push('/exchanges')}>
            <Text className='text-text-primary font-bold text-base'>{t('profile.exchanges')}</Text><Text className='text-text-secondary font-bold'>{arrow}</Text>
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole='button' className='bg-background-secondary p-4 rounded-xl border border-border flex-row justify-between items-center mb-6' onPress={() => router.push('/notifications')}>
            <Text className='text-text-primary font-bold text-base'>{t('profile.notifications')}</Text>
            <Text className='text-text-secondary font-bold'>{arrow}</Text>
          </TouchableOpacity>
        </View>

        <PreferencesPanel />
        <StoreLinks />

        <TouchableOpacity accessibilityRole='button'
          className='bg-error/10 border border-error/50 p-4 rounded-xl mb-4'
          onPress={handleSignOut}
        >
          <Text className='text-error font-bold text-center text-lg'>{t('profile.signOut')}</Text>
        </TouchableOpacity>
        </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StoreLinks() {
  const { isAr, l } = usePreferences();
  const arrow = isAr ? '<' : '>';
  const links = [
    ['/offers', l('العروض والتخفيضات', 'Offers and discounts')],
    ['/new-arrivals', l('وصل حديثاً', 'New arrivals')],
    ['/faq', l('الأسئلة الشائعة', 'FAQ')],
    ['/contact', l('تواصل معنا', 'Contact us')],
    ['/privacy', l('سياسة الخصوصية', 'Privacy policy')],
    ['/terms', l('الشروط والأحكام', 'Terms and conditions')],
  ] as const;
  return <View className="my-7 border-t border-border pt-6"><Text className="mb-4 text-lg font-black text-text-primary">{l('المتجر والدعم', 'Store and support')}</Text>{links.map(([href, label]) => <TouchableOpacity key={href} accessibilityRole="button" accessibilityLabel={label} onPress={() => router.push(href)} className="mb-3 min-h-14 flex-row items-center justify-between rounded-xl border border-border bg-background-card px-4"><Text className="font-bold text-text-primary">{label}</Text><Text className="font-bold text-text-secondary">{arrow}</Text></TouchableOpacity>)}</View>;
}
