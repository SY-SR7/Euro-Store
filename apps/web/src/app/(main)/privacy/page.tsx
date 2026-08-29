import { getLocale } from 'next-intl/server';
import { LegalDocument } from '@/components/legal/LegalDocument';

const AR_SECTIONS = [
  { title: 'البيانات التي نجمعها', paragraphs: ['نجمع بيانات الحساب مثل الاسم والبريد والهاتف، وعناوين التوصيل، وسجل الطلبات والاستبدالات، وحركة نقاط الولاء والإحالات، وتفضيلات اللغة، ورموز إشعارات الأجهزة عند تفعيلها. كما نسجل أحداث الأمان والتدقيق اللازمة لحماية الحساب والمنصة.'] },
  { title: 'كيف نستخدم البيانات', paragraphs: ['نستخدم البيانات لإنشاء الحساب والتحقق منه، وتنفيذ الطلبات والدفع والشحن والاستبدال، وتشغيل الولاء والإحالات، وإرسال الإشعارات المطلوبة، ومنع الاحتيال، وتحليل أداء الخدمة وتحسينها.'] },
  { title: 'مكان التخزين والحماية', paragraphs: ['تُخزن بيانات التطبيق الأساسية لدى Supabase في المنطقة التي يحددها مشغّل الخدمة عند النشر. نستخدم التحكم في الوصول، وسياسات مستوى الصف، والتشفير أثناء النقل، وروابط قصيرة العمر للملفات الخاصة، وسجلات تدقيق للعمليات الحساسة.'] },
  { title: 'مشاركة البيانات', paragraphs: ['نشارك الحد الأدنى اللازم مع شركة التوصيل لتنفيذ الشحنة، ومع مزود الدفع عند اختيار Sham Cash، ومع مزودي البريد والإشعارات لإيصال الرسائل. لا نبيع البيانات الشخصية، ولا يحصل الشريك المساعد إلا على البيانات اللازمة لطلب الاستبدال المسند إليه.'] },
  { title: 'الاحتفاظ بالبيانات', paragraphs: ['تُحفظ بيانات الطلبات والسجلات المحاسبية لمدة تصل إلى سبع سنوات أو للمدة التي يفرضها القانون. تُحفظ بيانات الحساب حتى طلب الحذف، مع إمكانية الاحتفاظ ببيانات محدودة عند الحاجة لالتزام قانوني أو مكافحة الاحتيال أو تسوية نزاع.'] },
  { title: 'حقوقك', paragraphs: ['يمكنك الاطلاع على بيانات الملف وتحديثها وعناوينك من الحساب، وطلب نسخة أو تصحيح أو حذف البيانات من خلال صفحة التواصل. قد نطلب التحقق من الهوية قبل تنفيذ الطلب، ونوضح ما يتعذر حذفه لأسباب قانونية.'] },
  { title: 'ملفات الارتباط والتخزين المحلي', paragraphs: ['نستخدم ملفات ارتباط آمنة لإدارة الجلسة. قد يستخدم الموقع sessionStorage لحفظ سلة الضيف مؤقتاً وlocalStorage لتفضيلات اللغة والمظهر. لا نخزن رموز الدخول الحساسة في localStorage.'] },
  { title: 'الأمان والحوادث', paragraphs: ['نطبق حدوداً للطلبات، والتحقق من المدخلات والملفات، وصلاحيات حسب الدور، ومصادقة إضافية للإدارة. لا توجد وسيلة إلكترونية خالية تماماً من المخاطر؛ وعند وقوع حادث نتعامل معه وفق الالتزامات القانونية ونحد من أثره.'] },
  { title: 'التواصل بشأن الخصوصية', paragraphs: ['لاستفسار أو طلب متعلق بالخصوصية، استخدم صفحة التواصل وحدد أن الرسالة تخص البيانات الشخصية. لا ترسل كلمة المرور أو رمز الدخول أو رمز QR ضمن الرسالة.'] },
];

const EN_SECTIONS = [
  { title: 'Data we collect', paragraphs: ['We collect account details such as name, email, phone number, delivery addresses, order and exchange history, loyalty and referral activity, language preferences, and device notification tokens when enabled. We also record security and audit events needed to protect accounts and the platform.'] },
  { title: 'How we use data', paragraphs: ['We use data to create and verify accounts, fulfil orders, payments, shipping and exchanges, operate loyalty and referrals, deliver requested notifications, prevent fraud, and analyse and improve service performance.'] },
  { title: 'Storage and security', paragraphs: ['Core application data is stored with Supabase in the region selected by the service operator at deployment. Protections include access controls, row-level policies, encryption in transit, short-lived links for private files, and audit records for sensitive operations.'] },
  { title: 'Data sharing', paragraphs: ['We share the minimum needed with delivery providers to fulfil shipments, with Sham Cash when that payment method is selected, and with email and notification providers to deliver messages. We do not sell personal data. Partner stores only receive data needed for an exchange assigned to them.'] },
  { title: 'Retention', paragraphs: ['Order and accounting records are retained for up to seven years or as required by law. Account data is retained until deletion is requested, although limited information may be kept for legal obligations, fraud prevention, or dispute resolution.'] },
  { title: 'Your rights', paragraphs: ['You can view and update profile details and addresses through your account, and request access, correction, a copy, or deletion through the contact page. We may verify identity first and will explain information that must be retained by law.'] },
  { title: 'Cookies and local storage', paragraphs: ['We use secure cookies to manage sessions. The site may use sessionStorage for the temporary guest cart and localStorage for language and theme preferences. Sensitive authentication tokens are not stored in localStorage.'] },
  { title: 'Security and incidents', paragraphs: ['We apply request limits, input and file validation, role-based access, and additional authentication for administration. No electronic system is risk-free; incidents are handled under applicable obligations and their impact is contained.'] },
  { title: 'Privacy contact', paragraphs: ['For a privacy inquiry or request, use the contact page and identify that the message concerns personal data. Do not send a password, login token, or QR code in the message.'] },
];

export default async function PrivacyPage() {
  const isAr = (await getLocale()) === 'ar';
  return <LegalDocument title={isAr ? 'سياسة الخصوصية' : 'Privacy Policy'} updatedLabel={isAr ? 'آخر تحديث: 4 آب 2026' : 'Last updated: 4 August 2026'} introduction={isAr ? 'توضح هذه السياسة البيانات التي يعالجها يورو ستور ولماذا، والجهات التي قد تستلم الحد الأدنى منها، والخيارات المتاحة لك.' : 'This policy explains what Euro Store processes, why it is used, who may receive the minimum necessary data, and the choices available to you.'} sections={isAr ? AR_SECTIONS : EN_SECTIONS} dir={isAr ? 'rtl' : 'ltr'} />;
}
