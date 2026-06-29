'use client';
/* eslint-disable */
// @ts-nocheck
import Link from 'next/link';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

export default function ContactPage() {
  const t = useTranslations();
  const [sent, setSent] = useState(false);

  return (
    <main className="min-h-screen bg-[#0F0F0F] text-[#E2E2E2] px-6 py-12">
      <div className="mx-auto max-w-lg">
        <nav className="mb-8">
          <Link href="/" className="text-[#C9A84C] text-sm hover:underline">
            ← {t('common.appName')}
          </Link>
        </nav>

        <h1 className="text-2xl font-semibold mb-2">{t('footer.contact')}</h1>
        <p className="text-[#9CA3AF] text-sm mb-10">نحن هنا للمساعدة — تواصل معنا وسنرد في أقرب وقت</p>

        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          <a
            href="https://wa.me/963000000000"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-md border border-[#2E2E2E] bg-[#151515] p-4 hover:border-green-700/50 transition-colors"
          >
            <span className="text-2xl">💬</span>
            <div>
              <p className="text-sm font-medium text-[#E2E2E2]">واتساب</p>
              <p className="text-xs text-[#9CA3AF]">تواصل مباشر</p>
            </div>
          </a>
          <a
            href="mailto:support@eurostore.com"
            className="flex items-center gap-3 rounded-md border border-[#2E2E2E] bg-[#151515] p-4 hover:border-[#C9A84C]/50 transition-colors"
          >
            <span className="text-2xl">📧</span>
            <div>
              <p className="text-sm font-medium text-[#E2E2E2]">البريد الإلكتروني</p>
              <p className="text-xs text-[#9CA3AF]">support@eurostore.com</p>
            </div>
          </a>
        </div>

        {sent ? (
          <div className="rounded-md border border-green-800 bg-green-900/10 p-6 text-center">
            <p className="text-green-400 font-medium">✓ تم إرسال رسالتك بنجاح!</p>
            <p className="mt-2 text-sm text-[#9CA3AF]">سنتواصل معك في أقرب وقت ممكن</p>
          </div>
        ) : (
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => { e.preventDefault(); setSent(true); }}
          >
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-[#9CA3AF]">الاسم</span>
              <input
                name="name" required
                className="rounded-md border border-[#2E2E2E] bg-[#151515] px-4 py-2.5 text-sm text-[#E2E2E2] placeholder:text-[#6B7280] focus:border-[#C9A84C] focus:outline-none"
                placeholder="اسمك الكريم"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-[#9CA3AF]">{t('auth.email')}</span>
              <input
                name="email" type="email" required
                className="rounded-md border border-[#2E2E2E] bg-[#151515] px-4 py-2.5 text-sm text-[#E2E2E2] placeholder:text-[#6B7280] focus:border-[#C9A84C] focus:outline-none"
                placeholder="email@example.com"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-[#9CA3AF]">الرسالة</span>
              <textarea
                name="message" required rows={5}
                className="rounded-md border border-[#2E2E2E] bg-[#151515] px-4 py-2.5 text-sm text-[#E2E2E2] placeholder:text-[#6B7280] focus:border-[#C9A84C] focus:outline-none resize-none"
                placeholder="كيف يمكننا مساعدتك؟"
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
