import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseAdminClientFromEnv } from '@eurostore/database';
import { GET as getProducts } from '@/app/api/products/route';

const searchSchema = z.object({
  q: z.string().trim().min(2).max(100),
});

export async function GET(request: NextRequest) {
  const parsed = searchSchema.safeParse({
    q: request.nextUrl.searchParams.get('q') ?? request.nextUrl.searchParams.get('search'),
  });
  if (!parsed.success) {
    return NextResponse.json({ data: [], total: 0, page: 1, per_page: 24 });
  }

  const response = await getProducts(request);
  const payload = await response.json().catch(() => null) as Record<string, unknown> | null;
  if (!response.ok || !payload) {
    return NextResponse.json(payload ?? { error: 'search_unavailable' }, { status: response.status });
  }

  const admin = createSupabaseAdminClientFromEnv();
  await admin.from('search_analytics').insert({
    query: parsed.data.q,
    result_count: Number(payload.total ?? 0),
  });

  return NextResponse.json(payload);
}
