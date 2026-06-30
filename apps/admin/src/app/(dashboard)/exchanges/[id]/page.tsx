'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface ExchangeDetail {
  id: string;
  order_id: string | null;
  customer_id: string | null;
  status: string;
  reason_ar: string;
  reason_en: string;
  notes: string | null;
  customer_images: string[] | null;
  created_at: string;
  updated_at: string;
}

const STATUS_OPTIONS = ['pending', 'approved', 'rejected', 'completed'] as const;
const STATUS_AR: Record<string,string> = {
  pending: 'قيد الانتظار', approved: 'تمت الموافقة',
  rejected: 'مرفوض', completed: 'مكتمل',
};
const STATUS_COLOR: Record<string,string> = {
  pending:   'bg-amber-50 text-amber-700 border-amber-200',
  approved:  'bg-blue-50 text-blue-700 border-blue-200',
  rejected:  'bg-red-50 text-red-700 border-red-200',
  completed: 'bg-green-50 text-green-700 border-green-200',
};

export default function ExchangeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [exchange, setExchange] = useState<ExchangeDetail | null>(null);
  const [notes,    setNotes]    = useState('');
  const [saving,   setSaving]   = useState(false);
  const [loading,  setLoading]  = useState(true);
  const [msg,      setMsg]      = useState('');

  useEffect(() => {
    if (!id) return;
    fetch(`/api/exchanges/${id}`)
      .then(r => r.json())
      .then((d: ExchangeDetail) => { setExchange(d); setNotes(d.notes ?? ''); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  async function handleStatus(status: string) {
    if (!exchange) return;
    setSaving(true); setMsg('');
    const res = await fetch(`/api/exchanges/${id}`, {
      method : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify({ status, notes }),
    });
    if (res.ok) { const u = await res.json() as ExchangeDetail; setExchange(u); setMsg('✓ تم تحديث الحالة'); }
    else { setMsg('✗ حدث خطأ أثناء التحديث'); }
    setSaving(false);
  }

  async function saveNotes() {
    if (!exchange) return;
    setSaving(true); setMsg('');
    const res = await fetch(`/api/exchanges/${id}`, {
      method : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify({ notes }),
    });
    if (res.ok) { const u = await res.json() as ExchangeDetail; setExchange(u); setMsg('✓ تم حفظ الملاحظات'); }
    else { setMsg('✗ خطأ في الحفظ'); }
    setSaving(false);
  }

  if (loading) return <p className="p-10 text-center text-sm text-[#A8A29E]">جارٍ التحميل...</p>;
  if (!exchange) return <p className="p-10 text-center text-sm text-red-600">طلب الاستبدال غير موجود</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-5" dir="rtl">
      <div className="flex items-center gap-3 rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-sm">
        <Link href="/exchanges" className="text-sm font-semibold text-[#A8A29E] hover:text-[#B8860B]">← طلبات الاستبدال</Link>
        <h1 className="text-lg font-black text-[#1C1917]">تفاصيل طلب الاستبدال</h1>
      </div>

      {msg && <div className={`rounded-xl px-4 py-2 text-sm ${msg.startsWith('✓')?'bg-green-50 text-green-700 border border-green-200':'bg-red-50 text-red-700 border border-red-200'}`}>{msg}</div>}

      <div className="space-y-3 rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-sm text-sm">
        <div className="flex justify-between border-b border-[#F0ECE6] pb-2"><span className="text-[#A8A29E]">الرقم</span><span className="font-mono text-xs font-semibold text-[#1C1917]">{exchange.id.slice(0,8)}…</span></div>
        <div className="flex justify-between border-b border-[#F0ECE6] pb-2"><span className="text-[#A8A29E]">الحالة</span><span className={`rounded-full border px-3 py-1 text-xs font-bold ${STATUS_COLOR[exchange.status]??''}`}>{STATUS_AR[exchange.status]??exchange.status}</span></div>
        <div className="flex justify-between border-b border-[#F0ECE6] pb-2"><span className="text-[#A8A29E]">السبب (عربي)</span><span className="font-semibold text-[#1C1917]">{exchange.reason_ar}</span></div>
        <div className="flex justify-between border-b border-[#F0ECE6] pb-2"><span className="text-[#A8A29E]">السبب (إنجليزي)</span><span className="font-semibold text-[#1C1917]" dir="ltr">{exchange.reason_en}</span></div>
        <div className="flex justify-between"><span className="text-[#A8A29E]">تاريخ الطلب</span><span className="font-semibold text-[#1C1917]">{new Date(exchange.created_at).toLocaleDateString('ar-SY')}</span></div>
      </div>

      {exchange.customer_images && exchange.customer_images.length > 0 && (
        <div className="rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-black text-[#1C1917]">صور العميل</h2>
          <div className="flex flex-wrap gap-2">
            {exchange.customer_images.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`صورة ${i + 1}`} className="h-24 w-24 rounded-xl border border-[#E5E0D8] object-cover" />
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-black text-[#1C1917]">تغيير الحالة</h2>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map(s => (
            <button
              key={s}
              disabled={saving || exchange.status === s}
              onClick={() => handleStatus(s)}
              className={`rounded-xl border px-4 py-2 text-sm font-bold transition-colors disabled:opacity-40 ${exchange.status===s?'border-[#B8860B] bg-[#B8860B] text-white':'border-[#E5E0D8] text-[#57534E] hover:border-[#B8860B] hover:text-[#B8860B]'}`}
            >
              {STATUS_AR[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-black text-[#1C1917]">ملاحظات الإدارة</h2>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={4}
          className="w-full rounded-xl border border-[#E5E0D8] bg-[#FAFAF8] px-3 py-2 text-sm outline-none focus:border-[#B8860B] resize-none"
          placeholder="أضف ملاحظات هنا…"
        />
        <button
          onClick={saveNotes}
          disabled={saving}
          className="mt-3 rounded-xl bg-[#B8860B] px-5 py-2 text-sm font-bold text-white disabled:opacity-50 hover:bg-[#9A7209]"
        >
          حفظ الملاحظات
        </button>
      </div>
    </div>
  );
}
