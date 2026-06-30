import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/totp/setup', '/totp/verify'];

function isPublicPath(pathname: string) {
  return (
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  );
}

function hasSession(request: NextRequest) {
  return Boolean(
    request.cookies.get('sb-access-token')?.value ||
      request.cookies.get('supabase-auth-token')?.value ||
      request.cookies.get('admin_session')?.value ||
      request.cookies.get('eurostore_admin_session')?.value
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const locale =
    request.cookies.get('NEXT_LOCALE')?.value ||
    request.cookies.get('EUROSTORE_LOCALE')?.value ||
    'ar';

  if (isPublicPath(pathname)) {
    const response = NextResponse.next();
    response.headers.set('x-eurostore-locale', locale);
    return response;
  }

  if (!hasSession(request)) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  const response = NextResponse.next();
  response.headers.set('x-eurostore-locale', locale);
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)']
};
