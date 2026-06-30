import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages, getTranslations } from 'next-intl/server';
import './globals.css';
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('common');
  return {
    title: t('appName', { fallback: 'EuroStore — يورو ستور' }),
    description: t('appDescription', { fallback: 'EuroStore Customer Storefront' }),
  };
}

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body className="min-h-screen bg-[#F8F5EF] text-[#171411] antialiased">
<NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
</body>
    </html>
  );
}