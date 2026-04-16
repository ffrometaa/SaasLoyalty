# LoyaltyOS — Product Requirements Document v3.0

**Fecha:** Abril 2026
**Estado:** Semanas 1–4 de deuda técnica completadas · Member engagement features implementados · Mobile accessibility audit completado · Deploy a producción activo · Pendiente: Stripe LIVE + Crisp env vars
**Versión anterior:** PRD v2.0 (Abril 2026 — MVP completo + roadmap Phase 3)

---

## 1. Resumen Ejecutivo

LoyaltyOS es una plataforma SaaS multi-tenant white-label que permite a negocios B2B lanzar programas de fidelización propios con PWA mobile para sus clientes, panel de gestión completo, campañas automatizadas y motor de gamificación enterprise.

### Cambios clave desde PRD v2

- **Phase 3 adelantada:** 5 de los 9 módulos de Phase 3 completados en Abril 2026, meses antes de las fechas planificadas.
- **Deuda técnica Semanas 1–4 completada (Abril 2026):** Tier thresholds configurables, `points_per_dollar` editable, Starter pricing actualizado ($99/mo, 800 members), suspension modal con email, AM email trigger, perfil de miembro editable, self-service account closure, hard-delete cron, trial expiry reminder, i18n neutro.
- **Founding Partners Program implementado (Abril 2026):** Landing section, registro flow, endpoint de cupos, webhook lifecycle completo. QA en TEST mode pasado. Bloqueado para producción solo por configuración manual de Stripe LIVE.
- **Decisión de pricing pendiente (MKT-1):** API Access y Custom Domains siguen bloqueados por falta de validación de mercado. Sin respuesta de marketing antes del 2026-06-08, se adopta Opción C (solo Enterprise) por defecto.
- **Phase 4 en definición:** Los tres gaps críticos de Enterprise (SSO, Multi-location, Secure Compute) pasan formalmente a Phase 4, sujeto a validación de demanda por marketing (MKT-2).
- **Siguiente bloqueante de Semana 2:** DPA page + aceptación en onboarding (obligatorio antes del primer cliente B2B) y widget de soporte Pro/Scale (Crisp/Tawk.to). ✅ Completado en Abril 2026.
- **Member Engagement Features implementados (Abril 2026):** Points per visit configurable, welcome bonus al unirse, Google Review reward, referral prompt en home, show/hide password en registro de miembro.
- **Mobile Accessibility Audit completado (Abril 2026):** Landing page y Member app auditadas y corregidas — hamburger touch target 44x44px, iOS Safari auto-zoom eliminado en todos los inputs (text-base 16px), textos sub-12px reemplazados por text-xs, prefers-reduced-motion en globals.css.
- **Legal docs completados (Abril 2026):** Página `/sla` publicada, `LoyalBase_SLA_v1.0.docx` y `LoyalBase_DPA_v1.0.docx` generados.

---

## 2. Estado Actual — Plataforma en Producción

### 2.1 Arquitectura de Producción

| App | URL | Función |
|-----|-----|---------|
| **Web** | `loyalbase.dev` | Landing + registro de tenants + checkout Stripe |
| **Dashboard** | `dashboard.loyalbase.dev` | Panel de gestión para tenants + Super Admin |
| **Member** | `member.loyalbase.dev` | PWA mobile para miembros del programa |

**Stack tecnológico:**
- **Frontend:** Next.js 14.2 + TypeScript + Tailwind CSS + shadcn/ui
- **Base de datos:** Supabase PostgreSQL con RLS multi-tenant (30+ migraciones aplicadas)
- **Auth:** Supabase Auth — email/password + OTP de dispositivo + tokens de invitación
- **Pagos:** Stripe Billing (Starter $99 / Pro $399 / Scale $599 por mes)
- **Email:** Resend — 20+ templates bilingüe (EN/ES)
- **Push:** OneSignal — integrado en Member app
- **Monorepo:** Turborepo + pnpm workspaces (5 packages compartidos)
- **Hosting:** Vercel (3 proyectos independientes)
- **i18n:** next-intl — inglés (principal) y español neutro en las 3 apps
- **Rate Limiting:** @upstash/ratelimit en middleware de Member App
- **Cache:** unstable_cache en 5 rutas API del Dashboard
- **Edge Functions:** 10 funciones Supabase desplegadas (expiración, cumpleaños, riesgo, alertas, resumen semanal, trial-expiry-reminder)
- **Tests:** Vitest — 58 tests de integración + componentes en CI

---

### 2.2 Web App (`loyalbase.dev`)

**Páginas públicas:**
- Landing page con hero, features, pricing y CTA
- Página de pricing con planes Starter / Pro / Scale
- About, Contact, Terms, Privacy
- `/dpa` — Data Processing Agreement (GDPR Art. 28, 16 secciones)
- `/sla` — Service Level Agreement (99.9% uptime target, créditos por plan, soporte por tier)

**Documentos legales (.docx):**
- `docs/LoyalBase_DPA_v1.0.docx`
- `docs/LoyalBase_SLA_v1.0.docx`

**Flujo de registro de tenant:**
1. Usuario completa formulario de registro
2. Redirigido a checkout de Stripe
3. Webhook de Stripe crea el tenant en DB
4. Email de bienvenida vía Resend
5. Usuario redirigido al dashboard

**Features:**
- Demo request con tracking de atribución
- Sistema de invitaciones para team members (`/invite/[token]`)
- Cross-domain login SSO entre Web y Dashboard
- Formulario de contacto

**Mobile accessibility (Abril 2026):**
- Hamburger button: touch target corregido a 44x44px (Apple/Google standard)
- Textos sub-12px reemplazados por `text-xs` en todos los componentes del landing
- `prefers-reduced-motion` media query en `globals.css` — detiene animaciones para usuarios con esta preferencia activa en el SO

---

### 2.3 Dashboard App (`dashboard.loyalbase.dev`)

**Autenticación:**
- Email + contraseña con verificación OTP por dispositivo nuevo
- Device trust system (skip OTP en dispositivos ya verificados)
- Recuperación de contraseña vía email
- Super Admin impersonation

**Gestión de miembros:**
- Lista paginada con búsqueda full-text y filtros (tier, status)
- Perfil individual con historial de transacciones
- Creación manual de miembros
- Importación masiva vía CSV
- **Bulk actions:** selección múltiple, ajuste masivo de puntos, envío de campaña a selección, export CSV de selección
- Ajuste de puntos manual con motivo
- Registro de visitas
- Invitaciones a miembros por email con token
- Vista detallada: puntos, tier, historial, analytics individuales

**Sistema de recompensas:**
- CRUD completo de recompensas
- Configuración de costo en puntos, stock, validez, imágenes
- Scanner QR (QR + EAN-13 + Code 128 + otros formatos)
- Historial de redenciones con códigos alfanuméricos

**Campañas:**
- Tipos: reactivación, cumpleaños, custom, lanzamiento
- Segmentación: por tier, por días de inactividad, por fecha de alta, custom SQL
- Canales: email + push notifications
- Métricas: enviados, entregados, abiertos, clicks
- Scheduling para envío futuro
- Límites por plan (Starter: 2/mes, Pro: 10/mes)

**Motor de Gamificación:**
- Behavior Scoring: churn risk (0-1), engagement score (0-1), motivación (achiever/socializer/explorer/competitor)
- Challenges: desafíos por visitas o puntos con bonus points y badges
- Missions: secuencias multi-paso con tracking de progreso
- Point Multipliers: multiplicadores temporales (1.5x-5x)
- Leaderboards: rankings semanales y mensuales
- Intervention Orchestrator: trigger automático de campañas de re-engagement

**Analytics:**
- Métricas clave: miembros activos, visitas del mes, puntos redimidos, tasa de retención
- Comparativas mes a mes
- Feed de actividad reciente en tiempo real
- **Cohort analysis:** retención por mes de alta
- **Funnel de activación:** alta → primera visita → primera redención
- **Revenue attribution por campaña**
- **Export CSV/Excel** (gateado a Scale+)

**Configuración del tenant:**
- Perfil del negocio (nombre, tipo, logo)
- Branding personalizado (colores, logo)
- Gestión de equipo con invitaciones y roles
- Facturación: historial de invoices, portal de Stripe
- Idioma de la cuenta
- Join code alfanumérico de 6 caracteres
- Zona de peligro (eliminar cuenta, exportar datos)

**Loyalty Rules — opciones configurables:**
- `points_per_dollar` (rango 1–1000)
- Tier thresholds (Silver / Gold / Platinum)
- `points_per_visit` — puntos fijos por check-in (toggle on/off · mínimo 15 pts · default: activo, 15 pts)
- Welcome bonus — puntos al registrarse (toggle on/off · default: activo, 50 pts)
- Google Review reward — URL + puntos por dejar reseña en Google (toggle on/off · default: inactivo)
- Referral program — puntos para quien refiere y para quien es referido (toggle on/off)

**Super Admin (`/admin`):**
- Overview de todos los tenants con métricas de revenue
- Gestión individual: impersonar, modificar plan, ver logs
- System logs auditables
- Settings globales del sistema
- Preview de planes (simulador)

---

### 2.4 Member App (`member.loyalbase.dev`)

**PWA instalable:**
- `manifest.json` con íconos para iOS/Android
- Service Worker con Workbox (cache offline + página fallback)
- Shortcuts en home screen

**Flujo de incorporación:**
1. Miembro recibe invitación por email o join code
2. Entra a `/join` e ingresa email
3. Sistema valida si ya existe o crea cuenta nueva
4. Valida join code, completa perfil (con confirm password + show/hide toggle), acepta T&C y Privacy Policy
5. Puede ingresar código de referido si lo tiene
6. Al crear la cuenta se aplica welcome bonus si el tenant lo tiene habilitado
7. Redirigido a home con balance y tier

