# LoyaltyOS — Product Requirements Document v2.0

**Fecha:** Abril 2026
**Estado:** Producción — MVP Completo
**Versión anterior:** PRD v1.0 (inicio del proyecto, Supabase + Next.js + Stripe)

---

## 1. Resumen Ejecutivo

LoyaltyOS es una plataforma SaaS multi-tenant white-label que permite a negocios B2B (spas, gimnasios, restaurantes, retail, hoteles, salones) lanzar programas de fidelización propios con PWA mobile para sus clientes, panel de gestión completo, campañas automatizadas y un motor de gamificación enterprise.

Desde el PRD v1.0, el producto pasó de concepto a plataforma funcional en producción con tres aplicaciones deployadas, 44 API routes, 25+ tablas en base de datos con RLS multi-tenant, sistema de pagos, comunicaciones bilingües, y un motor de gamificación completo.

---

## 2. Estado Actual — Lo Que Está Construido

### 2.1 Arquitectura de Producción

| App | URL | Función |
|-----|-----|---------|
| **Web** | `loyalbase.dev` | Landing + registro de tenants + checkout Stripe |
| **Dashboard** | `dashboard.loyalbase.dev` | Panel de gestión para tenants + Super Admin |
| **Member** | `member.loyalbase.dev` | PWA mobile para miembros del programa |

**Stack tecnológico:**
- **Frontend:** Next.js 14.2 + TypeScript + Tailwind CSS + shadcn/ui
- **Base de datos:** Supabase PostgreSQL con RLS multi-tenant (21 migraciones aplicadas)
- **Auth:** Supabase Auth — email/password + OTP de dispositivo + tokens de invitación
- **Pagos:** Stripe Billing (Starter $79 / Pro $199 / Scale $399 por mes)
- **Email:** Resend — 18 templates bilingüe (EN/ES)
- **Push:** OneSignal — integrado en Member app
- **Monorepo:** Turborepo + pnpm workspaces (5 packages compartidos)
- **Hosting:** Vercel (3 proyectos independientes)
- **i18n:** next-intl — inglés y español en las 3 apps

---

### 2.2 Web App (`loyalbase.dev`)

**Páginas públicas:**
- Landing page con hero, features, pricing y CTA
- Página de pricing con planes Starter / Pro / Scale
- About, Contact, Terms, Privacy

**Flujo de registro de tenant:**
1. Usuario completa formulario de registro
2. Redirigido a checkout de Stripe
3. Webhook de Stripe crea el tenant en DB
4. Email de bienvenida vía Resend
5. Usuario redirigido al dashboard

**Features complementarios:**
- Demo request con tracking de atribución
- Sistema de invitaciones para team members (`/invite/[token]`)
- Cross-domain login SSO entre Web y Dashboard
- Formulario de contacto

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
- Ajuste de puntos manual con motivo
- Registro de visitas
- Invitaciones a miembros por email con token
- Vista detallada: puntos, tier, historial, analytics individuales

**Sistema de recompensas:**
- CRUD completo de recompensas
- Configuración de costo en puntos, stock, validez, imágenes
- Scanner QR para verificar redenciones en local
- Historial de redenciones con códigos alfanuméricos

**Campañas:**
- Tipos: reactivación, cumpleaños, custom, lanzamiento
- Segmentación: por tier, por días de inactividad, por fecha de alta, custom SQL
- Canales: email + push notifications
- Métricas: enviados, entregados, abiertos, clicks
- Scheduling para envío futuro
- Límites por plan (Starter: 2/mes, Pro: ilimitado)

**Motor de Gamificación (Enterprise):**
- **Behavior Scoring:** puntuación de churn risk (0-1), engagement score (0-1), clasificación de motivación (achiever/socializer/explorer/competitor)
- **Challenges:** desafíos por visitas o puntos con recompensa en bonus points y badges
- **Missions:** secuencias multi-paso con tracking de progreso por miembro
- **Point Multipliers:** multiplicadores temporales (1.5x-5x) con condiciones por tier, estado o siempre
- **Leaderboards:** tablas de ranking semanales y mensuales
- **Intervention Orchestrator:** identificación de miembros en riesgo y trigger automático de campañas de re-engagement

**Analytics:**
- Métricas clave: miembros activos, visitas del mes, puntos redimidos, tasa de retención
- Comparativas mes a mes
- Feed de actividad reciente en tiempo real
- Gráficos de revenue y engagement

