/* eslint-disable */
// @ts-nocheck
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

const FAQ_ITEMS = [
  { q: 'كيف أتتبع طلبي؟', a: 'بعد تأكيد طلبك ستتلقى رسالة تأكيد. يمكنك متابعة حالة الطلب من صفحة "طلباتي" في حسابك.' },
  { q: 'ما هي مدة التوصيل؟', a: 'يستغرق التوصيل من 2 إلى 5 أيام عمل حسب المحافظة. دمشق وريفها عادةً يوم أو يومان.' },
  { q: 'هل يمكنني استبدال المنتج؟', a: 'نعم، لدينا سياسة استبدال خلال 7 أيام من استلام الطلب بشرط أن يكون المنتج بحالته الأصلية وبعبوته.' },
  { q: 'ما هي طرق الدفع المتاحة؟', a: 'نقبل الدفع عند الاستلام (كاش) حالياً. قريباً سنضيف خيارات دفع إلكتروني.' },
  { q: 'كيف أحصل على نقاط الولاء؟', a: 'تحصل على نقاط مقابل كل عملية شراء. 10 نقاط لكل 1000 ل.س. النقاط تُستخدم لخصم من طلباتك القادمة.' },
  { q: 'هل شحنكم مجاني؟', a: 'نعم! الشحن مجاني للطلبات التي تتجاوز الحد الأدنى المحدد لكل محافظة.' },
];

export default async function FaqPage(): Promise<JSX.Element> {
  const t = await getTranslations();
  return (
    <main className="min-h-screen bg-[#0F0F0F] text-[#E2E2E2] px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <nav className="mb-8">
          <Link href="/" className="text-[#C9A84C] text-sm hover:underline">
             {t('common.appName')}
          </Link>
        </nav>

        <h1 className="text-2xl font-semibold mb-2">{t('footer.faq')}</h1>
        <p className="text-[#9CA3AF] text-sm mb-10">إجابات على أكثر الأسئلة شيوعاً</p>

        <div className="flex flex-col gap-4">
          {FAQ_ITEMS.map((item, i) => (
            <details
              key={i}
              className="group rounded-md border border-[#2E2E2E] bg-[#151515] open:border-[#C9A84C]/30"
            >
              <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-sm font-medium text-[#E2E2E2] marker:hidden list-none">
                {item.q}
                <span className="text-[#C9A84C] text-lg transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="px-5 pb-5 text-sm leading-7 text-[#9CA3AF]">{item.a}</p>
            </details>
          ))}
        </div>

        <div className="mt-10 text-center">
          <p className="text-sm text-[#9CA3AF] mb-4">لديك سؤال آخر؟</p>
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
