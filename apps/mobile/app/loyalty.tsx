import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, SafeAreaView, ScrollView, Share, Text, TouchableOpacity, View } from 'react-native';
import { apiFetch } from '../utils/api';
import { ScreenHeader } from '../components/ScreenHeader';
import { usePreferences } from '../contexts/PreferencesContext';

type LoyaltyResponse = {
  customer: { full_name: string; referral_code: string | null; qr_code_url: string | null };
  balance: number;
  summary: { point_value_syp: number; earn_amount_syp: number; earn_points: number; min_redemption_points: number; max_redemption_pct: number; redeemable_value_syp: number };
  recent_transactions: Array<{ id: string; type: string; points: number; balance_after: number; notes: string | null; created_at: string }>;
};

export default function LoyaltyScreen() {
  const [data, setData] = useState<LoyaltyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const { l, formatCurrency, formatDate } = usePreferences();
  useEffect(() => { apiFetch<LoyaltyResponse>('/api/customer/loyalty').then(setData).catch(() => setData(null)).finally(() => setLoading(false)); }, []);

  return <SafeAreaView className='flex-1 bg-background'>
    <ScreenHeader title={l('نقاط الولاء', 'Loyalty points')} />
    {loading ? <View className='flex-1 items-center justify-center'><ActivityIndicator size='large' color='#B8860B' /></View> : !data ? <View className='flex-1 items-center justify-center px-6'><Text className='text-center text-text-secondary'>{l('تعذر تحميل حساب الولاء.', 'The loyalty account could not be loaded.')}</Text></View> : <ScrollView className='flex-1 px-6' contentContainerStyle={{ paddingVertical: 24 }}>
      <View className='mb-6 rounded-xl border border-primary/40 bg-background-secondary p-5'><Text className='text-text-secondary'>{l('رصيدك الحالي', 'Current balance')}</Text><Text className='my-2 text-4xl font-black text-primary'>{l(`${data.balance.toLocaleString('ar-SY')} نقطة`, `${data.balance.toLocaleString('en-US')} points`)}</Text><Text className='text-text-primary'>{l('بقيمة', 'Worth')} {formatCurrency(data.summary.redeemable_value_syp)}</Text></View>
      {data.customer.qr_code_url ? <View className='mb-6 items-center'><Text className='mb-3 text-lg font-bold text-text-primary'>{l('رمز الولاء الخاص بك', 'Your loyalty code')}</Text><View className='rounded-xl bg-white p-4'><Image source={{ uri: data.customer.qr_code_url }} className='h-56 w-56' resizeMode='contain' accessibilityLabel={l('رمز الولاء', 'Loyalty QR code')} /></View></View> : null}
      {data.customer.referral_code ? <View className='mb-6 rounded-xl border border-border bg-background-secondary p-4'><Text className='text-text-secondary'>{l('رمز دعوتك', 'Referral code')}</Text><Text className='my-2 text-2xl font-black text-primary'>{data.customer.referral_code}</Text><TouchableOpacity onPress={() => void Share.share({ message: l(`انضم إلى EuroStore باستخدام رمز دعوتي: ${data.customer.referral_code}`, `Join EuroStore with my referral code: ${data.customer.referral_code}`) })} className='mt-2 rounded-lg border border-primary p-3'><Text className='text-center font-bold text-primary'>{l('مشاركة رمز الدعوة', 'Share referral code')}</Text></TouchableOpacity></View> : null}
      <View className='mb-6 rounded-xl border border-border bg-background-secondary p-4'><Text className='mb-2 font-bold text-text-primary'>{l('طريقة الاحتساب', 'How it works')}</Text><Text className='leading-6 text-text-secondary'>{l(`كل ${formatCurrency(data.summary.earn_amount_syp)} تمنحك ${data.summary.earn_points} نقاط. الحد الأدنى للاستبدال ${data.summary.min_redemption_points} نقطة، وبحد أقصى ${data.summary.max_redemption_pct}% من قيمة الطلب.`, `Every ${formatCurrency(data.summary.earn_amount_syp)} earns ${data.summary.earn_points} points. Minimum redemption is ${data.summary.min_redemption_points} points, up to ${data.summary.max_redemption_pct}% of the order value.`)}</Text></View>
      <Text className='mb-3 text-lg font-bold text-text-primary'>{l('آخر الحركات', 'Recent activity')}</Text>{!data.recent_transactions.length ? <Text className='text-text-secondary'>{l('لا توجد حركات بعد.', 'No activity yet.')}</Text> : data.recent_transactions.map((transaction) => <View key={transaction.id} className='mb-3 flex-row items-center justify-between rounded-xl border border-border bg-background-secondary p-4'><View className='me-3 flex-1'><Text className='font-bold text-text-primary'>{transaction.notes || transaction.type}</Text><Text className='mt-1 text-xs text-text-secondary'>{formatDate(transaction.created_at)}</Text></View><Text className={`text-lg font-black ${transaction.points >= 0 ? 'text-green-500' : 'text-error'}`}>{transaction.points > 0 ? '+' : ''}{transaction.points}</Text></View>)}
    </ScrollView>}
  </SafeAreaView>;
}
