import { getLocale } from 'next-intl/server';
import { LegalDocument } from '@/components/legal/LegalDocument';

const AR_SECTIONS = [
  {
    title: 'مقدمة ونطاق التطبيق',
    paragraphs: [
      'تحدد سياسة الخصوصية هذه الكيفية التي تقوم بها منصة "يورو ستور" (EuroStore) بجمع واستخدام وحماية ومشاركة بياناتك الشخصية عند زيارة موقعنا الإلكتروني أو استخدام خدماتنا أو الشراء من متجرنا.',
      'إن حماية بياناتك الشخصية واحترام خصوصيتك هما ركيزتان أساسيتان في عملنا. نحن نلتزم بالمعايير القانونية والأخلاقية العالمية وأفضل الممارسات التقنية المعمول بها لحماية أمن وسرية بيانات المستخدمين.'
    ]
  },
  {
    title: 'البيانات التي نجمعها ومعلومات الحساب',
    paragraphs: [
      'بيانات الحساب والهوية: وتشمل الاسم الكامل، البريد الإلكتروني، رقم الهاتف المحمول، وكلمة المرور المشفرة تشفيراً أحادي الاتجاه (Bcrypt/Argon2).',
      'بيانات الشحن والتوصيل: وتشمل المحافظة، المدينة، المنطقة، تفاصيل العنوان الدقيق، وأي تعليمات خاصة بالتسليم.',
      'سجل المشتريات والطلبات: وتشمل المنتجات المشتراة، الفواتير، المقاسات، الألوان، سجل عمليات الاستبدال، وسجل استخدام نقاط برنامج الولاء وقسائم الخصم.',
      'البيانات التقنية وبيانات التصفح: وتشمل عنوان بروتوكول الإنترنت (IP)، نوع المتصفح، نظام التشغيل، سجل أحداث الأمان، وتفضيلات اللغة والمظهر.'
    ]
  },
  {
    title: 'الأغراض القانونية لاستخدام ومعالجة البيانات',
    paragraphs: [
      'معالجة الطلبات وتنفيذها: التحقق من صحة الطلب، تجهيز المنتجات، تنسيق الشحن والتوصيل مع مندوبي الشحن، وإصدار الفواتير الرسمية.',
      'إدارة حساب العميل وبرنامج الولاء: احتساب نقاط المكافآت، تفعيل رموز الخصم، وإتاحة ميزة متابعة وتتبع حالة الشحنات لحظياً.',
      'خدمة العملاء وطلبات الاستبدال: الرد على الاستفسارات، معالجة طلبات استبدال المقاسات أو المنتجات وفق السياسة المعتمدة.',
      'أمن وحماية المنصة: منع عمليات الاحتيال، كشف النشاطات غير المصرح بها، وضمان سلامة واستقرار النظام لجميع المستخدمين.'
    ]
  },
  {
    title: 'مشاركة البيانات مع أطراف ثالثة موثوقة',
    paragraphs: [
      'نحن لا نقوم ببيع أو تأجير أو المتاجرة ببياناتك الشخصية لأي طرف ثالث تحت أي ظرف من الظروف.',
      'يتم مشاركة الحد الأدنى والضروري فقط من البيانات مع الأطراف الخدمية التالية لتنفيذ طلبك حصراً:',
      '1. شركات ومندوبو التوصيل المحلي: يتم تزويدهم فقط باسم المستلم، رقم الهاتف، وعنوان التوصيل لتسليم الشحنة.',
      '2. مزودو خدمات الدفع الإلكتروني (مثل Sham Cash): عند اختيار الدفع الإلكتروني، تتم معالجة المعاملة المالية عبر بوابات دفع آمنة ومشفرة بالكامل دون تخزين أية بيانات بطاقات حساسة على خوادمنا.',
      '3. المتاجر والشركاء المساعدون المعتمدون: في حال طلب الاستبدال عبر نقطة استلام أو متجر شريك، يتم تزويدهم بتفاصيل طلب الاستبدال ورقم الشحنة فقط.'
    ]
  },
  {
    title: 'التخزين وأمن وحماية البيانات',
    paragraphs: [
      'تُخزن بيانات المنصة في قواعد بيانات سحابية متقدمة ومحمية بأنظمة جدران الحماية، وتشفير كامل للبيانات أثناء النقل (TLS 1.3) وأثناء التخزين (AES-256).',
      'نطبق سياسات أمان صارمة على مستوى قواعد البيانات (Row Level Security - RLS)، مما يضمن عدم وصول أي مستخدم لبيانات غيره.',
      'جلسات تسجيل الدخول محمية بملفات تعريف ارتباط آمنة (httpOnly Cookies) تمنع هجمات سرقة الجلسات وحقن النصوص البرمجية (XSS).'
    ]
  },
  {
    title: 'حقوق المستخدم والتحكم بالبيانات',
    paragraphs: [
      'يحق لك في أي وقت الوصول إلى بياناتك الشخصية وتعديلها أو تحديثها من خلال صفحة "الملف الشخصي" و"دفتر العناوين" في حسابك.',
      'يحق لك طلب نسخة من بياناتك أو طلب حذف حسابك وبياناتك الشخصية من خلال التواصل مع خدمة العملاء عبر صفحة التواصل الرسمية.',
      'تُستثنى من الحذف الفوري السجلات المحاسبية والضريبية التي يفرض القانون المالي الاحتفاظ بها لفترات محددة لحفظ حقوق الطرفين.'
    ]
  },
  {
    title: 'ملفات تعريف الارتباط (Cookies) والتخزين المحلي',
    paragraphs: [
      'نستخدم ملفات تعريف الارتباط الأساسية لإدارة جلسات تسجيل الدخول والحفاظ على سلة التسوق الخاصة بك أثناء التنقل بين الصفحات.',
      'نستخدم التخزين المحلي الآمن لحفظ تفضيلاتك الشخصية مثل اللغة (العربية/الإنجليزية) والمظهر (الوضع الداكن/الفاتح). لا يتم أبداً تخزين كلمات المرور أو الرموز الحساسة في التخزين المحلي للمتصفح.'
    ]
  },
  {
    title: 'التعديلات على سياسة الخصوصية والتواصل',
    paragraphs: [
      'نحتفظ بالحق في تحديث سياسة الخصوصية هذه دورياً لمواكبة التطورات التقنية والتنظيمية. يتم نشر أي تعديل مع تحديث تاريخ المراجعة.',
      'لأي استفسار أو طلب يتعلق بخصوصية بياناتك، يمكنك التواصل المباشر مع فريق الأمان والخصوصية عبر صفحة "تواصل معنا" أو عبر البريد الإلكتروني الرسمي: privacy@eurostore.sy.'
    ]
  }
];

