'use client';
import { useTranslations } from 'next-intl';

export function CopyReferralButton({ code }: { code: string }) {
  const t = useTranslations('loyalty');
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(code).catch(() => {});
        const el = document.activeElement as HTMLButtonElement;
        const orig = el.textContent ?? '';
        el.textContent = `✓ ${t('copied')}`;
        setTimeout(() => { el.textContent = orig; }, 2000);
      }}
      className="rounded-xl border border-primary px-4 py-1.5 text-xs font-bold text-primary hover:bg-primary hover:text-text-primary transition-colors"
    >
      {t('copyCode')}
    </button>
  );
}