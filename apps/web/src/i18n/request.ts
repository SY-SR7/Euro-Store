import { getRequestConfig } from 'next-intl/server';
import messages, { defaultLocale, locales, type Locale } from './messages';

export default getRequestConfig(async (params: any) => {
  const requestLocale = params?.requestLocale;
  const rawLocale =
    typeof params?.locale === 'string'
      ? params.locale
      : typeof requestLocale === 'string'
        ? requestLocale
        : requestLocale
          ? await requestLocale
          : undefined;

  const locale: Locale =
    typeof rawLocale === 'string' && (locales as readonly string[]).includes(rawLocale)
      ? (rawLocale as Locale)
      : defaultLocale;

  return {
    locale,
    messages: messages[locale]
  };
});