**Configuración del tenant:**
- Perfil del negocio (nombre, tipo, logo)
- Branding personalizado (colores, logo)
- Configuración de Member App
- Gestión de equipo con invitaciones y roles
- Facturación: historial de invoices, acceso al portal de Stripe
- Gestión de idioma de la cuenta
- Join code alfanumérico de 6 caracteres para que miembros se registren
- Zona de peligro (eliminar cuenta, exportar datos)

**Super Admin (`/admin`):**
- Overview de todos los tenants
- Métricas de revenue del negocio
- Gestión individual de tenants (impersonar, modificar plan, ver logs)
- System logs auditables
- Settings globales del sistema
- Preview de planes (simulador)

---

### 2.4 Member App (`member.loyalbase.dev`)

**PWA instalable:**
- `manifest.json` con íconos para iOS/Android
- Service Worker con Workbox (cache offline)
- Página de offline fallback
- Shortcuts en home screen: "Ver Recompensas", "Ver Historial"
- OneSignal push notifications inicializado al login

**Flujo de incorporación:**
1. Miembro recibe invitación por email o join code del negocio
2. Entra a `/join` e ingresa email
3. Sistema valida si ya existe o crea cuenta nueva
4. Valida join code del negocio
5. Confirma identidad y completa perfil
6. Redirigido a home con balance y tier

**Features del miembro:**
- **Home:** balance de puntos, tier actual con barra de progreso, actividad reciente
- **Catálogo de recompensas:** lista con filtros, costo en puntos, disponibilidad
- **Detalle de recompensa:** descripción, valor, botón de canje
- **Canje:** código alfanumérico + QR code para mostrar en negocio
- **Historial:** timeline de transacciones (earn/redeem/expire/bonus)
- **Mis canjes:** estado de redenciones activas
- **Leaderboard:** ranking entre miembros del programa
- **Challenges:** desafíos activos con progreso
- **Perfil:** nombre, preferencias, idioma (EN/ES sincronizado a DB)

---

### 2.5 Modelo de Datos

**Entidades principales (25+ tablas):**

| Entidad | Descripción |
|---------|-------------|
| `tenants` | Cuentas B2B, plan, Stripe customer/subscription |
| `members` | Clientes del programa, puntos, tier, auth_user_id |
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
| `notifications` | Registro de notificaciones enviadas |
| `demo_requests` | Tracking de demos con atribución |
| `stripe_events` | Idempotencia de webhooks Stripe |
| `otp_codes` | Códigos OTP de verificación |

**Seguridad:**
- Row Level Security (RLS) en todas las tablas multi-tenant
- Service role solo para operaciones de backend (webhooks, edge functions)
- Datos de un tenant completamente aislados de otros

---

### 2.6 Planes y Límites

| Feature | Starter ($79/mo) | Pro ($199/mo) | Scale ($399/mo) | Enterprise |
|---------|-----------------|---------------|-----------------|------------|
| Miembros | 500 | 2.000 | Ilimitado | Ilimitado |
| Campañas/mes | 2 | 10 | Ilimitado | Ilimitado |
| Gamificación | — | Básica | Completa | Enterprise |
| Analytics | Básico | Completo | Completo | Custom |
| White-label | — | — | Full | Full |
| Data Export | — | — | ✓ | ✓ |
| API Access | — | — | ✓ | ✓ |
| Custom Domain | — | — | — | ✓ (Phase 3) |
| Booking Integration | — | — | — | ✓ (Phase 3) |
| Account Manager | — | — | ✓ | ✓ |
| Soporte | Email | Priority | Dedicado | SLA |

---

## 3. Deuda Técnica y Mejoras Pendientes

### Alta prioridad
- [ ] **Configuración de git author:** `git config --global user.name` y `user.email` no configurados — los commits muestran hostname en lugar de nombre real
- [ ] **Tests de integración:** Las rutas de API no tienen test coverage (solo hay tests para MetricCard y Sidebar en Dashboard)
- [ ] **Tipos de Supabase desactualizados:** `packages/db/src/types.ts` puede necesitar regeneración tras las últimas migraciones (`pnpm generate-types`)
- [ ] **`@typescript-eslint/no-explicit-any` en archivos legacy:** Varios archivos tienen `/* eslint-disable @typescript-eslint/no-explicit-any */` como workaround — requieren tipado correcto

