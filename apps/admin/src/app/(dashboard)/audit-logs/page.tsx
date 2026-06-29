'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

type ActivityLog = {
  id: string;
  admin_email?: string;
  action?: string;
  action_ar?: string;
  entity_type?: string;
  entity_label?: string;
  entity_id?: string;
  summary?: string;
  method?: string;
  path?: string;
  status_code?: number;
  ok?: boolean;
  request_body?: unknown;
  old_values?: unknown;
  new_values?: unknown;
  undo?: { possible?: boolean; reason?: string };
  undone_at?: string;
  undo_status?: number;
  created_at?: string;
  ip?: string;
  source?: string;
  user_agent?: string;
};

type FilterKey = 'all' | 'undo' | 'create' | 'update' | 'delete' | 'status' | 'visibility';

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function pickLogs(payload: unknown): ActivityLog[] {
  if (Array.isArray(payload)) return payload as ActivityLog[];

  if (isObject(payload)) {
    for (const key of ['logs', 'data', 'items', 'audit_logs']) {
      const value = payload[key];
      if (Array.isArray(value)) return value as ActivityLog[];
    }
  }

  return [];
}

function pretty(value: unknown): string {
  if (value === undefined || value === null || value === '') return 'لا توجد بيانات';

  if (typeof value === 'string') {
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function formatDate(value?: string) {
  if (!value) return 'غير محدد';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('ar-SY', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function relativeTime(value?: string) {
  if (!value) return 'غير محدد';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const diff = Date.now() - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (Math.abs(diff) < minute) return 'الآن';
  if (Math.abs(diff) < hour) return `منذ ${Math.max(1, Math.round(Math.abs(diff) / minute))} دقيقة`;
  if (Math.abs(diff) < day) return `منذ ${Math.max(1, Math.round(Math.abs(diff) / hour))} ساعة`;
  return `منذ ${Math.max(1, Math.round(Math.abs(diff) / day))} يوم`;
}

function actionColor(log: ActivityLog): string {
  const action = String(log.action || '').toLowerCase();

  if (action === 'undo') return 'border-blue-200 bg-blue-50 text-blue-700';
  if (action.includes('delete') || action.includes('cancel') || action.includes('reject')) return 'border-red-200 bg-red-50 text-red-700';
  if (action.includes('create') || action.includes('activate') || action.includes('show')) return 'border-green-200 bg-green-50 text-green-700';
  if (action.includes('status') || action.includes('confirm') || action.includes('approve')) return 'border-amber-200 bg-amber-50 text-amber-800';
  return 'border-[#E5E0D8] bg-[#F8F6F2] text-[#57534E]';
}

function actionIcon(log: ActivityLog): string {
  const action = String(log.action || '').toLowerCase();

  if (action === 'undo') return '↩';
  if (action.includes('delete')) return '🗑';
  if (action.includes('create')) return '+';
  if (action.includes('hide') || action.includes('deactivate')) return '🙈';
  if (action.includes('show') || action.includes('activate')) return '👁';
  if (action.includes('status') || action.includes('confirm')) return '✓';
  return '✎';
}

function matchesFilter(log: ActivityLog, filter: FilterKey) {
  const action = String(log.action || '').toLowerCase();

  if (filter === 'all') return true;
  if (filter === 'undo') return action === 'undo';
  if (filter === 'create') return action.includes('create');
  if (filter === 'update') return action.includes('update') || action.includes('replace');
  if (filter === 'delete') return action.includes('delete');
  if (filter === 'status') return action.includes('status') || action.includes('confirm') || action.includes('approve') || action.includes('reject');
  if (filter === 'visibility') return action.includes('hide') || action.includes('show') || action.includes('activate') || action.includes('deactivate');

  return true;
}

function contains(log: ActivityLog, query: string) {
  if (!query.trim()) return true;

  const text = [
    log.admin_email,
    log.action,
    log.action_ar,
    log.entity_type,
    log.entity_label,
    log.entity_id,
    log.summary,
    log.path,
    log.method,
    log.status_code,
  ].join(' ').toLowerCase();

  return text.includes(query.trim().toLowerCase());
}

function DetailBlock({ title, value }: { title: string; value: unknown }) {
  return (
    <div className="rounded-2xl border border-[#E5E0D8] bg-[#121414] p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h4 className="text-sm font-black text-[#E8D28A]">{title}</h4>
      </div>
      <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words text-left text-xs leading-6 text-green-200" dir="ltr">
        {pretty(value)}
      </pre>
    </div>
  );
}

export default function AdminActivityLogPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [undoingId, setUndoingId] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/audit-logs?limit=500', { cache: 'no-store' });
      const payload = await response.json().catch(() => null);
      setLogs(pickLogs(payload));
    } catch {
      setMessage('تعذر تحميل سجل النشاط حالياً');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => matchesFilter(log, filter)).filter((log) => contains(log, query));
  }, [filter, logs, query]);

  const stats = useMemo(() => {
    const today = new Date();
    const todayCount = logs.filter((log) => {
      if (!log.created_at) return false;
      const date = new Date(log.created_at);
      return (
        date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth() &&
        date.getDate() === today.getDate()
      );
    }).length;

    return {
      total: logs.length,
      today: todayCount,
      undoable: logs.filter((log) => log.undo?.possible && !log.undone_at).length,
      admins: new Set(logs.map((log) => log.admin_email).filter(Boolean)).size,
    };
  }, [logs]);

  async function handleUndo(log: ActivityLog) {
    if (!log.id) return;

    setUndoingId(log.id);
    setMessage('');

    try {
      const response = await fetch(`/api/audit-logs/${encodeURIComponent(log.id)}/undo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.ok) {
        setMessage(payload?.error || 'فشل تنفيذ التراجع. قد تكون واجهة API الأصلية لا تدعم الرجوع لهذه الحركة.');
      } else {
        setMessage('تم تنفيذ التراجع وتسجيله في سجل النشاط.');
        await load();
      }
    } catch {
      setMessage('فشل الاتصال بخدمة التراجع.');
    } finally {
      setUndoingId('');
    }
  }

  const filters: { key: FilterKey; label: string }[] = [
    { key: 'all', label: 'الكل' },
    { key: 'create', label: 'إنشاء' },
    { key: 'update', label: 'تعديل' },
    { key: 'delete', label: 'حذف' },
    { key: 'status', label: 'تأكيد/حالة' },
    { key: 'visibility', label: 'إظهار/إخفاء/تفعيل' },
    { key: 'undo', label: 'تراجع' },
  ];

  return (
    <div className="space-y-6" dir="rtl">
      <section className="relative overflow-hidden rounded-[2rem] border border-[#E5E0D8] bg-[#121414] p-6 text-white shadow-sm">
        <div className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full bg-[#B8860B]/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-20 h-60 w-60 rounded-full bg-[#E8D28A]/20 blur-3xl" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.35em] text-[#E8D28A]">EuroStore Admin</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-white md:text-4xl">سجل النشاط</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#D0C5B2]">
              كل حركة تتم من واجهة الآدمن يتم تسجيلها هنا مع إيميل المشرف، نوع العملية، المسار، القيم القديمة، القيم الجديدة، وزر تراجع عند توفر تراجع آمن.
            </p>
          </div>

          <button
            onClick={() => void load()}
            disabled={loading}
            className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-[#1C1917] shadow-lg shadow-black/10 transition hover:bg-[#E8D28A] disabled:opacity-60"
          >
            {loading ? 'جارٍ التحديث...' : 'تحديث السجل ↻'}
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ['إجمالي الحركات', stats.total, 'كل ما تم تسجيله'],
          ['حركات اليوم', stats.today, 'النشاطات خلال اليوم'],
          ['قابلة للتراجع', stats.undoable, 'حركات فيها زر تراجع'],
          ['مشرفون', stats.admins, 'إيميلات مسجلة'],
        ].map(([label, value, desc]) => (
          <div key={label} className="rounded-3xl border border-[#E5E0D8] bg-white p-5 shadow-sm">
            <div className="text-sm font-black text-[#1C1917]">{label}</div>
            <div className="mt-4 text-3xl font-black text-[#B8860B]">{Number(value).toLocaleString('ar-SY')}</div>
            <p className="mt-1 text-xs text-[#A8A29E]">{desc}</p>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-[#E5E0D8] bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {filters.map((item) => (
              <button
                key={item.key}
                onClick={() => setFilter(item.key)}
                className={[
                  'whitespace-nowrap rounded-2xl border px-4 py-2 text-xs font-black transition',
                  filter === item.key
                    ? 'border-[#B8860B] bg-[#B8860B] text-white'
                    : 'border-[#E5E0D8] bg-[#FAFAF8] text-[#57534E] hover:border-[#B8860B]',
                ].join(' ')}
              >
                {item.label}
              </button>
            ))}
          </div>

          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="بحث بالإيميل، العملية، المعرّف، المسار..."
            className="w-full rounded-2xl border border-[#E5E0D8] bg-[#FAFAF8] px-4 py-2.5 text-sm outline-none transition focus:border-[#B8860B] xl:w-96"
          />
        </div>
      </section>

      {message && (
        <div
          className={[
            'rounded-2xl border px-4 py-3 text-sm font-bold',
            message.includes('تم ')
              ? 'border-green-200 bg-green-50 text-green-700'
              : 'border-red-200 bg-red-50 text-red-700',
          ].join(' ')}
        >
          {message}
        </div>
      )}

      <section className="space-y-3">
        {loading ? (
          <div className="grid min-h-[320px] place-items-center rounded-3xl border border-[#E5E0D8] bg-white p-10 text-center shadow-sm">
            <div>
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[#E5E0D8] border-t-[#B8860B]" />
              <p className="mt-4 text-sm font-bold text-[#57534E]">جارٍ تحميل سجل النشاط...</p>
            </div>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="grid min-h-[320px] place-items-center rounded-3xl border border-[#E5E0D8] bg-white p-10 text-center shadow-sm">
            <div>
              <div className="mx-auto grid h-20 w-20 place-items-center rounded-[2rem] bg-[#F8F6F2] text-4xl">🧾</div>
              <h3 className="mt-5 text-xl font-black text-[#1C1917]">لا توجد حركات مطابقة</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-[#78716C]">
                نفّذ أي عملية من لوحة الآدمن مثل تعديل، حذف، تفعيل، إخفاء، تأكيد طلب، ثم ارجع هنا وستظهر كبطاقة عريضة.
              </p>
            </div>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const open = openId === log.id;
            const canUndo = log.undo?.possible === true && !log.undone_at;
            const disabledUndo = !canUndo || undoingId === log.id;

            return (
              <article
                key={log.id}
                className="overflow-hidden rounded-3xl border border-[#E5E0D8] bg-white shadow-sm transition hover:border-[#B8860B]"
              >
                <button
                  onClick={() => setOpenId((current) => (current === log.id ? '' : log.id))}
                  className="flex w-full flex-col gap-4 p-5 text-right lg:flex-row lg:items-center"
                >
                  <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl border text-lg font-black ${actionColor(log)}`}>
                    {actionIcon(log)}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-lg font-black text-[#1C1917]">
                        {log.action_ar || log.action || 'حركة'}
                      </span>
                      <span className={`rounded-full border px-3 py-1 text-[11px] font-black ${actionColor(log)}`}>
                        {log.entity_label || log.entity_type || 'غير محدد'}
                      </span>
                      <span className="rounded-full border border-[#E5E0D8] bg-[#FAFAF8] px-3 py-1 text-[11px] font-bold text-[#57534E]">
                        {log.method || 'UI'}
                      </span>
                      {log.undone_at && (
                        <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-black text-blue-700">
                          تم التراجع
                        </span>
                      )}
                    </span>

                    <span className="mt-1 block text-sm leading-7 text-[#57534E]">
                      {log.summary || `${log.action_ar || log.action || 'حركة'} — ${log.path || ''}`}
                    </span>

                    <span className="mt-2 flex flex-wrap gap-2 text-xs text-[#A8A29E]">
                      <span>المشرف: <b className="text-[#1C1917]" dir="ltr">{log.admin_email || 'unknown-admin@local'}</b></span>
                      <span>•</span>
                      <span>{formatDate(log.created_at)}</span>
                      <span>•</span>
                      <span>{relativeTime(log.created_at)}</span>
                    </span>
                  </span>

                  <span className="flex items-center gap-3 self-start lg:self-center">
                    <span className="rounded-2xl border border-[#E5E0D8] px-4 py-2 text-xs font-black text-[#57534E]">
                      {open ? 'طي التفاصيل ↑' : 'عرض التفاصيل ↓'}
                    </span>
                  </span>
                </button>

                {open && (
                  <div className="border-t border-[#F0ECE6] bg-[#FAFAF8] p-5">
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      {[
                        ['الإيميل', log.admin_email || 'unknown-admin@local'],
                        ['العملية', log.action_ar || log.action || 'حركة'],
                        ['القسم', log.entity_label || log.entity_type || 'غير محدد'],
                        ['المعرّف', log.entity_id || 'غير محدد'],
                        ['المسار', log.path || 'غير محدد'],
                        ['الطريقة', log.method || 'غير محدد'],
                        ['النتيجة', String(log.status_code ?? 'غير محدد')],
                        ['IP', log.ip || 'غير محدد'],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-2xl border border-[#E5E0D8] bg-white p-4">
                          <div className="text-xs font-bold text-[#A8A29E]">{label}</div>
                          <div className="mt-1 break-words text-sm font-black text-[#1C1917]" dir="auto">{value}</div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 grid gap-4 xl:grid-cols-3">
                      <DetailBlock title="البيانات المرسلة" value={log.request_body} />
                      <DetailBlock title="القيم القديمة" value={log.old_values} />
                      <DetailBlock title="القيم الجديدة" value={log.new_values} />
                    </div>

                    <div className="mt-5 rounded-2xl border border-[#E5E0D8] bg-white p-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <h4 className="font-black text-[#1C1917]">التراجع عن الحركة</h4>
                          <p className="mt-1 text-xs leading-6 text-[#78716C]">
                            {log.undone_at
                              ? `تم التراجع بتاريخ ${formatDate(log.undone_at)}`
                              : canUndo
                                ? log.undo?.reason || 'يمكن تنفيذ تراجع تلقائي لهذه الحركة.'
                                : log.undo?.reason || 'لا يوجد تراجع تلقائي آمن لهذه الحركة.'}
                          </p>
                        </div>

                        <button
                          onClick={() => void handleUndo(log)}
                          disabled={disabledUndo}
                          className={[
                            'rounded-2xl px-5 py-3 text-sm font-black transition',
                            canUndo
                              ? 'bg-[#B8860B] text-white hover:bg-[#9A7209]'
                              : 'cursor-not-allowed bg-[#E5E0D8] text-[#A8A29E]',
                          ].join(' ')}
                        >
                          {undoingId === log.id ? 'جارٍ التراجع...' : log.undone_at ? 'تم التراجع' : 'تراجع'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </article>
            );
          })
        )}
      </section>
    </div>
  );
}