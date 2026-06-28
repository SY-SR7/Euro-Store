import { verifyTotpAction, getOrCreateTotpSetup } from '../actions';

interface TotpSetupPageProps {
  searchParams?: {
    status?: string;
  };
}

export default async function TotpSetupPage({ searchParams }: TotpSetupPageProps) {
  const setup = await getOrCreateTotpSetup();
  const hasError = searchParams?.status === 'failed' || searchParams?.status === 'invalid';

  return (
    <main className="min-h-screen bg-[#0F0F0F] px-6 py-16 text-[#E2E2E2]">
      <section className="mx-auto flex w-full max-w-xl flex-col gap-8">
        <div>
          <p className="text-sm text-[#C9A84C]">{setup.issuer}</p>
          <h1 className="mt-3 text-3xl font-semibold">تفعيل المصادقة الثنائية</h1>
        </div>

        {hasError && <p className="rounded border border-[#2E2E2E] p-4 text-sm">الرمز غير صحيح. حاول مرة أخرى.</p>}

        <div className="rounded border border-[#2E2E2E] p-5">
          <p className="text-sm text-[#9CA3AF]">الحساب</p>
          <p className="mt-2">{setup.accountName}</p>
          <p className="mt-6 text-sm text-[#9CA3AF]">المفتاح اليدوي</p>
          <code className="mt-2 block break-all rounded bg-[#1A1A1A] p-4 text-sm">{setup.secret}</code>
          <p className="mt-6 text-sm text-[#9CA3AF]">رابط الإعداد</p>
          <code className="mt-2 block break-all rounded bg-[#1A1A1A] p-4 text-xs">{setup.uri}</code>
        </div>

        <form action={verifyTotpAction} className="flex flex-col gap-4">
          <label className="flex flex-col gap-2 text-sm">
            رمز التطبيق
            <input name="code" inputMode="numeric" required className="rounded border border-[#2E2E2E] bg-transparent px-4 py-3" />
          </label>
          <button className="rounded bg-[#C9A84C] px-5 py-3 font-semibold text-[#111111]" type="submit">
            تفعيل
          </button>
        </form>
      </section>
    </main>
  );
}