### Media prioridad
- [ ] **`<img>` vs `<Image />`:** `apps/member/app/rewards/page.tsx` y componentes usan `<img>` en lugar de `next/image` (advertencias en build)
- [ ] **Edge Functions de Supabase:** La arquitectura planifica pg_cron y Edge Functions para procesos automáticos (expiración de puntos, cumpleaños) — no implementado aún
- [ ] **Rate limiting en APIs públicas:** Las rutas del Member App no tienen protección contra abuso
- [ ] **Error boundaries:** No hay error boundaries por sección en el Dashboard

### Baja prioridad
- [ ] **Caché de API routes:** Las rutas de analytics/members no usan `unstable_cache` o `revalidate` — siempre van a DB
- [ ] **Configuración de git global:** Normalizar identidad de commits

---

## 4. Phase 3 — Próxima Fase de Desarrollo

### 4.1 Objetivos de Phase 3

Phase 3 tiene tres objetivos estratégicos:

1. **Monetización premium:** Activar features diferenciadores que justifiquen upgrades desde Scale → Enterprise
2. **Reducción de churn de tenants:** Hacer el producto más sticky con integraciones profundas de negocio
3. **Escala operativa:** Automatizaciones que reduzcan el trabajo manual del tenant y aumenten el valor percibido

---

### 4.2 Booking Integration (Enterprise Add-on)

**Descripción:** Conectar el programa de fidelización directamente con el sistema de turnos/reservas del negocio. Los puntos se otorgan automáticamente cuando un cliente completa un servicio, sin intervención manual del staff.

**Plataformas objetivo:**
- **Square Appointments** — salones, spas, nail bars
- **Vagaro** — salones, spas, fitness studios
- **Acuity Scheduling** — coaches, terapeutas, servicios profesionales
- **Mindbody** — gyms, yoga studios, wellness centers

**Flujo:**
1. Tenant conecta su cuenta de booking desde Settings → Integrations
2. OAuth flow con la plataforma seleccionada
3. Webhook recibe notificaciones de appointment completado
4. Sistema calcula puntos según tipo de servicio y monto
5. Transacción creada automáticamente en DB
6. Push notification al miembro con puntos ganados

**Reglas de mapeo:**
- Por tipo de servicio → puntos fijos o porcentaje del monto
- Por staff (ej: solo con cierto proveedor)
- Por cantidad de visitas en el mes (multiplicador progresivo)
- Exclusiones (servicios de cortesía, correcciones, etc.)

**Entidades nuevas:**
```
booking_integrations   — Credenciales y configuración por tenant
booking_events         — Webhook events recibidos
service_point_rules    — Reglas de mapeo servicio → puntos
```

**Restricción:** Solo plan Enterprise. Trigger de upgrade visible en Settings para Scale.

---

### 4.3 Custom Domains (Scale+)

**Descripción:** Cada tenant puede usar su propio dominio o subdominio para la Member App en lugar de `member.loyalbase.dev`. El miembro ve el dominio del negocio, fortaleciendo la identidad de marca.

**Flujo del tenant:**
1. Settings → Member App → Custom Domain
2. Tenant ingresa su dominio (ej: `puntos.misalon.com`)
3. Sistema genera instrucciones DNS (CNAME record)
4. Dashboard muestra estado de verificación (pendiente/verificado/error)
5. Una vez verificado, Member App accesible en dominio propio

**Implementación técnica:**
- Vercel Domains API para registrar custom domains programáticamente
- DNS verification via TXT record o CNAME check
- Middleware en Member App para detectar dominio y resolver tenant
- SSL automático vía Vercel Edge Network
- Fallback a `[tenant-slug].member.loyalbase.dev` si custom domain no disponible

**Entidades nuevas:**
```
tenant_domains   — domain, verification_status, verified_at, dns_record
```

**Restricción:** Plan Scale y Enterprise. Plan Pro: teaser con "próximamente".

---

### 4.4 Public REST API (Scale+)

**Descripción:** API pública documentada que permite a los tenants integrar LoyaltyOS con sus propios sistemas (POS, e-commerce, apps propias) sin pasar por el dashboard.

