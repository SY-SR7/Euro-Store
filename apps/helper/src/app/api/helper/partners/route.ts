import { NextResponse } from 'next/server';
import { requireHelperContext } from '@/lib/helper-context';

export const dynamic = 'force-dynamic';

export async function GET() {
  const ctx = await requireHelperContext();
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { data, error } = await ctx.admin.from('partner_profiles').select('id, business_name, geographic_area').eq('is_active', true).order('business_name');
  if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}

