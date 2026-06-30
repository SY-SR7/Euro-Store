/* eslint-disable */
// @ts-nocheck
import Link from 'next/link';
import { getTranslations, getLocale } from 'next-intl/server';

export default async function FaqPage(): Promise<JSX.Element> {
  const t = await getTranslations();
  const locale = await getLocale();
  const isAr = locale === 'ar';

  const FAQ_ITEMS = [
    { q: t('faq.q1', { fallback: 'كيف أتتبع طلبي؟' }), a: t('faq.a1', { fallback: 'بعد تأكيد طلبك ستتلقى رسالة تأكيد. يمكنك متابعة حالة الطلب من صفحة "طلباتي" في حسابك.' }) },
    { q: t('faq.q2', { fallback: 'ما هي مدة التوصيل؟' }), a: t('faq.a2', { fallback: 'يستغرق التوصيل من 2 إلى 5 أيام عمل حسب المحافظة. دمشق وريفها عادةً يوم أو يومان.' }) },
    { q: t('faq.q3', { fallback: 'هل يمكنني استبدال المنتج؟' }), a: t('faq.a3', { fallback: 'نعم، لدينا سياسة استبدال خلال 7 أيام من استلام الطلب بشرط أن يكون المنتج بحالته الأصلية وبعبوته.' }) },
    { q: t('faq.q4', { fallback: 'ما هي طرق الدفع المتاحة؟' }), a: t('faq.a4', { fallback: 'نقبل الدفع عند الاستلام (كاش) حالياً. قريباً سنضيف خيارات دفع إلكتروني.' }) },
    { q: t('faq.q5', { fallback: 'كيف أحصل على نقاط الولاء؟' }), a: t('faq.a5', { fallback: 'تحصل على نقاط مقابل كل عملية شراء. 10 نقاط لكل 1000 ل.س. النقاط تُستخدم لخصم من طلباتك القادمة.' }) },
    { q: t('faq.q6', { fallback: 'هل شحنكم مجاني؟' }), a: t('faq.a6', { fallback: 'نعم! الشحن مجاني للطلبات التي تتجاوز الحد الأدنى المحدد لكل محافظة.' }) },
  ];
  return (
    <main className="min-h-screen bg-[#FAF7EF] text-[#1F1B16] px-6 py-12" dir={isAr ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-2xl">
        <nav className="mb-8">
          <Link href="/" className="text-[#C9A84C] text-sm hover:underline">
             {t('common.appName')}
          </Link>
        </nav>

        <h1 className="text-2xl font-semibold mb-2">{t('footer.faq')}</h1>
        <p className="text-[#6F6658] text-sm mb-10">{t('faq.subtitle', { fallback: 'إجابات على أكثر الأسئلة شيوعاً' })}</p>

        <div className="flex flex-col gap-4">
          {FAQ_ITEMS.map((item, i) => (
            <details
              key={i}
              className="group rounded-md border border-[#E8DCC3] bg-[#FFFDF8] open:border-[#C9A84C]/30"
            >
              <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-sm font-medium text-[#1F1B16] marker:hidden list-none">
                {item.q}
                <span className="text-[#C9A84C] text-lg transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="px-5 pb-5 text-sm leading-7 text-[#6F6658]">{item.a}</p>
            </details>
          ))}
        </div>

        <div className="mt-10 text-center">
          <p className="text-sm text-[#6F6658] mb-4">{t('faq.anotherQuestion', { fallback: 'لديك سؤال آخر؟' })}</p>
          <Link
            href="/contact"
            className="inline-block rounded-sm border border-[#C9A84C] px-6 py-2.5 text-sm text-[#C9A84C] hover:bg-[#C9A84C] hover:text-[#111] transition-colors"
          >
            {t('footer.contact')}
          </Link>
        </div>
      </div>
    </main>
  );
}
