# LoyaltyOS Member App — Feature Inventory

> Generated: 2026-04-09 | Verified against production DB schema

## Status Legend

- **READY** — Code complete, DB columns verified, deployed
- **NEEDS DATA** — Code works but feature requires tenant configuration/data to function
- **MISSING COMPONENT** — Referenced component file doesn't exist

---

## Auth & Onboarding

| Feature | Route | Status | Notes |
|---------|-------|--------|-------|
| Join (Registration) | `/join` | READY | Multi-step: code → email → register/login. QR scan, referral codes, invitations |
| Login | `/login` | READY | Email + password, multi-tenant picker, Bearer token auth, i18n |
| Forgot Password | `/forgot-password` | READY | Email recovery via Resend |
| Password Reset | `/auth/reset` | READY | New password form, min 8 chars, i18n |
| Auth Recovery | `/auth/recovery` | READY | Recovery link validation + redirect |
| Auth Callback | `/auth/callback` | READY | OAuth code exchange, auto member creation |

## Home & Dashboard

| Feature | Route | Status | Notes |
|---------|-------|--------|-------|
| Home Dashboard | `/` | READY | Points balance, tier progress, active multipliers, dynamic challenges, recent activity, rewards preview |
| Onboarding Modal | `/` (component) | READY | First-time user walkthrough |
| PWA Install Prompt | `/` (component) | READY | `components/InstallPrompt.tsx` — beforeinstallprompt event handler |
| Push Notifications | `/` (component) | READY | OneSignal integration (`OneSignalInit.tsx` exists) |

## Rewards & Redemption

| Feature | Route | Status | Notes |
|---------|-------|--------|-------|
| Rewards Catalog | `/rewards` | READY | Available + locked sections, point costs, i18n |
| Reward Detail | `/rewards/[id]` | READY | Full info + redeem button, confirmation dialog, i18n |
| Redeem Flow | `/api/rewards/[id]/redeem` | READY | Points deduction, QR/code generation, `points_per_dollar` verified |
| Redemption Success | `/redeem/success` | READY | QR code + alphanumeric code display |
| My Redemptions | `/redemptions` | READY | Active (with QR) + used sections, modal view, i18n |

## Engagement & Gamification

| Feature | Route | Status | Notes |
|---------|-------|--------|-------|
| Challenges | `/challenges` | NEEDS DATA | Code ready. Tables exist (`challenges`, `dynamic_challenges`, `missions`, `mission_steps`). Needs tenant to create challenges |
| Leaderboard | `/leaderboard` | NEEDS DATA | Code ready. Table exists (`leaderboard_snapshots`). Needs scheduled job to generate snapshots |
| Referrals | `/profile/referrals` | READY | Shareable link, stats, referred member list. All columns verified (`referral_enabled`, `referral_code`, etc.) |

## Profile & Account

| Feature | Route | Status | Notes |
|---------|-------|--------|-------|
| Profile | `/profile` | READY | Name, email, member code, tier, points, language switcher, i18n |
| Notifications | `/notifications` | READY | Types: earn, redeem, birthday, referral, tier_upgrade. Infinite scroll, unread badge. All columns verified |
| Transaction History | `/history` | READY | Full point movements (up to 50), i18n |

## Legal & Consent

| Feature | Route | Status | Notes |
|---------|-------|--------|-------|
| Consent Update | `/consent-update` | READY | Pending document acceptance, checkbox UI, i18n |
| Consent Guard | layout component | READY | `components/consent-guard.tsx` — auto-redirects when pending consents exist |
| Terms of Service | `/legal/member-terms` | READY | Static legal page |
| Privacy Policy | `/legal/privacy-policy` | READY | Static legal page |

## Utility & Admin

| Feature | Route | Status | Notes |
|---------|-------|--------|-------|
| Offline Page | `/offline` | READY | PWA fallback, retry/home buttons, i18n |
| Impersonation | `/impersonate` | READY | Super Admin views app as member, banner + end session, i18n |
| Brand Theming | all pages | READY | Per-tenant primary/secondary colors via `BrandTheme` component |
| Bilingual i18n | all pages | READY | EN + ES neutral, language switcher, locale persisted to DB |

---

## Summary

| Status | Count |
|--------|-------|
| READY | 26 |
| NEEDS DATA | 2 |
| **Total Features** | **28** |

### NEEDS DATA (functional but empty without content)

1. **Challenges** — The page and all 5 gamification tables exist. Feature works but shows "No active challenges" until the tenant creates challenges from the dashboard.
2. **Leaderboard** — Table exists but needs a scheduled job (cron) to generate `leaderboard_snapshots`. Shows "No ranking yet" until first snapshot.

---

## Technical Stack

