# دليل إطلاق وإنتاج EuroStore (Deployment Guide)

هذا الدليل يشرح لك خطوة بخطوة كيفية إطلاق المتجر (Web) ولوحة التحكم (Admin) وتطبيق الجوال (Mobile) على خوادم الإنتاج (Production).

## 1. إعداد قاعدة البيانات (Supabase)
1. قم بإنشاء مشروع جديد على [Supabase](https://supabase.com).
2. انسخ `Project URL` و `anon key`.
3. قم بتشغيل جميع ملفات `migrations` الموجودة في مجلد `supabase/migrations/` بالترتيب على المشروع الجديد لتكوين الجداول والسياسات (RLS).
4. تأكد من ضبط إعدادات الـ Authentication في Supabase لتسمح بالتسجيل عبر البريد الإلكتروني.

## 2. نشر الويب والإدارة (Web & Admin)
### خيار أ: النشر عبر Vercel (موصى به)
1. اربط مستودع المشروع (GitHub Repo) بحسابك في Vercel.
2. قم بإضافة مشروعين جديدين من نفس المستودع.
3. للمشروع الأول (Web):
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/web`
   - **Environment Variables**:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. للمشروع الثاني (Admin):
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/admin`
   - **Environment Variables**:
     - (نفس متغيرات الويب)

### خيار ب: النشر عبر Docker (VPS / AWS / DigitalOcean)
لقد قمنا بتجهيز `Dockerfile.web` و `Dockerfile.admin` بالإضافة لـ `docker-compose.yml`.
1. ارفع المشروع إلى خادمك.
2. أنشئ ملف `.env` في المسار الرئيسي وضع فيه المتغيرات:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-key
   ```
3. قم بتشغيل الأمر: `docker-compose up -d --build`.
4. الموقع سيعمل على بورت `3000` والإدارة على بورت `3001`. استخدم `Nginx` أو `Caddy` كـ Reverse Proxy لربطهم بنطاقات حقيقية (Domains) مع شهادات SSL.

## 3. تصدير تطبيق الجوال (Mobile App)
تطبيق الجوال مبني باستخدام Expo و NativeWind.
1. قم بتسجيل الدخول في `Expo CLI`:
   ```bash
   npx expo login
   ```
2. ادخل إلى مجلد التطبيق:
   ```bash
   cd apps/mobile
   ```
3. قم بتحديث `eas.json` بالروابط الخاصة بك (بدل `PLACEHOLDER_URL`).
4. לבناء نسخة الأندرويد (APK أو AAB للـ Play Store):
   ```bash
   eas build --platform android --profile production
   ```
5. لبناء نسخة الآيفون (للـ App Store):
   ```bash
   eas build --platform ios --profile production
   ```
*(ملاحظة: بناء الآيفون يتطلب حساب Apple Developer).*

## 4. نصائح أخيرة للأمان (Security)
- لا تضع مفتاح `SERVICE_ROLE_KEY` الخاص بـ Supabase في الواجهات الأمامية أبداً. استخدمه فقط في الواجهات الخلفية الآمنة إذا لزم الأمر.
- نظامك يعتمد بالكامل على سياسات أمان قاعدة البيانات (RLS)، فلا تقم بإيقاف تفعيل الـ RLS عن أي جدول.
