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

/** 30 requests per minute — invitation token lookup per IP (prevents enumeration) */
export function getInviteTokenRatelimit(): Ratelimit | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(30, '60 s'),
    prefix: 'loyalty:rl:web:invite-token',
    analytics: false,
  });
}

/** 3 requests per 15 minutes — resend magic link / OTP per IP */
export function getResendMagicLinkRatelimit(): Ratelimit | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(3, '15 m'),
    prefix: 'loyalty:rl:web:resend-magic-link',
    analytics: false,
  });
}
