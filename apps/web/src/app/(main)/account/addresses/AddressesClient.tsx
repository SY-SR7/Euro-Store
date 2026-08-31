'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, MapPin } from 'lucide-react';
import type { Database } from '@eurostore/database';
import { ConfirmDialog } from '@eurostore/ui';
import { GOVERNORATES } from '@eurostore/shared';

type Address = Database['public']['Tables']['customer_addresses']['Row'];

export function AddressesClient({ initialAddresses, isAr }: { initialAddresses: Address[]; isAr: boolean }) {
  const router = useRouter();
  const [addresses, setAddresses] = useState(initialAddresses);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  const [formData, setFormData] = useState({
    label: '',
    full_name: '',
    phone: '',
    governorate: 'damascus',
    city: '',
    street: '',
    is_default: false
  });

  const govs = GOVERNORATES;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowForm(false);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    setDeleting(true);
    try {
      const res = await fetch(`/api/addresses?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setAddresses(prev => prev.filter(a => a.id !== id));
        setPendingDeleteId(null);
        router.refresh();
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-text-primary">{isAr ? 'عناويني' : 'My Addresses'}</h1>
        {addresses.length < 10 && !showForm && (
          <button 
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-1.5 text-sm font-bold text-primary hover:bg-primary/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {isAr ? 'إضافة' : 'Add'}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={(event) => { void handleSubmit(event); }} className="rounded-2xl border border-border bg-background-card p-4 shadow-sm space-y-4">
          <h2 className="font-bold text-text-primary">{isAr ? 'عنوان جديد' : 'New Address'}</h2>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-text-muted mb-1">{isAr ? 'اسم العنوان (مثال: المنزل)' : 'Label (e.g. Home)'}</label>
              <input aria-label={isAr ? 'اسم العنوان' : 'Address label'} required value={formData.label} onChange={e => setFormData({...formData, label: e.target.value})} className="w-full rounded-xl border p-2.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-muted mb-1">{isAr ? 'الاسم' : 'Name'}</label>
              <input aria-label={isAr ? 'اسم المستلم' : 'Recipient name'} required value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="w-full rounded-xl border p-2.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-muted mb-1">{isAr ? 'الهاتف' : 'Phone'}</label>
              <input aria-label={isAr ? 'رقم الهاتف' : 'Phone number'} required type="tel" dir="ltr" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full rounded-xl border p-2.5 text-sm text-left" />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-muted mb-1">{isAr ? 'المحافظة' : 'Governorate'}</label>
              <select aria-label={isAr ? 'المحافظة' : 'Governorate'} required value={formData.governorate} onChange={e => setFormData({...formData, governorate: e.target.value})} className="w-full rounded-xl border p-2.5 text-sm">
                {govs.map(g => <option key={g.id} value={g.id}>{isAr ? g.ar : g.en}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-text-muted mb-1">{isAr ? 'المدينة / المنطقة' : 'City / Area'}</label>
              <input aria-label={isAr ? 'المدينة أو المنطقة' : 'City or area'} required value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full rounded-xl border p-2.5 text-sm" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-text-muted mb-1">{isAr ? 'الشارع والتفاصيل' : 'Street & Details'}</label>
              <input aria-label={isAr ? 'الشارع والتفاصيل' : 'Street and details'} required value={formData.street} onChange={e => setFormData({...formData, street: e.target.value})} className="w-full rounded-xl border p-2.5 text-sm" />
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <input type="checkbox" id="is_default" checked={formData.is_default} onChange={e => setFormData({...formData, is_default: e.target.checked})} className="rounded text-primary" />
              <label htmlFor="is_default" className="text-sm text-text-primary">{isAr ? 'تعيين كعنوان افتراضي' : 'Set as default address'}</label>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={loading} className="flex-1 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90">
              {isAr ? 'حفظ' : 'Save'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="flex-1 rounded-xl bg-surface-elevated px-4 py-2 text-sm font-bold text-text-secondary hover:text-primary">
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {addresses.map(addr => (
          <div key={addr.id} className="rounded-2xl border border-border bg-background-card p-4 shadow-sm relative group">
            {addr.is_default && (
              <span className="absolute top-4 left-4 rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-[10px] font-bold">
                {isAr ? 'الافتراضي' : 'Default'}
              </span>
            )}
            
            <button type="button" title={isAr ? 'حذف العنوان' : 'Delete address'} onClick={() => setPendingDeleteId(addr.id)} className="absolute top-4 right-4 p-1.5 text-text-muted hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-3 mt-1">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-elevated text-text-secondary">
                <MapPin className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1 pr-6">
                <p className="font-bold text-text-primary">{addr.label || addr.full_name}</p>
                <p className="text-sm text-text-muted mt-1 truncate">{addr.governorate}, {addr.city}</p>
                <p className="text-xs text-text-muted mt-0.5 truncate">{addr.street}</p>
                <p className="text-xs text-text-muted mt-0.5 font-mono">{addr.phone}</p>
              </div>
            </div>
          </div>
        ))}
        {addresses.length === 0 && !showForm && (
          <div className="py-10 text-center border-2 border-dashed border-border rounded-2xl">
            <p className="text-text-muted font-medium">{isAr ? 'لا يوجد عناوين محفوظة' : 'No saved addresses'}</p>
          </div>
        )}
      </div>
      <ConfirmDialog
        open={pendingDeleteId !== null}
        title={isAr ? 'حذف العنوان' : 'Delete address'}
        description={isAr ? 'سيُحذف هذا العنوان نهائياً من حسابك.' : 'This address will be permanently removed from your account.'}
        confirmLabel={deleting ? (isAr ? 'جارٍ الحذف' : 'Deleting') : (isAr ? 'حذف' : 'Delete')}
        cancelLabel={isAr ? 'إلغاء' : 'Cancel'}
        onConfirm={() => { if (pendingDeleteId) void handleDelete(pendingDeleteId); }}
        onCancel={() => setPendingDeleteId(null)}
        pending={deleting}
        destructive
      />
    </div>
  );
}
