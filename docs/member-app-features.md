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
- **Data retention window must be updated from 90 to 30 days** — the FAQ on the landing page currently states "90 días después de la cancelación" but the ToS requires 30 days. Both the copy and the hard-delete logic must be aligned to 30 days

---

### Pricing Page — Pro Plan Feature Copy Mismatch

**Status:** COPY CHANGE REQUIRED  
**Priority:** Medium  
**Location:** Landing page — Pro plan pricing card

The Pro plan card lists "Birthday rewards & campaigns" as a feature. This must be updated to **"Gamification"** to accurately reflect what the plan includes (challenges, leaderboard, missions, multipliers, dynamic scoring — not just birthday campaigns).

| Current copy | Correct copy |
|---|---|
| Birthday rewards & campaigns | Gamification |

**Notes:**
- "Birthday rewards" is a subset of the gamification engine, not a standalone feature — listing it creates a false expectation about the plan's scope
- The change is copy-only in the web app pricing component — no backend or billing logic changes needed

---

### FAQ Copy — Voseo to Neutral Spanish + False Feature Claims

**Status:** COPY CHANGE + FEATURE GAP  
**Priority:** High  
**Location:** Landing page FAQ · `apps/dashboard/app/api/settings/route.ts` · `apps/dashboard/app/api/members/[id]/visit/route.ts:61`

The FAQ answer for "¿Puedo personalizar las reglas de puntos y las recompensas?" has two problems:

**1. Copy uses Rioplatense voseo — must be neutral Spanish:**

| Current (voseo) | Correct (neutral) |
|---|---|
| "Vos definís los puntos por dólar" | "Puedes configurar los puntos por dólar" |
| "creás tu propio catálogo de premios" | "crea tu propio catálogo de premios" |

**2. Two of the four stated features are not actually configurable by the tenant:**

| Claim | Status | Detail |
|-------|--------|--------|
| Catálogo propio de premios | ✅ READY | Tenants create/edit rewards from dashboard |
| Puntos por dólar | ⚠️ PARTIAL | Column `points_per_dollar` exists and is used in visit logic, but `/api/settings` never exposes it — tenant cannot change it from the UI |
| Umbrales de nivel (Bronze/Silver/Gold/Platinum) | ❌ HARDCODED | Thresholds fixed in `visit/route.ts:61-63`: Bronze=0, Silver=1000, Gold=5000, Platinum=10000. Not configurable per tenant |
| Acumulan y canjean en tus términos | ⚠️ PARTIAL | Redemption costs per reward are configurable; accumulation rate is not |

**Notes:**
- `points_per_dollar` fix: add it to the GET and POST handlers in `/api/settings/route.ts` and expose a numeric input in the Settings UI
- Tier thresholds fix: add `tier_threshold_silver`, `tier_threshold_gold`, `tier_threshold_platinum` columns to `tenants` table and replace hardcoded values in `visit/route.ts` with per-tenant values
- Until these are implemented, the FAQ copy must be softened to avoid false promises

---

### Member App — "2x points at Silver" Hardcoded False Promise

**Status:** BUG / COPY ISSUE  
**Priority:** Medium  
**Location:** `apps/member/messages/en.json:31` · `apps/member/messages/es.json:31` · `apps/member/app/page.tsx:126`

A Bronze member sees the badge **"2x points at Silver"** regardless of whether the tenant has configured any multiplier for Silver tier. The "2x" is hardcoded in the i18n string — it does not reference any real data from the `point_multipliers` table.

```json
"nextTierBonus": "2x points at {tier}"  // hardcoded — always "2x"
```

The flow:
1. `getTierProgress` calculates `nextTier = 'silver'` for a Bronze member
2. `page.tsx` renders `t('nextTierBonus', { tier: 'Silver' })` → "2x points at Silver"
3. No multiplier lookup is performed — the "2x" is fictional

| Scenario | Current behavior | Expected behavior |
|----------|-----------------|-------------------|
| Tenant has a `tier_silver` multiplier of 2x | Shows "2x points at Silver" ✓ coincidentally correct | Show actual multiplier value |
| Tenant has no Silver multiplier configured | Shows "2x points at Silver" ✗ false promise | Show generic copy or nothing |
| Tenant has a `tier_silver` multiplier of 3x | Shows "2x points at Silver" ✗ wrong value | Show "3x points at Silver" |

