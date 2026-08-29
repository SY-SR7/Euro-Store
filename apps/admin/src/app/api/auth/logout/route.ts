import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
  if (!supabaseUrl || !supabaseAnon) return NextResponse.json({ error: 'service_unavailable' }, { status: 503 });

  const jar = await cookies();
  const supabase = createServerClient(supabaseUrl, supabaseAnon, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (values) => values.forEach(({ name, value, options }) => jar.set(name, value, options)),
    },
  });
  await supabase.auth.signOut({ scope: 'global' }).catch(() => {
    // Cookie removal below still completes local logout if the auth service is unavailable.
  });

  const response = NextResponse.json({ ok: true });

  // Also clear legacy cookies just in case
  response.cookies.set('sb-access-token', '', { maxAge: 0 });
  response.cookies.set('sb-refresh-token', '', { maxAge: 0 });
  response.cookies.set('eurostore_admin_totp', '', { maxAge: 0, path: '/' });

  return response;
}
