import { getTranslations } from 'next-intl/server';
import AttributeTypesQuickAdmin from './AttributeTypesQuickAdmin';

export async function generateMetadata() {
  const t = await getTranslations('nav');
  return { title: `${t('attributeTypes')} | EuroStore Admin` };
}

export default function AttributeTypesPage() {
  return <AttributeTypesQuickAdmin />;
}
