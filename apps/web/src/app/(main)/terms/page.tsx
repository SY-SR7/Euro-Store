import { getLocale } from 'next-intl/server';
import { LegalDocument } from '@/components/legal/LegalDocument';

const AR_SECTIONS = [
  {
    title: 'الأهلية وشروط إنشاء الحساب',
    paragraphs: [
      'باستخدامك لمنصة "يورو ستور" (EuroStore) أو إنشاء حساب، فإنك تقر بأنك بلغت السن القانونية للشراء وتلتزم بتقديم معلومات دقيقة وصحيحة وكاملة عن هويتك وبيانات التواصل والعنوان.',
      'أنت مسؤول مسؤولية كاملة عن الحفاظ على سرية بيانات تسجيل الدخول الخاصة بحسابك، وعن كافة الأنشطة والطلبات التي تتم عبر حسابك. يجب إخطارنا فوراً عند الاشتباه في أي استخدام غير مصرح به.'
    ]
  },
  {
    title: 'دقة المنتجات والمخزون والتسعير',
    paragraphs: [
      'تُعرض كافة الأسعار في المتجر بالليرة السورية (SYP). السعر المعتمد والنهائي هو السعر الظاهر والمعتمد في شاشة تأكيد الطلب قبل إتمام عملية الدفع.',
      'نبذل أقصى درجات العناية لعرض صور وأوصاف ومقاسات ومواصفات المنتجات بدقة مطابقة للواقع. قد تطرأ فروق طفيفة جداً في درجات الألوان نتيجة إعدادات شاشات العرض المختلفة.',
      'تخضع كافة المنتجات لتوفر المخزون اللحظي المؤكد بواسطة نظام إدارة المستودعات في يورو ستور.'
    ]
  },
  {
    title: 'إتمام الطلبات وتأكيد الشراء',
    paragraphs: [
      'يُعد إرسال الطلب عبر الموقع إيجاباً للشراء. يصبح الطلب ملزماً ومؤكداً فور إصدار رقم الطلب وتأكيده عبر إشعار الحساب أو رسالة التأكيد.',
      'يحتفظ يورو ستور بحق إلغاء أو تعليق أي طلب في حالات استثنائية محددة مثل: عدم توفر المخزون الفعلي للمقاس المطلوب، وجود خطأ تسعيري فني واضح، أو عدم التمكن من التحقق من بيانات المشتري وعنوان التوصيل.'
    ]
  },
  {
    title: 'الشحن والتوصيل في المحافظات السورية',
    paragraphs: [
      'نحن نوفر خدمة الشحن والتوصيل السريع لكافة المحافظات والمدن الرئيسية في الجمهورية العربية السورية (دمشق، ريف دمشق، حلب، حمص، حماة، اللاذقية، طرطوس، وغيرها).',
      'تظهر تكلفة الشحن بوضوح وشفافية في صفحة الدفع قبل تأكيد الطلب. مواعيد التوصيل تقديرية (عادة بين 2 إلى 5 أيام عمل) وقد تتأثر بحالة الطرق أو الأحوال الجوية الطارئة.'
    ]
  },
  {
    title: 'طرق الدفع والأمان المالي',
    paragraphs: [
      'نوفر خيارات دفع متعددة وآمنة:',
      '1. الدفع نقدياً عند الاستلام (Cash on Delivery): يتم دفع قيمة الطلب لمندوب التوصيل عند استلام الشحنة وفحص الطرد الخارجي.',
      '2. الدفع الإلكتروني عبر Sham Cash والمحافظ الإلكترونية المعتمدة: تتم المعاملة عبر اتصال مشفر وآمن بالكامل مع تأكيد فوري للدفع في حساب العميل.'
    ]
  },
  {
    title: 'سياسة الاستبدال وضمان الأصالة 100%',
    paragraphs: [
      'ضمان الأصالة: نضمن أن كافة المنتجات المعروضة في يورو ستور هي منتجات أصلية 100% تحمل العلامات الرسمية للمصنعين.',
      'مهلة طلب الاستبدال: يحق للعميل تقديم طلب استبدال المقاس أو المنتج خلال نافذة زمنية مدتها 3 أيام من تاريخ استلام الشحنة، بشرط أن يكون المنتج بحالته الأصلية غير مستخدم ومرفقاً ببطاقة السعر (Tag) وتغليف المصنع الأصلي.',
      'يتم تقديم ومتابعة طلب الاستبدال إلكترونياً بالكامل عبر صفحة "طلب استبدال" في لوحة تحكم العميل.'
    ]
  },
  {
    title: 'برنامج الولاء ونقاط المكافآت وكوبونات الخصم',
    paragraphs: [
      'يحصل العميل على نقاط ولاء ومكافآت عند إتمام عمليات الشراء المؤهلة. نقاط الولاء شخصية وخاصة بصاحب الحساب ولا يمكن استبدالها نقداً أو تحويلها لحساب آخر.',
      'تخضع كوبونات وقسائم الخصم الترويجية للشروط المحددة لكل حملة (مثل الحد الأدنى لقيمة الطلب أو الاستخدام لمرة واحدة للعملاء الجدد). يحظر التحايل بإنشاء حسابات وهمية للاستفادة المتكررة من الخصومات المخصصة للمرة الأولى.'
    ]
  },
  {
    title: 'الملكية الفكرية وحقوق النشر',
    paragraphs: [
      'كافة محتويات المنصة بما يشمل التصاميم والبرمجيات والشعارات والنصوص والأيقونات هي ملكية حصرية لـ "يورو ستور" ومحمية بموجب قوانين حماية الملكية الفكرية والعلامات التجارية.',
      'العلامات التجارية العالمية (مثل Nike, Adidas, Dior, Ralph Lauren, وغيرها) هي ملك لأصحابها الشرعيين وتُعرض للإشارة إلى المنتجات المعروضة فقط.'
    ]
  },
  {
    title: 'القانون الواجب التطبيق وتسوية النزاعات',
    paragraphs: [
      'تخضع هذه الشروط والأحكام وتفسر وفقاً للقوانين والأنظمة التجارية وحماية المستهلك السارية.',
      'في حال نشوء أي خلاف أو نزاع، يتم السعي أولاً لحله ودياً وبحسن نية عبر التواصل المباشر مع إدارة خدمة العملاء في يورو ستور.'
    ]
  },
  {
    title: 'معلومات التواصل والدعم الرسمي',
    paragraphs: [
      'لأي استفسارات قانونية أو مساعدة بشأن طلبك أو الشروط والأحكام، يمكنك التواصل معنا عبر:',
      'صفحة التواصل الرسمية بالموقع، أو البريد الإلكتروني: support@eurostore.sy، أو عبر خدمة العملاء المعتمدة في المتجر.'
    ]
  }
];

