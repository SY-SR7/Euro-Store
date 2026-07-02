import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages, getTranslations } from 'next-intl/server';
import './globals.css';
import type { Viewport } from 'next';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('common');
  return {
    title: t('appName'),
    description: t('appDescription'),
  };
}

import { SmoothScroller } from '../components/layout/SmoothScroller';

import { PageTransitionProvider } from '../components/layout/PageTransitionProvider';

import { Toaster } from 'sonner';
import { WhatsAppButton } from '@/components/common/WhatsAppButton';

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning className="overflow-x-hidden w-full">
      <body className="min-h-screen bg-background text-text-primary antialiased overflow-x-hidden w-full flex flex-col">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <SmoothScroller>
            <PageTransitionProvider>
              {children}
            </PageTransitionProvider>
          </SmoothScroller>
          <Toaster position="bottom-right" />
          <WhatsAppButton />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}