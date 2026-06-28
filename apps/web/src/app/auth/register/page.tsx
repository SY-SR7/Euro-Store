import Link from 'next/link';
import { registerCustomerAction } from '../actions';

const statusMessages: Record<string, string> = {
  invalid: 'تحقق من الاسم والبريد وكلمة المرور. كلمة المرور يجب أن تكون قوية.',
  failed: 'تعذر إنشاء الحساب الآن. حاول مرة أخرى لاحقًا.',
};

interface RegisterPageProps {
  searchParams?: {
    status?: string;
  };
}

export default function RegisterPage({ searchParams }: RegisterPageProps) {
  const message = searchParams?.status ? statusMessages[searchParams.status] : undefined;

  return (
    <main className="min-h-screen bg-[#0F0F0F] px-6 py-16 text-[#E2E2E2]">
      <section className="mx-auto flex w-full max-w-md flex-col gap-8">
        <div>
          <p className="text-sm text-[#C9A84C]">EuroStore</p>
          <h1 className="mt-3 text-3xl font-semibold">إنشاء حساب عميل</h1>
        </div>

        {message && <p className="rounded border border-[#2E2E2E] p-4 text-sm">{message}</p>}

        <form action={registerCustomerAction} className="flex flex-col gap-4">
          <label className="flex flex-col gap-2 text-sm">
            الاسم الكامل
            <input name="fullName" required className="rounded border border-[#2E2E2E] bg-transparent px-4 py-3" />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            البريد الإلكتروني
            <input name="email" type="email" required className="rounded border border-[#2E2E2E] bg-transparent px-4 py-3" />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            رقم الهاتف
            <input name="phone" className="rounded border border-[#2E2E2E] bg-transparent px-4 py-3" />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            اللغة المفضلة
            <select name="preferredLanguage" className="rounded border border-[#2E2E2E] bg-[#0F0F0F] px-4 py-3">
              <option value="ar">العربية</option>
              <option value="en">English</option>
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm">
            كلمة المرور
            <input name="password" type="password" required className="rounded border border-[#2E2E2E] bg-transparent px-4 py-3" />
          </label>
          <button className="rounded bg-[#C9A84C] px-5 py-3 font-semibold text-[#111111]" type="submit">
            إنشاء الحساب
          </button>
        </form>

        <Link className="text-sm text-[#C9A84C]" href="/auth/login">
          لدي حساب بالفعل
        </Link>
      </section>
    </main>
  );
}
