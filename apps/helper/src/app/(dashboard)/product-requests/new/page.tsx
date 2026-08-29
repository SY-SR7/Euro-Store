/// <reference lib="dom" />
'use client';
import { useState, useRef } from 'react';
import { Paperclip, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

interface Category { id: string; name_ar: string; name_en: string; }
interface SubmitResult { ok: boolean; msg: string; }

export default function HelperProductRequestsPage() {
  const t = useTranslations('helper');
  const locale = useLocale();
  const [nameAr,     setNameAr]     = useState('');
  const [nameEn,     setNameEn]     = useState('');
  const [desc,       setDesc]       = useState('');
  const [catId,      setCatId]      = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [catsLoaded, setCatsLoaded] = useState(false);
  const [images,     setImages]     = useState<File[]>([]);
  const [previews,   setPreviews]   = useState<string[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [result,     setResult]     = useState<SubmitResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function loadCategories() {
    if (catsLoaded) return;
    try {
      const res  = await fetch('/api/helper/categories');
      const data = await res.json() as Category[];
      setCategories(Array.isArray(data) ? data : []);
      setCatsLoaded(true);
    } catch {
      setResult({ ok: false, msg: t('categoriesLoadError') });
    }
  }

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const selected = Array.from(files);
    const valid = selected.filter((file) =>
      ['image/jpeg', 'image/png', 'image/webp'].includes(file.type) && file.size <= 5 * 1024 * 1024
    ).slice(0, 5 - images.length);
    if (valid.length !== selected.length) setResult({ ok: false, msg: t('invalidProductImages') });
    setImages(prev => [...prev, ...valid]);
    valid.forEach(f => {
      const reader = new FileReader();
      reader.onload = e => setPreviews(prev => [...prev, e.target?.result as string]);
      reader.readAsDataURL(f);
    });
  }

  function removeImage(i: number) {
    setImages(prev => prev.filter((_, idx) => idx !== i));
    setPreviews(prev => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nameAr.trim()) { setResult({ ok: false, msg: t('productNameArRequired') }); return; }
    setLoading(true); setResult(null);
    try {
      const form = new FormData();
      form.set('product_name_ar', nameAr.trim());
      form.set('product_name_en', nameEn.trim());
      form.set('description', desc.trim());
      form.set('suggested_category_id', catId);
      images.forEach((image) => form.append('images', image));
      const res = await fetch('/api/helper/product-requests', {
        method: 'POST',
        body: form,
      });
      if (res.ok) {
        setResult({ ok: true, msg: t('productRequestSubmitted') });
        setNameAr(''); setNameEn(''); setDesc(''); setCatId(''); setImages([]); setPreviews([]);
      } else {
        setResult({ ok: false, msg: t('productRequestError') });
      }
    } catch {
      setResult({ ok: false, msg: t('serverConnectionError') });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0F0F0F] px-6 py-10 text-[#E2E2E2]">
      <div className="mx-auto max-w-xl">
        <h1 className="text-2xl font-semibold mb-2">{t('newProductRequest')}</h1>
        <p className="text-sm text-[#9CA3AF] mb-8">{t('newProductRequestDescription')}</p>

        {result && (
          <div className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
            result.ok ? 'bg-green-900/30 border-green-700 text-green-300' : 'bg-red-900/30 border-red-700 text-red-300'
          }`}>
            {result.msg}
          </div>
        )}

        <form onSubmit={(event) => { void handleSubmit(event); }} className="space-y-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="product-name-ar" className="text-sm text-[#9CA3AF]">{t('productNameAr')} <span className="text-red-400">*</span></label>
            <input
              id="product-name-ar"
              value={nameAr} onChange={e => setNameAr(e.currentTarget.value)}
              className="rounded-xl border border-[#2E2E2E] bg-[#151515] px-4 py-3 text-sm focus:border-primary focus:outline-none"
              placeholder={t('productNameArPlaceholder')}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="product-name-en" className="text-sm text-[#9CA3AF]">{t('productNameEn')} <span className="text-[#6B7280] text-xs">{t('optional')}</span></label>
            <input
              id="product-name-en"
              value={nameEn} onChange={e => setNameEn(e.currentTarget.value)}
              className="rounded-xl border border-[#2E2E2E] bg-[#151515] px-4 py-3 text-sm focus:border-primary focus:outline-none"
              placeholder={t('productNameEnPlaceholder')}
              dir="ltr"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="suggested-category" className="text-sm text-[#9CA3AF]">{t('suggestedCategory')} <span className="text-[#6B7280] text-xs">{t('optional')}</span></label>
            <select
              id="suggested-category"
              value={catId}
              onChange={e => setCatId(e.currentTarget.value)}
              onFocus={() => { void loadCategories(); }}
              className="rounded-xl border border-[#2E2E2E] bg-[#151515] px-4 py-3 text-sm text-[#E2E2E2] focus:border-primary focus:outline-none"
            >
              <option value="">{t('selectCategory')}</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{locale === 'ar' ? c.name_ar : c.name_en}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="additional-description" className="text-sm text-[#9CA3AF]">{t('additionalDescription')} <span className="text-[#6B7280] text-xs">{t('optional')}</span></label>
            <textarea
              id="additional-description"
              value={desc} onChange={e => setDesc(e.currentTarget.value)}
              rows={4}
              className="rounded-xl border border-[#2E2E2E] bg-[#151515] px-4 py-3 text-sm resize-none focus:border-primary focus:outline-none"
              placeholder={t('additionalDescriptionPlaceholder')}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="product-images" className="text-sm text-[#9CA3AF]">{t('productImages')} <span className="text-[#6B7280] text-xs">{t('productImagesHint')}</span></label>
            {previews.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {previews.map((src, i) => (
                  <div key={i} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="h-20 w-20 rounded-xl object-cover border border-[#2E2E2E]" />
                    <button type="button" onClick={() => removeImage(i)}
                      aria-label={t('removeImage')}
                      className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {images.length < 5 && (
              <>
                <input
                  id="product-images"
                  ref={fileRef}
                  type="file"
                  aria-label={t('productImages')}
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={e => handleFiles(e.currentTarget.files)}
                />
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-2 rounded-xl border border-dashed border-[#3E3E3E] bg-[#151515] px-4 py-3 text-sm text-[#9CA3AF] hover:border-primary hover:text-primary transition-colors w-fit">
                  <Paperclip className="h-4 w-4" /> {t('addImage')}
                </button>
              </>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !nameAr.trim()}
            className="w-full rounded-xl bg-primary py-3 font-bold text-[#0F0F0F] hover:bg-[#A67C2E] transition-colors disabled:opacity-50"
          >
            {loading ? t('submitting') : t('submitToAdmin')}
          </button>
        </form>
      </div>
    </main>
  );
}
