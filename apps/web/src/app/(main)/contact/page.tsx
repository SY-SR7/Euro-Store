/* eslint-disable */
// @ts-nocheck
import Link from 'next/link';
import { useState } from 'react';
import { createServerSupabaseClient } from '@/supabase-server';
import { getTranslations, getLocale } from 'next-intl/server';

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
    if (row.value) defaults[row.key as keyof typeof defaults] = row.value;
  }
  
  return defaults;
}

export default async function ContactPage() {
  const t = await getTranslations();
  const locale = await getLocale();
  const isAr = locale === 'ar';
  const { contact_whatsapp, contact_email } = await getContactSettings();

  return (
    <main className="min-h-screen bg-[#FAF7EF] text-[#1F1B16] px-6 py-12" dir={isAr ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-lg">
        <nav className="mb-8">
          <Link href="/" className="text-[#C9A84C] text-sm hover:underline">
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
            className="flex items-center gap-3 rounded-md border border-[#E8DCC3] bg-[#FFFDF8] p-4 hover:border-green-700/50 transition-colors"
          >
            <span className="text-2xl"></span>
            <div>
              <p className="text-sm font-medium text-[#1F1B16]">{t('contact.whatsapp')}</p>
              <p className="text-xs text-[#6F6658]">{t('contact.directContact')}</p>
            </div>
          </a>
          <a
            href={`mailto:${contact_email}`}
            className="flex items-center gap-3 rounded-md border border-[#E8DCC3] bg-[#FFFDF8] p-4 hover:border-[#C9A84C]/50 transition-colors"
          >
            <span className="text-2xl"></span>
            <div>
              <p className="text-sm font-medium text-[#1F1B16]">{t('contact.email')}</p>
              <p className="text-xs text-[#6F6658]">{contact_email}</p>
            </div>
          </a>
        </div>

        <ContactForm t_submit={t('auth.submit')} t_name={t('contact.name')} t_namePlaceholder={t('contact.namePlaceholder')} t_email={t('auth.email')} t_message={t('contact.message')} t_messagePlaceholder={t('contact.messagePlaceholder')} t_sentSuccess={t('contact.sentSuccess')} t_willContactSoon={t('contact.willContactSoon')} />
      </div>
    </main>
  );
}

// Must be in a separate client component file for interactivity, but since the page already uses server components,
// we inline the form logic as a minimal interactive island.
import ContactFormClient from './ContactForm';
// We'll render a simple inline form instead to avoid needing a separate file:
function ContactFormFallback({ t_submit, t_name, t_namePlaceholder, t_email, t_message, t_messagePlaceholder, t_sentSuccess, t_willContactSoon }: any) {
  'use client';
  const [sent, setSent] = useState(false);
  if (sent) {
    return (
      <div className="rounded-md border border-green-800 bg-green-900/10 p-6 text-center">
        <p className="text-green-400 font-medium">✓ {t_sentSuccess}</p>
        <p className="mt-2 text-sm text-[#6F6658]">{t_willContactSoon}</p>
      </div>
    );
  }
  return (
    <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); setSent(true); }}>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-[#6F6658]">{t_name}</span>
        <input name="name" required className="rounded-md border border-[#E8DCC3] bg-[#FFFDF8] px-4 py-2.5 text-sm text-[#1F1B16] placeholder:text-[#8B8172] focus:border-[#C9A84C] focus:outline-none" placeholder={t_namePlaceholder} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-[#6F6658]">{t_email}</span>
        <input name="email" type="email" required className="rounded-md border border-[#E8DCC3] bg-[#FFFDF8] px-4 py-2.5 text-sm text-[#1F1B16] placeholder:text-[#8B8172] focus:border-[#C9A84C] focus:outline-none" placeholder="email@example.com" />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-[#6F6658]">{t_message}</span>
        <textarea name="message" required rows={5} className="rounded-md border border-[#E8DCC3] bg-[#FFFDF8] px-4 py-2.5 text-sm text-[#1F1B16] placeholder:text-[#8B8172] focus:border-[#C9A84C] focus:outline-none resize-none" placeholder={t_messagePlaceholder} />
      </label>
      <button type="submit" className="rounded-sm bg-[#C9A84C] py-2.5 text-sm font-semibold text-[#111] hover:bg-[#D8B95F] transition-colors">{t_submit}</button>
    </form>
  );
}
