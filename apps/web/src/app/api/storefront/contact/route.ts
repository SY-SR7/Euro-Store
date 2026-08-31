import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminSupabaseClient, getSessionClient } from '@/supabase-server';

export const dynamic = 'force-dynamic';

const payloadSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  message: z.string().trim().min(10).max(4000),
});

export async function GET() {
  try {
    const admin = createAdminSupabaseClient();
    const { data, error } = await admin.from('system_settings').select('key, value').in('key', ['contact_whatsapp', 'contact_email']);
    if (error) throw error;
    const settings = { contact_whatsapp: '963000000000', contact_email: 'support@eurostore.com' };
    for (const row of data ?? []) {
      if (row.key in settings && row.value) settings[row.key as keyof typeof settings] = String(row.value);
    }
    return NextResponse.json(settings);
  } catch (error) {
    console.error('[GET /api/storefront/contact]', error);
    return NextResponse.json({ error: 'contact_settings_unavailable' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const parsed = payloadSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'invalid_contact_message' }, { status: 400 });
    const { user } = await getSessionClient();
    const admin = createAdminSupabaseClient();
    const { data, error } = await (admin as any).from('support_messages').insert({ ...parsed.data, customer_id: user?.id ?? null }).select('id').single();
    if (error) throw error;
    return NextResponse.json({ id: data.id, status: 'received' }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/storefront/contact]', error);
    return NextResponse.json({ error: 'contact_message_failed' }, { status: 500 });
  }
}
