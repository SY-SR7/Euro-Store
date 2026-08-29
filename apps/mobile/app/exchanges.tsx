import React, { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { apiFetch } from '../utils/api';
import { ScreenHeader } from '../components/ScreenHeader';
import { usePreferences } from '../contexts/PreferencesContext';
import { exchangeStatusLabel } from '../utils/exchangeStatus';

type Exchange = { id: string; status: string; reason: string; rejection_reason: string | null; created_at: string; resolution_path: string | null };
export default function ExchangesScreen() {
  const [items, setItems] = useState<Exchange[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAr, l, formatDate } = usePreferences();
  const load = async () => { try { const result = await apiFetch<{ data: Exchange[] }>('/api/exchanges'); setItems(result.data); } catch { setItems([]); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, []);
  return <SafeAreaView className='flex-1 bg-background'>
    <ScreenHeader title={l('طلبات الاستبدال', 'Exchange requests')} />
    {loading ? <View className='flex-1 items-center justify-center'><ActivityIndicator size='large' color='#B8860B' /></View> : <ScrollView className='flex-1 px-6' refreshControl={<RefreshControl refreshing={loading} onRefresh={() => { setLoading(true); void load(); }} tintColor='#B8860B' />} contentContainerStyle={{ paddingVertical: 24 }}>
      {!items.length ? <View className='mt-20 items-center'><Text className='mb-2 text-lg font-bold text-text-primary'>{l('لا توجد طلبات استبدال', 'No exchange requests')}</Text><Text className='text-center text-text-secondary'>{l('يمكنك تقديم الطلب من تفاصيل طلب مكتمل أو مستلم ضمن المدة المتاحة.', 'You can request an exchange from an eligible delivered or completed order.')}</Text></View> : items.map((item) => <TouchableOpacity key={item.id} onPress={() => router.push(`/exchanges/${item.id}`)} className='mb-4 rounded-xl border border-border bg-background-secondary p-4'><View className='mb-3 flex-row items-center justify-between'><Text className='font-bold text-primary'>{exchangeStatusLabel(item.status, isAr)}</Text><Text className='text-xs text-text-secondary'>{formatDate(item.created_at, false)}</Text></View><Text className='text-text-primary' numberOfLines={2}>{item.reason}</Text>{item.rejection_reason ? <Text className='mt-2 text-error'>{item.rejection_reason}</Text> : null}</TouchableOpacity>)}
    </ScrollView>}
  </SafeAreaView>;
}
