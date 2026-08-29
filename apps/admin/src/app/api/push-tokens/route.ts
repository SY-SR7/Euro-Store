import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAdminPortalContext } from '@/supabase-server';

const schema = z.object({
  token: z.string().min(3).max(4096),
  platform: z.enum(['ios', 'android', 'web']).default('web'),
});

export async function POST(request: Request) {
  const context = await getAdminPortalContext();
  if (!context) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });

  const { error } = await context.admin.from('push_notification_tokens').upsert({
    customer_id: null,
    user_id: context.userId,
    user_role: context.role,
    token: parsed.data.token,
    platform: parsed.data.platform,
  }, { onConflict: 'token' });

  if (error) return NextResponse.json({ error: 'token_registration_failed' }, { status: 500 });
  return NextResponse.json({ success: true }, { status: 201 });
}

export async function DELETE(request: Request) {
  const context = await getAdminPortalContext();
  if (!context) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });

  const { error } = await context.admin.from('push_notification_tokens').delete()
    .eq('user_id', context.userId)
    .eq('user_role', context.role)
    .eq('token', parsed.data.token);
  if (error) return NextResponse.json({ error: 'token_removal_failed' }, { status: 500 });
  return NextResponse.json({ success: true });
}
