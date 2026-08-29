import { NextResponse } from 'next/server';
import { getSessionClient } from '@/supabase-server';
import { z } from 'zod';

const profileSchema = z.object({
  full_name: z.string().trim().min(2).max(120).optional(),
  phone: z.string().trim().min(7).max(32).optional(),
  gender: z.enum(['male', 'female']).nullable().optional(),
}).strict().refine((value) => Object.keys(value).length > 0);

export async function GET() {
  const { client: supabase, user } = await getSessionClient();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('customer_profiles')
    .select('id, full_name, email, phone, preferred_language, gender, loyalty_points, referral_code')
    .eq('id', user.id)
    .single();

  if (error) return NextResponse.json({ error: 'profile_not_found' }, { status: 404 });
  return NextResponse.json({ profile: data });
}

export async function PATCH(req: Request) {
  const { client: supabase, user } = await getSessionClient();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const parsed = profileSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });

    const { data, error } = await supabase
      .from('customer_profiles')
      .update(parsed.data)
      .eq('id', user.id)
      .select('id, full_name, email, phone, avatar_url, preferred_language, gender')
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'database_error' }, { status: 500 });
  }
}
