/// <reference lib="dom" />
'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

interface ExchangeRequest {
  id         : string;
  order_id   : string;
  customer_id: string;
  reason     : string;
  status     : string;
  created_at : string;
}

export default function HelperExchangePage() {
  const t = useTranslations();
  const [queue,   setQueue]   = useState<ExchangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [tokens,  setTokens]  = useState<Record<string, string>>({});
  const [genning, setGenning] = useState<Record<string, boolean>>({});

  async function fetchQueue() {
    setLoading(true);
    const res = await fetch('/api/exchange/queue');
    const d   = await res.json() as ExchangeRequest[];
    setQueue(d);
    setLoading(false);
  }

  useEffect(() => { void fetchQueue(); }, []);

  async function generateQR(id: string) {
    setGenning(prev => ({ ...prev, [id]: true }));
    try {
      const res  = await fetch('/api/exchange/generate-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exchange_request_id: id }),
      });
      const data = await res.json() as { token?: string; error?: string };
      if (data.token) setTokens(prev => ({ ...prev, [id]: data.token as string }));
      else window.alert(data.error ?? 'خطأ');
    } finally {
      setGenning(prev => ({ ...prev, [id]: false }));
    }
  }

  return (
    <main className="min-h-screen bg-[#0F0F0F] px-6 py-10 text-[#E2E2E2]">
      <h1 className="text-2xl font-semibold mb-6">{t('helper.exchangeQueue')}</h1>

      {loading ? <p className="text-[#9CA3AF]">{t('common.loading')}</p>
      : queue.length === 0 ? <p className="text-[#9CA3AF]">{t('helper.noExchanges')}</p>
      : (
        <div className="flex flex-col gap-4">
          {queue.map((ex) => (
            <div key={ex.id} className="rounded-lg border border-[#2E2E2E] bg-[#151515] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-xs text-[#9CA3AF]">{ex.id.slice(0, 8)}…</p>
                  <p className="mt-1 text-sm text-[#D6D3C7]">{ex.reason}</p>
                  <p className="mt-1 text-xs text-[#6B7280]">{new Date(ex.created_at).toLocaleDateString('ar-SY')}</p>
                </div>
                {!tokens[ex.id] && (
                  <button
                    onClick={() => generateQR(ex.id)}
                    disabled={genning[ex.id]}
                    className="shrink-0 rounded-md bg-[#C9A84C] px-4 py-2 text-sm font-semibold text-[#0F0F0F] hover:bg-[#A67C2E] disabled:opacity-50"
                  >
                    {genning[ex.id] ? t('common.loading') : t('helper.generateQR')}
                  </button>
                )}
              </div>

              {tokens[ex.id] && (
                <div className="mt-4 rounded-md border border-[#2E2E2E] bg-[#0F0F0F] p-4">
                  <p className="text-xs text-green-400 mb-2">✓ {t('helper.qrReady')}</p>
                  <textarea
                    readOnly
                    className="w-full text-xs font-mono text-[#C9A84C] bg-transparent resize-none h-20 focus:outline-none"
                    value={tokens[ex.id]}
                  />
                  <button
                    onClick={() => (navigator as any).clipboard.writeText(tokens[ex.id] ?? '')}
                    className="mt-2 text-xs text-[#9CA3AF] hover:text-[#C9A84C] underline"
                  >
                    {t('loyalty.copyCode')}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}


