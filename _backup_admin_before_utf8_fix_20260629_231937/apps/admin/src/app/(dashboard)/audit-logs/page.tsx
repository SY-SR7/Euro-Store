'use client';
import { useEffect, useState } from 'react';

interface AuditLog {
  id: string; actor_id?: string|null; actor_role?: string|null;
  action: string; target_table?: string|null; target_id?: string|null;
  metadata?: Record<string,unknown>|null; created_at: string;
}
function pickAudit(p:unknown):{data:AuditLog[];total:number}{
  if(Array.isArray(p))return{data:p as AuditLog[],total:p.length};
  if(p&&typeof p==='object'){const o=p as Record<string,unknown>;const rows=Array.isArray(o.data)?o.data as AuditLog[]:Array.isArray(o.items)?o.items as AuditLog[]:[];return{data:rows,total:typeof o.total==='number'?o.total:rows.length};}
  return{data:[],total:0};
}
function Modal({ title, onClose, children }: { title:string; onClose:()=>void; children:React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-3xl border border-[#E5E0D8] bg-white shadow-2xl max-h-[90vh] flex flex-col" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#F0ECE6] px-6 py-4">
          <h2 className="font-black text-[#1C1917]">{title}</h2>
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F8F6F2] text-[#A8A29E] hover:bg-[#E5E0D8] text-lg">×</button>
        </div>
        <div className="overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}

export default function AdminAuditLogsPage() {
  const [logs,setLogs]        = useState<AuditLog[]>([]);
  const [page,setPage]        = useState(1);
  const [total,setTotal]      = useState(0);
  const [loading,setLoading]  = useState(true);
  const [selected,setSelected]= useState<AuditLog|null>(null);

  async function load(p:number) {
    setLoading(true);
    const res = await fetch(`/api/audit-logs?page=${p}&limit=20`,{cache:'no-store'});
    const d = await res.json().catch(()=>null);
    const {data,total:t}=pickAudit(d);
    setLogs(data); setTotal(t); setLoading(false);
  }
  useEffect(()=>{ void load(page); },[page]);

  return (
    <div className="space-y-5" dir="rtl">
      <div className="rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-black text-[#1C1917]">??? ???????</h1>
        <p className="mt-1 text-sm text-[#A8A29E]">{total} ???</p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-[#E5E0D8] bg-white shadow-sm">
        {loading?<p className="p-10 text-center text-sm text-[#A8A29E]">???? ???????...</p>
        :logs.length===0?<p className="p-10 text-center text-sm text-[#A8A29E]">?? ???? ?????</p>
        :(
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[#F8F6F2]"><tr>
                {['???????','?????? ????????','?????','???????'].map((h,i)=>(
                  <th key={i} className={`px-5 py-3 text-right text-xs font-black text-[#A8A29E] ${i===1?'hidden sm:table-cell':''} ${i===2?'hidden md:table-cell':''}`}>{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-[#F0ECE6]">
                {logs.map(l=>(
                  <tr key={l.id} className="group hover:bg-[#FFFBF0] cursor-pointer transition-colors" onClick={()=>setSelected(l)}>
                    <td className="px-5 py-3 font-mono text-xs font-semibold text-[#1C1917] group-hover:text-[#B8860B] transition-colors">{l.action}</td>
                    <td className="px-5 py-3 text-xs text-[#57534E] hidden sm:table-cell">{l.target_table??'—'}</td>
                    <td className="px-5 py-3 hidden md:table-cell"><span className="badge-blue">{l.actor_role??'????'}</span></td>
                    <td className="px-5 py-3 text-xs text-[#A8A29E]">{new Date(l.created_at).toLocaleString('ar-SY')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {total>20&&(
        <div className="flex items-center justify-center gap-3">
          <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} className="rounded-xl border border-[#E5E0D8] px-4 py-2 text-sm font-semibold text-[#57534E] hover:border-[#B8860B] disabled:opacity-40">??????</button>
          <span className="text-sm text-[#A8A29E]">???? {page} / {Math.ceil(total/20)}</span>
          <button onClick={()=>setPage(p=>p+1)} disabled={page>=Math.ceil(total/20)} className="rounded-xl border border-[#E5E0D8] px-4 py-2 text-sm font-semibold text-[#57534E] hover:border-[#B8860B] disabled:opacity-40">??????</button>
        </div>
      )}

      {selected&&(
        <Modal title={selected.action} onClose={()=>setSelected(null)}>
          <div className="space-y-3 text-sm">
            {([['???????',selected.action],['??????',selected.target_table],['???????',selected.target_id],['?????',selected.actor_role],['???????',new Date(selected.created_at).toLocaleString('ar-SY')]] as [string,string|null|undefined][]).map(([l,v])=>(
              <div key={l} className="flex justify-between border-b border-[#F0ECE6] pb-2"><span className="text-[#A8A29E]">{l}</span><span className="font-semibold text-[#1C1917] font-mono text-xs">{v??'—'}</span></div>
            ))}
            {selected.metadata&&(
              <div className="pt-2">
                <p className="mb-2 text-xs font-bold text-[#A8A29E]">???????? ????????</p>
                <pre className="rounded-xl bg-[#F8F6F2] p-3 text-xs text-[#57534E] overflow-x-auto">{JSON.stringify(selected.metadata,null,2)}</pre>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
