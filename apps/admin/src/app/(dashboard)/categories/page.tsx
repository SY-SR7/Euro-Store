import { getTranslations } from 'next-intl/server';
import CategoriesQuickAdmin from './CategoriesQuickAdmin';

export async function generateMetadata() {
  const t = await getTranslations('nav');
  return { title: `${t('categories')} | EuroStore Admin` };
}

export default function CategoriesPage() {
  return <CategoriesQuickAdmin />;
}
