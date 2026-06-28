export const locales = ['ar', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'ar';

export async function getMessages(locale: Locale) {
  return (await import(`./messages/${locale}.json`)).default as Record<string, unknown>;
}
