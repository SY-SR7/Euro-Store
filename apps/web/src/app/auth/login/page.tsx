import Link from 'next/link';
import { loginCustomerAction } from '../actions';

const statusMessages: Record<string, string> = {
  invalid: 'تحقق من البريد وكلمة المرور ثم حاول مرة أخرى.',
  failed: 'تعذر تسجيل الدخول. تحقق من البيانات وحاول مجددًا.',
  registered: 'تم إنشاء الحساب. يمكنك تسجيل الدخول الآن.',
};

interface LoginPageProps {
  searchParams?: {
    status?: string;
  };
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const message = searchParams?.status ? statusMessages[searchParams.status] : undefined;

  return (
    <main className="min-h-screen bg-[#0F0F0F] px-6 py-16 text-[#E2E2E2]">
      <section className="mx-auto flex w-full max-w-md flex-col gap-8">
        <div>
          <p className="text-sm text-[#C9A84C]">EuroStore</p>
          <h1 className="mt-3 text-3xl font-semibold">تسجيل دخول العملاء</h1>
        </div>

        {message && <p className="rounded border border-[#2E2E2E] p-4 text-sm">{message}</p>}

        <form action={loginCustomerAction} className="flex flex-col gap-4">
          <label className="flex flex-col gap-2 text-sm">
            البريد الإلكتروني
            <input name="email" type="email" required className="rounded border border-[#2E2E2E] bg-transparent px-4 py-3" />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            كلمة المرور
            <input name="password" type="password" required className="rounded border border-[#2E2E2E] bg-transparent px-4 py-3" />
          </label>
          <button className="rounded bg-[#C9A84C] px-5 py-3 font-semibold text-[#111111]" type="submit">
            دخول
          </button>
        </form>

        <Link className="text-sm text-[#C9A84C]" href="/auth/register">
          إنشاء حساب جديد
        </Link>
      </section>
    </main>
  );
}
