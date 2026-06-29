// @ts-nocheck
import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/supabase-server';

export async function GET() {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from('attribute_types')
    .select('id, name_ar, name_en, slug, attribute_values(id, value_ar, value_en, hex_color, sort_order)')
    .order('created_at');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}