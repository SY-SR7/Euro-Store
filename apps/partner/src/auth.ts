import type { EurostoreSupabaseClient } from '@eurostore/database';

export interface PartnerAccess {
  userId: string;
  email: string;
  businessName: string;
  contactName: string;
  governorate: string;
}

export async function getPartnerAccess(supabase: EurostoreSupabaseClient): Promise<PartnerAccess | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return null;
  }

  const result = await supabase
    .from('partner_profiles')
    .select('id, email, business_name, contact_name, governorate, is_active')
    .eq('id', user.id)
    .eq('is_active', true)
    .maybeSingle();

  if (!result.data) {
    return null;
  }

  return {
    userId: result.data.id,
    email: result.data.email,
    businessName: result.data.business_name,
    contactName: result.data.contact_name,
    governorate: result.data.governorate,
  };
}
