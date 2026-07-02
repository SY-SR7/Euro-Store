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
  themeColor: '#CFA63D',
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('common');
  return {
    title: t('appName'),
    description: t('appDescription'),
    manifest: '/manifest.json',
    appleWebApp: {
      capable: true,
      statusBarStyle: 'black-translucent',
      title: 'EuroStore',
    },
    formatDetection: {
      telephone: false,
    },
  };
}

import { SmoothScroller } from '../components/layout/SmoothScroller';

import { PageTransitionProvider } from '../components/layout/PageTransitionProvider';

import { Toaster } from 'sonner';
import { EuroConcierge } from '@/components/common/EuroConcierge';
import { KonamiCode } from '@/components/common/KonamiCode';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning className="overflow-x-clip w-full">
      <body className="min-h-screen bg-background text-text-primary antialiased overflow-x-clip w-full flex flex-col">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <SmoothScroller>
            <PageTransitionProvider>
              {children}
            </PageTransitionProvider>
          </SmoothScroller>
          <Toaster position="bottom-center" toastOptions={{ style: { background: '#1F1B16', color: '#F7F0DF', border: '1px solid #332C24' } }} />
          <EuroConcierge />
          <KonamiCode />

          <Analytics />
          <SpeedInsights />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}