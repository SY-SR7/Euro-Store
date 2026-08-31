import React from 'react';
import type { LocalizedLegalDocument } from '@eurostore/shared/legal';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from './ScreenHeader';
import { usePreferences } from '../contexts/PreferencesContext';

export function LegalScreen({ document }: { document: LocalizedLegalDocument }) {
  const { isAr } = usePreferences();
  return <SafeAreaView className="flex-1 bg-background"><ScreenHeader title={document.title} /><ScrollView className="flex-1" contentContainerStyle={{ padding: 20, paddingBottom: 40 }}><View className="mb-7 rounded-3xl border border-border bg-background-card p-6"><Text className={`${isAr ? 'text-right' : 'text-left'} text-3xl font-black leading-10 text-text-primary`}>{document.title}</Text><Text className={`${isAr ? 'text-right' : 'text-left'} mt-3 leading-7 text-text-secondary`}>{document.introduction}</Text><Text className="mt-4 text-xs font-bold text-primary">{document.updatedLabel}</Text></View>{document.sections.map((section) => <View key={section.title} className="mb-4 rounded-2xl border border-border bg-background-card p-5"><Text className={`${isAr ? 'text-right' : 'text-left'} text-lg font-black text-text-primary`}>{section.title}</Text>{section.paragraphs.map((paragraph) => <Text key={paragraph} className={`${isAr ? 'text-right' : 'text-left'} mt-3 leading-7 text-text-secondary`}>{paragraph}</Text>)}</View>)}</ScrollView></SafeAreaView>;
}
