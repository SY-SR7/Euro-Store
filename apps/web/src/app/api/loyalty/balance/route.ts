/* eslint-disable */
// @ts-nocheck
import { NextResponse } from 'next/server';
import { createSupabaseServerClientFromEnv } from '@eurostore/database';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = cookies();
  const supabase    = createSupabaseServerClientFromEnv(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ points: 0 });
  }

  const { data } = await supabase
    .from('customer_profiles')
    .select('loyalty_points')
    .eq('id', user.id)
    .single();

  const points = (data as { loyalty_points: number } | null)?.loyalty_points ?? 0;
  return NextResponse.json({ points });
}