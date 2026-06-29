import { NextResponse } from 'next/server';
import { createSupabaseAdminClientFromEnv } from '@eurostore/database';

export async function GET() {
  try {
    const admin = createSupabaseAdminClientFromEnv();

    const { data, error } = await admin
      .from('shipping_rates')
      .select('id, governorate, base_rate_syp, free_shipping_threshold_syp, is_active')
      .order('governorate');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'server_error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}