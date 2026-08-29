import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminContext } from '@/supabase-server';
import { createCsv, createPdf, createXlsx } from '@/lib/report-export';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const reportTypeSchema = z.enum([
  'sales', 'orders', 'customers', 'inventory', 'loyalty',
  'referral', 'exchange', 'search', 'discounts',
]);
const formatSchema = z.enum(['json', 'csv', 'xlsx', 'pdf']);
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00Z`)));

function safeDate(value: string | null, fallback: string) {
  const parsed = dateSchema.safeParse(value ?? fallback);
  return parsed.success ? parsed.data : null;
}

function exportHeaders(filename: string, contentType: string) {
  return {
    'Content-Type': contentType,
    'Content-Disposition': `attachment; filename="${filename}"`,
    'Cache-Control': 'private, no-store, max-age=0',
    'X-Content-Type-Options': 'nosniff',
  };
}

function responseBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

export async function GET(request: NextRequest) {
  const ctx = await requireAdminContext('reports', 'view');
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const defaultTo = new Date().toISOString().slice(0, 10);
  const defaultFrom = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const typeResult = reportTypeSchema.safeParse(request.nextUrl.searchParams.get('type') ?? 'sales');
  const formatResult = formatSchema.safeParse(request.nextUrl.searchParams.get('format') ?? 'json');
  const from = safeDate(request.nextUrl.searchParams.get('from'), defaultFrom);
  const to = safeDate(request.nextUrl.searchParams.get('to'), defaultTo);
  if (!typeResult.success || !formatResult.success || !from || !to) {
    return NextResponse.json({ error: 'invalid_report_parameters' }, { status: 400 });
  }

  const fromTimestamp = new Date(`${from}T00:00:00.000Z`);
  const toTimestamp = new Date(`${to}T23:59:59.999Z`);
  if (toTimestamp < fromTimestamp || toTimestamp.getTime() - fromTimestamp.getTime() > 366 * 86400000) {
    return NextResponse.json({ error: 'invalid_date_range' }, { status: 400 });
  }

  const { data, error } = await ctx.admin.rpc('admin_report_data', {
    p_type: typeResult.data,
    p_from: fromTimestamp.toISOString(),
    p_to: toTimestamp.toISOString(),
  });
  if (error || !data || typeof data !== 'object' || Array.isArray(data)) {
    return NextResponse.json({ error: 'report_query_failed' }, { status: 500 });
  }

  const report = data as Record<string, unknown>;
  const rows = Array.isArray(report.rows) ? report.rows as Array<Record<string, unknown>> : [];
  const summary = report.summary && typeof report.summary === 'object' && !Array.isArray(report.summary)
    ? report.summary as Record<string, unknown>
    : {};
  const title = `EuroStore ${typeResult.data} report (${from} to ${to})`;
  const basename = `eurostore-${typeResult.data}-${from}-${to}`;

  if (formatResult.data === 'csv') {
    return new NextResponse(`\uFEFF${createCsv(rows)}`, {
      headers: exportHeaders(`${basename}.csv`, 'text/csv; charset=utf-8'),
    });
  }
  if (formatResult.data === 'xlsx') {
    const workbook = await createXlsx(rows, summary, title);
    return new NextResponse(responseBuffer(workbook), {
      headers: exportHeaders(`${basename}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
    });
  }
  if (formatResult.data === 'pdf') {
    const pdf = await createPdf(rows, summary, title);
    return new NextResponse(responseBuffer(pdf), {
      headers: exportHeaders(`${basename}.pdf`, 'application/pdf'),
    });
  }

  return NextResponse.json({ rows, summary, type: typeResult.data, from, to }, {
    headers: { 'Cache-Control': 'private, no-store, max-age=0' },
  });
}
