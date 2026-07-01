import { getTranslations } from 'next-intl/server';
import SettingsQuickAdmin from './SettingsQuickAdmin';

export async function generateMetadata() {
  const t = await getTranslations('nav');
  return { title: `${t('settings')} | EuroStore Admin` };
}

export default function SettingsPage() {
  return <SettingsQuickAdmin />;
}
