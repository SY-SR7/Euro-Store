'use client';
import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, ClipboardList, Clock, Inbox, PackagePlus, XCircle } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

interface ProductRequest {
  id: string;
  helper_id: string;
  product_name_ar: string;
  product_name_en: string | null;
  description: string | null;
  suggested_category_id: string | null;
  image_urls: string[];
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  created_at: string;
  helper_profiles?: { full_name: string } | null;
}

const STATUS_STYLE = {
  pending:  'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
};
export default function AdminProductRequestsPage() {
  const t = useTranslations('adminProductRequests');
  const locale = useLocale();
  const [requests, setRequests] = useState<ProductRequest[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState<'all' | 'pending'>('pending');
  const [selected, setSelected] = useState<ProductRequest | null>(null);
  const [notes,    setNotes]    = useState('');
  const [acting,   setActing]   = useState(false);
  const [msg,      setMsg]      = useState<{ ok: boolean; text: string } | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/admin/product-requests${filter === 'pending' ? '?status=pending' : ''}`);
      const data = await res.json() as ProductRequest[];
      if (!res.ok) throw new Error('load_failed');
      setRequests(Array.isArray(data) ? data : []);
    } catch {
      setRequests([]);
      setMsg({ ok: false, text: t('loadError') });
    } finally { setLoading(false); }
  }, [filter, t]);

  useEffect(() => { void fetchRequests(); }, [fetchRequests]);

  async function handleDecision(action: 'approve' | 'reject') {
    if (!selected) return;
    if (action === 'reject' && !notes.trim()) { setMsg({ ok: false, text: t('rejectionNoteRequired') }); return; }
    setActing(true); setMsg(null);
    try {
      const res = await fetch('/api/admin/product-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selected.id, action, admin_notes: notes }),
      });
      if (res.ok) {
        setMsg({ ok: true, text: action === 'approve' ? t('approvedMessage') : t('rejectedMessage') });
        setSelected(null); setNotes('');
        await fetchRequests();
      } else {
        setMsg({ ok: false, text: t('actionError') });
      }
    } finally { setActing(false); }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <PackagePlus className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-text-primary">{t('title')}</h1>
        {requests.filter(r => r.status === 'pending').length > 0 && (
          <span className="rounded-full bg-amber-100 text-amber-700 border border-amber-200 px-2.5 py-0.5 text-xs font-bold">
            {t('pendingCount', { count: requests.filter(r => r.status === 'pending').length })}
          </span>
        )}
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(['pending', 'all'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`rounded-xl border px-4 py-2 text-sm font-semibold transition-all ${
              filter === f ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background-card text-text-secondary'
            }`}>
            {f === 'pending' ? <><Clock size={15} /> {t('pending')}</> : <><ClipboardList size={15} /> {t('all')}</>}
          </button>
        ))}
      </div>

      {msg && (
        <div className={`rounded-xl border px-4 py-3 text-sm ${msg.ok ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          {msg.text}
        </div>
      )}

      {loading ? (
        <p className="text-text-muted py-8 text-center">{t('loading')}</p>
      ) : requests.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-16 text-center text-text-muted">
          <Inbox className="mx-auto mb-3 h-10 w-10" />
          <p>{t('empty')}</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {requests.map(req => (
            <div key={req.id}
              className={`rounded-lg border bg-background-card p-5 space-y-3 cursor-pointer hover:border-primary/40 transition-colors ${
                selected?.id === req.id ? 'border-primary ring-2 ring-primary/20' : 'border-border'
              }`}
              onClick={() => { setSelected(req); setNotes(req.admin_notes ?? ''); setMsg(null); }}>
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-text-primary">{req.product_name_ar}</p>
                  {req.product_name_en && <p className="text-sm text-text-muted" dir="ltr">{req.product_name_en}</p>}
                </div>
                <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-bold ${STATUS_STYLE[req.status]}`}>
                  {t(`statuses.${req.status}` as never)}
                </span>
              </div>

              {req.description && (
                <p className="text-sm text-text-secondary line-clamp-2">{req.description}</p>
              )}

              {/* Images */}
              {req.image_urls?.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {req.image_urls.slice(0, 4).map((url, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={i} src={url} alt={req.product_name_ar} className="h-14 w-14 rounded-lg object-cover border border-border" />
                  ))}
                </div>
              )}

              <p className="text-xs text-text-muted">
                {new Date(req.created_at).toLocaleDateString(locale === 'ar' ? 'ar-SY' : 'en-GB')}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Action Panel */}
      {selected && selected.status === 'pending' && (
        <div className="sticky bottom-4 rounded-lg border border-primary/30 bg-background-card p-5 shadow-xl space-y-4">
          <p className="flex items-center gap-2 font-bold text-text-primary"><ClipboardList size={17} /> {t('reviewing', { name: selected.product_name_ar })}</p>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-muted">{t('adminNote')}</label>
            <textarea
              value={notes} onChange={e => setNotes(e.currentTarget.value)}
              rows={2}
              className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text-primary resize-none focus:border-primary focus:outline-none"
              placeholder={t('adminNotePlaceholder')}
            />
          </div>
          <div className="flex gap-3">
            <button onClick={() => { setSelected(null); setMsg(null); }}
              className="rounded-xl border border-border px-4 py-2.5 text-sm text-text-secondary hover:border-primary transition-colors">
              {t('cancel')}
            </button>
            <button onClick={() => void handleDecision('approve')} disabled={acting}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50 transition-colors">
              <CheckCircle2 className="h-4 w-4" />
              {acting ? t('processing') : t('approve')}
            </button>
            <button onClick={() => void handleDecision('reject')} disabled={acting}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50 transition-colors">
              <XCircle className="h-4 w-4" />
              {t('reject')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
