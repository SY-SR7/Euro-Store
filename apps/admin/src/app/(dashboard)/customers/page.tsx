import { getTranslations } from 'next-intl/server';
import CustomersQuickAdmin from './CustomersQuickAdmin';

export async function generateMetadata() {
  const t = await getTranslations('nav');
  return { title: `${t('customers')} | EuroStore Admin` };
}

export default function CustomersPage() {
  return <CustomersQuickAdmin />;
}
