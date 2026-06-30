import { NextResponse } from 'next/server';
import { createAdminSupabaseClient, requireAdminContext, writeAuditLog } from '@/supabase-server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const patchSchema = z.object({
  status: z.enum(['approved', 'rejected']),
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const ctx = await requireAdminContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { admin, userId } = ctx;

  try {
    const body: unknown = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid_input', details: parsed.error.flatten() }, { status: 400 });
    }

    const { data: before } = await admin
      .from('product_reviews')
      .select('id, status')
      .eq('id', params.id)
      .single();

    const { data, error } = await admin
      .from('product_reviews')
      .update({
        status: parsed.data.status,
        moderated_by: userId,
        moderated_at: new Date().toISOString(),
      } as never)
      .eq('id', params.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await writeAuditLog({
      admin,
      actorId: userId,
      actorRole: 'admin',
      action: parsed.data.status === 'approved' ? 'review_approved' : 'review_rejected',
      entityType: 'product_review',
      entityId: params.id,
      beforeState: before ?? null,
      afterState: data ?? null,
    });

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