**Endpoints Phase 3:**
```
POST   /v1/members                    — Crear miembro
GET    /v1/members/{id}               — Obtener miembro
POST   /v1/transactions               — Registrar puntos
GET    /v1/members/{id}/balance       — Balance actual
GET    /v1/rewards                    — Catálogo de recompensas
POST   /v1/redemptions                — Canjear recompensa
GET    /v1/webhooks                   — Configurar webhooks salientes
```

**Auth:** API Keys por tenant (generadas en Settings → Integrations)
**Rate limiting:** Por plan (Scale: 1000 req/min, Enterprise: custom)
**Formato:** JSON REST con OpenAPI 3.0 spec pública
**SDK:** npm package `loyaltyos-sdk` (TypeScript) — opcional Phase 3

**Casos de uso:**
- POS integration (Square, Clover) para otorgar puntos en checkout
- E-commerce (Shopify, WooCommerce) para compras online
- Apps propias del negocio

---

### 4.5 Automatizaciones Programadas (Todos los planes)

**Descripción:** Procesos automáticos que hoy requieren acción manual del tenant, implementados via Supabase Edge Functions + pg_cron.

**Automatizaciones:**

| Proceso | Trigger | Acción |
|---------|---------|--------|
| **Expiración de puntos** | Diario a medianoche | Expirar puntos según política del tenant (ej: 1 año de inactividad) |
| **Cumpleaños** | Diario | Otorgar bonus points + email al miembro |
| **Miembros en riesgo** | Semanal | Evaluar behavior scores → trigger campaign si churn_risk > 0.7 |
| **Tier upgrade** | En cada transacción | Recalcular tier si puntos alcanzan nuevo umbral |
| **Puntos expirados** | Mensual | Notificar a miembros con puntos próximos a vencer |
| **Resumen semanal** | Lunes 8am | Email al tenant con métricas de la semana |

**Implementación:**
- Supabase Edge Functions para lógica de negocio
- pg_cron para scheduling (ya configurado en DB)
- Tabla `scheduled_jobs` para tracking y auditoría

---

### 4.6 Mejoras al Member App

**Referral Program:**
- Cada miembro tiene un link único de referido
- Cuando un referido se une y hace su primera visita, ambos reciben bonus points
- Panel de referidos en perfil con tracking de estado

**Social Sharing:**
- Compartir logros (badges, tier upgrades) en redes sociales
- Cards pre-generadas con branding del negocio
- Deep links a la Member App

**Member App Onboarding:**
- Tutorial interactivo para nuevos miembros (primeras 3 visitas)
- Tooltips contextuales en features clave
- Primera redención guiada

**Notificaciones mejoradas:**
- Preferencias de notificación por tipo (push, email, in-app)
- Notificaciones in-app (bell icon con badge)
- Historial de notificaciones recibidas

---

### 4.7 Dashboard — Mejoras Operativas

**Bulk Actions en Miembros:**
- Selección múltiple en lista
- Ajuste masivo de puntos
- Envío de campaña a selección
- Export de selección a CSV

**Advanced Analytics:**
- Cohorte analysis (retención por mes de alta)
- Funnel de activación: alta → primera visita → primera redención
- Revenue attribution por campaña
- Exportación de datos a CSV/Excel (Scale+)

**Webhook Outbound:**
- Tenant configura endpoints propios
- Eventos disponibles: nuevo miembro, puntos ganados, redención, tier change
- Dashboard de delivery con retries

**QR Scanner mejorado:**
- Soporte para código de barras (EAN-13) además de QR
- Historial de scans del día
- Modo de verificación rápida (solo confirmación visual)

---

### 4.8 Mejoras de Infraestructura

**Performance:**
- Implementar `unstable_cache` / `revalidate` en rutas de analytics pesadas
- Paginación cursor-based en lugar de offset para tablas grandes
- Índices de DB en columnas frecuentemente filtradas

**Observabilidad:**
- Integrar Sentry para error tracking en las 3 apps
- Logs estructurados en Edge Functions
- Alertas de webhooks fallidos (Stripe, booking integrations)

**Seguridad:**
- Rate limiting en APIs públicas del Member App (Upstash Redis)
- Audit log completo de acciones de Admin sobre tenants
- IP allowlist opcional para acceso al Dashboard (Enterprise)

---

## 5. Criterios de Éxito Phase 3

