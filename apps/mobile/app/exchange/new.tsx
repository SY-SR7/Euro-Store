import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { apiFetch } from '../../utils/api';
import { ScreenHeader } from '../../components/ScreenHeader';
import { usePreferences } from '../../contexts/PreferencesContext';

type SelectedImage = { uri: string; mimeType: string; fileName: string };

export default function NewExchangeScreen() {
  const { orderId, itemId } = useLocalSearchParams<{ orderId: string; itemId: string }>();
  const [reason, setReason] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [images, setImages] = useState<SelectedImage[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const { l } = usePreferences();

  useEffect(() => { apiFetch<{ profile: { phone: string | null } }>('/api/profile').then(({ profile }) => setWhatsapp(profile.phone ?? '')).catch(() => undefined); }, []);

  const pickImages = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { Alert.alert(l('إذن الصور مطلوب', 'Photo permission required'), l('اسمح بالوصول إلى الصور لإرفاق إثبات حالة المنتج.', 'Allow photo access to attach evidence of the product condition.')); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsMultipleSelection: true, selectionLimit: Math.max(1, 3 - images.length), quality: 0.85 });
    if (result.canceled) return;
    const selected = result.assets.slice(0, 3 - images.length).map((asset, index) => ({ uri: asset.uri, mimeType: asset.mimeType && ['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(asset.mimeType) ? asset.mimeType : 'image/jpeg', fileName: asset.fileName || `exchange-${Date.now()}-${index}.jpg` }));
    setImages((current) => [...current, ...selected].slice(0, 3));
  };

  const submit = async () => {
    if (!orderId || !itemId || reason.trim().length < 2 || whatsapp.trim().length < 7 || !images.length) { Alert.alert(l('بيانات ناقصة', 'Missing information'), l('أدخل السبب ورقم واتساب وأرفق صورة واحدة على الأقل.', 'Enter a reason, WhatsApp number, and at least one image.')); return; }
    const form = new FormData();
    form.append('order_item_id', itemId);
    form.append('reason', reason.trim());
    form.append('customer_whatsapp', whatsapp.trim());
    images.forEach((image) => form.append('images', { uri: image.uri, name: image.fileName, type: image.mimeType } as unknown as Blob));
    setSubmitting(true);
    try {
      const result = await apiFetch<{ exchange_request: { id: string } }>(`/api/orders/${encodeURIComponent(orderId)}/exchange`, { method: 'POST', body: form });
      router.replace(`/exchanges/${result.exchange_request.id}`);
    } catch { Alert.alert(l('تعذر إرسال الطلب', 'Could not submit request'), l('قد تكون المهلة منتهية أو تم بلوغ حد الاستبدال. تحقق من الصور وحاول مجدداً.', 'The deadline or exchange limit may have passed. Check the images and try again.')); } finally { setSubmitting(false); }
  };

  return <SafeAreaView className='flex-1 bg-background'>
    <ScreenHeader title={l('طلب استبدال', 'Exchange request')} />
    <ScrollView className='flex-1 px-6' contentContainerStyle={{ paddingVertical: 24 }} keyboardShouldPersistTaps='handled'>
      <Text className='mb-2 font-bold text-text-primary'>{l('سبب الاستبدال', 'Exchange reason')}</Text><TextInput value={reason} onChangeText={setReason} multiline className='mb-5 min-h-28 rounded-xl border border-border bg-background-secondary px-4 py-4 text-text-primary' placeholder={l('اشرح سبب الاستبدال وحالة المنتج', 'Describe the reason and product condition')} placeholderTextColor='#737373' />
      <Text className='mb-2 font-bold text-text-primary'>{l('رقم واتساب للتواصل', 'WhatsApp contact number')}</Text><TextInput value={whatsapp} onChangeText={setWhatsapp} keyboardType='phone-pad' className='mb-5 rounded-xl border border-border bg-background-secondary px-4 py-4 text-text-primary' placeholder='09xxxxxxxx' placeholderTextColor='#737373' />
      <View className='mb-3 flex-row items-center justify-between'><Text className='font-bold text-text-primary'>{l(`صور حالة المنتج (${images.length}/3)`, `Product condition images (${images.length}/3)`)}</Text><TouchableOpacity disabled={images.length >= 3} onPress={pickImages} className='rounded-lg border border-primary px-4 py-2'><Text className='font-bold text-primary'>{l('اختيار صور', 'Choose images')}</Text></TouchableOpacity></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className='mb-8'>{images.map((image, index) => <TouchableOpacity key={`${image.uri}-${index}`} onPress={() => setImages((current) => current.filter((_, itemIndex) => itemIndex !== index))}><Image source={{ uri: image.uri }} className='me-3 h-28 w-28 rounded-lg bg-background-secondary' resizeMode='cover' /><View className='absolute end-1 top-1 h-6 w-6 items-center justify-center rounded-full bg-black/70'><Text className='font-bold text-white'>×</Text></View></TouchableOpacity>)}</ScrollView>
      <Text className='mb-6 leading-6 text-text-secondary'>{l('يجب أن يكون المنتج غير مستخدم وبحالته الأصلية مع الملصقات. يراجع الفريق الطلب قبل الموافقة وإصدار رمز الاستبدال.', 'The product must be unused, in its original condition, and have its tags. The team reviews the request before issuing an exchange code.')}</Text>
      <TouchableOpacity disabled={submitting} onPress={submit} className={`rounded-xl bg-primary p-4 ${submitting ? 'opacity-60' : ''}`}>{submitting ? <ActivityIndicator color='#0F0F0F' /> : <Text className='text-center text-lg font-bold text-[#0F0F0F]'>{l('إرسال الطلب', 'Submit request')}</Text>}</TouchableOpacity>
    </ScrollView>
  </SafeAreaView>;
}
