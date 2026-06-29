import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSupabaseServerClientFromEnv } from '@eurostore/database';

export async function POST() {
  const cookieStore = cookies();
  const supabase = createSupabaseServerClientFromEnv(cookieStore);
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL('/', process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000'));
}