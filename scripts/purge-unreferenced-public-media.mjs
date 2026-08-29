import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

const requireFromWeb = createRequire(new URL('../apps/web/package.json', import.meta.url));
const { createClient } = requireFromWeb('@supabase/supabase-js');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) throw new Error('Missing Supabase media cleanup credentials.');

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function select(table, columns) {
  const { data, error } = await supabase.from(table).select(columns);
  if (error) throw new Error(`${table}: ${error.message}`);
  return data ?? [];
}

function collectUrls(value, urls = new Set()) {
  if (typeof value === 'string') {
    if (value.startsWith('http://') || value.startsWith('https://')) urls.add(value);
    return urls;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectUrls(item, urls);
    return urls;
  }
  if (value && typeof value === 'object') {
    for (const item of Object.values(value)) collectUrls(item, urls);
  }
  return urls;
}

function storagePath(publicUrl, bucketName) {
  const marker = `/storage/v1/object/public/${bucketName}/`;
  const index = publicUrl.indexOf(marker);
  if (index === -1) return null;
  return decodeURIComponent(publicUrl.slice(index + marker.length).split('?')[0]);
}

async function listFiles(bucketName, prefix = '') {
  const files = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase.storage.from(bucketName).list(prefix, {
      limit: 100,
      offset,
      sortBy: { column: 'name', order: 'asc' },
    });
    if (error) throw new Error(`${bucketName}/${prefix || '<root>'}: ${error.message}`);
    const entries = data ?? [];

    for (const entry of entries) {
      const path = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.id) files.push(path);
      else files.push(...await listFiles(bucketName, path));
    }

    if (entries.length < 100) break;
    offset += entries.length;
  }

  return files;
}

const [images, categories, brands, sections, videos] = await Promise.all([
  select('product_images', 'url'),
  select('categories', 'image_url'),
  select('brands', 'logo_url'),
  select('homepage_sections', 'content'),
  select('product_videos', 'url,thumbnail_url'),
]);

const publicUrls = collectUrls([
  images.map((row) => row.url),
  categories.map((row) => row.image_url),
  brands.map((row) => row.logo_url),
  sections.map((row) => row.content),
  videos.flatMap((row) => [row.url, row.thumbnail_url]),
]);

const bucketNames = ['product-images', 'product-videos'];
const inventory = {};

for (const bucketName of bucketNames) {
  const files = await listFiles(bucketName);
  const referenced = new Set(
    [...publicUrls]
      .map((publicUrl) => storagePath(publicUrl, bucketName))
      .filter(Boolean),
  );
  const orphaned = files.filter((path) => !referenced.has(path));
  inventory[bucketName] = {
    files,
    referenced: [...referenced].sort(),
    orphaned,
  };
}

await mkdir('_handoff/backups', { recursive: true });
const timestamp = new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-');
const backupPath = `_handoff/backups/public-media-before-purge-${timestamp}.json`;
await writeFile(backupPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), inventory }, null, 2)}\n`);

for (const bucketName of bucketNames) {
  const orphaned = inventory[bucketName].orphaned;
  for (let start = 0; start < orphaned.length; start += 100) {
    const batch = orphaned.slice(start, start + 100);
    const { error } = await supabase.storage.from(bucketName).remove(batch);
    if (error) throw new Error(`${bucketName} cleanup: ${error.message}`);
  }
}

const verification = {};
for (const bucketName of bucketNames) {
  const files = await listFiles(bucketName);
  const expected = new Set(inventory[bucketName].referenced);
  verification[bucketName] = {
    files: files.length,
    orphanedRemaining: files.filter((path) => !expected.has(path)),
    missingReferences: [...expected].filter((path) => !files.includes(path)),
  };
}

console.log(JSON.stringify({
  projectHost: new URL(url).hostname,
  backupPath,
  removed: Object.fromEntries(bucketNames.map((name) => [name, inventory[name].orphaned.length])),
  verification,
}, null, 2));
