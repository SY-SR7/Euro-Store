import localAr from './messages/ar.json';
import localEn from './messages/en.json';
import { arMessages, enMessages, mergeMessageTrees } from '@eurostore/shared';

export const locales = ['ar', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'ar';

export const messages = {
  ar: mergeMessageTrees(arMessages, localAr),
  en: mergeMessageTrees(enMessages, localEn),
};
export default messages;
