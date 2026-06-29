/* eslint-disable */
// @ts-nocheck
import { NextResponse } from 'next/server';
import { getSessionClient, createAdminSupabaseClient } from '@/supabase-server';

export async function GET() {
  const { user } = await getSessionClient();
  if (!user) return NextResponse.json({ points: 0 });

  const admin = createAdminSupabaseClient();
  const { data } = await admin
    .from('customer_profiles')
    .select('loyalty_points')
    .eq('id', user.id)
    .maybeSingle();

  return NextResponse.json({ points: (data as any)?.loyalty_points ?? 0 });
}