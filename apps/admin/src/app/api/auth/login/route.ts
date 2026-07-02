import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    // We collect all cookies set by Supabase during signInWithPassword
    const cookiesToSet: Array<{ name: string; value: string; options: Record<string, unknown> }> = [];

    const supabase = createServerClient(supabaseUrl, supabaseAnon, {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookies) {
          cookiesToSet.push(...cookies);
        },
      },
    });

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.session || !data.user) {
      return NextResponse.json({ error: error?.message || 'فشل تسجيل الدخول' }, { status: 401 });
    }

    // Build success response and apply all cookies collected
    const response = NextResponse.json({ ok: true });

    for (const { name, value, options } of cookiesToSet) {
      response.cookies.set({
        name,
        value,
        ...(options as object),
        // Security hardening
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
      });
    }

    // Also delete any old-format Supabase cookies that might cause conflicts in middleware
    response.cookies.set({ name: 'sb-access-token', value: '', maxAge: 0, path: '/' });
    response.cookies.set({ name: 'sb-refresh-token', value: '', maxAge: 0, path: '/' });

    return response;
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: error?.message || 'database_error' }, { status: 500 });
  }
}