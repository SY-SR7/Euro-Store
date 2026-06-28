import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Allow passing redis instance to not hardcode connection here, or use default from env
let defaultRedis: Redis | null = null;

function getRedisInstance(): Redis {
  if (!defaultRedis) {
    // This expects UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in environment
    defaultRedis = Redis.fromEnv();
  }
  return defaultRedis;
}

export const rateLimiters = {
  // Auth: 10 requests per 15 minutes
  auth: () =>
    new Ratelimit({
      redis: getRedisInstance(),
      limiter: Ratelimit.slidingWindow(10, "15 m"),
      analytics: true,
      prefix: "@upstash/ratelimit/auth",
    }),

  // Admin login: 5 requests per 15 minutes
  adminLogin: () =>
    new Ratelimit({
      redis: getRedisInstance(),
      limiter: Ratelimit.slidingWindow(5, "15 m"),
      analytics: true,
      prefix: "@upstash/ratelimit/admin_login",
    }),

  // API: 100 requests per 1 minute
  api: () =>
    new Ratelimit({
      redis: getRedisInstance(),
      limiter: Ratelimit.slidingWindow(100, "1 m"),
      analytics: true,
      prefix: "@upstash/ratelimit/api",
    }),

  // Public: 60 requests per 1 minute
  public: () =>
    new Ratelimit({
      redis: getRedisInstance(),
      limiter: Ratelimit.slidingWindow(60, "1 m"),
      analytics: true,
      prefix: "@upstash/ratelimit/public",
    }),
};

export type RateLimitType = keyof typeof rateLimiters;

/**
 * Convenience function to check rate limit for a specific identifier.
 * @param type The type of rate limit (auth, adminLogin, api, public).
 * @param identifier The unique identifier (e.g., IP address, User ID).
 * @returns The result of the rate limit check.
 */
export async function checkRateLimit(type: RateLimitType, identifier: string) {
  const limiter = rateLimiters[type]();
  return await limiter.limit(identifier);
}
