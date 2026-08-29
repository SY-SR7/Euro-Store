# تحقق قاعدة البيانات المحلي - 2026-08-04

## البيئة

- Supabase CLI: `2.108.0`
- Docker Engine: `29.5.3`
- PostgreSQL المحلي: Supabase Postgres 17
- منافذ Euro Store المحلية: `55320-55329` لتجنب التعارض مع مشروع محلي آخر.
- لم يتم الاتصال بقاعدة Supabase البعيدة ولم تُطبق عليها أي هجرة.

## المشكلات التي كشفها التنفيذ الفعلي وأُصلحت

1. `20260707190000_add_cart_data.sql` كان محفوظاً بترميز UTF-16؛ حُوّل إلى UTF-8 دون تغيير SQL.
2. `20260707190001_place_order_atomic_bundles.sql` كان مختلط الترميز ويستخدم `$$$` غير صالح؛ أُعيد إنشاؤه كـ UTF-8 وSQL صحيح، وحُذف عمود `whatsapp_number` الزائد غير المستخدم.
3. `complete_helper_exchange_secure` كان يعامل composite row كـ UUID؛ صُحح الاستدعاء إلى `SELECT * FROM`.
4. `terminate_order_atomic` كان يكتب في `rejection_reason` وهو generated column؛ بقيت الكتابة في المصدر `rejected_reason` فقط.
5. `admin_report_data` كان يقرأ جدول `bundles` غير الموجود؛ صُحح إلى `product_bundles`.
6. دوال قرار الاستبدال كانت تسند `TEXT` إلى enum `user_role` دون cast؛ أضيف cast صريح.
7. تجديد QR يستخدم `ON CONFLICT (exchange_request_id)` بلا قيد فريد؛ أضيف تنظيف deterministic للتكرارات القديمة وفهرس فريد يضمن رمزاً واحداً لكل طلب.

## النتائج

- نجح `supabase db reset --local --no-seed` من أول هجرة حتى `20260804131000_signed_loyalty_qr.sql`.
- نجح `supabase db lint --local --level warning`: `No schema errors found`.
- عدد جداول schema `public` التي لا تستخدم RLS: صفر.
- عدد دوال `SECURITY DEFINER` في `public` المتاحة لدور `PUBLIC`: صفر.
- منح `INSERT/UPDATE/DELETE` المباشرة لـ `anon` أو `authenticated` على الجداول الحساسة المفحوصة: صفر.
- أُوقفت حاويات Euro Store المحلية بعد الفحص لأن مفاتيح Supabase المحلية افتراضية.

## المتبقي

- مقارنة قائمة الهجرات مع المشروع البعيد ثم تطبيقها على staging بعد نسخة احتياطية.
- لا يُنصح بتطبيقها مباشرة على المشروع المرتبط قبل التأكد هل هو staging أم production.
- typecheck واختبارات التطبيقات ما زالت تنتظر موافقة محددة على إرسال قائمة الاعتماديات إلى npm وتنزيلها.

