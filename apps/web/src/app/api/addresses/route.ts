import { NextResponse } from 'next/server';
import { z } from 'zod';
import { GOVERNORATES } from '@eurostore/shared';
import { createAdminSupabaseClient, getSessionClient } from '@/supabase-server';

const governorateIds = GOVERNORATES.map((governorate) => governorate.id) as [string, ...string[]];
const addressSchema = z.object({
  label: z.string().trim().max(80).optional().default(''),
  full_name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(7).max(30),
  governorate: z.enum(governorateIds),
  city: z.string().trim().max(120).optional().default(''),
  street: z.string().trim().min(5).max(500),
  is_default: z.boolean().optional().default(false),
});

export async function GET() {
  const { user } = await getSessionClient();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase.from('customer_addresses').select('*').eq('customer_id', user.id).order('is_default', { ascending: false }).order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const { user } = await getSessionClient();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const supabase = createAdminSupabaseClient();
  const parsed = addressSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });

  const { count, error: countError } = await supabase.from('customer_addresses').select('id', { count: 'exact', head: true }).eq('customer_id', user.id);
  if (countError) return NextResponse.json({ error: 'database_error' }, { status: 500 });
  if ((count ?? 0) >= 10) return NextResponse.json({ error: 'address_limit_reached' }, { status: 422 });

  const isDefault = count === 0 || parsed.data.is_default;
  if (isDefault) {
    const { error } = await supabase.from('customer_addresses').update({ is_default: false }).eq('customer_id', user.id);
    if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });
  }

  const { data, error } = await supabase.from('customer_addresses').insert({ ...parsed.data, customer_id: user.id, is_default: isDefault }).select('*').single();
  if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(request: Request) {
  const { user } = await getSessionClient();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const supabase = createAdminSupabaseClient();
  const id = new URL(request.url).searchParams.get('id');
  if (!id || !z.string().uuid().safeParse(id).success) return NextResponse.json({ error: 'invalid_id' }, { status: 400 });
  const { data, error } = await supabase.from('customer_addresses').delete().eq('id', id).eq('customer_id', user.id).select('id').maybeSingle();
  if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json({ success: true });
}
