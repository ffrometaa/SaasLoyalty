import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/**
 * Returns a Ratelimit instance if Upstash credentials are configured,
 * or null if not (graceful fallback for dev/environments without Redis).
 *
 * Limit: 10 requests per 60 seconds per IP — applied to auth endpoints.
 */
export function getAuthRatelimit(): Ratelimit | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) return null;

  return new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(10, '60 s'),
    prefix: 'loyalty:rl:auth',
    analytics: false,
  });
}

/** Auth paths subject to rate limiting */
export const RATE_LIMITED_PATHS = [
  '/login',
  '/join',
  '/forgot-password',
  '/reset-password',
  '/api/auth',
];

export function isRateLimitedPath(pathname: string): boolean {
  return RATE_LIMITED_PATHS.some((p) => pathname.startsWith(p));
}
