import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSupabaseServerClientFromEnv } from '@eurostore/database';

interface RouteParams { params: { id: string } }

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export async function GET(_req: Request, { params }: RouteParams) {
  const cookieStore = cookies();
  const supabase = createSupabaseServerClientFromEnv(cookieStore);
  const { data, error } = await supabase
    .from('product_images')
    .select('id, url, alt_ar, alt_en, sort_order, is_primary')
    .eq('product_id', params.id)
    .order('sort_order');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File | null;
    if (!file) return NextResponse.json({ error: 'no_file' }, { status: 400 });
    if (!ALLOWED_TYPES.includes(file.type))
      return NextResponse.json({ error: 'invalid_type' }, { status: 400 });
    if (file.size > MAX_SIZE)
      return NextResponse.json({ error: 'file_too_large' }, { status: 400 });

    const cookieStore = cookies();
    const supabase = createSupabaseServerClientFromEnv(cookieStore);

    const ext = file.name.split('.').pop() ?? 'jpg';
    const storagePath = `${params.id}/${Date.now()}.${ext}`;
    const buffer = await file.arrayBuffer();

    const { data: uploaded, error: uploadErr } = await supabase.storage
      .from('product-images')
      .upload(storagePath, buffer, { contentType: file.type, upsert: false });

    if (uploadErr || !uploaded)
      return NextResponse.json({ error: uploadErr?.message ?? 'upload_failed' }, { status: 500 });

    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(uploaded.path);

    const altAr = (formData.get('alt_ar') as string | null) ?? '';
    const altEn = (formData.get('alt_en') as string | null) ?? '';
    const isPrimary = formData.get('is_primary') === 'true';

    const { data: img, error: dbErr } = await supabase
      .from('product_images')
      .insert({ product_id: params.id, url: publicUrl, alt_ar: altAr, alt_en: altEn, sort_order: 0, is_primary: isPrimary })
      .select('id, url, is_primary')
      .single();

    if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
    return NextResponse.json(img, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}