| Métrica | Objetivo |
|---------|----------|
| Adoption de Custom Domains | 30% de tenants Scale+ en 90 días |
| Booking Integration activa | 20% de tenants Enterprise en 60 días |
| Churn de tenants | Reducir de baseline a <5% mensual |
| Tier upgrade Rate | 15% de tenants Starter → Pro en 6 meses |
| API calls/mes | 100K+ al mes a los 90 días del lanzamiento |
| Automatizaciones activas | 80% de tenants con al menos 1 automatización activada |

---

## 6. Fuera de Alcance (Phase 3)

Los siguientes features quedan explícitamente fuera del alcance de Phase 3 y son candidatos para Phase 4 o versiones futuras:

- **Multi-idioma adicional:** Portugués, Francés (queda en EN/ES)
- **Mobile nativo (React Native / Flutter):** El Member App permanece como PWA
- **Marketplace de templates:** Templates de campañas pre-diseñadas
- **IA generativa:** Generación automática de campañas o sugerencias de rewards con LLM
- **Multi-divisa:** Soporte para más de USD/moneda local
- **Programa de partners / afiliados:** Comisiones para agencias que vendan LoyaltyOS
- **White-label completo del dashboard:** Que el tenant pueda usar `dashboard.sudominio.com`

---

## 7. Timeline Estimado Phase 3

| Módulo | Semanas estimadas | Dependencias |
|--------|------------------|--------------|
| Automatizaciones programadas (pg_cron) | 2 | Ninguna |
| Public REST API + API Keys | 3 | Ninguna |
| Custom Domains | 3 | Vercel Domains API |
| Booking Integration (Square primero) | 5 | OAuth, webhooks, reglas de mapeo |
| Bulk Actions en Dashboard | 1 | Ninguna |
| Advanced Analytics + Export | 2 | Ninguna |
| Referral Program (Member App) | 2 | Ninguna |
| Webhook Outbound | 2 | Public REST API |

**Total estimado Phase 3:** 10-12 semanas de desarrollo

---

## 8. Decisiones de Arquitectura Clave (PRD v1 → v2)

| Decisión | PRD v1 | Estado Actual (v2) |
|----------|--------|-------------------|
| Auth del Member App | Magic links | Email + password + token de invitación |
| Subdomain por tenant | Planificado | Member App en `member.loyalbase.dev` (custom domain en Phase 3) |
| Supabase Edge Functions | Para automatizaciones | Aún no implementadas (Phase 3) |
| Gamificación | Feature básica | Motor enterprise completo con behavior scoring |
| i18n | Una sola app | Las 3 apps en EN/ES con preferencia sincronizada a DB |
| OTP/MFA | Solo en member | Dashboard con OTP por dispositivo nuevo |
| Booking Integration | Phase 2 | Movido a Phase 3 como premium add-on |
| Custom Domains | Phase 2 | Movido a Phase 3, Scale+ |

---

---

## 9. Notas Técnicas y Decisiones Pendientes

### 9.1 Rate Limiting — Estrategia por Endpoint

**Contexto:** Se evaluó implementar rate limiting con `@upstash/ratelimit`. La recomendación genérica de "60 req/min por IP en middleware" no aplica de forma uniforme a LoyaltyOS — cada tipo de endpoint tiene un perfil de riesgo distinto.

**Decisión de arquitectura:**

Rate limiting debe ser **por capa, por endpoint y por identificador contextual** — no un único número global.

#### Clasificación de endpoints por riesgo

| Capa | Endpoint | Identificador | Límite sugerido | Algoritmo |
|------|----------|---------------|-----------------|-----------|
| Auth | `POST /api/auth/login` | IP | 5/min | Fixed window |
| Auth | `POST /api/auth/register` | IP | 3/min | Fixed window |
| Auth | `POST /api/auth/reset-password` | IP | 3/10min | Fixed window |
| Transaccional | `POST /api/points/redeem` | user_id + tenant_id | 10/min | Sliding window |
| Transaccional | `POST /api/points/add` | tenant_id (admin) | 30/min | Sliding window |
| Member App | `GET /api/member/profile` | user_id | 60/min | Sliding window |
| Member App | `POST /api/member/join` (join code) | IP | 5/min | Fixed window |
| Impersonation | `POST /api/admin/impersonate` | super_admin_id | 10/min | Fixed window |
| Webhooks inbound | `POST /api/webhooks/*` | IP + secret | 100/min | Token bucket |

#### Consideraciones de implementación

