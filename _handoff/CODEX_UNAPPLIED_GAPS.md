# سجل إغلاق النواقص المؤكدة - 2026-07-07

تمت مراجعة `التعديلات القادمة المطلوبة.txt` مقابل الكود الحالي وملف `EuroStore_PRD.md`. البنود التالية كانت غير مطبقة بالكامل عند بداية العمل، وتم إغلاقها في هذه الجولة:

## قاعدة البيانات

- أُضيفت هجرة `20260707200000_prd_rest_gap_closure.sql` لتثبيت قيود `partner_profiles` وحقول الاستبدال وصور الاستبدال وأعمدة قفل TOTP.
- حُدثت أنواع `packages/database` لتغطي أعمدة PRD والجداول الجديدة المستخدمة.

## بوابة الشريك

- أُضيفت مسارات `/api/partner/exchanges/scan-qr`, `/confirm-receipt`, `/ready-for-pickup`, `/confirm-delivery-pickup`.
- عُطّل endpoint الشريك القديم الذي كان يكمل الطلب دفعة واحدة.
- حُدثت واجهة الشريك وقائمة الطلبات لاستخدام REST flow فقط.

## لوحة الإدارة

- أُضيف مسار `/api/admin/sub-admins/:id/permissions` وحُولت الواجهة إليه.
- شُدد `requireAdminContext` بحيث لا يسمح للـ Sub-Admin بلا موديول صريح، وحُدثت Admin APIs بالموديولات المناسبة.
- نُقل تدفق TOTP إلى REST APIs: `/api/admin/auth/login`, `/verify-2fa`, `/setup-2fa` مع قفل 3 محاولات.

## موقع العميل

- حُدث مسار إنشاء طلب الاستبدال ليستخدم `order_item_id`, `customer_whatsapp`, `image_urls`.
- حُدثت الواجهة لاختيار عنصر الطلب وطلب 1-3 صور.
- تُحفظ الصور الآن في `exchange_request_images`.

## ملاحظة تحقق

لا يتم تشغيل أوامر build في هذه البيئة حسب قاعدة `_handoff/CODEX_LOCAL_RULES.md`. تم الاعتماد على `tsc --noEmit --incremental false` للتطبيقات المتأثرة.

## تحديث إضافي - 2026-07-08

- أُغلق انحراف checkout في الويب: تسجيل الدخول وتأكيد البريد إلزاميان قبل إنشاء الطلب.
- أُصلح ربط `discount_code` النصي بـ `discount_code_id` حتى يُسجل استخدام الخصم ويُسترجع عند الإلغاء.
- أُضيف جدول `discount_code_usages` وaliases PRD للخصومات: `uses_count`, `min_cart_value`, `max_uses_total`.
- وُسعت خصومات الأدمن لدعم eligibility/scope/per-user limits و`fixed_amount`.
- أُضيفت metadata إلغاء الطلب وalias `rejection_reason`.
- أُصلح إلغاء العميل ورفض الهيلبر/الأدمن لاسترجاع المخزون والنقاط والخصم، وتسجيل history/audit/notifications.
- أُضيف الإكمال التلقائي `delivered -> completed` في الأدمن والهيلبر.
- أُصلح `writeAuditLog` في الأدمن حتى لا يرسل عمود `details` غير الموجود في `audit_logs`.
- أُعيد تشغيل `tsc --noEmit --incremental false` لكل من web/admin/helper/partner/database/shared ونجحت كلها بدون build.

## تحديث إضافي ثانٍ - 2026-07-08

- أُضيف idempotency للطلبات عبر `orders.idempotency_key` وRPC `place_order_atomic`، مع قراءة header `Idempotency-Key` في `POST /api/orders`.
- أُضيف تحقق نافذة الاستبدال في `POST /api/exchange/request` عبر `exchange_window_days` مع دعم `max_exchange_days`.
- أُصلح انتهاء JWT الخاص بـ Exchange QR ليستخدم `exchange_qr_expiry_hours` فعليًا بدل 72 ساعة ثابتة.
- أُصلح RPC `complete_helper_exchange` ليعالج مخزون bundle/variant، كمية البديل، وعكس/منح نقاط الولاء في Path A.
- تم فحص `shared/database/web/admin/helper/partner` عبر `tsc --noEmit --incremental false` فقط، ونجحت كلها بدون build.

## تحديث إضافي ثالث - 2026-07-08

- أُضيف تحقق TOTP داخل `requireAdminContext` نفسه، وليس في middleware فقط.
- أُغلقت فجوة صلاحيات الأدمن: لا توجد عملية كتابة في Admin API تعتمد على `view` فقط بعد الآن.
- أُصلح checkout من السلة ليستخدم `cart_items.product_variant_id`.
- أُزيل fallback القديم إلى `customer_profiles.cart_data` من `/api/cart`.
- وُحّد تحقق الخصومات في cart/checkout مع شروط PRD الكاملة، بما في ذلك scope وper-user limits وfirst-time buyers.
- أُضيف تحقق نوع/حجم صور طلب الاستبدال في الواجهة والمسار الرسمي.
- صُحح نص FAQ من 14 يومًا إلى نافذة PRD الافتراضية 7 أيام.
- أُضيفت aliases PRD لمبالغ الطلبات على جدول `orders`: `subtotal`, `discount_amount`, `loyalty_discount_amount`, `shipping_cost`, `total_amount`.
- تم فحص `admin/web/helper/partner/database/shared` عبر `tsc --noEmit --incremental false` فقط، ونجحت كلها بدون build.

