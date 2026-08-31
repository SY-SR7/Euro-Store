import arMessages from './messages/ar.json';
import enMessages from './messages/en.json';

export const locales = ['ar', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'ar';

export async function getMessages(locale: Locale) {
  return (locale === 'ar' ? arMessages : enMessages) as Record<string, unknown>;
}

export function mergeMessageTrees(
  defaults: Record<string, unknown>,
  overrides: Record<string, unknown>,
): Record<string, unknown> {
  const merged: Record<string, unknown> = { ...defaults };
  for (const [key, value] of Object.entries(overrides)) {
    if (['__proto__', 'prototype', 'constructor'].includes(key)) continue;
    const current = merged[key];
    merged[key] = isMessageTree(current) && isMessageTree(value)
      ? mergeMessageTrees(current, value)
      : value;
  }
  return merged;
}

function isMessageTree(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