**Login directo (sin join code):**
- `/login` con email + password
- Resolución automática de tenant: cookie → 1 membresía → picker N membresías
- Sin join code requerido para acceso recurrente

**Sistema de consentimiento legal:**
- Checkbox de T&C requerido en registro
- Registro en DB con IP y user-agent para auditoría
- Re-aceptación forzada si hay nuevas versiones (`/consent-update`)
- `ConsentGuard` en root layout

**Features del miembro:**
- Home: balance, tier con barra de progreso, actividad reciente
- Catálogo de recompensas con filtros
- Canje: código alfanumérico + QR
- Historial: timeline de transacciones
- Leaderboard
- Challenges con progreso
- **Referral Program:** link único, tracking de estado, bonus points, panel en perfil · prompt card en home con código del miembro
- **Notificaciones in-app:** historial paginado, badge de no leídas, mark-all-read
- Perfil: nombre, preferencias, idioma EN/ES sincronizado a DB
- **Google Review CTA:** banner en home (si tenant lo activa) → abre URL de Google Reviews + acredita puntos (honor system, una sola vez por miembro)
- **Welcome bonus:** puntos acreditados automáticamente al crear la cuenta (configurable por tenant)

**i18n:**
- Inglés como idioma principal por defecto
- Español neutro (sin voseo/rioplatense) como alternativa
- Preferencia sincronizada a DB y respetada en emails y push

**Mobile accessibility (Abril 2026):**
- iOS Safari auto-zoom eliminado: todos los `<input>` usan `text-base` (16px mínimo)
- Textos sub-12px reemplazados por `text-xs` en todos los componentes
- PWA fundamentals ya presentes: `viewportFit: cover`, safe area insets, `overscroll-behavior-y: none`, `-webkit-tap-highlight-color: transparent`

---

### 2.5 Automatizaciones Programadas (Edge Functions + pg_cron)

| Proceso | Trigger | Función |
|---------|---------|---------|
| Expiración de puntos | Diario medianoche | `expire-points` |
| Bonus de cumpleaños | Diario | `birthday-bonus` |
| Miembros en riesgo | Semanal | `at-risk-notifications` + `trigger-reactivation` |
| Tier upgrade | Trigger en transacción | `tier_upgrade_trigger` (migration) |
| Puntos próximos a vencer | Mensual | `points-expiring-alert` |
| Resumen semanal al tenant | Lunes 8am | `weekly-tenant-summary` |
| Scoring engine | On-demand | `run-scoring-engine` |
| Notificar leads | On-demand | `notify-lead` |

---

### 2.6 Modelo de Datos

**30+ tablas:**

| Entidad | Descripción |
|---------|-------------|
| `tenants` | Cuentas B2B, plan, Stripe customer/subscription · loyalty rules: `points_per_dollar`, `points_per_visit`, `welcome_bonus_*`, `google_review_*`, `referral_*`, tier thresholds |
| `tenant_plan_history` | Historial de cambios de plan (from_plan, to_plan, changed_at) |
| `members` | Clientes del programa, puntos, tier, auth_user_id, referral_code · `google_review_claimed_at` |
| `tenant_users` | Staff del negocio con roles |
| `tenant_invites` | Invitaciones pendientes de equipo |
| `member_invitations` | Invitaciones a miembros |
| `transactions` | Registro inmutable de movimientos de puntos |
| `visits` | Check-ins con metadata analítica |
| `rewards` | Catálogo de recompensas por tenant |
| `redemptions` | Canjes con código alfanumérico + estado |
| `challenges` | Desafíos de gamificación |
| `badges` | Insignias desbloqueables |
| `missions` | Secuencias multi-paso |
| `mission_steps` | Pasos de misiones |
| `member_mission_progress` | Progreso por miembro |
| `member_behavior_scores` | Scores de churn/engagement/motivación |
| `point_multipliers` | Multiplicadores de puntos activos |
| `leaderboards` | Rankings de miembros |
| `intervention_events` | Eventos de re-engagement |
| `campaigns` | Campañas de comunicación |
| `campaign_segments` | Segmentos objetivo |
| `in_app_notifications` | Notificaciones in-app por miembro |
| `notifications` | Registro de notificaciones push enviadas |
| `demo_requests` | Tracking de demos con atribución |
| `stripe_events` | Idempotencia de webhooks Stripe |
| `otp_codes` | Códigos OTP de verificación |
| `legal_documents` | Documentos legales versionados |
| `member_consents` | Registro de aceptaciones por miembro |
| `scheduled_jobs` | Tracking de ejecución de automatizaciones |
| `dynamic_challenges` | Desafíos personalizados por miembro con progreso, bonus_points, expires_at, is_dismissed |

**Seguridad:**
- RLS en todas las tablas multi-tenant — funcional via `current_tenant_id()` / `current_member_id()` (SECURITY DEFINER, resuelven por `auth.uid()`)
- Segunda línea de defensa operativa — un bug en app-layer no expone datos de otros tenants
- Índice en `members.auth_user_id` para lookup eficiente en políticas RLS

**Convención obligatoria — helpers de RLS:**
- Usar siempre `current_tenant_id()` y `current_member_id()` en todas las policies
- **NUNCA usar `auth_tenant_id()` ni `auth_member_id()`** — leen session vars que nunca se setean desde middleware, siempre retornan `NULL`, cualquier policy que las use es un no-op silencioso
- Auditado y corregido en `20260408000010_fix_gamification_engine_rls.sql` — ver `supabase/RLS-AUDIT-2026-04-08.md`

---

### 2.7 Planes y Límites

| Feature | Starter ($99/mo) | Pro ($399/mo) | Scale ($599/mo) | Enterprise |
|---------|-----------------|---------------|-----------------|------------|
| Miembros | 800 | 2.000 | Ilimitado | Ilimitado |
| Campañas/mes | 3 | 10 | Ilimitado | Ilimitado |
| Gamificación | — | Básica | Completa | Enterprise |
| Analytics | Básico | Completo | Completo | Custom |
| White-label | — | — | Full | Full |
| Data Export (CSV) | — | — | ✓ | ✓ |
| API Access | — | — | — (†) | ✓ |
| Custom Domain | — | — | — (†) | ✓ |
| Booking Integration | — | — | — | ✓ |
| Account Manager | — | — | ✓ | ✓ |
| Soporte | Email | Priority | Dedicado | SLA |

> **(†) Pendiente decisión MKT-1** — API Access y Custom Domains están fuera del plan Scale hasta que marketing valide el modelo de pricing. Ver §3.

> **Starter actualizado a $99/mo** — 800 miembros, 3 campañas/mes, sin logo white-label. Actualizado en Abril 2026.

### 2.8 Founding Partners Program

**Referencia:** Ver `Founding Partner Program.md` para la especificación completa.

**Resumen:**
- Programa de adquisición de los primeros **15 clientes** de pago
- **Trial extendido:** 60 días (vs. 14 días estándar del registro regular)
- **Descuento:** 20% de por vida en cualquier plan — bloqueado permanentemente
- **Precios Founding Partner:** Starter $159/mo · Pro $319/mo · Scale $479/mo
- **Deadline:** 60 días desde el anuncio de Marketing (fecha TBD por Marketing)
- **Stripe:** Coupon `FOUNDING20` — 20% forever, max 15 canjes

**Cambios técnicos requeridos en la plataforma:**
- Columnas `is_founding_partner`, `founding_partner_number`, `founding_trial_ends_at` en `tenants`
- Modificación de `apps/web/app/api/register/route.ts` para soportar trial de 60 días y coupon
- Sección `<FoundingPartners />` en landing page con countdown y contador de cupos
- Endpoint `/api/founding-spots` para conteo en tiempo real
- Registro de Stripe: Scale ya soportado en el route (`STRIPE_SCALE_PRICE_ID`)

**Estado implementación:** ✅ Código completo + QA en TEST mode pasado. Bloqueante actual: configuración manual de Stripe LIVE (6 Price IDs + coupon `FOUNDING20` + webhook endpoint) y env vars en Vercel.

---

## 3. Gates de Marketing — Estado Actual

### MKT-1: Pricing API Access + Custom Domains
- **Fecha límite:** 2026-06-08 (inicio de implementación de Public REST API)
- **Estado:** `[ ] Pendiente — responsable: Marketing`
- **Opciones a evaluar:**
  - A — Tier Scale+ ($799-$899/mo) con ambos features incluidos
  - B — Add-ons separados (+$X/mo sobre Scale)
  - C — Solo Enterprise (default si no hay datos al inicio de Phase 3)
- **Criterio de resolución:** Sin respuesta al 2026-06-08, se adopta Opción C automáticamente y se implementa API solo para Enterprise.

### MKT-2: Validar demanda de features Enterprise (para Phase 4)
- **Fecha límite:** 2026-09-21 (cierre de Phase 3)
- **Estado:** `[ ] Pendiente — responsable: Marketing`
- **Features a investigar:**
  1. SSO Tenant (SAML/OIDC) — ¿cuántos deals se perdieron? ¿qué IdPs usan los prospectos?
  2. Multi-location — ¿hay tenants con múltiples sucursales? ¿modelo de pricing por sucursal o flat?
  3. Infraestructura dedicada — ¿hay prospectos en verticales regulados (salud, farmacia)?
- **Output requerido:** Documento de validación de demanda que habilite especificación de Phase 4.

---

## 4. Phase 3 — Estado de Avance

### 4.1 Completados (adelantados a Abril 2026)

| Módulo | Fecha planificada | Completado | Evidencia |
|--------|------------------|------------|-----------|
| Bulk Actions Dashboard | 2026-05-04 | 2026-04-08 | `selectedIds` + `/api/members/bulk` + `tenant_plan_history` |
| Automatizaciones Programadas | 2026-05-11 | 2026-04-08 | 6 Edge Functions + `tier_upgrade_trigger.sql` |
| Advanced Analytics + Export | 2026-05-25 | 2026-04-08 | cohort + funnel + campaigns + export CSV (Scale+) |
| Referral Program | 2026-06-29 | 2026-04-08 | `api/member/referrals` + `profile/referrals/page.tsx` |
| Notificaciones in-app | Phase 3 | 2026-04-08 | `in_app_notifications` table + bell icon + historial |

