import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { strongPasswordSchema } from '@eurostore/shared';
import { createAuthAdminClient, createLoyaltyQrObject, createWritableAuthClient, jsonError } from '../_lib';

const schema = z.object({
  full_name: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email(),
  password: strongPasswordSchema,
  phone: z.string().trim().min(6).max(32),
  preferred_language: z.enum(['ar', 'en']).optional().default('ar'),
  referral_code: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{8,12}$/).optional().or(z.literal('')),
});

export async function POST(request: NextRequest) {
  try {
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return jsonError('VALIDATION_ERROR', 'Invalid registration data.', 400);
    }

    const supabase = await createWritableAuthClient();
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: {
          full_name: parsed.data.full_name,
          phone: parsed.data.phone,
          role: 'customer',
        },
      },
    });

    if (error) {
      return jsonError('REGISTRATION_FAILED', 'Registration could not be completed.', 400);
    }

    if (!data.user) {
      return jsonError('INTERNAL_ERROR', 'Registration failed.', 500);
    }

    // Supabase intentionally returns an obfuscated user for an existing email.
    // Keep the response generic and never mutate an existing customer's profile.
    if (Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      return NextResponse.json({ message: 'Check your email to continue.' }, { status: 201 });
    }

    const admin = createAuthAdminClient();
    const qrCodeUrl = await createLoyaltyQrObject(admin, data.user.id);
    const cookieReferral = request.cookies.get('referral_code')?.value?.trim().toUpperCase() ?? '';
    const referral = parsed.data.referral_code || (/^[A-Z0-9]{8,12}$/.test(cookieReferral) ? cookieReferral : null);
    const { error: profileError } = await admin.rpc('register_customer_profile', {
      p_customer_id: data.user.id,
      p_full_name: parsed.data.full_name,
      p_email: parsed.data.email,
      p_preferred_language: parsed.data.preferred_language,
      ...(parsed.data.phone ? { p_phone: parsed.data.phone } : {}),
      ...(qrCodeUrl ? { p_qr_code_url: qrCodeUrl } : {}),
      ...(referral ? { p_referral_code: referral } : {}),
    });

    if (profileError) {
      if (qrCodeUrl) await admin.storage.from('loyalty-qr-codes').remove([qrCodeUrl.replace(/^loyalty-qr-codes\//, '')]);
      await admin.auth.admin.deleteUser(data.user.id);
      return jsonError('INTERNAL_ERROR', 'Registration could not be completed.', 500);
    }

    const response = NextResponse.json({
      message: 'Registration successful. Please verify your email.',
      user_id: data.user.id,
    }, { status: 201 });
    response.cookies.delete('referral_code');
    return response;
  } catch (error) {
    console.error('[POST /api/auth/register]', error);
    return jsonError('INTERNAL_ERROR', 'Server error.', 500);
  }
}
