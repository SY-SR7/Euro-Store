import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { safeInternalPath } from '@eurostore/shared';
import { createAdminSupabaseClient } from '@/supabase-server';
import { createLoyaltyQrObject, createWritableAuthClient } from '../../api/auth/_lib';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const destination = safeInternalPath(requestUrl.searchParams.get('next'), '/account');

  if (code) {
    const supabase = await createWritableAuthClient();
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && session) {
      // Ensure profile exists (Google OAuth might not trigger the trigger)
      const admin = createAdminSupabaseClient();
      const { data: profile } = await admin.from('customer_profiles').select('id, is_blocked').eq('id', session.user.id).maybeSingle();
      if (profile?.is_blocked) {
        await supabase.auth.signOut();
        return NextResponse.redirect(new URL('/auth/login?status=blocked', requestUrl.origin));
      }
      if (!profile) {
        const qrCodeUrl = await createLoyaltyQrObject(admin, session.user.id);
        const cookieReferral = request.cookies.get('referral_code')?.value?.trim().toUpperCase() ?? '';
        const { error: profileError } = await admin.rpc('register_customer_profile', {
          p_customer_id: session.user.id,
          p_full_name: String(session.user.user_metadata.full_name || session.user.user_metadata.name || 'Customer'),
          p_email: session.user.email ?? '',
          p_preferred_language: request.cookies.get('EUROSTORE_LOCALE')?.value === 'en' ? 'en' : 'ar',
          ...(session.user.phone ? { p_phone: session.user.phone } : {}),
          ...(qrCodeUrl ? { p_qr_code_url: qrCodeUrl } : {}),
          ...(/^[A-Z0-9]{8,12}$/.test(cookieReferral) ? { p_referral_code: cookieReferral } : {}),
        });
        if (profileError) {
          if (qrCodeUrl) await admin.storage.from('loyalty-qr-codes').remove([qrCodeUrl.replace(/^loyalty-qr-codes\//, '')]);
          await supabase.auth.signOut();
          return NextResponse.redirect(new URL('/auth/login?status=profile_error', requestUrl.origin));
        }
      }
    }
  }

  const response = NextResponse.redirect(new URL(destination, requestUrl.origin));
  response.cookies.delete('referral_code');
  return response;
}
