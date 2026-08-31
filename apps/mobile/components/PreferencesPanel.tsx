import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { type AppLocale, usePreferences } from '../contexts/PreferencesContext';

export function PreferencesPanel() {
  const { locale, setLocale, t } = usePreferences();
  const languages: Array<{ value: AppLocale; label: string }> = [
    { value: 'ar', label: t('preferences.arabic') },
    { value: 'en', label: t('preferences.english') },
  ];

  return (
    <View className="mb-6 border-y border-border py-5">
      <Text className="mb-4 text-lg font-bold text-text-primary">{t('preferences.title')}</Text>
      <Text className="mb-2 text-sm font-bold text-text-secondary">{t('preferences.language')}</Text>
      <View className="mb-5 flex-row gap-2">
        {languages.map((option) => (
          <TouchableOpacity
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected: locale === option.value }}
            onPress={() => setLocale(option.value)}
            className={`flex-1 border px-3 py-3 ${locale === option.value ? 'border-primary bg-primary/10' : 'border-border bg-background-secondary'}`}
          >
            <Text className={`text-center font-bold ${locale === option.value ? 'text-primary' : 'text-text-primary'}`}>{option.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
