import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

function makeRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

/** 5 requests per 15 minutes — auth endpoints (send-otp, verify-otp) */
export function getOtpRatelimit(): Ratelimit | null {
  const redis = makeRedis();
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(5, '15 m'),
    prefix: 'loyalty:rl:dashboard:otp',
    analytics: false,
  });
}

/** 3 requests per hour — forgot-password */
export function getForgotPasswordRatelimit(): Ratelimit | null {
  const redis = makeRedis();
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, '60 m'),
    prefix: 'loyalty:rl:dashboard:forgot-pw',
    analytics: false,
  });
}

/** 30 requests per minute — points adjustments per member */
export function getAdjustmentRatelimit(): Ratelimit | null {
  const redis = makeRedis();
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, '60 s'),
    prefix: 'loyalty:rl:dashboard:adjustment',
    analytics: false,
  });
}

/** 60 requests per minute — visit registrations per member */
export function getVisitRatelimit(): Ratelimit | null {
  const redis = makeRedis();
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, '60 s'),
    prefix: 'loyalty:rl:dashboard:visit',
    analytics: false,
  });
}
