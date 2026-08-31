import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { apiFetch } from '../../utils/api';
import { ScreenHeader } from '../../components/ScreenHeader';
import { usePreferences } from '../../contexts/PreferencesContext';
import { exchangeStatusLabel } from '../../utils/exchangeStatus';

type Exchange = {
  id: string; status: string; reason: string; customer_whatsapp: string; resolution_path: string | null; partner_stage: string | null;
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
  const saveQr = async () => {
    if (!item?.qr_code_url) return;
    const result = await FileSystem.downloadAsync(item.qr_code_url, `${FileSystem.cacheDirectory}exchange-${item.id}.png`);
    if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(result.uri, { mimeType: 'image/png', dialogTitle: l('حفظ رمز الاستبدال', 'Save exchange QR') });
  };
  const steps = item ? exchangeSteps(item, l) : [];
  return <SafeAreaView className='flex-1 bg-background'>
    <ScreenHeader title={l('تفاصيل الاستبدال', 'Exchange details')} />
    {loading ? <View className='flex-1 items-center justify-center'><ActivityIndicator size='large' color='#B8860B' /></View> : !item ? <View className='flex-1 items-center justify-center'><Text className='text-text-secondary'>{l('تعذر تحميل الطلب.', 'The request could not be loaded.')}</Text></View> : <ScrollView className='flex-1 px-6' contentContainerStyle={{ paddingVertical: 24 }}>
      <View className='mb-5 rounded-xl border border-primary/40 bg-background-secondary p-4'><Text className='text-sm text-text-secondary'>{l('الحالة الحالية', 'Current status')}</Text><Text className='mt-2 text-xl font-black text-primary'>{exchangeStatusLabel(item.status, isAr)}</Text></View>
      {item.status !== 'rejected' ? <View className='mb-5 rounded-xl border border-border bg-background-card p-4'><Text className='mb-4 font-bold text-text-secondary'>{l('مسار الطلب', 'Request timeline')}</Text>{steps.map((step, index) => <View key={step.key} className='flex-row'><View className='items-center'><View className={`h-8 w-8 items-center justify-center rounded-full border-2 ${step.done ? 'border-primary bg-primary/10' : 'border-border bg-background'}`}><Text className={`font-black ${step.done ? 'text-primary' : 'text-text-muted'}`}>{step.done ? '✓' : index + 1}</Text></View>{index < steps.length - 1 ? <View className={`h-8 w-0.5 ${step.done ? 'bg-primary/50' : 'bg-border'}`} /> : null}</View><Text className={`ms-3 pt-1.5 font-bold ${step.done ? 'text-primary' : 'text-text-muted'}`}>{step.label}</Text></View>)}</View> : null}
      <View className='mb-5 rounded-xl border border-border bg-background-secondary p-4'><Text className='mb-2 font-bold text-text-primary'>{(isAr ? item.order_items?.product_snapshot?.name_ar : item.order_items?.product_snapshot?.name_en) ?? item.order_items?.product_snapshot?.name_ar ?? item.order_items?.product_snapshot?.name_en ?? l('المنتج', 'Product')}</Text><Text className='leading-6 text-text-secondary'>{item.reason}</Text><Text className='mt-2 text-xs text-text-secondary'>{formatDate(item.created_at)}</Text></View>
      {item.resolution_path ? <View className='mb-5 rounded-xl border border-border bg-background-card p-4'><Text className='text-xs text-text-muted'>{l('طريقة الاستلام', 'Receipt method')}</Text><Text className='mt-1 font-bold text-text-primary'>{item.resolution_path === 'partner' ? l('متجر الشريك', 'Partner store') : l('الفرع الرئيسي', 'Main branch')}</Text></View> : null}
      {item.rejection_reason ? <View className='mb-5 rounded-xl border border-error/50 bg-error/10 p-4'><Text className='mb-1 font-bold text-error'>{l('سبب الرفض', 'Rejection reason')}</Text><Text className='text-text-primary'>{item.rejection_reason}</Text></View> : null}
      {item.qr_code_used_at ? <View className='mb-6 rounded-xl border border-success/30 bg-success/10 p-4'><Text className='font-bold text-success'>{l('تم استخدام رمز الاستبدال', 'Exchange QR has been used')}</Text><Text className='mt-1 text-sm text-text-secondary'>{formatDate(item.qr_code_used_at)}</Text></View> : item.qr_code_url && (!item.qr_code_expires_at || new Date(item.qr_code_expires_at) > new Date()) ? <View className='mb-6 items-center'><Text className='mb-3 text-lg font-bold text-text-primary'>{l('رمز الاستبدال', 'Exchange code')}</Text><View className='rounded-xl bg-white p-4'><Image source={{ uri: item.qr_code_url }} className='h-60 w-60' resizeMode='contain' accessibilityLabel={l('رمز الاستبدال', 'Exchange QR code')} /></View>{item.qr_code_expires_at ? <Text className='mt-3 text-center text-text-secondary'>{l(`صالح حتى ${formatDate(item.qr_code_expires_at)}`, `Valid until ${formatDate(item.qr_code_expires_at)}`)}</Text> : null}<TouchableOpacity accessibilityRole='button' onPress={() => void saveQr()} className='mt-4 min-h-12 items-center justify-center rounded-xl border border-primary px-6'><Text className='font-bold text-primary'>{l('حفظ أو مشاركة الرمز', 'Save or share QR')}</Text></TouchableOpacity></View> : item.qr_code_expires_at && new Date(item.qr_code_expires_at) <= new Date() ? <View className='mb-6 rounded-xl border border-warning/30 bg-warning/10 p-4'><Text className='font-bold text-warning'>{l('انتهت صلاحية الرمز. تواصل معنا للمساعدة.', 'The QR has expired. Contact us for help.')}</Text></View> : null}
      {item.exchange_request_images.length ? <><Text className='mb-3 text-lg font-bold text-text-primary'>{l('صور الإثبات', 'Evidence images')}</Text><ScrollView horizontal showsHorizontalScrollIndicator={false}>{item.exchange_request_images.map((image) => <Image key={image.id} source={{ uri: image.url }} className='me-3 h-32 w-32 rounded-lg bg-background-secondary' resizeMode='cover' />)}</ScrollView></> : null}
      <View className='mt-8 flex-row gap-3'><TouchableOpacity accessibilityRole='button' onPress={() => router.push('/exchanges')} className='min-h-12 flex-1 items-center justify-center rounded-xl border border-border'><Text className='font-bold text-text-secondary'>{l('كل الطلبات', 'All requests')}</Text></TouchableOpacity><TouchableOpacity accessibilityRole='button' onPress={() => router.push('/contact')} className='min-h-12 flex-1 items-center justify-center rounded-xl border border-primary bg-primary/10'><Text className='font-bold text-primary'>{l('تواصل معنا', 'Contact us')}</Text></TouchableOpacity></View>
    </ScrollView>}
  </SafeAreaView>;
}

function exchangeSteps(item: Exchange, l: (ar: string, en: string) => string) {
  const steps = item.resolution_path === 'partner'
    ? [
        ['pending', l('قيد المراجعة', 'Pending review')],
        ['approved', l('تمت الموافقة', 'Approved')],
        ['received_from_customer', l('استلم متجر الشريك المنتج', 'Partner received item')],
        ['ready_for_pickup', l('جاهز للاستلام', 'Ready for pickup')],
        ['item_received_by_shipping', l('استلمته شركة الشحن', 'Received by shipping')],
        ['completed', l('مكتمل', 'Completed')],
      ]
    : [['pending', l('قيد المراجعة', 'Pending review')], ['approved', l('تمت الموافقة', 'Approved')], ['completed', l('مكتمل', 'Completed')]];
  const effective = item.status === 'approved' && item.resolution_path === 'partner'
    ? item.partner_stage === 'picked_up_by_delivery' ? 'item_received_by_shipping' : item.partner_stage ?? 'approved'
    : item.status;
  const current = Math.max(0, steps.findIndex(([key]) => key === effective));
  return steps.map(([key, label], index) => ({ key, label, done: index <= current }));
}
