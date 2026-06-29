'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export function ImageUploadForm({ productId }: { productId: string }) {
  const router  = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview,   setPreview]   = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isPrimary, setIsPrimary] = useState(false);
  const [msg,       setMsg]       = useState('');
  const [isError,   setIsError]   = useState(false);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = ev => setPreview(ev.target?.result as string);
    reader.readAsDataURL(f);
  }

  async function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setUploading(true); setMsg(''); setIsError(false);
    const fd = new FormData();
    fd.append('image',      file);
    fd.append('is_primary', isPrimary ? 'true' : 'false');
    const res = await fetch(`/api/catalog/products/${productId}/images`, { method: 'POST', body: fd });
    if (res.ok) {
      setMsg('تم رفع الصورة بنجاح ✓');
      setPreview(null);
      setIsPrimary(false);
      if (fileRef.current) fileRef.current.value = '';
      router.refresh();
    } else {
      setIsError(true);
      setMsg('فشل رفع الصورة');
    }
    setUploading(false);
  }

  return (
    <div className="flex flex-col gap-5">
      {/* File input */}
      <div>
        <p className="mb-2 text-xs text-[#6F6658]">اختر صورة (JPG / PNG / WebP — max 5 MB)</p>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          onChange={handleFile}
          className="w-full rounded-xl border border-[#E8DCC3] bg-[#FFFDF8] px-3 py-2.5 text-sm text-[#6F6658]
            file:mr-3 file:cursor-pointer file:rounded-lg file:border-0
            file:bg-[#C9A84C] file:px-4 file:py-1.5 file:text-xs file:font-black file:text-[#111]
            hover:border-[#C9A84C]/50 transition-colors"
        />
      </div>

      {/* Preview */}
      {preview && (
        <div className="overflow-hidden rounded-2xl border border-[#E8DCC3]">
          <img src={preview} alt="معاينة" className="aspect-square w-full object-cover" />
        </div>
      )}

      {/* Primary toggle */}
      <label className="flex cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          checked={isPrimary}
          onChange={e => setIsPrimary(e.target.checked)}
          className="h-4 w-4 accent-[#C9A84C]"
        />
        <span className="text-sm text-[#1F1B16]">صورة رئيسية</span>
      </label>

      {/* Status */}
      {msg && (
        <p className={`rounded-xl p-3 text-sm ${isError ? 'bg-red-900/20 text-red-400' : 'bg-green-900/20 text-green-400'}`}>
          {msg}
        </p>
      )}

      {/* Upload button */}
      <button
        onClick={handleUpload}
        disabled={uploading || !preview}
        className="w-full rounded-2xl bg-[#C9A84C] py-3 text-sm font-black text-[#111] hover:bg-[#D8B95F] transition-colors disabled:opacity-40"
      >
        {uploading ? 'جاري الرفع...' : 'رفع الصورة'}
      </button>
    </div>
  );
}