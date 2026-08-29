import { timingSafeEqual } from 'crypto';
import { NextResponse } from 'next/server';
import { dispatchPendingNotifications } from '@eurostore/database';
import { createAdminSupabaseClient } from '@/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const expected = process.env.NOTIFICATION_DISPATCH_SECRET?.trim() || process.env.CRON_SECRET?.trim() || '';
  const authorization = request.headers.get('authorization') ?? '';
  const received = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  if (expected.length < 32) {
    return NextResponse.json({ error: 'dispatcher_not_configured' }, { status: 503 });
  }
  if (!constantTimeMatch(expected, received)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const result = await dispatchPendingNotifications(createAdminSupabaseClient(), 250);
  if (result.error) return NextResponse.json({ error: 'dispatch_failed' }, { status: 500 });
  return NextResponse.json({ dispatched: result.dispatched });
}

function constantTimeMatch(expected: string, received: string): boolean {
  const expectedBytes = Buffer.from(expected);
  const receivedBytes = Buffer.from(received);
  return expectedBytes.length === receivedBytes.length && timingSafeEqual(expectedBytes, receivedBytes);
}
