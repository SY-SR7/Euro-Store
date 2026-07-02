import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export function createSafeRatelimit(limiter: any) {
  try {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) {
      console.warn("Upstash Redis env variables missing. Rate limiting bypassed.");
      return { limit: async () => ({ success: true }) };
    }
    return new Ratelimit({ redis: Redis.fromEnv(), limiter });
  } catch (error) {
    console.warn("Failed to initialize Ratelimit:", error);
    return { limit: async () => ({ success: true }) };
  }
}

export const adminActionRatelimit = createSafeRatelimit(Ratelimit.slidingWindow(5, "15 m"));
export const authRatelimit = createSafeRatelimit(Ratelimit.slidingWindow(5, "15 m"));
export const apiRatelimit = createSafeRatelimit(Ratelimit.slidingWindow(100, "1 m"));
