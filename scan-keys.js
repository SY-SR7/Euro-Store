const fs = require('fs');
const path = require('path');

function walkFiles(dir, exts) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) results.push(...walkFiles(full, exts));
    else if (exts.some(e => full.endsWith(e))) results.push(full);
  }
  return results;
}

function extractFromFile(content) {
  const result = {}; // ns -> Set of keys
  
  // Find all useTranslations('ns') calls
  const nsRe = /useTranslations\(['"]([^'"]+)['"]\)/g;
  const namespaces = [];
  let m;
  while ((m = nsRe.exec(content)) !== null) {
    namespaces.push(m[1]);
  }
  
  if (namespaces.length === 0) return result;
  
  // Collect all t('key') patterns - t, tCommon, tCart, tNav, etc.
  const keyRe = /\bt[A-Za-z]*\(\s*['"]([^'"]+)['"]/g;
  const keys = [];
  while ((m = keyRe.exec(content)) !== null) {
    const key = m[1];
    if (!key.includes('{') && !key.startsWith('/') && key.length < 100 && !key.includes('http')) {
      keys.push(key);
    }
  }
  
  // Assign all keys to all namespaces found in file (rough but workable)
  for (const ns of namespaces) {
    if (!result[ns]) result[ns] = new Set();
    for (const k of keys) result[ns].add(k);
  }
  
  return result;
}

function mergeResults(target, source) {
  for (const [ns, keys] of Object.entries(source)) {
    if (!target[ns]) target[ns] = new Set();
    for (const k of keys) target[ns].add(k);
  }
}

// Scan admin
const adminFiles = walkFiles('apps/admin/src', ['.tsx', '.ts']);
const adminKeys = {};
for (const f of adminFiles) {
  const content = fs.readFileSync(f, 'utf8');
  mergeResults(adminKeys, extractFromFile(content));
}

// Scan web
const webFiles = walkFiles('apps/web/src', ['.tsx', '.ts']);
const webKeys = {};
for (const f of webFiles) {
  const content = fs.readFileSync(f, 'utf8');
  mergeResults(webKeys, extractFromFile(content));
}

// Output
const adminOut = {};
for (const [ns, keys] of Object.entries(adminKeys)) {
  adminOut[ns] = Array.from(keys).sort();
}

const webOut = {};
for (const [ns, keys] of Object.entries(webKeys)) {
  webOut[ns] = Array.from(keys).sort();
}

fs.writeFileSync('scan-admin-keys.json', JSON.stringify(adminOut, null, 2));
fs.writeFileSync('scan-web-keys.json', JSON.stringify(webOut, null, 2));

console.log('Admin namespaces:', Object.keys(adminOut).join(', '));
console.log('Web namespaces:', Object.keys(webOut).join(', '));