## الحالة الحالية بعد جولة 2026-08-04

لا توجد فجوة وظيفية مؤكدة متبقية في كود الويب أو الآدمن أو عقود الربط الحالية مع الهيلبر والشريك ضمن نطاق PRD الذي تمت مراجعته. البنود التالية ليست كوداً مخفياً ناقصاً، بل شروط تشغيل أو نطاقات المرحلة التالية:

- **قاعدة البيانات:** نجح تطبيق السلسلة كاملة محلياً ونجح database lint وفحص RLS والمنح. يبقى تطبيق هجرات أغسطس على staging ثم الإنتاج بعد نسخة احتياطية واختبار RPC بأدوار فعلية.
- **الاعتماديات:** استعادة `node_modules` من registry بعد موافقة المستخدم؛ التثبيت offline لم يجد كل الحزم. بعدها يلزم typecheck كامل واختبارات تكامل، من دون build.
- **الأسرار:** ضبط أسرار Supabase وQR المنفصلة وTOTP والـ cron وResend وExpo في منصة النشر، مع rotation وسياسة وصول.
- **الدفع:** Sham Cash يبقى غير متاح عمداً حتى توفير مواصفات وتواقيع المزود الحقيقية؛ لا يوجد نجاح دفع وهمي.
- **الإشعارات الخارجية:** يلزم جهاز Expo حقيقي وتسجيل token من تطبيق الموبايل، ثم اختبار tickets/receipts والبريد من بيئة staging.
- **الموبايل:** استكمال الواجهات وربط العقود الجاهزة مرحلة مستقلة تالية، كما طلب المستخدم.
- **القانون والعمليات:** مراجعة سياسة الخصوصية ومدد الاحتفاظ، وإعداد مزود التوصيل ودليل الاستجابة للحوادث.

راجع `CODEX_COMPLETION_MASTER_PLAN.md` للخطة النهائية و`CODEX_SECURITY_BEST_PRACTICES_REPORT.md` للمخاطر وأدلتها.

## تصحيح الحالة الحية - 2026-08-28

تحل هذه الفقرة محل البنود القديمة الخاصة بعدم رفع الهجرات أو غياب الاعتماديات:

- رُبطت إعدادات جميع التطبيقات بالمشروع الحي `szhpqyvxodhaichrrdfb`.
- تطابقت الهجرات المحلية والبعيدة، وطُبقت هجرة التقوية الجديدة؛ السجل الحي 75 هجرة.
- نجح database lint البعيد، وفحوص RLS والمنح الحية، والاختبارات وفحص الأنواع وExpo Doctor.
- أُخذت نسخة احتياطية للمخطط والبيانات قبل التعديل.
- المتبقي ليس مخططاً افتراضياً: حساب إدارة Supabase الصحيح، نطاقات ومنصة نشر، أول مدير، SMTP/Google OAuth، Resend/Expo/cron، بيانات Sham Cash إن كان مطلوباً، واختبار staging بأدوار فعلية.
- يوجد تحذيرا audit بلا patch في `image-size` ضمن Metro للموبايل فقط؛ مسارات Next.js غير متأثرة.
- التفاصيل والأدلة في `CODEX_REAL_SUPABASE_INTEGRATION_2026-08-28.md`.

## تصحيح نهائي بعد إعادة التحقق الشامل - 2026-08-28

تحل هذه الفقرة محل بند “الموبايل مرحلة تالية” أعلاه:

- أُكملت وربطت واجهات الموبايل الأساسية بالـ APIs الحقيقية: حساب وعناوين وولاء وQR وإحالة، سلة خادم ودمج ضيف، checkout ذري، طلبات وإلغاء وإعادة طلب وتقييم وفاتورة، استبدال وصور وQR، مفضلة وإشعارات وpush وnotify-me.
- أُصلحت 53 معالجات ديناميكية لعقد Next.js 15، ثم أُغلق خطأ `notify-me` الناتج عن فحص Promise بدلاً من params المحلولة.
- أضيفت أيقونات PWA الحقيقية واختبارات CI.
- نجح TypeScript في التطبيقات والحزم، وESLint بصفر أخطاء، و48/48 اختباراً، وExpo Doctor 17/17، بلا build أو Docker.
- المتبقي الكودي هو تكافؤ الموبايل المتقدم (اللغتان والثيم وتفاصيل الكتالوج والبحث والفلاتر وDetox)، إضافة إلى المتطلبات الخارجية، كما هو مفصل في `CODEX_FULL_PROJECT_REVALIDATION_2026-08-28.md`.
