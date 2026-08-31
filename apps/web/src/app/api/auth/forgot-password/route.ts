import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { createWritableAuthClient, jsonError } from '../_lib';

const schema = z.object({
  email: z.string().trim().toLowerCase().email(),
  platform: z.enum(['web', 'mobile']).optional().default('web'),
});

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return jsonError('VALIDATION_ERROR', 'Invalid email.', 400);
  }

  const supabase = await createWritableAuthClient();
  const redirectTo = parsed.data.platform === 'mobile'
    ? 'eurostore://reset-password'
    : `${process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin}/auth/callback?next=/auth/reset-password`;
  await supabase.auth.resetPasswordForEmail(parsed.data.email, { redirectTo });

  // Keep this response identical for existing and unknown addresses.
  return Response.json({ message: 'If the account exists, a password reset email will be sent.' });
}
