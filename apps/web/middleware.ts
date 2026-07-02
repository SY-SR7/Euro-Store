/* eslint-disable */
// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { defaultLocale, locales, type Locale } from '@eurostore/shared';
import { createServerClient } from '@supabase/ssr';

// Paths that require the customer to be logged in
const PROTECTED_PATHS = ['/account', '/orders', '/loyalty', '/checkout', '/exchange/new'];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip Next.js internals
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  let response = NextResponse.next();

  // ── Locale cookie (sliding, 1 year) ──────────────────────────────────────
  if (!pathname.startsWith('/api/')) {
    const cookieLocale = request.cookies.get('EUROSTORE_LOCALE')?.value as Locale | undefined;
    const locale: Locale =
      cookieLocale && (locales as readonly string[]).includes(cookieLocale)
        ? cookieLocale
        : defaultLocale;
    response.cookies.set('EUROSTORE_LOCALE', locale, {
      maxAge: 60 * 60 * 24 * 365,
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
    });
  }

  // ── Auth guard for customer-only pages ───────────────────────────────────
  if (isProtectedPath(pathname)) {
    const supabaseUrl  = process.env['NEXT_PUBLIC_SUPABASE_URL']  ?? '';
    const supabaseAnon = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] ?? '';

    if (supabaseUrl && supabaseAnon) {
      const supabase = createServerClient(supabaseUrl, supabaseAnon, {
        cookies: {
          getAll() {
            // Filter out old-format separate Supabase cookies to avoid conflict
            return request.cookies.getAll().filter((c) => !['sb-access-token', 'sb-refresh-token'].includes(c.name));
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            response = NextResponse.next();
            response.cookies.set('EUROSTORE_LOCALE', response.cookies.get('EUROSTORE_LOCALE')?.value || 'ar'); // Re-apply locale if response recreated
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      });

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = '/auth/login';
        loginUrl.search   = `?next=${encodeURIComponent(pathname)}`;
        return NextResponse.redirect(loginUrl);
      }
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

