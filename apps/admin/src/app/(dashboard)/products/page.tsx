import { getTranslations } from 'next-intl/server';
import ProductQuickAdmin from './ProductQuickAdmin';

export async function generateMetadata() {
  const t = await getTranslations('nav');
  return { title: `${t('products')} | EuroStore Admin` };
}

export default function ProductsPage() {
  return <ProductQuickAdmin />;
}
