import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminSupabaseClient } from '@/supabase-server';

const schema = z.object({ email: z.string().trim().email().max(254), locale: z.enum(['ar', 'en']).default('ar'), source: z.enum(['web', 'mobile']).default('web') });

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'invalid_email' }, { status: 400 });
    const admin = createAdminSupabaseClient();
    const { error } = await (admin as any).from('newsletter_subscriptions').upsert({ email: parsed.data.email.toLowerCase(), locale: parsed.data.locale, source: parsed.data.source, is_active: true, updated_at: new Date().toISOString() }, { onConflict: 'email' });
    if (error) throw error;
    return NextResponse.json({ subscribed: true });
  } catch (error) {
    console.error('[POST /api/storefront/newsletter]', error);
    return NextResponse.json({ error: 'subscription_failed' }, { status: 500 });
  }
}
