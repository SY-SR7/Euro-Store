import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export const dynamic = 'force-dynamic';

export async function POST(req: any) {
  let response = NextResponse.json({ ok: true });
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

  if (supabaseUrl && supabaseAnon) {
    const supabase = createServerClient(supabaseUrl, supabaseAnon, {
      cookies: {
        get(name: string) { return req.cookies.get(name)?.value; },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: '', ...options });
        },
      },
    });

    await supabase.auth.signOut().catch(() => {});
  }

  // Also clear legacy cookies just in case
  response.cookies.set('sb-access-token', '', { maxAge: 0 });
  response.cookies.set('sb-refresh-token', '', { maxAge: 0 });

  return response;
}