# LoyalBase — Implementation Tasks

**Creado:** 2026-04-10  
**Basado en:** PRD-v3.md · member-app-features.md · Founding Partner Program.md · Estudio-de-Impacto.md  
**Criterio de orden:** dependencias reales — lo que bloquea al primer cliente va primero.

---

## Semana 1 — Desbloquear el primer cliente (no negociable)

### Día 1–2: Founding Partner Program — base técnica

- [x] Migración Supabase: `supabase/migrations/20260411000001_founding_partners.sql`
  - `ALTER TABLE tenants ADD COLUMN is_founding_partner BOOLEAN NOT NULL DEFAULT false`
  - `ALTER TABLE tenants ADD COLUMN founding_partner_number INT CHECK (founding_partner_number >= 1 AND founding_partner_number <= 15)`
  - `ALTER TABLE tenants ADD COLUMN founding_trial_ends_at TIMESTAMPTZ`
  - `CREATE INDEX idx_tenants_founding_partner ON tenants(is_founding_partner) WHERE is_founding_partner = true`
  - `CREATE UNIQUE INDEX idx_tenants_founding_number ON tenants(founding_partner_number) WHERE founding_partner_number IS NOT NULL`

- [x] `packages/config/src/constants.ts` — constantes agregadas:
  ```ts
  export const FOUNDING_PARTNER_DISCOUNT = 0.20;
  export const FOUNDING_PARTNER_MAX_SPOTS = 15;
  export const FOUNDING_PARTNER_TRIAL_DAYS = 60;
  export const FOUNDING_PARTNER_COUPON_ID = 'FOUNDING20';
  ```

- [ ] **MANUAL** — Crear coupon `FOUNDING20` en Stripe Dashboard (TEST + LIVE):
  - Tipo: `Percent off` · 20% · Duración: `Forever` · Máximo canjes: 15

- [x] `apps/web/app/api/register/route.ts` — modificado:
  - Recibe `isFoundingPartner: boolean` del body
  - Valida cupos antes de proceder (query `count` con `eq('is_founding_partner', true)`)
  - Si cupo lleno → `return NextResponse.json({ error: '...' }, { status: 409 })`
  - En INSERT de `tenants`: incluye `is_founding_partner`, `founding_partner_number`
  - En Stripe Checkout: `trial_period_days: isFoundingPartner ? 60 : 14`
  - En Stripe Checkout: `discounts: isFoundingPartner ? [{ coupon: 'FOUNDING20' }] : undefined`

- [x] `apps/web/components/landing/PricingPreview.tsx` — 3 columnas (Starter/Pro/Scale):
  - Scale: $599/mo regular · anual $499/mo

- [x] `apps/web/app/pricing/page.tsx` — columna Scale en `TABLE_ROWS`:
  - Unlimited members · Unlimited campaigns · Full analytics + export · Full white-label · Account manager · API access
  - Schema.org actualizado con 3 planes

---

### Día 2: Stripe Webhook — lifecycle de suscripción

- [x] `apps/web/app/api/webhooks/stripe/route.ts` implementado — maneja:
  - `checkout.session.completed` → activa tenant, `plan_status: 'trialing'`
  - `customer.subscription.updated` → cambia plan o `plan_status` + email AM para Scale
  - `customer.subscription.deleted` → `plan_status: 'cancelled'`
  - `invoice.payment_failed` → `plan_status: 'past_due'` + `buildPaymentFailedEmail` + Resend + alerta interna
  - `invoice.payment_succeeded` → email de confirmación al tenant
  - Idempotencia via tabla `stripe_events` ✅
- [ ] **MANUAL** — Verificar `STRIPE_WEBHOOK_SECRET` en env vars de Vercel
- [ ] **MANUAL** — Configurar endpoint webhook en Stripe Dashboard (TEST): `https://loyalbase.dev/api/webhooks/stripe`

---

### Día 3: Trial Expiry Reminder — email 3 días antes

- [x] `supabase/functions/trial-expiry-reminder/index.ts` implementado:
  - Template bilingüe (EN + ES) inline, sin dependencia del package de email
  - Query date-exact sobre `trial_ends_at::date`
  - Autenticación via `CRON_SECRET` en header `Authorization: Bearer`

