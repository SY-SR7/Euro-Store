import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { createSupabaseAdminClientFromEnv } from '@eurostore/database';
import { totpCodeSchema, verifyTotpCode } from '@eurostore/shared';
import { z } from 'zod';
import {
  ADMIN_PARTIAL_AUTH_COOKIE_NAME,
  buildVerifiedAdminSessionResponse,
  clearAdminPartialAuthCookie,
  getAdmin2faProfile,
  isTotpLocked,
  recordTotpFailure,
  resetTotpFailures,
  verifyAdminPartialAuthToken,
} from '@/lib/admin-2fa';

export const dynamic = 'force-dynamic';

const verifyBodySchema = z.object({
  totp_code: z.unknown(),
}).strict();

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json().catch(() => null);
    const parsedBody = verifyBodySchema.safeParse(body);
    if (!parsedBody.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
    const parsedCode = totpCodeSchema.safeParse({ code: parsedBody.data.totp_code });

    if (!parsedCode.success) return NextResponse.json({ error: 'invalid_totp_format' }, { status: 400 });

    let partial;
    try {
      const partialToken = request.cookies.get(ADMIN_PARTIAL_AUTH_COOKIE_NAME)?.value;
      if (!partialToken) throw new Error('missing_partial_token');
      partial = verifyAdminPartialAuthToken(partialToken);
    } catch {
      return clearAdminPartialAuthCookie(
        NextResponse.json({ error: 'invalid_partial_token' }, { status: 401 }),
      );
    }
    const admin = createSupabaseAdminClientFromEnv();
    const profile = await getAdmin2faProfile(admin, partial.userId, partial.role);

    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (isTotpLocked(profile)) {
      return NextResponse.json({ error: 'totp_locked', locked_until: profile.totp_locked_until }, { status: 423 });
    }
    if (!profile.totp_secret || !profile.totp_enabled) {
      return NextResponse.json({ error: 'totp_setup_required' }, { status: 409 });
    }

    if (!verifyTotpCode(profile.totp_secret, parsedCode.data.code)) {
      const failure = await recordTotpFailure(admin, profile, partial.role);
      return NextResponse.json(
        {
          error: failure.lockedUntil ? 'totp_locked' : 'invalid_totp',
          locked_until: failure.lockedUntil,
        },
        { status: failure.lockedUntil ? 423 : 400 },
      );
    }

    await resetTotpFailures(admin, partial.userId, partial.role);
    return buildVerifiedAdminSessionResponse(partial, { status: 'ok' });
  } catch (error) {
    console.error('[POST /api/admin/auth/verify-2fa]', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
