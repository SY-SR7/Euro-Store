/* apps/admin/src/app/(dashboard)/exchanges/[id]/page.tsx */
'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

interface ExchangeDetail {
  id            : string;
  status        : string;
  reason        : string;
  admin_notes   : string | null;
  created_at    : string;
  order_id      : string | null;
  customer_id   : string;
  exchange_images: Array<{ id: string; image_url: string }>;
}

const STATUS_COLORS: Record<string, string> = {
  pending  : 'bg-yellow-900/30 text-yellow-400',
  approved : 'bg-blue-900/30 text-blue-400',
  rejected : 'bg-red-900/30 text-red-400',
  completed: 'bg-green-900/30 text-green-400',
};

const NEXT_STATUSES: Record<string, string[]> = {
  pending  : ['approved', 'rejected'],
  approved : ['completed'],
  rejected : [],
  completed: [],
};

export default function AdminExchangeDetailPage() {
  const t = useTranslations();
  const { id } = useParams<{ id: string }>();

  const [exchange, setExchange] = useState<ExchangeDetail | null>(null);
  const [loading, setLoading]   = useState(true);
  const [saving,  setSaving]    = useState(false);
  const [notes,   setNotes]     = useState('');
  const [msg,     setMsg]       = useState('');

  useEffect(() => {
    if (!id) return;
    fetch(`/api/exchanges/${id}`)
      .then(r => r.json())
      .then((d: ExchangeDetail) => {
        setExchange(d);
        setNotes(d.admin_notes ?? '');
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  async function handleStatus(status: string) {
    if (!exchange) return;
    setSaving(true); setMsg('');
    const res = await fetch(`/api/exchanges/${exchange.id}`, {
      method : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify({ status, admin_notes: notes }),
    });
    if (res.ok) {
      const updated = await res.json() as ExchangeDetail;
      setExchange(updated);
      setMsg('تم تحديث الحالة بنجاح ✓');
    } else {
      setMsg('حدث خطأ أثناء التحديث');
    }
    setSaving(false);
  }

  async function saveNotes() {
    if (!exchange) return;
    setSaving(true); setMsg('');
    const res = await fetch(`/api/exchanges/${exchange.id}`, {
      method : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify({ admin_notes: notes }),
    });
    setMsg(res.ok ? 'تم حفظ الملاحظات ✓' : 'خطأ في الحفظ');
    if (res.ok) {
      const updated = await res.json() as ExchangeDetail;
      setExchange(updated);
    }
    setSaving(false);
  }

  if (loading) return <p className="text-[#9CA3AF] p-8">{t('common.loading')}</p>;
  if (!exchange) return <p className="text-red-400 p-8">طلب الاستبدال غير موجود</p>;

  const nextStatuses = NEXT_STATUSES[exchange.status] ?? [];

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-[#9CA3AF]">
        <Link href="/exchanges" className="hover:text-[#C9A84C]">{t('admin.exchanges')}</Link>
        <span>/</span>
        <span className="text-[#E2E2E2] font-mono text-xs">{exchange.id.slice(0, 8)}…</span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-[#E2E2E2]">تفاصيل الاستبدال</h1>
        <span className={`rounded-sm px-3 py-1 text-sm font-medium ${STATUS_COLORS[exchange.status] ?? 'text-[#9CA3AF]'}`}>
          {t(`admin.exchangeStatus.${exchange.status}`)}
        </span>
      </div>

      {msg && (
        <p className={`rounded-md px-4 py-2 text-sm ${msg.includes('خطأ') ? 'bg-red-900/30 text-red-400' : 'bg-green-900/30 text-green-400'}`}>
          {msg}
        </p>
      )}

      {/* Info card */}
      <div className="rounded-lg border border-[#2E2E2E] bg-[#151515] p-6 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs text-[#9CA3AF]">معرف الطلب</p>
          <p className="mt-1 font-mono text-sm text-[#C9A84C]">{exchange.order_id ?? '—'}</p>
        </div>
        <div>
          <p className="text-xs text-[#9CA3AF]">معرف العميل</p>
          <p className="mt-1 font-mono text-sm text-[#E2E2E2] truncate">{exchange.customer_id}</p>
        </div>
        <div>
          <p className="text-xs text-[#9CA3AF]">التاريخ</p>
          <p className="mt-1 text-sm text-[#E2E2E2]">
            {new Date(exchange.created_at).toLocaleDateString('ar-SY', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div>
          <p className="text-xs text-[#9CA3AF]">الوقت</p>
          <p className="mt-1 text-sm text-[#E2E2E2]" dir="ltr">
            {new Date(exchange.created_at).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>

      {/* Reason */}
      <div className="rounded-lg border border-[#2E2E2E] bg-[#151515] p-5">
        <h2 className="mb-3 text-sm font-semibold text-[#9CA3AF]">{t('exchange.reason')}</h2>
        <p className="text-sm text-[#D6D3C7] leading-7 whitespace-pre-wrap">{exchange.reason}</p>
      </div>

      {/* Attached images */}
      {exchange.exchange_images && exchange.exchange_images.length > 0 && (
        <div className="rounded-lg border border-[#2E2E2E] bg-[#151515] p-5">
          <h2 className="mb-4 text-sm font-semibold text-[#9CA3AF]">الصور المرفقة ({exchange.exchange_images.length})</h2>
          <div className="flex flex-wrap gap-3">
            {exchange.exchange_images.map(img => (
              <a key={img.id} href={img.image_url} target="_blank" rel="noreferrer">
                <img
                  src={img.image_url}
                  alt=""
                  className="h-24 w-24 rounded-md object-cover border border-[#2E2E2E] hover:border-[#C9A84C] transition-colors"
                />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Admin notes */}
      <div className="rounded-lg border border-[#2E2E2E] bg-[#151515] p-5">
        <h2 className="mb-3 text-sm font-semibold text-[#9CA3AF]">ملاحظات الإدارة</h2>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={4}
          placeholder="أضف ملاحظات داخلية حول هذا الطلب..."
          className="input-admin w-full resize-y"
        />
        <button
          onClick={() => void saveNotes()}
          disabled={saving}
          className="mt-3 rounded-md border border-[#2E2E2E] px-4 py-2 text-sm text-[#E2E2E2] hover:border-[#C9A84C] transition-colors disabled:opacity-50"
        >
          {saving ? t('common.loading') : t('common.save')}
        </button>
      </div>

      {/* Status actions */}
      {nextStatuses.length > 0 && (
        <div className="rounded-lg border border-[#2E2E2E] bg-[#151515] p-5">
          <h2 className="mb-4 text-sm font-semibold text-[#9CA3AF]">تغيير الحالة</h2>
          <div className="flex gap-3 flex-wrap">
            {nextStatuses.map(s => (
              <button
                key={s}
                onClick={() => void handleStatus(s)}
                disabled={saving}
                className={`rounded-md px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 ${
                  s === 'rejected'
                    ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50 border border-red-800'
                    : s === 'approved'
                    ? 'bg-blue-900/30 text-blue-400 hover:bg-blue-900/50 border border-blue-800'
                    : 'bg-green-900/30 text-green-400 hover:bg-green-900/50 border border-green-800'
                }`}
              >
                {saving ? t('common.loading') : t(`admin.exchangeStatus.${s}`)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}