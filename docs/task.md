# LoyalBase — Implementation Tasks

**Creado:** 2026-04-10  
**Basado en:** PRD-v3.md · member-app-features.md · Founding Partner Program.md · Estudio-de-Impacto.md  
**Criterio de orden:** dependencias reales — lo que bloquea al primer cliente va primero.

---

## Semana 1 — Desbloquear el primer cliente (no negociable)

### Día 1–2: Founding Partner Program — base técnica

- [ ] Migración Supabase: `supabase/migrations/YYYYMMDD_founding_partners.sql`
  - `ALTER TABLE tenants ADD COLUMN is_founding_partner BOOLEAN NOT NULL DEFAULT false`
  - `ALTER TABLE tenants ADD COLUMN founding_partner_number INT CHECK (founding_partner_number >= 1 AND founding_partner_number <= 15)`
  - `ALTER TABLE tenants ADD COLUMN founding_trial_ends_at TIMESTAMPTZ`
  - `CREATE INDEX idx_tenants_founding_partner ON tenants(is_founding_partner) WHERE is_founding_partner = true`
  - `CREATE UNIQUE INDEX idx_tenants_founding_number ON tenants(founding_partner_number) WHERE founding_partner_number IS NOT NULL`

- [ ] `packages/config/src/constants.ts` — agregar:
  ```ts
  export const FOUNDING_PARTNER_DISCOUNT = 0.20;
  export const FOUNDING_PARTNER_MAX_SPOTS = 15;
  export const FOUNDING_PARTNER_TRIAL_DAYS = 60;
  export const FOUNDING_PARTNER_COUPON_ID = 'FOUNDING20';
  ```

- [ ] Crear coupon `FOUNDING20` en Stripe Dashboard (TEST + LIVE):
  - Tipo: `Percent off` · 20% · Duración: `Forever` · Máximo canjes: 15

- [ ] `apps/web/app/api/register/route.ts` — modificar:
  - Recibir `isFoundingPartner: boolean` del body
  - Validar cupos antes de proceder (query `count` con `eq('is_founding_partner', true)`)
  - Si cupo lleno → `return NextResponse.json({ error: '...' }, { status: 409 })`
  - En INSERT de `tenants`: incluir `is_founding_partner`, `founding_partner_number`
  - En Stripe Checkout: `trial_period_days: isFoundingPartner ? 60 : 14`
  - En Stripe Checkout: `discounts: isFoundingPartner ? [{ coupon: 'FOUNDING20' }] : undefined`

- [ ] `apps/web/components/landing/PricingPreview.tsx` — agregar Scale al array `PLANS`:
  - Grid 3 columnas
  - Scale: $599/mo regular · anual $499/mo

- [ ] `apps/web/app/pricing/page.tsx` — agregar columna Scale a `TABLE_ROWS`:
  - Unlimited members · Unlimited campaigns · Full analytics + export · Full white-label · Account manager · API access (cuando disponible)
  - Actualizar Schema.org con tercer plan

---

### Día 2: Stripe Webhook — lifecycle de suscripción

- [ ] Crear `apps/web/app/api/stripe/webhook/route.ts` (si no existe ya) — manejar:
  - `checkout.session.completed` → activar tenant, `plan_status: 'trialing'`
  - `customer.subscription.updated` → cambiar plan o `plan_status`
  - `customer.subscription.deleted` → `plan_status: 'cancelled'`
  - `invoice.payment_failed` → `plan_status: 'past_due'` **+ llamar `buildPaymentFailedEmail` + Resend**
    - Join `tenants → auth.users via auth_user_id` para obtener owner email
    - Email interno a `felixdfrometa@gmail.com` con: tenant, monto, retry count, link Stripe
  - `invoice.payment_succeeded` → email de confirmación al tenant (pendiente crear template)
- [ ] Verificar `STRIPE_WEBHOOK_SECRET` en env vars
- [ ] Configurar endpoint webhook en Stripe Dashboard (TEST): `https://loyalbase.dev/api/stripe/webhook`
- [ ] Verificar idempotencia via tabla `stripe_events` (ya existe)

---

### Día 3: Trial Expiry Reminder — email 3 días antes

- [ ] Crear `supabase/functions/trial-expiry-reminder/index.ts`
  - Cron: diario
  - Query: `SELECT * FROM tenants WHERE trial_ends_at::date = (now() + interval '3 days')::date AND plan_status = 'trialing' AND deleted_at IS NULL`
  - Llamar `buildTrialExpiryEmail` (template ya existe en `packages/email/src/templates/trial-expiry.ts`)
  - Enviar via Resend al owner email del tenant
  - El template acepta `daysLeft` — reutilizable para 7 días y 1 día también

---

### Día 3–4: Founding Partners — landing section + registro flow

