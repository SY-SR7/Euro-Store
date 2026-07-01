import { getTranslations } from 'next-intl/server';
import SubAdminsQuickAdmin from './SubAdminsQuickAdmin';

export async function generateMetadata() {
  const t = await getTranslations('nav');
  return { title: `${t('subAdmins')} | EuroStore Admin` };
}

export default function SubAdminsPage() {
  return <SubAdminsQuickAdmin />;
}
