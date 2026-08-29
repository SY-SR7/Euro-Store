import { createAdminSupabaseClient, getSessionClient } from '@/supabase-server';

export async function requireCustomer() {
  const { user } = await getSessionClient();
  if (!user) return null;
  return { user, admin: createAdminSupabaseClient() };
}
