'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

interface SubAdmin {
  user_id: string;
  display_name: string | null;
  email: string;
  is_active: boolean;
  created_at: string;
}

interface NewSubAdminForm {
  email: string;
  password: string;
  display_name: string;
}

export default function AdminSubAdminsPage() {
  const t = useTranslations();
  const [subAdmins, setSubAdmins] = useState<SubAdmin[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState<NewSubAdminForm>({ email: '', password: '', display_name: '' });
  const [creating, setCreating]   = useState(false);
  const [msg, setMsg]             = useState('');
  const [err, setErr]             = useState('');

  function loadSubAdmins() {
    setLoading(true);
    void fetch('/api/sub-admins').then(r => r.json()).then((d: SubAdmin[]) => {
      setSubAdmins(d);
      setLoading(false);
    });
  }

  useEffect(() => { loadSubAdmins(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true); setErr(''); setMsg('');
    const res = await fetch('/api/sub-admins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json() as { error?: string };
    if (res.ok) {
      setMsg('ØªÙ… Ø¥Ù†Ø´Ø§Ø¡ Ø­Ø³Ø§Ø¨ Ø§Ù„Ù…Ø³Ø¤ÙˆÙ„ Ø§Ù„ÙØ±Ø¹ÙŠ Ø¨Ù†Ø¬Ø§Ø­');
      setShowForm(false);
      setForm({ email: '', password: '', display_name: '' });
      loadSubAdmins();
    } else {
      setErr(data.error ?? 'Ø­Ø¯Ø« Ø®Ø·Ø£');
    }
    setCreating(false);
  }

  async function toggleActive(userId: string, current: boolean) {
    await fetch(`/api/sub-admins/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !current }),
    });
    loadSubAdmins();
  }

  const inputCls = "input-admin";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#E2E2E2]">{t('admin.subAdmins')}</h1>
        <button
          onClick={() => { setShowForm(!showForm); setErr(''); setMsg(''); }}
          className="rounded-sm bg-[#C9A84C] px-4 py-2 text-sm font-semibold text-[#111] hover:bg-[#D8B95F] transition-colors"
        >
          {showForm ? t('common.cancel') : '+ Ø¥Ø¶Ø§ÙØ© Ù…Ø³Ø¤ÙˆÙ„ ÙØ±Ø¹ÙŠ'}
        </button>
      </div>

      {msg && <p className="text-sm text-green-400 bg-green-900/20 border border-green-800 rounded px-4 py-2">{msg}</p>}

      {/* Create form */}
      {showForm && (
        <form onSubmit={(e) => void handleCreate(e)} className="rounded-lg border border-[#2E2E2E] bg-[#111] p-6 space-y-4">
          <h2 className="font-semibold text-[#E2E2E2] mb-2">Ø¥Ù†Ø´Ø§Ø¡ Ø­Ø³Ø§Ø¨ Ù…Ø³Ø¤ÙˆÙ„ ÙØ±Ø¹ÙŠ Ø¬Ø¯ÙŠØ¯</h2>
          {err && <p className="text-sm text-red-400">{err}</p>}
          <div>
            <label className="block text-xs text-[#9CA3AF] mb-1">Ø§Ù„Ø§Ø³Ù… Ø§Ù„Ø¸Ø§Ù‡Ø±</label>
            <input className={inputCls} value={form.display_name} onChange={e => setForm(f => ({ ...f, display_name: (e.target as HTMLInputElement).value }))} placeholder="Ø§Ø³Ù… Ø§Ù„Ù…Ø³Ø¤ÙˆÙ„" required />
          </div>
          <div>
            <label className="block text-xs text-[#9CA3AF] mb-1">Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ</label>
            <input className={inputCls} type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: (e.target as HTMLInputElement).value }))} placeholder="admin@example.com" required />
          </div>
          <div>
            <label className="block text-xs text-[#9CA3AF] mb-1">ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± (8 Ø£Ø­Ø±Ù Ø¹Ù„Ù‰ Ø§Ù„Ø£Ù‚Ù„)</label>
            <input className={inputCls} type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: (e.target as HTMLInputElement).value }))} placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢" minLength={8} required />
          </div>
          <button
            type="submit"
            disabled={creating}
            className="rounded-sm bg-[#C9A84C] px-5 py-2 text-sm font-semibold text-[#111] hover:bg-[#D8B95F] disabled:opacity-50 transition-colors"
          >
            {creating ? 'Ø¬Ø§Ø±ÙŠ Ø§Ù„Ø¥Ù†Ø´Ø§Ø¡...' : 'Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ø­Ø³Ø§Ø¨'}
          </button>
        </form>
      )}

      {/* Table */}
      {loading ? (
        <p className="text-[#9CA3AF]">{t('common.loading')}</p>
      ) : subAdmins.length === 0 ? (
        <div className="rounded-md border border-[#2E2E2E] bg-[#151515] p-8 text-center text-[#9CA3AF]">
          Ù„Ø§ ÙŠÙˆØ¬Ø¯ Ù…Ø³Ø¤ÙˆÙ„ÙˆÙ† ÙØ±Ø¹ÙŠÙˆÙ† Ø­ØªÙ‰ Ø§Ù„Ø¢Ù†
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#2E2E2E]">
          <table className="w-full text-sm text-[#E2E2E2]">
            <thead className="bg-[#1A1A1A] text-[#9CA3AF]">
              <tr>
                <th className="px-4 py-3 text-start">Ø§Ù„Ø§Ø³Ù…</th>
                <th className="px-4 py-3 text-start">Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ</th>
                <th className="px-4 py-3 text-start">Ø§Ù„Ø­Ø§Ù„Ø©</th>
                <th className="px-4 py-3 text-start">ØªØ§Ø±ÙŠØ® Ø§Ù„Ø¥Ù†Ø´Ø§Ø¡</th>
                <th className="px-4 py-3 text-start"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2E2E2E]">
              {subAdmins.map((sa) => (
                <tr key={sa.user_id} className="hover:bg-[#161616]">
                  <td className="px-4 py-3 font-medium">{sa.display_name ?? 'â€”'}</td>
                  <td className="px-4 py-3 text-[#9CA3AF]">{sa.email}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-sm px-2 py-0.5 text-xs font-medium ${sa.is_active ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                      {sa.is_active ? t('common.active') : t('common.inactive')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#6B7280] text-xs">
                    {new Date(sa.created_at).toLocaleDateString('ar-SY')}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => void toggleActive(sa.user_id, sa.is_active)}
                      className={`text-xs hover:underline ${sa.is_active ? 'text-red-400' : 'text-green-400'}`}
                    >
                      {sa.is_active ? 'Ø¥ÙŠÙ‚Ø§Ù' : 'ØªÙØ¹ÙŠÙ„'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
