import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSupabaseServerClientFromEnv, createSupabaseAdminClientFromEnv } from '@eurostore/database';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase    = createSupabaseServerClientFromEnv(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = createSupabaseAdminClientFromEnv();
    const { data: helper } = await admin
      .from('helper_profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();
    if (!helper) return NextResponse.json({ error: 'Not a helper' }, { status: 403 });

    const body = await req.json() as { customer_id?: string; points?: number; description?: string };
    if (!body.customer_id || !body.points || body.points <= 0)
      return NextResponse.json({ error: 'customer_id and positive points required' }, { status: 400 });

    // Use atomic RPC to avoid race conditions on loyalty_points
    const { error } = await admin.rpc('award_loyalty_points', {
      p_customer_id : body.customer_id,
      p_points      : body.points,
      p_type        : 'admin_grant',
      p_description : body.description ?? 'منح نقاط من المندوب',
      p_reference_id: null,
    });

    if (error) throw error;

    await admin.from('audit_logs').insert({
      actor_id  : user.id,
      actor_role: 'helper',
      action    : 'loyalty.points.granted',
      entity_id  : body.customer_id,
      metadata  : { points: body.points },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Grant loyalty error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}




