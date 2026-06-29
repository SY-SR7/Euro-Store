import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const admin = createAdminSupabaseClient();
    const { data, error } = await admin
      .from('system_settings')
      .select('key, value, description')
      .order('key');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? []);
  } catch { return NextResponse.json({ error: 'server_error' }, { status: 500 }); }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = createAdminSupabaseClient();
    const body = await req.json() as { key: string; value: string }[];
    if (!Array.isArray(body)) return NextResponse.json({ error: 'expected array' }, { status: 400 });

    const results = await Promise.all(
      body.map(item =>
        admin.from('system_settings')
          .upsert({ key: item.key, value: item.value } as never, { onConflict: 'key' })
      )
    );
    const errors = results.filter(r => r.error).map(r => r.error!.message);
    if (errors.length > 0) return NextResponse.json({ error: errors.join('; ') }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: 'server_error' }, { status: 500 }); }
}