import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { strongPasswordSchema } from '@eurostore/shared';
import { createWritableAuthClient, jsonError } from '../_lib';

const schema = z.object({
  password: strongPasswordSchema,
});

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return jsonError('VALIDATION_ERROR', 'Invalid password.', 400);
  }

  const supabase = await createWritableAuthClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

  if (error) return jsonError('UNAUTHORIZED', 'Password reset session is invalid or expired.', 401);
  await supabase.auth.signOut({ scope: 'global' }).catch(() => undefined);
  return Response.json({ message: 'Password reset successful.' });
}