- **Endpoints autenticados → identificar por user_id o tenant_id**, no por IP. La IP puede ser compartida (NAT, oficinas, malls). Un tenant con 500 miembros en el mismo Wi-Fi rompería un límite por IP.
- **Endpoints de auth → sí por IP**, ya que el usuario no está autenticado aún.
- **Middleware de Next.js**: útil solo para protección perimetral de auth routes. Para lógica transaccional, el rate limit va dentro del route handler específico con el contexto de sesión disponible.
- **Algoritmo**: Fixed window para auth (más estricto, predecible). Sliding window para operaciones legítimas frecuentes (evita ráfagas sin bloquear usuarios normales).

#### Stack recomendado

- `@upstash/ratelimit` — free tier suficiente para MVP. Integra con Vercel Edge natively.
- Redis de Upstash (ya en el stack si se usa para sesiones u otras cosas).
- Headers de respuesta: incluir `X-RateLimit-Remaining` y `Retry-After` para que el member app pueda manejar el error con UX adecuada.

**Prioridad:** Phase 2 — antes del go-live con tenants reales. Implementar mínimamente en auth y redención de puntos antes de abrir registro público.

---

### 9.2 Auth Context — Riesgos de `auth_member_id()` y `auth_tenant_id()`

**Contexto:** Se evaluaron tres puntos de seguridad sobre cookies, RLS y timing de triggers. El hallazgo más relevante está en cómo funcionan las funciones helper de autenticación.

#### Hallazgo: session settings, no JWT

`auth_member_id()` y `auth_tenant_id()` leen de variables de sesión de PostgreSQL, **no de JWT claims**:

```sql
SELECT NULLIF(current_setting('app.member_id', true), '')::UUID;
SELECT NULLIF(current_setting('app.tenant_id', true), '')::UUID;
```

Esto significa que todas las políticas RLS que usan estas funciones dependen de que el middleware setee `app.member_id` y `app.tenant_id` **antes de cada query**. Si hay un path de request donde el middleware no las setea, la función devuelve `NULL` silenciosamente y las políticas bloquean sin error visible — difícil de debuggear.

#### Riesgo: paths sin middleware coverage

Las tres apps (web, dashboard, member) tienen middlewares distintos. Un API route nuevo que no pase por el middleware correcto tendría `auth_member_id()` → NULL, lo que rompería cualquier política RLS que dependa de ella sin lanzar un error claro.

#### Decisión pendiente: auditar cobertura de middleware

Antes de agregar más políticas RLS basadas en `auth_member_id()` o `auth_tenant_id()`, verificar que los tres middlewares cubren todos los paths de API relevantes y setean ambas variables correctamente.

**Prioridad:** Medium — auditar antes de Phase 2. No bloquea features actuales pero puede causar bugs silenciosos en features nuevas.

#### Puntos descartados

- **Cookies cross-subdomain:** No aplica mientras todo viva bajo `loyalbase.dev`. Revisitar en Phase 3 cuando se implementen subdominios por tenant.
- **Race condition en trigger de invitación:** No aplica. El flow de aceptación (`apps/web/app/api/invite/accept/route.ts`) inserta en `tenant_users` de forma explícita y sincrónica con `service_role` antes de devolver la respuesta. Sin triggers, sin race condition.

---

### 9.3 RLS Decorativo — Deuda Técnica Crítica

**Contexto:** Auditoría de los tres middlewares (web, dashboard, member) y las funciones helper de autenticación de PostgreSQL. Hallazgo confirmado por evidencia en código y migraciones propias del proyecto.

#### El problema

`auth_tenant_id()` y `auth_member_id()` leen de session settings de PostgreSQL:

```sql
SELECT NULLIF(current_setting('app.tenant_id', true), '')::UUID;
SELECT NULLIF(current_setting('app.member_id', true), '')::UUID;
```

**Ninguno de los tres middlewares setea estas variables en ningún momento.** Resultado: ambas funciones siempre devuelven `NULL`. En SQL, `column = NULL` evalúa a NULL (no TRUE), por lo que todas las políticas RLS basadas en estas funciones siempre bloquean — son efectivamente decorativas.

Esto ya fue documentado internamente:
- `supabase/migrations/20260404000007_fix_tenants_rls.sql`: *"The previous policy relied on a session variable never set by the app, blocking all tenant queries for authenticated users."*
- `apps/dashboard/app/api/members/route.ts:159`: *"use service role to bypass RLS (app.tenant_id session var not set)"*

