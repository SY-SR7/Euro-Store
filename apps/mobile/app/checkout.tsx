import React, { useEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { GOVERNORATES, type GovernorateId } from '@eurostore/shared';
import { useAuth } from '../contexts/AuthContext';
import { useCartStore } from '../store/cartStore';
import { ApiError, apiFetch } from '../utils/api';
import { ScreenHeader } from '../components/ScreenHeader';
import { usePreferences } from '../contexts/PreferencesContext';

type OrderResponse = {
  order: { id: string; order_number: string };
  order_number: string;
};

type SavedAddress = { id: string; label: string; full_name: string; phone: string; governorate: GovernorateId; city: string; street: string; is_default: boolean };
type LoyaltyData = { balance: number; summary: { point_value_syp: number; min_redemption_points: number; max_redemption_pct: number } };
type ShippingData = { base_rate_syp: number; free_shipping_threshold_syp: number | null };

function newIdempotencyKey() {
  return `mobile-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

export default function CheckoutScreen() {
  const { items, totalPrice, clearCart } = useCartStore();
  const { user } = useAuth();
  const { isAr, l, formatCurrency } = usePreferences();
  const requestKey = useRef(newIdempotencyKey());
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [governorate, setGovernorate] = useState<GovernorateId>('damascus');
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [loyalty, setLoyalty] = useState<LoyaltyData | null>(null);
  const [usePoints, setUsePoints] = useState(false);
  const [shipping, setShipping] = useState<ShippingData>({ base_rate_syp: 0, free_shipping_threshold_syp: null });

  useEffect(() => {
    if (!user) {
      Alert.alert(l('تسجيل الدخول مطلوب', 'Sign in required'), l('يمكنك الاحتفاظ بالسلة، لكن إتمام الطلب يتطلب حساباً مفعلاً.', 'Your cart is saved, but checkout requires a verified account.'), [
        { text: l('العودة', 'Back'), style: 'cancel', onPress: () => router.back() },
        { text: l('تسجيل الدخول', 'Sign in'), onPress: () => router.replace('/login') },
      ]);
      return;
    }
    setFullName(String(user.user_metadata?.full_name ?? ''));
    setPhone(String(user.user_metadata?.phone ?? ''));
    void Promise.all([
      apiFetch<SavedAddress[]>('/api/addresses'),
      apiFetch<LoyaltyData>('/api/customer/loyalty'),
    ]).then(([savedAddresses, loyaltyData]) => {
      setAddresses(savedAddresses);
      setLoyalty(loyaltyData);
      const initial = savedAddresses.find((item) => item.is_default) ?? savedAddresses[0];
      if (initial) selectAddress(initial);
    }).catch(() => undefined);
  }, [l, user]);

  useEffect(() => {
    apiFetch<ShippingData>(`/api/checkout/shipping?gov=${encodeURIComponent(governorate)}`)
      .then(setShipping)
      .catch(() => setShipping({ base_rate_syp: 0, free_shipping_threshold_syp: null }));
  }, [governorate]);

  function selectAddress(saved: SavedAddress) {
    setSelectedAddressId(saved.id);
    setFullName(saved.full_name);
    setPhone(saved.phone);
    setGovernorate(saved.governorate);
    setAddress([saved.city, saved.street].filter(Boolean).join(' - '));
  }

  const pointValue = loyalty?.summary.point_value_syp ?? 0;
  const maxPointsByOrder = pointValue > 0 && loyalty
    ? Math.floor((totalPrice() * loyalty.summary.max_redemption_pct / 100) / pointValue)
    : 0;
  const pointsToUse = loyalty ? Math.min(loyalty.balance, maxPointsByOrder) : 0;
  const canUsePoints = Boolean(loyalty && loyalty.balance >= loyalty.summary.min_redemption_points && pointsToUse >= loyalty.summary.min_redemption_points);
  const shippingEstimate = shipping.free_shipping_threshold_syp && totalPrice() >= shipping.free_shipping_threshold_syp ? 0 : Number(shipping.base_rate_syp || 0);

  async function handleCheckout() {
    if (!user) {
      router.replace('/login');
      return;
    }
    if (!items.length) {
      Alert.alert(l('السلة فارغة', 'Empty cart'), l('أضف منتجاً واحداً على الأقل.', 'Add at least one product.'));
      return;
    }
    if (fullName.trim().length < 2 || phone.trim().length < 7 || address.trim().length < 5) {
      Alert.alert(l('تحقق من العنوان', 'Check the address'), l('أدخل الاسم ورقم الهاتف والعنوان الكامل.', 'Enter the name, phone, and full address.'));
      return;
    }

    setLoading(true);
    try {
      const result = await apiFetch<OrderResponse>('/api/orders', {
        method: 'POST',
        headers: { 'Idempotency-Key': requestKey.current },
        body: JSON.stringify({
          ...(selectedAddressId ? { address_id: selectedAddressId } : { address_snapshot: { full_name: fullName.trim(), phone: phone.trim(), governorate, address: address.trim() } }),
          items: items.map((item) => ({
            variant_id: item.variantId,
            quantity: item.quantity,
            item_type: item.itemType,
          })),
          payment_method: 'cod',
          discount_code: couponCode.trim() || undefined,
          loyalty_points_to_use: usePoints && canUsePoints ? pointsToUse : 0,
        }),
      });

      requestKey.current = newIdempotencyKey();
      clearCart();
      Alert.alert(l('تم تثبيت الطلب', 'Order placed'), l(`رقم طلبك: ${result.order_number}`, `Your order number: ${result.order_number}`), [
        { text: l('عرض الطلبات', 'View orders'), onPress: () => router.replace('/orders') },
        { text: l('الرئيسية', 'Home'), onPress: () => router.replace('/(tabs)') },
      ]);
    } catch (error) {
      const code = error instanceof ApiError ? error.code : 'request_failed';
      Alert.alert(l('تعذر إتمام الطلب', 'Could not place order'), checkoutError(code, l));
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className='flex-1 bg-background'>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className='flex-1'>
        <ScreenHeader title={l('إتمام الطلب', 'Checkout')} />

        <ScrollView className='flex-1 px-6' contentContainerStyle={{ paddingTop: 24, paddingBottom: 32 }} keyboardShouldPersistTaps='handled'>
          <Text className='mb-4 text-lg font-bold text-text-primary'>{l('ملخص السلة', 'Cart summary')}</Text>
          <View className='mb-6 rounded-xl border border-border bg-background-secondary p-4'>
            {items.map((item) => (
              <View key={item.id} className='mb-3 flex-row justify-between'>
                <Text className='me-4 flex-1 text-text-primary' numberOfLines={1}>{item.quantity} × {item.title}</Text>
                <Text className='font-bold text-primary'>{formatCurrency(item.price * item.quantity)}</Text>
              </View>
            ))}
            <View className='my-3 h-px bg-border' />
            <View className='flex-row justify-between'>
              <Text className='font-bold text-text-secondary'>{l('المجموع التقديري', 'Estimated subtotal')}</Text>
              <Text className='text-xl font-black text-primary'>{formatCurrency(totalPrice())}</Text>
            </View>
            <Text className='mt-2 text-xs leading-5 text-text-secondary'>{l('يحسب الخادم السعر النهائي والخصم والشحن قبل تثبيت الطلب.', 'The server calculates final prices, discounts, and shipping before placing the order.')}</Text>
          </View>

          <Text className='mb-4 text-lg font-bold text-text-primary'>{l('معلومات التوصيل', 'Delivery information')}</Text>
          {addresses.length ? <><Text className='mb-3 font-bold text-text-primary'>{l('العناوين المحفوظة', 'Saved addresses')}</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} className='mb-4' contentContainerStyle={{ gap: 8 }}>{addresses.map((saved) => <TouchableOpacity key={saved.id} onPress={() => selectAddress(saved)} className={`rounded-lg border px-4 py-3 ${selectedAddressId === saved.id ? 'border-primary bg-primary/10' : 'border-border bg-background-secondary'}`}><Text className={selectedAddressId === saved.id ? 'font-bold text-primary' : 'text-text-primary'}>{saved.label || saved.city || l('عنوان', 'Address')}</Text></TouchableOpacity>)}</ScrollView><TouchableOpacity onPress={() => { setSelectedAddressId(null); setAddress(''); }} className='mb-4 self-start'><Text className='font-bold text-primary'>{l('استخدام عنوان جديد', 'Use a new address')}</Text></TouchableOpacity></> : null}
          <TextInput className='mb-4 rounded-xl border border-border bg-background-secondary px-4 py-4 text-text-primary' placeholder={l('الاسم الكامل', 'Full name')} placeholderTextColor='#737373' value={fullName} onChangeText={setFullName} />
          <TextInput className='mb-4 rounded-xl border border-border bg-background-secondary px-4 py-4 text-text-primary' placeholder={l('رقم الهاتف', 'Phone number')} placeholderTextColor='#737373' value={phone} onChangeText={setPhone} keyboardType='phone-pad' />

          <Text className='mb-3 font-bold text-text-primary'>{l('المحافظة', 'Governorate')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className='mb-4' contentContainerStyle={{ gap: 8 }}>
            {GOVERNORATES.map((item) => (
              <TouchableOpacity key={item.id} onPress={() => { setSelectedAddressId(null); setGovernorate(item.id); }} className={`rounded-lg border px-4 py-3 ${governorate === item.id ? 'border-primary bg-primary' : 'border-border bg-background-secondary'}`}>
                <Text className={`font-bold ${governorate === item.id ? 'text-[#0F0F0F]' : 'text-text-secondary'}`}>{isAr ? item.ar : item.en}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TextInput className='mb-4 min-h-24 rounded-xl border border-border bg-background-secondary px-4 py-4 text-text-primary' placeholder={l('المدينة، المنطقة، الشارع، البناء...', 'City, district, street, building...')} placeholderTextColor='#737373' value={address} onChangeText={setAddress} multiline textAlignVertical='top' />
          <TextInput className='mb-6 rounded-xl border border-border bg-background-secondary px-4 py-4 font-bold text-text-primary' placeholder={l('كود الخصم، إن وجد', 'Discount code, if any')} placeholderTextColor='#737373' value={couponCode} onChangeText={setCouponCode} autoCapitalize='characters' />

          {loyalty ? <TouchableOpacity disabled={!canUsePoints} onPress={() => setUsePoints((value) => !value)} className={`mb-5 flex-row items-center rounded-xl border p-4 ${usePoints ? 'border-primary bg-primary/10' : 'border-border bg-background-secondary'} ${canUsePoints ? '' : 'opacity-50'}`}><View className={`me-3 h-6 w-6 items-center justify-center rounded border ${usePoints ? 'border-primary bg-primary' : 'border-border'}`}><Text className='font-bold text-black'>{usePoints ? '✓' : ''}</Text></View><View className='flex-1'><Text className='font-bold text-text-primary'>{l('استخدام نقاط الولاء', 'Use loyalty points')}</Text><Text className='mt-1 text-xs text-text-secondary'>{canUsePoints ? l(`${pointsToUse.toLocaleString('ar-SY')} نقطة، بقيمة ${formatCurrency(pointsToUse * pointValue)}`, `${pointsToUse.toLocaleString('en-US')} points, worth ${formatCurrency(pointsToUse * pointValue)}`) : l(`تحتاج إلى ${loyalty.summary.min_redemption_points} نقطة على الأقل`, `You need at least ${loyalty.summary.min_redemption_points} points`)}</Text></View></TouchableOpacity> : null}

          <View className='mb-5 rounded-xl border border-border bg-background-secondary p-4'><View className='flex-row justify-between'><Text className='text-text-secondary'>{l('الشحن التقديري', 'Estimated shipping')}</Text><Text className='font-bold text-text-primary'>{shippingEstimate ? formatCurrency(shippingEstimate) : l('مجاني', 'Free')}</Text></View><View className='mt-3 flex-row justify-between'><Text className='font-bold text-text-primary'>{l('الإجمالي التقديري', 'Estimated total')}</Text><Text className='text-lg font-black text-primary'>{formatCurrency(Math.max(0, totalPrice() + shippingEstimate - (usePoints ? pointsToUse * pointValue : 0)))}</Text></View><Text className='mt-2 text-xs text-text-secondary'>{l('يؤكد الخادم السعر والخصم النهائيين عند تثبيت الطلب.', 'The server confirms the final price and discount when the order is placed.')}</Text></View>

          <View className='rounded-xl border border-primary/30 bg-primary/10 p-4'>
            <Text className='text-center font-bold text-primary'>{l('الدفع نقداً عند الاستلام', 'Cash on delivery')}</Text>
          </View>
        </ScrollView>

        <View className='border-t border-border bg-background-secondary p-6'>
          <TouchableOpacity className={`items-center rounded-xl bg-primary py-4 ${loading ? 'opacity-50' : ''}`} onPress={handleCheckout} disabled={loading || !user}>
            <Text className='text-lg font-black text-[#0F0F0F]'>{loading ? l('جاري تثبيت الطلب...', 'Placing order...') : l('تأكيد الطلب', 'Place order')}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function checkoutError(code: string, l: (arabic: string, english: string) => string) {
  const messages: Record<string, string> = {
    email_not_verified: l('يجب تفعيل البريد الإلكتروني قبل إنشاء الطلب.', 'Verify your email before placing an order.'),
    invalid_discount_code: l('كود الخصم غير صالح.', 'The discount code is invalid.'),
    discount_expired: l('انتهت صلاحية كود الخصم.', 'The discount code has expired.'),
    discount_not_started: l('لم يبدأ كود الخصم بعد.', 'The discount code is not active yet.'),
    discount_usage_limit_reached: l('وصل كود الخصم إلى حد الاستخدام.', 'The discount code usage limit was reached.'),
    discount_user_usage_limit_reached: l('استخدمت هذا الكود بالعدد الأقصى المسموح.', 'You have reached the usage limit for this code.'),
    discount_scope_mismatch: l('هذا الخصم لا يشمل المنتجات الموجودة في السلة.', 'This discount does not apply to the products in your cart.'),
    min_order_value_not_met: l('قيمة السلة أقل من الحد الأدنى للطلب.', 'The cart is below the minimum order value.'),
    catalog_item_unavailable: l('تغير توفر أحد المنتجات. راجع السلة وحاول مجدداً.', 'A product availability changed. Review your cart and try again.'),
    database_error: l('تعذر تثبيت الطلب الآن. لم يتم خصم أي مبلغ، حاول مجدداً.', 'The order could not be placed. Nothing was charged; please try again.'),
  };
  return messages[code] ?? l('تحقق من الاتصال ثم حاول مجدداً.', 'Check your connection and try again.');
}
