# تدقيق توافق PRD - Admin / Helper / Partner / Web

المصدر: `_handoff/EuroStore_PRD.md`، إصدار 1.0.

قاعدة التحقق: لا يتم تشغيل أي أمر build في هذا المشروع. الفحص يكون عبر قراءة الكود و`tsc --noEmit`.

## مخالفات تم تنفيذها بخلاف PRD

1. مسار البارتنر استخدم حالات رسمية غير موجودة في PRD:
   - `partner_received`
   - `helper_assigned`
   - ويقبل أيضًا حالات قديمة مثل `qr_generated`, `qr_scanned`, `expired` في النوع العام.
   - المطلوب PRD: `pending`, `approved`, `rejected`, `item_received_by_shipping`, `completed`.

2. مسار الاستبدال في الويب موجود كـ `/api/exchange/request` بينما PRD يحدد:
   - `POST /api/orders/:orderId/exchange`
   - `GET /api/exchanges`
   - `GET /api/exchanges/:id`

3. مسارات الهيلبر الحالية للاستبدال تستخدم أسماء قديمة:
   - `/api/exchange/redeem`
   - `/api/exchange/decision`
   - المطلوب PRD: `/api/helper/exchanges/scan-qr` و`/api/helper/exchanges/:id/complete`، مع موافقة/رفض عبر مسارات Admin/Helper الرسمية.

4. مسارات الأدمن الحالية مختلطة بين `/api/exchanges`, `/api/orders`, `/api/catalog/*` وبين المسارات الرسمية في PRD تحت `/api/admin/*`.

5. بعض أسماء نموذج البيانات ما زالت من النسخة القديمة:
   - `cash_on_delivery` بدل `cod`.
   - `total_syp`, `subtotal_syp`, `price_syp` بدل أسماء PRD مثل `total_amount`, `subtotal`, `base_price`, `price_override`.
   - `cart_data` داخل `customer_profiles` بدل `cart_items`.

6. صفحة/واجهات البارتنر تعرض مراحل داخلية كأنها حالات PRD رسمية.

## نقاط كانت غير منجزة أصلًا أو ناقصة

1. [تم] REST APIs للويب حسب PRD كانت غير مكتملة:
   - `/api/auth/register`, `/api/auth/login`, `/api/auth/refresh`, `/api/auth/forgot-password`, `/api/auth/reset-password`, `/api/auth/me`.
   - `/api/products`, `/api/products/:slug`, `/api/products/:slug/related`, `/api/search`.
   - `/api/cart/items`, `/api/cart/merge`, `/api/cart/validate`, `/api/cart/apply-discount`, `/api/cart/apply-points`.
   - `/api/orders/:id`, `/api/orders/:id/cancel`, `/api/orders/:id/invoice`, `/api/orders/:id/reorder`.
   - `/api/exchanges`, `/api/exchanges/:id`.
   - `/api/notifications`, `/api/notifications/unread-count`, `/api/push-tokens`.
   - `/api/customer/loyalty`, `/api/customer/loyalty/transactions`, `/api/customer/qr`.
   - Sham Cash endpoints are still stubs/absent, which is allowed جزئيًا لأن PRD نفسه يضعها TBD.
   - تم إغلاقها بإضافة المسارات الرسمية، مع Sham Cash كـ stub يسجل `payment_transactions` لأن التفاصيل الرسمية TBD.

2. [تم] Reports في الأدمن كانت لا تغطي كل الأنواع ولا يوجد تصدير CSV/XLSX/PDF كامل كما في PRD.
   - تم تصحيح `/api/reports` لقراءة schema الحالي وإخراج aliases متوافقة مع PRD.
   - تم دعم `format=csv|xlsx|pdf`.
   - تم إضافة المسار الرسمي `/api/admin/reports/:type`.

3. [تم] Audit trail كان موجودًا جزئيًا.
   - تم إضافة `system` إلى `user_role`.
   - تم إضافة trigger تدقيق عام للجداول التشغيلية الحرجة.
   - تم إبقاء audit اليدوي الموجود في المسارات الحساسة.

