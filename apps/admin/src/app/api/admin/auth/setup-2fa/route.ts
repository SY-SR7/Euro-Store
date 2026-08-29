import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import {
  buildTotpUri,
  generateTotpSecret,
  readRequiredEnv,
  totpCodeSchema,
  verifyTotpCode,
} from '@eurostore/shared';
import { createSupabaseAdminClientFromEnv } from '@eurostore/database';
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
  profileTableForRole,
} from '@/lib/admin-2fa';

export const dynamic = 'force-dynamic';

const setupSchema = z.object({
  totp_code: z.string().max(32).optional(),
}).strict();

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json().catch(() => null);
    const parsedBody = setupSchema.safeParse(body);
    if (!parsedBody.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
    const { totp_code: totpCode } = parsedBody.data;

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
    if (profile.totp_enabled) {
      return NextResponse.json({ error: 'totp_already_enabled' }, { status: 409 });
    }

    const secret = profile.totp_secret ?? generateTotpSecret();
    if (!profile.totp_secret) {
      await admin
        .from(profileTableForRole(partial.role))
        .update({ totp_secret: secret, updated_at: new Date().toISOString() } as never)
        .eq('id', profile.id);
    }

    const issuer = readRequiredEnv('EUROSTORE_AUTH_TOTP_ISSUER');
    const uri = buildTotpUri(profile.email, issuer, secret);

    if (!totpCode) {
      const response = NextResponse.json({
        status: 'setup_required',
        account_name: profile.email,
        issuer,
        secret,
        uri,
      });
      response.headers.set('Cache-Control', 'no-store');
      return response;
    }

    const parsedCode = totpCodeSchema.safeParse({ code: totpCode });
    if (!parsedCode.success || !verifyTotpCode(secret, parsedCode.data.code)) {
      const failure = await recordTotpFailure(admin, profile, partial.role);
      return NextResponse.json(
        {
          error: failure.lockedUntil ? 'totp_locked' : 'invalid_totp',
          locked_until: failure.lockedUntil,
        },
        { status: failure.lockedUntil ? 423 : 400 },
      );
    }

    await resetTotpFailures(admin, partial.userId, partial.role, {
      totp_secret: secret,
      totp_enabled: true,
    });

    return buildVerifiedAdminSessionResponse(partial, { status: 'ok' });
  } catch (error) {
    console.error('[POST /api/admin/auth/setup-2fa]', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
