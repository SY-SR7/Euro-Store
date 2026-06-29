/* eslint-disable */
import { NextResponse } from 'next/server';
import { getSessionClient } from '@/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { client, user } = await getSessionClient();
    if (!user) return NextResponse.json({ points: 0, authenticated: false });
    const { data } = await client.from('customer_profiles').select('loyalty_points').eq('id', user.id).single();
    return NextResponse.json({ points: (data as { loyalty_points: number } | null)?.loyalty_points ?? 0, authenticated: true });
  } catch { return NextResponse.json({ points: 0, authenticated: false }); }
}