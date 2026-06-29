/// <reference lib="dom" />
'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

export function ImageUploadForm({ productId }: { productId: string }) {
  const t      = useTranslations('adminCatalog');
  const tC     = useTranslations('common');
  const router = useRouter();
  const fileRef  = useRef<HTMLInputElement>(null);
  const [preview,    setPreview]    = useState<string | null>(null);
  const [uploading,  setUploading]  = useState(false);
  const [isPrimary,  setIsPrimary]  = useState(false);
  const [msg,        setMsg]        = useState('');
  const [isError,    setIsError]    = useState(false);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = ev => setPreview(ev.target?.result as string);
    reader.readAsDataURL(f);
  }

  async function handleUpload() {
    const file = (fileRef.current as HTMLInputElement)?.files?.[0];
    if (!file) return;
    setUploading(true); setMsg(''); setIsError(false);

    const fd = new FormData();
    fd.append('image',      file);
    fd.append('is_primary', isPrimary ? 'true' : 'false');

    const res = await fetch(`/api/catalog/products/${productId}/images`, { method: 'POST', body: fd });
    if (res.ok) {
      setMsg(t('saveSuccess'));
      setPreview(null);
      if (fileRef.current) (fileRef.current as HTMLInputElement).value = '';
      router.refresh();
    } else {
      setIsError(true);
      setMsg(t('saveFailed'));
    }
    setUploading(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-[#9CA3AF]">اختر صورة (JPG / PNG / WebP — max 5 MB)</span>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif"
          onChange={handleFile}
          className="rounded border border-[#2E2E2E] bg-[#151515] px-3 py-2 text-sm text-[#9CA3AF] file:mr-3 file:rounded file:border-0 file:bg-[#C9A84C] file:px-3 file:py-1 file:text-xs file:font-semibold file:text-[#111] file:cursor-pointer" />
      </label>

      {preview && (
        <img src={preview} alt="preview" className="aspect-square w-full max-w-[200px] rounded-md border border-[#2E2E2E] object-cover" />
      )}

      <label className="flex items-center gap-2 text-sm text-[#9CA3AF] cursor-pointer">
        <input type="checkbox" checked={isPrimary} onChange={e => setIsPrimary(e.target.checked)} className="accent-[#C9A84C]" />
        صورة رئيسية
      </label>

      {msg && <p className={`text-sm ${isError ? 'text-red-400' : 'text-[#C9A84C]'}`}>{msg}</p>}

      <button onClick={handleUpload} disabled={uploading || !preview}
        className="rounded-sm bg-[#C9A84C] px-5 py-2.5 text-sm font-semibold text-[#111] hover:bg-[#D8B95F] transition-colors disabled:opacity-50">
        {uploading ? tC('loading') : t('imageUpload')}
      </button>
    </div>
  );
}