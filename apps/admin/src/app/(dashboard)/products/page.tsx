import { getTranslations } from 'next-intl/server';
import ProductsQuickAdmin from './ProductsQuickAdmin';

export async function generateMetadata() {
  const t = await getTranslations('nav');
  return { title: `${t('products')} | EuroStore Admin` };
}

export default function ProductsPage() {
  return <ProductsQuickAdmin />;
}
