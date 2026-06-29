'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

interface AuditLog {
  id: string;
  actor_id: string;
  actor_role: string;
  action: string;
  target_table: string | null;
  target_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export default function AdminAuditLogsPage() {
  const t = useTranslations();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setLoading(true);
    void fetch(`/api/audit-logs?page=${page}`)
      .then(r => r.json())
      .then((d: { data: AuditLog[]; total: number }) => {
        setLogs(d.data ?? []);
        setTotal(d.total ?? 0);
        setLoading(false);
      });
  }, [page]);

  const totalPages = Math.ceil(total / 30);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#E2E2E2]">{t('admin.auditLogs')} ({total})</h1>
      </div>

      {loading ? (
        <p className="text-[#9CA3AF]">{t('common.loading')}</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-[#2E2E2E]">
            <table className="w-full text-sm text-[#E2E2E2]">
              <thead className="bg-[#1A1A1A] text-[#9CA3AF]">
                <tr>
                  {['الإجراء', 'الجدول', 'الدور', t('common.date')].map(h => (
                    <th key={h} className="px-4 py-3 text-start font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2E2E2E]">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-[#1A1A1A] transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-[#C9A84C]">{log.action}</td>
                    <td className="px-4 py-3 text-xs text-[#9CA3AF]">{log.target_table ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-sm bg-[#1A1A1A] border border-[#2E2E2E] px-2 py-0.5 text-xs text-[#9CA3AF]">
                        {log.actor_role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#6B7280]">
                      {new Date(log.created_at).toLocaleString('ar-SY')}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-[#9CA3AF]">{t('common.noData')}</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-3 justify-end text-sm text-[#9CA3AF]">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded border border-[#2E2E2E] px-3 py-1.5 hover:border-[#C9A84C] hover:text-[#C9A84C] disabled:opacity-40 transition-colors"
              >
                {t('common.prev')}
              </button>
              <span>{t('common.page')} {page} / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded border border-[#2E2E2E] px-3 py-1.5 hover:border-[#C9A84C] hover:text-[#C9A84C] disabled:opacity-40 transition-colors"
              >
                {t('common.next')}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
