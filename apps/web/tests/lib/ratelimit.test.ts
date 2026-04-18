import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('@upstash/ratelimit', () => {
  const Ratelimit = vi.fn().mockImplementation((config: unknown) => ({ config }));
  Ratelimit.fixedWindow = vi.fn().mockReturnValue({ type: 'fixedWindow' });
  Ratelimit.slidingWindow = vi.fn().mockReturnValue({ type: 'slidingWindow' });
  return { Ratelimit };
});

vi.mock('@upstash/redis', () => ({
  Redis: vi.fn().mockImplementation((config: unknown) => ({ config })),
}));

import { Ratelimit } from '@upstash/ratelimit';
import {
  getRegisterRatelimit,
  getInviteTokenRatelimit,
  getResendMagicLinkRatelimit,
} from '@/lib/ratelimit';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('getRegisterRatelimit()', () => {
  it('returns null when env vars are absent', () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');
    expect(getRegisterRatelimit()).toBeNull();
  });

  it('returns a Ratelimit instance with correct prefix when env vars present', () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://redis.example.com');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'test-token');
    const rl = getRegisterRatelimit();
    expect(rl).not.toBeNull();
    expect(Ratelimit).toHaveBeenCalledWith(
      expect.objectContaining({ prefix: 'loyalty:rl:web:register' }),
    );
  });
});

describe('getInviteTokenRatelimit()', () => {
  it('returns null when env vars are absent', () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');
    expect(getInviteTokenRatelimit()).toBeNull();
  });

  it('returns a Ratelimit instance with correct prefix when env vars present', () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://redis.example.com');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'test-token');
    const rl = getInviteTokenRatelimit();
    expect(rl).not.toBeNull();
    expect(Ratelimit).toHaveBeenCalledWith(
      expect.objectContaining({ prefix: 'loyalty:rl:web:invite-token' }),
    );
  });
});

describe('getResendMagicLinkRatelimit()', () => {
  it('returns null when env vars are absent', () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');
    expect(getResendMagicLinkRatelimit()).toBeNull();
  });

  it('returns a Ratelimit instance when env vars are present', () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://redis.example.com');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'test-token');
    const rl = getResendMagicLinkRatelimit();
    expect(rl).not.toBeNull();
    expect(Ratelimit).toHaveBeenCalledWith(
      expect.objectContaining({ prefix: 'loyalty:rl:web:resend-magic-link' }),
    );
  });

  it('uses slidingWindow limiter', () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://redis.example.com');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'test-token');
    getResendMagicLinkRatelimit();
    expect(Ratelimit.slidingWindow).toHaveBeenCalledWith(3, '15 m');
  });
});
