import { getTranslations } from 'next-intl/server';
import ExchangesQuickAdmin from './ExchangesQuickAdmin';

export async function generateMetadata() {
  const t = await getTranslations('nav');
  return { title: `${t('exchanges')} | EuroStore Admin` };
}

export default function ExchangesPage() {
  return <ExchangesQuickAdmin />;
}
