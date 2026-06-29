// @ts-nocheck
import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/supabase-server';

interface RouteParams { params: { id: string } }

export async function DELETE(_: Request, { params }: RouteParams) {
  const admin = createAdminSupabaseClient();
  const { error } = await admin.from('attribute_values').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}