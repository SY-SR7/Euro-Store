import { getTranslations } from 'next-intl/server';
import AuditLogsQuickAdmin from './AuditLogsQuickAdmin';

export async function generateMetadata() {
  const t = await getTranslations('nav');
  return { title: `${t('auditLogs')} | EuroStore Admin` };
}

export default function AuditLogsPage() {
  return <AuditLogsQuickAdmin />;
}
