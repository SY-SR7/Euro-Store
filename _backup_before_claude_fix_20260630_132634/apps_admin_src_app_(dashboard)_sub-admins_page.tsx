'use client';
import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';

interface SubAdmin {
  user_id: string; display_name: string|null; email: string;
  is_active: boolean; created_at: string;
}
function pickArray<T>(p: unknown): T[] {
  if (Array.isArray(p)) return p as T[];
  if (p && typeof p === 'object') {
    const o = p as Record<string,unknown>;
    for (const k of ['data','items','subAdmins','sub_admins','rows']) { if (Array.isArray(o[k])) return o[k] as T[]; }
  }
  return [];
}

export default function AdminSubAdminsPage() {
  const [subAdmins, setSubAdmins] = useState<SubAdmin[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState({ email:'', password:'', display_name:'' });
  const [creating, setCreating]   = useState(false);
  const [msg, setMsg]             = useState('');
  const [error, setError]         = useState('');

  async function load() {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/sub-admins', { cache:'no-store' });
      const d = await res.json().catch(()=>null);
      if (!res.ok) { setError((d as {error?:string}|null)?.error ?? 'خطأ'); setSubAdmins([]); }
      else setSubAdmins(pickArray<SubAdmin>(d));
    } catch { setError('تعذر الاتصال'); setSubAdmins([]); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault(); setMsg(''); setError(''); setCreating(true);
    try {
      const res = await fetch('/api/sub-admins', {
        method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(form),
      });
      const d = await res.json().catch(()=>null);
      if (!res.ok) setError((d as {error?:string}|null)?.error ?? 'فشل الإنشاء');
      else { setMsg('تم إنشاء الحساب بنجاح'); setForm({email:'',password:'',display_name:''}); setShowForm(false); void load(); }
    } catch { setError('تعذر الاتصال'); }
    finally { setCreating(false); }
  }

  async function handleToggle(userId: string, current: boolean) {
    await fetch(`/api/sub-admins/${userId}`, {
      method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ is_active:!current }),
    });
    void load();
  }

  return (
    <div className="space-y-5" dir="rtl">
      <div className="flex flex-col gap-4 rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-sm sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#1C1917]">المسؤولون الفرعيون</h1>
          <p className="mt-1 text-sm text-[#A8A29E]">{subAdmins.length} مسؤول</p>
        </div>
        <button onClick={()=>setShowForm(v=>!v)} className="rounded-xl bg-[#B8860B] px-5 py-2.5 text-sm font-black text-[#1F1B16] hover:bg-[#9A7209] transition-colors">
          {showForm ? 'إلغاء' : '+ مسؤول جديد'}
        </button>
      </div>

      {msg && <div className="rounded-xl border border-green-200 bg-green-50 px-5 py-3 text-sm font-semibold text-green-700">{msg}</div>}
      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700">{error}</div>}

      {showForm && (
        <div className="rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-black text-[#B8860B]">إنشاء حساب مسؤول فرعي</h2>
          <form onSubmit={handleCreate} className="grid gap-3 sm:grid-cols-2">
            <input value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="البريد الإلكتروني *" type="email" className="input-field" dir="ltr" />
            <input value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} placeholder="كلمة المرور (8 أحرف+) *" type="password" className="input-field" dir="ltr" />
            <input value={form.display_name} onChange={e=>setForm(f=>({...f,display_name:e.target.value}))} placeholder="الاسم" className="input-field sm:col-span-2" />
            <button type="submit" disabled={creating} className="rounded-xl bg-[#B8860B] px-5 py-2.5 text-sm font-black text-[#1F1B16] hover:bg-[#9A7209] disabled:opacity-50 transition-colors sm:col-span-2 w-fit">
              {creating ? 'جاري الإنشاء...' : 'إنشاء الحساب'}
            </button>
          </form>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-[#E5E0D8] bg-white shadow-sm">
        {loading ? <p className="p-10 text-center text-sm text-[#A8A29E]">جاري التحميل...</p>
        : subAdmins.length === 0 ? <p className="p-10 text-center text-sm text-[#A8A29E]">لا يوجد مسؤولون فرعيون</p>
        : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[#F8F6F2]">
                <tr>
                  {['الاسم','البريد الإلكتروني','تاريخ الإنشاء','الحالة','إجراء'].map((h,i) => (
                    <th key={i} className={`px-5 py-3 text-right text-xs font-black text-[#A8A29E] ${i===2?'hidden md:table-cell':''} ${i===4?'text-left':''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0ECE6]">
                {subAdmins.map(sa => (
                  <tr key={sa.user_id} className="hover:bg-[#FAFAF8] transition-colors">
                    <td className="px-5 py-3 font-semibold text-[#1C1917]">{sa.display_name ?? '—'}</td>
                    <td className="px-5 py-3 font-mono text-xs text-[#57534E]">{sa.email}</td>
                    <td className="px-5 py-3 text-xs text-[#A8A29E] hidden md:table-cell">{new Date(sa.created_at).toLocaleDateString('ar-SY')}</td>
                    <td className="px-5 py-3">
                      <span className={sa.is_active?'badge-green':'badge-gray'}>{sa.is_active?'نشط':'معطّل'}</span>
                    </td>
                    <td className="px-5 py-3 text-left">
                      <button onClick={()=>void handleToggle(sa.user_id, sa.is_active)}
                        className={`font-bold text-xs hover:underline ${sa.is_active?'text-red-500':'text-green-600'}`}>
                        {sa.is_active ? 'تعطيل' : 'تفعيل'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}