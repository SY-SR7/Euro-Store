/* eslint-disable */
// @ts-nocheck
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/supabase-server';
import { GOVERNORATES } from '@eurostore/shared';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const govId = searchParams.get('gov') ?? '';

  // Convert English gov ID â†’ Arabic name used in DB
  const govAr = GOVERNORATES.find(g => g.id === govId)?.ar ?? '';
  if (!govAr) {
    return NextResponse.json({ base_rate_syp: 0, free_shipping_threshold_syp: null });
  }

  const supabase = createServerSupabaseClient();

  const { data } = await supabase
    .from('shipping_rates')
    .select('base_rate_syp, free_shipping_threshold_syp')
    .eq('governorate', govAr)
    .eq('is_active', true)
    .single();

  if (!data) {
    return NextResponse.json({ base_rate_syp: 0, free_shipping_threshold_syp: null });
  }

  return NextResponse.json(data);
}
