import { NextResponse } from 'next/server';
import { requireAdminContext } from '@/supabase-server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const ctx = await requireAdminContext('homepage_management', 'view');
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data, error } = await ctx.admin.from('homepage_sections').select('*').order('sort_order');
  if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });
  return NextResponse.json(data ?? []);
}
