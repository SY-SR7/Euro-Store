import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseAdminClientFromEnv, type Database } from '@eurostore/database';
import { USER_ROLES } from '@eurostore/shared';
import type { AdminPortalRole } from '@eurostore/shared';
import { z } from 'zod';
import { authRatelimit } from '@/lib/ratelimit';
import { createAdminPartialAuthToken, setAdminPartialAuthCookie } from '@/lib/admin-2fa';

export const dynamic = 'force-dynamic';

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(128),
}).strict();

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'anonymous';
  const { success } = await authRatelimit.limit(ip);
  if (!success) {
    return NextResponse.json({ error: 'too_many_requests' }, { status: 429 });
  }

  try {
    const body: unknown = await req.json().catch(() => null);
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'أدخل البريد الإلكتروني وكلمة المرور' }, { status: 400 });
    }

    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

    const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
    if (error || !data.session || !data.user) {
      return NextResponse.json({ error: 'فشل تسجيل الدخول' }, { status: 401 });
    }

    const admin = createSupabaseAdminClientFromEnv();
    const { data: adminProfile } = await admin
      .from('admin_profiles')
      .select('id, totp_enabled, is_active')
      .eq('id', data.user.id)
      .eq('is_active', true)
      .maybeSingle();

    let role: AdminPortalRole = USER_ROLES.ADMIN;
    let totpEnabled = Boolean(adminProfile?.totp_enabled);
    let isAuthorized = Boolean(adminProfile);

    if (!isAuthorized) {
      const { data: subAdminProfile } = await admin
        .from('sub_admin_profiles')
        .select('id, totp_enabled, is_active')
        .eq('id', data.user.id)
        .eq('is_active', true)
        .maybeSingle();

      role = USER_ROLES.SUB_ADMIN;
      totpEnabled = Boolean(subAdminProfile?.totp_enabled);
      isAuthorized = Boolean(subAdminProfile);
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: 'غير مصرح لك بالدخول إلى لوحة التحكم' }, { status: 403 });
    }

    const partialToken = createAdminPartialAuthToken({
      userId: data.user.id,
      role,
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      sessionExpiresAt: data.session.expires_at ?? null,
    });

    const response = NextResponse.json({
      status: totpEnabled ? '2fa_required' : 'setup_required',
      expires_in: 5 * 60,
    });
    return setAdminPartialAuthCookie(response, partialToken);
  } catch (err) {
    console.error('[POST /api/admin/auth/login]', err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
