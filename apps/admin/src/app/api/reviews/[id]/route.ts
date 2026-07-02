import { NextResponse } from 'next/server';
import { createAdminSupabaseClient, requireAdminContext, writeAuditLog } from '@/supabase-server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const patchSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().max(2000).nullable().optional(),
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const ctx = await requireAdminContext();
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const ctx = await requireAdminContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { admin, userId } = ctx;

  try {
    const body: unknown = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid_input', details: parsed.error.flatten() }, { status: 400 });
    }
    if (Object.keys(parsed.data).length === 0) {
      return NextResponse.json({ error: 'no_fields' }, { status: 400 });
    }

    const { data: before } = await admin
      .from('product_reviews')
      .select('id, status, rating, comment')
      .eq('id', params.id)
      .single();

    const update: Record<string, unknown> = {};
    if (parsed.data.status !== undefined) {
      update.status = parsed.data.status;
      update.moderated_by = userId;
      update.moderated_at = new Date().toISOString();
    }
    if (parsed.data.rating !== undefined) update.rating = parsed.data.rating;
    if (parsed.data.comment !== undefined) update.comment = parsed.data.comment;

    const { data, error } = await admin
      .from('product_reviews')
      .update(update as never)
      .eq('id', params.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });

    await writeAuditLog({
      admin,
      actorId: userId,
      actorRole: 'admin',
      action: parsed.data.status
        ? (parsed.data.status === 'approved' ? 'review_approved' : parsed.data.status === 'rejected' ? 'review_rejected' : 'review_updated')
        : 'review_updated',
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
