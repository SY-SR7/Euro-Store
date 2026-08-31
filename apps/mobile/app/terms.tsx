import React from 'react';
import { termsDocuments } from '@eurostore/shared/legal';
import { LegalScreen } from '../components/LegalScreen';
import { usePreferences } from '../contexts/PreferencesContext';

export default function TermsScreen() {
  const { isAr } = usePreferences();
  return <LegalScreen document={termsDocuments[isAr ? 'ar' : 'en']} />;
}
