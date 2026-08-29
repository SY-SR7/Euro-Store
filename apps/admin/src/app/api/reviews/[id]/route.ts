import { NextResponse } from 'next/server';
import type { TableUpdate } from '@/lib/database-types';
import { createInAppNotification } from '@eurostore/database';
import { requireAdminContext, writeAuditLog } from '@/supabase-server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const patchSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().max(2000).nullable().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireAdminContext('product_management', 'edit');
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
const { admin, userId } = ctx;

  try {
    const body: unknown = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
    }
    if (Object.keys(parsed.data).length === 0) {
      return NextResponse.json({ error: 'no_fields' }, { status: 400 });
    }

    const { data: before } = await admin
      .from('product_reviews')
      .select('id, customer_id, product_id, status, rating, comment')
      .eq('id', (await params).id)
      .single();

    const update: TableUpdate<'product_reviews'> = {};
    if (parsed.data.status !== undefined) {
      update.status = parsed.data.status;
      update.moderated_by = userId;
      update.moderated_at = new Date().toISOString();
    }
    if (parsed.data.rating !== undefined) update.rating = parsed.data.rating;
    if (parsed.data.comment !== undefined) update.comment = parsed.data.comment;

    const { data, error } = await admin
      .from('product_reviews')
      .update(update)
      .eq('id', (await params).id)
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
      entityId: (await params).id,
      beforeState: before ?? null,
      afterState: data ?? null,
    });

    if (parsed.data.status === 'approved' && before?.status !== 'approved' && before?.customer_id) {
      await createInAppNotification(admin, {
        recipientId: before.customer_id,
        recipientRole: 'customer',
        type: 'system',
        titleAr: 'تم نشر تقييمك',
        titleEn: 'Your review was published',
        bodyAr: 'تمت الموافقة على تقييمك وأصبح ظاهراً في صفحة المنتج.',
        bodyEn: 'Your review was approved and is now visible on the product page.',
        referenceId: before.product_id,
        referenceType: 'product',
        data: { review_id: (await params).id, status: 'approved' },
        sendPush: false,
        sendEmail: false,
      });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
