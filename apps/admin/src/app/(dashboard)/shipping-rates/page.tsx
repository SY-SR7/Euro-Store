import { getTranslations } from 'next-intl/server';
import ShippingRatesQuickAdmin from './ShippingRatesQuickAdmin';

export async function generateMetadata() {
  const t = await getTranslations('nav');
  return { title: `${t('shippingRates')} | EuroStore Admin` };
}

export default function ShippingRatesPage() {
  return <ShippingRatesQuickAdmin />;
}
