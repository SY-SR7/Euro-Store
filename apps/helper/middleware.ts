import { createSupabaseServerClientFromEnv } from '@eurostore/database';
import { type NextRequest, NextResponse } from 'next/server';
import { getHelperAccess } from './src/auth';

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
  const { data: { user } } = await supabase.auth.getUser();
  const access = getHelperAccess(user);

  if (!access) {
    return pathname === LOGIN_PATH ? response : redirectTo(request, LOGIN_PATH);
  }

  if (pathname === LOGIN_PATH) {
    return redirectTo(request, '/');
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

