import crypto from 'crypto';
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@eurostore/database';
import {
  ADMIN_TOTP_COOKIE_NAME,
  createTotpSessionToken,
  readRequiredEnv,
  type AdminPortalRole,
} from '@eurostore/shared';
import { USER_ROLES } from '@eurostore/shared';
import { z } from 'zod';

export const ADMIN_PARTIAL_TOKEN_TTL_SECONDS = 5 * 60;
export const ADMIN_PARTIAL_AUTH_COOKIE_NAME = 'eurostore_admin_partial_auth';
const TOTP_SESSION_TTL_SECONDS = 12 * 60 * 60;
const TOTP_LOCK_MINUTES = 30;
const MAX_TOTP_FAILURES = 3;

const partialPayloadSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum([USER_ROLES.ADMIN, USER_ROLES.SUB_ADMIN]),
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  sessionExpiresAt: z.number().int().positive().nullable(),
  issuedAt: z.number().int().positive(),
  expiresAt: z.number().int().positive(),
});

export type AdminPartialAuthPayload = z.infer<typeof partialPayloadSchema>;

export type Admin2faProfile = {
  id: string;
  email: string;
  full_name: string;
  totp_secret: string | null;
  totp_enabled: boolean;
  totp_failed_attempts: number;
  totp_locked_until: string | null;
  is_active: boolean;
};

function keyFromSecret(secret: string) {
  return crypto.createHash('sha256').update(secret).digest();
}

function encryptJson(value: unknown, secret: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', keyFromSecret(secret), iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(value), 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return ['v1', iv.toString('base64url'), tag.toString('base64url'), ciphertext.toString('base64url')].join('.');
}

function decryptJson(token: string, secret: string) {
  const [version, ivRaw, tagRaw, ciphertextRaw, extra] = token.split('.');
  if (version !== 'v1' || !ivRaw || !tagRaw || !ciphertextRaw || extra) {
    throw new Error('invalid_partial_token');
  }

  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    keyFromSecret(secret),
    Buffer.from(ivRaw, 'base64url'),
  );
  decipher.setAuthTag(Buffer.from(tagRaw, 'base64url'));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(ciphertextRaw, 'base64url')),
    decipher.final(),
  ]);

  return JSON.parse(plaintext.toString('utf8')) as unknown;
}

export function createAdminPartialAuthToken(
  input: Pick<AdminPartialAuthPayload, 'userId' | 'role' | 'accessToken' | 'refreshToken' | 'sessionExpiresAt'>,
) {
  const issuedAt = Math.floor(Date.now() / 1000);
  const payload = partialPayloadSchema.parse({
    ...input,
    issuedAt,
    expiresAt: issuedAt + ADMIN_PARTIAL_TOKEN_TTL_SECONDS,
  });

  return encryptJson(payload, readRequiredEnv('EUROSTORE_AUTH_COOKIE_SECRET'));
}

export function verifyAdminPartialAuthToken(token: string): AdminPartialAuthPayload {
  const payload = partialPayloadSchema.parse(
    decryptJson(token, readRequiredEnv('EUROSTORE_AUTH_COOKIE_SECRET')),
  );

  if (payload.expiresAt <= Math.floor(Date.now() / 1000)) {
    throw new Error('partial_token_expired');
  }

  return payload;
}

export function setAdminPartialAuthCookie(response: NextResponse, token: string) {
  response.cookies.set({
    name: ADMIN_PARTIAL_AUTH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/admin/auth',
    maxAge: ADMIN_PARTIAL_TOKEN_TTL_SECONDS,
  });
  response.headers.set('Cache-Control', 'no-store');
  return response;
}

export function clearAdminPartialAuthCookie(response: NextResponse) {
  response.cookies.set({
    name: ADMIN_PARTIAL_AUTH_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/admin/auth',
    maxAge: 0,
  });
  response.headers.set('Cache-Control', 'no-store');
  return response;
}

export function profileTableForRole(role: AdminPortalRole): 'admin_profiles' | 'sub_admin_profiles' {
  return role === USER_ROLES.ADMIN ? 'admin_profiles' : 'sub_admin_profiles';
}

export async function getAdmin2faProfile(
  admin: SupabaseClient<Database>,
  userId: string,
  role: AdminPortalRole,
): Promise<Admin2faProfile | null> {
  const { data, error } = await admin
    .from(profileTableForRole(role))
    .select('id, email, full_name, totp_secret, totp_enabled, totp_failed_attempts, totp_locked_until, is_active')
    .eq('id', userId)
    .eq('is_active', true)
    .maybeSingle();

  if (error) throw error;
  return data as Admin2faProfile | null;
}

export function isTotpLocked(profile: Pick<Admin2faProfile, 'totp_locked_until'>) {
  return Boolean(profile.totp_locked_until && new Date(profile.totp_locked_until) > new Date());
}

export async function recordTotpFailure(
  admin: SupabaseClient<Database>,
  profile: Admin2faProfile,
  role: AdminPortalRole,
) {
  const attempts = profile.totp_failed_attempts + 1;
  const lockedUntil = attempts >= MAX_TOTP_FAILURES
    ? new Date(Date.now() + TOTP_LOCK_MINUTES * 60 * 1000).toISOString()
    : null;

  await admin
    .from(profileTableForRole(role))
    .update({
      totp_failed_attempts: attempts,
      totp_locked_until: lockedUntil,
      updated_at: new Date().toISOString(),
    } as never)
    .eq('id', profile.id);

  return { attempts, lockedUntil };
}

export async function resetTotpFailures(
  admin: SupabaseClient<Database>,
  userId: string,
  role: AdminPortalRole,
  extra: Record<string, unknown> = {},
) {
  await admin
    .from(profileTableForRole(role))
    .update({
      ...extra,
      totp_failed_attempts: 0,
      totp_locked_until: null,
      updated_at: new Date().toISOString(),
    } as never)
    .eq('id', userId);
}

export async function buildVerifiedAdminSessionResponse(
  partial: AdminPartialAuthPayload,
  body: Record<string, unknown> = {},
) {
  const cookiesToSet: Array<{ name: string; value: string; options: Record<string, unknown> }> = [];
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll(cookies) {
          cookiesToSet.push(...cookies);
        },
      },
    },
  );

  const { error } = await supabase.auth.setSession({
    access_token: partial.accessToken,
    refresh_token: partial.refreshToken,
  });

  if (error) throw error;

  const response = NextResponse.json({
    ...body,
    expires_at: partial.sessionExpiresAt,
  });

  for (const { name, value, options } of cookiesToSet) {
    response.cookies.set({
      name,
      value,
      ...(options as object),
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });
  }

  const totpToken = await createTotpSessionToken(
    { userId: partial.userId, role: partial.role },
    readRequiredEnv('EUROSTORE_AUTH_COOKIE_SECRET'),
    TOTP_SESSION_TTL_SECONDS,
  );

  response.cookies.set({
    name: ADMIN_TOTP_COOKIE_NAME,
    value: totpToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: TOTP_SESSION_TTL_SECONDS,
  });

  response.cookies.set({ name: 'sb-access-token', value: '', maxAge: 0, path: '/' });
  response.cookies.set({ name: 'sb-refresh-token', value: '', maxAge: 0, path: '/' });

  return clearAdminPartialAuthCookie(response);
}
