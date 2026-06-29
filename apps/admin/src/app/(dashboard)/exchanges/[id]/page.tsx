'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

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

const STATUS_OPTIONS = ['pending', 'approved', 'rejected', 'completed'];

export default function ExchangeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const t = useTranslations();
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
    if (res.ok) { const u = await res.json() as ExchangeDetail; setExchange(u); setMsg('تم تحديث الحالة بنجاح ✓'); }
    else { setMsg('حدث خطأ أثناء التحديث'); }
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
    if (res.ok) { const u = await res.json() as ExchangeDetail; setExchange(u); setMsg('تم حفظ الملاحظات ✓'); }
    else { setMsg('خطأ في الحفظ'); }
    setSaving(false);
  }

  if (loading)  return <p className="p-8 text-center">جارٍ التحميل…</p>;
  if (!exchange) return <p className="p-8 text-center text-red-500">طلب الاستبدال غير موجود</p>;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/exchanges" className="text-sm text-gray-500 hover:underline">← الاستبدالات</Link>
        <h1 className="text-xl font-bold">تفاصيل طلب الاستبدال</h1>
      </div>

      <div className="bg-white rounded-lg border p-4 space-y-3">
        <div className="flex justify-between">
          <span className="text-gray-500 text-sm">الرقم</span>
          <span className="font-mono text-sm">{exchange.id.slice(0, 8)}…</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500 text-sm">الحالة</span>
          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">{exchange.status}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500 text-sm">السبب (عربي)</span>
          <span className="text-sm">{exchange.reason_ar}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500 text-sm">السبب (إنجليزي)</span>
          <span className="text-sm">{exchange.reason_en}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500 text-sm">تاريخ الطلب</span>
          <span className="text-sm">{new Date(exchange.created_at).toLocaleDateString('ar')}</span>
        </div>
      </div>

      {/* Customer images */}
      {exchange.customer_images && exchange.customer_images.length > 0 && (
        <div className="space-y-2">
          <h2 className="font-semibold text-sm text-gray-700">صور العميل</h2>
          <div className="flex gap-2 flex-wrap">
            {exchange.customer_images.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`صورة ${i + 1}`} className="h-24 w-24 object-cover rounded border" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Status actions */}
      <div className="space-y-2">
        <h2 className="font-semibold text-sm text-gray-700">تغيير الحالة</h2>
        <div className="flex gap-2 flex-wrap">
          {STATUS_OPTIONS.map(s => (
            <button
              key={s}
              disabled={saving || exchange.status === s}
              onClick={() => handleStatus(s)}
              className="px-3 py-1.5 text-sm rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-40"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <h2 className="font-semibold text-sm text-gray-700">ملاحظات الإدارة</h2>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={4}
          className="w-full border rounded px-3 py-2 text-sm resize-none"
          placeholder="أضف ملاحظات هنا…"
        />
        <button
          onClick={saveNotes}
          disabled={saving}
          className="px-4 py-2 bg-primary text-white rounded text-sm disabled:opacity-40"
        >
          حفظ الملاحظات
        </button>
      </div>

      {msg && <p className="text-sm text-center text-green-600">{msg}</p>}
    </div>
  );
}
