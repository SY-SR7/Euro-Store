import { router } from 'expo-router';
import { ArrowLeft, ArrowRight } from 'lucide-react-native';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { usePreferences } from '../contexts/PreferencesContext';

export function ScreenHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  const { isAr, t } = usePreferences();
  const BackIcon = isAr ? ArrowRight : ArrowLeft;

  return (
    <View className="min-h-16 flex-row items-center border-b border-border px-5 py-3">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('common.back')}
        onPress={() => router.back()}
        className="me-3 h-10 w-10 items-center justify-center rounded-full border border-border"
      >
        <BackIcon size={20} color="#B8860B" />
      </Pressable>
      <Text className="flex-1 text-xl font-bold text-primary" numberOfLines={1}>{title}</Text>
      {action}
    </View>
  );
}
