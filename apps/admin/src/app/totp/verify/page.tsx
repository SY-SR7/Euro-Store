import { verifyTotpAction } from '../actions';

const statusMessages: Record<string, string> = {
  invalid: 'أدخل رمزًا من 6 أرقام.',
  failed: 'الرمز غير صحيح. حاول مرة أخرى.',
};

interface TotpVerifyPageProps {
  searchParams?: {
    status?: string;
  };
}

export default function TotpVerifyPage({ searchParams }: TotpVerifyPageProps) {
  const message = searchParams?.status ? statusMessages[searchParams.status] : undefined;

  return (
    <main className="min-h-screen bg-[#0F0F0F] px-6 py-16 text-[#E2E2E2]">
      <section className="mx-auto flex w-full max-w-md flex-col gap-8">
        <div>
          <p className="text-sm text-[#C9A84C]">EuroStore Admin</p>
          <h1 className="mt-3 text-3xl font-semibold">رمز المصادقة الثنائية</h1>
        </div>

        {message && <p className="rounded border border-[#2E2E2E] p-4 text-sm">{message}</p>}

        <form action={verifyTotpAction} className="flex flex-col gap-4">
          <label className="flex flex-col gap-2 text-sm">
            الرمز
            <input name="code" inputMode="numeric" required className="rounded border border-[#2E2E2E] bg-transparent px-4 py-3" />
          </label>
          <button className="rounded bg-[#C9A84C] px-5 py-3 font-semibold text-[#111111]" type="submit">
            دخول
          </button>
        </form>
      </section>
    </main>
  );
}
