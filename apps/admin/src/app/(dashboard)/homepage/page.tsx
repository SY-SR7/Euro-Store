import { getTranslations } from 'next-intl/server';
import HomepageQuickAdmin from './HomepageQuickAdmin';

export async function generateMetadata() {
  const t = await getTranslations('nav');
  return { title: `${t('homepage')} | EuroStore Admin` };
}

export default function HomepagePage() {
  return <HomepageQuickAdmin />;
}
