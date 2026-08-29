import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import type { TableUpdate } from '@/lib/database-types';
import { z } from 'zod';
import { requireAdminContext, writeAuditLog } from '@/supabase-server';
import { strongPasswordSchema } from '@eurostore/shared';

const createSchema = z.object({
  business_name: z.string().trim().min(2).max(100),
  contact_name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  phone: z.string().trim().min(7).max(30),
  address_ar: z.string().trim().min(5).max(500),
  address_en: z.string().trim().max(500).optional().default(''),
  governorate: z.string().trim().min(2).max(100),
  password: strongPasswordSchema,
}).strict();
const updateSchema = z.object({
  id: z.string().uuid(),
  business_name: z.string().trim().min(2).max(100).optional(),
  contact_name: z.string().trim().min(2).max(100).optional(),
  phone: z.string().trim().min(7).max(30).optional(),
  address_ar: z.string().trim().min(5).max(500).optional(),
  address_en: z.string().trim().max(500).optional(),
  governorate: z.string().trim().min(2).max(100).optional(),
  is_active: z.boolean().optional(),
}).strict();

export const dynamic = 'force-dynamic';

export async function GET() {
  const ctx = await requireAdminContext('partner_management', 'view');
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { data, error } = await ctx.admin.from('partner_profiles').select('id, full_name, business_name, contact_name, email, phone, address, address_ar, address_en, geographic_area, governorate, is_active, created_at, updated_at').order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  const ctx = await requireAdminContext('partner_management', 'create');
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  const payload = parsed.data;

  const { data: authUser, error: authError } = await ctx.admin.auth.admin.createUser({
    email: payload.email, password: payload.password, email_confirm: true, user_metadata: { role: 'partner' },
  });
  if (authError || !authUser.user) return NextResponse.json({ error: authError?.code === 'email_exists' ? 'email_exists' : 'account_create_failed' }, { status: authError?.code === 'email_exists' ? 409 : 500 });

  const { data: profile, error: profileError } = await ctx.admin.from('partner_profiles').insert({
    id: authUser.user.id, full_name: payload.contact_name, business_name: payload.business_name,
    contact_name: payload.contact_name, email: payload.email, phone: payload.phone,
    geographic_area: payload.governorate, governorate: payload.governorate,
    address: payload.address_ar, address_ar: payload.address_ar, address_en: payload.address_en || payload.address_ar,
    created_by: ctx.userId, is_active: true,
  }).select().single();
  if (profileError || !profile) {
    await ctx.admin.auth.admin.deleteUser(authUser.user.id);
    return NextResponse.json({ error: 'profile_create_failed' }, { status: 500 });
  }

  await writeAuditLog({ admin: ctx.admin, actorId: ctx.userId, actorRole: ctx.role, action: 'partner.created', entityType: 'partner_profiles', entityId: profile.id, afterState: profile });
  return NextResponse.json({ partner: profile }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const ctx = await requireAdminContext('partner_management', 'edit');
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  const { id, ...updates } = parsed.data;
  if (!Object.keys(updates).length) return NextResponse.json({ error: 'no_changes' }, { status: 400 });

  const { data: before, error: loadError } = await ctx.admin.from('partner_profiles').select('*').eq('id', id).maybeSingle();
  if (loadError) return NextResponse.json({ error: 'database_error' }, { status: 500 });
  if (!before) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const normalized: TableUpdate<'partner_profiles'> = { ...updates, updated_at: new Date().toISOString() };
  if (updates.contact_name) normalized.full_name = updates.contact_name;
  if (updates.governorate) normalized.geographic_area = updates.governorate;
  if (updates.address_ar) normalized.address = updates.address_ar;
  const { data: profile, error } = await ctx.admin.from('partner_profiles').update(normalized).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });

  if (typeof updates.is_active === 'boolean' && updates.is_active !== before.is_active) {
    const { error: authError } = await ctx.admin.auth.admin.updateUserById(id, { ban_duration: updates.is_active ? 'none' : '876000h' });
    if (authError) {
      await ctx.admin.from('partner_profiles').update({ is_active: before.is_active }).eq('id', id);
      return NextResponse.json({ error: 'auth_status_update_failed' }, { status: 500 });
    }
  }

  await writeAuditLog({ admin: ctx.admin, actorId: ctx.userId, actorRole: ctx.role, action: 'partner.updated', entityType: 'partner_profiles', entityId: id, beforeState: before, afterState: profile });
  return NextResponse.json({ partner: profile });
}
