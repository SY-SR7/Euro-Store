import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePreferences } from '../contexts/PreferencesContext';
import { supabase } from '../utils/supabase';

export default function ResetPasswordScreen() {
  const { l } = usePreferences();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const accept = async (url: string | null) => {
      if (!url) return;
      const normalized = url.replace('#', '?');
      const parsed = new URL(normalized);
      const accessToken = parsed.searchParams.get('access_token');
      const refreshToken = parsed.searchParams.get('refresh_token');
      const code = parsed.searchParams.get('code');
      const result = accessToken && refreshToken
        ? await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
        : code ? await supabase.auth.exchangeCodeForSession(code) : null;
      setReady(Boolean(result && !result.error));
      if (result?.error) setError(l('رابط الاستعادة غير صالح أو منتهي.', 'The recovery link is invalid or expired.'));
    };
    void Linking.getInitialURL().then(accept);
    const subscription = Linking.addEventListener('url', ({ url }) => { void accept(url); });
    return () => subscription.remove();
  }, [l]);

  const submit = async () => {
    setError('');
    if (password !== confirm || password.length < 12 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
      setError(l('يجب أن تتطابق الكلمتان وأن تحتوي كلمة المرور على 12 محرفاً وحرف كبير وصغير ورقم ورمز.', 'Passwords must match and contain at least 12 characters, upper and lower case letters, a number, and a symbol.'));
      return;
    }
    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) { setError(l('تعذر تحديث كلمة المرور. اطلب رابطاً جديداً.', 'Could not update the password. Request a new link.')); setLoading(false); return; }
    await supabase.auth.signOut({ scope: 'global' });
    router.replace('/login');
  };

  return <SafeAreaView className='flex-1 bg-background px-6'><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className='flex-1 justify-center'><View className='rounded-2xl border border-border bg-background-card p-6'><Text className='text-center text-2xl font-black text-text-primary'>{l('كلمة مرور جديدة', 'New password')}</Text><Text className='mt-2 text-center text-text-secondary'>{ready ? l('أدخل كلمة مرور جديدة وقوية.', 'Enter a strong new password.') : l('جارٍ التحقق من رابط الاستعادة...', 'Checking the recovery link...')}</Text>{error ? <Text accessibilityRole='alert' className='mt-4 font-bold text-error'>{error}</Text> : null}{ready ? <><TextInput accessibilityLabel={l('كلمة المرور الجديدة', 'New password')} value={password} onChangeText={setPassword} secureTextEntry autoCapitalize='none' autoCorrect={false} className='mt-6 rounded-xl border border-border bg-background-secondary px-4 py-4 text-left text-text-primary' placeholder={l('كلمة المرور الجديدة', 'New password')} placeholderTextColor='#737373' /><TextInput accessibilityLabel={l('تأكيد كلمة المرور', 'Confirm password')} value={confirm} onChangeText={setConfirm} secureTextEntry autoCapitalize='none' autoCorrect={false} className='mt-4 rounded-xl border border-border bg-background-secondary px-4 py-4 text-left text-text-primary' placeholder={l('تأكيد كلمة المرور', 'Confirm password')} placeholderTextColor='#737373' /><TouchableOpacity disabled={loading} onPress={() => void submit()} className='mt-6 min-h-12 items-center justify-center rounded-xl bg-primary disabled:opacity-50'>{loading ? <ActivityIndicator color='#1C1917' /> : <Text className='font-bold text-text-primary'>{l('تحديث كلمة المرور', 'Update password')}</Text>}</TouchableOpacity></> : null}<TouchableOpacity onPress={() => router.replace('/login')} className='mt-3 min-h-12 items-center justify-center'><Text className='font-bold text-primary'>{l('العودة لتسجيل الدخول', 'Back to sign in')}</Text></TouchableOpacity></View></KeyboardAvoidingView></SafeAreaView>;
}
