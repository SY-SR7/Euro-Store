import { cookies, headers } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';
import messages, { defaultLocale, locales, type Locale } from './messages';

function normalizeLocale(value: unknown): Locale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value)
    ? (value as Locale)
    : defaultLocale;
}

export default getRequestConfig(async (params: any) => {
  const requestLocale = params?.requestLocale;

  const rawFromParams =
    typeof params?.locale === 'string'
      ? params.locale
      : typeof requestLocale === 'string'
        ? requestLocale
        : requestLocale
          ? await requestLocale
          : undefined;

  const cookieStore = cookies();
  const cookieLocale =
    cookieStore.get('NEXT_LOCALE')?.value ??
    cookieStore.get('EUROSTORE_LOCALE')?.value;

  const headerLocale = headers().get('x-eurostore-locale');

  const locale = normalizeLocale(rawFromParams ?? cookieLocale ?? headerLocale);

  return {
    locale,
    messages: messages[locale]
  };
});