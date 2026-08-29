import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export type ApiRateLimitCategory = 'auth' | 'admin_auth' | 'totp' | 'public_catalog' | 'api';

const policies: Record<ApiRateLimitCategory, { limit: number; window: `${number} ${'s' | 'm' | 'h'}`; windowMs: number }> = {
  auth: { limit: 10, window: '15 m', windowMs: 15 * 60_000 },
  admin_auth: { limit: 5, window: '15 m', windowMs: 15 * 60_000 },
  totp: { limit: 3, window: '30 m', windowMs: 30 * 60_000 },
  public_catalog: { limit: 60, window: '1 m', windowMs: 60_000 },
  api: { limit: 100, window: '1 m', windowMs: 60_000 },
};

const memoryBuckets = new Map<string, { count: number; reset: number }>();
const distributedLimiters = new Map<ApiRateLimitCategory, Ratelimit>();

function distributedLimiter(category: ApiRateLimitCategory) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  const existing = distributedLimiters.get(category);
  if (existing) return existing;
  const policy = policies[category];
  const limiter = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(policy.limit, policy.window),
    prefix: `eurostore:${category}`,
  });
  distributedLimiters.set(category, limiter);
  return limiter;
}

async function fingerprint(request: Request) {
  const cookie = request.headers.get('cookie') ?? '';
  const authCookie = cookie.match(/(?:^|;\s*)(sb-[^=;]+-auth-token)=([^;]+)/)?.[2];
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const source = authCookie ? `session:${authCookie}` : `ip:${forwarded || request.headers.get('x-real-ip') || 'unknown'}`;
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(source));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function apiRateLimitCategory(pathname: string, app: 'web' | 'admin' | 'helper' | 'partner'): ApiRateLimitCategory {
  if (pathname.includes('/verify-2fa')) return 'totp';
  if (app === 'admin' && pathname.includes('/auth/login')) return 'admin_auth';
  if (app === 'web' && ['/api/auth/login', '/api/auth/register', '/api/auth/forgot-password'].includes(pathname)) return 'auth';
  if (app === 'web' && (pathname === '/api/products' || pathname.startsWith('/api/products/') || pathname.startsWith('/api/search') || pathname.startsWith('/api/catalog/filters'))) return 'public_catalog';
  return 'api';
}

export async function limitApiRequest(request: Request, category: ApiRateLimitCategory) {
  const identifier = await fingerprint(request);
  const policy = policies[category];
  const remote = distributedLimiter(category);
  if (remote) {
    try {
      return await remote.limit(identifier);
    } catch {
      // A local fail-closed limiter still protects this process if Redis is unavailable.
    }
  }

  const key = `${category}:${identifier}`;
  const now = Date.now();
  const current = memoryBuckets.get(key);
  const bucket = !current || current.reset <= now ? { count: 0, reset: now + policy.windowMs } : current;
  bucket.count += 1;
  memoryBuckets.set(key, bucket);
  if (memoryBuckets.size > 10_000) {
    for (const [bucketKey, value] of memoryBuckets) if (value.reset <= now) memoryBuckets.delete(bucketKey);
  }
  return { success: bucket.count <= policy.limit, limit: policy.limit, remaining: Math.max(0, policy.limit - bucket.count), reset: bucket.reset };
}

