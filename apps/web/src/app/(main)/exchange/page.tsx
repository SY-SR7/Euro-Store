/* eslint-disable */
// @ts-nocheck
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { createServerSupabaseClient } from '@/supabase-server';

export const dynamic = 'force-dynamic';

const STATUS_COLOR: Record<string, string> = {
  pending:   'bg-yellow-900/30 text-yellow-400',
  approved:  'bg-blue-900/30 text-blue-400',
  rejected:  'bg-red-900/30 text-red-400',
  completed: 'bg-green-900/30 text-green-400',
};
const STATUS_LABEL: Record<string, string> = {
  pending:   'معلق',
  approved:  'مقبول',
  rejected:  'مرفوض',
  completed: 'مكتمل',
};

export default async function ExchangeIndexPage() {
  const t = await getTranslations();
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  let requests: Array<{ id: string; status: string; reason_ar: string; created_at: string }> = [];
  if (user) {
    const { data } = await supabase
      .from('exchange_requests')
      .select('id, status, reason_ar, created_at')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false });
    requests = (data ?? []) as typeof requests;
  }

  return (
    <main className="min-h-screen bg-[#0F0F0F] text-[#E2E2E2] px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <nav className="mb-8">
          <Link href="/" className="text-[#C9A84C] text-sm hover:underline"> {t('common.appName')}</Link>
        </nav>

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold">{t('exchange.title')}</h1>
          <Link href="/exchange/new"
            className="rounded-sm bg-[#C9A84C] px-4 py-2 text-sm font-semibold text-[#111] hover:bg-[#D8B95F] transition-colors">
            + {t('exchange.newRequest')}
          </Link>
        </div>

        <div className="mb-6 rounded-md border border-[#2E2E2E] bg-[#151515] p-4">
          <p className="text-sm text-[#9CA3AF] leading-6">
            🔄 سياسة الاستبدال: يمكنك طلب الاستبدال خلال <strong className="text-[#C9A84C]">7 أيام</strong> من استلام طلبك، بشرط أن يكون المنتج بحالته الأصلية وغير مستخدم.
          </p>
        </div>

        {!user ? (
          <div className="rounded-md border border-[#2E2E2E] bg-[#151515] p-8 text-center">
            <p className="text-[#9CA3AF] mb-4">سجّل دخولك لمتابعة طلبات الاستبدال الخاصة بك</p>
            <Link href="/auth/login" className="text-[#C9A84C] hover:underline text-sm">تسجيل الدخول</Link>
          </div>
        ) : requests.length === 0 ? (
          <div className="rounded-md border border-[#2E2E2E] bg-[#151515] p-8 text-center">
            <p className="text-[#9CA3AF] mb-4">لا توجد طلبات استبدال بعد</p>
            <Link href="/exchange/new"
              className="inline-block rounded-sm bg-[#C9A84C] px-5 py-2 text-sm font-semibold text-[#111] hover:bg-[#D8B95F] transition-colors">
              إنشاء طلب استبدال
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-md border border-[#2E2E2E]">
            <table className="w-full text-sm text-[#E2E2E2]">
              <thead className="bg-[#1A1A1A] text-[#9CA3AF]">
                <tr>
                  <th className="px-4 py-3 text-start font-medium">{t('exchange.reason')}</th>
                  <th className="px-4 py-3 text-start font-medium">الحالة</th>
                  <th className="px-4 py-3 text-start font-medium">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2E2E2E]">
                {requests.map(r => (
                  <tr key={r.id} className="hover:bg-[#1A1A1A] transition-colors">
                    <td className="px-4 py-3 text-[#D6D3C7] text-xs max-w-[200px] truncate">{r.reason_ar}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded px-2 py-1 text-xs font-medium ${STATUS_COLOR[r.status] ?? ''}`}>
                        {STATUS_LABEL[r.status] ?? r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#9CA3AF] text-xs">
                      {new Date(r.created_at).toLocaleDateString('ar-SY')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}