import { NextResponse } from 'next/server';
import { createSupabaseAdminClientFromEnv } from '@eurostore/database';

interface Params {
  params: {
    id: string;
  };
}

type ShippingRatePatch = {
  base_rate_syp?: number;
  free_shipping_threshold_syp?: number | null;
  is_active?: boolean;
};

export async function PATCH(request: Request, { params }: Params) {
  try {
    const body = (await request.json()) as ShippingRatePatch;

    const update: Record<string, number | boolean | null> = {};

    if (body.base_rate_syp !== undefined) {
      update.base_rate_syp = body.base_rate_syp;
    }

    if (body.free_shipping_threshold_syp !== undefined) {
      update.free_shipping_threshold_syp = body.free_shipping_threshold_syp;
    }

    if (body.is_active !== undefined) {
      update.is_active = body.is_active;
    }

    const admin = createSupabaseAdminClientFromEnv();

    const { data, error } = await admin
      .from('shipping_rates')
      .update(update as never)
      .eq('id', params.id)
      .select('id, governorate, base_rate_syp, free_shipping_threshold_syp, is_active')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'server_error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}