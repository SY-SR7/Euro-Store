import { getLocale } from 'next-intl/server';
import { LegalDocument } from '@/components/legal/LegalDocument';

const AR_SECTIONS = [
  { title: 'التسجيل والحساب', paragraphs: ['يجب تقديم معلومات صحيحة وحديثة عند إنشاء الحساب. أنت مسؤول عن حماية بيانات الدخول وعن جميع الأنشطة التي تتم من خلال حسابك، ويجب إبلاغنا عند الاشتباه باستخدام غير مصرح به.'] },
  { title: 'معلومات المنتجات والأسعار', paragraphs: ['نبذل جهداً معقولاً لعرض الأوصاف والصور والمقاسات والمخزون بدقة. تُعرض الأسعار بالليرة السورية، ويُعتمد السعر والمخزون اللذان يؤكدهما النظام عند إتمام الطلب.'] },
  { title: 'الطلبات والدفع', paragraphs: ['إرسال الطلب لا يعني قبوله نهائياً. يصبح الطلب مؤكداً عند اعتماده وفق سير المعالجة الظاهر في حسابك. تتوفر طرق الدفع المعروضة أثناء الدفع فقط، ويمكن إلغاء الطلب المعلّق وفق السياسة المطبقة في المنصة.'] },
  { title: 'الشحن والتسليم', paragraphs: ['تظهر تكلفة الشحن قبل تأكيد الطلب وتختلف حسب المحافظة والقواعد التي يحددها المتجر. أوقات الوصول تقديرية وقد تتأثر بجهة التوصيل أو ظروف خارجة عن السيطرة المعقولة.'] },
  { title: 'سياسة الاستبدال', paragraphs: ['يمكن طلب الاستبدال للطلب المؤهل خلال النافذة الزمنية التي يعرضها النظام، مع بقاء المنتج بحالته المطلوبة وإرفاق صور الإثبات. يخضع الطلب للمراجعة، وتظهر حالته وخطوات تسليمه في حساب العميل.'] },
  { title: 'نقاط الولاء', paragraphs: ['نقاط الولاء شخصية وغير قابلة للتحويل ولا تمثل نقداً. تُكتسب وتُستخدم وفق الصيغة والحدود المعروضة في المنصة، ويجوز تعديل الصيغة للعمليات المستقبلية مع الحفاظ على السجلات المحاسبية.'] },
  { title: 'السلوك المحظور وتعليق الحساب', paragraphs: ['يُحظر الاحتيال أو إساءة استخدام الخصومات والنقاط أو محاولة اختراق المنصة أو حسابات الآخرين. يجوز تقييد الحساب عند وجود مؤشرات إساءة استخدام، مع الاحتفاظ بسجلات التدقيق اللازمة لحماية الحقوق.'] },
  { title: 'الملكية الفكرية', paragraphs: ['المحتوى والعلامة والتصميمات والمواد المنشورة مملوكة ليورو ستور أو مستخدمة بترخيص، ولا يجوز نسخها أو استغلالها تجارياً دون إذن.'] },
  { title: 'حدود المسؤولية', paragraphs: ['لا يُستبعد أي حق لا يجوز استبعاده قانوناً. وفي الحدود التي يسمح بها القانون، تقتصر مسؤولية يورو ستور على الضرر المباشر المرتبط بالطلب محل النزاع.'] },
  { title: 'تعديل الشروط', paragraphs: ['قد تُحدّث هذه الشروط عند تغير الخدمة أو المتطلبات القانونية. يُنشر تاريخ آخر تحديث، ويسري التعديل على الاستخدام والطلبات اللاحقة لنشره ما لم يقتض القانون خلاف ذلك.'] },
  { title: 'القانون الواجب التطبيق', paragraphs: ['تخضع هذه الشروط للقانون الواجب التطبيق على جهة تشغيل يورو ستور والعميل. لا تمنع هذه الشروط أي حماية إلزامية يمنحها القانون للمستهلك.'] },
  { title: 'التواصل', paragraphs: ['يمكن إرسال الاستفسارات المتعلقة بالشروط من صفحة التواصل في الموقع. تُعتمد بيانات التواصل الرسمية المنشورة هناك عند الحاجة إلى إشعار مكتوب.'] },
];

const EN_SECTIONS = [
  { title: 'Registration and accounts', paragraphs: ['You must provide accurate, current information. You are responsible for safeguarding your credentials and for activity through your account, and should notify us of suspected unauthorized use.'] },
  { title: 'Product information and pricing', paragraphs: ['We take reasonable care to present descriptions, images, sizes, and stock accurately. Prices are shown in Syrian pounds; the price and availability confirmed by the system at checkout apply.'] },
  { title: 'Orders and payment', paragraphs: ['Submitting an order is not final acceptance. An order is confirmed through the processing status shown in your account. Only payment methods offered at checkout are available, and pending orders may be cancelled under the platform policy.'] },
  { title: 'Shipping and delivery', paragraphs: ['Shipping cost is shown before confirmation and depends on the governorate and store rules. Delivery dates are estimates and may be affected by the carrier or events outside reasonable control.'] },
  { title: 'Exchange policy', paragraphs: ['An exchange may be requested for an eligible order within the window shown by the platform, provided the item meets the required condition and proof photos are supplied. Requests are reviewed and tracked in the customer account.'] },
  { title: 'Loyalty points', paragraphs: ['Points are personal, non-transferable, and have no cash value. They are earned and redeemed under the formula and limits shown in the platform. Future formulas may change while accounting records are retained.'] },
  { title: 'Prohibited conduct and suspension', paragraphs: ['Fraud, abuse of discounts or points, and attempts to compromise the platform or another account are prohibited. Accounts may be restricted when abuse is reasonably suspected, with audit records retained to protect legitimate rights.'] },
  { title: 'Intellectual property', paragraphs: ['Published content, branding, designs, and materials are owned by Euro Store or used under licence and may not be copied or commercially exploited without permission.'] },
  { title: 'Limitation of liability', paragraphs: ['Nothing excludes a right that cannot legally be excluded. To the extent permitted by law, Euro Store is responsible only for direct loss connected to the order in dispute.'] },
  { title: 'Changes to these terms', paragraphs: ['These terms may be updated when the service or legal requirements change. The latest revision date is published, and changes apply to later use and orders unless applicable law requires otherwise.'] },
  { title: 'Governing law', paragraphs: ['These terms are governed by the law applicable to the Euro Store operator and customer. They do not limit mandatory consumer protections.'] },
  { title: 'Contact', paragraphs: ['Questions about these terms may be submitted through the website contact page. The official contact details published there apply to written notices.'] },
];

export default async function TermsPage() {
  const isAr = (await getLocale()) === 'ar';
  return <LegalDocument title={isAr ? 'الشروط والأحكام' : 'Terms and Conditions'} updatedLabel={isAr ? 'آخر تحديث: 4 آب 2026' : 'Last updated: 4 August 2026'} introduction={isAr ? 'تنظم هذه الشروط استخدام موقع وخدمات يورو ستور وعمليات الشراء والاستبدال وبرنامج الولاء.' : 'These terms govern use of the Euro Store website and services, purchases, exchanges, and the loyalty programme.'} sections={isAr ? AR_SECTIONS : EN_SECTIONS} dir={isAr ? 'rtl' : 'ltr'} />;
}