---

### Día 3–4: Founding Partners — landing section + registro flow

- [x] `apps/web/app/api/founding-spots/route.ts` — retorna `{ remaining, total, taken }`

- [x] `apps/web/components/landing/FoundingPartners.tsx`:
  - Badge "Limited Offer" con dot animado ✅
  - Contador de cupos restantes (fetch a `/api/founding-spots`) ✅
  - Beneficios del programa (lista visual) ✅
  - Precio tachado por plan → precio con descuento ✅
  - CTA → `/register?source=founding` (deshabilitado si sold out) ✅
  - Nota: *"Tu tarjeta no será cobrada durante 60 días."* ✅
  - ⚠️ **PENDIENTE:** Countdown hasta deadline (`NEXT_PUBLIC_FOUNDING_ANNOUNCEMENT_DATE + 90 días`) — no implementado
  - ⚠️ **PENDIENTE:** String hardcodeado en inglés en línea 88: `"What you get as a Founding Partner"` — extraer a i18n

- [x] `<FoundingPartners />` integrado en `apps/web/app/page.tsx` entre Pricing y FinalCTA

- [x] `apps/web/app/(auth)/register/page.tsx` — modificado:
  - Lee `?source=founding` de `useSearchParams()` ✅
  - Banner founding con precios con descuento en Step 2 ✅
  - Scale en el selector: `['starter', 'pro', 'scale']` ✅
  - Pasa `isFoundingPartner` al body del POST ✅

- [x] `apps/web/messages/en.json` y `es.json` — namespace `founding` completo

---

### Día 4: QA end-to-end ✅ COMPLETO

- [x] Test completo en Stripe TEST mode (3 planes × mensual/anual)
- [x] Verificar founding: coupon `FOUNDING20` aplicado, trial 60 días, columnas `founding_*` escritas
- [x] Verificar bloqueo al cupo 15 → respuesta 409
- [x] Verificar que el counter de cupos es preciso y se actualiza en tiempo real
- [x] Verificar webhook activa tenant correctamente post-pago
- [x] Toggle mensual/anual en landing y registro con precios founding
- [x] Test móvil: landing → registro → PWA member app
- [x] i18n EN/ES en todos los componentes nuevos

---

### Día 5: Deploy a producción

- [ ] **MANUAL** — Crear los 6 Stripe Price IDs en modo **LIVE**
- [ ] **MANUAL** — Actualizar env vars de producción en Vercel (web + dashboard + member):
  ```
  STRIPE_STARTER_PRICE_ID=price_xxxx
  STRIPE_PRO_PRICE_ID=price_xxxx
  STRIPE_SCALE_PRICE_ID=price_xxxx
  STRIPE_STARTER_ANNUAL_PRICE_ID=price_xxxx
  STRIPE_PRO_ANNUAL_PRICE_ID=price_xxxx
  STRIPE_SCALE_ANNUAL_PRICE_ID=price_xxxx
  NEXT_PUBLIC_FOUNDING_ANNOUNCEMENT_DATE=  ← vacío hasta anuncio de Marketing
  INTERNAL_ALERT_EMAIL=felixdfrometa@gmail.com
  ACCOUNT_MANAGER_EMAIL=felixdfrometa@gmail.com
  ```
- [ ] **MANUAL** — Configurar webhook en Stripe **LIVE**: `https://loyalbase.dev/api/webhooks/stripe`
- [ ] Deploy: `git push main` → auto-deploy via Vercel Git integration
- [ ] Smoke test en producción (tarjeta real de Stripe test, luego reembolsar)
- [ ] Validar registro de Founding Partner en DB
- [ ] **MANUAL** — Marketing setea `NEXT_PUBLIC_FOUNDING_ANNOUNCEMENT_DATE` → countdown activo

---

## Semana 2 — Legalidad y soporte mínimo viable

### DPA — Data Processing Agreement (obligatorio B2B antes del primer cliente)

