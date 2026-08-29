import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSupabaseServerClientFromEnv, createSupabaseAdminClientFromEnv } from '@eurostore/database';

/** GET /api/helper/categories — قائمة الفئات للـ Helper */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createSupabaseServerClientFromEnv({
      get: (name: string) => cookieStore.get(name)?.value,
      set: () => { /* Route handlers do not persist refreshed cookies here. */ },
      remove: () => { /* Route handlers do not persist refreshed cookies here. */ },
    });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = createSupabaseAdminClientFromEnv();
    const { data: helper } = await admin.from('helper_profiles').select('id').eq('id', user.id).eq('is_active', true).maybeSingle();
    if (!helper) return NextResponse.json({ error: 'Not a helper' }, { status: 403 });

    const { data } = await admin
      .from('categories')
      .select('id, name_ar, name_en')
      .is('parent_id', null)
      .order('sort_order');

    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error('[GET /api/helper/categories]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
