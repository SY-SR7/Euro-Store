import { useTranslations } from 'next-intl';

interface PointsCounterProps { points: number; }
export function PointsCounter({ points }: PointsCounterProps) {
  const t = useTranslations('loyalty');
  return (
    <div className="rounded-md border border-border bg-background-card p-4 text-center">
      <p className="text-xs text-[#6F6658] mb-1">{t('title')}</p>
      <p className="text-3xl font-semibold text-primary">{points.toLocaleString()}</p>
    </div>
  );
}

