'use client';
import { useState, useCallback } from 'react';
import {
  BarChart3, Download, RefreshCw, Banknote, PackageCheck, Users, Boxes,
  Star, Repeat2, Tags, Share2, Search, Inbox, LineChart,
  type LucideIcon,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

// ─── Types ──────────────────────────────────────────────────
type ReportType = 'sales' | 'orders' | 'customers' | 'inventory' | 'loyalty' | 'exchange' | 'discounts' | 'referral' | 'search';

interface ReportMeta {
  id: ReportType;
  icon: LucideIcon;
}

interface ReportResult {
  rows: Record<string, unknown>[];
  summary: Record<string, unknown>;
}

// ─── Config ──────────────────────────────────────────────────
const REPORTS: ReportMeta[] = [
  { id: 'sales', icon: Banknote }, { id: 'orders', icon: PackageCheck },
  { id: 'customers', icon: Users }, { id: 'inventory', icon: Boxes },
  { id: 'loyalty', icon: Star }, { id: 'exchange', icon: Repeat2 },
  { id: 'discounts', icon: Tags }, { id: 'referral', icon: Share2 },
  { id: 'search', icon: Search },
];

// ─── Helpers ─────────────────────────────────────────────────
function fmtCurrency(v: unknown, locale: string, suffix: string) {
  const n = Number(v);
  if (isNaN(n)) return '—';
  return `${n.toLocaleString(locale === 'ar' ? 'ar-SY' : 'en-GB')} ${suffix}`;
}
function fmtNum(v: unknown, locale: string) {
  const n = Number(v);
  return isNaN(n) ? '—' : n.toLocaleString(locale === 'ar' ? 'ar-SY' : 'en-GB');
}
function fmtDate(v: unknown, locale: string) {
  if (!v) return '—';
  try { return new Date(v as string).toLocaleDateString(locale === 'ar' ? 'ar-SY' : 'en-GB'); } catch { return String(v); }
}

// ─── Column definitions per report type ──────────────────────
function getColumns(
  type: ReportType,
  label: (key: string) => string,
  locale: string,
  currencySuffix: string,
): { key: string; label: string; fmt?: (v: unknown) => string }[] {
  const number = (value: unknown) => fmtNum(value, locale);
  const currency = (value: unknown) => fmtCurrency(value, locale, currencySuffix);
  const date = (value: unknown) => fmtDate(value, locale);
  switch (type) {
    case 'sales':
      return [
        { key: 'sale_date', label: label('date'), fmt: date },
        { key: 'product', label: label('product') }, { key: 'category', label: label('category') },
        { key: 'brand', label: label('brand') }, { key: 'units', label: label('units'), fmt: number },
        { key: 'revenue', label: label('revenue'), fmt: currency },
      ];
    case 'orders':
      return [
        { key: 'status', label: label('status') }, { key: 'governorate', label: label('governorate') },
        { key: 'payment_method', label: label('payment') }, { key: 'order_count', label: label('orderCount'), fmt: number },
        { key: 'revenue', label: label('revenue'), fmt: currency },
      ];
    case 'customers':
      return [
        { key: 'customer_type', label: label('customerType') },
        { key: 'acquisition_source', label: label('acquisitionSource') },
        { key: 'customer_count', label: label('count'), fmt: number },
      ];
    case 'inventory':
      return [
        { key: 'sku', label: 'SKU' }, { key: 'product', label: label('product') },
        { key: 'stock_quantity', label: label('quantity'), fmt: number },
        { key: 'low_stock_threshold', label: label('lowStockThreshold'), fmt: number },
        { key: 'is_low_stock', label: label('lowStock'), fmt: (v) => v ? label('yes') : label('no') },
      ];
    case 'loyalty':
      return [
        { key: 'balance_band', label: label('balanceBand') },
        { key: 'customer_count', label: label('customers'), fmt: number },
        { key: 'points_balance', label: label('pointsBalance'), fmt: number },
      ];
    case 'exchange':
      return [
        { key: 'status', label: label('status') },
        { key: 'resolution_path', label: label('resolutionPath') },
        { key: 'request_count', label: label('requests'), fmt: number },
        { key: 'average_resolution_hours', label: label('averageResolutionHours'), fmt: number },
      ];
    case 'discounts':
      return [
        { key: 'code', label: label('code') }, { key: 'customer_type', label: label('customerType') },
        { key: 'usage_count', label: label('usage'), fmt: number },
        { key: 'attributed_revenue', label: label('attributedRevenue'), fmt: currency },
        { key: 'discount_amount', label: label('discountAmount'), fmt: currency },
      ];
    case 'referral':
      return [
        { key: 'status', label: label('status') },
        { key: 'referral_count', label: label('referrals'), fmt: number },
        { key: 'points_paid_out', label: label('pointsPaidOut'), fmt: number },
      ];
    case 'search':
      return [
        { key: 'search_date', label: label('date'), fmt: date },
        { key: 'search_query', label: label('searchQuery') },
        { key: 'search_count', label: label('searchCount'), fmt: number },
        { key: 'average_results', label: label('averageResults'), fmt: number },
        { key: 'zero_result_count', label: label('zeroResults'), fmt: number },
      ];
    default:
      return [];
  }
}

// ─── Summary Cards ────────────────────────────────────────────
function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background p-4 text-center space-y-1">
      <p className="text-xs text-text-muted">{label}</p>
      <p className="text-2xl font-black text-primary">{value}</p>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────
export default function AdminReportsPage() {
  const t = useTranslations('adminReports');
  const locale = useLocale();
  const [activeType, setActiveType] = useState<ReportType>('sales');
  const [from,   setFrom]   = useState(() => new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]);
  const [to,     setTo]     = useState(() => new Date().toISOString().split('T')[0]);
  const [data,   setData]   = useState<ReportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]  = useState('');

  const fetchReport = useCallback(async (type: ReportType, startDate: string, endDate: string) => {
    setLoading(true); setError(''); setData(null);
    try {
      const res  = await fetch(`/api/reports?type=${type}&from=${startDate}&to=${endDate}`);
      const json = await res.json() as ReportResult & { error?: string };
      if (!res.ok) { setError(t('loadError')); return; }
      setData(json);
    } catch {
      setError(t('connectionError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  function handleRun() { void fetchReport(activeType, from, to); }

  function exportReport(format: 'csv' | 'xlsx' | 'pdf') {
    const url = `/api/reports?type=${activeType}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&format=${format}`;
    window.location.assign(url);
  }

  const columns = getColumns(activeType, (key) => t(`columns.${key}` as never), locale, t('currencySuffix'));
  const meta    = REPORTS.find(r => r.id === activeType)!;

  // Summary items
  const summaryItems: { label: string; value: string }[] = data?.summary
    ? Object.entries(data.summary)
        .filter(([k]) => typeof data.summary[k] !== 'object')
        .map(([k, v]) => ({
          label: ['count', 'total_revenue', 'total_earned', 'total_redeemed', 'transactions', 'low_stock_count'].includes(k)
            ? t(`summary.${k}` as never) : k,
          value: k.includes('revenue') || k.includes('amount') ? fmtCurrency(v, locale, t('currencySuffix')) : fmtNum(v, locale),
        }))
    : [];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <BarChart3 className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-text-primary">{t('title')}</h1>
      </div>

      {/* Report Type Tabs */}
      <div className="flex flex-wrap gap-2">
        {REPORTS.map(r => (
          <button
            key={r.id}
            onClick={() => { setActiveType(r.id); setData(null); }}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-all ${
              activeType === r.id
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-background-card text-text-secondary hover:border-primary/50'
            }`}
          >
            <r.icon size={16} /> {t(`types.${r.id}.label` as never)}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4 rounded-lg border border-border bg-background-card p-5">
        <div className="flex flex-col gap-1.5 min-w-[160px]">
          <label className="text-xs font-semibold text-text-muted">{t('fromDate')}</label>
          <input aria-label={t('fromDate')} type="date" value={from} onChange={e => setFrom(e.currentTarget.value)}
            className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text-primary focus:border-primary focus:outline-none" />
        </div>
        <div className="flex flex-col gap-1.5 min-w-[160px]">
          <label className="text-xs font-semibold text-text-muted">{t('toDate')}</label>
          <input aria-label={t('toDate')} type="date" value={to} onChange={e => setTo(e.currentTarget.value)}
            className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text-primary focus:border-primary focus:outline-none" />
        </div>
        <div className="flex gap-2 flex-1 flex-wrap justify-end">
          <button onClick={handleRun} disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-[#1F1B16] hover:bg-primary/90 disabled:opacity-50 transition-colors">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? t('running') : t('runReport')}
          </button>
          {data?.rows.length ? (
            <>
              <button onClick={() => exportReport('csv')}
                className="flex items-center gap-2 rounded-xl border border-border bg-background-card px-4 py-2.5 text-sm font-bold text-text-secondary hover:border-primary hover:text-primary transition-colors">
                <Download className="h-4 w-4" /> CSV
              </button>
              <button onClick={() => exportReport('xlsx')}
                className="flex items-center gap-2 rounded-xl border border-border bg-background-card px-4 py-2.5 text-sm font-bold text-text-secondary hover:border-green-500 hover:text-green-500 transition-colors">
                <Download className="h-4 w-4" /> Excel
              </button>
              <button onClick={() => exportReport('pdf')}
                className="flex items-center gap-2 rounded-xl border border-border bg-background-card px-4 py-2.5 text-sm font-bold text-text-secondary hover:border-red-500 hover:text-red-500 transition-colors">
                <Download className="h-4 w-4" /> PDF
              </button>
            </>
          ) : null}
        </div>
      </div>

      {/* Active Report Description */}
      <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-5 py-3">
        <meta.icon size={22} className="text-primary" />
        <div>
          <p className="font-bold text-primary">{t(`types.${meta.id}.label` as never)}</p>
          <p className="text-sm text-text-muted">{t(`types.${meta.id}.description` as never)}</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Summary Cards */}
      {summaryItems.length > 0 && (
        <div className={`grid gap-4 ${summaryItems.length === 1 ? 'grid-cols-1' : summaryItems.length === 2 ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'}`}>
          {summaryItems.map(item => <SummaryCard key={item.label} label={item.label} value={item.value} />)}
        </div>
      )}

      {/* Data Table */}
      {data && (
        <div className="overflow-hidden rounded-lg border border-border bg-background-card shadow-sm">
          {data.rows.length === 0 ? (
            <div className="py-16 text-center text-text-muted">
              <Inbox className="mx-auto mb-3 h-10 w-10" />
              <p>{t('noData')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-background">
                  <tr>
                    {columns.map(col => (
                      <th key={col.key} className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wider text-text-muted">
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.rows.slice(0, 200).map((row, i) => (
                    <tr key={i} className="hover:bg-background-elevated transition-colors">
                      {columns.map(col => {
                        const rawVal = (row)[col.key];
                        // handle nested objects like products.name_ar
                        let displayVal: unknown = rawVal;
                        if (typeof rawVal === 'object' && rawVal !== null) {
                          displayVal = JSON.stringify(rawVal);
                        }
                        return (
                          <td key={col.key} className="px-4 py-3 text-text-primary">
                            {col.fmt ? col.fmt(displayVal) : String(displayVal ?? '—')}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.rows.length > 200 && (
                <div className="px-4 py-3 text-center text-xs text-text-muted border-t border-border">
                  {t('firstRowsOnly')}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!data && !loading && !error && (
        <div className="rounded-lg border border-dashed border-border p-16 text-center text-text-muted">
          <LineChart className="mx-auto mb-4 h-12 w-12" />
          <p className="font-semibold text-text-primary mb-1">{t('emptyTitle')}</p>
          <p className="text-sm">{t('emptyDescription')}</p>
        </div>
      )}
    </div>
  );
}
