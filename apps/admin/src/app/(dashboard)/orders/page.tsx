import { getTranslations } from 'next-intl/server';
import OrdersQuickAdmin from './OrdersQuickAdmin';

export async function generateMetadata() {
  const t = await getTranslations('nav');
  return { title: `${t('orders')} | EuroStore Admin` };
}

export default function OrdersPage() {
  return <OrdersQuickAdmin />;
}
