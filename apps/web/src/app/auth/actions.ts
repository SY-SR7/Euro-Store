'use server';

import { getFormString, strongPasswordSchema } from '@eurostore/shared';
import { redirect } from 'next/navigation';
import { createPublicSupabaseClient, getSessionClient } from '@/supabase-server';

export async function forgotPasswordAction(formData: FormData): Promise<void> {
  const email = getFormString(formData, 'email');
  if (!email) {
    redirect('/auth/forgot-password?status=invalid');
  }

  const supabase = createPublicSupabaseClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`,
  });

  if (error) {
    redirect('/auth/forgot-password?status=failed');
  }

  redirect('/auth/forgot-password?status=sent');
}

export async function resetPasswordAction(formData: FormData): Promise<void> {
  const parsed = strongPasswordSchema.safeParse(getFormString(formData, 'password'));
  if (!parsed.success) {
    redirect('/auth/reset-password?status=invalid');
  }

  const { client: supabase, user } = await getSessionClient();
  if (!user) {
    redirect('/auth/reset-password?status=failed');
  }
  const { error } = await supabase.auth.updateUser({ password: parsed.data });

  if (error) {
    redirect('/auth/reset-password?status=failed');
  }

  redirect('/auth/login?status=password_reset');
}
