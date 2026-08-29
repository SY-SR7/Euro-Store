const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export type CspApplication = 'web' | 'admin' | 'helper' | 'partner';

export function createCspNonce(): string {
  return crypto.randomUUID().replaceAll('-', '');
}

export function createContentSecurityPolicy(
  application: CspApplication,
  nonce: string,
  development = false,
): string {
  const web = application === 'web';
  const scriptSources = [
    "'self'",
    `'nonce-${nonce}'`,
    "'strict-dynamic'",
    ...(development ? ["'unsafe-eval'"] : []),
    ...(web ? ['https://va.vercel-scripts.com'] : []),
  ];
  const directives = [
    "default-src 'self'",
    `script-src ${scriptSources.join(' ')}`,
    `style-src 'self' 'unsafe-inline'${web ? ' https://fonts.googleapis.com' : ''}`,
    `font-src 'self' data:${web ? ' https://fonts.gstatic.com' : ''}`,
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https: wss: ws: https://*.supabase.co wss://*.supabase.co",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(development ? [] : ['upgrade-insecure-requests']),
  ];
  return directives.join('; ');
}

export function safeInternalPath(value: string | null | undefined, fallback = '/') {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return fallback;

  try {
    const parsed = new URL(value, 'https://eurostore.invalid');
    if (parsed.origin !== 'https://eurostore.invalid') return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

export function isAllowedMutationOrigin(
  request: Pick<Request, 'method' | 'url' | 'headers'>,
  extraAllowedOrigins: readonly string[] = [],
) {
  if (SAFE_METHODS.has(request.method.toUpperCase())) return true;

  const fetchSite = request.headers.get('sec-fetch-site');
  if (fetchSite === 'cross-site') return false;

  const origin = request.headers.get('origin');
  if (!origin) {
    if (fetchSite === 'same-origin') return true;
    const hasBearer = /^Bearer\s+\S+$/i.test(request.headers.get('authorization') ?? '');
    const hasCookie = Boolean(request.headers.get('cookie'));
    return hasBearer && !hasCookie;
  }

  try {
    const requestOrigin = new URL(request.url).origin;
    const normalizedOrigin = new URL(origin).origin;
    if (normalizedOrigin === requestOrigin) return true;

    return extraAllowedOrigins.some((allowed) => {
      try {
        return new URL(allowed).origin === normalizedOrigin;
      } catch {
        return false;
      }
    });
  } catch {
    return false;
  }
}
