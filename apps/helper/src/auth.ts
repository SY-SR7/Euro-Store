import type { EurostoreSupabaseClient } from '@eurostore/database';

export interface HelperAccess {
  userId: string;
  email: string;
  fullName: string;
  branchName: string;
}

export async function getHelperAccess(supabase: EurostoreSupabaseClient): Promise<HelperAccess | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return null;
  }

  const result = await supabase
    .from('helper_profiles')
    .select('id, email, full_name, branch_name, is_active')
    .eq('id', user.id)
    .eq('is_active', true)
    .maybeSingle();

  if (!result.data) {
    return null;
  }

  return {
    userId: result.data.id,
    email: result.data.email,
    fullName: result.data.full_name,
    branchName: result.data.branch_name,
  };
}
