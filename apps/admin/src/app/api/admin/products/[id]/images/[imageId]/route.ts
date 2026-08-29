import { NextResponse } from 'next/server';
import { requireAdminContext, writeAuditLog } from '@/supabase-server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; imageId: string }> },
) {
  const ctx = await requireAdminContext('product_management', 'edit');
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id, imageId } = await params;
  if (!z.string().uuid().safeParse(id).success || !z.string().uuid().safeParse(imageId).success) {
    return NextResponse.json({ error: 'invalid_id' }, { status: 400 });
  }

  const { data: before, error: loadError } = await ctx.admin
    .from('product_images')
    .select('id, product_id, url, is_primary')
    .eq('id', imageId)
    .eq('product_id', id)
    .maybeSingle();
  if (loadError) return NextResponse.json({ error: 'database_error' }, { status: 500 });
  if (!before) return NextResponse.json({ error: 'image_not_found' }, { status: 404 });

  const marker = '/storage/v1/object/public/product-images/';
  try {
    const parsedUrl = new URL(before.url);
    const markerIndex = parsedUrl.pathname.indexOf(marker);
    if (markerIndex >= 0) {
      const storagePath = decodeURIComponent(parsedUrl.pathname.slice(markerIndex + marker.length));
      const { error: storageError } = await ctx.admin.storage.from('product-images').remove([storagePath]);
      if (storageError) return NextResponse.json({ error: 'storage_delete_failed' }, { status: 500 });
    }
  } catch {
    // Legacy external URLs have no managed storage object to remove.
  }

  const { error, count } = await ctx.admin
    .from('product_images')
    .delete({ count: 'exact' })
    .eq('id', imageId)
    .eq('product_id', id);

  if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });
  if ((count ?? 0) === 0) return NextResponse.json({ error: 'image_not_found' }, { status: 404 });
  if (before.is_primary) {
    const { data: nextImage } = await ctx.admin.from('product_images').select('id').eq('product_id', id).order('sort_order').limit(1).maybeSingle();
    if (nextImage) await ctx.admin.from('product_images').update({ is_primary: true }).eq('id', nextImage.id);
  }

  await writeAuditLog({
    admin: ctx.admin,
    actorId: ctx.userId,
    actorRole: ctx.role,
    action: 'product_image.deleted',
    entityType: 'product_images',
    entityId: imageId,
    beforeState: before,
  });

  return NextResponse.json({ deleted: true });
}
