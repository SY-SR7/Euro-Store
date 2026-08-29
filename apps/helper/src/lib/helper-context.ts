import { createSupabaseAdminClientFromEnv } from '@eurostore/database';
import { createServerSupabaseClient } from '@/supabase-server';

export async function requireHelperContext() {
  const sessionClient = await createServerSupabaseClient();
  const { data: { user } } = await sessionClient.auth.getUser();
  if (!user) return null;
  const admin = createSupabaseAdminClientFromEnv();
  const { data: helper, error } = await admin.from('helper_profiles').select('id, full_name, email, branch_name, is_active').eq('id', user.id).eq('is_active', true).maybeSingle();
  if (error || !helper) return null;
  return { admin, user, helper };
}

