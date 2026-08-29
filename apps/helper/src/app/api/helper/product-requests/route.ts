import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSupabaseAdminClientFromEnv, createSupabaseServerClientFromEnv } from '@eurostore/database';
import { hasExpectedFileSignature } from '@eurostore/shared';
import { z } from 'zod';

const requestSchema = z.object({
  product_name_ar: z.string().trim().min(2).max(200),
  product_name_en: z.string().trim().max(200).optional(),
  description: z.string().trim().max(2000).optional(),
  suggested_category_id: z.string().uuid().optional(),
});

const IMAGE_POLICIES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
} as const;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGES = 5;

async function requireActiveHelper() {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClientFromEnv({
    get: (name: string) => cookieStore.get(name)?.value,
    set: () => { /* Route handlers do not persist refreshed cookies here. */ },
    remove: () => { /* Route handlers do not persist refreshed cookies here. */ },
  });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createSupabaseAdminClientFromEnv();
  const { data: helper } = await admin
    .from('helper_profiles')
    .select('id')
    .eq('id', user.id)
    .eq('is_active', true)
    .maybeSingle();
  return helper ? { admin, userId: user.id } : null;
}

export async function POST(request: Request) {
  const context = await requireActiveHelper();
  if (!context) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  try {
    const form = await request.formData().catch(() => null);
    if (!form) return NextResponse.json({ error: 'invalid_form_data' }, { status: 400 });
    const parsed = requestSchema.safeParse({
      product_name_ar: form.get('product_name_ar'),
      product_name_en: emptyToUndefined(form.get('product_name_en')),
      description: emptyToUndefined(form.get('description')),
      suggested_category_id: emptyToUndefined(form.get('suggested_category_id')),
    });
    if (!parsed.success) return NextResponse.json({ error: 'invalid_request' }, { status: 422 });

    const images = form.getAll('images').filter((value): value is File => value instanceof File);
    if (images.length > MAX_IMAGES) return NextResponse.json({ error: 'too_many_images' }, { status: 422 });
    const prepared: Array<{ file: File; path: string }> = [];
    for (const file of images) {
      const extension = IMAGE_POLICIES[file.type as keyof typeof IMAGE_POLICIES];
      if (!extension) return NextResponse.json({ error: 'unsupported_image_type' }, { status: 422 });
      if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) {
        return NextResponse.json({ error: 'image_too_large' }, { status: 422 });
      }
      if (!(await hasExpectedFileSignature(file, file.type))) {
        return NextResponse.json({ error: 'image_signature_mismatch' }, { status: 422 });
      }
      prepared.push({
        file,
        path: `${context.userId}/${crypto.randomUUID()}.${extension}`,
      });
    }

    const uploadedPaths: string[] = [];
    for (const image of prepared) {
      const { error } = await context.admin.storage
        .from('product-request-images')
        .upload(image.path, image.file, { contentType: image.file.type, upsert: false });
      if (error) {
        if (uploadedPaths.length) {
          await context.admin.storage.from('product-request-images').remove(uploadedPaths);
        }
        return NextResponse.json({ error: 'upload_failed' }, { status: 500 });
      }
      uploadedPaths.push(image.path);
    }

    const { data, error } = await context.admin.from('product_helper_requests').insert({
      helper_id: context.userId,
      product_name_ar: parsed.data.product_name_ar,
      product_name_en: parsed.data.product_name_en ?? null,
      description: parsed.data.description ?? null,
      suggested_category_id: parsed.data.suggested_category_id ?? null,
      image_urls: uploadedPaths,
      status: 'pending',
    }).select('id').single();

    if (error || !data) {
      if (uploadedPaths.length) {
        await context.admin.storage.from('product-request-images').remove(uploadedPaths);
      }
      return NextResponse.json({ error: 'database_error' }, { status: 500 });
    }

    await context.admin.from('audit_logs').insert({
      actor_id: context.userId,
      actor_role: 'helper',
      action: 'product_request.submitted',
      entity_type: 'product_helper_requests',
      entity_id: data.id,
      before_state: null,
      after_state: { product_name_ar: parsed.data.product_name_ar, image_count: uploadedPaths.length },
      ip_address: null,
      user_agent: null,
    });

    return NextResponse.json({ success: true, id: data.id }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/helper/product-requests]', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}

export async function GET() {
  const context = await requireActiveHelper();
  if (!context) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data, error } = await context.admin
    .from('product_helper_requests')
    .select('id, product_name_ar, product_name_en, status, admin_notes, created_at')
    .eq('helper_id', context.userId)
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });
  return NextResponse.json(data ?? []);
}

function emptyToUndefined(value: FormDataEntryValue | null): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}