### 4.2 Pendientes

| Módulo | Fecha inicio | Estado | Bloqueante |
|--------|-------------|--------|------------|
| Public REST API + API Keys | 2026-06-08 | 🔴 Bloqueado | MKT-1 |
| Webhook Outbound | 2026-07-13 | 🟡 Bloqueado | Depende de REST API |
| Custom Domains | 2026-07-27 | 🔴 Bloqueado | MKT-1 |
| Booking Integration (Square) | 2026-08-17 | ⏳ Pendiente | — |

---

## 5. Especificaciones de Módulos Pendientes Phase 3

### 5.1 Public REST API + API Keys

> ⚠️ Bloqueado hasta resolución de MKT-1. Si no hay decisión al 2026-06-08, se implementa como solo Enterprise (Opción C).

**Endpoints:**
```
POST   /v1/members                  — Crear miembro
GET    /v1/members/{id}             — Obtener miembro
POST   /v1/transactions             — Registrar puntos
GET    /v1/members/{id}/balance     — Balance actual
GET    /v1/rewards                  — Catálogo de recompensas
POST   /v1/redemptions              — Canjear recompensa
GET    /v1/webhooks                 — Configurar webhooks salientes
```

**Auth:** API Keys por tenant (Settings → Integrations)
**Rate limiting:** Por plan — Scale: 1.000 req/min, Enterprise: custom
**Formato:** JSON REST + OpenAPI 3.0 spec pública
**Logging:** Tabla `api_usage` activa desde día 1
**KPI:** 100K+ calls/mes a los 90 días del lanzamiento

**Entidades nuevas:**
```
api_keys         — key_hash, tenant_id, name, last_used_at, is_active
api_usage        — endpoint, tenant_id, status_code, latency_ms, created_at
```

---

### 5.2 Webhook Outbound

> ⚠️ Depende de Public REST API (§5.1).

**Eventos disponibles:**
- `member.created` — nuevo miembro unido al programa
- `points.earned` — transacción de puntos ganados
- `reward.redeemed` — canje de recompensa
- `tier.changed` — cambio de tier del miembro

**Features:**
- UI para configurar endpoints en Settings → Integrations
- Delivery con retries automáticos (exponential backoff, 3 intentos)
- Dashboard de delivery: estado, timestamp, payload, respuesta HTTP
- Firma HMAC para verificación de autenticidad (`X-LoyaltyOS-Signature`)

**Entidades nuevas:**
```
webhook_endpoints   — url, events[], signing_secret, is_active, tenant_id
webhook_deliveries  — endpoint_id, event_type, payload, status, attempts, last_attempt_at
```

---

### 5.3 Custom Domains

> ⚠️ Bloqueado hasta resolución de MKT-1.

**Flujo:**
1. Settings → Member App → Custom Domain
2. Tenant ingresa dominio (ej: `puntos.misalon.com`)
3. Sistema genera instrucciones DNS (CNAME record)
4. Dashboard muestra estado de verificación (pendiente/verificado/error)
5. Member App accesible en dominio propio con SSL automático

**Implementación:**
- Vercel Domains API para registro programático
- DNS verification via TXT record o CNAME check
- Middleware en Member App para detectar dominio y resolver tenant
- Fallback a `[tenant-slug].member.loyalbase.dev`

**Entidades nuevas:**
```
tenant_domains   — domain, verification_status, verified_at, dns_record, tenant_id
```

**KPI:** 30% de tenants elegibles con custom domain verificado en 90 días

---

### 5.4 Booking Integration (Enterprise)

**Plataformas objetivo (en orden de prioridad):**
1. **Square Appointments** — salones, spas, nail bars
2. **Vagaro** — salones, fitness studios
3. **Acuity Scheduling** — coaches, terapeutas
4. **Mindbody** — gyms, yoga studios, wellness centers

**Flujo:**
1. Tenant conecta cuenta desde Settings → Integrations (OAuth)
2. Webhook recibe `appointment.completed`
3. Sistema calcula puntos según reglas de mapeo
4. Transacción creada automáticamente + push notification al miembro

**Reglas de mapeo:**
- Por tipo de servicio → puntos fijos o porcentaje del monto
- Por staff (proveedor específico)
- Por cantidad de visitas en el mes (multiplicador progresivo)
- Exclusiones (servicios de cortesía, correcciones)

**Entidades nuevas:**
```
booking_integrations   — provider, credentials_encrypted, tenant_id, is_active
booking_events         — external_id, provider, payload, processed_at, transaction_id
service_point_rules    — service_type, points_fixed, points_pct, tenant_id
```

**KPI:** 20% de tenants Enterprise con booking activo en 60 días del lanzamiento

---

## 6. Deuda Técnica Pendiente

### 6.1 Bug: Tenant incorrecto en sub-páginas con múltiples membresías (Low)

**Problema:** `getMemberWithTenant(user.id)` sin `tenantId` puede devolver el tenant equivocado para usuarios con membresías en múltiples negocios. El cookie `loyalty_tenant_id` está seteado correctamente pero no se lee en todas las Server Components.

**Fix requerido:**
```ts
// Patrón incorrecto (actual en sub-páginas):
const member = await getMemberWithTenant(user.id);

// Patrón correcto:
const tenantId = cookies().get('loyalty_tenant_id')?.value;
const member = await getMemberWithTenant(user.id, tenantId);
```

**Afecta:** Solo usuarios con membresías en más de un negocio (edge case en MVP).
**Prioridad:** Low — priorizar antes de abrir el Member App a negocios con usuarios compartidos.

---

### 6.2 PWA Offline — Redención sin conexión (Medium-Low, Phase 3)

**Problema:** El QR de redención viene del servidor. Sin conexión, el miembro no tiene acceso al código aunque la app esté cacheada.

**Implementación:**
1. Al entrar a `/redemptions`, guardar canjes activos en `IndexedDB`
2. Generar QR en cliente con `qrcode` (ya instalado) desde dato cacheado
3. Banner "Sin conexión — datos guardados" visible para el staff
4. Background sync al recuperar conexión

**Limitación:** La verificación del staff desde el Dashboard también requiere conexión. El offline del miembro solo agrega valor si el staff verifica manualmente el código alfanumérico.

**Prioridad:** Medium-Low — después de completar los módulos bloqueados de Phase 3.

---

### 6.3 Sistema de Feedback Bidireccional (Medium, Phase 3)

**Canal Tenant → LoyaltyOS:**
- Settings del Dashboard → "Feedback & Soporte"
- Tipos: Bug / Feature request / Consulta / Otro
- Datos adjuntos automáticos: plan, tenant_id, URL, fecha
- Respuesta visible en Super Admin Dashboard + email al tenant

**Canal Member → LoyaltyOS:**
- Member App → Perfil → "Enviar feedback"
- Datos adjuntos: member_id, tenant_id activo, versión de app

**Modelo de datos:**
```
feedback_submissions   — type, category, message, submitter_id, origin_url, status
feedback_responses     — submission_id, message, sent_by, sent_at
```

**Prioridad:** Medium — implementar MVP (formulario → email interno) sin UI de respuesta en primer sprint.

---

### 6.4 Financial Pulse en Super Admin (Medium, Phase 3)

**Con datos actuales (sin cambios de modelo):**
- MRR total + variación mes a mes (%) — ya calculado en `RevenueCharts.tsx`
- Churn rate mensual desde `stripe_events` tipo `customer.subscription.deleted`
- Trial conversion rate desde `trial_ends_at` + cambio de `plan_status`
- Señales de alarma: tenants `past_due` / `trialing`

**Requiere tabla nueva:**
```
mrr_snapshots   — snapshot_date, mrr_total, active_tenants, new_tenants, churned_tenants
```
Permite calcular NRR (Net Revenue Retention) histórico.

**Explícitamente descartado:** Runway, EBITDA, Breakeven, CAC Payback — requieren fuentes de datos externas (saldo bancario, costos operativos) no disponibles en la DB.

---

### 6.5 Operacional: Supabase Spend Cap

**Acción requerida:** Activar en Supabase Dashboard → Organization → Billing → Spend Cap.

| Fase | Cap recomendado |
|------|----------------|
| Testing / early access privado | $0 — pausa servicios en vez de cobrar excedente |
| Tenants pagando activos | $10-20 buffer — evitar downtime legítimo |

**Prioridad:** Activar $0 cap ANTES de abrir registro público.

---

### 6.6 Refactor pendiente: SC/CC split en 4 páginas del Dashboard (Medium, Deuda Técnica)

**Contexto:** El Guardian Angel (pre-commit hook) bloquea el patrón `fetch-in-useEffect` para datos de carga inicial — viola la regla de arquitectura Next.js App Router. Las siguientes páginas tienen datos cargados en `useEffect` que deben migrar al Server Component padre:

| Página | Datos que migran al SC |
|--------|----------------------|
| `apps/dashboard/app/(dashboard)/members/page.tsx` | Lista de miembros del tenant |
| `apps/dashboard/app/(dashboard)/members/[id]/page.tsx` | Detalle del miembro + historial de transacciones |
| `apps/dashboard/app/(dashboard)/settings/page.tsx` | Settings del tenant (branding, invoices) |
| `apps/dashboard/app/(dashboard)/redemptions/page.tsx` | Historial de redenciones |

**Patrón a aplicar (igual que `invite/[token]`):**
1. Crear `*Client.tsx` con el estado interactivo y los `useState`/`useEffect` de UI
2. Reescribir `page.tsx` como `async` Server Component que fetchea datos y los pasa como props
3. El único `useEffect` permitido en el Client Component es el de estado de sesión/auth o suscripciones en tiempo real