4. [تم جزئيًا] Notification matrix كانت غير مكتملة.
   - تم إضافة حقول PRD: `reference_id`, `reference_type`, `sent_push`, `sent_email`.
   - تم إضافة helper مركزي `createInAppNotification`.
   - تم ربط إشعارات in-app بأهم transitions للاستبدال.
   - تم إضافة محاولة إرسال Push عبر Expo وEmail عبر Resend عند توفر `EXPO_ACCESS_TOKEN` و`RESEND_API_KEY`/`RESEND_FROM_EMAIL`.
   - عند غياب مفاتيح الخدمة يبقى تسجيل in-app يعمل، وتبقى أعلام الإرسال الخارجي `false`.

5. [تم] تطبيق cart server-side الكامل عبر `cart_items` كان غير مكتمل.
   - تم إضافة جدول `cart_items`.
   - تم إضافة مسارات cart الرسمية.
   - تم تعديل `/api/cart` ليزامن إلى `cart_items` بدل الاعتماد على `cart_data`.

## خطة الإغلاق

1. [تم] تصحيح حالة الاستبدال الرسمية وإضافة `partner_stage` كمعلومة داخلية غير بديلة عن `status`.
2. [تم] إضافة aliases ومسارات PRD الرسمية بدون كسر المسارات القديمة المستعملة في الواجهة.
3. [تم] إضافة REST APIs الأساسية المفقودة للويب: auth/cart/orders/products/search/exchanges/notifications/push/payment stubs.
4. [تم] تحديث الأنواع والمigrations لتمنع تكرار انحراف exchange status.
5. [تم] تشغيل `tsc --noEmit` فقط للتأكد من سلامة TypeScript.

## ما تم إغلاقه في جولة Codex

- توحيد `exchange_requests.status` مع PRD:
  - الحالات الرسمية أصبحت: `pending`, `approved`, `rejected`, `item_received_by_shipping`, `completed`.
  - مراحل البارتنر الداخلية أصبحت `partner_stage` بدل حالات status غير رسمية.
- إضافة migrations:
  - `20260707210000_prd_exchange_status_alignment.sql`
  - `20260707211000_exchange_status_history_and_helper_complete.sql`
  - `20260707212000_prd_referrals_table.sql`
  - `20260707213000_prd_cart_items.sql`
  - `20260707213900_add_system_user_role.sql`
  - `20260707214000_audit_system_role_and_triggers.sql`
  - `20260707215000_prd_notification_fields.sql`
- إضافة `exchange_status_history` وRPC `complete_helper_exchange`.
- إضافة مسارات البارتنر الرسمية مع flow مطابق للـ PRD.
- إضافة مسارات الهيلبر الرسمية:
  - `POST /api/helper/exchanges/scan-qr`
  - `POST /api/helper/exchanges/:id/complete`
- إضافة مسارات الأدمن الرسمية للاستبدال:
  - `GET /api/admin/exchanges`
  - `GET /api/admin/exchanges/:id`
  - `POST /api/admin/exchanges/:id/approve`
  - `POST /api/admin/exchanges/:id/reject`
  - `POST /api/admin/exchanges/:id/status`
- إغلاق PATCH القديم المفتوح للحالة في الأدمن ومنعه من تعديل `status`.
- إضافة مسارات الويب:
  - Auth REST: register/login/logout/refresh/forgot-password/reset-password/me.
  - Cart REST: items/update/delete/merge/validate/apply-discount/apply-points.
  - Orders REST: checkout بصيغة PRD (`address_id`, `payment_method`, `discount_code`, `loyalty_points_to_use`) مع استمرار دعم الصيغة القديمة، list/detail/cancel/reorder/invoice.
  - إشعار Admin + كل Helpers عند إنشاء طلب جديد.
  - Exchange official route: `POST /api/orders/:id/exchange`.
  - Exchange multipart photos: رفع 1-3 صور إلى `exchange-images` من السيرفر ثم حفظ روابطها.
  - إشعار Admin + كل Helpers عند إنشاء طلب استبدال جديد.
  - Customer Loyalty REST: balance/summary, transactions, loyalty QR.
  - Products/search REST.
  - Notifications/push tokens.
  - Sham Cash stubs مع `payment_transactions`.
