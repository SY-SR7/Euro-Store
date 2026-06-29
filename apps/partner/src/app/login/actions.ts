'use server';

import { getFormString, loginSchema } from '@eurostore/shared';
import { redirect } from 'next/navigation';
import { getPartnerAccess } from '../../auth';
import { createServerSupabaseClient } from '../../supabase-server';

export async function loginPartnerAction(formData: FormData): Promise<void> {
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

  const access = await getPartnerAccess(supabase);

  if (!access) {
    await supabase.auth.signOut();
    redirect('/login?status=failed');
  }

  redirect('/');
}

export { partnerLogin as loginAction };
