export type LegalSection = {
  title: string;
  paragraphs: string[];
};

export type LocalizedLegalDocument = {
  title: string;
  introduction: string;
  updatedLabel: string;
  sections: LegalSection[];
};

export const privacyDocuments: Record<'ar' | 'en', LocalizedLegalDocument> = {
  ar: {
    title: 'سياسة الخصوصية وحماية البيانات',
    updatedLabel: 'آخر تحديث: آب 2026',
    introduction: 'توضح هذه الوثيقة الشاملة التزام يورو ستور بحماية بياناتك الشخصية وحقوقك الرقمية ومعايير الأمان والتشفير المطبقة في المتجر.',
    sections: [
      {
        title: 'مقدمة ونطاق التطبيق',
        paragraphs: [
          'تحدد سياسة الخصوصية هذه الكيفية التي تقوم بها منصة "يورو ستور" (EuroStore) بجمع واستخدام وحماية ومشاركة بياناتك الشخصية عند زيارة موقعنا الإلكتروني أو استخدام خدماتنا أو الشراء من متجرنا.',
          'إن حماية بياناتك الشخصية واحترام خصوصيتك هما ركيزتان أساسيتان في عملنا. نحن نلتزم بالمعايير القانونية والأخلاقية العالمية وأفضل الممارسات التقنية المعمول بها لحماية أمن وسرية بيانات المستخدمين.',
        ],
      },
      {
        title: 'البيانات التي نجمعها ومعلومات الحساب',
        paragraphs: [
          'بيانات الحساب والهوية: وتشمل الاسم الكامل، البريد الإلكتروني، رقم الهاتف المحمول، وكلمة المرور المشفرة تشفيراً أحادي الاتجاه (Bcrypt/Argon2).',
          'بيانات الشحن والتوصيل: وتشمل المحافظة، المدينة، المنطقة، تفاصيل العنوان الدقيق، وأي تعليمات خاصة بالتسليم.',
          'سجل المشتريات والطلبات: وتشمل المنتجات المشتراة، الفواتير، المقاسات، الألوان، سجل عمليات الاستبدال، وسجل استخدام نقاط برنامج الولاء وقسائم الخصم.',
          'البيانات التقنية وبيانات التصفح: وتشمل عنوان بروتوكول الإنترنت (IP)، نوع المتصفح، نظام التشغيل، سجل أحداث الأمان، وتفضيل اللغة.',
        ],
      },
      {
        title: 'الأغراض القانونية لاستخدام ومعالجة البيانات',
        paragraphs: [
          'معالجة الطلبات وتنفيذها: التحقق من صحة الطلب، تجهيز المنتجات، تنسيق الشحن والتوصيل مع مندوبي الشحن، وإصدار الفواتير الرسمية.',
          'إدارة حساب العميل وبرنامج الولاء: احتساب نقاط المكافآت، تفعيل رموز الخصم، وإتاحة ميزة متابعة وتتبع حالة الشحنات لحظياً.',
          'خدمة العملاء وطلبات الاستبدال: الرد على الاستفسارات، معالجة طلبات استبدال المقاسات أو المنتجات وفق السياسة المعتمدة.',
          'أمن وحماية المنصة: منع عمليات الاحتيال، كشف النشاطات غير المصرح بها، وضمان سلامة واستقرار النظام لجميع المستخدمين.',
        ],
      },
      {
        title: 'مشاركة البيانات مع أطراف ثالثة موثوقة',
        paragraphs: [
          'نحن لا نقوم ببيع أو تأجير أو المتاجرة ببياناتك الشخصية لأي طرف ثالث تحت أي ظرف من الظروف.',
          'يتم مشاركة الحد الأدنى والضروري فقط من البيانات مع الأطراف الخدمية التالية لتنفيذ طلبك حصراً:',
          '1. شركات ومندوبو التوصيل المحلي: يتم تزويدهم فقط باسم المستلم، رقم الهاتف، وعنوان التوصيل لتسليم الشحنة.',
          '2. مزودو خدمات الدفع الإلكتروني (مثل Sham Cash): عند اختيار الدفع الإلكتروني، تتم معالجة المعاملة المالية عبر بوابات دفع آمنة ومشفرة بالكامل دون تخزين أية بيانات بطاقات حساسة على خوادمنا.',
          '3. المتاجر والشركاء المساعدون المعتمدون: في حال طلب الاستبدال عبر نقطة استلام أو متجر شريك، يتم تزويدهم بتفاصيل طلب الاستبدال ورقم الشحنة فقط.',
        ],
      },
      {
        title: 'التخزين وأمن وحماية البيانات',
        paragraphs: [
          'تُخزن بيانات المنصة في قواعد بيانات سحابية متقدمة ومحمية بأنظمة جدران الحماية، وتشفير كامل للبيانات أثناء النقل (TLS 1.3) وأثناء التخزين (AES-256).',
          'نطبق سياسات أمان صارمة على مستوى قواعد البيانات (Row Level Security - RLS)، مما يضمن عدم وصول أي مستخدم لبيانات غيره.',
          'جلسات تسجيل الدخول محمية بملفات تعريف ارتباط آمنة (httpOnly Cookies) تمنع هجمات سرقة الجلسات وحقن النصوص البرمجية (XSS).',
        ],
      },
      {
        title: 'حقوق المستخدم والتحكم بالبيانات',
        paragraphs: [
          'يحق لك في أي وقت الوصول إلى بياناتك الشخصية وتعديلها أو تحديثها من خلال صفحة "الملف الشخصي" و"دفتر العناوين" في حسابك.',
          'يحق لك طلب نسخة من بياناتك أو طلب حذف حسابك وبياناتك الشخصية من خلال التواصل مع خدمة العملاء عبر صفحة التواصل الرسمية.',
          'تُستثنى من الحذف الفوري السجلات المحاسبية والضريبية التي يفرض القانون المالي الاحتفاظ بها لفترات محددة لحفظ حقوق الطرفين.',
        ],
      },
      {
        title: 'ملفات تعريف الارتباط (Cookies) والتخزين المحلي',
        paragraphs: [
          'نستخدم ملفات تعريف الارتباط الأساسية لإدارة جلسات تسجيل الدخول والحفاظ على سلة التسوق الخاصة بك أثناء التنقل بين الصفحات.',
          'نستخدم التخزين المحلي الآمن لحفظ تفضيل اللغة (العربية/الإنجليزية). لا يتم أبداً تخزين كلمات المرور أو الرموز الحساسة في التخزين المحلي للمتصفح.',
        ],
      },
      {
        title: 'التعديلات على سياسة الخصوصية والتواصل',
        paragraphs: [
          'نحتفظ بالحق في تحديث سياسة الخصوصية هذه دورياً لمواكبة التطورات التقنية والتنظيمية. يتم نشر أي تعديل مع تحديث تاريخ المراجعة.',
          'لأي استفسار أو طلب يتعلق بخصوصية بياناتك، يمكنك التواصل المباشر مع فريق الأمان والخصوصية عبر صفحة "تواصل معنا" أو عبر البريد الإلكتروني الرسمي: privacy@eurostore.sy.',
        ],
      },
    ],
  },
  en: {
    title: 'Privacy Policy & Data Protection',
    updatedLabel: 'Last updated: August 2026',
    introduction: 'This comprehensive document details EuroStore’s commitment to protecting your personal data, your digital rights, and the security standards applied across our store.',
    sections: [
      { title: 'Introduction and Scope', paragraphs: ['This Privacy Policy outlines how EuroStore collects, uses, protects, and handles your personal data when you visit our website, use our services, or purchase products from our store.', 'Safeguarding your personal data and respecting your privacy are fundamental pillars of our business. We adhere to global security standards, legal integrity, and technical best practices.'] },
      { title: 'Information We Collect', paragraphs: ['Account and Identity Information: Includes your full name, email address, phone number, and one-way hashed passwords (Bcrypt/Argon2).', 'Shipping and Delivery Information: Includes governorate, city, district, street address, and any specific delivery notes.', 'Order and Transaction History: Includes items purchased, invoices, sizes, colors, exchange records, loyalty point redemptions, and promo codes.', 'Technical and Usage Data: Includes IP address, browser type, operating system, security audit logs, and language preference.'] },
      { title: 'Purposes of Data Processing', paragraphs: ['Order Fulfilment: Verifying orders, preparing authentic goods, coordinating delivery with local courier partners, and issuing invoices.', 'Account Management and Loyalty Program: Tracking reward points, activating discount codes, and enabling real-time order tracking.', 'Customer Support and Exchanges: Addressing inquiries, processing product or size exchanges according to our official policy.', 'Platform Security: Preventing fraud, detecting unauthorized activity, and maintaining platform stability.'] },
      { title: 'Data Sharing with Trusted Parties', paragraphs: ['We do not sell, rent, or trade your personal data to any third parties under any circumstances.', 'Minimum necessary data is shared only with authorized partners to fulfill your purchase:', '1. Local Couriers and Delivery Partners: Name, phone number, and delivery address to deliver packages.', '2. Payment Processors (e.g. Sham Cash): Financial transactions are processed via secure, encrypted payment gateways without storing sensitive card details on our servers.', '3. Authorized Partner Hubs: For pick-up or item exchange requests, only the relevant exchange order details are provided.'] },
      { title: 'Data Storage, Security, and Protection', paragraphs: ['All application data is hosted in high-security database infrastructure with end-to-end encryption in transit (TLS 1.3) and at rest (AES-256).', 'We enforce rigorous Row Level Security (RLS) policies at the database layer to ensure complete data isolation between users.', 'Authentication sessions are protected using secure, httpOnly cookies to prevent session hijacking and cross-site scripting (XSS).'] },
      { title: 'Your Rights and Choices', paragraphs: ['You have the right to access, review, and update your personal data and saved addresses at any time via your Account Profile.', 'You may request a copy of your data or request account deletion by contacting our support team through the official Contact page.', 'Certain transaction records may be retained as required by financial and commercial laws.'] },
      { title: 'Cookies and Local Storage', paragraphs: ['Essential session cookies are used to maintain your login session and manage your shopping cart across page navigations.', 'Local storage is utilized only for non-sensitive preferences such as language.'] },
      { title: 'Updates and Privacy Contact', paragraphs: ['We may update this policy periodically. Any changes will be published here with an updated revision date.', 'For privacy inquiries or data requests, please contact our Data Protection team via our Contact page or at privacy@eurostore.sy.'] },
    ],
  },
};

