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
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    redirect('/login?status=failed');
  }

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