const EN_SECTIONS = [
  {
    title: 'Introduction and Scope',
    paragraphs: [
      'This Privacy Policy outlines how EuroStore collects, uses, protects, and handles your personal data when you visit our website, use our services, or purchase products from our store.',
      'Safeguarding your personal data and respecting your privacy are fundamental pillars of our business. We adhere to global security standards, legal integrity, and technical best practices.'
    ]
  },
  {
    title: 'Information We Collect',
    paragraphs: [
      'Account and Identity Information: Includes your full name, email address, phone number, and one-way hashed passwords (Bcrypt/Argon2).',
      'Shipping and Delivery Information: Includes governorate, city, district, street address, and any specific delivery notes.',
      'Order and Transaction History: Includes items purchased, invoices, sizes, colors, exchange records, loyalty point redemptions, and promo codes.',
      'Technical and Usage Data: Includes IP address, browser type, operating system, security audit logs, and language/theme preferences.'
    ]
  },
  {
    title: 'Purposes of Data Processing',
    paragraphs: [
      'Order Fulfilment: Verifying orders, preparing authentic goods, coordinating delivery with local courier partners, and issuing invoices.',
      'Account Management and Loyalty Program: Tracking reward points, activating discount codes, and enabling real-time order tracking.',
      'Customer Support and Exchanges: Addressing inquiries, processing product or size exchanges according to our official policy.',
      'Platform Security: Preventing fraud, detecting unauthorized activity, and maintaining platform stability.'
    ]
  },
  {
    title: 'Data Sharing with Trusted Parties',
    paragraphs: [
      'We do not sell, rent, or trade your personal data to any third parties under any circumstances.',
      'Minimum necessary data is shared only with authorized partners to fulfill your purchase:',
      '1. Local Couriers and Delivery Partners: Name, phone number, and delivery address to deliver packages.',
      '2. Payment Processors (e.g. Sham Cash): Financial transactions are processed via secure, encrypted payment gateways without storing sensitive card details on our servers.',
      '3. Authorized Partner Hubs: For pick-up or item exchange requests, only the relevant exchange order details are provided.'
    ]
  },
  {
    title: 'Data Storage, Security, and Protection',
    paragraphs: [
      'All application data is hosted in high-security database infrastructure with end-to-end encryption in transit (TLS 1.3) and at rest (AES-256).',
      'We enforce rigorous Row Level Security (RLS) policies at the database layer to ensure complete data isolation between users.',
      'Authentication sessions are protected using secure, httpOnly cookies to prevent session hijacking and cross-site scripting (XSS).'
    ]
  },
  {
    title: 'Your Rights and Choices',
    paragraphs: [
      'You have the right to access, review, and update your personal data and saved addresses at any time via your Account Profile.',
      'You may request a copy of your data or request account deletion by contacting our support team through the official Contact page.',
      'Certain transaction records may be retained as required by financial and commercial laws.'
    ]
  },
  {
    title: 'Cookies and Local Storage',
    paragraphs: [
      'Essential session cookies are used to maintain your login session and manage your shopping cart across page navigations.',
      'Local storage is utilized only for non-sensitive user preferences such as language and theme mode.'
    ]
  },
  {
    title: 'Updates and Privacy Contact',
    paragraphs: [
      'We may update this policy periodically. Any changes will be published here with an updated revision date.',
      'For privacy inquiries or data requests, please contact our Data Protection team via our Contact page or at privacy@eurostore.sy.'
    ]
  }
];

export default async function PrivacyPage() {
  const isAr = (await getLocale()) === 'ar';
  return (
    <LegalDocument
      title={isAr ? 'سياسة الخصوصية وحماية البيانات' : 'Privacy Policy & Data Protection'}
      updatedLabel={isAr ? 'آخر تحديث: آب 2026' : 'Last updated: August 2026'}
      introduction={
        isAr
          ? 'توضح هذه الوثيقة الشاملة التزام يورو ستور بحماية بياناتك الشخصية وحقوقك الرقمية ومعايير الأمان والتشفير المطبقة في المتجر.'
          : 'This comprehensive document details EuroStore’s commitment to protecting your personal data, your digital rights, and the security standards applied across our store.'
      }
      sections={isAr ? AR_SECTIONS : EN_SECTIONS}
      dir={isAr ? 'rtl' : 'ltr'}
    />
  );
}
