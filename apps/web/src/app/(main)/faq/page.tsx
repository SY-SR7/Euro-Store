/* eslint-disable */
// @ts-nocheck
import Link from 'next/link';
import { getTranslations, getLocale } from 'next-intl/server';

export default async function FaqPage(): Promise<JSX.Element> {
  const t = await getTranslations();
  const locale = await getLocale();
  const isAr = locale === 'ar';

  const FAQ_ITEMS = [
    { q: t('faq.q1'), a: t('faq.a1', { fallback: 'بعد تأكيد طلبك ستتلقى رسالة تأكيد. يمكنك متابعة حالة الطلب من صفحة "طلباتي" في حسابك.' }) },
    { q: t('faq.q2'), a: t('faq.a2') },
    { q: t('faq.q3'), a: t('faq.a3') },
    { q: t('faq.q4'), a: t('faq.a4') },
    { q: t('faq.q5'), a: t('faq.a5') },
    { q: t('faq.q6'), a: t('faq.a6') },
  ];
  return (
    <main className="min-h-screen bg-background text-[#1F1B16] px-6 py-12" dir={isAr ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-2xl">
        <nav className="mb-8">
          <Link href="/" className="text-primary text-sm hover:underline">
             {t('common.appName')}
          </Link>
        </nav>

        <h1 className="text-2xl font-semibold mb-2">{t('footer.faq')}</h1>
        <p className="text-[#6F6658] text-sm mb-10">{t('faq.subtitle')}</p>

        <div className="flex flex-col gap-4">
          {FAQ_ITEMS.map((item, i) => (
            <details
              key={i}
              className="group rounded-md border border-border bg-background-card open:border-primary/30"
            >
              <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-sm font-medium text-[#1F1B16] marker:hidden list-none">
                {item.q}
                <span className="text-primary text-lg transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="px-5 pb-5 text-sm leading-7 text-[#6F6658]">{item.a}</p>
            </details>
          ))}
        </div>

        <div className="mt-10 text-center">
          <p className="text-sm text-[#6F6658] mb-4">{t('faq.anotherQuestion')}</p>
          <Link
            href="/contact"
            className="inline-block rounded-sm border border-primary px-6 py-2.5 text-sm text-primary hover:bg-primary hover:text-text-primary transition-colors"
          >
            {t('footer.contact')}
          </Link>
        </div>
      </div>
    </main>
  );
}
