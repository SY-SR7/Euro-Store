import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const PUBLIC_PATHS = ['/login', '/api/auth/login', '/totp/setup', '/totp/verify', '/api/test-db'];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.includes(pathname) || pathname.startsWith('/_next/') || pathname.startsWith('/favicon');
}

const OLD_SUPABASE_COOKIES = ['sb-access-token', 'sb-refresh-token'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const locale = request.cookies.get('NEXT_LOCALE')?.value || request.cookies.get('EUROSTORE_LOCALE')?.value || 'ar';

  let response = NextResponse.next({
    request: { headers: request.headers },
  });
  response.headers.set('x-eurostore-locale', locale);

  if (isPublicPath(pathname)) return response;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

  if (!supabaseUrl || !supabaseAnon) return response;

  const supabase = createServerClient(supabaseUrl, supabaseAnon, {
    cookies: {
      getAll() {
        // Filter out old-format separate Supabase cookies to avoid conflict
        return request.cookies.getAll().filter((c) => !OLD_SUPABASE_COOKIES.includes(c.name));
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request: { headers: request.headers } });
        response.headers.set('x-eurostore-locale', locale);
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Use getSession() to avoid a network round-trip.
  // getSession() reads the JWT from the cookie directly (no Supabase API call).
  // This means we don't get a server-verified user, but for routing protection
  // in a dashboard it is acceptable — actual server actions/API routes
  // should re-verify with getUser() independently.
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};