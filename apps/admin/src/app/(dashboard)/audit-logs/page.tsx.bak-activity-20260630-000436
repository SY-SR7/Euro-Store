'use client';
import { useEffect, useState, useCallback } from 'react';

interface Log {
  id:string; admin_id?:string|null; action:string; entity_type:string; entity_id?:string|null;
  old_values?: unknown; new_values?: unknown; created_at:string;
}
function pretty(v: unknown) {
  if (!v) return '';
  try { return JSON.stringify(v,null,2); } catch { return String(v); }
}
function Modal({ title, onClose, children }: { title:string; onClose:()=>void; children:React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-3xl border border-[#E5E0D8] bg-white shadow-2xl max-h-[90vh] flex flex-col" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#F0ECE6] px-6 py-4">
          <h2 className="font-black text-[#1C1917]">{title}</h2>
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F8F6F2] text-[#A8A29E] hover:bg-[#E5E0D8] text-lg">×</button>
        </div>
        <div className="overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}
const ACTION_AR:Record<string,string>={create:'إنشاء',update:'تحديث',delete:'حذف',login:'تسجيل دخول',logout:'تسجيل خروج'};

export default function AdminAuditLogsPage() {
  const [logs,setLogs] = useState<Log[]>([]);
  const [loading,setLoading] = useState(true);
  const [entity,setEntity] = useState('');
  const [action,setAction] = useState('');
  const [selected,setSelected] = useState<Log|null>(null);

  const load = useCallback(()=>{
    setLoading(true);
    const p = new URLSearchParams();
    if (entity) p.set('entity_type',entity);
    if (action) p.set('action',action);
    fetch(`/api/audit-logs?${p}`,{cache:'no-store'})
      .then(r=>r.json()).then(d=>setLogs(Array.isArray(d)?d:(d.logs??[])))
      .catch(()=>setLogs([])).finally(()=>setLoading(false));
  },[entity,action]);
  useEffect(()=>{ load(); },[load]);

  const entityTypes=[...new Set(logs.map(l=>l.entity_type).filter(Boolean))];

  return (
    <div className="space-y-5" dir="rtl">
      <div className="flex items-center justify-between rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-sm">
        <div><h1 className="text-2xl font-black text-[#1C1917]">سجل النشاطات</h1><p className="mt-1 text-sm text-[#A8A29E]">{logs.length} عملية</p></div>
        <button onClick={load} className="rounded-xl border border-[#E5E0D8] px-4 py-2 text-sm font-semibold text-[#57534E] hover:border-[#B8860B]">تحديث ↻</button>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-[#E5E0D8] bg-white p-4 shadow-sm sm:flex-row">
        <select value={action} onChange={e=>setAction(e.target.value)} className="rounded-xl border border-[#E5E0D8] bg-[#FAFAF8] px-3 py-2 text-sm outline-none focus:border-[#B8860B]">
          <option value="">كل العمليات</option>
          {Object.entries(ACTION_AR).map(([k,v])=><option key={k} value={k}>{v}</option>)}
        </select>
        <select value={entity} onChange={e=>setEntity(e.target.value)} className="rounded-xl border border-[#E5E0D8] bg-[#FAFAF8] px-3 py-2 text-sm outline-none focus:border-[#B8860B]">
          <option value="">كل الكيانات</option>
          {entityTypes.map(e=><option key={e} value={e}>{e}</option>)}
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#E5E0D8] bg-white shadow-sm">
        {loading?<p className="p-10 text-center text-sm text-[#A8A29E]">جارٍ التحميل...</p>
        :logs.length===0?<p className="p-10 text-center text-sm text-[#A8A29E]">لا توجد سجلات</p>
        :(
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[#F8F6F2]"><tr>
                {['العملية','الكيان','المعرّف','التاريخ'].map((h,i)=><th key={i} className={`px-5 py-3 text-right text-xs font-black text-[#A8A29E] ${i>=2?'hidden md:table-cell':''}`}>{h}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-[#F0ECE6]">
                {logs.map(l=>(
                  <tr key={l.id} onClick={()=>setSelected(l)} className="group hover:bg-[#FFFBF0] cursor-pointer transition-colors">
                    <td className="px-5 py-3"><span className="rounded-full border border-[#E5E0D8] bg-[#FAFAF8] px-3 py-1 text-xs font-bold text-[#57534E]">{ACTION_AR[l.action]??l.action}</span></td>
                    <td className="px-5 py-3 font-semibold text-[#1C1917] group-hover:text-[#B8860B]">{l.entity_type}</td>
                    <td className="px-5 py-3 text-xs text-[#A8A29E] font-mono hidden md:table-cell">{l.entity_id??''}</td>
                    <td className="px-5 py-3 text-xs text-[#A8A29E] hidden md:table-cell">{new Date(l.created_at).toLocaleString('ar-SY')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected&&(
        <Modal title="تفاصيل السجل" onClose={()=>setSelected(null)}>
          <div className="space-y-4 text-sm">
            {([['العملية',ACTION_AR[selected.action]??selected.action],['الكيان',selected.entity_type],['المعرّف',selected.entity_id??''],['التاريخ',new Date(selected.created_at).toLocaleString('ar-SY')]] as [string,string][]).map(([l,v])=>(
              <div key={l} className="flex justify-between border-b border-[#F0ECE6] pb-2"><span className="text-[#A8A29E]">{l}</span><span className="font-semibold text-[#1C1917]" dir="ltr">{v}</span></div>
            ))}
            <div>
              <h3 className="mb-2 font-bold text-[#B8860B]">القيم القديمة</h3>
              <pre className="max-h-48 overflow-auto rounded-xl bg-[#1C1917] p-4 text-xs text-green-300" dir="ltr">{pretty(selected.old_values)}</pre>
            </div>
            <div>
              <h3 className="mb-2 font-bold text-[#B8860B]">القيم الجديدة</h3>
              <pre className="max-h-48 overflow-auto rounded-xl bg-[#1C1917] p-4 text-xs text-green-300" dir="ltr">{pretty(selected.new_values)}</pre>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}