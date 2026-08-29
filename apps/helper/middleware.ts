import { createSupabaseServerClientFromEnv } from '@eurostore/database';
import { type NextRequest, NextResponse } from 'next/server';
import { getHelperAccess } from './src/auth';
import { apiRateLimitCategory, createContentSecurityPolicy, createCspNonce, isAllowedMutationOrigin, limitApiRequest } from '@eurostore/shared';

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
  const nonce = createCspNonce();
  const contentSecurityPolicy = createContentSecurityPolicy('helper', nonce, process.env.NODE_ENV === 'development');
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', contentSecurityPolicy);
  const secure = (response: NextResponse) => {
    response.headers.set('Content-Security-Policy', contentSecurityPolicy);
    return response;
  };

  if (pathname.startsWith('/api/') && !isAllowedMutationOrigin(request)) {
    return secure(NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Cross-origin request rejected.' } }, { status: 403 }));
  }
  if (pathname.startsWith('/api/')) {
    const rate = await limitApiRequest(request, apiRateLimitCategory(pathname, 'helper'));
    if (!rate.success) {
      const retryAfter = Math.max(1, Math.ceil((rate.reset - Date.now()) / 1000));
      return secure(NextResponse.json({ error: { code: 'RATE_LIMITED', message: 'Too many requests.' } }, { status: 429, headers: { 'Retry-After': String(retryAfter) } }));
    }
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });
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
  const access = await getHelperAccess(supabase);

  if (!access) {
    return secure(pathname === LOGIN_PATH ? response : redirectTo(request, LOGIN_PATH));
  }

  if (pathname === LOGIN_PATH) {
    return secure(redirectTo(request, '/dashboard'));
  }

  return secure(response);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

