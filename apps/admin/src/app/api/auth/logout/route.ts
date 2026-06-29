import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/supabase-server';

const COOKIES_TO_CLEAR = [
  'sb-access-token',
  'supabase-auth-token',
  'admin_session',
  'eurostore_admin_session',
  'eurostore_totp_verified',
  'EUROSTORE_TOTP_SESSION'
];

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient();
  await supabase.auth.signOut();

  const origin = new URL(request.url).origin;
  const response = NextResponse.redirect(new URL('/login', origin), { status: 303 });

  for (const cookieName of COOKIES_TO_CLEAR) {
    response.cookies.set(cookieName, '', {
      maxAge: 0,
      path: '/',
      sameSite: 'strict'
    });
  }

  return response;
}