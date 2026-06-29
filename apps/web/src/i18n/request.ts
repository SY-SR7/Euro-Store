/* eslint-disable */
// @ts-nocheck

import { getRequestConfig } from 'next-intl/server';
import { defaultLocale, locales, type Locale } from '@eurostore/shared';
import messagesByLocale from './messages';

function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value);
}

type RequestConfigParams = {
  locale?: string;
  requestLocale?: string | Promise<string | undefined>;
};

export default getRequestConfig(async (params: RequestConfigParams) => {
  const requestLocale =
    params && 'requestLocale' in params ? await params.requestLocale : undefined;

  const requestedLocale = requestLocale ?? params?.locale;
  const locale = isLocale(requestedLocale) ? requestedLocale : defaultLocale;

  return {
    locale,
    messages: messagesByLocale[locale] ?? messagesByLocale[defaultLocale],
  };
});