**Bloqueo adicional en `settings/page.tsx`:** Los swatches de color del branding usan `style={{ backgroundColor: color }}` — valor dinámico en runtime que no puede expresarse con clases Tailwind estáticas. Documentar como excepción justificada en comentario inline al hacer el split.

**Prioridad:** Medium — commitear en un sprint dedicado antes de abrir el Dashboard a nuevos tenants. Las 4 páginas funcionan correctamente hoy; el bloqueo es solo del pre-commit hook.

---

### 6.7 Super Admin — Expansión de Platform Configuration (Medium, Phase 3)

**Contexto actual:**

La sección Platform Configuration del Super Admin (`/admin/settings`) expone 5 campos globales editables almacenados en `platform_config`:

| Campo | Valor default | Función |
|-------|--------------|---------|
| `trial_period_days` | 14 | Duración del trial al registrarse |
| `grace_period_days` | 7 | Días de gracia tras fallo de pago antes de suspender |
| `points_expiry_days` | 365 | Días hasta vencimiento de puntos (default global) |
| `reactivation_threshold_days` | 25 | Días de inactividad para disparar campaña de reactivación |
| `max_payment_retries` | 3 | Intentos máximos de cobro vía Stripe antes de suspender |

**Problema — Límites de plan hardcodeados:**

Los límites críticos de negocio (`maxMembers`, `maxCampaignsPerMonth`, feature flags) están definidos en código fuente en `apps/dashboard/lib/plans/features.ts` como constante `PLAN_CONFIGS`. Cualquier cambio requiere un deploy. Los valores actuales son:

| Plan | Max Miembros | Campañas/Mes | Gamificación | Analytics Export | API Access |
|------|-------------|-------------|-------------|-----------------|-----------|
| Starter ($199) | 500 | 2 | ❌ | ❌ | ❌ |
| Pro ($399) | 2,000 | 10 | ✅ | ❌ | ❌ |
| Scale ($599) | Ilimitado | Ilimitado | ✅ | ✅ | ❌ |
| Enterprise (custom) | Ilimitado | Ilimitado | ✅ avanzado | ✅ | ✅ |

**Gaps identificados en Platform Configuration:**

**1. Plan Limits configurables desde Super Admin**

Hoy, si se decide cambiar el límite de miembros de Starter de 500 a 750 (ajuste de pricing), se necesita un deploy. La recomendación es mover estos límites a una tabla `plan_limits` en la DB, editable desde el Super Admin, con cache en memoria para evitar queries en cada request.

Modelo de datos propuesto:
```
plan_limits (
  plan       TEXT PRIMARY KEY,   -- 'starter' | 'pro' | 'scale' | 'enterprise'
  max_members        INTEGER,    -- NULL = ilimitado
  max_campaigns_month INTEGER,   -- NULL = ilimitado
  max_rewards        INTEGER,    -- NULL = ilimitado (hoy sin límite ni en código)
  max_team_members   INTEGER,    -- NULL = ilimitado (hoy sin límite ni en código)
  updated_at         TIMESTAMPTZ
)
```

Ventajas: cambio de límites sin deploy, A/B testing de pricing, ajuste por tenant específico (override por tenant en `tenant_plan_overrides`).
Riesgo: añade una query (o cache miss) a cada validación de negocio. Mitigar con `unstable_cache` con `revalidateTag('plan-limits')`.

**2. Feature Flags por Plan — Super Admin togglable**

Actualmente los feature flags (`api_access`, `gamification`, `sso`, etc.) son arrays estáticos en `PLAN_CONFIGS`. No hay forma de habilitar un feature para un tenant específico sin tocar código.

Casos de uso reales:
- Tenant en trial extendido con acceso a features Pro sin actualizar el plan
- Beta testers de API Access en plan Starter
- Deshabilitar temporalmente un feature problemático en producción sin deploy

Modelo propuesto: tabla `tenant_feature_overrides (tenant_id, feature, enabled, expires_at)` manejada desde la vista de tenant en Super Admin.

**3. Toggles globales de plataforma**

| Toggle | Descripción | Caso de uso |
|--------|-------------|------------|
| `maintenance_mode` | Banner global + bloqueo de acciones destructivas | Migraciones, incidentes |
| `registration_open` | Habilitar/deshabilitar el registro público de nuevos tenants | Control de crecimiento, beta cerrada |
| `trial_enabled` | Si los nuevos tenants entran en trial o en plan activo | Campañas de adquisición sin trial |
| `new_tenant_default_plan` | Plan asignado por defecto al registro | Cambiar estrategia GTM sin deploy |

Estos se pueden agregar como columnas adicionales en `platform_config` (ya existe la tabla, solo agregar campos).

**4. Configuración de Email / Notificaciones**

Hoy los templates de email (18, bilingüe) tienen el `from` address y el nombre del remitente fijos en el código de cada función Resend. Si se quiere cambiar el nombre del remitente de "LoyaltyOS" a "Loyalbase" en todos los templates, se necesita buscar y reemplazar en múltiples archivos.

Propuesta: agregar a `platform_config` los campos `email_from_name`, `email_from_address`, `email_reply_to`, leídos en el módulo compartido de email de `packages/`.

**Decisión pendiente — ¿Qué implementar primero?**

| Item | Impacto | Esfuerzo | Prioridad |
|------|---------|---------|----------|
| Toggles globales (`maintenance_mode`, `registration_open`) | Alto operacional | Bajo — solo agregar columnas + UI | Alta |
| `email_from_name` / `email_from_address` en `platform_config` | Medio | Bajo | Alta |
| `tenant_feature_overrides` | Alto para ventas | Medio | Media |
| `plan_limits` en DB con cache | Alto para pricing | Alto (refactor + cache) | Media-Baja |

**Recomendación:** Implementar los toggles globales y la config de email en un sprint corto (bajo riesgo, alto valor operacional). Dejar `plan_limits` en DB para Phase 4 o cuando el equipo de ventas necesite flexibilidad real — el refactor del sistema de validaciones es no trivial y hoy los límites no cambian con frecuencia.

**Prioridad:** Medium — no bloquea revenue, pero sí operaciones y ventas a medida que escala.

---

## 7. Phase 4 — Candidatos (Sujetos a MKT-2)

> ⚠️ Ningún item de Phase 4 debe especificarse ni iniciarse hasta que MKT-2 entregue validación de demanda (fecha límite: 2026-09-21).

### 7.1 SSO Tenant (SAML / OIDC)

**Qué es:** Autenticación enterprise que permite al tenant usar su propio IdP (Okta, Azure AD, Google Workspace) para acceso al Dashboard sin credenciales separadas.

**Por qué importa:** Es el feature de Enterprise más demandado en SaaS B2B. Bloqueador de ventas upmarket — sin SSO, negocios con políticas de seguridad corporativa no pueden adoptar LoyaltyOS.

**Estado:** Sin spec, sin tabla, sin flujo. La referencia actual a "Cross-domain SSO" en el PRD es SSO interno de LoyaltyOS, no SSO de tenant.

**Opciones de implementación:**
- WorkOS (SaaS especializado en SSO empresarial — integración rápida)
- BoxyHQ (open-source, self-hosted)
- Supabase Auth + SAML (nativo pero limitado)

**Esfuerzo estimado:** Alto — 4-6 semanas. Requiere migración del sistema de sesiones + UI de configuración en Settings.

**Preguntas para MKT-2:**
- ¿Cuántos deals se perdieron por falta de SSO?
- ¿Qué IdPs usan los prospectos objetivo?

---

### 7.2 Multi-Location

**Qué es:** Un tenant con múltiples sucursales que comparte base de miembros, acumula puntos en cualquier sucursal, y ve reportes consolidados o por sucursal.

**Por qué importa:** El caso de un solo local limita el LTV. Franquicias y cadenas son el segmento con mayor ticket promedio.

**Estado:** La arquitectura actual es 1 tenant = 1 negocio físico. No hay tabla `locations`, no hay RLS por sucursal, no hay UI de gestión multi-local.

**Esfuerzo estimado:** Muy alto — 6-8 semanas. Requiere migración de schema, refactor de RLS, nuevo contexto de sesión.

**Modelos de pricing a evaluar:**
- Por sucursal adicional (+$X/mo por location)
- Flat — precio único para N sucursales ilimitadas

**Preguntas para MKT-2:**
- ¿Hay tenants actuales con múltiples sucursales haciendo workarounds?
- ¿Los prospectos Enterprise son franquicias o cadenas?

---

### 7.3 Infraestructura Dedicada / Secure Compute

**Qué es:** Aislamiento de infraestructura para tenants bajo regulaciones de compliance (SOC 2 Type II, HIPAA, PCI-DSS). Tenant en schema propio o proyecto Supabase separado, SLA contractual, audit log completo.

**Por qué importa:** Sin esto, LoyaltyOS no puede venderse a verticales regulados (salud, farmacia, clínicas). Es el techo de mercado del producto.

**Estado:** Toda la arquitectura es multi-tenant en un único proyecto Supabase con RLS. El `support_sla` en `features.ts` es solo operacional, no hay infraestructura diferenciada.

**Opciones de arquitectura:**
- Multi-project Supabase (un proyecto por tenant Enterprise)
- Schema isolation (schema separado por tenant en el mismo proyecto)
- Row-level tenant key con auditoría reforzada

**Esfuerzo estimado:** Muy alto + certificaciones externas (SOC 2 audit, etc.).

**Preguntas para MKT-2:**
- ¿Hay prospectos en verticales regulados que lo requieran?
- ¿Enterprise es "negocios grandes" o "negocios regulados"?

---

### 7.4 Candidatos Adicionales Phase 4

