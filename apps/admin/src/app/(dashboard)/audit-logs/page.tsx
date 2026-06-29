'use client';
import { useEffect, useState } from 'react';

interface AuditLog {
  id: string; actor_id?: string|null; actor_role?: string|null;
  action: string; target_table?: string|null; target_id?: string|null;
  metadata?: Record<string,unknown>|null; created_at: string;
}

function pickAudit(p: unknown): { data: AuditLog[]; total: number } {
  if (Array.isArray(p)) return { data: p as AuditLog[], total: p.length };
  if (p && typeof p === 'object') {
    const o = p as Record<string,unknown>;
    const rows = Array.isArray(o.data) ? o.data as AuditLog[] : Array.isArray(o.items) ? o.items as AuditLog[] : [];
    return { data: rows, total: typeof o.total === 'number' ? o.total : rows.length };
  }
  return { data:[], total:0 };
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  async function load(p: number) {
    setLoading(true);
    const res = await fetch(`/api/audit-logs?page=${p}&limit=20`, { cache:'no-store' });
    const d = await res.json().catch(()=>null);
    const { data, total: t } = pickAudit(d);
    setLogs(data); setTotal(t);
    setLoading(false);
  }
  useEffect(() => { void load(page); }, [page]);

  return (
    <div className="space-y-5" dir="rtl">
      <div className="rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-black text-[#1C1917]">سجل التدقيق</h1>
        <p className="mt-1 text-sm text-[#A8A29E]">{total} سجل</p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-[#E5E0D8] bg-white shadow-sm">
        {loading ? <p className="p-10 text-center text-sm text-[#A8A29E]">جاري التحميل...</p>
        : logs.length === 0 ? <p className="p-10 text-center text-sm text-[#A8A29E]">لا توجد سجلات</p>
        : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[#F8F6F2]">
                <tr>
                  {['الإجراء','الجدول المستهدف','الدور','التاريخ'].map((h,i) => (
                    <th key={i} className={`px-5 py-3 text-right text-xs font-black text-[#A8A29E] ${i===1?'hidden sm:table-cell':''} ${i===2?'hidden md:table-cell':''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0ECE6]">
                {logs.map(l => (
                  <tr key={l.id} className="hover:bg-[#FAFAF8] transition-colors">
                    <td className="px-5 py-3 font-mono text-xs font-semibold text-[#1C1917]">{l.action}</td>
                    <td className="px-5 py-3 text-xs text-[#57534E] hidden sm:table-cell">{l.target_table ?? '—'}</td>
                    <td className="px-5 py-3 hidden md:table-cell"><span className="badge-blue">{l.actor_role ?? 'نظام'}</span></td>
                    <td className="px-5 py-3 text-xs text-[#A8A29E]">{new Date(l.created_at).toLocaleString('ar-SY')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {total > 20 && (
        <div className="flex items-center justify-center gap-3">
          <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} className="rounded-xl border border-[#E5E0D8] px-4 py-2 text-sm font-semibold text-[#57534E] hover:border-[#B8860B] disabled:opacity-40 transition-colors">السابق</button>
          <span className="text-sm text-[#A8A29E]">صفحة {page} / {Math.ceil(total/20)}</span>
          <button onClick={()=>setPage(p=>p+1)} disabled={page>=Math.ceil(total/20)} className="rounded-xl border border-[#E5E0D8] px-4 py-2 text-sm font-semibold text-[#57534E] hover:border-[#B8860B] disabled:opacity-40 transition-colors">التالي</button>
        </div>
      )}
    </div>
  );
}