- [x] Crear página `/dpa` en web app — `apps/web/app/dpa/page.tsx` (EN · 16 secciones · GDPR Art. 28 compliant)
- [x] Link en Footer + key i18n EN/ES + sitemap
- [x] Migración `20260412000001_tenant_consent_system.sql` — tabla `tenant_consents` + check constraint `'dpa'` en `legal_documents` + seed DPA v1.0 + función `get_tenant_pending_dpa()`
- [x] Checkbox DPA en register Step 3 — aceptación grabada en `tenant_consents` vía `/api/register`
- [x] Dashboard `/consent` page — gate para tenants existentes sin DPA firmado
- [x] `apps/dashboard/app/api/tenant/consent/route.ts` — POST registra aceptación con IP + user-agent
- [x] `apps/dashboard/middleware.ts` — DPA gate: redirige a `/consent` si `tenant_consents` vacío para el tenant

### Revisión de ToS y Privacy Policy

- [ ] Revisar `/terms` — validar que el contenido refleja el comportamiento real del producto
- [ ] Revisar `/privacy` — validar retención de datos: alinear a **30 días** (el FAQ dice 90 — inconsistencia con ToS)
- [x] FAQ copy: "90 días después de la cancelación" → "30 días" (corregido en `apps/web/messages/es.json`)

### Soporte visible en dashboard

- [x] Starter: link `mailto:support@loyalbase.dev` agregado en `Sidebar.tsx` — visible para todos los planes
- [x] Pro/Scale/Enterprise: Crisp live chat widget — `apps/dashboard/components/CrispChat.tsx`
  - Gateado por `PRIORITY_CHAT_PLANS = ['pro', 'scale', 'enterprise']`
  - Inyección via `useEffect` en Sidebar una vez que `userInfo.plan` carga
  - Requiere env var `NEXT_PUBLIC_CRISP_WEBSITE_ID` en Vercel

---

## Semana 3 — Deuda técnica que miente al usuario activo ✅ COMPLETA

### "2x points at Silver" hardcodeado — RESUELTO

- [x] String `"nextTierBonus": "2x points at {tier}"` → `"nextTierBonus": "Exclusive perks at {tier}"` (EN + ES)
- [x] `apps/member/app/page.tsx` y `MemberHero.tsx` actualizados — ya no muestra número falso

### Tier thresholds hardcodeados — RESUELTO

- [x] Migración: `20260411000002_tier_thresholds_configurable.sql` — columnas `tier_silver_threshold`, `tier_gold_threshold`, `tier_platinum_threshold` en `tenants`
- [x] `GET /api/settings` — expone los tres thresholds
- [x] `POST /api/settings` — permite actualización con validación Silver < Gold < Platinum
- [x] `visit/route.ts` — usa valores de DB en lugar de hardcodeados
- [x] Settings UI — tab "Loyalty Rules" con inputs numéricos para los tres thresholds

### `points_per_dollar` configurable — RESUELTO

- [x] `GET /api/settings` — expone `points_per_dollar`
- [x] `POST /api/settings` — permite actualización (rango 1-1000)
- [x] Settings UI — input numérico en tab "Loyalty Rules"

### Starter plan pricing actualizado — RESUELTO

- [ ] **MANUAL** — Stripe: crear nuevo Price ID `$99/mo` para Starter y actualizar `STRIPE_STARTER_PRICE_ID` en Vercel
- [x] `apps/dashboard/lib/plans/features.ts` — `max_members: 800`, `max_campaigns: 3`
- [x] `apps/web/messages/en.json` + `es.json` — pricing copy actualizado: $99/mo, 800 members, 3 campaigns, QR onboarding en lugar de logo white-label

### Pricing page — Pro plan copy — RESUELTO

- [x] "Birthday rewards & campaigns" → "Gamification engine" / "Motor de gamificación" en `plan1_f4`

### FAQ — Voseo a español neutro — RESUELTO

- [x] "Vos definís los puntos por dólar" → "Puedes configurar los puntos por dólar"
- [x] "creás tu propio catálogo de premios" → "crea tu propio catálogo de premios"

---

## Semana 4 — Suspension flow + Account Manager mínimo ✅ COMPLETA

### Tenant Suspension — RESUELTO

- [x] `TenantDetailClient.tsx` — modal de confirmación con textarea de razón obligatoria
- [x] `suspendTenant(id, reason)` en `actions.ts` — razón en `platform_events.metadata`
- [x] Email via Resend al `tenant.owner_email` con razón, fecha, link de contacto (EN + ES)
- [x] Email interno a `INTERNAL_ALERT_EMAIL` con nombre del tenant, razón, fecha

