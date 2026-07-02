import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import { defaultLocale, type Locale } from '@eurostore/shared';

export default getRequestConfig(async () => {
  const cookieStore = cookies();
  const locale = (cookieStore.get('EUROSTORE_LOCALE')?.value as Locale | undefined) ?? defaultLocale;
  const messages = locale === 'ar' 
    ? (await import('../../../../packages/shared/src/messages/ar.json')).default 
    : (await import('../../../../packages/shared/src/messages/en.json')).default;
  return { locale, messages };
});

