import { getTranslations } from 'next-intl/server';
import BrandsQuickAdmin from './BrandsQuickAdmin';

export async function generateMetadata() {
  const t = await getTranslations('nav');
  return { title: `${t('brands')} | EuroStore Admin` };
}

export default function BrandsPage() {
  return <BrandsQuickAdmin />;
}
