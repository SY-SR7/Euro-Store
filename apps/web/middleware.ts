import { NextRequest, NextResponse } from 'next/server';
import { defaultLocale, locales, type Locale } from '@eurostore/shared';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip API routes and Next.js internals
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  const cookieLocale = request.cookies.get('EUROSTORE_LOCALE')?.value as Locale | undefined;
  const locale: Locale =
    cookieLocale && (locales as readonly string[]).includes(cookieLocale)
      ? cookieLocale
      : defaultLocale;

  const response = NextResponse.next();
  // Refresh cookie on every request (sliding expiry 1 year)
  response.cookies.set('EUROSTORE_LOCALE', locale, {
    maxAge: 60 * 60 * 24 * 365,
    httpOnly: false, // readable by client for lang switcher
    sameSite: 'lax',
    path: '/',
  });
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
