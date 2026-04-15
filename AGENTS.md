# Code Review Rules — LoyaltyOS

## TypeScript

- **ZERO `any` types** — use `unknown` and narrow, or define a proper type/interface
- Use `const`/`let`, never `var`
- Prefer `type` for unions/primitives, `interface` for object shapes
- All function parameters and return values must be typed explicitly
- No non-null assertions (`!`) without a comment explaining why it's safe
- Use `satisfies` operator over casting (`as`) wherever possible

## React / Next.js

- Use functional components only — no class components
- Use named exports for components; default export only for pages
- `'use client'` must appear at the top of the file, before imports
- Server Components are the default — add `'use client'` only when strictly needed (event handlers, browser APIs, hooks)
- Never call `fetch` inside `useEffect` for initial data that could be a Server Component
- Prefer `useRouter` from `next/navigation`, never from `next/router`

## Supabase

- Always check both `data` and `error` from Supabase calls — never assume `data` is non-null
- Use `createServerSupabaseClient()` in Server Components and Route Handlers
- Use `createBrowserClient()` in Client Components only
- Never expose service role key on the client
- `createServiceRoleClient()` is allowed in route handlers that perform admin operations (cross-tenant writes, bypassing RLS intentionally) — document the reason with a comment

## Styling

- Tailwind only — no inline styles, no CSS modules
- Use `clsx` or `cn` for conditional class merging
- Follow existing color tokens (`brand-purple`, `brand-purple-100`, etc.)

## Commits

- Conventional commits only: `feat`, `fix`, `refactor`, `docs`, `chore`, `test`, `perf`, `security`
- Scope required for app changes: `feat(dashboard)`, `fix(member)`, `fix(web)`
- No AI attribution in commit messages

## General

- No `console.log` left in production code
- No commented-out code blocks
- Delete unused imports
- Error boundaries must wrap async data-fetching sections