- **Framework:** Next.js 14.2.35 (App Router)
- **Auth:** Supabase Auth (email + password)
- **DB:** Supabase (PostgreSQL + PostgREST)
- **i18n:** next-intl (EN + ES)
- **PWA:** next-pwa (service worker, offline support)
- **Push:** OneSignal
- **Styling:** Tailwind CSS
- **Deploy:** Vercel (member.loyalbase.dev)

## API Routes (18)

### Auth (8)
- `POST /api/auth/validate-code` — Validate business join code
- `POST /api/auth/check-email` — Check if email exists for tenant
- `POST /api/auth/create-member` — Create/link member after signup
- `GET /api/auth/my-tenants` — Get all memberships for user
- `GET /api/auth/set-tenant` — Set tenant cookie + redirect
- `POST /api/auth/forgot-password` — Send password reset email
- `DELETE /api/auth/impersonate` — End impersonation session
- `GET /auth/callback` — OAuth code exchange

### Member Data (7)
- `GET /api/rewards` — Rewards for tenant
- `POST /api/rewards/[id]/redeem` — Redeem a reward
- `GET /api/member/redemptions` — Member's redemptions
- `GET /api/member/referrals` — Referral data + stats
- `GET /api/member/notifications` — Notifications (paginated)
- `POST /api/member/notifications/read` — Mark as read
- `GET /api/redemptions` — Alternative redemptions endpoint

### Profile & Legal (3)
- `PATCH /api/profile/locale` — Update language preference
- `GET /api/consent` — Pending consent documents
- `POST /api/consent` — Record consent acceptance

---

## Technical Debt

### Profile Tab — Self-Service Account Management

**Status:** NOT IMPLEMENTED  
**Priority:** Medium  
**Location:** `/profile` tab (member app)

Members currently have no way to manage their own account from the profile tab. The following features are pending:

| Feature | Description |
|---------|-------------|
| Edit personal info | Update name, phone, and other profile fields |
| Change password | Form with current password + new password confirmation |
| Delete account | Self-service account deletion with confirmation step and data removal |

**Notes:**
- Password change requires calling `supabase.auth.updateUser({ password })` — needs current password verification first via reauthentication
- Account deletion must handle both `auth.users` (via `supabase.auth.admin.deleteUser`) and the `members` row — requires a server-side API route with proper RLS
- Delete flow should show a confirmation modal warning about irreversibility and point/redemption data loss

---

### Super Admin — Tenant Suspension: Missing Reason, Email & Confirmation

**Status:** PARTIALLY IMPLEMENTED  
**Priority:** High  
**Location:** `apps/dashboard/lib/admin/actions.ts:60` · `apps/dashboard/components/admin/TenantDetailClient.tsx:184`

The `suspendTenant` server action exists and works (sets `plan_status: 'canceled'`, logs to `platform_events`). However, the following gaps remain:

| Gap | Description |
|-----|-------------|
| No suspension reason UI | `handleSuspend` calls `suspendTenant(id, '')` — reason is always empty. No input field exists to capture the reason (e.g. terms of service violation) |
| No automatic email to tenant | The tenant owner receives no notification when their account is suspended. `suspendTenant` never calls Resend or any email service |
| No confirmation dialog | The "Suspend" button executes immediately with no confirmation step — risk of accidental suspension |

**Notes:**
- Email should be sent via Resend to `tenant.owner_email`, templated in EN + ES, including the suspension reason and a contact link
- The confirmation modal should require the admin to type the reason before confirming
- The `reason` field already exists in `platform_events.metadata` — just needs to be populated from the UI and forwarded to the email template

---

### Tenant Account Closure — End-of-Service Email & Data Export

**Status:** NOT IMPLEMENTED  
**Priority:** High  
**Location:** `apps/dashboard/lib/admin/actions.ts:92` (deleteTenant) · `apps/dashboard/components/admin/TenantDetailClient.tsx`

When a tenant account is permanently closed — either by admin action (`deleteTenant`) or by the tenant themselves — no notification is sent and there is no mechanism to export their data before deletion.

| Gap | Description |
|-----|-------------|
| No end-of-service email | `deleteTenant` sets `deleted_at` silently. Tenant owner receives no notification |
| No self-service account closure | Tenants have no way to voluntarily close their own account from the dashboard settings |
| No data export before deletion | Members, points history, redemptions, and campaigns are soft-deleted with no export option |

**Notes:**
- End-of-service email must be sent via Resend (EN + ES) and include: closure date, reason (if admin-initiated), and a grace period window to download data
- Data export should generate a ZIP or CSV bundle covering: members, points transactions, redemptions, rewards, and campaigns
- GDPR/data protection compliance requires that tenants can retrieve their data before permanent deletion — this is a legal obligation, not just a UX improvement
- Recommended grace period: 30 days after `deleted_at` before data is hard-deleted, with the export link active during that window
- Self-service closure should live in dashboard Settings and trigger the same email + export flow
