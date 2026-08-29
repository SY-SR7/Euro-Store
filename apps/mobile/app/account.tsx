import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { apiFetch } from '../utils/api';
import { ScreenHeader } from '../components/ScreenHeader';
import { usePreferences } from '../contexts/PreferencesContext';

type Profile = {
  full_name: string;
  email: string;
  phone: string | null;
  gender: 'male' | 'female' | null;
  loyalty_points: number;
  referral_code: string | null;
};

export default function AccountScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { l } = usePreferences();

  useEffect(() => {
    apiFetch<{ profile: Profile }>('/api/profile')
      .then(({ profile: value }) => {
        setProfile(value);
        setFullName(value.full_name ?? '');
        setPhone(value.phone ?? '');
        setGender(value.gender);
      })
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    if (fullName.trim().length < 2 || phone.trim().length < 7) {
      Alert.alert(l('بيانات غير مكتملة', 'Incomplete details'), l('أدخل الاسم ورقم الهاتف بشكل صحيح.', 'Enter a valid name and phone number.'));
      return;
    }
    setSaving(true);
    try {
      const updated = await apiFetch<Profile>('/api/profile', {
        method: 'PATCH',
        body: JSON.stringify({ full_name: fullName.trim(), phone: phone.trim(), gender }),
      });
      setProfile(updated);
      Alert.alert(l('تم الحفظ', 'Saved'), l('تم تحديث بيانات حسابك.', 'Your account details were updated.'));
    } catch {
      Alert.alert(l('تعذر الحفظ', 'Could not save'), l('تحقق من البيانات وحاول مرة أخرى.', 'Check the details and try again.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className='flex-1 bg-background'>
      <ScreenHeader title={l('البيانات الشخصية', 'Personal details')} />
      {loading ? <View className='flex-1 items-center justify-center'><ActivityIndicator size='large' color='#B8860B' /></View> : !profile ? (
        <View className='flex-1 items-center justify-center px-6'><Text className='text-center text-text-secondary'>{l('تعذر تحميل بيانات الحساب.', 'Account details could not be loaded.')}</Text></View>
      ) : (
        <ScrollView className='flex-1 px-6' contentContainerStyle={{ paddingVertical: 24 }} keyboardShouldPersistTaps='handled'>
          <Text className='mb-2 font-bold text-text-primary'>{l('الاسم الكامل', 'Full name')}</Text>
          <TextInput accessibilityLabel={l('الاسم الكامل', 'Full name')} value={fullName} onChangeText={setFullName} className='mb-5 rounded-xl border border-border bg-background-secondary px-4 py-4 text-text-primary' placeholderTextColor='#737373' />
          <Text className='mb-2 font-bold text-text-primary'>{l('البريد الإلكتروني', 'Email address')}</Text>
          <View className='mb-5 rounded-xl border border-border bg-background-secondary px-4 py-4'><Text className='text-text-secondary'>{profile.email}</Text></View>
          <Text className='mb-2 font-bold text-text-primary'>{l('رقم الهاتف', 'Phone number')}</Text>
          <TextInput value={phone} onChangeText={setPhone} keyboardType='phone-pad' className='mb-5 rounded-xl border border-border bg-background-secondary px-4 py-4 text-text-primary' placeholder='09xxxxxxxx' placeholderTextColor='#737373' />
          <Text className='mb-2 font-bold text-text-primary'>{l('الجنس', 'Gender')}</Text>
          <View className='mb-8 flex-row gap-3'>
            {([['male', l('ذكر', 'Male')], ['female', l('أنثى', 'Female')]] as const).map(([value, label]) => (
              <TouchableOpacity key={value} onPress={() => setGender(value)} className={`flex-1 rounded-xl border p-4 ${gender === value ? 'border-primary bg-primary/10' : 'border-border bg-background-secondary'}`}><Text className={`text-center font-bold ${gender === value ? 'text-primary' : 'text-text-primary'}`}>{label}</Text></TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity disabled={saving} onPress={save} className={`rounded-xl bg-primary p-4 ${saving ? 'opacity-60' : ''}`}><Text className='text-center text-lg font-bold text-[#0F0F0F]'>{saving ? l('جارٍ الحفظ...', 'Saving...') : l('حفظ التغييرات', 'Save changes')}</Text></TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
