'use client';
import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import SubAdminsQuickAdmin from './SubAdminsQuickAdmin';

export default SubAdminsQuickAdmin;

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
function Modal({ title, onClose, children }: { title:string; onClose:()=>void; children:React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl border border-[#E5E0D8] bg-white shadow-2xl" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#F0ECE6] px-6 py-4">
          <h2 className="font-black text-[#1C1917]">{title}</h2>
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F8F6F2] text-[#A8A29E] hover:bg-[#E5E0D8] text-lg">×</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function LegacyAdminSubAdminsPage() {
  const [subAdmins, setSubAdmins] = useState<SubAdmin[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState({ email:'', password:'', display_name:'' });
  const [creating, setCreating]   = useState(false);
  const [msg, setMsg]             = useState('');
  const [error, setError]         = useState('');
  const [selected, setSelected]   = useState<SubAdmin|null>(null);
  const [editing, setEditing]     = useState(false);
  const [editName, setEditName]   = useState('');
  const [saving, setSaving]       = useState(false);

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

  const open = (sa: SubAdmin) => { setSelected(sa); setEditing(false); setEditName(sa.display_name ?? ''); };

  async function handleToggle(sa: SubAdmin) {
    const next = !sa.is_active;
    setSubAdmins(list => list.map(x => x.user_id===sa.user_id ? {...x, is_active:next} : x));
    if (selected?.user_id === sa.user_id) setSelected({...sa, is_active:next});
    const res = await fetch(`/api/sub-admins/${sa.user_id}`, {
      method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ is_active:next }),
    });
    if (!res.ok) {
      setSubAdmins(list => list.map(x => x.user_id===sa.user_id ? {...x, is_active:sa.is_active} : x));
      if (selected?.user_id === sa.user_id) setSelected({...sa, is_active:sa.is_active});
    }
  }

  async function saveName() {
    if (!selected) return;
    setSaving(true);
    const res = await fetch(`/api/sub-admins/${selected.user_id}`, {
      method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ display_name:editName }),
    });
    if (res.ok) {
      const u = { ...selected, display_name: editName };
      setSelected(u); setSubAdmins(list => list.map(x => x.user_id===selected.user_id ? u : x));
      setEditing(false);
    }
    setSaving(false);
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
                  {['الاسم','البريد الإلكتروني','تاريخ الإنشاء','الحالة'].map((h,i) => (
                    <th key={i} className={`px-5 py-3 text-right text-xs font-black text-[#A8A29E] ${i===2?'hidden md:table-cell':''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0ECE6]">
                {subAdmins.map(sa => (
                  <tr key={sa.user_id} className="group hover:bg-[#FFFBF0] cursor-pointer transition-colors" onClick={()=>open(sa)}>
                    <td className="px-5 py-3 font-semibold text-[#1C1917] group-hover:text-[#B8860B] transition-colors">{sa.display_name ?? '—'}</td>
                    <td className="px-5 py-3 font-mono text-xs text-[#57534E]">{sa.email}</td>
                    <td className="px-5 py-3 text-xs text-[#A8A29E] hidden md:table-cell">{new Date(sa.created_at).toLocaleDateString('ar-SY')}</td>
                    <td className="px-5 py-3" onClick={e=>{e.stopPropagation(); void handleToggle(sa);}}>
                      <span className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-bold transition-colors ${sa.is_active?'bg-green-50 text-green-700 border-green-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200':'bg-red-50 text-red-700 border-red-200 hover:bg-green-50 hover:text-green-700 hover:border-green-200'}`}>
                        {sa.is_active?'نشط':'معطّل'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <Modal title={selected.display_name ?? 'مسؤول فرعي'} onClose={()=>setSelected(null)}>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-2xl border border-[#F0ECE6] bg-[#FAFAF8] p-4">
              <div>
                <p className="text-sm font-bold text-[#1C1917]">حالة الحساب</p>
                <p className="mt-0.5 text-xs text-[#A8A29E]">{selected.is_active?'يمكنه الدخول للوحة الإدارة':'لا يمكنه الدخول حالياً'}</p>
              </div>
              <button onClick={()=>void handleToggle(selected)} className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${selected.is_active?'bg-[#B8860B]':'bg-gray-300'}`}>
                <span className={`inline-block h-5 w-5 translate-y-0.5 rounded-full bg-white shadow transition-transform ${selected.is_active?'translate-x-[-1.375rem]':'translate-x-[-0.125rem]'}`}/>
              </button>
            </div>

            {editing ? (
              <div className="space-y-3">
                <div><label className="mb-1 block text-xs font-bold text-[#A8A29E]">الاسم</label>
                  <input value={editName} onChange={e=>setEditName(e.target.value)} className="w-full rounded-xl border border-[#E5E0D8] bg-[#FAFAF8] px-3 py-2 text-sm outline-none focus:border-[#B8860B]"/>
                </div>
                <div className="flex gap-2">
                  <button onClick={saveName} disabled={saving} className="flex-1 rounded-xl bg-[#B8860B] py-2 text-sm font-bold text-white disabled:opacity-50">{saving?'...':'حفظ'}</button>
                  <button onClick={()=>setEditing(false)} className="rounded-xl border border-[#E5E0D8] px-4 py-2 text-sm font-semibold text-[#57534E]">إلغاء</button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b border-[#F0ECE6] pb-2"><span className="text-[#A8A29E]">الاسم</span><span className="font-semibold text-[#1C1917]">{selected.display_name??'—'}</span></div>
                <div className="flex justify-between border-b border-[#F0ECE6] pb-2"><span className="text-[#A8A29E]">البريد</span><span className="font-semibold text-[#1C1917]" dir="ltr">{selected.email}</span></div>
                <div className="flex justify-between"><span className="text-[#A8A29E]">تاريخ الإنشاء</span><span className="font-semibold text-[#1C1917]">{new Date(selected.created_at).toLocaleDateString('ar-SY')}</span></div>
                <button onClick={()=>setEditing(true)} className="w-full rounded-xl border border-[#B8860B] py-2 text-sm font-bold text-[#B8860B] hover:bg-[#B8860B]/10">✎ تعديل الاسم</button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
