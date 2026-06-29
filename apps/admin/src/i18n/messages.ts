import ar from './messages/ar.json';
import en from './messages/en.json';

export const locales = ['ar', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'ar';

export const messages: Record<Locale, Record<string, unknown>> = {
  ar,
  en
};

export default messages;