**Correct fix:** query `point_multipliers` for an active `tier_silver` multiplier and render the real value dynamically. If none exists, fall back to a generic motivational message such as *"Unlock exclusive benefits at Silver"* with no numeric claim.

---

### Scale & Enterprise — "Dedicated Account Manager" Not Implemented

**Status:** NOT IMPLEMENTED  
**Priority:** Medium  
**Location:** `apps/dashboard/lib/plans/features.ts:19` · `apps/web/messages/en.json:108` · `packages/config/src/constants.ts:67`

The feature `support_account_manager` is listed in Scale and Enterprise plans and displayed on the pricing page as *"Dedicated account manager"* / *"Account manager dedicado"*. No functionality backs this claim.

| Component | Status |
|-----------|--------|
| Feature flag `support_account_manager` in plan config | EXISTS — Scale + Enterprise |
| Pricing page copy "Dedicated account manager" | EXISTS |
| Tenant notification when account manager is assigned | MISSING |
| Any UI or workflow in the dashboard for account manager contact | MISSING |
| Assignment logic linking a tenant to an admin | MISSING |

**Notes:**
- The simplest valid implementation: when a tenant upgrades to Scale or Enterprise, automatically send an email introducing the account manager (felixdfrometa@gmail.com) with direct contact info and an offer to schedule an onboarding call
- No complex system needed at this stage — the feature is an operational promise, not a software feature
- Until implemented, the pricing page is making a commitment that has no delivery mechanism

---

### Tenant Support — All Tiers Are Marketing Promises With No Implementation

**Status:** NOT IMPLEMENTED  
**Priority:** High  
**Location:** `apps/dashboard/lib/plans/features.ts` · `apps/web/app/pricing/page.tsx:53`

Every support tier advertised on the pricing page is a promise with zero technical backing. No support widget, ticketing system, or chat tool exists anywhere in the codebase.

| Plan | Advertised support | Reality |
|------|-------------------|---------|
| Starter | Email support | No contact form, no support widget. Only a hardcoded `support@loyaltyos.com` address in the web app JSON-LD schema |
| Pro | Priority chat | Feature flag `support_priority_chat` exists in `features.ts` but no component consumes it. No chat widget installed (no Intercom, Crisp, Tawk.to, or equivalent) |
| Scale | Priority chat + Account manager | Same as Pro — both flags exist, neither is implemented |
| Enterprise | Account manager + SLA | `support_sla` flag exists in `features.ts` with no implementation |

The only support-adjacent code in the entire codebase: two `mailto:hello@loyalbase.dev` hardcoded links for trial requests — not a support system.

**Notes:**
- Minimum viable implementation for Starter: a visible support email address inside the dashboard (not just in external schema)
- Minimum viable for Pro/Scale: integrate a free-tier chat widget (Crisp or Tawk.to) gated behind `support_priority_chat` — show widget only to Pro+ tenants
- SLA requires a formal document (covered in Legal Documents debt above) plus a defined response time commitment
- Until at least a visible contact mechanism exists inside the dashboard, tenants who need help have no clear path to get it

---

### Legal Documents — Pending Creation and Publication

**Status:** NOT IMPLEMENTED  
**Location:** `apps/web/app/terms/` · `apps/web/app/privacy/` · new routes needed for DPA, SLA, EULA

Five legal documents must be drafted and published. Three are required before onboarding the first paying tenant.

| Document | Protects against | Priority | Status |
|----------|-----------------|----------|--------|
| **Terms of Service** | All legal liability | 🔴 Before first client | Page exists at `/terms` — content must be reviewed and finalized |
| **Privacy Policy** | Data misuse, FIPA compliance | 🔴 Before first client | Page exists at `/privacy` — content must be reviewed and finalized |
| **Data Processing Agreement (DPA)** | Tenant lawsuits over data handling | 🔴 Before first client | Does not exist — new page + acceptance flow required |
| **SLA (Service Level Agreement)** | Lawsuits over downtime / bugs | 🟡 Within first 3 months | Does not exist |
| **EULA for end members** | End-user lawsuits | 🟡 Within first 3 months | Member app has `/legal/member-terms` and `/legal/privacy-policy` pages — content must be reviewed |

**Notes:**
- DPA is critical for B2B SaaS — tenants are processing their customers' personal data through LoyalBase, which makes LoyalBase a data processor under GDPR and similar frameworks. A signed DPA is legally required
- The DPA acceptance flow should be added to the tenant onboarding step — similar to the existing member consent system (`consent_documents` table)
- Terms of Service and Privacy Policy pages already exist in the web app but their content has not been reviewed for legal accuracy against the actual product behavior

