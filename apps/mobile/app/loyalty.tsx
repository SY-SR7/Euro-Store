import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Share, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { apiFetch } from '../utils/api';
import { ScreenHeader } from '../components/ScreenHeader';
import { usePreferences } from '../contexts/PreferencesContext';
import { useAuth } from '../contexts/AuthContext';

type LoyaltyResponse = {
  customer: { full_name: string; referral_code: string | null; qr_code_url: string | null };
  balance: number;
  summary: { point_value_syp: number; earn_amount_syp: number; earn_points: number; min_redemption_points: number; max_redemption_pct: number; redeemable_value_syp: number };
  recent_transactions: Array<{ id: string; type: string; points: number; balance_after: number; notes: string | null; created_at: string }>;
};

export default function LoyaltyScreen() {
  const { user } = useAuth();
  const [data, setData] = useState<LoyaltyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [referralBonus, setReferralBonus] = useState(0);
  const { l, formatCurrency, formatDate } = usePreferences();
  useEffect(() => {
    if (!user) { setLoading(false); return; }
    void Promise.all([
      apiFetch<LoyaltyResponse>('/api/customer/loyalty').then(setData),
      apiFetch<{ referral_bonus_points?: number }>('/api/loyalty/settings').then((settings) => setReferralBonus(Number(settings.referral_bonus_points ?? 0))),
    ]).catch(() => setData(null)).finally(() => setLoading(false));
  }, [user]);

  const saveQr = async () => {
    if (!data?.customer.qr_code_url) return;
    const result = await FileSystem.downloadAsync(data.customer.qr_code_url, `${FileSystem.cacheDirectory}eurostore-loyalty-qr.png`);
    if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(result.uri, { mimeType: 'image/png', dialogTitle: l('حفظ رمز الولاء', 'Save loyalty QR') });
  };

  return <SafeAreaView className='flex-1 bg-background'>
    <ScreenHeader title={l('نقاط الولاء', 'Loyalty points')} />
    {!user ? <View className='flex-1 items-center justify-center px-6'><Text className='mb-3 text-xl font-bold text-text-primary'>{l('سجّل الدخول لعرض نقاطك ورمز الولاء.', 'Sign in to view your points and loyalty QR.')}</Text><TouchableOpacity onPress={() => router.push('/login')} className='mt-4 min-h-12 w-full items-center justify-center rounded-xl bg-primary'><Text className='font-bold text-text-primary'>{l('تسجيل الدخول', 'Sign in')}</Text></TouchableOpacity></View> : loading ? <View className='flex-1 items-center justify-center'><ActivityIndicator size='large' color='#B8860B' /></View> : !data ? <View className='flex-1 items-center justify-center px-6'><Text className='text-center text-text-secondary'>{l('تعذر تحميل حساب الولاء.', 'The loyalty account could not be loaded.')}</Text></View> : <ScrollView className='flex-1 px-6' contentContainerStyle={{ paddingVertical: 24 }}>
      <View className='mb-6 rounded-xl border border-primary/40 bg-background-secondary p-5'><Text className='text-text-secondary'>{l('رصيدك الحالي', 'Current balance')}</Text><Text className='my-2 text-4xl font-black text-primary'>{l(`${data.balance.toLocaleString('ar-SY')} نقطة`, `${data.balance.toLocaleString('en-US')} points`)}</Text><Text className='text-text-primary'>{l('بقيمة', 'Worth')} {formatCurrency(data.summary.redeemable_value_syp)}</Text></View>
      <TouchableOpacity accessibilityRole='link' onPress={() => router.push('/orders')} className='mb-6 min-h-12 items-center justify-center rounded-xl border border-border bg-background-card'><Text className='font-bold text-primary'>{l('عرض طلباتي', 'View my orders')}</Text></TouchableOpacity>
      {data.customer.qr_code_url ? <View className='mb-6 items-center'><Text className='mb-3 text-lg font-bold text-text-primary'>{l('رمز الولاء الخاص بك', 'Your loyalty code')}</Text><View className='rounded-xl bg-white p-4'><Image source={{ uri: data.customer.qr_code_url }} className='h-56 w-56' resizeMode='contain' accessibilityLabel={l('رمز الولاء', 'Loyalty QR code')} /></View><TouchableOpacity onPress={() => void saveQr()} className='mt-4 min-h-12 items-center justify-center rounded-xl border border-primary px-6'><Text className='font-bold text-primary'>{l('حفظ أو مشاركة رمز QR', 'Save or share QR')}</Text></TouchableOpacity></View> : null}
      {data.customer.referral_code ? <View className='mb-6 rounded-xl border border-border bg-background-secondary p-4'><Text className='text-text-secondary'>{l('رمز دعوتك', 'Referral code')}</Text><Text className='my-2 text-2xl font-black text-primary'>{data.customer.referral_code}</Text>{referralBonus ? <Text className='mb-2 text-xs text-text-secondary'>{l(`تحصل على ${referralBonus} نقطة عن كل دعوة ناجحة.`, `Earn ${referralBonus} points for every successful referral.`)}</Text> : null}<TouchableOpacity onPress={() => void Share.share({ message: l(`انضم إلى EuroStore باستخدام رمز دعوتي: ${data.customer.referral_code}`, `Join EuroStore with my referral code: ${data.customer.referral_code}`) })} className='mt-2 rounded-lg border border-primary p-3'><Text className='text-center font-bold text-primary'>{l('مشاركة أو نسخ رمز الدعوة', 'Share or copy referral code')}</Text></TouchableOpacity></View> : null}
      <View className='mb-6 rounded-xl border border-border bg-background-secondary p-4'><Text className='mb-2 font-bold text-text-primary'>{l('طريقة الاحتساب', 'How it works')}</Text><Text className='leading-6 text-text-secondary'>{l(`كل ${formatCurrency(data.summary.earn_amount_syp)} تمنحك ${data.summary.earn_points} نقاط. الحد الأدنى للاستبدال ${data.summary.min_redemption_points} نقطة، وبحد أقصى ${data.summary.max_redemption_pct}% من قيمة الطلب.`, `Every ${formatCurrency(data.summary.earn_amount_syp)} earns ${data.summary.earn_points} points. Minimum redemption is ${data.summary.min_redemption_points} points, up to ${data.summary.max_redemption_pct}% of the order value.`)}</Text></View>
      <View className='mb-6 rounded-xl border border-primary/20 bg-primary/10 p-4'><Text className='text-center text-xs leading-6 text-text-secondary'>{l('قد يمنح المتجر نقاطاً إضافية خلال الحملات والمناسبات.', 'The store may award bonus points during campaigns and special occasions.')}</Text></View>
      <Text className='mb-3 text-lg font-bold text-text-primary'>{l('آخر الحركات', 'Recent activity')}</Text>{!data.recent_transactions.length ? <Text className='text-text-secondary'>{l('لا توجد حركات بعد.', 'No activity yet.')}</Text> : data.recent_transactions.map((transaction) => <View key={transaction.id} className='mb-3 flex-row items-center justify-between rounded-xl border border-border bg-background-secondary p-4'><View className='me-3 flex-1'><Text className='font-bold text-text-primary'>{transaction.notes || transaction.type}</Text><Text className='mt-1 text-xs text-text-secondary'>{formatDate(transaction.created_at)}</Text></View><Text className={`text-lg font-black ${transaction.points >= 0 ? 'text-green-500' : 'text-error'}`}>{transaction.points > 0 ? '+' : ''}{transaction.points}</Text></View>)}
    </ScrollView>}
  </SafeAreaView>;
}
