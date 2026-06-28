import { createSupabaseServerClientFromEnv } from '@eurostore/database';
import { ADMIN_TOTP_COOKIE_NAME, readRequiredEnv, verifyTotpSessionToken } from '@eurostore/shared';
import { type NextRequest, NextResponse } from 'next/server';
import { getAdminAccess } from './auth';

const LOGIN_PATH = '/login';

function redirectTo(request: NextRequest, path: string): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = path;
  url.search = '';
  return NextResponse.redirect(url);
}

function isStaticPath(pathname: string): boolean {
  return pathname.startsWith('/_next') || pathname === '/favicon.ico' || pathname.includes('.');
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  if (isStaticPath(pathname)) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  // Only protect /dashboard and its sub-routes, plus redirect root to /dashboard
  if (!pathname.startsWith('/dashboard') && pathname !== '/') {
    return response;
  }

  const supabase = createSupabaseServerClientFromEnv({
    get(name) {
      return request.cookies.get(name)?.value;
    },
    set(name, value, options) {
      request.cookies.set(name, value);
      response.cookies.set({ name, value, ...options });
    },
    remove(name, options) {
      request.cookies.set(name, '');
      response.cookies.set({ name, value: '', ...options, maxAge: 0 });
    },
  });
  
  const access = await getAdminAccess(supabase);

  if (!access || (access.role !== 'admin' && access.role !== 'sub_admin')) {
    return redirectTo(request, LOGIN_PATH);
  }

  // TOTP logic
  if (!access.totpEnabled) {
    // If we have a TOTP setup page, redirect there. Assuming /totp/setup for now or we can handle it in login page.
    // For now we assume /totp/setup still exists or we just let them setup inside /login
    return redirectTo(request, '/login?step=setup');
  }

  const token = request.cookies.get(ADMIN_TOTP_COOKIE_NAME)?.value;

  if (!token) {
    return redirectTo(request, '/login?step=totp');
  }

  const verified = await verifyTotpSessionToken(token, readRequiredEnv('EUROSTORE_AUTH_COOKIE_SECRET'));

  if (!verified || verified.userId !== access.userId || verified.role !== access.role) {
    response = redirectTo(request, '/login?step=totp');
    response.cookies.set({ name: ADMIN_TOTP_COOKIE_NAME, value: '', path: '/', maxAge: 0 });
    return response;
  }

  if (pathname === '/') {
    return redirectTo(request, '/dashboard');
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
