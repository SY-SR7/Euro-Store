import { createWritableAuthClient, jsonError } from '../_lib';

export async function POST() {
  const supabase = await createWritableAuthClient();
  const { data, error } = await supabase.auth.refreshSession();

  if (error || !data.session) {
    return jsonError('UNAUTHORIZED', 'Refresh token invalid or expired.', 401);
  }

  return Response.json({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_at: data.session.expires_at,
  });
}
