import { getTranslations } from 'next-intl/server';
import NotificationsQuickAdmin from './NotificationsQuickAdmin';

export async function generateMetadata() {
  const t = await getTranslations('nav');
  return { title: `${t('notifications')} | EuroStore Admin` };
}

export default function NotificationsPage() {
  return <NotificationsQuickAdmin />;
}
