'use client';
import { useCallback, useEffect, useState } from 'react';
import { Plus, Edit2, Shield, CheckCircle2, XCircle } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

interface Helper {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  branch_name: string;
  is_active: boolean;
  created_at: string;
}

export default function AdminHelpersPage() {
  const t = useTranslations('adminStaff');
  const locale = useLocale();
  const [helpers, setHelpers] = useState<Helper[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHelper, setEditingHelper] = useState<Helper | null>(null);
  
  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [branchName, setBranchName] = useState('');
  const [password, setPassword] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchHelpers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/helpers');
      const data = await res.json() as Helper[];
      if (!res.ok) throw new Error('load_failed');
      setHelpers(Array.isArray(data) ? data : []);
    } catch {
      setHelpers([]);
      setFormError(t('helpersLoadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { void fetchHelpers(); }, [fetchHelpers]);

  function openNew() {
    setEditingHelper(null);
    setFullName(''); setEmail(''); setPhone(''); setBranchName(''); setPassword(''); setIsActive(true);
    setFormError(''); setIsModalOpen(true);
  }

  function openEdit(h: Helper) {
    setEditingHelper(h);
    setFullName(h.full_name); setEmail(h.email); setPhone(h.phone || ''); setBranchName(h.branch_name);
    setPassword(''); setIsActive(h.is_active);
    setFormError(''); setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(''); setSaving(true);
    try {
      const isNew = !editingHelper;
      const url = '/api/admin/helpers';
      const method = isNew ? 'POST' : 'PATCH';
      const body = isNew
        ? { full_name: fullName, email, phone, branch_name: branchName, password }
        : { id: editingHelper.id, full_name: fullName, phone, branch_name: branchName, is_active: isActive };
      
      if (isNew && (password.length < 12 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password))) {
        throw new Error(t('passwordRequirements'));
      }

      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(t('saveError'));
      
      await fetchHelpers();
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
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-text-primary">{t('helpersTitle')}</h1>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-[#1F1B16] hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" /> {t('addHelper')}
        </button>
      </div>

      {formError && !isModalOpen ? <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{formError}</div> : null}

      <div className="overflow-hidden rounded-lg border border-border bg-background-card shadow-sm">
        {loading ? (
          <p className="py-10 text-center text-text-muted">{t('loading')}</p>
        ) : helpers.length === 0 ? (
          <p className="py-10 text-center text-text-muted">{t('noHelpers')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-background">
                <tr>
                  <th className="px-5 py-3 text-start font-bold text-text-muted">{t('name')}</th>
                  <th className="px-5 py-3 text-start font-bold text-text-muted">{t('branch')}</th>
                  <th className="px-5 py-3 text-start font-bold text-text-muted">{t('contact')}</th>
                  <th className="px-5 py-3 text-start font-bold text-text-muted">{t('joinedAt')}</th>
                  <th className="px-5 py-3 text-start font-bold text-text-muted">{t('status')}</th>
                  <th className="px-5 py-3 text-end font-bold text-text-muted">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {helpers.map(h => (
                  <tr key={h.id} className="hover:bg-background-elevated transition-colors">
                    <td className="px-5 py-4 font-semibold text-text-primary">{h.full_name}</td>
                    <td className="px-5 py-4 text-text-secondary">{h.branch_name}</td>
                    <td className="px-5 py-4 text-text-secondary" dir="ltr">
                      <div>{h.email}</div>
                      <div className="text-xs text-text-muted mt-0.5">{h.phone || '—'}</div>
                    </td>
                    <td className="px-5 py-4 text-text-secondary">
                      {new Date(h.created_at).toLocaleDateString(locale === 'ar' ? 'ar-SY' : 'en-GB')}
                    </td>
                    <td className="px-5 py-4">
                      {h.is_active ? (
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
                      <button onClick={() => openEdit(h)} title={t('editHelper')}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border border-border bg-background-card p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-text-primary mb-5">
              {editingHelper ? t('editHelper') : t('addHelperTitle')}
            </h2>
            <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
              {formError && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{formError}</div>}
              
              <div>
                <label className="mb-1 block text-sm font-semibold text-text-muted">{t('fullName')}</label>
                <input aria-label={t('fullName')} required type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text-primary focus:border-primary focus:outline-none" />
              </div>
              
              {!editingHelper && (
                <>
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
                </>
              )}
              
              <div>
                <label className="mb-1 block text-sm font-semibold text-text-muted">{t('phoneOptional')}</label>
                <input aria-label={t('phoneOptional')} type="tel" value={phone} onChange={e => setPhone(e.target.value)} dir="ltr"
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text-primary focus:border-primary focus:outline-none" />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-text-muted">{t('branchName')}</label>
                <input aria-label={t('branchName')} required type="text" value={branchName} onChange={e => setBranchName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text-primary focus:border-primary focus:outline-none" />
              </div>

              {editingHelper && (
                <label className="flex items-center gap-3 rounded-xl border border-border p-3 cursor-pointer hover:border-primary/50">
                  <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="h-4 w-4 accent-primary" />
                  <span className="text-sm font-semibold text-text-primary">{t('helperActiveHint')}</span>
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
