'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

function safeNext(value: string | null) {
  if (!value) return '/';
  if (!value.startsWith('/')) return '/';
  if (value.startsWith('//')) return '/';
  return value;
}

export default function LoginPage() {
  const searchParams = useSearchParams();
  const next = useMemo(() => safeNext(searchParams.get('next')), [searchParams]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) return;

    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      setError('أدخل البريد الإلكتروني وكلمة المرور');
      return;
    }

    setLoading(true);
    setError('');

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        credentials: 'same-origin',
        signal: controller.signal,
        body: JSON.stringify({
          email: cleanEmail,
          password,
        }),
      });

      const payload = await res.json().catch(() => null) as { error?: string } | null;

      if (!res.ok) {
        setError(payload?.error || 'فشل تسجيل الدخول');
        setLoading(false);
        return;
      }

      window.location.assign(next);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setError('انتهت مهلة تسجيل الدخول. تحقق من اتصال Supabase ثم حاول مرة أخرى.');
      } else {
        setError(err instanceof Error ? err.message : 'تعذر تسجيل الدخول');
      }

      setLoading(false);
    } finally {
      window.clearTimeout(timeout);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FAF7EF] px-4 py-10" dir="rtl">
      <section className="w-full max-w-md rounded-3xl border border-[#E8DCC3] bg-[#FFFDF8] p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <p className="text-sm font-black tracking-[0.35em] text-[#C9A84C]">EURO STORE</p>
          <h1 className="mt-4 text-3xl font-black text-[#1F1B16]">تسجيل دخول الأدمن</h1>
          <p className="mt-2 text-sm leading-7 text-[#6F6658]">
            أدخل بيانات حساب الإدارة للوصول إلى لوحة التحكم.
          </p>
        </div>

        <form onSubmit={handleSubmit} method="post" className="space-y-5">
          {error && (
            <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm font-bold text-red-700">
              {error}
            </div>
          )}

          <label className="block space-y-2">
            <span className="text-sm font-black text-[#1F1B16]">البريد الإلكتروني</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-[#E8DCC3] bg-white px-4 py-3 text-left text-[#1F1B16] outline-none transition focus:border-[#C9A84C]"
              placeholder="admin@example.com"
              dir="ltr"
              required
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-black text-[#1F1B16]">كلمة المرور</span>
            <div className="flex overflow-hidden rounded-2xl border border-[#E8DCC3] bg-white focus-within:border-[#C9A84C]">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="min-w-0 flex-1 bg-transparent px-4 py-3 text-left text-[#1F1B16] outline-none"
                placeholder="••••••••"
                dir="ltr"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="border-r border-[#E8DCC3] px-4 text-xs font-black text-[#6F6658] transition hover:text-[#C9A84C]"
              >
                {showPassword ? 'إخفاء' : 'إظهار'}
              </button>
            </div>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-[#C9A84C] px-5 py-3 text-sm font-black text-[#1F1B16] transition hover:bg-[#D8B95F] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'جار تسجيل الدخول...' : 'دخول'}
          </button>

          <p className="text-center text-xs leading-6 text-[#8B8172]">
            يتم تسجيل الدخول عبر POST آمن، ولن تظهر كلمة المرور في رابط الصفحة.
          </p>
        </form>
      </section>
    </main>
  );
}