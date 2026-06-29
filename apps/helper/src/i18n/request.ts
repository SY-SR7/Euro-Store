import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import { defaultLocale, type Locale } from '@eurostore/shared';

export default getRequestConfig(async () => {
  const cookieStore = cookies();
  const locale = (cookieStore.get('EUROSTORE_LOCALE')?.value as Locale | undefined) ?? defaultLocale;
  const messages = (await import(`@eurostore/shared/src/messages/${locale}.json`)).default;
  return { locale, messages };
});

