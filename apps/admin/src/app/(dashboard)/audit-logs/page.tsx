'use client';

import { useEffect, useState } from 'react';

interface AuditLog {
  id: string;
  actor_id?: string | null;
  actor_role?: string | null;
  action: string;
  target_table?: string | null;
  target_id?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
}

function pickAuditPayload(payload: unknown): { data: AuditLog[]; total: number } {
  if (Array.isArray(payload)) {
    return { data: payload as AuditLog[], total: payload.length };
  }

  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    const rows = Array.isArray(obj.data)
      ? (obj.data as AuditLog[])
      : Array.isArray(obj.items)
        ? (obj.items as AuditLog[])
        : [];

    return {
      data: rows,
      total: typeof obj.total === 'number' ? obj.total : rows.length
    };
  }

  return { data: [], total: 0 };
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadLogs(currentPage: number) {
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/audit-logs?page=${currentPage}`, { cache: 'no-store' });
      const payload = await res.json().catch(() => null);

      if (!res.ok) {
        setError((payload as { error?: string } | null)?.error ?? 'تعذر تحميل سجل التدقيق');
        setLogs([]);
        setTotal(0);
      } else {
        const picked = pickAuditPayload(payload);
        setLogs(picked.data);
        setTotal(picked.total);
      }
    } catch {
      setError('تعذر الاتصال بالخادم');
      setLogs([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadLogs(page);
  }, [page]);

  const totalPages = Math.max(1, Math.ceil(total / 30));

  return (
    <div className="space-y-6" dir="rtl">
      <section className="rounded-3xl border border-white/10 bg-[#101010] p-6 shadow-2xl">
        <h1 className="text-3xl font-black text-white">سجل التدقيق</h1>
        <p className="mt-2 text-sm leading-7 text-[#9CA3AF]">
          متابعة آخر العمليات التي تمت داخل لوحة الإدارة.
        </p>
      </section>

      {error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#101010] shadow-2xl">
        {loading ? (
          <div className="p-10 text-center text-[#9CA3AF]">جار التحميل...</div>
        ) : logs.length === 0 ? (
          <div className="p-10 text-center text-[#9CA3AF]">لا توجد سجلات تدقيق.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-white/5 text-[#C9A84C]">
                <tr>
                  <th className="px-4 py-4 text-right font-black">الإجراء</th>
                  <th className="px-4 py-4 text-right font-black">الجدول</th>
                  <th className="px-4 py-4 text-right font-black">الدور</th>
                  <th className="px-4 py-4 text-right font-black">المعرّف</th>
                  <th className="px-4 py-4 text-right font-black">التاريخ</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/10">
                {logs.map((log) => (
                  <tr key={log.id} className="text-[#EDE7DD] hover:bg-white/[0.03]">
                    <td className="px-4 py-4 font-bold text-white">{log.action}</td>
                    <td className="px-4 py-4">{log.target_table ?? '—'}</td>
                    <td className="px-4 py-4">{log.actor_role ?? '—'}</td>
                    <td className="px-4 py-4 font-mono text-xs text-[#9CA3AF]">{log.target_id ?? '—'}</td>
                    <td className="px-4 py-4">
                      {log.created_at ? new Date(log.created_at).toLocaleString('ar-SY') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-white/10 p-4 text-sm text-[#B8B1A4]">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-xl border border-white/10 px-4 py-2 disabled:opacity-40"
          >
            السابق
          </button>

          <span>
            صفحة {page} / {totalPages}
          </span>

          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="rounded-xl border border-white/10 px-4 py-2 disabled:opacity-40"
          >
            التالي
          </button>
        </div>
      </section>
    </div>
  );
}