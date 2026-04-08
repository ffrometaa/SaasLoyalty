# Dashboard — Testing Strategy

## Stack

| Tool | Version | Role |
|------|---------|------|
| Vitest | 1.6 | Test runner + assertions |
| @testing-library/react | 15 | Component rendering |
| @testing-library/jest-dom | 6.4 | DOM matchers |
| MSW (Mock Service Worker) | 2.3 | HTTP handler mocks for component tests |
| jsdom | 24 | Browser environment emulation |
| @vitest/coverage-v8 | 1.6 | Coverage reporting |

## How to Run

```bash
# From apps/dashboard/
pnpm exec vitest run          # CI / single pass (58 tests, ~1s)
pnpm run test:watch           # Watch mode — local dev
pnpm run test:coverage        # With coverage report → coverage/
pnpm run test:ui              # Vitest UI browser interface

# From monorepo root
pnpm turbo test --filter=@loyalty-os/dashboard
```

## File Structure

```
tests/
├── setup.ts                   # Global mocks: next/navigation, next-intl, MSW bootstrap, matchMedia
├── mocks/
│   ├── server.ts              # MSW server instance (startServer/resetHandlers/close)
│   └── handlers.ts            # Default HTTP handlers (used by component tests)
├── api/
│   ├── auth.test.ts           # 19 tests — check-device, verify-otp, send-otp, signout
│   ├── members.test.ts        # 14 tests — GET/POST /api/members, PATCH /api/members/[id]
│   └── rewards.test.ts        # 14 tests — GET/POST /api/rewards, PATCH/DELETE /api/rewards/[id]
└── components/
    ├── MetricCard.test.tsx     # 6 tests — render, change indicator, description
    └── Sidebar.test.tsx        # 5 tests — nav items, active state, mobile toggle
```

**Total: 58 tests across 5 files.**

## Test Layers

### API Route Tests (`tests/api/`)

Pattern: import the route handler directly and call it with a `NextRequest`. No HTTP server needed.

```ts
import { POST as createMember } from '@/app/api/members/route';

const res = await createMember(new NextRequest(...));
const body = await res.json();
expect(res.status).toBe(201);
```

**What we mock:**
- `@loyalty-os/lib/server` — `createServerSupabaseClient` + `createServiceRoleClient` via `vi.mock()`
- `@loyalty-os/email` — `buildBilingualEmail` + `buildOtpVerificationEmail`
- `fetch` — `vi.stubGlobal('fetch', ...)` for email sending tests

**Supabase mock pattern:**

```ts
// Chainable query builder — all chaining methods return `this`
function makeQueryChain() {
  const chain: any = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq    = vi.fn().mockReturnValue(chain);
  chain.is    = vi.fn().mockReturnValue(chain);
  // ...
  chain.single = vi.fn().mockResolvedValue({ data: null, error: null });
  chain.range  = vi.fn().mockResolvedValue({ data: [], count: 0, error: null });
  return chain;
}

// For direct-await queries (count check without .single()):
function makeCountChain(count: number) {
  const chain: any = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.is = vi.fn().mockReturnValue(chain);
  chain.then = (resolve, reject) =>
    Promise.resolve({ data: null, count, error: null }).then(resolve, reject);
  return chain;
}
```

Control per-test with `mockResolvedValueOnce`:

```ts
mockSupabaseChain.single
  .mockResolvedValueOnce({ data: { id: 'tenant-uuid' }, error: null }) // tenant lookup
  .mockResolvedValueOnce({ data: memberRow, error: null });             // member fetch
```

### Component Tests (`tests/components/`)

Pattern: render with `@testing-library/react`, assert on DOM output.

**Global mocks (setup.ts):**

```ts
// next-intl — resolves against real en.json messages (no IntlProvider needed)
vi.mock('next-intl', () => ({
  useTranslations: (namespace) => (key) => en[namespace]?.[key] ?? key,
  useLocale: () => 'en',
  useFormatter: () => ({ dateTime: (v) => v.toISOString() }),
}));

// next/navigation — useRouter, usePathname, useSearchParams
vi.mock('next/navigation', () => ({ useRouter: ..., usePathname: () => '/dashboard', ... }));
```

**MSW for component tests:** used to intercept `fetch` calls made inside `useEffect` (e.g. Sidebar's `/api/tenant/me`). Add per-test handlers with `server.use(http.get(...))`.

## Coverage (as of Tarea 4b)

### Tested files — high coverage

| File | Stmts | Branches | Funcs |
|------|-------|----------|-------|
| `app/api/auth/check-device/route.ts` | 95% | 91% | 100% |
| `app/api/auth/verify-otp/route.ts` | 97% | 93% | 100% |
| `app/api/auth/send-otp/route.ts` | 97% | 90% | 100% |
| `app/api/auth/signout/route.ts` | 100% | 100% | 100% |
| `components/MetricCard.tsx` | 100% | 100% | 100% |
| `components/Sidebar.tsx` | 97% | 75% | 57% |
| `lib/plans/features.ts` | 91% | 50% | 25% |

### Untested — Phase 3 candidates

These routes exist but have no tests yet. Priority for future sprints:

| Module | Routes |
|--------|--------|
| Members detail | `app/api/members/[id]/visit/route.ts` |
| Members import | `app/api/members/import/route.ts` |
| Campaigns | `app/api/campaigns/**` (complex, Server Actions) |
| Analytics | `app/api/analytics/**` |
| Gamification engine | `lib/engine/**` |
| Tenant management | `app/api/tenant/**` |

## Conventions

1. **vi.mock before imports** — Vitest hoists `vi.mock()` calls; always declare them before any `import` from the mocked module.
2. **vi.clearAllMocks() in beforeEach** — prevents state leakage between tests.
3. **mockResolvedValueOnce for sequences** — use `Once` variants when the same mock is called multiple times with different results in a single test.
4. **Supabase split** — `createServerSupabaseClient` (auth + tenant owner lookup) vs `createServiceRoleClient` (writes + queries bypassing RLS) — keep them as separate mock chains.
5. **No `.single()` for count queries** — use `makeCountChain()` (thenable) for patterns like `const { count } = await client.from().select('id', { count: 'exact', head: true }).eq().is()`.

## CI Integration

Added to `turbo.json` as `"test"` task. Runs after `^build` (workspace packages built first).

```bash
# CI command
pnpm turbo test
```

`"test"` script in `package.json` uses `vitest run` (exits after one pass). Use `pnpm run test:watch` for interactive local development.