export const termsDocuments: Record<'ar' | 'en', LocalizedLegalDocument> = {
  ar: {
    title: 'الشروط والأحكام وسياسة الاستخدام',
    updatedLabel: 'آخر تحديث: آب 2026',
    introduction: 'تنظم هذه الشروط والأحكام استخدامك لمنصة يورو ستور وعمليات الشراء والشحن والاستبدال وبرنامج الولاء وكافة الحقوق والالتزامات المتبادلة.',
    sections: [
      { title: 'الأهلية وشروط إنشاء الحساب', paragraphs: ['باستخدامك لمنصة "يورو ستور" (EuroStore) أو إنشاء حساب، فإنك تقر بأنك بلغت السن القانونية للشراء وتلتزم بتقديم معلومات دقيقة وصحيحة وكاملة عن هويتك وبيانات التواصل والعنوان.', 'أنت مسؤول مسؤولية كاملة عن الحفاظ على سرية بيانات تسجيل الدخول الخاصة بحسابك، وعن كافة الأنشطة والطلبات التي تتم عبر حسابك. يجب إخطارنا فوراً عند الاشتباه في أي استخدام غير مصرح به.'] },
      { title: 'دقة المنتجات والمخزون والتسعير', paragraphs: ['تُعرض كافة الأسعار في المتجر بالليرة السورية (SYP). السعر المعتمد والنهائي هو السعر الظاهر والمعتمد في شاشة تأكيد الطلب قبل إتمام عملية الدفع.', 'نبذل أقصى درجات العناية لعرض صور وأوصاف ومقاسات ومواصفات المنتجات بدقة مطابقة للواقع. قد تطرأ فروق طفيفة جداً في درجات الألوان نتيجة إعدادات شاشات العرض المختلفة.', 'تخضع كافة المنتجات لتوفر المخزون اللحظي المؤكد بواسطة نظام إدارة المستودعات في يورو ستور.'] },
      { title: 'إتمام الطلبات وتأكيد الشراء', paragraphs: ['يُعد إرسال الطلب عبر الموقع إيجاباً للشراء. يصبح الطلب ملزماً ومؤكداً فور إصدار رقم الطلب وتأكيده عبر إشعار الحساب أو رسالة التأكيد.', 'يحتفظ يورو ستور بحق إلغاء أو تعليق أي طلب في حالات استثنائية محددة مثل: عدم توفر المخزون الفعلي للمقاس المطلوب، وجود خطأ تسعيري فني واضح، أو عدم التمكن من التحقق من بيانات المشتري وعنوان التوصيل.'] },
      { title: 'الشحن والتوصيل في المحافظات السورية', paragraphs: ['نحن نوفر خدمة الشحن والتوصيل السريع لكافة المحافظات والمدن الرئيسية في الجمهورية العربية السورية (دمشق، ريف دمشق، حلب، حمص، حماة، اللاذقية، طرطوس، وغيرها).', 'تظهر تكلفة الشحن بوضوح وشفافية في صفحة الدفع قبل تأكيد الطلب. مواعيد التوصيل تقديرية (عادة بين 2 إلى 5 أيام عمل) وقد تتأثر بحالة الطرق أو الأحوال الجوية الطارئة.'] },
      { title: 'طرق الدفع والأمان المالي', paragraphs: ['نوفر خيارات دفع متعددة وآمنة:', '1. الدفع نقدياً عند الاستلام (Cash on Delivery): يتم دفع قيمة الطلب لمندوب التوصيل عند استلام الشحنة وفحص الطرد الخارجي.', '2. الدفع الإلكتروني عبر Sham Cash والمحافظ الإلكترونية المعتمدة: تتم المعاملة عبر اتصال مشفر وآمن بالكامل مع تأكيد فوري للدفع في حساب العميل.'] },
      { title: 'سياسة الاستبدال وضمان الأصالة 100%', paragraphs: ['ضمان الأصالة: نضمن أن كافة المنتجات المعروضة في يورو ستور هي منتجات أصلية 100% تحمل العلامات الرسمية للمصنعين.', 'مهلة طلب الاستبدال: يحق للعميل تقديم طلب استبدال المقاس أو المنتج خلال نافذة زمنية مدتها 3 أيام من تاريخ استلام الشحنة، بشرط أن يكون المنتج بحالته الأصلية غير مستخدم ومرفقاً ببطاقة السعر (Tag) وتغليف المصنع الأصلي.', 'يتم تقديم ومتابعة طلب الاستبدال إلكترونياً بالكامل عبر صفحة "طلب استبدال" في لوحة تحكم العميل.'] },
      { title: 'برنامج الولاء ونقاط المكافآت وكوبونات الخصم', paragraphs: ['يحصل العميل على نقاط ولاء ومكافآت عند إتمام عمليات الشراء المؤهلة. نقاط الولاء شخصية وخاصة بصاحب الحساب ولا يمكن استبدالها نقداً أو تحويلها لحساب آخر.', 'تخضع كوبونات وقسائم الخصم الترويجية للشروط المحددة لكل حملة (مثل الحد الأدنى لقيمة الطلب أو الاستخدام لمرة واحدة للعملاء الجدد). يحظر التحايل بإنشاء حسابات وهمية للاستفادة المتكررة من الخصومات المخصصة للمرة الأولى.'] },
      { title: 'الملكية الفكرية وحقوق النشر', paragraphs: ['كافة محتويات المنصة بما يشمل التصاميم والبرمجيات والشعارات والنصوص والأيقونات هي ملكية حصرية لـ "يورو ستور" ومحمية بموجب قوانين حماية الملكية الفكرية والعلامات التجارية.', 'العلامات التجارية العالمية (مثل Nike, Adidas, Dior, Ralph Lauren, وغيرها) هي ملك لأصحابها الشرعيين وتُعرض للإشارة إلى المنتجات المعروضة فقط.'] },
      { title: 'القانون الواجب التطبيق وتسوية النزاعات', paragraphs: ['تخضع هذه الشروط والأحكام وتفسر وفقاً للقوانين والأنظمة التجارية وحماية المستهلك السارية.', 'في حال نشوء أي خلاف أو نزاع، يتم السعي أولاً لحله ودياً وبحسن نية عبر التواصل المباشر مع إدارة خدمة العملاء في يورو ستور.'] },
      { title: 'معلومات التواصل والدعم الرسمي', paragraphs: ['لأي استفسارات قانونية أو مساعدة بشأن طلبك أو الشروط والأحكام، يمكنك التواصل معنا عبر:', 'صفحة التواصل الرسمية بالموقع، أو البريد الإلكتروني: support@eurostore.sy، أو عبر خدمة العملاء المعتمدة في المتجر.'] },
    ],
  },
  en: {
    title: 'Terms & Conditions of Service',
    updatedLabel: 'Last updated: August 2026',
    introduction: 'These Terms & Conditions govern your use of the EuroStore platform, order processing, shipping, exchange procedures, and loyalty rewards.',
    sections: [
      { title: 'Eligibility and Account Registration', paragraphs: ['By using the EuroStore platform or creating an account, you confirm that you are of legal purchasing age and agree to provide accurate, current, and complete identity, contact, and delivery details.', 'You are solely responsible for maintaining the confidentiality of your login credentials and for all activities conducted under your account. You must notify us immediately of any unauthorized account activity.'] },
      { title: 'Product Accuracy, Inventory, and Pricing', paragraphs: ['All store prices are listed in Syrian Pounds (SYP). The final binding price is the price confirmed at the checkout review stage prior to order placement.', 'We exercise the highest standard of care in displaying authentic product imagery, size specs, and descriptions. Minor color variations may occur depending on screen displays.', 'All orders are subject to real-time inventory validation by EuroStore warehouse management systems.'] },
      { title: 'Order Placement and Confirmation', paragraphs: ['Submitting an order represents an offer to purchase. An order is confirmed once an official Order Number is generated and tracked within your customer portal.', 'EuroStore reserves the right to cancel or place an order on hold in rare operational scenarios (e.g. inventory discrepancy, obvious pricing error, or unverified delivery coordinates).'] },
      { title: 'Shipping and Delivery Across Syria', paragraphs: ['We provide express delivery services across all major Syrian governorates and cities (Damascus, Rural Damascus, Aleppo, Homs, Hama, Latakia, Tartus, etc.).', 'Shipping rates are clearly itemized before checkout confirmation. Estimated delivery timeframes are typically 2 to 5 business days.'] },
      { title: 'Payment Methods and Financial Security', paragraphs: ['We support secure and flexible payment options:', '1. Cash on Delivery (COD): Payment is handed to the courier representative upon receiving and verifying package seals.', '2. Digital Payments via Sham Cash and authorized digital wallets: Transactions are processed via 256-bit encrypted gateways with instant order confirmation.'] },
      { title: '100% Authenticity Guarantee and Exchange Policy', paragraphs: ['Authenticity Guarantee: We certify that 100% of products sold on EuroStore are authentic and brand original.', 'Exchange Window: Customers may submit an exchange request for size or product variations within 3 calendar days of parcel delivery, provided the item is in pristine, unworn condition with original brand tags and packaging intact.', 'Exchange requests are managed entirely through the automated Exchange portal in your user account.'] },
      { title: 'Loyalty Program, Reward Points, and Coupons', paragraphs: ['Customers accumulate reward points on eligible purchases. Loyalty points are personal, non-transferable, and possess no standalone cash value outside store redemptions.', 'Promotional vouchers and coupon codes are governed by campaign-specific eligibility criteria (e.g., minimum basket values or first-time customer limits).'] },
      { title: 'Intellectual Property and Trademarks', paragraphs: ['All platform content, graphics, layouts, UI code, and brand marks belong exclusively to EuroStore and are protected under copyright and intellectual property legislation.', 'World brand names and marks (such as Nike, Adidas, Dior, Ralph Lauren, etc.) are the proprietary assets of their respective trademark holders.'] },
      { title: 'Governing Law and Dispute Resolution', paragraphs: ['These Terms and Conditions are governed by and construed in accordance with applicable commercial and consumer protection regulations.', 'Any disputes will be addressed with priority through amicable resolution with EuroStore Customer Support.'] },
      { title: 'Official Support and Contact Info', paragraphs: ['For legal inquiries, terms clarifications, or customer service assistance, please reach out via:', 'Our official Contact page, or via email at support@eurostore.sy.'] },
    ],
  },
};