#### Estado actual por tabla

| Tabla | Políticas con auth_tenant_id/member_id | Estado real | Protección efectiva |
|-------|----------------------------------------|-------------|---------------------|
| `tenants` | Reemplazadas en migración 007 | **Funcional** | `auth_user_id = auth.uid()` |
| `members` | `members_select_tenant`, `members_insert_tenant`, `members_update_tenant`, `members_select_self`, `members_update_self` | **Decorativas** | service_role + filtros en app |
| `transactions` | `transactions_select_own`, `transactions_insert_own`, `transactions_select_member` | **Decorativas** | service_role + filtros en app |
| `rewards` | `rewards_select_own`, `rewards_insert_own`, `rewards_update_own` | **Decorativas** | service_role + filtros en app |
| `redemptions` | `redemptions_select_tenant`, `redemptions_insert_own`, `redemptions_select_member` | **Decorativas** | service_role + filtros en app |
| `campaigns` | `campaigns_select_own`, `campaigns_insert_own`, `campaigns_update_own` | **Decorativas** | service_role + filtros en app |
| `visits` | Equivalentes | **Decorativas** | service_role + filtros en app |
| `notifications` | Equivalentes | **Decorativas** | service_role + filtros en app |

#### Por qué el app funciona igual

Toda escritura y lectura cross-tenant pasa por `createServiceRoleClient()` que bypasea RLS completamente. Los filtros por tenant se aplican a nivel de query en el código de la app (`.eq('tenant_id', tenantId)`), no en la base de datos.

#### El riesgo

**No hay segunda línea de defensa.** Si un bug en el código de la app omite el filtro por tenant en una query con service_role, RLS no lo detiene. Un error en un solo route handler puede exponer datos de todos los tenants.

#### Fix requerido

Portar el mismo patrón que ya se aplicó a `tenants` — reemplazar `auth_tenant_id()` / `auth_member_id()` con joins o lookups directos vía `auth.uid()`:

```sql
-- Patrón correcto (ya aplicado en tenants):
FOR SELECT USING (auth_user_id = auth.uid())

-- Para tablas con tenant_id (members, transactions, rewards, etc.):
FOR SELECT USING (
  tenant_id IN (
    SELECT id FROM tenants WHERE auth_user_id = auth.uid()
  )
)
```

**Prioridad:** HIGH — antes de Phase 2. Mientras el app sea el único cliente de la DB y el código de la app sea correcto, el riesgo es bajo. Pero cualquier integración externa, webhook, o script que acceda con user JWT quedaría sin protección RLS real.

---

### 9.4 Estado Post-Auditoría de Seguridad (2026-04-07)

Auditoría completa de RLS, middlewares y políticas. Resumen de lo resuelto y lo pendiente.

#### Resuelto en esta sesión

| Item | Migración / Cambio | Estado |
|------|-------------------|--------|
| `super_admins_all` FOR ALL USING(true) | `20260406000002` | ✓ Cerrado |
| `tenant_users` INSERT/UPDATE permisivos | `20260406000003` | ✓ Cerrado |
| `invitations` INSERT/UPDATE permisivos | `20260406000003` | ✓ Cerrado |
| `badges` cross-tenant catalog leak | `20260406000004` + `20260406000006` | ✓ Cerrado |
| `demo_requests` anon INSERT abierto | `20260406000005` + API route | ✓ Cerrado |
| RLS decorativo en 13 tablas (session vars nunca seteadas) | `20260406000006` | ✓ Cerrado |

#### Pendiente

| Item | Prioridad | Acción requerida |
|------|-----------|-----------------|
| **Spend Cap en Supabase Billing** | HIGH | Configurar en Supabase Dashboard → Billing → Spend Cap. Limitar gasto máximo mensual antes de abrir registro público. No requiere código. |
| **Rate limiting en API routes críticas** | Medium | Implementar según estrategia documentada en sección 9.1. Mínimo: auth y redención de puntos antes de go-live. |

#### Arquitectura de seguridad actual (post-auditoría)

- **RLS activo y funcional** en todas las tablas via `current_tenant_id()` / `current_member_id()` (SECURITY DEFINER, resuelven via `auth.uid()` sin depender de session settings)
- **Segunda línea de defensa operativa** — un endpoint que omita el `.eq('tenant_id', x)` ya no expone datos de otros tenants
- **Operaciones privilegiadas** (insert de members, accept invite, impersonation) siguen usando `service_role` explícitamente
- **Funciones helper disponibles:** `is_super_admin()`, `is_tenant_owner()`, `current_tenant_id()`, `current_member_id()`

