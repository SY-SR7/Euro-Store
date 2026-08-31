'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Sparkles, CheckCircle2, ArrowLeft, ArrowRight } from 'lucide-react';

export function VipClubNewsletter({ isAr = true }: { isAr?: boolean }) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    setSubmitting(true);
    setError('');
    try {
      const response = await fetch('/api/storefront/newsletter', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, locale: isAr ? 'ar' : 'en', source: 'web' }) });
      if (!response.ok) throw new Error('subscription_failed');
      setSubmitted(true);
    } catch {
      setError(isAr ? 'تعذر الاشتراك. حاول مرة أخرى.' : 'Could not subscribe. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="border-t border-border bg-background-secondary px-4 py-20 md:px-8 md:py-28">
      <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[2.5rem] border border-border-accent bg-background-card p-8 shadow-xl md:p-14">
        {/* Glow */}
        <div className="pointer-events-none absolute -end-20 -top-20 h-64 w-64 rounded-full bg-primary/15 blur-[90px]" />

        <div className="relative z-10 grid grid-cols-1 gap-8 md:grid-cols-2 md:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary mb-4">
              <Sparkles className="h-4 w-4" />
              <span>{isAr ? 'نادي يورو ستور الذهبي' : 'EuroStore VIP Club'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-text-primary md:text-4xl leading-tight">
              {isAr
                ? 'احصل على خصم 10% على أول طلب لك'
                : 'Enjoy 10% Off Your Very First Order'}
            </h2>
            <p className="mt-3 text-sm text-text-secondary">
              {isAr
                ? 'اشترك في النشرة الحصرية وكن أول من يعلم بوصول التشكيلات الأوروبية الجديدة والعروض الحصرية.'
                : 'Join our exclusive club to get early access to new European drops & private sales.'}
            </p>
          </div>

          <div>
            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-3 rounded-2xl border border-emerald-600/25 bg-emerald-50 p-6 text-emerald-800"
              >
                <CheckCircle2 className="h-8 w-8 shrink-0 text-emerald-700" />
                <div>
                  <h4 className="font-bold text-base">
                    {isAr ? 'تم اشتراكك بنجاح في النادي الذهبي!' : 'Welcome to the VIP Club!'}
                  </h4>
                  <p className="mt-0.5 text-xs text-emerald-700">
                    {isAr
                      ? 'تم تفعيل كود الخصم EURO10 لحسابك'
                      : 'Promo code EURO10 has been activated for you'}
                  </p>
                </div>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute start-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted" />
                    <input
                      type="email"
                      required
                      name="email"
                      autoComplete="email"
                      spellCheck={false}
                      aria-label={isAr ? 'البريد الإلكتروني' : 'Email address'}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={isAr ? 'أدخل بريدك الإلكتروني...' : 'Enter your email address...'}
                      className="w-full rounded-2xl border border-border bg-background-elevated py-4 pe-4 ps-12 text-sm text-text-primary shadow-inner placeholder:text-text-muted focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-primary px-8 py-4 text-sm font-black text-text-primary shadow-lg transition-colors hover:bg-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  >
                    <span>{submitting ? '…' : isAr ? 'انضم الآن' : 'Join Club'}</span>
                    {isAr ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-text-muted text-center sm:text-start">
                  {isAr
                    ? '🔒 نلتزم بحماية خصوصيتك ولا نرسل رسائل مزعجة.'
                    : '🔒 We respect your privacy. No spam ever.'}
                </p>
                {error ? <p role="alert" className="text-xs font-bold text-red-700">{error}</p> : null}
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
