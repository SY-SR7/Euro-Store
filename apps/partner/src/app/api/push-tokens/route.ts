import { NextResponse } from 'next/server';
import { createSupabaseAdminClientFromEnv } from '@eurostore/database';
import { getPartnerAccess } from '@/auth';
import { createServerSupabaseClient } from '@/supabase-server';
import { z } from 'zod';

const schema = z.object({
  token: z.string().min(3).max(4096),
  platform: z.enum(['ios', 'android', 'web']).default('web'),
}).strict();

export async function POST(request: Request) {
  const session = await createServerSupabaseClient();
  const partner = await getPartnerAccess(session);
  if (!partner) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });

  const admin = createSupabaseAdminClientFromEnv();
  const { error } = await admin.from('push_notification_tokens').upsert({
    customer_id: null,
    user_id: partner.userId,
    user_role: 'partner',
    token: parsed.data.token,
    platform: parsed.data.platform,
  }, { onConflict: 'token' });

  if (error) return NextResponse.json({ error: 'token_registration_failed' }, { status: 500 });
  return NextResponse.json({ success: true }, { status: 201 });
}

export async function DELETE(request: Request) {
  const session = await createServerSupabaseClient();
  const partner = await getPartnerAccess(session);
  if (!partner) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });

  const admin = createSupabaseAdminClientFromEnv();
  const { error } = await admin.from('push_notification_tokens').delete()
    .eq('user_id', partner.userId)
    .eq('user_role', 'partner')
    .eq('token', parsed.data.token);
  if (error) return NextResponse.json({ error: 'token_removal_failed' }, { status: 500 });
  return NextResponse.json({ success: true });
}
