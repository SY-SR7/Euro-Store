'use server';

import { getFormString, loginSchema } from '@eurostore/shared';
import { redirect } from 'next/navigation';
import { getHelperAccess } from '../../../auth';
import { createServerSupabaseClient } from '../../../supabase-server';

export async function loginHelperAction(formData: FormData): Promise<void> {
  const parsed = loginSchema.safeParse({
    email: getFormString(formData, 'email'),
    password: getFormString(formData, 'password'),
  });

  if (!parsed.success) {
    redirect('/login?status=invalid');
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  const access = getHelperAccess(data?.user);

  if (!access) {
    await supabase.auth.signOut();
    redirect('/login?status=failed');
  }

  redirect('/');
}


export { loginHelperAction as loginAction };

