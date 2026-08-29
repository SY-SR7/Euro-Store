import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/supabase-server';

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut({ scope: 'global' }).catch(() => undefined);

  const response = NextResponse.redirect(new URL('/login', request.url), { status: 303 });
  response.cookies.set('sb-access-token', '', { maxAge: 0, path: '/' });
  response.cookies.set('sb-refresh-token', '', { maxAge: 0, path: '/' });
  return response;
}
