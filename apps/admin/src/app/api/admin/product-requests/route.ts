import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminContext, writeAuditLog } from '@/supabase-server';

const requestImagePath = /^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(?:jpg|png|webp)$/i;

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAdminContext('helper_management', 'view');
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { admin } = ctx;

    const statusFilter = req.nextUrl.searchParams.get('status');
    if (statusFilter && !['pending', 'approved', 'rejected'].includes(statusFilter)) {
      return NextResponse.json({ error: 'invalid_status' }, { status: 400 });
    }

    let q = admin
      .from('product_helper_requests')
      .select(`
        id, helper_id, product_name_ar, product_name_en, description,
        suggested_category_id, image_urls, status, admin_notes, created_at,
        helper_profiles!helper_id ( full_name )
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (statusFilter) q = q.eq('status', statusFilter);

    const { data, error } = await q;
    if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });

    const rows = data ?? [];
    const paths = rows.flatMap((row) => privateImagePaths(row.image_urls));
    const signedByPath = new Map<string, string>();
    if (paths.length) {
      const { data: signed } = await admin.storage.from('product-request-images').createSignedUrls(paths, 300);
      for (const item of signed ?? []) {
        if (item.path && item.signedUrl) signedByPath.set(item.path, item.signedUrl);
      }
    }
    return NextResponse.json(rows.map((row) => ({
      ...row,
      image_urls: privateImagePaths(row.image_urls).map((path) => signedByPath.get(path)).filter(Boolean),
    })));
  } catch (err) {
    console.error('[GET /api/admin/product-requests]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

const patchSchema = z.object({
  id:          z.string().uuid(),
  action:      z.enum(['approve', 'reject']),
  admin_notes: z.string().optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const ctx = await requireAdminContext('helper_management', 'edit');
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { admin, userId } = ctx;

    const parsed = patchSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: 'بيانات غير صحيحة' }, { status: 400 });
    const { id, action, admin_notes } = parsed.data;

    if (action === 'reject' && !admin_notes?.trim())
      return NextResponse.json({ error: 'ملاحظة الرفض مطلوبة' }, { status: 400 });

    const { data: current } = await admin
      .from('product_helper_requests')
      .select('id, helper_id, status, image_urls, product_name_ar')
      .eq('id', id)
      .maybeSingle();
    if (!current) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    if (current.status !== 'pending') return NextResponse.json({ error: 'already_reviewed' }, { status: 409 });

    const { data: updated, error } = await admin
      .from('product_helper_requests')
      .update({
        status: action === 'approve' ? 'approved' : 'rejected',
        admin_notes: admin_notes ?? null,
        reviewed_by: userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('status', 'pending')
      .select('id')
      .maybeSingle();

    if (error) throw error;
    if (!updated) return NextResponse.json({ error: 'already_reviewed' }, { status: 409 });

    if (action === 'reject') {
      const paths = privateImagePaths(current.image_urls);
      if (paths.length) await admin.storage.from('product-request-images').remove(paths);
      await admin.from('product_helper_requests').update({ image_urls: [] }).eq('id', id);
    }

    await writeAuditLog({
      admin,
      actorId: userId,
      actorRole: ctx.role,
      action: `product_request.${action}`,
      entityType: 'product_helper_requests',
      entityId: id,
      beforeState: current,
      afterState: { status: action === 'approve' ? 'approved' : 'rejected', admin_notes },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[PATCH /api/admin/product-requests]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

function privateImagePaths(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && requestImagePath.test(item));
}