- إضافة/استكمال مسارات Loyalty الرسمية للـ Helper:
  - `POST /api/helper/loyalty/scan-qr`
  - `POST /api/helper/loyalty/redeem-offline`
- إضافة aliases ومسارات Admin الرسمية المحددة في PRD:
  - Dashboard, customers, customer block, customer point adjustment.
  - Orders list/detail/status تحت `/api/admin/orders`.
  - Products create/update/status/images/delete-image/url-import تحت `/api/admin/products`.
  - Helpers deactivate, Sub-admins create/list/permissions.
  - Audit logs من جدول `audit_logs`.
  - Settings batch update، shipping rates by governorate.
  - Homepage banners create/reorder وsections update by key.
- تصحيح order status في الأدمن ليدعم حالات PRD:
  - `picked_up`, `completed`, `rejected`
  - وإلزام سبب الرفض عبر `reason`/`rejected_reason` عند التحديث.
- تصحيح تعديل نقاط العميل في الأدمن لاستخدام RPC `award_loyalty_points` وجدول `loyalty_points_transactions` بدل اسم جدول غير موجود.
- إضافة تقارير قابلة للتصدير:
  - `/api/reports?type=...&format=csv|xlsx|pdf`
  - `/api/admin/reports/:type`
- إضافة helper إشعارات مركزي:
  - `packages/database/src/notifications.ts`
  - يسجل in-app أولًا ثم يحاول Push/Email اختياريًا ويحدّث `sent_push`/`sent_email`.
- إضافة audit triggers للجداول التشغيلية الحرجة.

## فحوصات تمت بدون build

- `tsc --noEmit --incremental false` نجح للتطبيقات:
  - `apps/web`
  - `apps/admin`
  - `apps/helper`
  - `apps/partner`
- `tsc --noEmit --incremental false` نجح للحزم:
  - `packages/database`
  - `packages/shared`
- جولة فحص إضافية بعد إغلاق aliases الرسمية:
  - `apps/web`
  - `apps/admin`
  - `apps/helper`
  - `apps/partner`
  - `packages/database`
  - `packages/shared`

## ما تم إغلاقه في جولة 2026-07-08 الإضافية

- تم تثبيت قاعدة عدم تشغيل build، واستُخدم فحص TypeScript فقط.
- تم تصحيح مسار إنشاء الطلب في الويب:
  - checkout يتطلب مستخدمًا مسجلًا.
  - المستخدم غير مؤكد البريد يُمنع من إنشاء الطلب حسب PRD.
  - عند إدخال `discount_code` نصي يتم حلّه إلى `discount_code_id` فعلي قبل استدعاء RPC.
  - تحقق الخصم أصبح يتبع ترتيب PRD: active/date/eligibility/min cart/scope/usage limits.
  - تم دعم `first_time_buyers`, `max_uses_per_user`, `max_uses_total`, `uses_count`, `min_cart_value`, وscope للمنتجات/التصنيفات.
- تم إغلاق منطق إلغاء الطلب من العميل:
  - استرجاع مخزون variants وbundles.
  - استرجاع نقاط الولاء المستخدمة.
  - حذف سجل استخدام الخصم وخفض `used_count`.
  - تسجيل `order_status_history`, `audit_logs`, وإشعار العميل.
  - إضافة metadata الإلغاء: `cancellation_reason`, `cancelled_by_id`, `cancelled_by_role`.
- تم إغلاق منطق رفض/تحديث الطلب من الهيلبر:
  - رفض الطلب يسترجع المخزون والنقاط والخصم.
  - الرفض يقبل `reason` أو `rejection_reason` ويظل السبب إلزاميًا.
  - تأكيد الطلب يمنح نقاط الشراء مرة واحدة فقط.
  - انتقال `delivered` يفعّل إكمالًا تلقائيًا إلى `completed` مع history وإشعار.
