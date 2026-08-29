import { NextResponse } from 'next/server';
import { requireAdminContext, writeAuditLog } from '@/supabase-server';

export const dynamic = 'force-dynamic';

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireAdminContext('helper_management', 'delete');
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: before } = await ctx.admin
    .from('helper_profiles')
    .select('id, email, is_active')
    .eq('id', (await params).id)
    .single();

  const { data, error } = await ctx.admin
    .from('helper_profiles')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', (await params).id)
    .select('id, email, is_active')
    .single();

  if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });

  const { error: authError } = await ctx.admin.auth.admin.updateUserById((await params).id, { ban_duration: '876000h' });
  if (authError) {
    await ctx.admin.from('helper_profiles').update({ is_active: before?.is_active ?? true }).eq('id', (await params).id);
    return NextResponse.json({ error: 'auth_status_update_failed' }, { status: 500 });
  }

  await writeAuditLog({
    admin: ctx.admin,
    actorId: ctx.userId,
    actorRole: ctx.role,
    action: 'helper.deactivated',
    entityType: 'helper_profiles',
    entityId: (await params).id,
    beforeState: before,
    afterState: { is_active: false },
  });

  return NextResponse.json({ helper: data });
}
