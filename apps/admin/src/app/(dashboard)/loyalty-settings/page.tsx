import { getTranslations } from 'next-intl/server';
import LoyaltySettingsQuickAdmin from './LoyaltySettingsQuickAdmin';

export async function generateMetadata() {
  const t = await getTranslations('nav');
  return { title: `${t('loyaltySettings')} | EuroStore Admin` };
}

export default function LoyaltySettingsPage() {
  return <LoyaltySettingsQuickAdmin />;
}
