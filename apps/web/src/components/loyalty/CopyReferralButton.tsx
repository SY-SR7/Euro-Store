'use client';

interface Props {
  code: string;
}

export function CopyReferralButton({ code }: Props) {
  return (
    <button
      type="button"
      onClick={() => void navigator.clipboard.writeText(code)}
      className="rounded-2xl border border-[#C9A84C]/30 bg-[#C9A84C]/10 px-4 py-2 text-sm font-black text-[#C9A84C] transition hover:bg-[#C9A84C]/20"
    >
      نسخ الكود
    </button>
  );
}