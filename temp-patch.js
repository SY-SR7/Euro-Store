const fs = require('fs');
const glob = require('glob');

const files = glob.sync('apps/admin/src/**/*QuickAdmin.tsx');

let patchedCount = 0;
const targetFnRegex = /async function fetchJson<T>\(url: string, init\?: RequestInit\): Promise<T> \{[\s\S]*?return payload as T;\n\}/g;

const replacement = `async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  
  if (res.status === 401) {
    if (typeof window !== 'undefined') window.location.href = '/login';
    throw new Error('انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً');
  }
  
  const payload = (await res.json().catch(() => null)) as T | { error?: string } | null;
  if (!res.ok) {
    const message =
      payload && typeof payload === 'object' && 'error' in payload && payload.error
        ? (payload.error === 'Unauthorized' ? 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً' : String(payload.error))
        : 'request_failed';
    throw new Error(message);
  }
  return payload as T;
}`;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  if (content.match(targetFnRegex)) {
    content = content.replace(targetFnRegex, replacement);
    fs.writeFileSync(file, content);
    patchedCount++;
  }
}
console.log('Patched fetchJson in ' + patchedCount + ' files');
