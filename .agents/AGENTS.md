# EuroStore — Agent Rules

> هذا الملف يُقرأ تلقائياً من كل AI agent يعمل على هذا المشروع.

## الملفات الإلزامية — اقرأها أولاً

```
_handoff/PROJECT_STRATEGY.md   ← المرجع المعماري الرئيسي
_handoff/SECURITY_RULES.md     ← قواعد الأمان الإلزامية
_handoff/PROGRESS.md           ← حالة المشروع الحالية
_handoff/EuroStore_PRD.md      ← المتطلبات الكاملة
```

## Skills المفعّلة تلقائياً

- **eurostore-nextjs** — لكل كود Next.js / React / API Route
- **eurostore-security** — لكل كود backend أو database
- **eurostore-design-system** — لكل UI أو تصميم
- **eurostore-supabase** — لكل SQL أو Migration أو RLS
- **eurostore-motion-design** — لكل animation أو scroll أو تفاعل

## قواعد الكود

1. TypeScript strict — لا `any` بدون مبرر
2. Zod validation على كل input في الـ API
3. RLS على كل جدول جديد في Supabase
4. JWT في httpOnly cookies فقط — لا localStorage
5. SELECT FOR UPDATE لكل عملية مخزون أو نقاط
6. UUID كـ PK لكل جدول — لا sequential IDs
7. Audit log لكل action من admin/helper/partner

## قواعد الواجهات

1. Framer Motion لكل animation — لا CSS animations للتفاعلات المعقدة
2. كل section يتحرك عند الدخول للـ viewport (whileInView)
3. Hero يحتوي scroll-driven cinematic sequence
4. Lenis Smooth Scroll مفعّل في root layout
5. RTL بـ CSS logical properties فقط — لا left/right
6. ألوان من design tokens فقط — لا hardcoded hex خارج الـ tokens
7. Reduced motion fallback إلزامي

## بعد كل جلسة عمل

حدّث `_handoff/PROGRESS.md` بما أُنجز وما هو التالي.
