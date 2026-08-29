import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type FallbackWindow = { limit: number; windowMs: number };
type Limiter = ReturnType<typeof Ratelimit.slidingWindow>;
type LimitResult = { success: boolean; limit: number; remaining: number; reset: number };
type SafeRatelimit = { limit(identifier: string): Promise<LimitResult> };

function createMemoryRatelimit({ limit, windowMs }: FallbackWindow): SafeRatelimit {
  const hits = new Map<string, number[]>();

  return {
    limit(identifier: string) {
      const now = Date.now();
      const active = (hits.get(identifier) ?? []).filter((timestamp) => timestamp > now - windowMs);
      const success = active.length < limit;
      if (success) active.push(now);
      hits.set(identifier, active);

      return Promise.resolve({
        success,
        limit,
        remaining: Math.max(0, limit - active.length),
        reset: active[0] ? active[0] + windowMs : now + windowMs,
      });
    },
  };
}

export function createSafeRatelimit(limiter: Limiter, fallback: FallbackWindow): SafeRatelimit {
  try {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) {
      return createMemoryRatelimit(fallback);
    }
    return new Ratelimit({ redis: new Redis({ url, token }), limiter });
  } catch (error) {
    console.warn("Failed to initialize Ratelimit:", error);
    return createMemoryRatelimit(fallback);
  }
}

export const adminActionRatelimit = createSafeRatelimit(Ratelimit.slidingWindow(5, "15 m"), { limit: 5, windowMs: 15 * 60_000 });
export const authRatelimit = createSafeRatelimit(Ratelimit.slidingWindow(5, "15 m"), { limit: 5, windowMs: 15 * 60_000 });
export const apiRatelimit = createSafeRatelimit(Ratelimit.slidingWindow(100, "1 m"), { limit: 100, windowMs: 60_000 });
