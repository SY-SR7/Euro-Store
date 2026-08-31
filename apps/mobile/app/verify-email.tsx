import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePreferences } from '../contexts/PreferencesContext';
import { supabase } from '../utils/supabase';

export default function VerifyEmailScreen() {
  const { email = '' } = useLocalSearchParams<{ email?: string }>();
  const { l } = usePreferences();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const resend = async () => {
    if (!email) return;
    setSending(true);
    await supabase.auth.resend({ type: 'signup', email }).catch(() => undefined);
    setSending(false);
    setSent(true);
  };
  return <SafeAreaView className='flex-1 bg-background px-6'><View className='flex-1 items-center justify-center'><View className='w-full rounded-2xl border border-border bg-background-card p-6'><Text className='text-center text-2xl font-black text-text-primary'>{l('تحقق من بريدك الإلكتروني', 'Verify your email')}</Text><Text className='mt-3 text-center leading-7 text-text-secondary'>{l('أرسلنا رابط التفعيل إلى بريدك. افتحه ثم عد إلى التطبيق وسجّل الدخول.', 'We sent a verification link to your email. Open it, then return to the app and sign in.')}</Text>{email ? <Text className='mt-3 text-center font-bold text-primary'>{email}</Text> : null}{sent ? <Text accessibilityRole='alert' className='mt-4 text-center font-bold text-success'>{l('أُعيد إرسال الرسالة.', 'The email was sent again.')}</Text> : null}<TouchableOpacity onPress={() => router.replace('/login')} className='mt-6 min-h-12 items-center justify-center rounded-xl bg-primary'><Text className='font-bold text-text-primary'>{l('العودة لتسجيل الدخول', 'Back to sign in')}</Text></TouchableOpacity><TouchableOpacity disabled={sending || !email} onPress={() => void resend()} className='mt-3 min-h-12 items-center justify-center rounded-xl border border-border disabled:opacity-40'>{sending ? <ActivityIndicator color='#B8860B' /> : <Text className='font-bold text-primary'>{l('إعادة إرسال الرسالة', 'Resend email')}</Text>}</TouchableOpacity></View></View></SafeAreaView>;
}
