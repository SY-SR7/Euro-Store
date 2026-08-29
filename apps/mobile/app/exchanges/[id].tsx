import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { apiFetch } from '../../utils/api';
import { ScreenHeader } from '../../components/ScreenHeader';
import { usePreferences } from '../../contexts/PreferencesContext';
import { exchangeStatusLabel } from '../../utils/exchangeStatus';

type Exchange = {
  id: string; status: string; reason: string; customer_whatsapp: string; resolution_path: string | null;
  qr_code_url: string | null; qr_code_expires_at: string | null; qr_code_used_at: string | null; rejection_reason: string | null;
  created_at: string; exchange_request_images: Array<{ id: string; url: string }>;
  order_items: { product_snapshot: { name_ar?: string; name_en?: string; sku?: string } | null } | null;
};
export default function ExchangeDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [item, setItem] = useState<Exchange | null>(null);
  const [loading, setLoading] = useState(true);
  const { isAr, l, formatDate } = usePreferences();
  useEffect(() => { if (!id) return; apiFetch<{ exchange_request: Exchange }>(`/api/exchanges/${encodeURIComponent(id)}`).then((value) => setItem(value.exchange_request)).catch(() => setItem(null)).finally(() => setLoading(false)); }, [id]);
  return <SafeAreaView className='flex-1 bg-background'>
    <ScreenHeader title={l('تفاصيل الاستبدال', 'Exchange details')} />
    {loading ? <View className='flex-1 items-center justify-center'><ActivityIndicator size='large' color='#B8860B' /></View> : !item ? <View className='flex-1 items-center justify-center'><Text className='text-text-secondary'>{l('تعذر تحميل الطلب.', 'The request could not be loaded.')}</Text></View> : <ScrollView className='flex-1 px-6' contentContainerStyle={{ paddingVertical: 24 }}>
      <View className='mb-5 rounded-xl border border-primary/40 bg-background-secondary p-4'><Text className='text-sm text-text-secondary'>{l('الحالة الحالية', 'Current status')}</Text><Text className='mt-2 text-xl font-black text-primary'>{exchangeStatusLabel(item.status, isAr)}</Text></View>
      <View className='mb-5 rounded-xl border border-border bg-background-secondary p-4'><Text className='mb-2 font-bold text-text-primary'>{(isAr ? item.order_items?.product_snapshot?.name_ar : item.order_items?.product_snapshot?.name_en) ?? item.order_items?.product_snapshot?.name_ar ?? item.order_items?.product_snapshot?.name_en ?? l('المنتج', 'Product')}</Text><Text className='leading-6 text-text-secondary'>{item.reason}</Text><Text className='mt-2 text-xs text-text-secondary'>{formatDate(item.created_at)}</Text></View>
      {item.rejection_reason ? <View className='mb-5 rounded-xl border border-error/50 bg-error/10 p-4'><Text className='mb-1 font-bold text-error'>{l('سبب الرفض', 'Rejection reason')}</Text><Text className='text-text-primary'>{item.rejection_reason}</Text></View> : null}
      {item.qr_code_url && !item.qr_code_used_at ? <View className='mb-6 items-center'><Text className='mb-3 text-lg font-bold text-text-primary'>{l('رمز الاستبدال', 'Exchange code')}</Text><View className='rounded-xl bg-white p-4'><Image source={{ uri: item.qr_code_url }} className='h-60 w-60' resizeMode='contain' accessibilityLabel={l('رمز الاستبدال', 'Exchange QR code')} /></View>{item.qr_code_expires_at ? <Text className='mt-3 text-center text-text-secondary'>{l(`صالح حتى ${formatDate(item.qr_code_expires_at)}`, `Valid until ${formatDate(item.qr_code_expires_at)}`)}</Text> : null}</View> : null}
      {item.exchange_request_images.length ? <><Text className='mb-3 text-lg font-bold text-text-primary'>{l('صور الإثبات', 'Evidence images')}</Text><ScrollView horizontal showsHorizontalScrollIndicator={false}>{item.exchange_request_images.map((image) => <Image key={image.id} source={{ uri: image.url }} className='me-3 h-32 w-32 rounded-lg bg-background-secondary' resizeMode='cover' />)}</ScrollView></> : null}
    </ScrollView>}
  </SafeAreaView>;
}
