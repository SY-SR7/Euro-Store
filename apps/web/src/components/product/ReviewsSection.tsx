'use client';
/* eslint-disable */
import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  customer_name: string;
}

function Stars({ rating, size = 'h-4 w-4' }: { rating: number; size?: string }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`${size} ${n <= Math.round(rating) ? 'fill-[#B8860B] text-[#B8860B]' : 'text-[#D6CFC2]'}`}
        />
      ))}
    </div>
  );
}

export function ReviewsSection({ productId }: { productId: string }) {
  const [average, setAverage] = useState(0);
  const [count, setCount] = useState(0);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/reviews?product_id=${productId}`)
      .then((r) => r.json())
      .then((data) => {
        setAverage(data.average ?? 0);
        setCount(data.count ?? 0);
        setReviews(data.reviews ?? []);
      })
      .finally(() => setLoading(false));
  }, [productId]);

  if (loading) {
    return <div className="h-32 animate-pulse rounded-2xl bg-[#F3EDE3]" />;
  }

  return (
    <section className="rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-sm" dir="rtl">
      <div className="flex items-center justify-between">
        <h2 className="font-black text-[#1C1917]">تقييمات العملاء</h2>
        {count > 0 && (
          <div className="flex items-center gap-2">
            <Stars rating={average} />
            <span className="text-sm font-bold text-[#1C1917]">{average}</span>
            <span className="text-xs text-[#A8A29E]">({count} تقييم)</span>
          </div>
        )}
      </div>

      {count === 0 ? (
        <p className="mt-4 text-sm text-[#A8A29E]">لا توجد تقييمات لهذا المنتج بعد.</p>
      ) : (
        <div className="mt-4 space-y-4 divide-y divide-[#F0ECE6]">
          {reviews.map((r) => (
            <div key={r.id} className="pt-4 first:pt-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-[#1C1917]">{r.customer_name}</p>
                <span className="text-xs text-[#A8A29E]">
                  {new Date(r.created_at).toLocaleDateString('ar-SY')}
                </span>
              </div>
              <div className="mt-1">
                <Stars rating={r.rating} size="h-3.5 w-3.5" />
              </div>
              {r.comment && <p className="mt-2 text-sm text-[#57534E]">{r.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
