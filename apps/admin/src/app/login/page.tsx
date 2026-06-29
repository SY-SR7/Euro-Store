// @ts-nocheck
/* eslint-disable */
import { redirect } from 'next/navigation';
import { loginAction } from './actions';

export default function AdminLoginPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F8F6F2] px-4" dir="rtl">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-[#E5E0D8] bg-white p-8 shadow-sm">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#B8860B] text-white font-black text-lg">
              ES
            </div>
            <h1 className="text-xl font-black text-[#1C1917]">لوحة إدارة EuroStore</h1>
            <p className="mt-1 text-sm text-[#A8A29E]">للمسؤولين فقط</p>
          </div>

          {searchParams.error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {searchParams.error === 'invalid_credentials' ? 'بيانات الدخول غير صحيحة' : searchParams.error}
            </div>
          )}

          <form action={loginAction} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[#1C1917]">البريد الإلكتروني</label>
              <input name="email" type="email" required autoComplete="email"
                className="w-full rounded-xl border border-[#E5E0D8] bg-[#F8F6F2] px-4 py-3 text-sm text-[#1C1917] outline-none transition focus:border-[#B8860B] placeholder:text-[#A8A29E]"
                placeholder="admin@eurostore.com" dir="ltr" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[#1C1917]">كلمة المرور</label>
              <input name="password" type="password" required autoComplete="current-password"
                className="w-full rounded-xl border border-[#E5E0D8] bg-[#F8F6F2] px-4 py-3 text-sm text-[#1C1917] outline-none transition focus:border-[#B8860B]"
                placeholder="••••••••" dir="ltr" />
            </div>
            <button type="submit"
              className="w-full rounded-xl bg-[#B8860B] py-3 text-sm font-black text-white hover:bg-[#9A7209] transition-colors">
              دخول
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}