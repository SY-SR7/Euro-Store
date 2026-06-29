import { NextResponse } from 'next/server';
import { getSessionClient } from '@/supabase-server';

const COOKIES = [
  'sb-access-token', 'sb-refresh-token',
  'supabase-auth-token', 'eurostore_session',
];

export async function POST(request: Request) {
  const { client } = await getSessionClient();
  await client.auth.signOut().catch(() => {});

  const origin = new URL(request.url).origin;
  const res = NextResponse.redirect(new URL('/auth/login', origin), { status: 303 });
  for (const name of COOKIES) {
    res.cookies.set(name, '', { maxAge: 0, path: '/', sameSite: 'lax' });
  }
  return res;
}