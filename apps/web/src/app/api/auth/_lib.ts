import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createAdminSupabaseClient } from '@/supabase-server';
import { generateLoyaltyQRToken } from '@eurostore/shared';

function supabaseUrl() {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  if (!value) throw new Error('Missing Supabase URL.');
  return value;
}

function anonKey() {
  const value = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
  if (!value) throw new Error('Missing Supabase anon key.');
  return value;
}

export async function createWritableAuthClient() {
  const jar = await cookies();
  return createServerClient(supabaseUrl(), anonKey(), {
    cookies: {
      getAll() {
        return jar.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          jar.set(name, value, options);
        });
      },
    },
  });
}

export function createAuthAdminClient() {
  return createAdminSupabaseClient();
}

export async function createLoyaltyQrObject(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  customerId: string,
): Promise<string | null> {
  try {
    const secret = process.env.LOYALTY_QR_SECRET ?? process.env.QR_SECRET ?? '';
    if (secret.length < 32) return null;
    const QRCode = await import('qrcode');
    const payload = generateLoyaltyQRToken(customerId, secret);
    const png = await QRCode.toBuffer(payload, { width: 512, margin: 2, errorCorrectionLevel: 'H' });
    const storagePath = `${customerId}/loyalty-qr.png`;
    const { error } = await admin.storage
      .from('loyalty-qr-codes')
      .upload(storagePath, png, { contentType: 'image/png', upsert: true });
    return error ? null : `loyalty-qr-codes/${storagePath}`;
  } catch {
    return null;
  }
}

export function jsonError(code: string, message: string, status: number) {
  return Response.json({ error: { code, message } }, { status });
}
