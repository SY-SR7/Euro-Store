import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GOVERNORATES } from '../../../packages/shared/src/constants/governorates';
import { apiFetch } from '../utils/api';
import { ScreenHeader } from '../components/ScreenHeader';
import { usePreferences } from '../contexts/PreferencesContext';

type Address = {
  id: string;
  label: string;
  full_name: string;
  phone: string;
  governorate: string;
  city: string;
  street: string;
  is_default: boolean;
};

export default function AddressesScreen() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const { isAr, l } = usePreferences();
  const emptyForm = () => ({ label: l('المنزل', 'Home'), full_name: '', phone: '', governorate: 'damascus', city: '', street: '', is_default: false });
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    try { setAddresses(await apiFetch<Address[]>('/api/addresses')); } catch { setAddresses([]); } finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);

  const add = async () => {
    if (form.full_name.trim().length < 2 || form.phone.trim().length < 7 || form.street.trim().length < 5) {
      Alert.alert(l('بيانات ناقصة', 'Missing information'), l('أدخل الاسم والهاتف والعنوان الكامل.', 'Enter the name, phone, and full address.'));
      return;
    }
    setSaving(true);
    try {
      await apiFetch('/api/addresses', { method: 'POST', body: JSON.stringify(form) });
      setShowForm(false);
      setForm(emptyForm());
      await load();
    } catch { Alert.alert(l('تعذر الحفظ', 'Could not save'), l('تحقق من البيانات أو عدد العناوين.', 'Check the details or the address limit.')); } finally { setSaving(false); }
  };

  const remove = (address: Address) => Alert.alert(l('حذف العنوان', 'Delete address'), l(`هل تريد حذف ${address.label || 'هذا العنوان'}؟`, `Delete ${address.label || 'this address'}?`), [
    { text: l('إلغاء', 'Cancel'), style: 'cancel' },
    { text: l('حذف', 'Delete'), style: 'destructive', onPress: () => void apiFetch(`/api/addresses?id=${encodeURIComponent(address.id)}`, { method: 'DELETE' }).then(load).catch(() => Alert.alert(l('خطأ', 'Error'), l('تعذر حذف العنوان.', 'The address could not be deleted.'))) },
  ]);

  return (
    <SafeAreaView className='flex-1 bg-background'>
      <ScreenHeader title={l('عناوين التوصيل', 'Delivery addresses')} action={<TouchableOpacity accessibilityLabel={showForm ? l('إغلاق النموذج', 'Close form') : l('إضافة عنوان', 'Add address')} onPress={() => setShowForm((value) => !value)} className='h-10 w-10 items-center justify-center rounded-full bg-primary'><Text className='text-2xl font-bold text-text-primary'>{showForm ? '×' : '+'}</Text></TouchableOpacity>} />
      {loading ? <View className='flex-1 items-center justify-center'><ActivityIndicator size='large' color='#B8860B' /></View> : (
        <ScrollView className='flex-1 px-6' contentContainerStyle={{ paddingVertical: 24 }} keyboardShouldPersistTaps='handled'>
          {showForm ? <View className='mb-6 border-b border-border pb-6'>
            {([['label', l('اسم العنوان', 'Address label')], ['full_name', l('اسم المستلم', 'Recipient name')], ['phone', l('رقم الهاتف', 'Phone number')], ['city', l('المدينة', 'City')], ['street', l('الشارع والتفاصيل', 'Street and details')]] as const).map(([key, label]) => <View key={key}><Text className='mb-2 font-bold text-text-primary'>{label}</Text><TextInput accessibilityLabel={label} value={form[key]} onChangeText={(value) => setForm((current) => ({ ...current, [key]: value }))} keyboardType={key === 'phone' ? 'phone-pad' : 'default'} multiline={key === 'street'} className='mb-4 rounded-xl border border-border bg-background-secondary px-4 py-3 text-text-primary' placeholderTextColor='#737373' /></View>)}
            <Text className='mb-2 font-bold text-text-primary'>{l('المحافظة', 'Governorate')}</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} className='mb-5'>{GOVERNORATES.map((governorate) => <TouchableOpacity key={governorate.id} onPress={() => setForm((current) => ({ ...current, governorate: governorate.id }))} className={`me-2 rounded-lg border px-4 py-3 ${form.governorate === governorate.id ? 'border-primary bg-primary/10' : 'border-border bg-background-secondary'}`}><Text className={form.governorate === governorate.id ? 'font-bold text-primary' : 'text-text-primary'}>{isAr ? governorate.ar : governorate.en}</Text></TouchableOpacity>)}</ScrollView>
            <TouchableOpacity onPress={() => setForm((current) => ({ ...current, is_default: !current.is_default }))} className='mb-5 flex-row items-center'><View className={`me-3 h-6 w-6 items-center justify-center rounded border ${form.is_default ? 'border-primary bg-primary' : 'border-border'}`}><Text className='font-bold text-black'>{form.is_default ? '✓' : ''}</Text></View><Text className='text-text-primary'>{l('تعيينه عنواناً افتراضياً', 'Set as default address')}</Text></TouchableOpacity>
            <TouchableOpacity disabled={saving} onPress={add} className={`rounded-xl bg-primary p-4 ${saving ? 'opacity-60' : ''}`}><Text className='text-center font-bold text-text-primary'>{saving ? l('جارٍ الحفظ...', 'Saving...') : l('إضافة العنوان', 'Add address')}</Text></TouchableOpacity>
          </View> : null}
          {!addresses.length ? <Text className='mt-12 text-center text-text-secondary'>{l('لا توجد عناوين محفوظة.', 'No saved addresses.')}</Text> : addresses.map((address) => <View key={address.id} className='mb-4 rounded-xl border border-border bg-background-secondary p-4'><View className='mb-2 flex-row items-center justify-between'><Text className='text-lg font-bold text-text-primary'>{address.label || l('عنوان', 'Address')}</Text>{address.is_default ? <Text className='rounded-lg bg-primary/10 px-3 py-1 text-xs font-bold text-primary'>{l('افتراضي', 'Default')}</Text> : null}</View><Text className='leading-6 text-text-secondary'>{address.full_name}{'\n'}{address.phone}{'\n'}{(isAr ? GOVERNORATES.find((item) => item.id === address.governorate)?.ar : GOVERNORATES.find((item) => item.id === address.governorate)?.en) ?? address.governorate} - {address.city}{'\n'}{address.street}</Text><TouchableOpacity onPress={() => remove(address)} className='mt-3 self-start'><Text className='font-bold text-error'>{l('حذف', 'Delete')}</Text></TouchableOpacity></View>)}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
