import { NextResponse } from 'next/server';
import { getAdminPortalContext } from '@/supabase-server';

export async function GET() {
  const context = await getAdminPortalContext();
  if (!context) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    role: context.role,
    permissions: context.permissions.map(({ module, permission_level }) => ({
      module,
      permission_level,
    })),
  }, {
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
