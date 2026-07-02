import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const PUBLIC_PATHS = ['/login', '/totp/setup', '/totp/verify'];

function isPublicPath(pathname: string) {
  return (
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon')
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const locale =
    request.cookies.get('NEXT_LOCALE')?.value ||
    request.cookies.get('EUROSTORE_LOCALE')?.value ||
    'ar';

  let response = NextResponse.next();
  response.headers.set('x-eurostore-locale', locale);

  if (isPublicPath(pathname)) {
    return response;
  }

  // ── Auth guard for admin pages & api ───────────────────────────────────
  const supabaseUrl  = process.env['NEXT_PUBLIC_SUPABASE_URL']  ?? '';
  const supabaseAnon = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] ?? '';

  if (supabaseUrl && supabaseAnon) {
    const accessToken = request.cookies.get('sb-access-token')?.value;
    const refreshToken = request.cookies.get('sb-refresh-token')?.value;

    const supabase = createClient(supabaseUrl, supabaseAnon, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }),
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      }
    });

    let isValidSession = false;

    if (accessToken && refreshToken) {
      const { data, error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
      if (!error && data.session) {
        isValidSession = true;
      }
    }

    if (!isValidSession) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
      }
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }
    
    // We optionally verify admin role here, but `requireAdminContext` inside API routes is better
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)']
};