---

### Pricing Page — Starter Plan Changes

**Status:** COPY + BILLING CHANGE REQUIRED  
**Priority:** High  
**Location:** Landing page — Starter plan pricing card · Stripe dashboard · `apps/dashboard/lib/plans/guardFeature.ts`

The Starter plan must be updated with the following changes:

| Field | Current | New |
|-------|---------|-----|
| Price | $199/mo | $99/mo |
| Member limit | Up to 500 | Up to 800 |
| Campaigns per month | 2 | 3 |
| Logo white-label | ✓ included | ✗ removed |

**Notes:**
- Price change requires updating the Stripe product/price in the Stripe dashboard and the price ID in Vercel env vars (`STRIPE_STARTER_PRICE_ID`)
- Member limit (800) must be updated in `max_members` logic — check `guardFeature.ts` and any hardcoded plan limits
- Campaign limit (3) must be updated in the plan enforcement logic
- "Logo white-label" removal means Starter tenants should no longer be able to upload a custom logo — check `FeatureGate` component and the logo upload route (`/api/settings/logo`)
- Copy change is required in the web app pricing component AND in any onboarding or email that references Starter plan features

---

### Trial Expiry — 3-Day Reminder Email Not Triggered

**Status:** PARTIALLY IMPLEMENTED  
**Priority:** High  
**Location:** `packages/email/src/templates/trial-expiry.ts` · missing: `supabase/functions/trial-expiry-reminder/`

The landing page states: *"You'll receive an email reminder 3 days before your trial ends."* This is **not true** — the email template exists but nothing triggers it.

| Component | Status |
|-----------|--------|
| `buildTrialExpiryEmail` template (EN + ES) | EXISTS — `packages/email/src/templates/trial-expiry.ts` |
| Supabase Edge Function to send it | MISSING |
| Daily cron schedule | MISSING |
| Query logic for `trial_ends_at - 3 days` | MISSING |

**Notes:**
- Needs a Supabase Edge Function (`trial-expiry-reminder`) running on a daily cron
- Query: `SELECT * FROM tenants WHERE trial_ends_at::date = (now() + interval '3 days')::date AND plan_status = 'trialing' AND deleted_at IS NULL`
- The template already accepts `daysLeft` — can be reused for 7-day and 1-day warnings with the same function
- Send via Resend to the tenant owner email (`auth.users` joined by `auth_user_id`)
- Until this is implemented, the landing page copy is a false promise to prospects

---

### Payment Failure — No Email to Tenant or Super Admin

**Status:** PARTIALLY IMPLEMENTED  
**Priority:** High  
**Location:** `apps/web/app/api/webhooks/stripe/route.ts:380` · `packages/email/src/templates/payment-failed.ts`

The Stripe webhook `invoice.payment_failed` handler correctly sets `plan_status: 'past_due'` in the DB, but sends no notifications. The code has an explicit `// TODO: Send email notification to tenant` comment acknowledging the gap.

| Component | Status |
|-----------|--------|
| `buildPaymentFailedEmail` template (EN + ES) | EXISTS — never called |
| Tenant email on payment failure | MISSING — `handlePaymentFailed` only updates DB |
| Super admin alert on payment failure | MISSING — no internal notification whatsoever |
| Tenant email on payment recovery | MISSING — `handlePaymentSucceeded` also silent |

**Notes:**
- `handlePaymentFailed` already has the `customerId` — needs to join `tenants` → `auth.users` via `auth_user_id` to get the owner email, then call `buildPaymentFailedEmail` + Resend
- Super admin alert should be a simple internal email to `felixdfrometa@gmail.com` (same pattern as the new customer notification in `notifyNewCustomer`) listing: tenant name, amount due, retry count, and a link to the Stripe dashboard
- `handlePaymentSucceeded` should send a payment confirmation email to the tenant (no template exists yet for this)
- Stripe already handles its own retry logic — the platform emails are the human-facing layer on top of that

---

### Enterprise — White-label Full Brand: Flag Sin Implementación

**Status:** NOT IMPLEMENTED  
**Priority:** Medium  
**Location:** `apps/dashboard/lib/plans/features.ts:16` · `apps/dashboard/app/(dashboard)/settings/page.tsx:634`

