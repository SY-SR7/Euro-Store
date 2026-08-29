'use client';
import { X, Ruler } from 'lucide-react';
import type { Json } from '@eurostore/database';
import { useEffect } from 'react';

interface SizeGuide {
  name: string;
  content: Json | null;
}

function displayCell(value: Json | undefined): string {
  if (value === null || value === undefined) return '';
  return typeof value === 'object' ? JSON.stringify(value) : String(value);
}

function isJsonArray(value: Json | undefined): value is Json[] {
  return Array.isArray(value);
}

function tableData(content: Json | null): { headers: string[]; rows: string[][] } {
  if (Array.isArray(content)) {
    const records = content.filter((row): row is Record<string, Json | undefined> => Boolean(row) && typeof row === 'object' && !Array.isArray(row));
    const headers = Object.keys(records[0] ?? {});
    return { headers, rows: records.map((row) => headers.map((header) => displayCell(row[header]))) };
  }
  if (content && typeof content === 'object') {
    const legacy = content as Record<string, Json | undefined>;
    const headers = Array.isArray(legacy.headers) ? legacy.headers.map((header) => displayCell(header)) : [];
    const rows = Array.isArray(legacy.rows)
      ? legacy.rows.filter(isJsonArray).map((row) => headers.map((_, index) => displayCell(row[index])))
      : [];
    return { headers, rows };
  }
  return { headers: [], rows: [] };
}

export function SizeGuideModal({ guide, isAr, onClose }: { guide: SizeGuide | null; isAr: boolean; onClose: () => void }) {
  const { headers, rows } = tableData(guide?.content ?? null);
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);
  if (!guide?.content) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onMouseDown={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="size-guide-title" className="relative w-full max-w-2xl bg-background-card rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200" onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border p-6 bg-surface-elevated/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 text-primary rounded-xl">
              <Ruler className="w-5 h-5" />
            </div>
            <h2 id="size-guide-title" className="text-xl font-bold text-text-primary">{isAr ? 'دليل المقاسات' : 'Size Guide'}: {guide.name}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label={isAr ? 'إغلاق دليل المقاسات' : 'Close size guide'} className="p-2 rounded-xl text-text-muted hover:bg-surface-elevated hover:text-text-primary transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-x-auto">
          {rows.length > 0 ? (
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-surface-elevated text-text-secondary border-b border-border">
                <tr>
                  {headers.map((col) => (
                    <th key={col} className="px-6 py-4 font-bold">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row, i) => (
                  <tr key={i} className="hover:bg-surface-elevated/50 transition-colors">
                    {row.map((value, j) => (
                      <td key={j} className="px-6 py-4">{value}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-10 text-text-muted">
              {isAr ? 'لا توجد بيانات متاحة.' : 'No data available.'}
            </div>
          )}
        </div>
        
        <div className="p-6 bg-surface-elevated/50 border-t border-border text-center">
          <button type="button" onClick={onClose} className="bg-primary text-primary-foreground font-bold py-2.5 px-8 rounded-xl hover:bg-primary/90 transition-colors">
            {isAr ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
