import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import './globals.css';

import { GlobalVisualPatches } from '@/components/common/GlobalVisualPatches';
export const metadata: Metadata = {
  title: 'EuroStore Admin',
  description: 'EuroStore Admin Panel',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body className="min-h-screen bg-[#F8F6F2] text-[#1C1917] antialiased">
        <GlobalVisualPatches />
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}