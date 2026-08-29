import { NextResponse } from 'next/server';
import { createAdminSupabaseClient, getSessionClient } from '@/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { client, user } = await getSessionClient();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await client
    .from('customer_profiles')
    .select('id, qr_code_url')
    .eq('id', user.id)
    .single();

  if (error) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  let qrCodeUrl = data.qr_code_url;
  if (qrCodeUrl?.startsWith('loyalty-qr-codes/')) {
    const admin = createAdminSupabaseClient();
    const path = qrCodeUrl.replace(/^loyalty-qr-codes\//, '');
    const { data: signed } = await admin.storage
      .from('loyalty-qr-codes')
      .createSignedUrl(path, 60 * 60);
    qrCodeUrl = signed?.signedUrl ?? null;
  } else if (qrCodeUrl) {
    qrCodeUrl = null;
  }

  return NextResponse.json({
    qr_code_url: qrCodeUrl,
  });
}
