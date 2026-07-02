import fs from 'fs';
import path from 'path';

const loginApi = path.join('apps', 'admin', 'src', 'app', 'api', 'auth', 'login', 'route.ts');
const loginContent = `import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { authRatelimit } from '@/lib/ratelimit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'anonymous';
  const { success } = await authRatelimit.limit(ip);
  if (!success) {
    return NextResponse.json({ error: 'too_many_requests' }, { status: 429 });
  }

  try {
    const body = await req.json().catch(() => null);
    const email = body?.email?.trim() ?? '';
    const password = body?.password ?? '';

    if (!email || !password) {
      return NextResponse.json({ error: 'أدخل البريد الإلكتروني وكلمة المرور' }, { status: 400 });
    }

    let response = NextResponse.json({ ok: true });
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return req.cookies.get(name)?.value; },
          set(name: string, value: string, options: CookieOptions) {
            response.cookies.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            response.cookies.set({ name, value: '', ...options });
          },
        },
      }
    );

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.session || !data.user) {
      return NextResponse.json({ error: error?.message || 'فشل تسجيل الدخول' }, { status: 401 });
    }

    return response;
  } catch (error) {
    return NextResponse.json({ error: 'database_error' }, { status: 500 });
  }
}`;

fs.writeFileSync(loginApi, loginContent);


const middlewareFile = path.join('apps', 'admin', 'src', 'middleware.ts');
const middlewareContent = `import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

const PUBLIC_PATHS = ['/login', '/api/auth/login', '/totp/setup', '/totp/verify'];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.includes(pathname) || pathname.startsWith('/_next/') || pathname.startsWith('/favicon');
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const locale = request.cookies.get('NEXT_LOCALE')?.value || request.cookies.get('EUROSTORE_LOCALE')?.value || 'ar';

  let response = NextResponse.next();
  response.headers.set('x-eurostore-locale', locale);

  if (isPublicPath(pathname)) return response;

  const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'] ?? '';
  const supabaseAnon = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] ?? '';

  if (supabaseUrl && supabaseAnon) {
    const supabase = createServerClient(supabaseUrl, supabaseAnon, {
      cookies: {
        get(name: string) { return request.cookies.get(name)?.value; },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: '', ...options });
        },
      }
    });

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)']
};`;

fs.writeFileSync(middlewareFile, middlewareContent);


const serverFile = path.join('apps', 'admin', 'src', 'supabase-server.ts');
const serverContent = `import { createServerClient } from '@supabase/ssr';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@eurostore/database';

function supabaseUrl() { return process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''; }
function anonKey() { return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''; }
function serviceRoleKey() { return process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''; }

const clientOptions = {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { fetch: (...args: any[]) => fetch(args[0], { ...args[1], cache: 'no-store' }) }
};

export async function getSessionClient(): Promise<{ client: SupabaseClient; user: import('@supabase/supabase-js').User | null }> {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();

  const client = createServerClient<Database>(supabaseUrl(), anonKey(), {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll(cookiesToSet) {
        try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch {}
      }
    }
  });

  const { data: { user } } = await client.auth.getUser();
  return { client, user };
}

export function createAdminSupabaseClient(): SupabaseClient<Database> {
  return createClient<Database>(supabaseUrl(), serviceRoleKey(), clientOptions);
}

export async function requireAdminContext(): Promise<{ admin: SupabaseClient; userId: string } | null> {
  const { user } = await getSessionClient();
  if (!user) return null;
  return { admin: createAdminSupabaseClient(), userId: user.id };
}
`;

fs.writeFileSync(serverFile, serverContent);
