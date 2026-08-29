'use client';

import { ArrowDown, ArrowUp, ImagePlus, Pencil, RefreshCw, Save, Trash2, X } from 'lucide-react';
import { useLocale } from 'next-intl';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ConfirmDialog } from '@eurostore/ui';

type SectionKey = 'main_banner' | 'new_arrivals' | 'sales' | 'featured_brands' | 'most_popular';
type HomeSection = {
  id: string;
  section_key: SectionKey;
  title_ar: string;
  title_en: string;
  content: Record<string, unknown>;
  is_active: boolean;
  sort_order: number;
};
type Brand = { id: string; name: string; slug: string; logo_url: string | null };
type Banner = {
  id: string;
  title_ar: string;
  title_en: string;
  subtitle_ar: string;
  subtitle_en: string;
  image_url?: string;
  mobile_image_url?: string;
  video_url?: string;
  cta_url: string;
  cta_label_ar: string;
  cta_label_en: string;
  is_active: boolean;
  sort_order: number;
};

const sectionLabels: Record<SectionKey, { ar: string; en: string }> = {
  main_banner: { ar: 'البانر الرئيسي', en: 'Main banner' },
  new_arrivals: { ar: 'وصل حديثا', en: 'New arrivals' },
  sales: { ar: 'التخفيضات', en: 'Sale' },
  featured_brands: { ar: 'الماركات المختارة', en: 'Featured brands' },
  most_popular: { ar: 'الأكثر طلبا', en: 'Most popular' },
};

const inputClass = 'w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-primary';

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { cache: 'no-store', ...init });
  const payload = await response.json().catch(() => null) as ({ error?: unknown } & T) | null;
  if (!response.ok) {
    const value = payload?.error;
    const message = typeof value === 'string' ? value : 'request_failed';
    throw new Error(message);
  }
  return payload as T;
}

function bannersOf(section: HomeSection) {
  return Array.isArray(section.content?.banners) ? section.content.banners as Banner[] : [];
}

function brandIdsOf(section: HomeSection) {
  return Array.isArray(section.content?.brand_ids) ? section.content.brand_ids.filter((id): id is string => typeof id === 'string') : [];
}

const emptyBanner = {
  title_ar: '', title_en: '', subtitle_ar: '', subtitle_en: '', cta_url: '/products',
  cta_label_ar: 'تسوق الآن', cta_label_en: 'Shop now', is_active: true,
};

