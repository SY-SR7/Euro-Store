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
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  const access = error ? null : await getHelperAccess(supabase);

  if (error || !access) {
    if (!error) await supabase.auth.signOut();
    redirect('/login?status=failed');
  }

  redirect('/dashboard');
}


export { loginHelperAction as loginAction };

