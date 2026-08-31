import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { apiRateLimitCategory, createContentSecurityPolicy, createCspNonce, defaultLocale, isAllowedMutationOrigin, limitApiRequest, locales, type Locale } from '@eurostore/shared';
import { createServerClient } from '@supabase/ssr';

// Paths that require the customer to be logged in
const PROTECTED_PATHS = ['/account', '/orders', '/loyalty', '/checkout', '/exchange/new'];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestOrigin = request.headers.get('origin');
  const isLocalMobileDevOrigin = process.env.NODE_ENV !== 'production'
    && requestOrigin !== null
    && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(requestOrigin);
  const nonce = createCspNonce();
  const contentSecurityPolicy = createContentSecurityPolicy('web', nonce, process.env.NODE_ENV === 'development');
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', contentSecurityPolicy);
  const secure = (response: NextResponse) => {
    response.headers.set('Content-Security-Policy', contentSecurityPolicy);
    if (pathname.startsWith('/api/') && isLocalMobileDevOrigin && requestOrigin) {
      response.headers.set('Access-Control-Allow-Origin', requestOrigin);
      response.headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
      response.headers.append('Vary', 'Origin');
    }
    return response;
  };

  if (pathname.startsWith('/api/') && request.method === 'OPTIONS' && isLocalMobileDevOrigin) {
    return secure(new NextResponse(null, { status: 204 }));
  }
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/webhooks/') && !isLocalMobileDevOrigin && !isAllowedMutationOrigin(request)) {
    return secure(NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Cross-origin request rejected.' } }, { status: 403 }));
  }
  if (pathname.startsWith('/api/')) {
    const rate = await limitApiRequest(request, apiRateLimitCategory(pathname, 'web'));
    if (!rate.success) {
      const retryAfter = Math.max(1, Math.ceil((rate.reset - Date.now()) / 1000));
      return secure(NextResponse.json({ error: { code: 'RATE_LIMITED', message: 'Too many requests.' } }, { status: 429, headers: { 'Retry-After': String(retryAfter) } }));
    }
  }

  // Skip Next.js internals
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request: { headers: requestHeaders } });

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

    const ref = request.nextUrl.searchParams.get('ref')?.trim().toUpperCase() ?? '';
    if (/^[A-Z0-9]{8,12}$/.test(ref)) {
      response.cookies.set('referral_code', ref, {
        maxAge: 60 * 60 * 24 * 30, // 30 days
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });
    }
  }

  // ── Auth guard for customer-only pages ───────────────────────────────────
  if (isProtectedPath(pathname)) {
    const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? '';
    const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

    if (!supabaseUrl || !supabaseAnon) {
      return secure(new NextResponse('Service unavailable', { status: 503 }));
    }

    if (supabaseUrl && supabaseAnon) {
      const supabase = createServerClient(supabaseUrl, supabaseAnon, {
        cookies: {
          getAll() {
            // Filter out old-format separate Supabase cookies to avoid conflict
            return request.cookies.getAll().filter((c) => !['sb-access-token', 'sb-refresh-token'].includes(c.name));
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            response = NextResponse.next({ request: { headers: requestHeaders } });
            const locale = request.cookies.get('EUROSTORE_LOCALE')?.value;
            response.cookies.set('EUROSTORE_LOCALE', (locales as readonly string[]).includes(locale ?? '') ? locale! : defaultLocale, {
              maxAge: 60 * 60 * 24 * 365,
              httpOnly: false,
              sameSite: 'lax',
              path: '/',
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = '/auth/login';
        loginUrl.search   = `?next=${encodeURIComponent(pathname)}`;
        return secure(NextResponse.redirect(loginUrl));
      }
    }
  }

  return secure(response);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

