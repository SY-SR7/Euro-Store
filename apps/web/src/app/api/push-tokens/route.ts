import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminSupabaseClient, getSessionClient } from '@/supabase-server';

const schema = z.object({
  expo_push_token: z.string().min(3).max(4096).optional(),
  token: z.string().min(3).max(4096).optional(),
  device_type: z.enum(['ios', 'android', 'web']).optional(),
  platform: z.enum(['ios', 'android', 'web']).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const { user } = await getSessionClient();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
    }

    const token = parsed.data.expo_push_token ?? parsed.data.token;
    const platform = parsed.data.device_type ?? parsed.data.platform ?? 'web';
    if (!token) return NextResponse.json({ error: 'token_required' }, { status: 400 });

    const admin = createAdminSupabaseClient();
    const { data, error } = await admin
      .from('push_notification_tokens')
      .upsert({ customer_id: user.id, user_id: user.id, user_role: 'customer', token, platform } as never, { onConflict: 'token' })
      .select('*')
      .single();

    if (error) throw error;
    return NextResponse.json({ token: data }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/push-tokens]', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { user } = await getSessionClient();
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    const parsed = schema.safeParse(await request.json().catch(() => null));
    const token = parsed.success ? parsed.data.expo_push_token ?? parsed.data.token : null;
    if (!token) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });

    const admin = createAdminSupabaseClient();
    const { error } = await admin.from('push_notification_tokens').delete()
      .eq('user_id', user.id)
      .eq('user_role', 'customer')
      .eq('token', token);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/push-tokens]', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
