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

/** 5 requests per hour — bulk email/push blasts per tenant */
export function getBulkRatelimit(): Ratelimit | null {
  const redis = makeRedis();
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(5, '60 m'),
    prefix: 'loyalty:rl:dashboard:bulk',
    analytics: false,
  });
}

/** 10 requests per hour — CSV member imports per tenant */
export function getImportRatelimit(): Ratelimit | null {
  const redis = makeRedis();
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(10, '60 m'),
    prefix: 'loyalty:rl:dashboard:import',
    analytics: false,
  });
}

/** 20 requests per hour — analytics exports per tenant */
export function getExportRatelimit(): Ratelimit | null {
  const redis = makeRedis();
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(20, '60 m'),
    prefix: 'loyalty:rl:dashboard:export',
    analytics: false,
  });
}

/** 100 requests per minute — public API (POS) per API key */
export function getPublicMembersRatelimit(): Ratelimit | null {
  const redis = makeRedis();
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '60 s'),
    prefix: 'loyalty:rl:dashboard:public-members',
    analytics: false,
  });
}

/** 5 requests per hour — full tenant data export */
export function getTenantExportRatelimit(): Ratelimit | null {
  const redis = makeRedis();
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(5, '60 m'),
    prefix: 'loyalty:rl:dashboard:tenant-export',
    analytics: false,
  });
}
