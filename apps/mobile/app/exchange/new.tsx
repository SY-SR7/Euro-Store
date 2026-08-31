import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { apiFetch } from '../../utils/api';
import { ScreenHeader } from '../../components/ScreenHeader';
import { usePreferences } from '../../contexts/PreferencesContext';

type SelectedImage = { uri: string; mimeType: string; fileName: string };
type EligibleOrderItem = { id: string; quantity: number; product_snapshot: { name_ar?: string; name_en?: string; product_name_ar?: string; product_name_en?: string; sku?: string } | null };
type EligibleOrder = { id: string; order_number: string; status: string; total_syp: number; created_at: string; order_items: EligibleOrderItem[] };

export default function NewExchangeScreen() {
  const params = useLocalSearchParams<{ orderId?: string; itemId?: string }>();
  const [orderId, setOrderId] = useState(params.orderId ?? '');
  const [itemId, setItemId] = useState(params.itemId ?? '');
  const [orders, setOrders] = useState<EligibleOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [reason, setReason] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [images, setImages] = useState<SelectedImage[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { isAr, l, formatCurrency, formatDate } = usePreferences();

  useEffect(() => {
    void Promise.all([
      apiFetch<{ profile: { phone: string | null } }>('/api/profile').then(({ profile }) => setWhatsapp(profile.phone ?? '')),
      apiFetch<{ data: EligibleOrder[] }>('/api/orders').then(({ data }) => setOrders(data.filter((order) => ['delivered', 'completed'].includes(order.status)))),
    ]).catch(() => undefined).finally(() => setLoadingOrders(false));
  }, []);

  const pickImages = async (camera = false) => {
    if (camera) {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) { Alert.alert(l('إذن الكاميرا مطلوب', 'Camera permission required'), l('اسمح باستخدام الكاميرا لالتقاط صورة لحالة المنتج.', 'Allow camera access to photograph the product condition.')); return; }
      const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.85 });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) { setError(l('حجم كل صورة يجب ألا يتجاوز 5 ميغابايت.', 'Each image must be 5 MB or smaller.')); return; }
      setImages((current) => [...current, { uri: asset.uri, mimeType: asset.mimeType || 'image/jpeg', fileName: asset.fileName || `exchange-${Date.now()}.jpg` }].slice(0, 3));
      return;
    }
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { Alert.alert(l('إذن الصور مطلوب', 'Photo permission required'), l('اسمح بالوصول إلى الصور لإرفاق إثبات حالة المنتج.', 'Allow photo access to attach evidence of the product condition.')); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsMultipleSelection: true, selectionLimit: Math.max(1, 3 - images.length), quality: 0.85 });
    if (result.canceled) return;
    if (result.assets.some((asset) => asset.fileSize && asset.fileSize > 5 * 1024 * 1024)) { setError(l('حجم كل صورة يجب ألا يتجاوز 5 ميغابايت.', 'Each image must be 5 MB or smaller.')); return; }
    const selected = result.assets.slice(0, 3 - images.length).map((asset, index) => ({ uri: asset.uri, mimeType: asset.mimeType && ['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(asset.mimeType) ? asset.mimeType : 'image/jpeg', fileName: asset.fileName || `exchange-${Date.now()}-${index}.jpg` }));
    setImages((current) => [...current, ...selected].slice(0, 3));
  };

  const submit = async () => {
    setError('');
    if (!orderId || !itemId || reason.trim().length < 2 || whatsapp.trim().length < 7 || !images.length) { setError(l('اختر الطلب والمنتج، وأدخل السبب ورقم واتساب، وأرفق صورة واحدة على الأقل.', 'Choose an order and item, enter the reason and WhatsApp number, and attach at least one image.')); return; }
    const form = new FormData();
    form.append('order_item_id', itemId);
    form.append('reason', reason.trim());
    form.append('customer_whatsapp', whatsapp.trim());
    images.forEach((image) => form.append('images', { uri: image.uri, name: image.fileName, type: image.mimeType } as unknown as Blob));
    setSubmitting(true);
    try {
      const result = await apiFetch<{ exchange_request: { id: string } }>(`/api/orders/${encodeURIComponent(orderId)}/exchange`, { method: 'POST', body: form });
      router.replace(`/exchanges/${result.exchange_request.id}`);
    } catch { setError(l('قد تكون المهلة منتهية أو تم بلوغ حد الاستبدال. تحقق من الصور وحاول مجدداً.', 'The deadline or exchange limit may have passed. Check the images and try again.')); } finally { setSubmitting(false); }
  };

  const selectedOrder = orders.find((order) => order.id === orderId);
  const itemLabel = (item: EligibleOrderItem) => {
    const snapshot = item.product_snapshot ?? {};
    const name = isAr ? snapshot.name_ar ?? snapshot.product_name_ar : snapshot.name_en ?? snapshot.product_name_en;
    return `${name ?? l('منتج من الطلب', 'Order item')}${snapshot.sku ? ` · ${snapshot.sku}` : ''} × ${item.quantity}`;
  };

  return <SafeAreaView className='flex-1 bg-background'>
    <ScreenHeader title={l('طلب استبدال', 'Exchange request')} />
    <ScrollView className='flex-1 px-6' contentContainerStyle={{ paddingVertical: 24 }} keyboardShouldPersistTaps='handled'>
      {error ? <View accessibilityRole='alert' className='mb-5 rounded-xl border border-error/30 bg-error/10 p-4'><Text className='font-bold text-error'>{error}</Text></View> : null}
      {loadingOrders ? <ActivityIndicator color='#B8860B' /> : !orders.length ? <View className='mb-6 rounded-xl border border-border bg-background-card p-6'><Text className='text-center text-text-secondary'>{l('لا توجد طلبات مسلّمة مؤهلة للاستبدال.', 'There are no delivered orders eligible for exchange.')}</Text><TouchableOpacity onPress={() => router.push('/products')} className='mt-4 rounded-xl bg-primary py-3'><Text className='text-center font-bold text-text-primary'>{l('تسوق الآن', 'Shop now')}</Text></TouchableOpacity></View> : <>
        <Text className='mb-2 font-bold text-text-primary'>{l('اختر الطلب', 'Choose order')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className='mb-5' contentContainerStyle={{ gap: 8 }}>{orders.map((order) => <TouchableOpacity key={order.id} accessibilityState={{ selected: orderId === order.id }} onPress={() => { setOrderId(order.id); setItemId(''); }} className={`min-w-52 rounded-xl border p-4 ${orderId === order.id ? 'border-primary bg-primary/10' : 'border-border bg-background-card'}`}><Text className='font-bold text-text-primary'>#{order.order_number}</Text><Text className='mt-1 text-xs text-text-secondary'>{formatCurrency(Number(order.total_syp))} · {formatDate(order.created_at, false)}</Text></TouchableOpacity>)}</ScrollView>
        <Text className='mb-2 font-bold text-text-primary'>{l('المنتج المطلوب استبداله', 'Item to exchange')}</Text>
        <View className='mb-5 gap-2'>{(selectedOrder?.order_items ?? []).map((item) => <TouchableOpacity key={item.id} accessibilityState={{ selected: itemId === item.id }} onPress={() => setItemId(item.id)} className={`min-h-12 justify-center rounded-xl border px-4 ${itemId === item.id ? 'border-primary bg-primary/10' : 'border-border bg-background-card'}`}><Text className={`font-bold ${itemId === item.id ? 'text-primary' : 'text-text-primary'}`}>{itemLabel(item)}</Text></TouchableOpacity>)}</View>
      </>}
      <Text className='mb-2 font-bold text-text-primary'>{l('سبب الاستبدال', 'Exchange reason')}</Text><TextInput value={reason} onChangeText={setReason} multiline className='mb-5 min-h-28 rounded-xl border border-border bg-background-secondary px-4 py-4 text-text-primary' placeholder={l('اشرح سبب الاستبدال وحالة المنتج', 'Describe the reason and product condition')} placeholderTextColor='#737373' />
      <Text className='mb-2 font-bold text-text-primary'>{l('رقم واتساب للتواصل', 'WhatsApp contact number')}</Text><TextInput value={whatsapp} onChangeText={setWhatsapp} keyboardType='phone-pad' className='mb-5 rounded-xl border border-border bg-background-secondary px-4 py-4 text-text-primary' placeholder='09xxxxxxxx' placeholderTextColor='#737373' />
      <View className='mb-3'><Text className='mb-3 font-bold text-text-primary'>{l(`صور حالة المنتج (${images.length}/3)`, `Product condition images (${images.length}/3)`)}</Text><View className='flex-row gap-2'><TouchableOpacity disabled={images.length >= 3} onPress={() => void pickImages(false)} className='flex-1 rounded-lg border border-primary px-3 py-3'><Text className='text-center font-bold text-primary'>{l('اختيار صور', 'Choose images')}</Text></TouchableOpacity><TouchableOpacity disabled={images.length >= 3} onPress={() => void pickImages(true)} className='flex-1 rounded-lg border border-primary px-3 py-3'><Text className='text-center font-bold text-primary'>{l('التقاط صورة', 'Take photo')}</Text></TouchableOpacity></View></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className='mb-8'>{images.map((image, index) => <TouchableOpacity key={`${image.uri}-${index}`} onPress={() => setImages((current) => current.filter((_, itemIndex) => itemIndex !== index))}><Image source={{ uri: image.uri }} className='me-3 h-28 w-28 rounded-lg bg-background-secondary' resizeMode='cover' /><View className='absolute end-1 top-1 h-6 w-6 items-center justify-center rounded-full bg-black/70'><Text className='font-bold text-white'>×</Text></View></TouchableOpacity>)}</ScrollView>
      <Text className='mb-6 leading-6 text-text-secondary'>{l('يجب أن يكون المنتج غير مستخدم وبحالته الأصلية مع الملصقات. يراجع الفريق الطلب قبل الموافقة وإصدار رمز الاستبدال.', 'The product must be unused, in its original condition, and have its tags. The team reviews the request before issuing an exchange code.')}</Text>
      <TouchableOpacity disabled={submitting} onPress={submit} className={`rounded-xl bg-primary p-4 ${submitting ? 'opacity-60' : ''}`}>{submitting ? <ActivityIndicator color='#1C1917' /> : <Text className='text-center text-lg font-bold text-text-primary'>{l('إرسال الطلب', 'Submit request')}</Text>}</TouchableOpacity>
    </ScrollView>
  </SafeAreaView>;
}
