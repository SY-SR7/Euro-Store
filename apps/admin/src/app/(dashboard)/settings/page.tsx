'use client';
import { useEffect, useMemo, useState } from 'react';
import SettingsQuickAdmin from './SettingsQuickAdmin';

export default SettingsQuickAdmin;

interface Setting { key: string; value: string; description?: string|null; }

const DEFAULT_SETTINGS: Setting[] = [
  { key:'usd_exchange_rate',      value:'15000', description:'سعر صرف الدولار مقابل الليرة السورية' },
  { key:'max_exchange_days',      value:'7',     description:'أقصى عدد أيام لطلب الاستبدال بعد التسليم' },
  { key:'loyalty_earn_amount_syp',value:'10000', description:'المبلغ المطلوب لكسب نقاط الولاء (ل.س)' },
  { key:'loyalty_earn_points',    value:'1',     description:'عدد النقاط المكتسبة عند تحقق مبلغ الكسب' },
  { key:'loyalty_max_redeem_percent', value:'20', description:'أقصى نسبة من الطلب يمكن دفعها بالنقاط (%)' },
  { key:'referral_bonus_points',  value:'50',    description:'نقاط مكافأة الإحالة' },
];

function pickArray<T>(p: unknown): T[] {
  if (Array.isArray(p)) return p as T[];
  if (p && typeof p === 'object') {
    const o = p as Record<string,unknown>;
    for (const k of ['data','items','settings','rows']) { if (Array.isArray(o[k])) return o[k] as T[]; }
  }
  return [];
}

function LegacyAdminSettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState('');
  const [error, setError]       = useState('');
  const [drafts, setDrafts]     = useState<Record<string,string>>({});

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/settings', { cache:'no-store' });
      const d = await res.json().catch(()=>null);
      const rows = pickArray<Setting>(d);
      const merged = DEFAULT_SETTINGS.map(def => ({
        ...def,
        value: rows.find(r => r.key === def.key)?.value ?? def.value,
        description: rows.find(r => r.key === def.key)?.description ?? def.description,
      }));
      setSettings(merged);
      setDrafts(Object.fromEntries(merged.map(s => [s.key, s.value])));
    } catch { setError('تعذر تحميل الإعدادات'); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  async function handleSave() {
    setSaving(true); setMsg(''); setError('');
    const changes = settings.filter(s => drafts[s.key] !== undefined && drafts[s.key] !== s.value);
    if (changes.length === 0) { setMsg('لا يوجد تغييرات لحفظها'); setSaving(false); return; }
    try {
      const body = settings.map(s => ({ key: s.key, value: drafts[s.key] ?? s.value }));
      const res = await fetch('/api/settings', {
        method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body),
      });
      if (res.ok) { setMsg('تم حفظ الإعدادات بنجاح'); void load(); }
      else { const d = await res.json().catch(()=>null); setError((d as {error?:string}|null)?.error ?? 'فشل الحفظ'); }
    } catch { setError('تعذر الاتصال'); }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-5" dir="rtl">
      <div className="flex flex-col gap-4 rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-sm sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#1C1917]">إعدادات النظام</h1>
          <p className="mt-1 text-sm text-[#A8A29E]">الإعدادات العامة للمتجر</p>
        </div>
        <button onClick={()=>void handleSave()} disabled={saving || loading} className="rounded-xl bg-[#B8860B] px-5 py-2.5 text-sm font-black text-[#1F1B16] hover:bg-[#9A7209] disabled:opacity-50 transition-colors">
          {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
        </button>
      </div>

      {msg && <div className="rounded-xl border border-green-200 bg-green-50 px-5 py-3 text-sm font-semibold text-green-700">{msg}</div>}
      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700">{error}</div>}

      {loading ? <p className="rounded-2xl border border-[#E5E0D8] bg-white p-10 text-center text-sm text-[#A8A29E] shadow-sm">جاري التحميل...</p>
      : (
        <div className="rounded-2xl border border-[#E5E0D8] bg-white divide-y divide-[#F0ECE6] shadow-sm">
          {settings.map(s => (
            <div key={s.key} className="flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:gap-5">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[#1C1917] text-sm">{s.description ?? s.key}</p>
                <p className="mt-0.5 font-mono text-xs text-[#A8A29E]">{s.key}</p>
              </div>
              <input
                type="text"
                value={drafts[s.key] ?? s.value}
                onChange={e => setDrafts(d => ({ ...d, [s.key]: e.target.value }))}
                className="input-field sm:w-48"
                dir="ltr"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