- تم إغلاق منطق الطلبات في الأدمن:
  - PATCH الطلبات يتطلب صلاحية `edit` بدل `view`.
  - الرفض يتطلب سببًا إلزاميًا.
  - الإلغاء يسجل من نفذه وسبب الإلغاء.
  - `delivered` يتحول تلقائيًا إلى `completed` بدور `system`.
  - استرجاع الالتزامات يحذف `discount_code_usages` بجانب خفض عداد الخصم.
- تم إصلاح `writeAuditLog` في الأدمن:
  - كان يرسل عمود `details` غير موجود في جدول `audit_logs`.
  - الآن يكتب فقط أعمدة PRD/Schema الفعلية حتى لا يفشل audit بصمت.
- تم توسيع خصومات PRD:
  - migration جديدة `20260708201000_prd_discount_code_usages.sql`.
  - جدول `discount_code_usages`.
  - alias مولّد `uses_count` من `used_count`.
  - حقول PRD الأساسية على `discount_codes`: `description`, `eligibility`, `scope`, `category_ids`, `product_ids`, `max_uses_per_user`, `created_by`, `updated_at`.
  - aliases مولّدة `min_cart_value` و`max_uses_total`.
  - نوع الخصم يدعم `fixed_amount` بجانب `fixed`.
  - Admin discount APIs تقبل وتعرض حقول PRD، والإنشاء يتطلب `create`/Full Access، والتعديل `edit`، والحذف `delete`.
- تم إضافة migration `20260708202000_prd_order_cancellation_metadata.sql`:
  - أعمدة metadata للإلغاء.
  - alias مولّد `rejection_reason` من `rejected_reason` لتوافق تسمية PRD.
- تم تحديث TypeScript database types لكل الجداول/الأعمدة الجديدة.

## فحوصات 2026-07-08 بدون build

- `apps/web`: `tsc --noEmit --incremental false` نجح.
- `apps/admin`: `tsc --noEmit --incremental false` نجح.
- `apps/helper`: `tsc --noEmit --incremental false` نجح.
- `apps/partner`: `tsc --noEmit --incremental false` نجح.
- `packages/database`: `tsc --noEmit --incremental false` نجح.
- `packages/shared`: `tsc --noEmit --incremental false` نجح.

## ما تم إغلاقه في جولة 2026-07-08 الثانية

- تم إغلاق نقص idempotency في `POST /api/orders`:
  - migration جديدة `20260708203000_prd_order_idempotency.sql`.
  - إضافة `orders.idempotency_key`.
  - unique index على `(customer_id, idempotency_key)`.
  - إعادة إنشاء `place_order_atomic` ليستقبل `p_idempotency_key` ويعيد الطلب السابق بدل تكرار الخصم/المخزون.
  - `POST /api/orders` يقرأ المفتاح من header `Idempotency-Key` أو body `idempotency_key`.
- تم إغلاق نقص نافذة أهلية الاستبدال:
  - `POST /api/exchange/request` يتحقق من `exchange_window_days`.
  - يدعم أيضًا `max_exchange_days` الموجود في واجهة إعدادات الأدمن.
  - الافتراضي 7 أيام عند غياب الإعداد.
- تم تصحيح QR الاستبدال:
  - `generateExchangeQRToken` صار يقبل `expiresAt`.
  - JWT نفسه يحمل `exp` مطابقًا لإعداد `exchange_qr_expiry_hours` بدل 72h ثابتة.
  - مسار موافقة الأدمن الرسمي ومسارات الهيلبر القديمة المتوافقة أصبحت تستخدم نفس تاريخ الانتهاء.
