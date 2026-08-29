import { NextResponse } from 'next/server';
import { requireAdminContext, writeAuditLog } from '@/supabase-server';
import { hasExpectedFileSignature } from '@eurostore/shared';

export const dynamic = 'force-dynamic';

const PURPOSE_MODULES = {
  product: 'product_management',
  category: 'category_management',
  brand: 'brand_management',
  homepage: 'homepage_management',
} as const;

const FILE_POLICIES = {
  'image/jpeg': { extension: 'jpg', kind: 'image', maxBytes: 5 * 1024 * 1024 },
  'image/png': { extension: 'png', kind: 'image', maxBytes: 5 * 1024 * 1024 },
  'image/webp': { extension: 'webp', kind: 'image', maxBytes: 5 * 1024 * 1024 },
  'video/mp4': { extension: 'mp4', kind: 'video', maxBytes: 100 * 1024 * 1024 },
} as const;

export async function POST(request: Request) {
  const purpose = new URL(request.url).searchParams.get('purpose') ?? 'product';
  const moduleName = PURPOSE_MODULES[purpose as keyof typeof PURPOSE_MODULES];
  if (!moduleName) return NextResponse.json({ error: 'invalid_upload_purpose' }, { status: 400 });

  const ctx = await requireAdminContext(moduleName, 'create');
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    const formData = await request.formData();
    const files = formData.getAll('file').filter((value): value is File => value instanceof File);

    if (files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }
    if (files.length > 20) return NextResponse.json({ error: 'too_many_files' }, { status: 422 });

    const preparedFiles = [];
    for (const file of files) {
      const policy = FILE_POLICIES[file.type as keyof typeof FILE_POLICIES];
      if (!policy) return NextResponse.json({ error: 'unsupported_file_type' }, { status: 422 });
      if (policy.kind === 'video' && !['product', 'homepage'].includes(purpose)) {
        return NextResponse.json({ error: 'video_not_allowed_for_purpose' }, { status: 422 });
      }
      if (file.size > policy.maxBytes) return NextResponse.json({ error: 'file_too_large' }, { status: 422 });
      if (!(await hasExpectedFileSignature(file, file.type))) return NextResponse.json({ error: 'file_signature_mismatch' }, { status: 422 });

      const bucket = policy.kind === 'video' ? 'product-videos' : 'product-images';
      const filename = `${purpose}/${Date.now()}-${crypto.randomUUID()}.${policy.extension}`;
      preparedFiles.push({ file, policy, bucket, filename });
    }

    const results = [];
    const uploadedPaths: Array<{ bucket: string; path: string }> = [];

    for (const { file, policy, bucket, filename } of preparedFiles) {

      const { data, error } = await ctx.admin.storage
        .from(bucket)
        .upload(filename, file, { contentType: file.type });

      if (error) {
        await Promise.all(
          uploadedPaths.map(({ bucket: uploadedBucket, path }) =>
            ctx.admin.storage.from(uploadedBucket).remove([path])
          )
        );
        return NextResponse.json({ error: 'upload_failed' }, { status: 500 });
      }

      uploadedPaths.push({ bucket, path: data.path });

      const { data: publicUrlData } = ctx.admin.storage
        .from(bucket)
        .getPublicUrl(data.path);

      results.push({
        type: policy.kind,
        url: publicUrlData.publicUrl,
        originalName: file.name
      });
    }

    await writeAuditLog({
      admin: ctx.admin,
      actorId: ctx.userId,
      actorRole: ctx.role,
      action: 'storage.uploaded',
      entityType: 'storage_objects',
      afterState: { purpose, files: results.map(({ type, url }) => ({ type, url })) },
    });

    return NextResponse.json({ files: results });
  } catch {
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
