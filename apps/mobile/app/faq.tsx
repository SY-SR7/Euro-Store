import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ScreenHeader } from '../components/ScreenHeader';
import { usePreferences } from '../contexts/PreferencesContext';

const ITEMS = [
  ['ما هي سياسة الاستبدال؟', 'What is the exchange policy?', 'يمكنك طلب الاستبدال خلال 7 أيام من الاستلام بشرط أن يكون المنتج بحالته الأصلية.', 'You can request an exchange within 7 days of receipt, provided the product is in its original condition.'],
  ['كيف يمكنني تتبع طلبي؟', 'How can I track my order?', 'يمكنك تتبع طلبك من خلال قسم طلباتي في حسابك.', 'You can track your order through the My Orders section in your account.'],
  ['ما هي طرق الدفع المتاحة؟', 'What payment methods are available?', 'الدفع عند الاستلام متاح دائماً. يظهر خيار شام كاش في صفحة الدفع فقط عند توفر التكامل.', 'Cash on delivery is always available. Sham Cash appears at checkout only when the integration is available.'],
  ['كم تستغرق عملية التوصيل؟', 'How long does delivery take?', 'يستغرق التوصيل بين 2-5 أيام عمل حسب المنطقة.', 'Delivery takes 2-5 working days depending on the area.'],
  ['هل يمكنني إلغاء طلبي؟', 'Can I cancel my order?', 'يمكنك إلغاء طلبك قبل شحنه من خلال التواصل معنا.', 'You can cancel your order before it is shipped by contacting us.'],
  ['كيف أشارك في برنامج الولاء؟', 'How do I join the loyalty program?', 'عند كل عملية شراء تكسب نقاطاً يمكنك استخدامها للحصول على خصومات.', 'With every purchase you earn points that you can use to get discounts.'],
] as const;

export default function FaqScreen() {
  const [open, setOpen] = useState<number | null>(0);
  const { isAr, l } = usePreferences();
  return <SafeAreaView className="flex-1 bg-background"><ScreenHeader title={l('الأسئلة الشائعة', 'FAQ')} /><ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}><Text className="mb-8 text-center text-text-secondary">{l('إجابات لأكثر الأسئلة شيوعاً', 'Answers to the most common questions')}</Text>{ITEMS.map((item, index) => { const expanded = open === index; return <View key={item[1]} className="mb-3 overflow-hidden rounded-2xl border border-border bg-background-card"><Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => setOpen(expanded ? null : index)} className="min-h-16 flex-row items-center justify-between px-5 py-4"><Text className={`${isAr ? 'text-right' : 'text-left'} min-w-0 flex-1 pe-3 font-bold ${expanded ? 'text-primary' : 'text-text-primary'}`}>{isAr ? item[0] : item[1]}</Text><ChevronDown size={20} color={expanded ? '#B8860B' : '#A8A29E'} style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }} /></Pressable>{expanded ? <Text className={`${isAr ? 'text-right' : 'text-left'} border-t border-border px-5 py-5 leading-7 text-text-secondary`}>{isAr ? item[2] : item[3]}</Text> : null}</View>; })}<View className="mt-8 items-center rounded-2xl border border-primary/20 bg-primary/10 p-7"><Text className="text-xl font-black text-text-primary">{l('هل لديك سؤال آخر؟', 'Have another question?')}</Text><Text className="mt-2 text-center text-text-secondary">{l('فريق خدمة العملاء جاهز لمساعدتك.', 'Our customer support team is ready to help.')}</Text><Pressable accessibilityRole="button" onPress={() => router.push('/contact')} className="mt-5 min-h-12 items-center justify-center rounded-xl bg-primary px-8"><Text className="font-black text-text-primary">{l('تواصل معنا', 'Contact us')}</Text></Pressable></View></ScrollView></SafeAreaView>;
}
