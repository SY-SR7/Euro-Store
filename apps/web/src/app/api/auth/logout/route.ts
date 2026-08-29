import { NextResponse } from 'next/server';
import { createWritableAuthClient } from '../_lib';

const COOKIES = [
  'sb-access-token', 'sb-refresh-token',
  'supabase-auth-token', 'eurostore_session',
];

export async function POST(request: Request) {
  const client = await createWritableAuthClient();
  await client.auth.signOut({ scope: 'global' }).catch(() => undefined);

  const wantsHtml = request.headers.get('accept')?.includes('text/html');
  const origin = new URL(request.url).origin;
  const res = wantsHtml
    ? NextResponse.redirect(new URL('/auth/login', origin), { status: 303 })
    : NextResponse.json({ success: true });
  for (const name of COOKIES) {
    res.cookies.set(name, '', { maxAge: 0, path: '/', sameSite: 'lax' });
  }
  return res;
}
