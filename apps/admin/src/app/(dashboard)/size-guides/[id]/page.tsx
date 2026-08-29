'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useLocale } from 'next-intl';

type SizeGuideData = { name: string; content: { headers: string[]; rows: string[][] } };

function parseSizeGuide(value: unknown): SizeGuideData | null {
  if (!value || typeof value !== 'object') return null;
  const sizeGuide = (value as { size_guide?: unknown }).size_guide;
  if (!sizeGuide || typeof sizeGuide !== 'object') return null;
  const record = sizeGuide as { name?: unknown; content?: unknown };
  if (typeof record.name !== 'string' || !record.content || typeof record.content !== 'object' || Array.isArray(record.content)) return null;
  const content = record.content as { headers?: unknown; rows?: unknown };
  if (!Array.isArray(content.headers) || !content.headers.every((header) => typeof header === 'string') || !Array.isArray(content.rows)) return null;
  const rows = content.rows.flatMap((row) => Array.isArray(row) ? [row.map((cell) => typeof cell === 'string' ? cell : String(cell ?? ''))] : []);
  return { name: record.name, content: { headers: content.headers, rows } };
}

function responseError(value: unknown, fallback: string): string {
  if (!value || typeof value !== 'object') return fallback;
  const error = (value as { error?: unknown }).error;
  return typeof error === 'string' ? error : fallback;
}

