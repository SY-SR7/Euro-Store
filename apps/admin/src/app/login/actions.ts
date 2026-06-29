/// <reference lib="dom" />
'use server';

import { getFormString, loginSchema } from '@eurostore/shared';
import { redirect } from 'next/navigation';
import { getAdminAccess } from '../../auth';
import { createServerSupabaseClient } from '../../supabase-server';

export async function loginAdminAction(formData: FormData): Promise<void> {
  const parsed = loginSchema.safeParse({
    email: getFormString(formData, 'email'),
    password: getFormString(formData, 'password'),
  });

  if (!parsed.success) {
    redirect('/login?status=invalid');
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error || !data.session) {
    redirect('/login?status=failed');
  }

  const cookieStore = await import('next/headers').then(m => m.cookies());
  
  cookieStore.set('sb-access-token', data.session.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: data.session.expires_in,
  });

  cookieStore.set('sb-refresh-token', data.session.refresh_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  const access = await getAdminAccess(supabase);

  if (!access) {
    await supabase.auth.signOut();
    redirect('/login?status=failed');
  }

  if (!access.totpEnabled) {
    redirect('/totp/setup');
  }

  redirect('/totp/verify');
}

