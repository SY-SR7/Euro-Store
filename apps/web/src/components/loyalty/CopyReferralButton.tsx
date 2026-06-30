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
        el.textContent = `✓ ${t('copied', { fallback: 'تم النسخ!' })}`;
        setTimeout(() => { el.textContent = orig; }, 2000);
      }}
      className="rounded-xl border border-[#C9A84C] px-4 py-1.5 text-xs font-bold text-[#C9A84C] hover:bg-[#C9A84C] hover:text-white transition-colors"
    >
      {t('copyCode', { fallback: 'نسخ الكود' })}
    </button>
  );
}