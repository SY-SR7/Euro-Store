import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { apiRateLimitCategory, createContentSecurityPolicy, createCspNonce, isAllowedMutationOrigin, limitApiRequest } from '@eurostore/shared';

const ADMIN_TOTP_COOKIE_NAME = 'eurostore_admin_totp';
const PUBLIC_PATHS = [
  '/login',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/admin/auth/login',
  '/api/admin/auth/setup-2fa',
  '/api/admin/auth/verify-2fa',
  '/totp/setup',
  '/totp/verify',
];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.includes(pathname) || pathname.startsWith('/_next/') || pathname.startsWith('/favicon');
}

const OLD_SUPABASE_COOKIES = ['sb-access-token', 'sb-refresh-token'];

function base64UrlToBytes(value: string): Uint8Array {
  const base64 = value.replaceAll('-', '+').replaceAll('_', '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

async function verifyTotpCookie(token: string | undefined, userId: string) {
  if (!token) return false;

  const [encodedPayload, signature, extra] = token.split('.');
  const secret = process.env.EUROSTORE_AUTH_COOKIE_SECRET ?? '';
  if (!encodedPayload || !signature || extra || !secret) return false;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  let signatureBytes: Uint8Array;
  try {
    signatureBytes = base64UrlToBytes(signature);
  } catch {
    return false;
  }
  const expectedSignature = new Uint8Array(await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(encodedPayload),
  ));
  if (expectedSignature.length !== signatureBytes.length) return false;

  let difference = 0;
  for (let index = 0; index < expectedSignature.length; index += 1) {
    difference |= expectedSignature[index] ^ signatureBytes[index];
  }
  if (difference !== 0) return false;

  try {
    const payload = JSON.parse(new TextDecoder().decode(base64UrlToBytes(encodedPayload))) as {
      userId?: string;
      expiresAt?: number;
    };

    return payload.userId === userId && typeof payload.expiresAt === 'number' && payload.expiresAt > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const locale = request.cookies.get('NEXT_LOCALE')?.value || request.cookies.get('EUROSTORE_LOCALE')?.value || 'ar';
  const nonce = createCspNonce();
  const contentSecurityPolicy = createContentSecurityPolicy('admin', nonce, process.env.NODE_ENV === 'development');
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
    const rate = await limitApiRequest(request, apiRateLimitCategory(pathname, 'admin'));
    if (!rate.success) {
      const retryAfter = Math.max(1, Math.ceil((rate.reset - Date.now()) / 1000));
      return secure(NextResponse.json({ error: { code: 'RATE_LIMITED', message: 'Too many requests.' } }, { status: 429, headers: { 'Retry-After': String(retryAfter) } }));
    }
  }

  let response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set('x-eurostore-locale', locale);

  if (isPublicPath(pathname)) return secure(response);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

  if (!supabaseUrl || !supabaseAnon) {
    return secure(new NextResponse('Service unavailable', { status: 503 }));
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnon, {
    cookies: {
      getAll() {
        // Filter out old-format separate Supabase cookies to avoid conflict
        return request.cookies.getAll().filter((c) => !OLD_SUPABASE_COOKIES.includes(c.name));
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request: { headers: requestHeaders } });
        response.headers.set('x-eurostore-locale', locale);
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    if (pathname.startsWith('/api/')) {
      return secure(NextResponse.json({ error: 'unauthorized' }, { status: 401 }));
    }
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return secure(NextResponse.redirect(url));
  }

  const hasVerifiedTotp = await verifyTotpCookie(
    request.cookies.get(ADMIN_TOTP_COOKIE_NAME)?.value,
    user.id,
  );

  if (!hasVerifiedTotp) {
    if (pathname.startsWith('/api/')) {
      return secure(NextResponse.json({ error: '2fa_required' }, { status: 401 }));
    }

    const url = request.nextUrl.clone();
    url.pathname = '/totp/verify';
    url.searchParams.set('next', pathname);
    return secure(NextResponse.redirect(url));
  }

  return secure(response);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
