import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminContext, writeAuditLog } from '@/supabase-server';

export const dynamic = 'force-dynamic';

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireAdminContext('partner_management', 'delete');
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!z.string().uuid().safeParse((await params).id).success) return NextResponse.json({ error: 'invalid_id' }, { status: 400 });
  const { data: before, error: loadError } = await ctx.admin.from('partner_profiles').select('*').eq('id', (await params).id).maybeSingle();
  if (loadError) return NextResponse.json({ error: 'database_error' }, { status: 500 });
  if (!before) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const { data, error } = await ctx.admin.from('partner_profiles').update({ is_active: false, updated_at: new Date().toISOString() }).eq('id', (await params).id).select().single();
  if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });
  const { error: authError } = await ctx.admin.auth.admin.updateUserById((await params).id, { ban_duration: '876000h' });
  if (authError) {
    await ctx.admin.from('partner_profiles').update({ is_active: before.is_active }).eq('id', (await params).id);
    return NextResponse.json({ error: 'auth_status_update_failed' }, { status: 500 });
  }

  await writeAuditLog({ admin: ctx.admin, actorId: ctx.userId, actorRole: ctx.role, action: 'partner.deactivated', entityType: 'partner_profiles', entityId: (await params).id, beforeState: before, afterState: data });
  return NextResponse.json({ partner: data });
}

