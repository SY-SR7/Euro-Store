'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ProfileFormData {
  full_name: string;
  phone: string;
  gender: string | null;
}

function responseError(value: unknown): string | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const error = (value as Record<string, unknown>).error;
  return typeof error === 'string' ? error : null;
}

export function ProfileForm({ initialData, isAr }: { initialData: ProfileFormData; isAr: boolean }) {
  const router = useRouter();
  const [formData, setFormData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data: unknown = await res.json();
        throw new Error(responseError(data) ?? 'Failed to update profile');
      }

      setSuccess(true);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={(event) => { void handleSubmit(event); }} className="space-y-4">
      <div>
        <label className="block text-sm font-bold text-text-muted mb-1">{isAr ? 'الاسم الكامل' : 'Full Name'}</label>
        <input 
          aria-label={isAr ? 'الاسم الكامل' : 'Full name'}
          type="text" 
          value={formData.full_name} 
          onChange={e => setFormData({ ...formData, full_name: e.target.value })}
          required
          className="w-full rounded-xl border border-border bg-background p-3 text-text-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-text-muted mb-1">{isAr ? 'رقم الهاتف' : 'Phone Number'}</label>
        <input 
          aria-label={isAr ? 'رقم الهاتف' : 'Phone number'}
          type="tel" 
          value={formData.phone} 
          onChange={e => setFormData({ ...formData, phone: e.target.value })}
          className="w-full rounded-xl border border-border bg-background p-3 text-text-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none text-left"
          dir="ltr"
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-text-muted mb-1">{isAr ? 'الجنس (اختياري)' : 'Gender (Optional)'}</label>
        <select 
          aria-label={isAr ? 'الجنس' : 'Gender'}
          value={formData.gender || ''} 
          onChange={e => setFormData({ ...formData, gender: e.target.value })}
          className="w-full rounded-xl border border-border bg-background p-3 text-text-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none"
        >
          <option value="">{isAr ? 'غير محدد' : 'Not specified'}</option>
          <option value="male">{isAr ? 'ذكر' : 'Male'}</option>
          <option value="female">{isAr ? 'أنثى' : 'Female'}</option>
        </select>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}
      {success && <p className="text-green-600 text-sm">{isAr ? 'تم الحفظ بنجاح!' : 'Saved successfully!'}</p>}

      <button 
        type="submit" 
        disabled={loading}
        className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {loading ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'حفظ التغييرات' : 'Save Changes')}
      </button>
    </form>
  );
}