Los siguientes items son candidatos para Phase 4 sin bloqueo de marketing, pero sí requieren que Phase 3 esté completa:

| Feature | Justificación |
|---------|--------------|
| IA generativa — sugerencia de campañas | LLM integrado en el generador de campañas |
| Marketplace de templates | Templates pre-diseñados de campañas y rewards |
| Portugués como tercer idioma | Expansión a Brasil y Portugal |
| White-label del Dashboard | `dashboard.sudominio.com` para Enterprise |
| Programa de partners / afiliados | Comisiones para agencias que vendan LoyaltyOS |
| Multi-divisa | USD + moneda local del negocio |
| Mobile nativo (React Native) | Member App nativa en iOS/Android (actualmente PWA) |

---

## 8. Criterios de Éxito Phase 3

| Métrica | Objetivo | Estado |
|---------|----------|--------|
| Automatizaciones activas | 80% de tenants con al menos 1 | ⏳ Medir post-lanzamiento |
| Churn de tenants | <5% mensual | ⏳ Medir post-lanzamiento |
| Tier upgrade rate | 15% Starter→Pro en 6 meses | ⏳ Medir post-lanzamiento |
| API calls/mes | 100K+ a 90 días del lanzamiento | ⏳ Bloqueado por MKT-1 |
| Custom domain adoption | 30% de tenants elegibles en 90 días | ⏳ Bloqueado por MKT-1 |
| Booking Integration activa | 20% de tenants Enterprise en 60 días | ⏳ Pendiente implementación |

---

## 9. Decisiones de Arquitectura (v2 → v3)

| Decisión | PRD v2 | Estado Actual (v3) |
|----------|--------|-------------------|
| Deuda técnica | 8 items pendientes | ✅ Liquidada al 100% |
| Tests | Solo MetricCard y Sidebar | ✅ 58 tests de integración + componentes en CI |
| Edge Functions | No implementado | ✅ 9 funciones + pg_cron |
| Rate Limiting | Pendiente | ✅ @upstash/ratelimit en Member App middleware |
| Cache API routes | Sin cache | ✅ unstable_cache en 5 rutas Dashboard |
| Bulk Actions | Phase 3 | ✅ Completado |
| Advanced Analytics | Phase 3 | ✅ Completado (cohort, funnel, export CSV) |
| Referral Program | Phase 3 | ✅ Completado |
| i18n Member App | Parcial (solo /join) | ✅ Completa — todas las páginas y componentes |
| Español | Rioplatense (voseo) | ✅ Español neutro (tuteo) |
| RLS | Decorativo (session vars nulas) | ✅ Funcional via current_tenant_id() / current_member_id() |
| Login Member App | Solo join code | ✅ Login directo + picker de negocios |
| Notificaciones | Solo push | ✅ In-app + push + historial |
| Phase 3 completado | 0% | ✅ 5 de 9 módulos |
| Planes en Landing | 4 planes (Starter/Pro/Scale/Enterprise) | ✅ Solo Starter y Pro — decisión de marketing 2026-04-08 |
| TypeScript type safety | `any` implícito en Supabase queries y handlers | ✅ Zero `any` — interfaces explícitas + `.returns<>()` en todas las queries + return types en todas las funciones (Abril 2026) |
| Invite page | Client Component con fetch-in-useEffect | ✅ SC/CC split — Server Component fetchea invite, Client Component maneja auth y accept |

---

## 10. Decisiones de Marketing

### MKT-1 — Landing Web: Solo Starter y Pro (2026-04-08)

**Decisión:** La página de pricing (`/pricing`) y el componente `PricingPreview` solo muestran los planes **Starter ($199/mes)** y **Pro ($399/mes)**. Los planes Scale y Enterprise fueron removidos del landing.

**Razón:** Simplificar el mensaje de marketing y reducir la fricción de decisión en el funnel de adquisición. Demasiadas opciones en el landing confunden al prospect. Scale y Enterprise siguen existiendo en el sistema y pueden activarse por ventas directas o en el dashboard.

**Impacto:**
- `apps/web/components/landing/PricingPreview.tsx` — PLANS array reducido a 2 planes
- `apps/web/app/pricing/page.tsx` — JSON-LD schema y tabla comparativa reducidos a Starter/Pro
- Los planes Scale y Enterprise siguen activos en `features.ts` y en el backend

---

## 11. Fuera de Alcance

### Phase 3 — No implementar

- SSO Tenant (SAML/OIDC) → Phase 4, sujeto a MKT-2
- Multi-location → Phase 4, sujeto a MKT-2
- Infraestructura dedicada → Phase 4, sujeto a MKT-2
- Mobile nativo (React Native / Flutter) → Member App permanece como PWA
- IA generativa → Phase 4
- Multi-divisa → Phase 4
- Portugués → Phase 4
- White-label del Dashboard → Phase 4
- Programa de partners → Phase 4

---

## 12. Timeline Phase 3 — Actualizado

| Módulo | Semanas planificadas | Estado | Fecha real |
|--------|---------------------|--------|------------|
| Bulk Actions Dashboard | 1 | ✅ Completado | 2026-04-08 |
| Automatizaciones Programadas | 2 | ✅ Completado | 2026-04-08 |
| Advanced Analytics + Export | 2 | ✅ Completado | 2026-04-08 |
| Referral Program | 2 | ✅ Completado | 2026-04-08 |
| Public REST API + API Keys | 3 | 🔴 Bloqueado MKT-1 | — |
| Webhook Outbound | 2 | 🟡 Bloqueado | — |
| Custom Domains | 3 | 🔴 Bloqueado MKT-1 | — |
| Booking Integration | 5 | ⏳ Pendiente | 2026-08-17 |

**Módulos no bloqueados que pueden iniciarse hoy:**
- Feedback System (§6.3)
- Financial Pulse en Super Admin (§6.4)
- Fix bug multi-tenant (§6.1)
- Booking Integration (§5.4)

---

## 13. Trial Program — Gamificación y Heatmap (Plan Starter)

### Overview

Los tenants en plan Starter pueden solicitar una prueba gratuita de 45 días para dos features del plan Pro: Gamification y Heatmap Analytics. Esto les permite experimentar el valor real antes de comprometerse a un upgrade.

El entry point de la solicitud son los upsell cards ya actualizados en `/gamification` y `/analytics`, con un link `mailto:` a `hello@loyalbase.dev`.

### Scope

| Campo | Valor |
|-------|-------|
| Features incluidas | Gamification module, Heatmap analytics |
| Planes elegibles | Starter solamente |
| Duración del trial | 45 días desde la fecha de activación |
| Límite | Un trial por feature, por tenant (no renovable) |

### Modelo de datos propuesto

```sql
CREATE TABLE feature_trials (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  feature_name    TEXT NOT NULL CHECK (feature_name IN ('gamification', 'heatmap')),
  trial_start     TIMESTAMPTZ NOT NULL,
  trial_end       TIMESTAMPTZ NOT NULL GENERATED ALWAYS AS (trial_start + INTERVAL '45 days') STORED,
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'converted')),
  requested_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  activated_by    UUID REFERENCES auth.users(id),
  UNIQUE (tenant_id, feature_name)
);
```

### RLS

- Tenants pueden `SELECT` sus propias filas (`tenant_id = auth_tenant_id()`)
- Solo service role puede `INSERT` / `UPDATE` (activación manual por Super Admin o API interna)
- Super Admin lee vía service role — sin restricción

### Lógica de Dashboard

Cuando un tenant tiene un trial activo para una feature:
1. Renderizar la UI real de la feature en lugar del upsell card
2. Mostrar un banner dismissible: "Tu trial de 45 días de [Feature] — X días restantes"
3. Al expirar (`trial_end < now()` o `status = 'expired'`): volver automáticamente al upsell card

La verificación ocurre en el Server Component de cada página (`/gamification/page.tsx`, `/analytics/page.tsx`) antes de decidir qué renderizar.

### Flujo de solicitud — Estado actual (manual)

```
Tenant → clic en "Solicitar prueba gratuita de 45 días"
       → mailto: hello@loyalbase.dev
       → Super Admin activa el trial manualmente desde el panel
       → Tenant ve la feature al siguiente login
```

### Flujo de solicitud — Futuro (self-serve)

```
Tenant → formulario in-app → POST /api/trials/request
       → auto-activación con email de confirmación via Resend
       → Tenant ve la feature inmediatamente
```

### Criterios de aceptación

- [ ] Tenant Starter con trial activo ve la UI completa de Gamification
- [ ] Tenant Starter con trial activo ve la UI completa de Heatmap
- [ ] Al expirar el trial, el upsell card vuelve automáticamente
- [ ] Super Admin puede activar / ver / expirar trials desde el panel
- [ ] El tenant ve el banner de días restantes durante el trial activo
- [ ] El link "Solicitar prueba gratuita de 45 días" aparece en los upsell cards de Gamification y Heatmap

> ⚠️ La tabla `feature_trials` y la lógica de activación **no están implementadas aún**. Esta sección es la especificación para la implementación futura.

---

## Nota de auditoría — Features incompletos por plan _(no relevante para el roadmap actual)_

> Esta nota es puramente informativa. No representa trabajo pendiente prioritario ni afecta el alcance del PRD v3. Se registra para trazabilidad.

Durante una auditoría del código (2026-04-08) se identificaron las siguientes inconsistencias menores entre lo que cada plan muestra en la UI de Plan & Billing y lo que realmente está implementado:

### Starter ($199/mo)

El plan es coherente con lo que expone en la UI. No hay features prometidos sin implementar.

- `Gamification` y `Heatmap` no están disponibles en Starter — existe un sistema de trial de 45 días por solicitud manual, documentado en la sección anterior.

### Pro ($399/mo)

