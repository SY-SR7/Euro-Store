'use client';
import { useState } from 'react';
import { Download } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface DownloadQRButtonProps {
  dataUrl: string;
  customerName: string;
}

export function DownloadQRButton({ dataUrl, customerName }: DownloadQRButtonProps) {
  const t = useTranslations('loyaltyQr');
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  async function handleDownload() {
    setDownloading(true);
    setError('');
    let downloadUrl = dataUrl;
    let shouldRevoke = false;
    try {
      if (/^https?:/i.test(dataUrl)) {
        const response = await fetch(dataUrl);
        if (!response.ok) throw new Error('download_failed');
        downloadUrl = URL.createObjectURL(await response.blob());
        shouldRevoke = true;
      }
      const link = document.createElement('a');
      link.href = downloadUrl;
      const safeName = customerName.normalize('NFKD').replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'customer';
      link.download = `eurostore-loyalty-qr-${safeName}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      if (shouldRevoke) URL.revokeObjectURL(downloadUrl);
    } catch {
      setError(t('downloadError'));
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="text-center">
      <button onClick={() => { void handleDownload(); }} disabled={downloading} className="flex items-center gap-2 rounded-lg border border-primary/30 px-5 py-2 text-sm font-bold text-primary transition-colors hover:bg-primary/5">
        <Download size={16} /> {downloading ? t('downloading') : t('download')}
      </button>
      {error ? <p role="alert" className="mt-2 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
