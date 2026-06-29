import type { EurostoreSupabaseClient } from '@eurostore/database';
import { USER_ROLES, type AdminPortalRole } from '@eurostore/shared';

export interface AdminAccess {
  userId: string;
  email: string;
  fullName: string;
  role: AdminPortalRole;
  totpEnabled: boolean;
  totpSecret: string | null;
}

export async function getAdminAccess(supabase: EurostoreSupabaseClient): Promise<AdminAccess | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return null;
  }

  const adminResult = await supabase
    .from('admin_profiles')
    .select('id, email, full_name, totp_enabled, totp_secret, is_active')
    .eq('id', user.id)
    .eq('is_active', true)
    .maybeSingle();

  if (adminResult.data) {
    return {
      userId: adminResult.data.id,
      email: adminResult.data.email,
      fullName: adminResult.data.full_name,
      role: USER_ROLES.ADMIN,
      totpEnabled: adminResult.data.totp_enabled,
      totpSecret: adminResult.data.totp_secret,
    };
  }

  const subAdminResult = await supabase
    .from('sub_admin_profiles')
    .select('id, email, full_name, totp_enabled, totp_secret, is_active')
    .eq('id', user.id)
    .eq('is_active', true)
    .maybeSingle();

  if (!subAdminResult.data) {
    return null;
  }

  return {
    userId: subAdminResult.data.id,
    email: subAdminResult.data.email,
    fullName: subAdminResult.data.full_name,
    role: USER_ROLES.SUB_ADMIN,
    totpEnabled: subAdminResult.data.totp_enabled,
    totpSecret: subAdminResult.data.totp_secret,
  };
}