const EN_SECTIONS = [
  {
    title: 'Eligibility and Account Registration',
    paragraphs: [
      'By using the EuroStore platform or creating an account, you confirm that you are of legal purchasing age and agree to provide accurate, current, and complete identity, contact, and delivery details.',
      'You are solely responsible for maintaining the confidentiality of your login credentials and for all activities conducted under your account. You must notify us immediately of any unauthorized account activity.'
    ]
  },
  {
    title: 'Product Accuracy, Inventory, and Pricing',
    paragraphs: [
      'All store prices are listed in Syrian Pounds (SYP). The final binding price is the price confirmed at the checkout review stage prior to order placement.',
      'We exercise the highest standard of care in displaying authentic product imagery, size specs, and descriptions. Minor color variations may occur depending on screen displays.',
      'All orders are subject to real-time inventory validation by EuroStore warehouse management systems.'
    ]
  },
  {
    title: 'Order Placement and Confirmation',
    paragraphs: [
      'Submitting an order represents an offer to purchase. An order is confirmed once an official Order Number is generated and tracked within your customer portal.',
      'EuroStore reserves the right to cancel or place an order on hold in rare operational scenarios (e.g. inventory discrepancy, obvious pricing error, or unverified delivery coordinates).'
    ]
  },
  {
    title: 'Shipping and Delivery Across Syria',
    paragraphs: [
      'We provide express delivery services across all major Syrian governorates and cities (Damascus, Rural Damascus, Aleppo, Homs, Hama, Latakia, Tartus, etc.).',
      'Shipping rates are clearly itemized before checkout confirmation. Estimated delivery timeframes are typically 2 to 5 business days.'
    ]
  },
  {
    title: 'Payment Methods and Financial Security',
    paragraphs: [
      'We support secure and flexible payment options:',
      '1. Cash on Delivery (COD): Payment is handed to the courier representative upon receiving and verifying package seals.',
      '2. Digital Payments via Sham Cash and authorized digital wallets: Transactions are processed via 256-bit encrypted gateways with instant order confirmation.'
    ]
  },
  {
    title: '100% Authenticity Guarantee and Exchange Policy',
    paragraphs: [
      'Authenticity Guarantee: We certify that 100% of products sold on EuroStore are authentic and brand original.',
      'Exchange Window: Customers may submit an exchange request for size or product variations within 3 calendar days of parcel delivery, provided the item is in pristine, unworn condition with original brand tags and packaging intact.',
      'Exchange requests are managed entirely through the automated Exchange portal in your user account.'
    ]
  },
  {
    title: 'Loyalty Program, Reward Points, and Coupons',
    paragraphs: [
      'Customers accumulate reward points on eligible purchases. Loyalty points are personal, non-transferable, and possess no standalone cash value outside store redemptions.',
      'Promotional vouchers and coupon codes are governed by campaign-specific eligibility criteria (e.g., minimum basket values or first-time customer limits).'
    ]
  },
  {
    title: 'Intellectual Property and Trademarks',
    paragraphs: [
      'All platform content, graphics, layouts, UI code, and brand marks belong exclusively to EuroStore and are protected under copyright and intellectual property legislation.',
      'World brand names and marks (such as Nike, Adidas, Dior, Ralph Lauren, etc.) are the proprietary assets of their respective trademark holders.'
    ]
  },
  {
    title: 'Governing Law and Dispute Resolution',
    paragraphs: [
      'These Terms and Conditions are governed by and construed in accordance with applicable commercial and consumer protection regulations.',
      'Any disputes will be addressed with priority through amicable resolution with EuroStore Customer Support.'
    ]
  },
  {
    title: 'Official Support and Contact Info',
    paragraphs: [
      'For legal inquiries, terms clarifications, or customer service assistance, please reach out via:',
      'Our official Contact page, or via email at support@eurostore.sy.'
    ]
  }
];

export default async function TermsPage() {
  const isAr = (await getLocale()) === 'ar';
  return (
    <LegalDocument
      title={isAr ? 'الشروط والأحكام وسياسة الاستخدام' : 'Terms & Conditions of Service'}
      updatedLabel={isAr ? 'آخر تحديث: آب 2026' : 'Last updated: August 2026'}
      introduction={
        isAr
          ? 'تنظم هذه الشروط والأحكام استخدامك لمنصة يورو ستور وعمليات الشراء والشحن والاستبدال وبرنامج الولاء وكافة الحقوق والالتزامات المتبادلة.'
          : 'These Terms & Conditions govern your use of the EuroStore platform, order processing, shipping, exchange procedures, and loyalty rewards.'
      }
      sections={isAr ? AR_SECTIONS : EN_SECTIONS}
      dir={isAr ? 'rtl' : 'ltr'}
    />
  );
}
