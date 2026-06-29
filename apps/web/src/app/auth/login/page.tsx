// @ts-nocheck
/* eslint-disable */
'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault(); setError(''); setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) { setError(err.message); setLoading(false); return; }
    router.push('/account');
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FAFAF8] px-4" dir="rtl">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-[#E7E3DC] bg-white p-8 shadow-sm">
          <div className="mb-6 text-center">
            <Link href="/" className="text-lg font-black tracking-widest text-[#B8860B]">EURO STORE</Link>
            <h1 className="mt-2 text-xl font-black text-[#1C1917]">تسجيل الدخول</h1>
          </div>

          {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[#1C1917]">البريد الإلكتروني</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required
                className="w-full rounded-xl border border-[#E7E3DC] bg-[#FAFAF8] px-4 py-3 text-sm text-[#1C1917] outline-none transition focus:border-[#B8860B] placeholder:text-[#A8A29E]"
                placeholder="you@example.com" dir="ltr" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[#1C1917]">كلمة المرور</label>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required
                className="w-full rounded-xl border border-[#E7E3DC] bg-[#FAFAF8] px-4 py-3 text-sm text-[#1C1917] outline-none transition focus:border-[#B8860B]"
                placeholder="••••••••" dir="ltr" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full rounded-xl bg-[#B8860B] py-3 text-sm font-black text-white hover:bg-[#9A7209] disabled:opacity-50 transition-colors">
              {loading ? 'جاري الدخول...' : 'دخول'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-[#A8A29E]">
            ليس لديك حساب؟{' '}
            <Link href="/auth/register" className="font-bold text-[#B8860B] hover:underline">إنشاء حساب</Link>
          </p>
        </div>
      </div>
    </main>
  );
}