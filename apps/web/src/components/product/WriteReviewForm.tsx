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
      setError(t('reviewRatingError'));
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
        throw new Error(body?.error ?? t('reviewSubmitError'));
      }
      setSubmitted(true);
      setOpen(false);
    } catch (e: any) {
      setError(e?.message ?? t('reviewSubmitErrorRetry'));
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-green-50 px-3 py-2 text-xs font-semibold text-green-700">
        <CheckCircle2 className="h-4 w-4" />
        {t('reviewSubmittedMsg')}
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-bold text-primary hover:underline"
      >
        ⭐ {t('writeReview')}
      </button>
    );
  }

  return (
    <div className={`rounded-xl border border-[#E5E0D8] bg-background p-3 space-y-2`} dir={isAr ? "rtl" : "ltr"}>
      <p className="text-xs font-bold text-text-primary">{t('reviewFor')} «{productNameAr}»</p>

      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            className="p-0.5"
            aria-label={`${n} ${t('stars')}`}
          >
            <Star
              className={`h-5 w-5 ${
                (hover || rating) >= n ? 'fill-[#B8860B] text-primary' : 'text-[#D6CFC2]'
              }`}
            />
          </button>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder={t('writeCommentOptional')}
        rows={3}
        className="w-full rounded-lg border border-[#E5E0D8] bg-background-card p-2 text-xs text-text-primary focus:border-primary focus:outline-none"
      />

      {error && <p className="text-xs font-semibold text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          disabled={loading}
          onClick={handleSubmit}
          className="flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 text-xs font-bold text-text-primary transition-colors hover:bg-[#9A7209] disabled:opacity-60"
        >
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {t('submitReview')}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-[#E5E0D8] px-4 py-1.5 text-xs font-bold text-text-secondary hover:border-primary hover:text-primary"
        >
          {t('cancel')}
        </button>
      </div>
    </div>
  );
}