export default function EditSizeGuidePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const isAr = useLocale() === 'ar';
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [msg, setMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const [name, setName] = useState('');
  
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch(`/api/admin/size-guides/${id}`);
        const payload: unknown = await response.json().catch(() => null);
        if (!response.ok) throw new Error(responseError(payload, 'load_failed'));
        const data = parseSizeGuide(payload);
        if (!data) throw new Error('invalid_size_guide');
        setName(data.name);

        if (data.content.headers.length > 0 && data.content.rows.length > 0) {
          setHeaders(data.content.headers);
          setRows(data.content.rows);
        } else {
          setHeaders(isAr ? ['المقاس', 'القياس'] : ['Size', 'Measurement']);
          setRows([['', '']]);
        }
      } catch (error: unknown) {
        setMsg({ type: 'error', text: error instanceof Error ? error.message : 'load_failed' });
      } finally {
        setFetching(false);
      }
    }
    void load();
  }, [id, isAr]);

  function addRow() {
    setRows([...rows, new Array(headers.length).fill('')]);
  }

  function addColumn() {
    setHeaders([...headers, isAr ? 'عمود جديد' : 'New Column']);
    setRows(rows.map(row => [...row, '']));
  }

  function removeRow(index: number) {
    if (rows.length <= 1) return;
    setRows(rows.filter((_, i) => i !== index));
  }

  function removeColumn(index: number) {
    if (headers.length <= 1) return;
    setHeaders(headers.filter((_, i) => i !== index));
    setRows(rows.map(row => row.filter((_, i) => i !== index)));
  }

  function updateHeader(index: number, value: string) {
    const newHeaders = [...headers];
    newHeaders[index] = value;
    setHeaders(newHeaders);
  }

  function updateCell(rowIndex: number, colIndex: number, value: string) {
    const newRows = [...rows];
    newRows[rowIndex][colIndex] = value;
    setRows(newRows);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name) {
      setMsg({ type: 'error', text: isAr ? 'اسم الدليل مطلوب' : 'Name is required' });
      return;
    }
    
    setLoading(true);
    setMsg(null);

    const safeHeaders = headers.map((header, index) => header.trim() || (isAr ? `العمود ${index + 1}` : `Column ${index + 1}`));
    const content = { headers: safeHeaders, rows };

    try {
      const response = await fetch(`/api/admin/size-guides/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, content }),
      });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) throw new Error(responseError(payload, 'save_failed'));
      
      setMsg({ type: 'success', text: isAr ? 'تم تحديث دليل المقاسات بنجاح.' : 'Size guide updated successfully.' });
      setTimeout(() => router.push('/size-guides'), 1000);
    } catch (error: unknown) {
      setMsg({ type: 'error', text: error instanceof Error ? error.message : (isAr ? 'حدث خطأ' : 'An error occurred') });
    } finally {
      setLoading(false);
    }
  }

  if (fetching) return <div className="p-8 text-center text-muted-foreground">{isAr ? 'جار التحميل...' : 'Loading...'}</div>;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-4">
        <Link href="/size-guides" aria-label={isAr ? 'العودة إلى أدلة المقاسات' : 'Back to size guides'} title={isAr ? 'العودة إلى أدلة المقاسات' : 'Back to size guides'} className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold">{isAr ? 'تعديل دليل المقاسات' : 'Edit Size Guide'}</h1>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
        {msg && (
          <div className={`p-4 rounded-lg text-sm font-medium ${msg.type === 'error' ? 'bg-destructive/10 text-destructive' : 'bg-green-100 text-green-800'}`}>
            {msg.text}
          </div>
        )}

        <div className="max-w-md space-y-2">
          <label className="text-sm font-medium">{isAr ? 'اسم الدليل' : 'Guide Name'} <span className="text-destructive">*</span></label>
          <input required type="text" placeholder={isAr ? 'مثال: قمصان رجالية' : "e.g. Men's T-Shirts"} value={name} onChange={e => setName(e.target.value)} className="w-full rounded-lg border p-2.5 text-sm" />
        </div>

        <div className="space-y-4 pt-6 border-t border-border">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{isAr ? 'إعداد جدول المقاسات' : 'Size Table Configuration'}</h3>
            <div className="flex gap-2">
              <button onClick={addColumn} type="button" className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80">
                <Plus className="w-3.5 h-3.5" /> {isAr ? 'إضافة عمود' : 'Add Column'}
              </button>
              <button onClick={addRow} type="button" className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80">
                <Plus className="w-3.5 h-3.5" /> {isAr ? 'إضافة صف' : 'Add Row'}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-border rounded-lg">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted">
                <tr>
                  {headers.map((header, i) => (
                    <th key={i} className="p-2 min-w-[150px] relative group">
                      <div className="flex items-center gap-2">
                        <input
                          aria-label={isAr ? `عنوان العمود ${i + 1}` : `Column ${i + 1} header`}
                          type="text"
                          value={header}
                          onChange={(e) => updateHeader(i, e.target.value)}
                          className="w-full bg-transparent border-b border-transparent focus:border-primary focus:outline-none p-1 font-semibold"
                        />
                        {headers.length > 1 && (
                          <button onClick={() => removeColumn(i)} type="button" aria-label={isAr ? 'حذف العمود' : 'Remove column'} className="opacity-0 group-hover:opacity-100 p-1 text-destructive hover:bg-destructive/10 rounded transition-opacity" title={isAr ? 'حذف العمود' : 'Remove column'}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </th>
                  ))}
                  <th className="p-2 w-[50px]"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row, i) => (
                  <tr key={i} className="hover:bg-muted/30">
                    {row.map((cell, j) => (
                      <td key={j} className="p-2">
                        <input
                          aria-label={isAr ? `الصف ${i + 1}، العمود ${j + 1}` : `Row ${i + 1}, column ${j + 1}`}
                          type="text"
                          value={cell}
                          onChange={(e) => updateCell(i, j, e.target.value)}
                          className="w-full border border-transparent hover:border-border focus:border-primary rounded p-1.5 focus:outline-none bg-transparent transition-colors"
                        />
                      </td>
                    ))}
                    <td className="p-2 text-center">
                      {rows.length > 1 && (
                        <button onClick={() => removeRow(i)} type="button" aria-label={isAr ? 'حذف الصف' : 'Remove row'} className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors" title={isAr ? 'حذف الصف' : 'Remove row'}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end pt-6 border-t border-border">
          <button onClick={(event) => void handleSubmit(event)} disabled={loading} className="flex items-center gap-2 bg-primary text-primary-foreground font-medium px-6 py-2.5 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50">
            <Save className="w-4 h-4" />
            {loading ? (isAr ? 'جار الحفظ...' : 'Saving...') : (isAr ? 'تحديث دليل المقاسات' : 'Update Size Guide')}
          </button>
        </div>
      </div>
    </div>
  );
}
