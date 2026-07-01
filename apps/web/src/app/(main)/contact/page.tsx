/* eslint-disable */
// @ts-nocheck
import Link from 'next/link';
import { getTranslations, getLocale } from 'next-intl/server';
import { createServerSupabaseClient } from '@/supabase-server';
import { ContactForm } from './ContactForm';

export const dynamic = 'force-dynamic';

async function getContactSettings() {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from('system_settings')
    .select('key, value')
    .in('key', ['contact_whatsapp', 'contact_email']);

  const defaults = {
    contact_whatsapp: '963000000000',
    contact_email: 'support@eurostore.com',
  };

  for (const row of (data ?? [])) {
    if (row.value) (defaults as any)[row.key] = row.value;
  }

  return defaults;
}

export default async function ContactPage() {
  const t = await getTranslations();
  const locale = await getLocale();
  const isAr = locale === 'ar';
  const { contact_whatsapp, contact_email } = await getContactSettings();

  return (
    <main className="min-h-screen bg-background text-[#1F1B16] px-6 py-12" dir={isAr ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-lg">
        <nav className="mb-8">
          <Link href="/" className="text-primary text-sm hover:underline">
            {t('common.appName')}
          </Link>
        </nav>

        <h1 className="text-2xl font-semibold mb-2">{t('footer.contact')}</h1>
        <p className="text-[#6F6658] text-sm mb-10">{t('contact.subtitle')}</p>

        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          <a
            href={`https://wa.me/${contact_whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-md border border-border bg-background-card p-4 hover:border-green-700/50 transition-colors"
          >
            <span className="text-2xl">📱</span>
            <div>
              <p className="text-sm font-medium text-[#1F1B16]">{t('contact.whatsapp')}</p>
              <p className="text-xs text-[#6F6658]">{t('contact.directContact')}</p>
            </div>
          </a>
          <a
            href={`mailto:${contact_email}`}
            className="flex items-center gap-3 rounded-md border border-border bg-background-card p-4 hover:border-primary/50 transition-colors"
          >
            <span className="text-2xl">✉️</span>
            <div>
              <p className="text-sm font-medium text-[#1F1B16]">{t('contact.email')}</p>
              <p className="text-xs text-[#6F6658]">{contact_email}</p>
            </div>
          </a>
        </div>

        <ContactForm
          t_submit={t('auth.submit')}
          t_name={t('contact.name')}
          t_namePlaceholder={t('contact.namePlaceholder')}
          t_email={t('auth.email')}
          t_message={t('contact.message')}
          t_messagePlaceholder={t('contact.messagePlaceholder')}
          t_sentSuccess={t('contact.sentSuccess')}
          t_willContactSoon={t('contact.willContactSoon')}
        />
      </div>
    </main>
  );
}
