import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const admin = createAdminSupabaseClient();
    const { data, error } = await admin
      .from('categories')
      .select('id, name_ar, name_en, image_url, slug, parent_id')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return NextResponse.json({ data: data ?? [] });
  } catch (error) {
    console.error('[GET /api/categories]', error);
    return NextResponse.json({ error: 'categories_unavailable' }, { status: 500 });
  }
}