export default function HomepageQuickAdmin() {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [editingBanner, setEditingBanner] = useState<Banner | null | undefined>(undefined);
  const [bannerForm, setBannerForm] = useState(emptyBanner);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerMobileFile, setBannerMobileFile] = useState<File | null>(null);
  const [pendingBannerDeleteId, setPendingBannerDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage('');
    try {
      const [sectionPayload, brandPayload] = await Promise.all([
        fetchJson<HomeSection[]>('/api/catalog/homepage'),
        fetchJson<{ data: Brand[] }>('/api/admin/homepage/brands'),
      ]);
      setSections([...sectionPayload].sort((a, b) => a.sort_order - b.sort_order));
      setBrands(brandPayload.data);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'request_failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const bannerSection = useMemo(() => sections.find((section) => section.section_key === 'main_banner'), [sections]);
  const brandSection = useMemo(() => sections.find((section) => section.section_key === 'featured_brands'), [sections]);

  async function patchSection(section: HomeSection, patch: Partial<HomeSection>) {
    setBusy(true);
    setMessage('');
    try {
      const updated = await fetchJson<HomeSection>(`/api/catalog/homepage/${section.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch),
      });
      setSections((current) => current.map((item) => item.id === section.id ? updated : item).sort((a, b) => a.sort_order - b.sort_order));
      setMessage(isAr ? 'تم الحفظ' : 'Saved');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'request_failed');
    } finally {
      setBusy(false);
    }
  }

  function openBanner(banner?: Banner) {
    setEditingBanner(banner ?? null);
    setBannerForm(banner ? {
      title_ar: banner.title_ar, title_en: banner.title_en, subtitle_ar: banner.subtitle_ar,
      subtitle_en: banner.subtitle_en, cta_url: banner.cta_url, cta_label_ar: banner.cta_label_ar,
      cta_label_en: banner.cta_label_en, is_active: banner.is_active,
    } : emptyBanner);
    setBannerFile(null);
    setBannerMobileFile(null);
  }

  async function saveBanner() {
    if (!editingBanner && !bannerFile) {
      setMessage(isAr ? 'اختر صورة أو فيديو للبانر' : 'Choose a banner image or video');
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      let media: { type: 'image' | 'video'; url: string } | undefined;
      if (bannerFile) {
        const formData = new FormData();
        formData.append('file', bannerFile);
        const uploaded = await fetchJson<{ files: Array<{ type: 'image' | 'video'; url: string }> }>('/api/upload?purpose=homepage', { method: 'POST', body: formData });
        media = uploaded.files[0];
      }
      let mobileImageUrl: string | undefined;
      if (bannerMobileFile) {
        const formData = new FormData();
        formData.append('file', bannerMobileFile);
        const uploaded = await fetchJson<{ files: Array<{ type: 'image' | 'video'; url: string }> }>('/api/upload?purpose=homepage', { method: 'POST', body: formData });
        if (uploaded.files[0]?.type !== 'image') throw new Error('mobile_media_must_be_image');
        mobileImageUrl = uploaded.files[0].url;
      }
      const payload: Record<string, unknown> = { ...bannerForm };
      if (media?.type === 'image') payload.image_url = media.url;
      if (media?.type === 'video') payload.video_url = media.url;
      if (mobileImageUrl) payload.mobile_image_url = mobileImageUrl;
      const url = editingBanner ? `/api/admin/homepage/banners/${editingBanner.id}` : '/api/admin/homepage/banners';
      await fetchJson(url, { method: editingBanner ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      setEditingBanner(undefined);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'request_failed');
    } finally {
      setBusy(false);
    }
  }

  async function deleteBanner(id: string) {
    setBusy(true);
    try {
      await fetchJson(`/api/admin/homepage/banners/${id}`, { method: 'DELETE' });
      setPendingBannerDeleteId(null);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'request_failed');
    } finally { setBusy(false); }
  }

  async function moveBanner(index: number, direction: number) {
    if (!bannerSection) return;
    const banners = [...bannersOf(bannerSection)];
    const target = index + direction;
    if (target < 0 || target >= banners.length) return;
    [banners[index], banners[target]] = [banners[target], banners[index]];
    setBusy(true);
    try {
      await fetchJson('/api/admin/homepage/banners/reorder', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: banners.map((banner) => banner.id) }),
      });
      await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'request_failed'); }
    finally { setBusy(false); }
  }

  async function saveBrandIds(ids: string[]) {
    if (brandSection) await patchSection(brandSection, { content: { brand_ids: ids } });
  }

  async function toggleBrand(id: string) {
    if (!brandSection) return;
    const ids = brandIdsOf(brandSection);
    await saveBrandIds(ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]);
  }

  async function moveBrand(index: number, direction: number) {
    if (!brandSection) return;
    const ids = [...brandIdsOf(brandSection)];
    const target = index + direction;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    await saveBrandIds(ids);
  }

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
        <div><h1 className="text-2xl font-black text-text-primary">{isAr ? 'إدارة الصفحة الرئيسية' : 'Homepage management'}</h1><p className="mt-1 text-sm text-text-muted">{isAr ? 'الأقسام الخمسة المعرفة في PRD' : 'The five PRD-defined sections'}</p></div>
        <button type="button" onClick={() => void load()} title={isAr ? 'تحديث' : 'Refresh'} className="inline-flex h-10 items-center gap-2 rounded-md border border-border px-3 text-sm font-bold"><RefreshCw size={16} />{isAr ? 'تحديث' : 'Refresh'}</button>
      </header>

      {message ? <p className="rounded-md border border-border bg-background-card px-4 py-3 text-sm font-bold text-text-primary">{message}</p> : null}
      {loading ? <p className="py-16 text-center text-sm text-text-muted">{isAr ? 'جار التحميل...' : 'Loading...'}</p> : null}

      {!loading ? sections.map((section) => {
        const isProductSection = ['new_arrivals', 'sales', 'most_popular'].includes(section.section_key);
        return (
          <section key={section.id} className="border-b border-border pb-7">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-black text-text-primary">{sectionLabels[section.section_key]?.[isAr ? 'ar' : 'en']}</h2>
              <label className="inline-flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={section.is_active} disabled={busy} onChange={(event) => void patchSection(section, { is_active: event.target.checked })} />{isAr ? 'ظاهر' : 'Visible'}</label>
            </div>
            <div className="grid gap-3 md:grid-cols-[1fr_1fr_8rem]">
              <label className="text-xs font-bold text-text-muted">{isAr ? 'العنوان العربي' : 'Arabic title'}<input defaultValue={section.title_ar} onBlur={(event) => event.target.value.trim() && event.target.value !== section.title_ar && void patchSection(section, { title_ar: event.target.value.trim() })} className={`${inputClass} mt-1`} dir="rtl" /></label>
              <label className="text-xs font-bold text-text-muted">{isAr ? 'العنوان الإنجليزي' : 'English title'}<input defaultValue={section.title_en} onBlur={(event) => event.target.value.trim() && event.target.value !== section.title_en && void patchSection(section, { title_en: event.target.value.trim() })} className={`${inputClass} mt-1`} dir="ltr" /></label>
              <label className="text-xs font-bold text-text-muted">{isAr ? 'الترتيب' : 'Order'}<input type="number" min={0} max={1000} defaultValue={section.sort_order} onBlur={(event) => Number(event.target.value) !== section.sort_order && void patchSection(section, { sort_order: Number(event.target.value) })} className={`${inputClass} mt-1`} /></label>
            </div>

            {isProductSection ? <label className="mt-4 block max-w-xs text-xs font-bold text-text-muted">{isAr ? 'عدد المنتجات (1-24)' : 'Product count (1-24)'}<input type="number" min={1} max={24} defaultValue={Number(section.content?.limit ?? 12)} onBlur={(event) => void patchSection(section, { content: { limit: Math.min(24, Math.max(1, Number(event.target.value) || 12)) } })} className={`${inputClass} mt-1`} /></label> : null}

            {section.section_key === 'main_banner' ? (
              <div className="mt-5 space-y-3">
                <button type="button" onClick={() => openBanner()} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-black text-text-primary"><ImagePlus size={16} />{isAr ? 'إضافة بانر' : 'Add banner'}</button>
                {bannersOf(section).map((banner, index) => <div key={banner.id} className="grid gap-3 border border-border bg-background-card p-3 md:grid-cols-[5rem_1fr_auto] md:items-center">
                  <div className="h-14 overflow-hidden bg-background-secondary">{banner.image_url ? <img src={banner.image_url} alt="" className="h-full w-full object-cover" /> : <video src={banner.video_url} className="h-full w-full object-cover" muted />}</div>
                  <div><p className="font-bold text-text-primary">{isAr ? banner.title_ar : banner.title_en || banner.title_ar}</p><p className="text-xs text-text-muted">{banner.is_active ? (isAr ? 'ظاهر' : 'Visible') : (isAr ? 'مخفي' : 'Hidden')}</p></div>
                  <div className="flex gap-1">
                    <button type="button" title={isAr ? 'للأعلى' : 'Move up'} disabled={index === 0 || busy} onClick={() => void moveBanner(index, -1)} className="grid h-9 w-9 place-items-center border border-border"><ArrowUp size={15} /></button>
                    <button type="button" title={isAr ? 'للأسفل' : 'Move down'} disabled={index === bannersOf(section).length - 1 || busy} onClick={() => void moveBanner(index, 1)} className="grid h-9 w-9 place-items-center border border-border"><ArrowDown size={15} /></button>
                    <button type="button" title={isAr ? 'تعديل' : 'Edit'} onClick={() => openBanner(banner)} className="grid h-9 w-9 place-items-center border border-border"><Pencil size={15} /></button>
                    <button type="button" title={isAr ? 'حذف' : 'Delete'} onClick={() => setPendingBannerDeleteId(banner.id)} className="grid h-9 w-9 place-items-center border border-red-200 text-red-600"><Trash2 size={15} /></button>
                  </div>
                </div>)}
              </div>
            ) : null}

            {section.section_key === 'featured_brands' ? (
              <div className="mt-5 grid gap-5 lg:grid-cols-2">
                <div><h3 className="mb-2 text-sm font-black">{isAr ? 'الماركات المتاحة' : 'Available brands'}</h3><div className="max-h-64 overflow-y-auto border border-border bg-background-card p-2">{brands.map((brand) => <label key={brand.id} className="flex items-center gap-2 border-b border-border px-2 py-2 text-sm last:border-0"><input type="checkbox" checked={brandIdsOf(section).includes(brand.id)} disabled={busy} onChange={() => void toggleBrand(brand.id)} />{brand.name}</label>)}</div></div>
                <div><h3 className="mb-2 text-sm font-black">{isAr ? 'ترتيب الظهور' : 'Display order'}</h3><div className="space-y-1">{brandIdsOf(section).map((id, index) => { const brand = brands.find((item) => item.id === id); return brand ? <div key={id} className="flex items-center justify-between border border-border bg-background-card px-3 py-2 text-sm"><span>{index + 1}. {brand.name}</span><span className="flex gap-1"><button type="button" title={isAr ? 'للأعلى' : 'Move up'} disabled={index === 0 || busy} onClick={() => void moveBrand(index, -1)}><ArrowUp size={15} /></button><button type="button" title={isAr ? 'للأسفل' : 'Move down'} disabled={index === brandIdsOf(section).length - 1 || busy} onClick={() => void moveBrand(index, 1)}><ArrowDown size={15} /></button></span></div> : null; })}</div></div>
              </div>
            ) : null}
          </section>
        );
      }) : null}

      {editingBanner !== undefined ? <div className="fixed inset-0 z-50 grid place-items-center bg-black/55 p-4" onMouseDown={() => setEditingBanner(undefined)}><div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-md bg-background p-5 shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-black">{editingBanner ? (isAr ? 'تعديل البانر' : 'Edit banner') : (isAr ? 'بانر جديد' : 'New banner')}</h2><button type="button" title={isAr ? 'إغلاق' : 'Close'} onClick={() => setEditingBanner(undefined)}><X size={20} /></button></div>
        <div className="grid gap-3 md:grid-cols-2">
          {(['title_ar', 'title_en', 'subtitle_ar', 'subtitle_en', 'cta_label_ar', 'cta_label_en', 'cta_url'] as const).map((field) => <label key={field} className={`text-xs font-bold text-text-muted ${field === 'cta_url' ? 'md:col-span-2' : ''}`}>{field}<input value={String(bannerForm[field])} onChange={(event) => setBannerForm((form) => ({ ...form, [field]: event.target.value }))} className={`${inputClass} mt-1`} dir={field.endsWith('_ar') ? 'rtl' : 'ltr'} /></label>)}
          <label className="text-xs font-bold text-text-muted md:col-span-2">{editingBanner ? (isAr ? 'استبدال الوسائط (اختياري)' : 'Replace media (optional)') : (isAr ? 'صورة أو فيديو' : 'Image or video')}<input type="file" accept="image/jpeg,image/png,image/webp,video/mp4" required={!editingBanner} onChange={(event) => setBannerFile(event.target.files?.[0] ?? null)} className={`${inputClass} mt-1`} /></label>
          <label className="text-xs font-bold text-text-muted md:col-span-2">{isAr ? 'صورة الهاتف العمودية (اختيارية)' : 'Mobile portrait image (optional)'}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setBannerMobileFile(event.target.files?.[0] ?? null)} className={`${inputClass} mt-1`} /></label>
          <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={bannerForm.is_active} onChange={(event) => setBannerForm((form) => ({ ...form, is_active: event.target.checked }))} />{isAr ? 'ظاهر' : 'Visible'}</label>
        </div>
        <button type="button" disabled={busy} onClick={() => void saveBanner()} className="mt-5 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-black text-text-primary disabled:opacity-50"><Save size={16} />{isAr ? 'حفظ' : 'Save'}</button>
      </div></div> : null}
      <ConfirmDialog
        open={pendingBannerDeleteId !== null}
        title={isAr ? 'حذف البانر' : 'Delete banner'}
        description={isAr ? 'سيُحذف البانر من الصفحة الرئيسية نهائياً.' : 'This banner will be permanently removed from the homepage.'}
        confirmLabel={busy ? (isAr ? 'جارٍ الحذف' : 'Deleting') : (isAr ? 'حذف' : 'Delete')}
        cancelLabel={isAr ? 'إلغاء' : 'Cancel'}
        onConfirm={() => { if (pendingBannerDeleteId) void deleteBanner(pendingBannerDeleteId); }}
        onCancel={() => setPendingBannerDeleteId(null)}
        pending={busy}
        destructive
      />
    </div>
  );
}
