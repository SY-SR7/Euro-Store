import type { EurostoreSupabaseClient } from '@eurostore/database';

export interface HelperAccess {
  userId: string;
  email: string;
  fullName: string;
}

export async function getHelperAccess(supabase: EurostoreSupabaseClient): Promise<HelperAccess | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return null;

  const { data: helper } = await supabase
    .from('helper_profiles')
    .select('id, email, full_name, is_active')
    .eq('id', user.id)
    .eq('is_active', true)
    .maybeSingle();

  if (!helper) return null;
  return { userId: helper.id, email: helper.email, fullName: helper.full_name };
}