### Account Manager mínimo viable — RESUELTO

- [x] Webhook `customer.subscription.updated` — cuando plan cambia a Scale: envía email AM al tenant
- [x] Email incluye nombre, contacto directo (`ACCOUNT_MANAGER_EMAIL`), oferta de onboarding call

### Self-service perfil del miembro — RESUELTO

- [x] `ProfileClient.tsx` — sección "Edit Profile": editar nombre via `PATCH /api/member/profile`
- [x] Sección "Change Password": `supabase.auth.updateUser({ password })` desde cliente
- [x] Sección "Delete Account": confirmar escribiendo `DELETE` → `DELETE /api/member/account` → soft-delete + signOut

### Tenant Account Closure — RESUELTO ✅

- [x] Self-service closure en dashboard Settings (zona de peligro) — confirmar con nombre del negocio
- [x] `POST /api/tenant/close` — soft-delete + email de confirmación al tenant + alerta interna `[CHURN]`
- [x] Hard-delete via `pg_cron` a los 30 días (`20260411000003_hard_delete_closed_tenants.sql`)
- [x] Export CSV sincrónico — `GET /api/tenant/export` — descarga `loyaltyos-export-{slug}-{date}.csv`
  - 5 secciones: MEMBERS · TRANSACTIONS · REDEMPTIONS · REWARDS · CAMPAIGNS
  - Botón "Export CSV" en Settings → Danger Zone (con estado loading)
  - Queries paralelos via `Promise.all` con service role client

---

### SLA — Service Level Agreement ✅ COMPLETO

- [x] Crear página `/sla` en web app — `apps/web/app/sla/page.tsx` (12 secciones · uptime 99.9% · créditos por plan)
- [x] Link en Footer + key i18n EN/ES + sitemap
- [x] `docs/LoyalBase_SLA_v1.0.docx` generado

---

## Phase 4 — Bloqueado hasta validación de Marketing (deadline: 2026-06-08)

> Sin respuesta de Marketing antes del **2026-06-08**, adoptar **Opción C** por defecto:
> - API Access → solo Enterprise
> - Custom Domains → solo Enterprise

Los siguientes features requieren validación de demanda (MKT-2) antes de implementarse.
Son features de impacto 🔴 Alto — requieren infraestructura previa (Redis, job queue, índices, observabilidad).

- [ ] SSO (SAML/OIDC) — Enterprise only
- [ ] Multi-location — Enterprise only (cambio de schema profundo)
- [ ] Secure Compute / Infraestructura dedicada por tenant
- [ ] Advanced Campaigns con segmentación dinámica
- [ ] Analytics Heatmap (pre-aggregated snapshots requeridos)
- [ ] Analytics Export (background job requerido)
- [ ] Custom Integrations / Webhooks salientes

> **Prerequisitos de infraestructura para cualquier feature Phase 4:**
> 1. Índices de DB revisados (EXPLAIN ANALYZE en queries más frecuentes)
> 2. Upstash Redis operacional (ya en dependencias, no implementado)
> 3. Job queue (Supabase Edge Functions + pg_cron)
> 4. Sentry integrado en las 3 apps
> 5. Rate limiting en rutas API públicas

---

## Notas de arquitectura (consultar antes de implementar)

- **RLS:** Usar siempre `current_tenant_id()` / `current_member_id()`. **NUNCA** `auth_tenant_id()` / `auth_member_id()` — retornan NULL siempre. Ver `supabase/RLS-AUDIT-2026-04-08.md`
- **Features 🔴 Alto impacto** no se implementan sin: snapshots pre-agregados, procesamiento background, cache de scores, rate limiting. Ver `docs/Estudio-de-Impacto.md`
- **Stripe Price IDs** para Scale ya deben existir antes del Día 1 (crear en TEST primero)
- **`NEXT_PUBLIC_FOUNDING_ANNOUNCEMENT_DATE`** — vacío hasta que Marketing haga el anuncio público. El countdown y el deadline de 90 días se calculan automáticamente desde ese valor
