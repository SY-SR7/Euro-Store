import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, MessageCircle } from 'lucide-react-native';
import { ScreenHeader } from '../components/ScreenHeader';
import { useAuth } from '../contexts/AuthContext';
import { usePreferences } from '../contexts/PreferencesContext';
import { apiFetch } from '../utils/api';

type ContactSettings = { contact_whatsapp: string; contact_email: string };

export default function ContactScreen() {
  const { user } = useAuth();
  const { isAr, l } = usePreferences();
  const [settings, setSettings] = useState<ContactSettings>({ contact_whatsapp: '963000000000', contact_email: 'support@eurostore.com' });
  const [name, setName] = useState(String(user?.user_metadata?.full_name ?? ''));
  const [email, setEmail] = useState(user?.email ?? '');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  useEffect(() => { apiFetch<ContactSettings>('/api/storefront/contact').then(setSettings).catch(() => undefined); }, []);
  async function submit() {
    if (name.trim().length < 2 || !/^\S+@\S+\.\S+$/.test(email.trim()) || message.trim().length < 10) { Alert.alert(l('تحقق من البيانات', 'Check your details'), l('أدخل اسماً وبريداً صالحاً ورسالة من 10 أحرف على الأقل.', 'Enter a name, valid email, and a message of at least 10 characters.')); return; }
    setSending(true);
    try { await apiFetch('/api/storefront/contact', { method: 'POST', body: JSON.stringify({ name: name.trim(), email: email.trim(), message: message.trim() }) }); setMessage(''); Alert.alert(l('تم إرسال رسالتك بنجاح!', 'Your message was sent successfully!'), l('سنتواصل معك قريباً', 'We will contact you soon')); } catch { Alert.alert(l('تعذر الإرسال', 'Could not send'), l('حاول مرة أخرى.', 'Please try again.')); } finally { setSending(false); }
  }
  return <SafeAreaView className="flex-1 bg-background"><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1"><ScreenHeader title={l('تواصل معنا', 'Contact us')} /><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, paddingBottom: 40 }}><Text className={`${isAr ? 'text-right' : 'text-left'} mb-7 text-text-secondary`}>{l('نحن هنا للمساعدة', 'We are here to help')}</Text><View className="mb-7 flex-row gap-3"><Pressable accessibilityRole="link" onPress={() => void Linking.openURL(`https://wa.me/${settings.contact_whatsapp}`)} className="flex-1 items-center rounded-2xl border border-border bg-background-card p-5"><MessageCircle size={24} color="#15803D" /><Text className="mt-2 font-bold text-text-primary">{l('واتساب', 'WhatsApp')}</Text></Pressable><Pressable accessibilityRole="link" onPress={() => void Linking.openURL(`mailto:${settings.contact_email}`)} className="flex-1 items-center rounded-2xl border border-border bg-background-card p-5"><Mail size={24} color="#B8860B" /><Text className="mt-2 font-bold text-text-primary">{l('البريد الإلكتروني', 'Email')}</Text></Pressable></View><Field label={l('الاسم', 'Name')} value={name} onChangeText={setName} autoComplete="name" /><Field label={l('البريد الإلكتروني', 'Email')} value={email} onChangeText={setEmail} autoComplete="email" keyboardType="email-address" autoCapitalize="none" /><Text className={`${isAr ? 'text-right' : 'text-left'} mb-2 font-bold text-text-primary`}>{l('الرسالة', 'Message')}</Text><TextInput accessibilityLabel={l('الرسالة', 'Message')} value={message} onChangeText={setMessage} multiline numberOfLines={6} textAlignVertical="top" className={`${isAr ? 'text-right' : 'text-left'} min-h-36 rounded-xl border border-border bg-background-card p-4 text-text-primary`} placeholder={l('رسالتك...', 'Your message...')} placeholderTextColor="#A8A29E" /><Pressable accessibilityRole="button" disabled={sending} onPress={() => void submit()} className="mt-4 min-h-14 items-center justify-center rounded-xl bg-primary px-5 disabled:opacity-60"><Text className="font-black text-text-primary">{sending ? l('جارٍ الإرسال...', 'Sending...') : l('إرسال', 'Submit')}</Text></Pressable></ScrollView></KeyboardAvoidingView></SafeAreaView>;
}

function Field(props: { label: string; value: string; onChangeText: (value: string) => void; autoComplete: 'name' | 'email'; keyboardType?: 'email-address'; autoCapitalize?: 'none' }) { return <View className="mb-4"><Text className="mb-2 font-bold text-text-primary">{props.label}</Text><TextInput accessibilityLabel={props.label} {...props} className="min-h-12 rounded-xl border border-border bg-background-card px-4 text-text-primary" placeholderTextColor="#A8A29E" /></View>; }
