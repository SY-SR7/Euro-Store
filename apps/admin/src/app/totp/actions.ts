/// <reference lib="dom" />
'use server';

import { createSupabaseAdminClientFromEnv } from '@eurostore/database';
import {
  ADMIN_TOTP_COOKIE_NAME,
  buildTotpUri,
  createTotpSessionToken,
  generateTotpSecret,
  getFormString,
  readRequiredEnv,
  totpCodeSchema,
  verifyTotpCode,
} from '@eurostore/shared';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAdminAccess, type AdminAccess } from '../../auth';
import { createServerSupabaseClient } from '../../supabase-server';

const TOTP_SESSION_TTL_SECONDS = 12 * 60 * 60;

export interface TotpSetupState {
  accountName: string;
  issuer: string;
  secret: string;
  uri: string;
}

function profileTableFor(access: AdminAccess): 'admin_profiles' | 'sub_admin_profiles' {
  return access.role === 'admin' ? 'admin_profiles' : 'sub_admin_profiles';
}

async function updateTotpProfile(access: AdminAccess, values: { totp_secret?: string; totp_enabled?: boolean }) {
  const admin = createSupabaseAdminClientFromEnv();
  const { error } = await admin.from(profileTableFor(access)).update(values).eq('id', access.userId);

  if (error) {
    throw new Error('Unable to update TOTP profile.');
  }
}

export async function getOrCreateTotpSetup(): Promise<TotpSetupState> {
  const supabase = await createServerSupabaseClient();
  const access = await getAdminAccess(supabase);

  if (!access) {
    redirect('/login');
  }

  if (access.totpEnabled) {
    redirect('/totp/verify');
  }

  const secret = access.totpSecret ?? generateTotpSecret();

  if (!access.totpSecret) {
    await updateTotpProfile(access, { totp_secret: secret });
  }

  const issuer = readRequiredEnv('EUROSTORE_AUTH_TOTP_ISSUER');

  return {
    accountName: access.email,
    issuer,
    secret,
    uri: buildTotpUri(access.email, issuer, secret),
  };
}

export async function verifyTotpAction(formData: FormData): Promise<void> {
  const parsed = totpCodeSchema.safeParse({
    code: getFormString(formData, 'code'),
  });

  if (!parsed.success) {
    redirect('/totp/verify?status=invalid');
  }

  const supabase = await createServerSupabaseClient();
  const access = await getAdminAccess(supabase);

  if (!access) {
    redirect('/login');
  }

  if (!access.totpSecret) {
    redirect('/totp/setup');
  }

  if (!verifyTotpCode(access.totpSecret, parsed.data.code)) {
    redirect('/totp/verify?status=failed');
  }

  if (!access.totpEnabled) {
    await updateTotpProfile(access, { totp_enabled: true });
  }

  const token = await createTotpSessionToken(
    { userId: access.userId, role: access.role },
    readRequiredEnv('EUROSTORE_AUTH_COOKIE_SECRET'),
    TOTP_SESSION_TTL_SECONDS
  );

  cookies().set({
    name: ADMIN_TOTP_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: TOTP_SESSION_TTL_SECONDS,
  });

  redirect('/');
}