- [ ] Crear `apps/web/app/api/founding-spots/route.ts`:
  ```ts
  export async function GET() {
    const { count } = await supabase.from('tenants')
      .select('*', { count: 'exact', head: true })
      .eq('is_founding_partner', true);
    const remaining = Math.max(0, 15 - (count ?? 0));
    return NextResponse.json({ remaining, total: 15 });
  }
  ```

- [ ] Crear `apps/web/components/landing/FoundingPartners.tsx`:
  - Badge "Limited Offer" con dot animado
  - Contador de cupos restantes (fetch a `/api/founding-spots`)
  - Countdown hasta deadline (calculado desde `NEXT_PUBLIC_FOUNDING_ANNOUNCEMENT_DATE + 90 días`)
  - Beneficios del programa (lista visual)
  - Precio tachado por plan: `~~$599~~` → **$479/mes**
  - CTA → `/register?source=founding`
  - Nota: *"Tu tarjeta no será cobrada durante 60 días."* (NUNCA "no se requiere tarjeta")

- [ ] Integrar `<FoundingPartners />` en `apps/web/app/page.tsx` — entre Pricing y FinalCTA

- [ ] Modificar `apps/web/app/(auth)/register/page.tsx`:
  - Leer `?source=founding` de `useSearchParams()`
  - Si founding + spots > 0: banner con precios con descuento en Step 2
  - Agregar Scale al selector: `['starter', 'pro', 'scale']`
  - Pasar `isFoundingPartner` al body del POST

- [ ] `apps/web/messages/en.json` y `es.json` — textos del programa

---

### Día 4: QA end-to-end

- [ ] Test completo en Stripe TEST mode (3 planes × mensual/anual)
- [ ] Verificar founding: coupon `FOUNDING20` aplicado, trial 60 días, columnas `founding_*` escritas
- [ ] Verificar bloqueo al cupo 15 → respuesta 409
- [ ] Verificar que el counter de cupos es preciso y se actualiza en tiempo real
- [ ] Verificar webhook activa tenant correctamente post-pago
- [ ] Toggle mensual/anual en landing y registro con precios founding
- [ ] Test móvil: landing → registro → PWA member app
- [ ] i18n EN/ES en todos los componentes nuevos

---

### Día 5: Deploy a producción

- [ ] Crear los 6 Stripe Price IDs en modo **LIVE**
- [ ] Actualizar env vars de producción en Vercel (web + dashboard + member):
  ```
  STRIPE_STARTER_PRICE_ID=price_xxxx
  STRIPE_PRO_PRICE_ID=price_xxxx
  STRIPE_SCALE_PRICE_ID=price_xxxx
  STRIPE_STARTER_ANNUAL_PRICE_ID=price_xxxx
  STRIPE_PRO_ANNUAL_PRICE_ID=price_xxxx
  STRIPE_SCALE_ANNUAL_PRICE_ID=price_xxxx
  NEXT_PUBLIC_FOUNDING_ANNOUNCEMENT_DATE=  ← vacío hasta anuncio de Marketing
  ```
- [ ] Configurar webhook en Stripe **LIVE**: `https://loyalbase.dev/api/stripe/webhook`
- [ ] Deploy: `pnpm turbo build --filter=@loyalty-os/web`
- [ ] Smoke test en producción (tarjeta real de Stripe test, luego reembolsar)
- [ ] Validar registro de Founding Partner en DB
- [ ] Marketing setea `NEXT_PUBLIC_FOUNDING_ANNOUNCEMENT_DATE` → countdown activo

---

## Semana 2 — Legalidad y soporte mínimo viable

### DPA — Data Processing Agreement (obligatorio B2B antes del primer cliente)

- [ ] Crear página `/dpa` en web app — contenido del acuerdo EN + ES
- [ ] Agregar `dpa` a tabla `legal_documents` (tipo de documento)
- [ ] Flujo de aceptación en onboarding del tenant — igual al sistema `consent_documents` existente
- [ ] Sin DPA firmado, LoyalBase no puede onboardear clientes que manejen datos de terceros (obligación GDPR)

### Revisión de ToS y Privacy Policy

- [ ] Revisar `/terms` — validar que el contenido refleja el comportamiento real del producto
- [ ] Revisar `/privacy` — validar retención de datos: alinear a **30 días** (el FAQ dice 90 — inconsistencia con ToS)
- [ ] Actualizar FAQ copy: "90 días después de la cancelación" → "30 días"

### Soporte visible en dashboard

- [ ] Starter: agregar `mailto:support@loyalbase.dev` visible dentro del dashboard (no solo en schema externo)
- [ ] Pro/Scale: integrar Crisp o Tawk.to (free tier), gateado por flag `support_priority_chat`
  - Mostrar widget SOLO a tenants Pro+ (`guardFeature('support_priority_chat')`)

---

## Semana 3 — Deuda técnica que miente al usuario activo

### "2x points at Silver" hardcodeado (bug activo en producción)

