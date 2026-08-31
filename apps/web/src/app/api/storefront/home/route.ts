import { NextResponse } from 'next/server';
import { getStorefrontHomeData } from '@/lib/storefront-home';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return NextResponse.json(await getStorefrontHomeData());
  } catch (error) {
    console.error('[GET /api/storefront/home]', error);
    return NextResponse.json({ error: 'home_data_unavailable' }, { status: 500 });
  }
}
