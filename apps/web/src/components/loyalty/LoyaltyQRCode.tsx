import { MapPin } from 'lucide-react';
import { DownloadQRButton } from './DownloadQRButton';
import { useTranslations } from 'next-intl';

interface LoyaltyQRCodeProps {
  qrCodeUrl: string;
  customerName: string;
}

export function LoyaltyQRCode({ qrCodeUrl, customerName }: LoyaltyQRCodeProps) {
  const t = useTranslations('loyaltyQr');
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-background-card p-6 shadow-sm">
      <p className="text-xs font-bold uppercase text-primary">{t('title')}</p>
      <p className="text-center text-sm text-text-muted">{t('description')}</p>
      <div className="rounded-lg border-2 border-primary/20 bg-[#FFFBF5] p-3 shadow-inner">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrCodeUrl} alt={t('imageAlt', { name: customerName })} width={220} height={220} className="rounded-md" />
      </div>
      <p className="flex items-start gap-2 text-center text-xs leading-5 text-text-muted">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        {t('usageHint')}
      </p>
      <DownloadQRButton dataUrl={qrCodeUrl} customerName={customerName} />
    </div>
  );
}
