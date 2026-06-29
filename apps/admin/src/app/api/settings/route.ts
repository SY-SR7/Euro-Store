import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/supabase-server';
import { createSupabaseAdminClientFromEnv } from '@eurostore/database';

export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const admin = createSupabaseAdminClientFromEnv();
  const { data, error } = await admin
    .from('system_settings')
    .select('key, value, description')
    .order('key');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function PATCH(request: Request) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { key, value } = await request.json() as { key: string; value: string };
  if (!key || value === undefined) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });

  const admin = createSupabaseAdminClientFromEnv();
  const { error } = await admin
    .from('system_settings')
    .update({ value, updated_at: new Date().toISOString() })
    .eq('key', key);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