- [ ] **Ubicación:** `apps/member/messages/en.json:31` · `apps/member/messages/es.json:31` · `apps/member/app/page.tsx:126`
- [ ] Consultar `point_multipliers` para el multiplicador real del siguiente tier (`tier_silver`)
- [ ] Si multiplier existe: mostrar valor real dinámico
- [ ] Si no existe: fallback genérico sin número → *"Unlock exclusive benefits at Silver"*
- [ ] Eliminar string `"nextTierBonus": "2x points at {tier}"` hardcodeado

### Tier thresholds hardcodeados (tenant no puede configurarlos)

- [ ] **Ubicación:** `apps/dashboard/app/api/members/[id]/visit/route.ts:61-63`
- [ ] Migración: agregar `tier_threshold_silver INT`, `tier_threshold_gold INT`, `tier_threshold_platinum INT` a `tenants`
  - Defaults: Silver=1000, Gold=5000, Platinum=10000 (valores actuales)
- [ ] `GET /api/settings` — exponer los tres thresholds
- [ ] `POST /api/settings` — permitir actualización
- [ ] `visit/route.ts` — reemplazar valores hardcodeados con `tenant.tier_threshold_*`
- [ ] Settings UI — inputs numéricos para los tres thresholds

### `points_per_dollar` no configurable por el tenant

- [ ] **Ubicación:** `apps/dashboard/app/api/settings/route.ts`
- [ ] Agregar `points_per_dollar` al `GET` handler (ya existe la columna, no se expone)
- [ ] Agregar `points_per_dollar` al `POST/PATCH` handler
- [ ] Settings UI — input numérico para puntos por dólar
- [ ] Actualizar FAQ copy: suavizar promesa hasta que esté implementado

### Starter plan pricing actualizado

- [ ] Stripe: crear nuevo Price ID `$99/mo` para Starter
- [ ] Actualizar `STRIPE_STARTER_PRICE_ID` en Vercel
- [ ] `guardFeature.ts` — actualizar `max_members: 800` (era 500)
- [ ] Plan enforcement — actualizar `max_campaigns: 3` (era 2)
- [ ] `FeatureGate` logo upload — deshabilitar para Starter (remover `whitelabel_logo` del plan Starter)
- [ ] Pricing page copy — reflejar $99/mo, 800 members, 3 campaigns, sin logo white-label
- [ ] Emails de onboarding que referencien features del Starter — actualizar

### Pricing page — Pro plan copy

- [ ] Cambiar "Birthday rewards & campaigns" → **"Gamification"** en el card de Pro
  - Archivo: landing page pricing component

### FAQ — Voseo a español neutro

- [ ] Cambiar "Vos definís los puntos por dólar" → "Puedes configurar los puntos por dólar"
- [ ] Cambiar "creás tu propio catálogo de premios" → "crea tu propio catálogo de premios"

---

## Semana 4 — Suspension flow + Account Manager mínimo

### Tenant Suspension — razón, email y confirmación

- [ ] **Ubicación:** `apps/dashboard/components/admin/TenantDetailClient.tsx:184` · `apps/dashboard/lib/admin/actions.ts:60`
- [ ] Agregar modal de confirmación antes de ejecutar `suspendTenant`
  - Input de razón obligatorio antes de confirmar
- [ ] `suspendTenant(id, reason)` — pasar razón al `platform_events.metadata`
- [ ] Enviar email via Resend al `tenant.owner_email` con: razón, fecha, link de contacto (EN + ES)
- [ ] Email interno a `felixdfrometa@gmail.com` con: nombre del tenant, razón, fecha

### Account Manager mínimo viable (Scale + Enterprise)

- [ ] Trigger en webhook `customer.subscription.updated` — cuando plan cambia a Scale o Enterprise:
  - Enviar email al tenant presentando al account manager (`felixdfrometa@gmail.com`)
  - Incluir: nombre, contacto directo, oferta de onboarding call (Calendly link)
  - EN + ES según preferencia del tenant
- [ ] Sin UI compleja — es un trigger operacional, no una feature de software

### Self-service perfil del miembro (Technical Debt)

- [ ] **Ubicación:** `/profile` tab — member app
- [ ] Editar nombre, teléfono y campos de perfil
- [ ] Cambio de contraseña: reauthenticación + `supabase.auth.updateUser({ password })`
- [ ] Eliminar cuenta: modal de confirmación → API route server-side → `supabase.auth.admin.deleteUser` + borrar fila `members`

### Tenant Account Closure — email + export

- [ ] **Ubicación:** `apps/dashboard/lib/admin/actions.ts:92`
- [ ] Email de cierre vía Resend al `tenant.owner_email` (EN + ES): fecha, razón, ventana de 30 días para exportar
- [ ] Self-service closure en dashboard Settings (zona de peligro)
- [ ] Export de datos: CSV con members, transactions, redemptions, rewards, campaigns
  - Procesamiento en background (job + notificación por email cuando listo)
  - Link activo durante 30 días después de `deleted_at`
- [ ] Hard-delete logic: actualizar a 30 días (alinear con ToS)

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
