import { getTranslations } from 'next-intl/server';
import DiscountsQuickAdmin from './DiscountsQuickAdmin';

export async function generateMetadata() {
  const t = await getTranslations('nav');
  return { title: `${t('discounts')} | EuroStore Admin` };
}

export default function DiscountsPage() {
  return <DiscountsQuickAdmin />;
}
