import { useTranslations } from 'next-intl';

interface PointsCounterProps { points: number; }
export function PointsCounter({ points }: PointsCounterProps) {
  const t = useTranslations('loyalty');
  return (
    <div className="rounded-md border border-[#2E2E2E] bg-[#151515] p-4 text-center">
      <p className="text-xs text-[#9CA3AF] mb-1">{t('title')}</p>
      <p className="text-3xl font-semibold text-[#C9A84C]">{points.toLocaleString()}</p>
    </div>
  );
}

