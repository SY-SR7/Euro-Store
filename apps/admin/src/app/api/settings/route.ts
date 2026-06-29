import { NextResponse } from 'next/server';
import { createSupabaseAdminClientFromEnv } from '@eurostore/database';

type SettingUpdate = {
  key?: string;
  value?: unknown;
};

type SettingsPatchBody = {
  key?: string;
  value?: unknown;
  updates?: SettingUpdate[];
};

export async function GET() {
  try {
    const admin = createSupabaseAdminClientFromEnv();

    const { data, error } = await admin
      .from('system_settings')
      .select('key, value, description')
      .order('key');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'server_error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as SettingsPatchBody;

    const updates =
      Array.isArray(body.updates) && body.updates.length > 0
        ? body.updates
        : [{ key: body.key, value: body.value }];

    const rows = updates
      .filter((update): update is Required<SettingUpdate> => Boolean(update.key) && update.value !== undefined)
      .map((update) => ({
        key: update.key,
        value: String(update.value),
        updated_at: new Date().toISOString()
      }));

    if (rows.length === 0) {
      return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
    }

    const admin = createSupabaseAdminClientFromEnv();

    const { error } = await admin
      .from('system_settings')
      .upsert(rows as never[], { onConflict: 'key' });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'server_error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}