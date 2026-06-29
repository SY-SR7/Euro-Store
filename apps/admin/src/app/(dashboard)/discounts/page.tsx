'use client';
import { useEffect, useState } from 'react';

interface Discount {
  id: string; code: string; type: string; value: number;
  min_order_syp?: number|null; valid_from?: string|null; valid_until?: string|null;
  max_uses?: number|null; used_count?: number|null; is_active: boolean;
}

function pickArray<T>(p: unknown): T[] {
  if (Array.isArray(p)) return p as T[];
  if (p && typeof p === 'object') {
    const o = p as Record<string,unknown>;
    for (const k of ['data','items','discounts','rows']) { if (Array.isArray(o[k])) return o[k] as T[]; }
  }
  return [];
}

export default function AdminDiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [code, setCode]           = useState('');
  const [type, setType]           = useState<'percentage'|'fixed'>('percentage');
  const [value, setValue]         = useState('');
  const [minOrder, setMinOrder]   = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [maxUses, setMaxUses]     = useState('');
  const [creating, setCreating]   = useState(false);

  async function fetchDiscounts() {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/discounts', { cache:'no-store' });
      const payload = await res.json().catch(()=>null);
      if (!res.ok) { setError((payload as {error?:string}|null)?.error ?? 'خطأ'); setDiscounts([]); }
      else setDiscounts(pickArray<Discount>(payload));
    } catch { setError('تعذر الاتصال'); setDiscounts([]); }
    finally { setLoading(false); }
  }
  useEffect(() => { void fetchDiscounts(); }, []);

  async function handleCreate() {
    if (!code.trim() || !value) { setError('الكود والقيمة مطلوبان'); return; }
    setError(''); setCreating(true);
    try {
      const res = await fetch('/api/discounts', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ code, type, value:parseFloat(value), min_order_syp:minOrder?parseFloat(minOrder):0, valid_until:validUntil||null, max_uses:maxUses?parseInt(maxUses,10):null }),
      });
      const payload = await res.json().catch(()=>null);
      if (!res.ok) setError((payload as {error?:string}|null)?.error ?? 'فشل الإنشاء');
      else { setCode(''); setValue(''); setMinOrder(''); setValidUntil(''); setMaxUses(''); void fetchDiscounts(); }
    } catch { setError('خطأ في الاتصال'); }
    finally { setCreating(false); }
  }

  async function toggleActive(id: string, current: boolean) {
    await fetch(`/api/discounts/${id}`, {
      method:'PATCH', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ is_active: !current }),
    });
    void fetchDiscounts();
  }

  async function deleteDiscount(id: string) {
    if (!confirm('حذف هذا الكود؟')) return;
    await fetch(`/api/discounts/${id}`, { method:'DELETE' });
    void fetchDiscounts();
  }

  return (
    <div className="space-y-5" dir="rtl">
      <div className="rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-black text-[#1C1917]">الخصومات</h1>
        <p className="mt-1 text-sm text-[#A8A29E]">{discounts.length} كود خصم</p>
      </div>

      <div className="rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-sm">
        <h2 className="mb-4 font-black text-[#B8860B]">إنشاء كود جديد</h2>
        {error && <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <input value={code} onChange={e=>setCode(e.target.value.toUpperCase())} placeholder="CODE *" className="input-field" dir="ltr" />
          <select value={type} onChange={e=>setType(e.target.value as 'percentage'|'fixed')} className="input-field">
            <option value="percentage">نسبة مئوية (%)</option>
            <option value="fixed">مبلغ ثابت (ل.س)</option>
          </select>
          <input value={value} onChange={e=>setValue(e.target.value)} placeholder="القيمة *" type="number" className="input-field" />
          <input value={minOrder} onChange={e=>setMinOrder(e.target.value)} placeholder="الحد الأدنى للطلب (ل.س)" type="number" className="input-field" />
          <input value={validUntil} onChange={e=>setValidUntil(e.target.value)} type="date" className="input-field" />
          <input value={maxUses} onChange={e=>setMaxUses(e.target.value)} placeholder="أقصى استخدام" type="number" className="input-field" />
        </div>
        <button onClick={()=>void handleCreate()} disabled={creating} className="mt-4 rounded-xl bg-[#B8860B] px-6 py-2.5 text-sm font-black text-white hover:bg-[#9A7209] disabled:opacity-50 transition-colors">
          {creating ? 'جاري الإنشاء...' : '+ إنشاء كود'}
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#E5E0D8] bg-white shadow-sm">
        {loading ? <p className="p-10 text-center text-sm text-[#A8A29E]">جاري التحميل...</p>
        : discounts.length === 0 ? <p className="p-10 text-center text-sm text-[#A8A29E]">لا توجد أكواد</p>
        : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[#F8F6F2]">
                <tr>
                  {['الكود','النوع','القيمة','الحد الأدنى','الاستخدام','الصلاحية','الحالة','إجراء'].map((h,i) => (
                    <th key={i} className={`px-4 py-3 text-right text-xs font-black text-[#A8A29E] ${i>=3&&i<=5?'hidden lg:table-cell':''} ${i===7?'text-left':''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0ECE6]">
                {discounts.map(d => (
                  <tr key={d.id} className="hover:bg-[#FAFAF8] transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-[#1C1917]">{d.code}</td>
                    <td className="px-4 py-3 text-[#57534E]">{d.type==='percentage'?'نسبة':'ثابت'}</td>
                    <td className="px-4 py-3 font-semibold text-[#B8860B]">{d.value}{d.type==='percentage'?'%':' ل.س'}</td>
                    <td className="px-4 py-3 text-xs text-[#57534E] hidden lg:table-cell">{d.min_order_syp ? Number(d.min_order_syp).toLocaleString('ar-SY')+' ل.س' : '—'}</td>
                    <td className="px-4 py-3 text-xs text-[#57534E] hidden lg:table-cell">{d.used_count ?? 0}/{d.max_uses ?? '∞'}</td>
                    <td className="px-4 py-3 text-xs text-[#A8A29E] hidden lg:table-cell">{d.valid_until ? new Date(d.valid_until).toLocaleDateString('ar-SY') : 'مفتوح'}</td>
                    <td className="px-4 py-3">
                      <button onClick={()=>void toggleActive(d.id, d.is_active)} className="transition-opacity hover:opacity-70">
                        <span className={d.is_active?'badge-green':'badge-gray'}>{d.is_active?'مفعّل':'معطّل'}</span>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-left">
                      <button onClick={()=>void deleteDiscount(d.id)} className="font-bold text-red-500 hover:underline text-xs">حذف</button>
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