---

### 9.5 Performance — Índices para Funciones RLS

**Contexto:** Las funciones `current_tenant_id()` y `current_member_id()` introducidas en `20260406000006` hacen lookups en tres tablas en cada evaluación de política RLS. Dos de los tres ya tenían índices; el tercero no.

#### Estado de índices en columnas `auth_user_id`

| Tabla | Columna | Índice | Estado |
|-------|---------|--------|--------|
| `tenants` | `auth_user_id` | `idx_tenants_auth_user` (partial: `deleted_at IS NULL`) | ✓ Existente |
| `tenant_users` | `auth_user_id` | `idx_tenant_users_auth_user_id` | ✓ Existente |
| `members` | `auth_user_id` | — | ✗ Faltante → `20260407000001` |

#### Por qué importa

`current_member_id()` hace `SELECT id FROM members WHERE auth_user_id = auth.uid()` sin índice. `current_tenant_id()` tiene el mismo problema en su tercer COALESCE (contexto member app). Con 500 miembros por tenant y decenas de tenants, cada evaluación de política que llame a estas funciones hace un sequential scan en la tabla completa de members.

**Fix aplicado:** `20260407000001_index_members_auth_user_id.sql`

#### Spend Cap — Decisión operacional pendiente

Activar en Supabase Dashboard → Organization → Billing → Subscription.

| Fase | Cap recomendado | Motivo |
|------|----------------|--------|
| Testing / early access privado | $0 sobre plan Pro | Pausa servicios en vez de cobrar excedente — preferible a sorpresas de facturación |
| Tenants pagando activos | $10–20 buffer | Evitar downtime legítimo; el costo de un tenant sin servicio supera el excedente |

**Prioridad:** Activar el $0 cap AHORA, antes de abrir registro público.

---

### 9.6 Member App — Flujo Alternativo de Login (Sin Join Code)

**Contexto:** El flujo actual de login de miembros requiere el join code del negocio como primer paso. Si el miembro lo pierde (borró el chat, cambió de dispositivo), queda completamente bloqueado sin recovery path — deuda operacional real que genera tickets de soporte.

#### Problema

El join code es un single point of failure para el acceso de miembros existentes. Un usuario que ya tiene cuenta y membresía activa debería poder ingresar directamente por email + contraseña, sin pasar por el wizard de incorporación.

#### Solución implementada

Nueva ruta `/login` con flujo directo de autenticación:

1. **Credenciales** — el usuario ingresa email + contraseña
2. **Resolución de tenant:**
   - **Cookie presente** (`loyalty_tenant_id`) → redirect directo a `/` sin picker
   - **1 membresía activa** → auto-select, set cookie, redirect a `/`
   - **N membresías activas** → picker UI con lista de negocios (nombre, logo, puntos, tier)
   - **0 membresías** → redirect a `/join` (usuario autenticado pero sin membresías activas)

#### Archivos creados/modificados

| Archivo | Cambio |
|---------|--------|
| `apps/member/app/login/page.tsx` | Nueva página de login con flujo de 2 pasos |
| `apps/member/app/api/auth/my-tenants/route.ts` | Endpoint autenticado que devuelve membresías activas del usuario con datos del tenant |
| `apps/member/middleware.ts` | `/login` agregado a PUBLIC_PATHS |
| `apps/member/app/join/page.tsx` | Link "¿Ya tenés cuenta? Iniciá sesión" en paso del código |

#### Seguridad

Sin riesgo nuevo. El endpoint `/api/auth/my-tenants` requiere sesión válida y filtra por `auth_user_id` del JWT — los resultados son estrictamente los del usuario autenticado. El cookie manipulation sigue siendo seguro por las mismas razones documentadas en 9.2.

#### UX

- `/join` → "¿Ya tenés cuenta? Iniciá sesión" → `/login`
- `/login` → "¿Primera vez? Ingresá el código de tu negocio" → `/join`
- Picker usa branding del tenant (color, logo, nombre del app) para facilitar identificación visual

**Estado:** Implementado en producción (2026-04-07).

---

*LoyaltyOS PRD v2.0 — Documentación interna. No distribuir.*
