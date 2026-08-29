import React from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../utils/supabase';
import { router } from 'expo-router';
import { unregisterPushNotifications } from '../../utils/pushNotifications';
import { useWishlistStore } from '../../store/wishlistStore';
import { useCartStore } from '../../store/cartStore';
import { PreferencesPanel } from '../../components/PreferencesPanel';
import { usePreferences } from '../../contexts/PreferencesContext';

export default function ProfileScreen() {
  const { user } = useAuth();
  const clearWishlist = useWishlistStore((state) => state.clearItems);
  const resetCart = useCartStore((state) => state.resetCart);
  const { isAr, t } = usePreferences();
  const arrow = isAr ? '<' : '>';

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
      <View className='px-6 py-4 border-b border-border'>
        <Text className='text-2xl font-bold text-primary'>{t('profile.title')}</Text>
      </View>

      <ScrollView className='flex-1 px-6' contentContainerStyle={{ flexGrow: 1, paddingVertical: 24 }}>
        {!user ? (
          <View className='flex-1 items-center justify-center'>
            <Text className='mb-3 text-xl font-bold text-text-primary'>{t('profile.signInTitle')}</Text>
            <Text className='mb-8 text-center text-text-secondary'>{t('profile.guestBody')}</Text>
            <TouchableOpacity className='w-full rounded-xl bg-primary p-4' onPress={() => router.push('/login')}>
              <Text className='text-center text-lg font-bold text-[#0F0F0F]'>{t('profile.signIn')}</Text>
            </TouchableOpacity>
            <View className="mt-8 w-full"><PreferencesPanel /></View>
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
          <Text className='text-text-secondary text-sm'>{String(user.user_metadata?.full_name ?? t('profile.customer'))}</Text>
        </View>

        <View className='space-y-4 flex-1'>
          <TouchableOpacity className='bg-background-secondary p-4 rounded-xl border border-border flex-row justify-between items-center mb-3' onPress={() => router.push('/account')}>
            <Text className='text-text-primary font-bold text-base'>{t('profile.personal')}</Text><Text className='text-text-secondary font-bold'>{arrow}</Text>
          </TouchableOpacity>
          <TouchableOpacity className='bg-background-secondary p-4 rounded-xl border border-border flex-row justify-between items-center mb-3' onPress={() => router.push('/addresses')}>
            <Text className='text-text-primary font-bold text-base'>{t('profile.addresses')}</Text><Text className='text-text-secondary font-bold'>{arrow}</Text>
          </TouchableOpacity>
          <TouchableOpacity className='bg-background-secondary p-4 rounded-xl border border-border flex-row justify-between items-center mb-3' onPress={() => router.push('/loyalty')}>
            <Text className='text-text-primary font-bold text-base'>{t('profile.loyalty')}</Text><Text className='text-text-secondary font-bold'>{arrow}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            className='bg-background-secondary p-4 rounded-xl border border-border flex-row justify-between items-center mb-3'
            onPress={() => router.push('/orders')}
          >
            <Text className='text-text-primary font-bold text-base'>{t('profile.orders')}</Text>
            <Text className='text-text-secondary font-bold'>{arrow}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            className='bg-background-secondary p-4 rounded-xl border border-border flex-row justify-between items-center mb-3'
            onPress={() => router.push('/wishlist')}
          >
            <Text className='text-text-primary font-bold text-base'>{t('profile.wishlist')}</Text>
            <Text className='text-text-secondary font-bold'>{arrow}</Text>
          </TouchableOpacity>
          <TouchableOpacity className='bg-background-secondary p-4 rounded-xl border border-border flex-row justify-between items-center mb-3' onPress={() => router.push('/exchanges')}>
            <Text className='text-text-primary font-bold text-base'>{t('profile.exchanges')}</Text><Text className='text-text-secondary font-bold'>{arrow}</Text>
          </TouchableOpacity>
          <TouchableOpacity className='bg-background-secondary p-4 rounded-xl border border-border flex-row justify-between items-center mb-6' onPress={() => router.push('/notifications')}>
            <Text className='text-text-primary font-bold text-base'>{t('profile.notifications')}</Text>
            <Text className='text-text-secondary font-bold'>{arrow}</Text>
          </TouchableOpacity>
        </View>

        <PreferencesPanel />

        <TouchableOpacity 
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
