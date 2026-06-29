import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/supabase-server';

interface Params { params: { id: string } }

export async function PATCH(request: Request, { params }: Params) {
  const body = await request.json() as {
    base_rate_syp?: number;
    free_shipping_threshold_syp?: number | null;
    is_active?: boolean;
  };
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('shipping_rates')
    .update({
      ...(body.base_rate_syp !== undefined && { base_rate_syp: body.base_rate_syp }),
      ...(body.free_shipping_threshold_syp !== undefined && { free_shipping_threshold_syp: body.free_shipping_threshold_syp }),
      ...(body.is_active !== undefined && { is_active: body.is_active }),
    } as any)
    .eq('id', params.id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}