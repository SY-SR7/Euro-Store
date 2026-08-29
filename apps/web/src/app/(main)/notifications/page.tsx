import { redirect } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { getSessionClient } from '@/supabase-server';
import { NotificationsClient } from './NotificationsClient';

export const dynamic = 'force-dynamic';

export default async function NotificationsPage() {
  const [{ user }, locale] = await Promise.all([getSessionClient(), getLocale()]);
  if (!user) redirect('/auth/login?next=%2Fnotifications');
  return <NotificationsClient isAr={locale === 'ar'} />;
}