- تم تحديث types في `packages/database` و`packages/shared` لهذه التغييرات.
- تم إغلاق نقص Path A للاستبدال في الهيلبر:
  - migration جديدة `20260708204000_prd_helper_exchange_loyalty.sql`.
  - `complete_helper_exchange` أصبح يعيد مخزون variant أو bundle الأصلي.
  - البديل يخصم كمية عنصر الطلب كاملة بدل قطعة واحدة فقط.
  - يتم عكس نقاط الولاء المقدرة للعنصر الأصلي.
  - يتم منح نقاط الولاء للبديل حسب إعدادات `loyalty_earn_amount_syp` و`loyalty_earn_points`.

## فحوصات جولة 2026-07-08 الثانية بدون build

- `packages/shared`: `tsc --noEmit --incremental false` نجح.
- `packages/database`: `tsc --noEmit --incremental false` نجح.
- `apps/web`: `tsc --noEmit --incremental false` نجح.
- `apps/admin`: `tsc --noEmit --incremental false` نجح.
- `apps/helper`: `tsc --noEmit --incremental false` نجح.
- `apps/partner`: `tsc --noEmit --incremental false` نجح.
- `git diff --check` نظيف للملفات المعدلة، مع تحذيرات CRLF المعتادة فقط.

## جولة الإغلاق الشاملة - 2026-08-04

أُعيد فحص الأسطح الأربعة وقاعدة البيانات المشتركة، وأُغلقت النقاط التالية فوق الجولات السابقة:

- **الويب:** تسعير الطلب من الخادم، مزامنة سلة ذرية، دعم الحزم، wishlist sharing عند الطلب، صفحات الخطأ والقانون، فواتير PDF ورسائل تأكيد ثنائية اللغة، ملفات وQR خاصة، وصفحة ولاء لا تقبل QR قديم غير موقّع.
- **الآدمن:** CRUD حقيقي للكتالوج والصور والخصائص، تقارير RPC فعلية، بحث آمن، إدارة الهيلبر والشريك وطلبات المنتجات، سجلات تدقيق، إعدادات خاصة، وصلاحيات Sub-Admin ذرية.
- **الهيلبر:** مخزون حقيقي بالاسم العربي/الإنجليزي وSKU، طلبات منتجات بصور خاصة، مراجعة الاستبدال ضمن namespace الهيلبر، إكمال ذري يتحقق من الموظف والمخزون، وعمليات ولاء offline ذرية عبر QR موقّع.
- **الشريك:** حذف بيانات العميل غير اللازمة، تدفق استلام/تجهيز/تسليم متعدد المراحل، واستلام QR ذري يمنع التكرار والسباق.
- **الإشعارات:** outbox بعملية claim ذرية، backoff وحد محاولات، قنوات role-aware، فحص Expo tickets وحذف رموز الأجهزة الملغاة، ورسائل بريد مع فاتورة للطلب المؤكد.
- **الأمان:** CSP nonce، origin/CSRF، rate limits، رفع ملفات مقيد، حماية SSRF، RLS ومنح تنفيذ محدودة، إعدادات خاصة، وفشل مغلق للدفع والأسرار الناقصة.
- **التنظيف:** حذف مسارات سلة وولاء وpush-token وQR/استبدال القديمة أو المكررة التي كانت تسمح بتجاوز المسار الرسمي.
- **الترجمة:** دمج عميق آمن بين رسائل shared ورسائل التطبيقات، توحيد مفاتيح العربية والإنجليزية، وإكمال واجهات الهيلبر والشريك والصفحات الإدارية التي عولجت في هذه الجولة.

### تحقق الجولة بدون build

- لم يُشغّل `next build` أو `turbo build` أو أي أمر build.
- نجح تحليل TypeScript النحوي داخل الذاكرة على 431 ملف TS/TSX: صفر أخطاء صياغة.
- نجح JSON لكل ملفات رسائل shared/web/admin.
- أصبحت مسارات مفاتيح العربية والإنجليزية متطابقة في المجموعات الثلاث.
- فحص الأنواع الكامل لم يُشغّل لأن `node_modules` غير مكتمل بعد محاولة تثبيت offline؛ يحتاج موافقة صريحة على اتصال npm، ولا يتطلب build.