| Item | Estado |
|------|--------|
| **Analytics Export** | Definido en `features.ts` pero gateado a Scale+. El botón existe en la UI pero está oculto via `FeatureGate`. Pro no lo tiene aunque podría argumentarse que debería. |
| **Advanced Campaigns** | Feature name (`advanced_campaigns`) definido en el schema pero sin UI ni enforcement real. Existe en código sin funcionalidad asociada. |
| **Gamification avanzado** | Mission Builder, Leaderboard, Churn Risk Monitor, Motivation Breakdown, Engine Activity Feed, Point Multipliers — todos gateados a Scale. Coherente con el diseño actual. |

### Acción requerida

Ninguna en el contexto de este PRD. Si en el futuro se decide mover Analytics Export a Pro o implementar Advanced Campaigns, actualizar `apps/dashboard/lib/plans/features.ts` y esta nota.

---

## §7 — Auditoría de seguridad (2026-04-09)

Se realizó una auditoría de seguridad del codebase completo. A continuación el resumen de hallazgos, prioridad y estado de resolución.

### Hallazgos y estado

| # | Hallazgo | Severidad | Estado |
|---|----------|-----------|--------|
| 1 | **Middleware usaba `getSession()` en lugar de `getUser()`** — `getSession()` lee cookies localmente sin validación server-side; un token manipulado podría eludir la protección de rutas. | 🔴 Alta | ✅ Resuelto |
| 2 | **`createServiceRoleClient` usaba `require()` en ESM** — CommonJS `require()` dentro de un módulo ESM es frágil y puede fallar en ciertos bundlers/entornos. | 🟡 Media | ✅ Resuelto |
| 3 | **Service role key expuesta en cliente** | 🔴 Alta | ✅ No aplica — verificado que sólo se instancia en contextos server-side |
| 4 | **Cookies `loyalty_tenant_id` sin flag `Secure`** — enviadas en texto plano sobre HTTP; en producción deben estar restringidas a HTTPS. | 🟡 Media | ✅ Resuelto |
| 5 | **`(supabase.auth as any).getSession()` con cast `as any`** — evitaba validación de tipos; oculta errores y es señal de deuda técnica. Afectaba varios handlers y server components. | 🟡 Media | ✅ Resuelto |
| 6 | **RLS con `auth_tenant_id()` siempre NULL** | 🔴 Alta | ✅ Resuelto en sesión anterior (migration + service role bypass) |
| 7 | **`sortBy` inyectado directamente a `.order()` sin whitelist** — parámetro de query untrusted pasado como nombre de columna; riesgo de column injection. | 🟡 Media | ✅ Resuelto |
| 8 | **Falta de rate limiting en endpoints críticos** (`/api/members`, `/api/campaigns`) | 🟠 Baja-Media | ⏳ Pendiente — mitigado parcialmente por Supabase RLS |
| 9 | **Headers de seguridad HTTP ausentes** (CSP, X-Frame-Options, etc.) | 🟠 Baja | ⏳ Pendiente — candidato para `next.config.js` headers |
| 10 | **Validación de email sólo en cliente** en flujo de registro del member app | 🟠 Baja | ✅ Resuelto — `isValidEmail()` en POST /api/members |
| 11 | **`unstable_cache` sin aislamiento por tenant** | 🟡 Media | ✅ Verificado — `tenantId` es parte de la cache key; no hay cross-tenant leakage |

### Helpers de seguridad introducidos

- `getAuthedUser()` — `packages/lib/src/supabase-server.ts` — wrapper sobre `supabase.auth.getUser()` validado server-side. Usar en todos los route handlers en lugar de `getSession()`.
- `sanitizeSortBy(value, allowed, fallback)` — `apps/dashboard/lib/validate.ts` — whitelist de columnas permitidas para prevenir column injection.
- `isValidEmail(value)` — `apps/dashboard/lib/validate.ts` — validación básica de formato de email en servidor.
- `ALLOWED_MEMBER_SORT_COLUMNS` — conjunto de columnas válidas para ordenamiento de miembros.

### Pendientes priorizados

1. **Rate limiting** — implementar con Upstash Rate Limit o middleware de Vercel cuando se escale.
2. **Security headers** — ✅ Resuelto (2026-04-13) — 9 headers en las tres apps + CSP Report-Only activo en producción.

---

## §8 — Auditoría SQL Injection (2026-04-13)

Auditoría completa de riesgo de inyección SQL en todo el monorepo: queries Supabase, funciones PostgreSQL, API routes, exposición de service role key y cobertura RLS.

### Hallazgos y estado

| # | Hallazgo | Severidad | Archivo | Estado |
|---|----------|-----------|---------|--------|
| 1 | **`.or()` con `search` sin sanitizar** — `search` de searchParams interpolado directamente en filtro PostgREST; inyección de condiciones adicionales posible. | 🔴 Alta | `api/rewards/route.ts:53`, `api/members/route.ts:29` | ✅ Resuelto |
| 2 | **`.or()` con `code` sin whitelist** — código de redención del body/searchParams sin validación de formato. | 🟡 Media | `api/redemptions/route.ts:36`, `api/redemptions/verify/route.ts:27` | ✅ Resuelto |
| 3 | **Path param `id` sin validación UUID** — `id` de segmento pasado directo a `evaluateCustomSegment()` sin verificar formato. | 🟡 Media | `api/campaigns/segments/[id]/preview/route.ts:30` | ✅ Resuelto |
| 4 | **Funciones PostgreSQL SECURITY DEFINER** | — | `supabase/migrations/` | ✅ OK — todas usan parámetros `$N`, ninguna usa `EXECUTE` ni concatenación |
| 5 | **Service role key client-side** | 🔴 Alta | — | ✅ OK — `createServiceRoleClient()` solo instanciado en route handlers y server actions |
| 6 | **Cobertura RLS** | — | — | ✅ OK — 100% de tablas con `ENABLE ROW LEVEL SECURITY` y al menos una policy |

### Helpers de seguridad introducidos

- `sanitizeSearch(value)` — `apps/dashboard/lib/validate.ts` — stripea `,`, `(`, `)` del input antes de usarlo en `.or()`.
- `isValidRedemptionCode(value)` — `apps/dashboard/lib/validate.ts` — whitelist: UUID (QR) o alfanumérico 4-32 chars.
- `isValidUUID(value)` — `apps/dashboard/lib/validate.ts` — regex UUID v4 estricto para path params.

### Estado global de validación en API routes (post-auditoría)

| Input | Validación | Helper |
|-------|-----------|--------|
| `sortBy` | Whitelist de columnas permitidas | `sanitizeSortBy()` |
| `search` | Strip de caracteres PostgREST | `sanitizeSearch()` |
| `email` | Regex de formato | `isValidEmail()` |
| `code` (redención) | Whitelist UUID / alfanumérico | `isValidRedemptionCode()` |
| `id` (UUID path param) | Regex UUID v4 | `isValidUUID()` |

### Pendientes

1. **Rate limiting** — sin cambios; sigue pendiente para cuando se escale.

---

## §9 — Auditoría XSS (2026-04-13)

Auditoría completa de vulnerabilidades Cross-Site Scripting en las tres apps: `dangerouslySetInnerHTML`, URLs dinámicas, parámetros de URL reflejados, XSS stored via contenido de tenants, dependencias vulnerables y CSP.

### Hallazgos y estado

| # | Hallazgo | Severidad | Archivo | Estado |
|---|----------|-----------|---------|--------|
| 1 | **Open Redirect post-auth** — `searchParams.get('next')` usado directamente en `window.location.href` sin validar origen. Permite redirigir a dominios externos arbitrarios. | 🔴 Alta | `apps/web/app/(auth)/callback/page.tsx:19` | ✅ Resuelto |
| 2 | **`javascript:` URI via `google_review_url`** — `window.open(googleReviewUrl)` sin validar esquema. Un tenant podía guardar `javascript:...` en DB y ejecutar código en la member app. | 🔴 Alta | `apps/member/components/member/GoogleReviewCard.tsx:16` | ✅ Resuelto |
| 3 | **`<img src>` nativo con `reward.image_url` de DB** — omite `remotePatterns` y no aplica optimización/validación de Next.js Image. | 🟡 Media | `apps/member/app/rewards/page.tsx:121` | ✅ Resuelto |
| 4 | **`cta_url` de campaña sin validación de esquema** — texto libre del tenant guardado en DB y enviado a members sin verificar protocolo. | 🟡 Media | `apps/dashboard/lib/campaigns/actions.ts:90` | ✅ Resuelto |
| 5 | **`dangerouslySetInnerHTML` con datos estáticos** — JSON-LD Schema.org hardcoded con `JSON.stringify`. | — | `apps/web/app/layout.tsx`, `page.tsx`, `pricing/page.tsx` | 🟢 OK |
| 6 | **eval() / new Function()** — ningún uso en las tres apps. | — | — | 🟢 OK |
| 7 | **CSP en modo Report-Only** — política configurada pero no enforced; no bloquea XSS. Pendiente de activar enforcement. | 🟡 Media | Los tres `next.config.js` | ⏳ Pendiente |
| 8 | **`next@14.2.35` — 4 CVEs en producción** (DoS RSC, DoS Server Components, HTTP smuggling, Image Optimizer DoS). Fix: `>=15.5.15`. | 🔴 Alta | Las tres apps | ⏳ Pendiente — migración mayor |
| 9 | **`serialize-javascript@4.0.0` RCE** — solo en devDependencies vía next-pwa → workbox. No afecta producción. | 🔴 Alta (dev only) | `apps/member` devDep | ⏳ Pendiente — baja prioridad |

### Fixes aplicados

