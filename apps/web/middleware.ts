import { createSupabaseServerClientFromEnv } from '@eurostore/database';
import { type NextRequest, NextResponse } from 'next/server';

const PROTECTED_PREFIXES = ['/account', '/checkout', '/orders', '/loyalty', '/exchange'];

function redirectTo(request: NextRequest, path: string): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = path;
  url.search = '';
  return NextResponse.redirect(url);
}

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const response = NextResponse.next({ request });
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirectTo(request, '/auth/login');
  }

  const profile = await supabase.from('customer_profiles').select('id').eq('id', user.id).maybeSingle();

  if (!profile.data) {
    await supabase.auth.signOut();
    return redirectTo(request, '/auth/login');
  }

  return response;
}

export const config = {
  matcher: ['/account/:path*', '/checkout/:path*', '/orders/:path*', '/loyalty/:path*', '/exchange/:path*'],
};
