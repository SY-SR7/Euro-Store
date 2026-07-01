import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import './globals.css';
import type { Viewport } from 'next';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: 'EuroStore Admin',
  description: 'EuroStore Admin Panel',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  return (
    <html lang={locale} dir={dir} suppressHydrationWarning className="overflow-x-hidden w-full">
      <body className="min-h-screen bg-background text-text-primary antialiased overflow-x-hidden w-full">
<NextIntlClientProvider locale={locale} messages={messages}>
{children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}