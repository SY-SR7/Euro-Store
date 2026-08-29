import { NextResponse } from 'next/server';
import { requireAdminContext } from '@/supabase-server';

export async function PUT(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireAdminContext('dashboard', 'view');
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { data, error } = await ctx.admin.from('notifications').update({ is_read: true }).eq('id', (await params).id).eq('recipient_id', ctx.userId).eq('recipient_role', ctx.role).select('id').maybeSingle();
  if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json({ success: true });
}
