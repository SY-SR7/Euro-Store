import { getTranslations } from 'next-intl/server';
import DashboardQuickAdmin from './DashboardQuickAdmin';

export async function generateMetadata() {
  const t = await getTranslations('nav');
  return { title: `${t('dashboard')} | EuroStore Admin` };
}

export default function DashboardPage() {
  return <DashboardQuickAdmin />;
}