- `isSafeRedirect(url)` — `apps/web/app/(auth)/callback/page.tsx` — allowlist de orígenes permitidos (`dashboard.loyalbase.dev`, `loyalbase.dev`) para el parámetro `next` post-autenticación.
- `isSafeUrl(url)` — `apps/member/components/member/GoogleReviewCard.tsx` — valida `https:` o `http:` antes de `window.open()`.
- `<Image>` de `next/image` — `apps/member/app/rewards/page.tsx` — reemplaza `<img>` nativo; aplica `remotePatterns`.
- `remotePatterns` — `apps/member/next.config.js` — agrega hostnames de Supabase (`*.supabase.co`, `*.supabase.in`).
- Validación de esquema URL en `validateCampaignInput()` — `apps/dashboard/lib/campaigns/actions.ts` — rechaza `cta_url` con protocolo distinto de `http`/`https`.

### Pendientes priorizados

1. **CSP enforcement** — cambiar `Content-Security-Policy-Report-Only` → `Content-Security-Policy` en las tres apps. Requiere testing de Next.js runtime scripts, Google Analytics (web) y OneSignal (member). Planificar sesión dedicada.
2. **Actualizar Next.js 15** — migración mayor; planificar sprint dedicado. Fix mínimo: `>=15.5.15`.

---

## §10 — Auditoría de Rate Limiting (2026-04-13)

Auditoría completa de protección contra abuso en los 75+ endpoints del monorepo: brute force, email flooding, farming de puntos, enumeración de tokens, exfiltración masiva de datos y abuso de API key.

### Estado previo a la auditoría

Solo `apps/member` tenía rate limiting activo (Upstash Sliding Window 10 req/60s en paths de auth). `apps/dashboard` y `apps/web` no tenían dependencias ni lógica de rate limiting. Un solo vector 🔴 ya operativo: el endpoint `demo-requests` de web con rate limit manual via Supabase (3/email/24h, bypasseable por IP).

### Hallazgos

| # | Hallazgo | Severidad | Ubicación | Estado |
|---|----------|-----------|-----------|--------|
| 1 | **OTP brute force** — `verify-otp` no tiene lockout; OTP 6 dígitos → 1.000.000 combinaciones, rompible en minutos | 🔴 Crítico | `dashboard/api/auth/verify-otp` | ✅ Resuelto |
| 2 | **Email flooding / OTP bombing** — `send-otp` y `forgot-password` (dashboard) sin rate limit; flood a Resend ($) | 🔴 Crítico | `dashboard/api/auth/send-otp`, `dashboard/api/auth/forgot-password` | ✅ Resuelto |
| 3 | **Registro masivo de tenants** — `web/api/register` sin rate limit; genera sesiones Stripe y registros en DB ilimitadamente | 🔴 Crítico | `web/api/register` | ✅ Resuelto |
| 4 | **Points injection spam** — `adjustment` sin rate limit; staff puede ajustar puntos en loop | 🔴 Crítico | `dashboard/api/members/[id]/adjustment` | ✅ Resuelto |
| 5 | **Visit farming** — `visit` sin rate limit; registrar visitas ilimitadas acumula puntos fraudulentamente | 🔴 Crítico | `dashboard/api/members/[id]/visit` | ✅ Resuelto |
| 6 | **Redeem spam / race condition** — `redeem` sin rate limit; intentar redimir en loop puede explotar timing | 🔴 Crítico | `member/api/rewards/[id]/redeem` | ✅ Resuelto |
| 7 | **Google Review farming multi-cuenta** — DB flag por member pero sin rate limit a nivel IP/user | 🔴 Crítico | `member/api/member/google-review-claim` | ✅ Resuelto |
| 8 | **API key abuse (POS)** — `public/members` con CORS `*` sin rate limit; API key expuesta crea members masivamente | 🔴 Crítico | `dashboard/api/public/members` | ✅ Resuelto |
| 9 | **Data exfiltration — analytics export** — sin rate limit; token robado descarga toda la DB repetidamente | 🔴 Crítico | `dashboard/api/analytics/export` | ✅ Resuelto |
| 10 | **CSV import flood** — sin límite de frecuencia ni tamaño; CSVs gigantes en loop | 🔴 Crítico | `dashboard/api/members/import` | ✅ Resuelto |
| 11 | **Email/push blast masivo** — 500 members/req en loop sin rate limit → costo Resend/OneSignal | 🔴 Crítico | `dashboard/api/members/bulk` | ✅ Resuelto |
| 12 | **Full tenant data dump** — export completo (members + transactions + redemptions + rewards + campaigns) sin rate limit | 🔴 Crítico | `dashboard/api/tenant/export` | ✅ Resuelto |
| 13 | **Invitation token enumeration** — endpoints públicos sin auth ni rate limit; enumerar tokens válidos | 🟡 Media | `web/api/invite/[token]`, `member/api/invitations/[token]` | ✅ Resuelto |

### Fixes aplicados

**Dependencias instaladas en dashboard y web:**
- `@upstash/ratelimit` ^2.0.8 + `@upstash/redis` ^1.37.0 (member ya las tenía)
- Mismo Redis de Upstash compartido entre las tres apps (zero costo adicional en Free tier)

**Nuevos archivos:**
- `apps/dashboard/lib/ratelimit.ts` — 8 funciones de limiter con `makeRedis()` como helper interno
- `apps/web/lib/ratelimit.ts` — 2 funciones de limiter

**Rate limiters implementados:**

| Endpoint | Límite | Identificador | Algoritmo |
|----------|--------|---------------|-----------|
| `dashboard` send-otp + verify-otp | 5 / 15 min | IP | Fixed Window |
| `dashboard` forgot-password | 3 / hora | IP | Sliding Window |
| `dashboard` members/adjustment | 30 / min | member ID | Sliding Window |
| `dashboard` members/visit | 60 / min | member ID | Sliding Window |
| `dashboard` members/bulk | 5 / hora | tenant ID | Fixed Window |
| `dashboard` members/import | 10 / hora | tenant ID | Fixed Window |
| `dashboard` analytics/export | 20 / hora | tenant ID | Fixed Window |
| `dashboard` tenant/export | 5 / hora | tenant ID | Fixed Window |
| `dashboard` public/members (API key) | 100 / min | API key | Sliding Window |
| `web` register | 3 / hora | IP | Fixed Window |
| `web` invite/[token] | 30 / min | IP | Sliding Window |
| `member` rewards/redeem | 10 / min | member ID | Sliding Window |
| `member` google-review-claim | 5 / min | user ID | Sliding Window |
| `member` invitations/[token] | 30 / min | IP | Sliding Window |

Todos los limiters fallan silenciosamente (`return null`) si las env vars `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` no están configuradas — desarrollo local sin Redis no se ve afectado.

Todos los 429 responses incluyen headers estándar: `Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`.

### Pendientes priorizados

1. **Rate limit global en middleware de dashboard** — un límite general por IP (ej: 200 req/min) como capa adicional para proteger endpoints no cubiertos individualmente. Bajo riesgo residual dado que todos los endpoints críticos ya tienen rate limit propio.
2. **Supabase Auth rate limits nativos** — revisar configuración de GoTrue en Supabase dashboard para magic links y password reset (límites por defecto pueden ser permisivos).

---

## §11 — Auditoría de Autenticación, Autorización y Session Management (2026-04-13)

Auditoría completa de auth flows, session management, middleware de rutas, RLS, escalación de privilegios, IDOR y exposición de secrets en las tres apps del monorepo.

### Flujos de autenticación — hallazgos

| # | Flujo | App | Vulnerabilidad | Riesgo | Estado |
|---|-------|-----|----------------|--------|--------|
| 1 | Registro de tenant | web | `userId` en el body aceptado sin verificación — cualquier usuario podía registrar un tenant con el `userId` de otra persona | 🔴 | ✅ Resuelto |
| 2 | Super admin auth en APIs | dashboard | `NEXT_PUBLIC_SUPER_ADMIN_EMAIL` embebido en el bundle JS del cliente — email del super admin visible a cualquiera que inspeccione el código | 🔴 | ✅ Resuelto |
| 3 | `invite/accept` | web | Usa `getSession()` en lugar de `getUser()` en server context — lee cookies sin validación server-side | 🟡 | ⏳ Pendiente |
| 4 | Cross-domain login | web | Magic link generado con service role sin tiempo de vida reducido — token interceptable | 🟡 | ⏳ Pendiente |
| 5 | `device_id` en OTP | dashboard | Viene 100% del cliente sin validación — un atacante autenticado puede auto-registrar cualquier `device_id` | 🟡 | ⏳ Pendiente |
| 6 | Auth callback member | member | `fetch(...create-member...).catch(()=>{})` — fallo silencioso; usuario queda con sesión pero sin perfil | 🟡 | ⏳ Pendiente |

### Session management — hallazgos

| # | Aspecto | Problema | Riesgo | Estado |
|---|---------|----------|--------|--------|
| 1 | Cookie `loyalty_tenant_id` | `httpOnly: false` — escrita desde JS cliente, accesible via XSS, controla qué datos ve el usuario | 🔴 | ⏳ Pendiente |
| 2 | Web middleware | `getSession()` en lugar de `getUser()` — lee cookies sin validar con servidor | 🟡 | ⏳ Pendiente |
| 3 | `getUser()` en dashboard/member middleware | Correcto — valida contra GoTrue server-side | 🟢 | — |
| 4 | Logout forzoso por cambio de rol | JWT sigue válido hasta expirar si se remueve un `tenant_user` del equipo | 🟡 | ⏳ Pendiente |
| 5 | CSP Report-Only | No bloqueante — sin efecto protector real en dashboard y web | 🟡 | ⏳ Pendiente (sesión dedicada) |

### Escalación de privilegios e IDOR — hallazgos