### الحد الفاصل للجاهزية

الكود مجهز للربط مع واجهات الهيلبر والشريك والموبايل اللاحقة من خلال جداول وRPC وREST حقيقية، وليس placeholders. الجاهزية الإنتاجية ما زالت مشروطة بتطبيق الهجرات وضبط الأسرار واختبار staging والخدمات الخارجية كما هو موثق في `CODEX_COMPLETION_MASTER_PLAN.md` و`CODEX_SECURITY_BEST_PRACTICES_REPORT.md`.

## نقطة الحذف التي أُغلقت بعد موافقة المستخدم

- [تم] حذف الملف الزائد:
  - `apps/web/src/app/api/orders/[orderId]/exchange/route.ts`
- السبب: يوجد الآن المسار الصحيح تحت:
  - `apps/web/src/app/api/orders/[id]/exchange/route.ts`
- لم يعد يوجد `[orderId]` داخل `apps/web/src/app/api/orders`.

## ما تم إغلاقه في جولة 2026-07-08 الثالثة

- تم إعادة التدقيق الشامل لمسارات Admin/Partner/Helper/Web مقابل PRD بدون تشغيل build.
- تم تشديد حماية الأدمن:
  - `requireAdminContext` صار يتحقق من كوكي TOTP الموقّعة بجانب middleware.
  - هذا يغلق مسار bypass محتمل لو استُدعي API guard خارج مسار middleware.
- تم تصحيح صلاحيات sub-admin في مسارات الأدمن:
  - كل عمليات `POST` التي تنشئ سجلات أصبحت تتطلب `create`/Full Access.
  - كل عمليات `PATCH/PUT` أصبحت تتطلب `edit`.
  - كل عمليات `DELETE` أصبحت تتطلب `delete`/Full Access.
  - لم يعد يوجد endpoint غير `GET` في `apps/admin/src/app/api` يطلب `view` فقط.
- تم تصحيح cart/checkout في الويب:
  - `/api/cart` لم يعد يرجع إلى `customer_profiles.cart_data`; المصدر الرسمي صار `cart_items`.
  - `POST /api/orders` عند القراءة من السلة يستخدم `product_variant_id` بدل `variant_id`.
  - تحقق خصم cart/checkout صار موحدًا مع ترتيب PRD: active/date/eligibility/min cart/scope/usage limits/per-user limits.
  - `first_time_buyers` صار يتحقق من وجود طلب سابق `completed` كما يصف PRD.
- تم تصحيح الاستبدال في الويب:
  - مسار `/api/orders/:id/exchange` يتحقق من نوع وحجم صور الإثبات قبل رفعها.
  - واجهة طلب الاستبدال تمنع رفع غير الصور أو ملفات أكبر من 5MB.
  - صفحة FAQ لم تعد تعرض 14 يومًا، وتمت مطابقتها مع نافذة PRD الافتراضية 7 أيام.
- تم تقليل انحراف أسماء مبالغ الطلبات في قاعدة البيانات:
  - migration جديدة `20260708205000_prd_order_amount_aliases.sql`.
  - aliases generated على `orders`: `subtotal`, `discount_amount`, `loyalty_discount_amount`, `shipping_cost`, `total_amount`.
  - تم تحديث `packages/database/src/types.ts`.

## فحوصات جولة 2026-07-08 الثالثة بدون build

- `apps/admin`: `tsc --noEmit --incremental false` نجح.
- `apps/web`: `tsc --noEmit --incremental false` نجح.
- `apps/helper`: `tsc --noEmit --incremental false` نجح.
- `apps/partner`: `tsc --noEmit --incremental false` نجح.
- `packages/database`: `tsc --noEmit --incremental false` نجح.
- `packages/shared`: `tsc --noEmit --incremental false` نجح.
- `git diff --check` نظيف للملفات المعدلة، مع تحذيرات CRLF المعتادة فقط.
