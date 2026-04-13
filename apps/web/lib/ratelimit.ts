import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/** 3 requests per hour — tenant registration per IP */
export function getRegisterRatelimit(): Ratelimit | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.fixedWindow(3, '60 m'),
    prefix: 'loyalty:rl:web:register',
    analytics: false,
  });
}
