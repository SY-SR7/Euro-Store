import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { apiFetch } from '../utils/api';
import { supabase } from '../utils/supabase';
import { usePreferences } from '../contexts/PreferencesContext';

type Mode = 'login' | 'register';

export default function LoginScreen() {
  const [mode, setMode] = useState<Mode>('login');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const { locale, l } = usePreferences();

  async function submit() {
    setMessage(null);
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      setMessage({ type: 'error', text: l('أدخل البريد الإلكتروني وكلمة المرور.', 'Enter your email and password.') });
      return;
    }
    if (mode === 'register' && (
      fullName.trim().length < 2
      || phone.trim().length < 6
      || password.length < 12
      || !/[a-z]/.test(password)
      || !/[A-Z]/.test(password)
      || !/[0-9]/.test(password)
      || !/[^A-Za-z0-9]/.test(password)
    )) {
      setMessage({ type: 'error', text: l('أدخل الاسم والهاتف، واستخدم كلمة مرور من 12 محرفاً تتضمن أحرفاً كبيرة وصغيرة ورقماً ورمزاً.', 'Enter your name and phone, and use a 12-character password containing upper and lower case letters, a number, and a symbol.') });
      return;
    }

    setLoading(true);
    try {
      if (mode === 'register') {
        await apiFetch('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            full_name: fullName.trim(),
            phone: phone.trim(),
            email: normalizedEmail,
            password,
            preferred_language: locale,
            referral_code: referralCode.trim().toUpperCase() || undefined,
          }),
        });
        router.replace({ pathname: '/verify-email', params: { email: normalizedEmail } });
        return;
      }

      await apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: normalizedEmail, password }) });
      const { error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
      if (error) throw error;
      router.replace('/(tabs)');
    } catch {
      setMessage({ type: 'error', text: l('تحقق من البيانات أو اتصال الإنترنت ثم حاول مجدداً.', 'Check your details and internet connection, then try again.') });
    } finally {
      setLoading(false);
    }
  }

  async function forgotPassword() {
    setMessage(null);
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setMessage({ type: 'error', text: l('أدخل بريدك الإلكتروني أولاً.', 'Enter your email first.') });
      return;
    }
    setLoading(true);
    try {
      await apiFetch('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: normalizedEmail, platform: 'mobile' }),
      });
      setMessage({ type: 'success', text: l('إذا كان الحساب موجوداً فستصل رسالة استعادة إلى البريد.', 'If the account exists, a recovery message will arrive by email.') });
    } catch {
      setMessage({ type: 'error', text: l('تعذر الإرسال. حاول مجدداً بعد قليل.', 'Could not send. Please try again shortly.') });
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className='flex-1 bg-background'>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className='flex-1'>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }} keyboardShouldPersistTaps='handled'>
          <TouchableOpacity onPress={() => router.replace('/(tabs)')} className='mb-8 self-start px-2 py-2'>
            <Text className='font-bold text-primary'>{l('متابعة كضيف', 'Continue as guest')}</Text>
          </TouchableOpacity>

          <Text className='mb-2 text-center text-3xl font-bold text-primary'>{mode === 'login' ? l('تسجيل الدخول', 'Sign in') : l('إنشاء حساب', 'Create account')}</Text>
          <Text className='mb-8 text-center text-text-secondary'>{l('مرحباً بك في EuroStore', 'Welcome to EuroStore')}</Text>

          {message ? <View accessibilityRole='alert' className={`mb-5 rounded-xl border px-4 py-3 ${message.type === 'error' ? 'border-error/30 bg-error/10' : 'border-success/30 bg-success/10'}`}><Text className={`font-bold ${message.type === 'error' ? 'text-error' : 'text-success'}`}>{message.text}</Text></View> : null}

          <View className='mb-6 flex-row rounded-xl border border-border bg-background-secondary p-1'>
            {(['login', 'register'] as const).map((item) => (
              <TouchableOpacity key={item} onPress={() => setMode(item)} className={`flex-1 rounded-lg py-3 ${mode === item ? 'bg-primary' : ''}`}>
                <Text className={`text-center font-bold ${mode === item ? 'text-text-primary' : 'text-text-secondary'}`}>{item === 'login' ? l('دخول', 'Sign in') : l('حساب جديد', 'Register')}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {mode === 'register' && (
            <>
              <TextInput className='mb-4 rounded-xl border border-border bg-background-secondary px-4 py-4 text-text-primary' placeholder={l('الاسم الكامل', 'Full name')} placeholderTextColor='#737373' value={fullName} onChangeText={setFullName} textContentType='name' />
              <TextInput className='mb-4 rounded-xl border border-border bg-background-secondary px-4 py-4 text-text-primary' placeholder={l('رقم الهاتف', 'Phone number')} placeholderTextColor='#737373' value={phone} onChangeText={setPhone} keyboardType='phone-pad' textContentType='telephoneNumber' />
              <TextInput accessibilityLabel={l('رمز الدعوة (اختياري)', 'Referral code (optional)')} className='mb-4 rounded-xl border border-border bg-background-secondary px-4 py-4 text-left font-bold text-text-primary' placeholder={l('رمز الدعوة (اختياري)', 'Referral code (optional)')} placeholderTextColor='#737373' value={referralCode} onChangeText={(value) => setReferralCode(value.toUpperCase())} autoCapitalize='characters' autoCorrect={false} maxLength={12} />
            </>
          )}
          <TextInput className='mb-4 rounded-xl border border-border bg-background-secondary px-4 py-4 text-left text-text-primary' placeholder={l('البريد الإلكتروني', 'Email address')} placeholderTextColor='#737373' value={email} onChangeText={setEmail} autoCapitalize='none' keyboardType='email-address' textContentType='emailAddress' />
          <TextInput className='mb-3 rounded-xl border border-border bg-background-secondary px-4 py-4 text-left text-text-primary' placeholder={l('كلمة المرور', 'Password')} placeholderTextColor='#737373' value={password} onChangeText={setPassword} secureTextEntry textContentType={mode === 'login' ? 'password' : 'newPassword'} />

          {mode === 'login' && (
            <TouchableOpacity onPress={forgotPassword} disabled={loading} className='mb-6 self-end py-2'><Text className='font-bold text-primary'>{l('نسيت كلمة المرور؟', 'Forgot password?')}</Text></TouchableOpacity>
          )}

          <TouchableOpacity className={`rounded-xl bg-primary py-4 ${loading ? 'opacity-50' : ''}`} onPress={submit} disabled={loading}>
            <Text className='text-center text-lg font-bold text-text-primary'>{loading ? l('يرجى الانتظار...', 'Please wait...') : mode === 'login' ? l('تسجيل الدخول', 'Sign in') : l('إنشاء الحساب', 'Create account')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