| # | Vector | Endpoint | Explotable antes del fix | Riesgo | Estado |
|---|--------|----------|--------------------------|--------|--------|
| 1 | IDOR rewards PATCH/DELETE | `dashboard/api/rewards/[id]` | Sí — `serviceClient` sin `tenant_id` filter | 🔴 | ✅ Resuelto |
| 2 | IDOR members PATCH | `dashboard/api/members/[id]` | Sí — `serviceClient` sin `tenant_id` filter | 🔴 | ✅ Resuelto |
| 3 | IDOR members/invite | `dashboard/api/members/[id]/invite` | Sí — sin verificar `member.tenant_id === callerTenantId` | 🔴 | ✅ Resuelto |
| 4 | userId injection en register | `web/api/register` | Sí — registrar tenant con userId ajeno | 🔴 | ✅ Resuelto |
| 5 | Cookie tampering `loyalty_tenant_id` | APIs de member | Solo si el usuario es miembro del otro tenant también | 🟡 | ⏳ Pendiente |

### RLS — hallazgos

| # | Tabla/Función | Problema | Riesgo | Estado |
|---|--------------|----------|--------|--------|
| 1 | `tenant_users`, `invitations`, `super_admins` | Policies permisivas `WITH CHECK (true)` / `USING (true)` — ya eliminadas en migraciones previas | 🟢 | ✅ Fixed en sesiones previas |
| 2 | `members_update_self` | Sin restricción de campos — miembro podría intentar UPDATE a `tier` / `points_balance` via REST | 🟡 | ⏳ Pendiente |
| 3 | `current_tenant_id()` / `current_member_id()` | `LIMIT 1` sin `ORDER BY` — no-determinístico si un user tiene múltiples memberships | 🟡 | ⏳ Pendiente |

### Keys y secrets — hallazgos

| # | Key | Exposición | Riesgo | Estado |
|---|-----|------------|--------|--------|
| 1 | `NEXT_PUBLIC_SUPER_ADMIN_EMAIL` | Bundle JS del cliente | 🔴 | ✅ Renombrada a `SUPER_ADMIN_EMAIL` en código y Vercel |
| 2 | `SUPABASE_SERVICE_ROLE_KEY` | Solo server-side | 🟢 | — |
| 3 | `SUPABASE_JWT_SECRET` | Solo server-side | 🟢 | — |
| 4 | `RESEND_API_KEY`, `STRIPE_SECRET_KEY` | Solo server-side | 🟢 | — |
| 5 | Cron secrets hardcodeados en SQL | Ya eliminados en migración `20260405000002` | 🟢 | ✅ Fixed en sesiones previas |

### Fixes aplicados (commit `db3fd45`)

1. **IDOR rewards** — `apps/dashboard/app/api/rewards/[id]/route.ts`: PATCH y DELETE ahora resuelven `tenantId` del caller (owner → staff fallback) y filtran con `.eq('tenant_id', tenantId)`.
2. **IDOR members** — `apps/dashboard/app/api/members/[id]/route.ts`: PATCH agrega resolución de `tenantId` y filtro en el update con `serviceClient`.
3. **IDOR invite** — `apps/dashboard/app/api/members/[id]/invite/route.ts`: resuelve `callerTenantId` y filtra el fetch del member para impedir invitar miembros de otros tenants.
4. **userId injection** — `apps/web/app/api/register/route.ts`: `userId` y `email` se derivan exclusivamente del JWT verificado (`getUser()`), ignorados del body.
5. **Email expuesto** — `apps/dashboard/app/api/admin/stats/route.ts`, `tenants/route.ts`, `tenants/[id]/trials/route.ts`: `NEXT_PUBLIC_SUPER_ADMIN_EMAIL` → `SUPER_ADMIN_EMAIL`. Variable renombrada también en Vercel.

### Positivos notables

- `getUser()` correcto (no `getSession()`) en todos los middleware de dashboard y member
- RLS extensivamente corregido en múltiples migraciones sucesivas
- Sistema de impersonación con audit log, JWT de 15 min y hash en DB
- `verifyAdminAccess()` en AdminLayout protege correctamente la UI de super admin
- Todos los secrets sensibles exclusivamente server-side

### Pendientes priorizados

1. **Cookie `loyalty_tenant_id` sin `HttpOnly`** — cambiar a `httpOnly: true, sameSite: 'strict'` en `set-tenant/route.ts` y eliminar escritura via `document.cookie` en `join/page.tsx` y `login/page.tsx`.
2. **`getSession()` → `getUser()`** — web middleware (`apps/web/middleware.ts`) e `invite/accept` (`apps/web/app/api/invite/accept/route.ts`).
3. **`members_update_self` — restricción de campos** — limitar vía policy de columna o check en la API route para impedir que un miembro actualice `tier` o `points_balance`.
4. **`current_tenant_id()` / `current_member_id()` con ORDER BY** — agregar `ORDER BY created_at ASC` al `LIMIT 1` en las funciones RLS para comportamiento determinístico.

---

## §12 — Auditoría de Secrets y API Keys (Abril 2026)

Auditoría exhaustiva de secrets hardcodeados, variables de entorno, NEXT_PUBLIC_, historial de git, acceso a SERVICE_ROLE_KEY, logging de datos sensibles y validación de webhooks en las tres apps del monorepo.

### Resultado global

| Categoría | Resultado |
|-----------|-----------|
| Secrets hardcodeados en TS/JS | ✅ NINGUNO |
| `.env` con valores reales en git | ✅ NINGUNO |
| `NEXT_PUBLIC_` con secrets server-side | ✅ NINGUNO (fix previo en §11) |
| `SERVICE_ROLE_KEY` en cliente | ✅ NO |
| Secrets en git history | ✅ NINGUNO real (solo placeholders en `.env.example`) |
| Stripe webhook sin firma | ✅ `constructEvent()` correctamente implementado |
| Cron functions sin autenticación | ✅ Bearer token via `CRON_SECRET` en todas |

### Hallazgos y fixes aplicados

| # | Hallazgo | Archivo(s) | Riesgo | Estado |
|---|----------|------------|--------|--------|
| 1 | `error.message` de Supabase retornado raw en HTTP 500 — puede filtrar nombres de tablas/columnas/constraints | `apps/dashboard/app/api/admin/tenants/[id]/trials/route.ts:44`, `apps/member/app/api/consent/route.ts:50,117` | 🟡 | ✅ Fixed commit `7d57464` |
| 2 | `NEXT_PUBLIC_SUPER_ADMIN_EMAIL` en Vercel — email del admin potencialmente embebido en bundles JS de deploys anteriores al commit `db3fd45` | Vercel env vars | 🔴 | ✅ Variable eliminada de Vercel por usuario |
| 3 | `.env.example` trackeado en git expone estructura completa de variables sensibles | `.env.example` | 🟡 | ✅ Solo placeholders — aceptado como riesgo documentado |

### Pendientes

1. **CSP Report-Only → Enforcement** — las tres apps tienen `Content-Security-Policy-Report-Only`, no bloquea XSS activamente. Requiere sesión dedicada de testing.

---

## §13 — Upgrade Next.js 15 + Migración @serwist/next (Abril 2026)

### Objetivo

Actualizar el monorepo de Next.js 14 → 15.5.15 en las tres apps y reemplazar `next-pwa` (abandonado) por `@serwist/next` v9 en `apps/member`.

### Cambios aplicados

#### Next.js 15 — las tres apps

| Cambio | Detalle |
|--------|---------|
| Versión | `next` y `eslint-config-next` → `15.5.15` en `apps/web`, `apps/dashboard`, `apps/member` |
| Codemod | `@next/codemod@15 next-async-request-api` — convierte `cookies()`, `headers()`, `params`, `searchParams` a APIs async en 12 archivos del dashboard |
| React | Sin cambios — permanece en `^18.3.0` |

**Archivos afectados por el codemod** (dashboard): `app/api/admin/tenants/[id]/route.ts`, `app/api/admin/tenants/[id]/trials/route.ts`, `app/admin/tenants/[tenantId]/page.tsx`, y otros 9 archivos de rutas.

#### Migración next-pwa → @serwist/next (member)

`next-pwa` estaba abandonado e incompatible con Next.js 15. Reemplazado por `@serwist/next` v9.

| Archivo | Cambio |
|---------|--------|
| `apps/member/package.json` | `next-pwa ^5.6.0` → `@serwist/next ^9.0.0` + `serwist ^9.0.0` (dep directa para imports en `sw.ts`) |
| `apps/member/next.config.js` | `withPWA(options)(config)` → `withSerwist(options)(config)`; config de `runtimeCaching` eliminada |
| `apps/member/app/sw.ts` | Nuevo — service worker con 4 estrategias de caché: Google Fonts (CacheFirst/1 año), imágenes estáticas (StaleWhileRevalidate/30 días), `/_next/static/` (CacheFirst/30 días), APIs excepto `/api/auth` (NetworkFirst/5 min) |

**Diferencia arquitectural clave**: en `next-pwa` la configuración de runtime caching vivía en `next.config.js`. En `@serwist/next` v9, toda la lógica de caché se mueve al archivo `sw.ts` como código TypeScript.

### Errores de build resueltos

Estos errores solo aparecen en `next build` (no en `tsc --noEmit`) porque el compiler de Next.js aplica reglas de ESLint y tipos de routing más estrictos:

| App | Archivo | Error | Fix |
|-----|---------|-------|-----|
| web | `app/(auth)/layout.tsx:20` | `<a href="/">` viola ESLint `@next/next/no-html-link-for-pages` | Reemplazado por `<Link>` de `next/link` |
| dashboard | `app/admin/layout.tsx:9` | `{ children = null }` infiere tipo `null \| undefined`, incompatible con `LayoutProps<"/admin">` de Next.js 15 | Tipado explícito `{ children: React.ReactNode }` |

### Commits

| Hash | Descripción |
|------|-------------|
| `b1a6e21` | `chore: upgrade Next.js to 15.5.15 across all apps` |
| `05f6ad4` | `feat(member): migrate from next-pwa to @serwist/next` |
| `90bbdcf` | `fix(dashboard): add explicit props type to TenantDetailPage` |
| `d2c823a` | `fix(web,dashboard): fix build-time errors after Next.js 15 upgrade` |

