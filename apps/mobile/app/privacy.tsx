import React from 'react';
import { privacyDocuments } from '@eurostore/shared/legal';
import { LegalScreen } from '../components/LegalScreen';
import { usePreferences } from '../contexts/PreferencesContext';

export default function PrivacyScreen() {
  const { isAr } = usePreferences();
  return <LegalScreen document={privacyDocuments[isAr ? 'ar' : 'en']} />;
}
