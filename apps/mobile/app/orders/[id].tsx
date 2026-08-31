import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { apiFetch } from '../../utils/api';
import { apiDownload } from '../../utils/api';
import * as Sharing from 'expo-sharing';
import { ScreenHeader } from '../../components/ScreenHeader';
import { usePreferences } from '../../contexts/PreferencesContext';
import { useAuth } from '../../contexts/AuthContext';
import { orderStatusLabel } from '../../utils/orderStatus';

type OrderItem = {
  id: string;
  product_snapshot: { name_ar?: string; name_en?: string; sku?: string } | null;
  quantity: number;
  unit_price_syp: number;
  total_price_syp: number;
  product_variants: { product_id: string; products?: { slug?: string } | null } | null;
};

type Order = {
  id: string;
  order_number: string;
  status: string;
  subtotal_syp: number;
  discount_syp: number;
  loyalty_discount_syp: number;
  shipping_syp: number;
  total_syp: number;
  address_snapshot: { full_name?: string; phone?: string; governorate?: string; address?: string } | null;
  created_at: string;
  order_items: OrderItem[];
};

export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [reviewItemId, setReviewItemId] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const { isAr, l, formatCurrency, formatDate } = usePreferences();
  const { refreshCart } = useAuth();

  const loadOrder = async () => {
    if (!id) return;
    try { const result = await apiFetch<{ order: Order }>(`/api/orders/${encodeURIComponent(id)}`); setOrder(result.order); } catch { setOrder(null); } finally { setLoading(false); }
  };
  useEffect(() => { void loadOrder(); }, [id]);

  const cancel = () => {
    if (!order) return;
    Alert.alert(l('إلغاء الطلب', 'Cancel order'), l(`هل تريد إلغاء ${order.order_number}؟`, `Cancel ${order.order_number}?`), [{ text: l('تراجع', 'Keep order'), style: 'cancel' }, { text: l('إلغاء الطلب', 'Cancel order'), style: 'destructive', onPress: async () => {
      setWorking(true);
      try { await apiFetch(`/api/orders/${order.id}/cancel`, { method: 'POST' }); await loadOrder(); } catch { Alert.alert(l('تعذر الإلغاء', 'Could not cancel'), l('يمكن إلغاء الطلب أثناء حالة الانتظار فقط.', 'The order can only be cancelled while pending.')); } finally { setWorking(false); }
    } }]);
  };

  const reorder = async () => {
    if (!order) return;
    setWorking(true);
    try { await apiFetch(`/api/orders/${order.id}/reorder`, { method: 'POST' }); await refreshCart(); router.push('/(tabs)/cart'); } catch { Alert.alert(l('تعذر إعادة الطلب', 'Could not reorder'), l('بعض المنتجات لم تعد متوفرة حالياً.', 'Some products are no longer available.')); } finally { setWorking(false); }
  };

  const downloadInvoice = async () => {
    if (!order) return;
    setWorking(true);
    try {
      const uri = await apiDownload(`/api/orders/${order.id}/invoice`, `invoice-${order.order_number}.pdf`);
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: l(`فاتورة ${order.order_number}`, `Invoice ${order.order_number}`) });
      else Alert.alert(l('تم تنزيل الفاتورة', 'Invoice downloaded'), uri);
    } catch { Alert.alert(l('تعذر تنزيل الفاتورة', 'Could not download invoice'), l('حاول مرة أخرى بعد التحقق من الاتصال.', 'Check your connection and try again.')); } finally { setWorking(false); }
  };

  const submitReview = async (item: OrderItem) => {
    const productId = item.product_variants?.product_id;
    if (!order || !productId) { Alert.alert(l('تعذر التقييم', 'Could not review'), l('لم يعد المنتج مرتبطاً بالكتالوج.', 'The product is no longer linked to the catalog.')); return; }
    setWorking(true);
    try {
      await apiFetch('/api/reviews', { method: 'POST', body: JSON.stringify({ product_id: productId, order_id: order.order_number, rating, comment: comment.trim() || null }) });
      setReviewItemId(null); setComment(''); setRating(5); Alert.alert(l('شكراً لك', 'Thank you'), l('أُرسل تقييمك للمراجعة.', 'Your review was submitted for moderation.'));
    } catch { Alert.alert(l('تعذر إرسال التقييم', 'Could not submit review'), l('ربما سبق أن قيّمت هذا المنتج ضمن الطلب.', 'You may already have reviewed this product from the order.')); } finally { setWorking(false); }
  };

  return (
    <SafeAreaView className='flex-1 bg-background'>
      <ScreenHeader title={order?.order_number ?? l('تفاصيل الطلب', 'Order details')} />

      {loading ? (
        <View className='flex-1 items-center justify-center'><ActivityIndicator size='large' color='#B8860B' /></View>
      ) : !order ? (
        <View className='flex-1 items-center justify-center px-6'><Text className='text-center text-text-secondary'>{l('تعذر العثور على الطلب أو لا تملك صلاحية عرضه.', 'The order was not found or you cannot view it.')}</Text></View>
      ) : (
        <ScrollView className='flex-1 px-6' contentContainerStyle={{ paddingTop: 24, paddingBottom: 32 }}>
          <View className='mb-5 rounded-xl border border-border bg-background-secondary p-4'>
            <View className='flex-row justify-between'><Text className='text-text-secondary'>{l('الحالة', 'Status')}</Text><Text className='font-bold text-primary'>{orderStatusLabel(order.status, isAr)}</Text></View>
            <View className='mt-3 flex-row justify-between'><Text className='text-text-secondary'>{l('التاريخ', 'Date')}</Text><Text className='text-text-primary'>{formatDate(order.created_at)}</Text></View>
          </View>

          <Text className='mb-3 text-lg font-bold text-text-primary'>{l('المنتجات', 'Products')}</Text>
          <View className='mb-5 rounded-xl border border-border bg-background-secondary p-4'>
            {order.order_items.map((item) => (
              <View key={item.id} className='mb-5 border-b border-border pb-4'>
                <View className='flex-row justify-between'><View className='me-4 flex-1'><TouchableOpacity accessibilityRole={item.product_variants?.products?.slug ? 'link' : 'text'} disabled={!item.product_variants?.products?.slug} onPress={() => item.product_variants?.products?.slug && router.push(`/products/${encodeURIComponent(item.product_variants.products.slug)}`)}><Text className={`font-bold ${item.product_variants?.products?.slug ? 'text-primary' : 'text-text-primary'}`}>{(isAr ? item.product_snapshot?.name_ar : item.product_snapshot?.name_en) ?? item.product_snapshot?.name_ar ?? item.product_snapshot?.name_en ?? l('منتج', 'Product')}</Text></TouchableOpacity><Text className='mt-1 text-xs text-text-secondary'>{item.product_snapshot?.sku ? `SKU: ${item.product_snapshot.sku} · ` : ''}{item.quantity} × {formatCurrency(Number(item.unit_price_syp))}</Text></View><Text className='font-bold text-primary'>{formatCurrency(Number(item.total_price_syp))}</Text></View>
                {['delivered', 'completed'].includes(order.status) ? <TouchableOpacity onPress={() => router.push({ pathname: '/exchange/new', params: { orderId: order.id, itemId: item.id } })} className='mt-3 rounded-lg border border-primary px-3 py-2'><Text className='text-center font-bold text-primary'>{l('طلب استبدال هذا المنتج', 'Request an exchange')}</Text></TouchableOpacity> : null}
                {order.status === 'completed' && item.product_variants?.product_id ? <TouchableOpacity onPress={() => setReviewItemId(reviewItemId === item.id ? null : item.id)} className='mt-2 rounded-lg border border-border px-3 py-2'><Text className='text-center font-bold text-text-primary'>{l('كتابة تقييم', 'Write a review')}</Text></TouchableOpacity> : null}
                {reviewItemId === item.id ? <View className='mt-3'><View className='mb-3 flex-row justify-center gap-2'>{[1, 2, 3, 4, 5].map((value) => <TouchableOpacity key={value} accessibilityLabel={l(`${value} نجوم`, `${value} stars`)} onPress={() => setRating(value)}><Text className={`text-3xl ${value <= rating ? 'text-primary' : 'text-text-secondary'}`}>★</Text></TouchableOpacity>)}</View><TextInput value={comment} onChangeText={setComment} multiline maxLength={2000} className='mb-3 min-h-20 rounded-lg border border-border bg-background px-3 py-3 text-text-primary' placeholder={l('اكتب رأيك (اختياري)', 'Write your review (optional)')} placeholderTextColor='#737373' /><TouchableOpacity disabled={working} onPress={() => void submitReview(item)} className='rounded-lg bg-primary p-3'><Text className='text-center font-bold text-text-primary'>{l('إرسال التقييم', 'Submit review')}</Text></TouchableOpacity></View> : null}
              </View>
            ))}
          </View>

          <Text className='mb-3 text-lg font-bold text-text-primary'>{l('الحساب', 'Summary')}</Text>
          <View className='mb-5 rounded-xl border border-border bg-background-secondary p-4'>
            <View className='mb-2 flex-row justify-between'><Text className='text-text-secondary'>{l('المجموع الفرعي', 'Subtotal')}</Text><Text className='text-text-primary'>{formatCurrency(Number(order.subtotal_syp))}</Text></View>
            <View className='mb-2 flex-row justify-between'><Text className='text-text-secondary'>{l('الخصم', 'Discount')}</Text><Text className='text-text-primary'>-{formatCurrency(Number(order.discount_syp + order.loyalty_discount_syp))}</Text></View>
            <View className='mb-3 flex-row justify-between'><Text className='text-text-secondary'>{l('الشحن', 'Shipping')}</Text><Text className='text-text-primary'>{formatCurrency(Number(order.shipping_syp))}</Text></View>
            <View className='h-px bg-border' />
            <View className='mt-3 flex-row justify-between'><Text className='text-lg font-bold text-text-primary'>{l('الإجمالي', 'Total')}</Text><Text className='text-xl font-black text-primary'>{formatCurrency(Number(order.total_syp))}</Text></View>
          </View>

          {order.address_snapshot ? (
            <View className='rounded-xl border border-border bg-background-secondary p-4'><Text className='mb-2 text-lg font-bold text-text-primary'>{l('عنوان التوصيل', 'Delivery address')}</Text><Text className='leading-6 text-text-secondary'>{order.address_snapshot.full_name}{'\n'}{order.address_snapshot.phone}{'\n'}{order.address_snapshot.governorate} - {order.address_snapshot.address}</Text></View>
          ) : null}
          <View className='mt-5 gap-3'>
            <TouchableOpacity disabled={working} onPress={() => void downloadInvoice()} className='rounded-xl border border-primary p-4'><Text className='text-center font-bold text-primary'>{l('تنزيل فاتورة PDF', 'Download PDF invoice')}</Text></TouchableOpacity>
            {order.status === 'pending' ? <TouchableOpacity disabled={working} onPress={cancel} className='rounded-xl border border-error bg-error/10 p-4'><Text className='text-center font-bold text-error'>{l('إلغاء الطلب', 'Cancel order')}</Text></TouchableOpacity> : null}
            {order.status === 'completed' ? <TouchableOpacity disabled={working} onPress={() => void reorder()} className='rounded-xl bg-primary p-4'><Text className='text-center font-bold text-text-primary'>{l('إعادة الطلب', 'Reorder')}</Text></TouchableOpacity> : null}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
