import { privacyDocuments } from '@eurostore/shared';
import { getLocale } from 'next-intl/server';
import { LegalDocument } from '@/components/legal/LegalDocument';

export default async function PrivacyPage() {
  const locale = (await getLocale()) === 'ar' ? 'ar' : 'en';
  const document = privacyDocuments[locale];

  return (
    <LegalDocument
      title={document.title}
      updatedLabel={document.updatedLabel}
      introduction={document.introduction}
      sections={document.sections}
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
    />
  );
}