El flag `whitelabel_full_brand` existe en los planes Scale y Enterprise, pero ningún componente lo consume. La lógica de branding en Settings solo chequea `whitelabel_logo` (subir un logo). La personalización de marca completa no existe.

| Componente | Estado |
|------------|--------|
| Flag `whitelabel_full_brand` en plan config | EXISTS — Scale + Enterprise |
| Personalización de colores primario/secundario | MISSING |
| Personalización de fuentes | MISSING |
| Remoción del branding LoyalBase del member app | MISSING |
| UI en Settings para configurar la marca | MISSING |

**Notes:**
- `whitelabel_logo` (subir imagen) ya funciona — es un subconjunto del full brand
- Full brand mínimo viable: exponer los campos `primary_color` y `secondary_color` del tenant en un color picker en Settings, aplicados ya en el member app vía `BrandTheme`
- La remoción del logo de LoyalBase del member app requiere un flag de runtime en el componente header/footer del member app
- Hasta que esté implementado, la diferencia entre `whitelabel_logo` y `whitelabel_full_brand` en el pricing es ficticia

---

### Enterprise — SSO: Flag Sin Implementación

**Status:** NOT IMPLEMENTED  
**Priority:** Low (Enterprise only)  
**Location:** `apps/dashboard/lib/plans/features.ts:21`

El flag `sso` existe para Enterprise pero no hay ninguna implementación en el codebase. No existe integración con SAML, OAuth providers externos, ni ningún flujo de Single Sign-On.

| Componente | Estado |
|------------|--------|
| Flag `sso` en plan config | EXISTS — Enterprise |
| Integración SAML / OIDC | MISSING |
| UI para configurar el proveedor de identidad | MISSING |
| Middleware para validar tokens SSO | MISSING |

**Notes:**
- SSO es un feature complejo y costoso de implementar — requiere integración con proveedores como Okta, Azure AD, o Google Workspace
- Antes de implementarlo se debe definir si se usa un proveedor propio (Auth0, WorkOS) o se construye desde Supabase Auth custom
- Hasta que exista una implementación, no debe listarse en el pricing como feature disponible

---

### Enterprise — Custom Integrations: Flag Sin Implementación

**Status:** NOT IMPLEMENTED  
**Priority:** Low (Enterprise only)  
**Location:** `apps/dashboard/lib/plans/features.ts:22`

El flag `custom_integrations` existe para Enterprise pero no hay ninguna UI, webhook manager, ni integración con herramientas externas (Zapier, Make, HubSpot, etc.) en todo el codebase.

| Componente | Estado |
|------------|--------|
| Flag `custom_integrations` en plan config | EXISTS — Enterprise |
| Webhook manager (outbound events) | MISSING |
| Integración con Zapier / Make | MISSING |
| UI para configurar integraciones | MISSING |

**Notes:**
- El único punto de integración existente es la API pública (`/api/public/members` con `x-api-key`), disponible para Enterprise bajo `api_access` — funciona pero no es lo mismo que "custom integrations"
- Mínimo viable: un webhook manager que permita al tenant configurar una URL destino y recibir eventos (`member.created`, `points.earned`, `reward.redeemed`)
- Hasta que exista, no debe diferenciarse de `api_access` en el pricing

---

### Enterprise — Multi-location y Advanced Campaigns: Flags Sin Implementación

**Status:** NOT IMPLEMENTED  
**Priority:** Low (Enterprise only)  
**Location:** `apps/dashboard/lib/plans/features.ts:23,26`

Los flags `multi_location` y `advanced_campaigns` existen solo para Enterprise pero ningún componente, route, ni lógica los consume.

| Flag | Qué debería hacer | Estado |
|------|-------------------|--------|
| `multi_location` | Soporte de múltiples sucursales por tenant (tabla `locations`, filtrado por ubicación en analytics y visitas) | MISSING — no existe tabla `locations` ni columna `location_id` en el schema |
| `advanced_campaigns` | Campañas con segmentación avanzada, A/B testing, o automatización por comportamiento | MISSING — las campañas actuales no diferencian "advanced" de "standard" |

**Notes:**
- `multi_location` requiere cambios profundos en el schema: nueva tabla `locations`, `location_id` en `visits`, `members`, y posiblemente `rewards` — es una feature arquitectural, no cosmética
- `advanced_campaigns` no tiene definición técnica — se debe especificar qué la diferencia de una campaña estándar antes de implementar
- Ambos flags no deben listarse en el pricing Enterprise hasta tener una implementación concreta
