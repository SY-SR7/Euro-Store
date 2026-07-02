import { requireAdminContext } from '@/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function findEmail(value: unknown): string {
  if (!isObject(value)) return '';

  for (const key of ['email', 'admin_email', 'user_email']) {
    const candidate = value[key];
    if (typeof candidate === 'string' && candidate.includes('@')) return candidate;
  }

  for (const child of Object.values(value)) {
    const email = findEmail(child);
    if (email) return email;
  }

  return '';
}

function decodeEmailFromJwt(token: string): string {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return '';

    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')) as unknown;
    return findEmail(payload);
  } catch {
    return '';
  }
}

function inferEmail(request: NextRequest): string {
  for (const header of ['x-admin-email', 'x-user-email', 'x-email']) {
    const value = request.headers.get(header);
    if (value && value.includes('@')) return value;
  }

  for (const cookie of request.cookies.getAll()) {
    if (/email/i.test(cookie.name) && cookie.value.includes('@')) {
      return decodeURIComponent(cookie.value);
    }

    const tokenEmail = decodeEmailFromJwt(cookie.value);
    if (tokenEmail) return tokenEmail;
  }

  return 'unknown-admin@local';
}

export async function GET(request: NextRequest) {
  const ctx = await requireAdminContext();
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  return NextResponse.json({
    email: inferEmail(request),
  });
}