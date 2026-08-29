'use client';
import { useCallback, useEffect, useState } from 'react';
import { Handshake, Plus, Edit2, CheckCircle2, XCircle } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

interface Partner {
  id: string;
  business_name: string;
  contact_name: string;
  email: string;
  phone: string;
  address_ar: string;
  governorate: string;
  is_active: boolean;
  created_at: string;
}

export default function AdminPartnersPage() {
  const t = useTranslations('adminPartners');
  const locale = useLocale();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  
  // Form State
  const [businessName, setBusinessName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [addressAr, setAddressAr] = useState('');
  const [governorate, setGovernorate] = useState('');
  const [password, setPassword] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchPartners = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/partners');
      const data = await res.json() as Partner[];
      if (!res.ok) throw new Error('load_failed');
      setPartners(Array.isArray(data) ? data : []);
    } catch {
      setPartners([]);
      setFormError(t('loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { void fetchPartners(); }, [fetchPartners]);

  function openNew() {
    setEditingPartner(null);
    setBusinessName(''); setContactName(''); setEmail(''); setPhone(''); 
    setAddressAr(''); setGovernorate(''); setPassword(''); setIsActive(true);
    setFormError(''); setIsModalOpen(true);
  }

  function openEdit(p: Partner) {
    setEditingPartner(p);
    setBusinessName(p.business_name); setContactName(p.contact_name); setEmail(p.email); 
    setPhone(p.phone); setAddressAr(p.address_ar); setGovernorate(p.governorate);
    setPassword(''); setIsActive(p.is_active);
    setFormError(''); setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(''); setSaving(true);
    try {
      const isNew = !editingPartner;
      const url = '/api/admin/partners';
      const method = isNew ? 'POST' : 'PATCH';
      const body = isNew
        ? { business_name: businessName, contact_name: contactName, email, phone, address_ar: addressAr, governorate, password }
        : { id: editingPartner.id, business_name: businessName, contact_name: contactName, phone, address_ar: addressAr, governorate, is_active: isActive };
      
      if (isNew && (password.length < 12 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password))) {
        throw new Error(t('passwordRequirements'));
      }

      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(t('saveError'));
      
      await fetchPartners();
      setIsModalOpen(false);
    } catch (error: unknown) {
      setFormError(error instanceof Error ? error.message : t('saveError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Handshake className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-text-primary">{t('title')}</h1>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-[#1F1B16] hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" /> {t('add')}
        </button>
      </div>

      {formError && !isModalOpen ? <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{formError}</div> : null}

      <div className="overflow-hidden rounded-lg border border-border bg-background-card shadow-sm">
        {loading ? (
          <p className="py-10 text-center text-text-muted">{t('loading')}</p>
        ) : partners.length === 0 ? (
          <p className="py-10 text-center text-text-muted">{t('empty')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-background">
                <tr>
                  <th className="px-5 py-3 text-start font-bold text-text-muted">{t('businessName')}</th>
                  <th className="px-5 py-3 text-start font-bold text-text-muted">{t('contactName')}</th>
                  <th className="px-5 py-3 text-start font-bold text-text-muted">{t('contact')}</th>
                  <th className="px-5 py-3 text-start font-bold text-text-muted">{t('address')}</th>
                  <th className="px-5 py-3 text-start font-bold text-text-muted">{t('joinedAt')}</th>
                  <th className="px-5 py-3 text-start font-bold text-text-muted">{t('status')}</th>
                  <th className="px-5 py-3 text-end font-bold text-text-muted">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {partners.map(p => (
                  <tr key={p.id} className="hover:bg-background-elevated transition-colors">
                    <td className="px-5 py-4 font-semibold text-text-primary">{p.business_name}</td>
                    <td className="px-5 py-4 text-text-secondary">{p.contact_name}</td>
                    <td className="px-5 py-4 text-text-secondary" dir="ltr">
                      <div>{p.email}</div>
                      <div className="text-xs text-text-muted mt-0.5">{p.phone}</div>
                    </td>
                    <td className="px-5 py-4 text-text-secondary">
                      <div>{p.governorate}</div>
                      <div className="text-xs text-text-muted mt-0.5 line-clamp-1">{p.address_ar}</div>
                    </td>
                    <td className="px-5 py-4 text-text-secondary">
                      {new Date(p.created_at).toLocaleDateString(locale === 'ar' ? 'ar-SY' : 'en-GB')}
                    </td>
                    <td className="px-5 py-4">
                      {p.is_active ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-bold text-green-600 border border-green-500/20">
                          <CheckCircle2 className="h-3.5 w-3.5" /> {t('active')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-bold text-red-600 border border-red-500/20">
                          <XCircle className="h-3.5 w-3.5" /> {t('disabled')}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-end">
                      <button onClick={() => openEdit(p)} title={t('edit')}
                        className="rounded p-2 text-text-muted hover:bg-primary/10 hover:text-primary transition-colors">
                        <Edit2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto pt-20 pb-20">
          <div className="my-auto w-full max-w-lg rounded-lg border border-border bg-background-card p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-text-primary mb-5">
              {editingPartner ? t('edit') : t('addTitle')}
            </h2>
            <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
              {formError && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{formError}</div>}
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-text-muted">{t('businessName')}</label>
                  <input aria-label={t('businessName')} required type="text" value={businessName} onChange={e => setBusinessName(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text-primary focus:border-primary focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-text-muted">{t('contactName')}</label>
                  <input aria-label={t('contactName')} required type="text" value={contactName} onChange={e => setContactName(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text-primary focus:border-primary focus:outline-none" />
                </div>
              </div>
              
              {!editingPartner && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-text-muted">{t('email')}</label>
                    <input aria-label={t('email')} required type="email" value={email} onChange={e => setEmail(e.target.value)} dir="ltr"
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text-primary focus:border-primary focus:outline-none" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-text-muted">{t('password')}</label>
                    <input aria-label={t('password')} required type="password" value={password} onChange={e => setPassword(e.target.value)} dir="ltr" minLength={12} maxLength={128}
                      pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{12,128}"
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text-primary focus:border-primary focus:outline-none" />
                  </div>
                </div>
              )}
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-text-muted">{t('governorate')}</label>
                  <input aria-label={t('governorate')} required type="text" value={governorate} onChange={e => setGovernorate(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text-primary focus:border-primary focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-text-muted">{t('phone')}</label>
                  <input aria-label={t('phone')} required type="tel" value={phone} onChange={e => setPhone(e.target.value)} dir="ltr"
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text-primary focus:border-primary focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-text-muted">{t('detailedAddress')}</label>
                <textarea aria-label={t('detailedAddress')} required rows={2} value={addressAr} onChange={e => setAddressAr(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text-primary resize-none focus:border-primary focus:outline-none" />
              </div>

              {editingPartner && (
                <label className="flex items-center gap-3 rounded-xl border border-border p-3 cursor-pointer hover:border-primary/50">
                  <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="h-4 w-4 accent-primary" />
                  <span className="text-sm font-semibold text-text-primary">{t('activeHint')}</span>
                </label>
              )}

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-border px-5 py-2.5 text-sm font-bold text-text-secondary hover:border-text-primary transition-colors">
                  {t('cancel')}
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-[#1F1B16] hover:bg-primary/90 disabled:opacity-50 transition-colors">
                  {saving ? t('saving') : t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
