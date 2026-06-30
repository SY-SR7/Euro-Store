'use client';
/* eslint-disable */
import { useState } from 'react';
import { Star, Loader2, CheckCircle2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

interface WriteReviewFormProps {
  productId: string;
  orderNumber: string;
  productNameAr: string;
}

export function WriteReviewForm({ productId, orderNumber, productNameAr }: WriteReviewFormProps) {
  const [rating, setRating]   = useState(0);
  const [hover, setHover]     = useState(0);
  const [comment, setComment] = useState('');
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const locale = useLocale();
  const t = useTranslations('catalog');
  const isAr = locale === 'ar';

  async function handleSubmit() {
    if (rating < 1 || rating > 5) {
      setError(t('reviewRatingError', { fallback: 'اختر تقييماً من 1 إلى 5 نجوم' }));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id:   productId,
          order_id:     orderNumber,
          rating,
          comment:      comment.trim() || null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? t('reviewSubmitError', { fallback: 'تعذر إرسال التقييم' }));
      }
      setSubmitted(true);
      setOpen(false);
    } catch (e: any) {
      setError(e?.message ?? t('reviewSubmitErrorRetry', { fallback: 'تعذر إرسال التقييم، حاول مرة أخرى' }));
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-green-50 px-3 py-2 text-xs font-semibold text-green-700">
        <CheckCircle2 className="h-4 w-4" />
        {t('reviewSubmittedMsg', { fallback: 'تم إرسال تقييمك، سيظهر بعد مراجعة الإدارة' })}
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-bold text-[#B8860B] hover:underline"
      >
        ⭐ {t('writeReview', { fallback: 'اكتب تقييماً لهذا المنتج' })}
      </button>
    );
  }

  return (
    <div className={`rounded-xl border border-[#E5E0D8] bg-[#FAF7EF] p-3 space-y-2`} dir={isAr ? "rtl" : "ltr"}>
      <p className="text-xs font-bold text-[#1C1917]">{t('reviewFor', { fallback: 'تقييمك لـ' })} «{productNameAr}»</p>

      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            className="p-0.5"
            aria-label={`${n} ${t('stars', { fallback: 'نجوم' })}`}
          >
            <Star
              className={`h-5 w-5 ${
                (hover || rating) >= n ? 'fill-[#B8860B] text-[#B8860B]' : 'text-[#D6CFC2]'
              }`}
            />
          </button>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder={t('writeCommentOptional', { fallback: 'اكتب تعليقاً (اختياري)...' })}
        rows={3}
        className="w-full rounded-lg border border-[#E5E0D8] bg-white p-2 text-xs text-[#1C1917] focus:border-[#B8860B] focus:outline-none"
      />

      {error && <p className="text-xs font-semibold text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          disabled={loading}
          onClick={handleSubmit}
          className="flex items-center justify-center gap-1.5 rounded-lg bg-[#B8860B] px-4 py-1.5 text-xs font-bold text-white transition-colors hover:bg-[#9A7209] disabled:opacity-60"
        >
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {t('submitReview', { fallback: 'إرسال التقييم' })}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-[#E5E0D8] px-4 py-1.5 text-xs font-bold text-[#57534E] hover:border-[#B8860B] hover:text-[#B8860B]"
        >
          {t('cancel', { fallback: 'إلغاء' })}
        </button>
      </div>
    </div>
  );
}
