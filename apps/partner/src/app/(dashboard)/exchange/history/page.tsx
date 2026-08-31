import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createSupabaseServerClientFromEnv, createSupabaseAdminClientFromEnv } from '@eurostore/database';

export const dynamic = 'force-dynamic';

export default async function PartnerExchangeHistoryPage() {
  const t = await getTranslations();
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClientFromEnv({
    get(name: string) { return cookieStore.get(name)?.value; },
    set() { /* Server Components cannot mutate response cookies. */ },
    remove() { /* Server Components cannot mutate response cookies. */ }
  });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createSupabaseAdminClientFromEnv();

  // Get audit logs for this partner's redemptions
  const { data: logs } = await admin
    .from('audit_logs')
    .select('id, action, entity_id, created_at')
    .eq('actor_id', user.id)
    .eq('actor_role', 'partner')
    .eq('action', 'exchange.qr.redeemed')
    .order('created_at', { ascending: false })
    .limit(50);

  const rows = logs ?? [];

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-text-primary">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-semibold mb-6">{t('partner.exchangeHistory')}</h1>
        {rows.length === 0 ? (
          <p className="text-text-secondary">{t('common.noData')}</p>
        ) : (
          <div className="overflow-hidden rounded-md border border-border">
            <table className="w-full text-sm">
              <thead className="bg-background-card text-text-secondary">
                <tr>
                  <th className="px-4 py-3 text-start">{t('partner.exchangeId')}</th>
                  <th className="px-4 py-3 text-start">{t('common.date')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((log) => (
                  <tr key={log.id}>
                    <td className="px-4 py-3 font-mono text-xs text-primary">{String(log.entity_id).slice(0, 8)}…</td>
                    <td className="px-4 py-3 text-[#D6D3C7]">
                      {log.created_at ? new Date(log.created_at).toLocaleDateString('ar-SY') : '-'}
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



