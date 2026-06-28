export * from "./constants/governorates";
export * from "./constants/roles";
export * from "./auth";
export * from "./env";
export * from "./runtime-config";
export * from "./utils/currency";
export * from "./utils/qr";
export * from "./middleware/rate-limit";
export * from './i18n';
export const locales = ['ar', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'ar';
export function formatSYP(value: number | null | undefined): string {
  const safeValue = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  return `${new Intl.NumberFormat('ar-SY').format(safeValue)} ل.س`;
}
