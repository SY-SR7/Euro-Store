'use client';

interface Props { code: string }

export function CopyReferralButton({ code }: Props) {
  return (
    <button
      type="button"
      onClick={() => void navigator.clipboard.writeText(code)}
      className="rounded-md bg-[#C9A84C]/10 border border-[#C9A84C]/30 px-4 py-2 text-sm text-[#C9A84C] hover:bg-[#C9A84C]/20 transition-colors"
    >
      نسخ الكود
    </button>
  );
}