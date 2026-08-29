import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../utils/api';
import { ScreenHeader } from '../components/ScreenHeader';
import { usePreferences } from '../contexts/PreferencesContext';
import { router } from 'expo-router';

type Notification = {
  id: string;
  title_ar: string;
  title_en: string;
  body_ar: string;
  body_en: string;
  is_read: boolean;
  created_at: string;
};

export default function NotificationsScreen() {
  const { user } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { isAr, l, formatDate } = usePreferences();

  const load = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const result = await apiFetch<{ data: Notification[] }>('/api/notifications');
      setItems(result.data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  async function markRead(item: Notification) {
    if (item.is_read) return;
    setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, is_read: true } : entry));
    await apiFetch(`/api/notifications/${item.id}/read`, { method: 'PUT' }).catch(() => {
      setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, is_read: false } : entry));
    });
  }

  async function markAllRead() {
    const previous = items;
    setItems((current) => current.map((item) => ({ ...item, is_read: true })));
    await apiFetch('/api/notifications/read-all', { method: 'PUT' }).catch(() => setItems(previous));
  }

  return (
    <SafeAreaView className='flex-1 bg-background'>
      <ScreenHeader title={l('الإشعارات', 'Notifications')} action={items.some((item) => !item.is_read) ? <TouchableOpacity onPress={markAllRead}><Text className='font-bold text-primary'>{l('قراءة الكل', 'Read all')}</Text></TouchableOpacity> : null} />

      {!user ? (
        <View className='flex-1 items-center justify-center px-6'><Text className='mb-5 text-center text-text-primary'>{l('سجّل الدخول لعرض إشعاراتك.', 'Sign in to view your notifications.')}</Text><TouchableOpacity className='w-full rounded-xl bg-primary p-4' onPress={() => router.replace('/login')}><Text className='text-center font-bold text-[#0F0F0F]'>{l('تسجيل الدخول', 'Sign in')}</Text></TouchableOpacity></View>
      ) : loading ? (
        <View className='flex-1 items-center justify-center'><ActivityIndicator size='large' color='#B8860B' /></View>
      ) : (
        <ScrollView className='flex-1 px-6' contentContainerStyle={{ paddingTop: 24, paddingBottom: 32 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} tintColor='#B8860B' />}>
          {items.length === 0 ? <Text className='py-20 text-center text-text-secondary'>{l('لا توجد إشعارات.', 'No notifications.')}</Text> : items.map((item) => (
            <TouchableOpacity key={item.id} onPress={() => markRead(item)} className={`mb-3 rounded-xl border p-4 ${item.is_read ? 'border-border bg-background-secondary' : 'border-primary/50 bg-primary/10'}`}>
              <View className='mb-2 flex-row items-center justify-between'><Text className='flex-1 font-bold text-text-primary'>{isAr ? item.title_ar : item.title_en}</Text>{!item.is_read && <View className='h-2 w-2 rounded-full bg-primary' />}</View>
              <Text className='mb-3 leading-6 text-text-secondary'>{isAr ? item.body_ar : item.body_en}</Text>
              <Text className='text-xs text-text-secondary'>{formatDate(item.created_at)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
