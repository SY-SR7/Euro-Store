'use client';

import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';

interface SubAdmin {
  user_id: string;
  display_name: string | null;
  email: string;
  is_active: boolean;
  created_at: string;
}

function pickArray<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];

  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    for (const key of ['data', 'items', 'subAdmins', 'sub_admins', 'rows']) {
      if (Array.isArray(obj[key])) return obj[key] as T[];
    }
  }

  return [];
}

export default function AdminSubAdminsPage() {
  const [subAdmins, setSubAdmins] = useState<SubAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', display_name: '' });
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function loadSubAdmins() {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/sub-admins', { cache: 'no-store' });
      const payload = await res.json().catch(() => null);

      if (!res.ok) {
        setError((payload as { error?: string } | null)?.error ?? 'تعذر تحميل المسؤولين الفرعيين');
        setSubAdmins([]);
      } else {
        setSubAdmins(pickArray<SubAdmin>(payload));
      }
    } catch {
      setError('تعذر الاتصال بالخادم');
      setSubAdmins([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSubAdmins();
  }, []);

  async function createSubAdmin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCreating(true);
    setMessage('');
    setError('');

    try {
      const res = await fetch('/api/sub-admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      const payload = await res.json().catch(() => null);

      if (!res.ok) {
        setError((payload as { error?: string } | null)?.error ?? 'فشل إنشاء المسؤول الفرعي');
      } else {
        setMessage('تم إنشاء المسؤول الفرعي بنجاح');
        setShowForm(false);
        setForm({ email: '', password: '', display_name: '' });
        await loadSubAdmins();
      }
    } catch {
      setError('تعذر إنشاء المسؤول الفرعي');
    } finally {
      setCreating(false);
    }
  }

  async function toggleActive(userId: string, current: boolean) {
    setError('');

    try {
      const res = await fetch(`/api/sub-admins/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !current })
      });

      const payload = await res.json().catch(() => null);

      if (!res.ok) {
        setError((payload as { error?: string } | null)?.error ?? 'فشل تحديث حالة المسؤول');
      } else {
        await loadSubAdmins();
      }
    } catch {
      setError('تعذر تحديث حالة المسؤول');
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
      <section className="flex flex-col justify-between gap-4 rounded-3xl border border-white/10 bg-[#101010] p-6 shadow-2xl sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-black text-white">المسؤولون الفرعيون</h1>
          <p className="mt-2 text-sm leading-7 text-[#9CA3AF]">
            إنشاء وإدارة حسابات مسؤولي لوحة التحكم.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowForm((v) => !v);
            setMessage('');
            setError('');
          }}
          className="rounded-2xl bg-[#C9A84C] px-5 py-3 text-sm font-black text-[#111111] hover:bg-[#D8B95F]"
        >
          {showForm ? 'إلغاء' : 'إضافة مسؤول فرعي +'}
        </button>
      </section>

      {message ? (
        <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-100">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      {showForm ? (
        <form onSubmit={createSubAdmin} className="rounded-3xl border border-white/10 bg-[#101010] p-6 shadow-2xl">
          <h2 className="mb-5 text-xl font-black text-white">إنشاء حساب مسؤول فرعي</h2>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="space-y-2">
              <span className="text-sm font-bold text-[#B8B1A4]">الاسم الظاهر</span>
              <input
                value={form.display_name}
                onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))}
                required
                className="w-full rounded-2xl border border-white/10 bg-[#151515] px-4 py-3 text-white outline-none focus:border-[#C9A84C]"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-bold text-[#B8B1A4]">البريد الإلكتروني</span>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
                className="w-full rounded-2xl border border-white/10 bg-[#151515] px-4 py-3 text-white outline-none focus:border-[#C9A84C]"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-bold text-[#B8B1A4]">كلمة المرور</span>
              <input
                type="password"
                minLength={8}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                required
                className="w-full rounded-2xl border border-white/10 bg-[#151515] px-4 py-3 text-white outline-none focus:border-[#C9A84C]"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={creating}
            className="mt-5 rounded-2xl bg-[#C9A84C] px-6 py-3 text-sm font-black text-[#111111] hover:bg-[#D8B95F] disabled:opacity-50"
          >
            {creating ? 'جار الإنشاء...' : 'إنشاء الحساب'}
          </button>
        </form>
      ) : null}

      <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#101010] shadow-2xl">
        {loading ? (
          <div className="p-10 text-center text-[#9CA3AF]">جار التحميل...</div>
        ) : subAdmins.length === 0 ? (
          <div className="p-10 text-center text-[#9CA3AF]">لا يوجد مسؤولون فرعيون حتى الآن.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-white/5 text-[#C9A84C]">
                <tr>
                  <th className="px-4 py-4 text-right font-black">الاسم</th>
                  <th className="px-4 py-4 text-right font-black">البريد الإلكتروني</th>
                  <th className="px-4 py-4 text-right font-black">الحالة</th>
                  <th className="px-4 py-4 text-right font-black">تاريخ الإنشاء</th>
                  <th className="px-4 py-4 text-left font-black">الإجراء</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/10">
                {subAdmins.map((admin) => (
                  <tr key={admin.user_id} className="text-[#EDE7DD] hover:bg-white/[0.03]">
                    <td className="px-4 py-4 font-bold text-white">{admin.display_name ?? '—'}</td>
                    <td className="px-4 py-4 font-mono text-xs">{admin.email}</td>
                    <td className="px-4 py-4">
                      <span
                        className={[
                          'rounded-full border px-3 py-1 text-xs font-black',
                          admin.is_active
                            ? 'border-green-400/20 bg-green-400/10 text-green-200'
                            : 'border-red-400/20 bg-red-400/10 text-red-200'
                        ].join(' ')}
                      >
                        {admin.is_active ? 'مفعّل' : 'موقوف'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {admin.created_at ? new Date(admin.created_at).toLocaleDateString('ar-SY') : '—'}
                    </td>
                    <td className="px-4 py-4 text-left">
                      <button
                        type="button"
                        onClick={() => toggleActive(admin.user_id, admin.is_active)}
                        className={admin.is_active ? 'text-xs font-black text-red-300' : 'text-xs font-black text-green-300'}
                      >
                        {admin.is_active ? 'إيقاف' : 'تفعيل'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}