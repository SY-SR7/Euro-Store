import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { createAuthAdminClient, createWritableAuthClient, jsonError } from '../_lib';

const schema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(128),
});

const failures = new Map<string, { count: number; resetAt: number }>();

function clientIp(request: NextRequest) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
}

function blocked(ip: string) {
  const record = failures.get(ip);
  if (!record) return false;
  if (Date.now() > record.resetAt) {
    failures.delete(ip);
    return false;
  }
  return record.count >= 5;
}

function recordFailure(ip: string) {
  const record = failures.get(ip);
  if (record && Date.now() <= record.resetAt) {
    failures.set(ip, { count: record.count + 1, resetAt: record.resetAt });
    return;
  }
  failures.set(ip, { count: 1, resetAt: Date.now() + 15 * 60 * 1000 });
}

export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  if (blocked(ip)) {
    return jsonError('RATE_LIMITED', 'Too many failed login attempts.', 429);
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return jsonError('VALIDATION_ERROR', 'Invalid login data.', 400);
  }

  const supabase = await createWritableAuthClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data.user || !data.session) {
    recordFailure(ip);
    return jsonError('UNAUTHORIZED', 'Invalid credentials.', 401);
  }

  const admin = createAuthAdminClient();
  const { data: profile } = await admin
    .from('customer_profiles')
    .select('id, is_blocked')
    .eq('id', data.user.id)
    .maybeSingle();

  if (!profile || profile.is_blocked) {
    await supabase.auth.signOut();
    return jsonError('FORBIDDEN', 'Customer account is not active.', 403);
  }

  failures.delete(ip);
  return Response.json({
    user_id: data.user.id,
    expires_at: data.session.expires_at,
  });
}
