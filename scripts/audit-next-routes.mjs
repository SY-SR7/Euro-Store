import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const appNames = ['web', 'admin', 'helper', 'partner'];

function filesUnder(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (['node_modules', '.next'].includes(entry.name)) return [];
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? filesUnder(full) : [full];
  });
}

function routeFromFile(appRoot, file, leaf) {
  const relative = path.relative(appRoot, path.dirname(file)).replaceAll('\\', '/');
  const segments = relative.split('/').filter(Boolean).filter((segment) => !(segment.startsWith('(') && segment.endsWith(')')));
  if (segments.at(-1) === leaf) segments.pop();
  return '/' + segments.join('/');
}

function routeRegex(route) {
  const escaped = route.split('/').map((segment) => {
    if (/^\[\[\.\.\..+\]\]$/.test(segment)) return '(?:.+)?';
    if (/^\[\.\.\..+\]$/.test(segment)) return '.+';
    if (/^\[.+\]$/.test(segment)) return '[^/]+';
    return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }).join('/');
  return new RegExp('^' + (escaped || '/') + '/?$');
}

function staticTarget(raw) {
  const value = raw.trim();
  if (/^['"][^'"]+['"]$/.test(value)) return value.slice(1, -1);
  if (/^`[^`]+`$/.test(value)) {
    const template = value.slice(1, -1);
    return template.replace(/\$\{[^}]+\}/g, (expression, offset) => {
      const previous = template[offset - 1];
      const next = template[offset + expression.length];
      return previous === '/' && (!next || next === '/' || next === '?' || next === '#') ? '__dynamic__' : '';
    });
  }
  return null;
}

function matchesRouteReference(pathname, matcher) {
  if (!pathname.includes('__dynamic__')) return matcher.regex.test(pathname);
  const targetSegments = pathname.split('/').filter(Boolean);
  const routeSegments = matcher.route.split('/').filter(Boolean);
  if (targetSegments.length !== routeSegments.length) return false;

  return targetSegments.every((segment, index) => {
    if (segment === '__dynamic__') return true;
    if (/^\[(?:\.{3})?.+\]$/.test(routeSegments[index])) return true;
    return segment === routeSegments[index];
  });
}

function normalizeMobileTarget(target) {
  const [pathname, suffix = ''] = target.split(/([?#].*)/, 2);
  const normalized = pathname
    .split('/')
    .filter((segment) => !(segment.startsWith('(') && segment.endsWith(')')))
    .join('/');
  return (normalized || '/') + suffix;
}

const payload = { generatedAt: new Date().toISOString(), apps: {}, issues: [] };
for (const app of appNames) {
  const appRoot = path.join(root, 'apps', app, 'src', 'app');
  const files = filesUnder(appRoot);
  const pages = files.filter((file) => path.basename(file) === 'page.tsx').map((file) => ({ route: routeFromFile(appRoot, file, ''), file }));
  const apis = files.filter((file) => path.basename(file) === 'route.ts').map((file) => ({ route: routeFromFile(appRoot, file, ''), file }));
  const pageMatchers = pages.map((item) => ({ ...item, regex: routeRegex(item.route) }));
  const apiMatchers = apis.map((item) => ({ ...item, regex: routeRegex(item.route) }));
  const references = [];

  for (const file of files.filter((item) => /\.(?:ts|tsx|js|jsx)$/.test(item))) {
    const source = fs.readFileSync(file, 'utf8');
    const patterns = [
      { kind: 'href', regex: /\bhref\s*=\s*(?:{\s*)?((?:['"][^'"]+['"])|(?:`[^`]+`))(?:\s*})?/g },
      { kind: 'fetch', regex: /\bfetch\(\s*((?:['"][^'"]+['"])|(?:`[^`]+`))/g },
      { kind: 'form-action', regex: /<form\b[^>]*\baction\s*=\s*((?:['"][^'"]+['"])|(?:`[^`]+`))/g },
    ];
    for (const pattern of patterns) {
      for (const match of source.matchAll(pattern.regex)) {
        const target = staticTarget(match[1]);
        if (!target || !target.startsWith('/')) continue;
        const line = source.slice(0, match.index).split(/\r?\n/).length;
        references.push({ kind: pattern.kind, target, file: path.relative(root, file).replaceAll('\\', '/'), line });
      }
    }
  }

  const duplicates = new Map();
  for (const page of pages) duplicates.set(page.route, [...(duplicates.get(page.route) ?? []), page.file]);
  for (const [route, routeFiles] of duplicates) {
    if (routeFiles.length > 1) payload.issues.push({ app, severity: 'high', rule: 'duplicate-page-route', target: route, files: routeFiles.map((file) => path.relative(root, file).replaceAll('\\', '/')) });
  }

  for (const reference of references) {
    const pathname = reference.target.split(/[?#]/)[0] || '/';
    const expectsApi = pathname.startsWith('/api/');
    const matchers = expectsApi ? apiMatchers : pageMatchers;
    if (!matchers.some((item) => matchesRouteReference(pathname, item))) {
      payload.issues.push({ app, severity: 'high', rule: expectsApi ? 'missing-api-route' : 'missing-page-route', ...reference });
    }
  }

  payload.apps[app] = {
    pages: pages.map((item) => item.route).sort(),
    apis: apis.map((item) => item.route).sort(),
    references,
  };
}

const mobileRoot = path.join(root, 'apps', 'mobile');
const mobileAppRoot = path.join(mobileRoot, 'app');
const mobileFiles = filesUnder(mobileRoot).filter((file) => !file.includes(`${path.sep}android${path.sep}`) && !file.includes(`${path.sep}ios${path.sep}`));
const mobilePages = filesUnder(mobileAppRoot)
  .filter((file) => /\.(?:ts|tsx|js|jsx)$/.test(file) && !path.basename(file).startsWith('_'))
  .map((file) => {
    const relative = path.relative(mobileAppRoot, file).replaceAll('\\', '/').replace(/\.(?:ts|tsx|js|jsx)$/, '');
    const segments = relative.split('/').filter(Boolean).filter((segment) => !(segment.startsWith('(') && segment.endsWith(')')));
    if (segments.at(-1) === 'index') segments.pop();
    return { route: '/' + segments.join('/'), file };
  });
const mobilePageMatchers = mobilePages.map((item) => ({ ...item, regex: routeRegex(item.route) }));
const webApiMatchers = payload.apps.web.apis.map((route) => ({ route, regex: routeRegex(route) }));
const mobileReferences = [];

for (const file of mobileFiles.filter((item) => /\.(?:ts|tsx|js|jsx)$/.test(item))) {
  const source = fs.readFileSync(file, 'utf8');
  const patterns = [
    { kind: 'href', regex: /\bhref\s*=\s*(?:{\s*)?((?:['"][^'"]+['"])|(?:`[^`]+`))(?:\s*})?/g },
    { kind: 'router', regex: /\b(?:router|navigation)\.(?:push|replace|navigate)\(\s*((?:['"][^'"]+['"])|(?:`[^`]+`))/g },
    { kind: 'api', regex: /\b(?:apiFetch|apiDownload)\s*(?:<[^>]+>)?\(\s*((?:['"][^'"]+['"])|(?:`[^`]+`))/g },
  ];

  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern.regex)) {
      const rawTarget = staticTarget(match[1]);
      if (!rawTarget || !rawTarget.startsWith('/')) continue;
      const target = normalizeMobileTarget(rawTarget);
      const line = source.slice(0, match.index).split(/\r?\n/).length;
      mobileReferences.push({ kind: pattern.kind, target, file: path.relative(root, file).replaceAll('\\', '/'), line });
    }
  }
}

for (const reference of mobileReferences) {
  const pathname = reference.target.split(/[?#]/)[0] || '/';
  const expectsApi = pathname.startsWith('/api/');
  const matchers = expectsApi ? webApiMatchers : mobilePageMatchers;
  if (!matchers.some((item) => matchesRouteReference(pathname, item))) {
    payload.issues.push({ app: 'mobile', severity: 'high', rule: expectsApi ? 'missing-web-api-route' : 'missing-mobile-page-route', ...reference });
  }
}

payload.apps.mobile = {
  pages: mobilePages.map((item) => item.route).sort(),
  apis: [],
  apiProvider: 'web',
  references: mobileReferences,
};

const output = path.join(root, '_handoff', 'CODEX_NEXT_ROUTE_AUDIT_2026-08-28.json');
fs.writeFileSync(output, JSON.stringify(payload, null, 2) + '\n');
console.log(JSON.stringify({ output: path.relative(root, output), issues: payload.issues.length, byRule: Object.groupBy(payload.issues, (issue) => issue.rule) }, null, 2));
if (payload.issues.length) {
  for (const issue of payload.issues) console.log(`${issue.app} | ${issue.rule} | ${issue.target} | ${issue.file ?? issue.files?.join(',')}:${issue.line ?? ''}`);
}
