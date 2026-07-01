import { getTranslations } from 'next-intl/server';
import ReviewsQuickAdmin from './ReviewsQuickAdmin';

export async function generateMetadata() {
  const t = await getTranslations('nav');
  return { title: `${t('reviews')} | EuroStore Admin` };
}

export default function ReviewsPage() {
  return <ReviewsQuickAdmin />;
}
