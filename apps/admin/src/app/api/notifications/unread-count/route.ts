import { NextResponse } from 'next/server';
import { requireAdminContext } from '@/supabase-server';

export async function GET() {
  const ctx = await requireAdminContext('dashboard', 'view');
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { count, error } = await ctx.admin.from('notifications').select('id', { count: 'exact', head: true }).eq('recipient_id', ctx.userId).eq('recipient_role', ctx.role).eq('is_read', false);
  if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });
  return NextResponse.json({ count: count ?? 0 });
}
