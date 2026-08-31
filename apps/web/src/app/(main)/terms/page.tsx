import { termsDocuments } from '@eurostore/shared';
import { getLocale } from 'next-intl/server';
import { LegalDocument } from '@/components/legal/LegalDocument';

export default async function TermsPage() {
  const locale = (await getLocale()) === 'ar' ? 'ar' : 'en';
  const document = termsDocuments[locale];

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
