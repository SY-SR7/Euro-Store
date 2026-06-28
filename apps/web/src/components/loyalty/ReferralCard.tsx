'use client';
import { useTranslations } from 'next-intl';

interface ReferralCardProps { referralCode: string; }
export function ReferralCard({ referralCode }: ReferralCardProps) {
  const t = useTranslations('loyalty');

  function copy() { void navigator.clipboard.writeText(referralCode); }

  function share() {
    void navigator.share?.({
      text: t('referralMessage', { code: referralCode }),
    });
  }

  return (
    <div className="rounded-md border border-[#2E2E2E] bg-[#151515] p-6">
      <h3 className="text-[#C9A84C] font-serif text-2xl mb-2">{t('referralTitle')}</h3>
      <p className="text-sm text-[#9CA3AF] mb-4">{t('referralDescription')}</p>
      <div className="flex items-center gap-2">
        <span className="font-mono text-[#E2E2E2] bg-[#1C1C1C] px-3 py-2 rounded text-sm flex-1">{referralCode}</span>
        <button onClick={copy} title={t('copyCode')} className="p-2 text-[#C9A84C] hover:text-[#D8B95F] transition-colors">📋</button>
      </div>
      <button onClick={share} className="mt-4 flex items-center gap-2 text-sm text-[#C9A84C] hover:text-[#D8B95F] transition-colors">
        <span>{t('share')}</span>
      </button>
    </div>
  );
}
