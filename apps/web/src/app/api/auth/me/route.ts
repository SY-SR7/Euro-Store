import { getSessionClient } from '@/supabase-server';
import { jsonError } from '../_lib';

export async function GET() {
  const { client, user } = await getSessionClient();
  if (!user) return jsonError('UNAUTHORIZED', 'Not authenticated.', 401);

  const { data: profile, error } = await client
    .from('customer_profiles')
    .select('id, full_name, email, phone, gender, loyalty_points, referral_code, wishlist_share_token, is_blocked, preferred_language')
    .eq('id', user.id)
    .maybeSingle();

  if (error) return jsonError('INTERNAL_ERROR', 'Profile could not be loaded.', 500);
  return Response.json({
    user: {
      id: user.id,
      email: user.email,
      email_confirmed_at: user.email_confirmed_at,
      created_at: user.created_at,
    },
    profile,
  });
}
