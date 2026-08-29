import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'node:path';

dotenv.config({ path: resolve(process.cwd(), '../../.env.local'), quiet: true });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) throw new Error('Missing live Supabase credentials');

const apply = process.argv.includes('--apply');
const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
const { data: guides, error } = await supabase.from('size_guides').select('id, name, content').order('name');
if (error) throw error;

function canonicalize(content) {
  if (Array.isArray(content)) {
    const preferredHeaders = {
      'دليل مقاسات الأحذية العالمية': ['المقاس الأوروبي (EU)', 'المقاس البريطاني (UK)', 'طول القدم (سم)'],
      'دليل مقاسات الملابس الفاخرة': ['المقاس', 'الصدر (سم)', 'الخصر (سم)', 'الكتف (سم)'],
    };
    const availableHeaders = Object.keys(content[0] ?? {});
    const preferred = preferredHeaders[currentGuideName] ?? [];
    const headers = preferred.length && preferred.every((header) => availableHeaders.includes(header)) ? preferred : availableHeaders;
    return { format: 'row-object-array', content: { headers, rows: content.map((row) => headers.map((header) => String(row?.[header] ?? ''))) } };
  }
  if (!content || typeof content !== 'object') throw new Error('Invalid size guide content');
  const headers = Array.isArray(content.headers) ? content.headers : [];
  const rows = Array.isArray(content.rows) ? content.rows : [];
  if (!headers.every((header) => typeof header === 'string') || !rows.every(Array.isArray)) {
    throw new Error('Invalid legacy size guide content');
  }
  return {
    format: 'canonical',
    content: { headers, rows },
  };
}

let currentGuideName = '';
const repairs = (guides ?? []).map((guide) => {
  currentGuideName = guide.name;
  return { guide, parsed: canonicalize(guide.content) };
});
console.log(JSON.stringify({
  mode: apply ? 'apply' : 'dry-run',
  project: new URL(url).hostname,
  guides: repairs.map(({ guide, parsed }) => ({ id: guide.id, name: guide.name, old_format: parsed.format, row_count: parsed.content.rows.length, headers: parsed.content.headers })),
}, null, 2));

if (apply) {
  for (const { guide, parsed } of repairs) {
    if (parsed.format === 'canonical') continue;
    const { error: updateError } = await supabase.from('size_guides').update({ content: parsed.content }).eq('id', guide.id);
    if (updateError) throw updateError;
  }
  console.log('Live size guides repaired.');
}
