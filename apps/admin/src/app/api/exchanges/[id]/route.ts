import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import type { TableUpdate } from '@/lib/database-types';
import { createPrivateStorageUrlMap } from '@eurostore/database';
import { requireAdminContext } from '@/supabase-server';

export const dynamic = 'force-dynamic';

type ExchangeImage = { id: string; url: string; uploaded_at: string };

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireAdminContext('exchange_management', 'view');
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test((await params).id)) {
    return NextResponse.json({ error: 'invalid_id' }, { status: 400 });
  }

  const { data, error } = await ctx.admin.from('exchange_requests').select('*, exchange_request_images(id, url, uploaded_at)').eq('id', (await params).id).maybeSingle();
  if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const images = (data.exchange_request_images ?? []) as ExchangeImage[];
  const signedUrls = await createPrivateStorageUrlMap(
    ctx.admin,
    'exchange-images',
    images.map((image) => image.url),
  );
  const safeData = { ...data, qr_code_token: undefined };
  return NextResponse.json({
    ...safeData,
    reason: data.reason_ar ?? data.reason_en ?? '',
    exchange_request_images: images.map((image) => ({
      ...image,
      url: signedUrls.get(image.url) ?? null,
    })).filter((image) => image.url) ?? [],
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireAdminContext('exchange_management', 'edit');
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
const { admin } = ctx;
  const body = await req.json().catch(() => ({})) as {
    status?: string;
    notes?: string;
    reason_ar?: string;
    reason_en?: string;
  };
  const update: TableUpdate<'exchange_requests'> = {};
  if (body.status) {
    return NextResponse.json({
      error: 'use_official_exchange_status_endpoints',
      endpoints: {
        approve: `/api/admin/exchanges/${(await params).id}/approve`,
        reject: `/api/admin/exchanges/${(await params).id}/reject`,
        status: `/api/admin/exchanges/${(await params).id}/status`,
      },
    }, { status: 400 });
  }
  if (body.notes !== undefined) update.notes = body.notes;
  if (body.reason_ar !== undefined) update.reason_ar = body.reason_ar;
  if (body.reason_en !== undefined) update.reason_en = body.reason_en;
  if (Object.keys(update).length === 0) return NextResponse.json({ error: 'No fields' }, { status: 400 });
  const { data, error } = await admin.from('exchange_requests').update(update).eq('id', (await params).id).select().single();
  if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });
  return NextResponse.json({ ...data, reason: data.reason_ar ?? data.reason_en ?? '' });
}
