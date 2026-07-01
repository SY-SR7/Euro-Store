'use client';
/* eslint-disable */
// @ts-nocheck
import Link from 'next/link';
import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';

export default function ContactPage() {
  const t = useTranslations();
  const locale = useLocale();
  const isAr = locale === 'ar';
  const [sent, setSent] = useState(false);

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
            href="https://wa.me/963000000000"
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
            href="mailto:support@eurostore.com"
            className="flex items-center gap-3 rounded-md border border-[#E8DCC3] bg-[#FFFDF8] p-4 hover:border-[#C9A84C]/50 transition-colors"
          >
            <span className="text-2xl"></span>
            <div>
              <p className="text-sm font-medium text-[#1F1B16]">{t('contact.email')}</p>
              <p className="text-xs text-[#6F6658]">support@eurostore.com</p>
            </div>
          </a>
        </div>

        {sent ? (
          <div className="rounded-md border border-green-800 bg-green-900/10 p-6 text-center">
            <p className="text-green-400 font-medium">✓ {t('contact.sentSuccess')}</p>
            <p className="mt-2 text-sm text-[#6F6658]">{t('contact.willContactSoon')}</p>
          </div>
        ) : (
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => { e.preventDefault(); setSent(true); }}
          >
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-[#6F6658]">{t('contact.name')}</span>
              <input
                name="name" required
                className="rounded-md border border-[#E8DCC3] bg-[#FFFDF8] px-4 py-2.5 text-sm text-[#1F1B16] placeholder:text-[#8B8172] focus:border-[#C9A84C] focus:outline-none"
                placeholder={t('contact.namePlaceholder')}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-[#6F6658]">{t('auth.email')}</span>
              <input
                name="email" type="email" required
                className="rounded-md border border-[#E8DCC3] bg-[#FFFDF8] px-4 py-2.5 text-sm text-[#1F1B16] placeholder:text-[#8B8172] focus:border-[#C9A84C] focus:outline-none"
                placeholder="email@example.com"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-[#6F6658]">{t('contact.message')}</span>
              <textarea
                name="message" required rows={5}
                className="rounded-md border border-[#E8DCC3] bg-[#FFFDF8] px-4 py-2.5 text-sm text-[#1F1B16] placeholder:text-[#8B8172] focus:border-[#C9A84C] focus:outline-none resize-none"
                placeholder={t('contact.messagePlaceholder')}
              />
            </label>
            <button
              type="submit"
              className="rounded-sm bg-[#C9A84C] py-2.5 text-sm font-semibold text-[#111] hover:bg-[#D8B95F] transition-colors"
            >
              {t('auth.submit')}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
