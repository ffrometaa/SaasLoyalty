# ~~LoyaltyOS — Product Requirements Document v2.0~~ [DEPRECADO]

> ⚠️ **Este documento está deprecado.** Fue reemplazado por [PRD-v3.md](./PRD-v3.md) en Abril 2026.
> No usar como referencia. Conservado solo para historial.

**Fecha:** Abril 2026
**Estado:** ~~Producción — MVP Completo~~ **DEPRECADO — ver PRD-v3.md**
**Versión anterior:** PRD v1.0 (inicio del proyecto, Supabase + Next.js + Stripe)
**Reemplazado por:** PRD v3.0 (Abril 2026)

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
- **Pagos:** Stripe Billing (Starter $199 / Pro $399 / Scale $599 por mes)
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
6. Acepta Términos de Servicio y Política de Privacidad (checkbox requerido)
7. Redirigido a home con balance y tier

**Sistema de consentimiento legal:**
- Checkbox de T&C requerido en el registro (deshabilitado por defecto, submit bloqueado)
- Consentimiento registrado en DB con IP y user-agent para auditoría
- Re-aceptación forzada si se publican nuevas versiones de documentos (`/consent-update`)
- Páginas legales en inglés hardcoded (sin i18n): `/legal/member-terms` + `/legal/privacy-policy`
- `ConsentGuard` en root layout verifica pendientes en cada carga y redirige si corresponde

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
| `legal_documents` | Documentos legales versionados (global o por tenant) |
| `member_consents` | Registro de aceptaciones por miembro y versión de documento |

**Seguridad:**
- Row Level Security (RLS) en todas las tablas multi-tenant
- Service role solo para operaciones de backend (webhooks, edge functions)
- Datos de un tenant completamente aislados de otros

---

### 2.6 Planes y Límites

| Feature | Starter ($199/mo) | Pro ($399/mo) | Scale ($599/mo) | Enterprise |
|---------|-----------------|---------------|-----------------|------------|
| Miembros | 500 | 2.000 | Ilimitado | Ilimitado |
| Campañas/mes | 2 | 10 | Ilimitado | Ilimitado |
| Gamificación | — | Básica | Completa | Enterprise |
| Analytics | Básico | Completo | Completo | Custom |
| White-label | — | — | Full | Full |
| Data Export | — | — | ✓ | ✓ |
| API Access | — | — | — (†) | ✓ |
| Custom Domain | — | — | — (†) | ✓ (Phase 3) |
| Booking Integration | — | — | — | ✓ (Phase 3) |
| Account Manager | — | — | ✓ | ✓ |
| Soporte | Email | Priority | Dedicado | SLA |

> **(†) Retirado del plan Scale** — API Access y Custom Domains fueron retirados como features incluidos en Scale pending validación de mercado. Marketing debe evaluar si los tenants están dispuestos a pagar un sobreprecio por ellos como add-on o tier Scale+. Ver §2.7.

---

### 2.7 Decisión de Pricing — API Access y Custom Domains (Pendiente Validación de Mercado)

**Fecha de decisión:** 2026-04-07
**Estado:** 🟡 Pendiente — requiere investigación de marketing antes de implementar

#### Decisión tomada

API Access y Custom Domains fueron **retirados del plan Scale** como features incluidos en el precio base ($599/mo). La razón principal: ambos features tienen un costo de implementación significativo y no hay evidencia actual de que los tenants los perciban como justificación suficiente para pagar $200/mo más que Pro.

Actualmente el plan Scale se diferencia de Pro en:
- Miembros ilimitados ✅ (implementado)
- Campañas ilimitadas ✅ (implementado)
- Data Export 🔲 (no implementado)
- White-label full brand 🔲 (no implementado)
- Account Manager ✅ (operacional)

Con API Access y Custom Domains incluidos, el plan Scale prometía features que no están construidos y que representan semanas de desarrollo. Al retirarlos, el plan Scale queda honesto con lo que entrega hoy y evita compromiso técnico prematuro.

#### Qué debe investigar Marketing

Antes de decidir si API Access y Custom Domains entran como:

- **Opción A — Scale+ tier** ($799-$899/mo): un cuarto plan entre Scale y Enterprise para tenants que necesitan integraciones pero no quieren Enterprise
- **Opción B — Add-ons por separado** (+$X/mo sobre Scale): API Access como add-on independiente, Custom Domain como add-on independiente
- **Opción C — Solo Enterprise**: mantenerlos exclusivos de Enterprise, usando el trigger de upgrade desde Settings de Scale como palanca de conversión

Marketing debe responder:

| Pregunta | Método sugerido |
|----------|----------------|
| ¿Los tenants Scale actuales usan POS o e-commerce propio? | Encuesta directa a tenants activos |
| ¿Cuánto pagarían extra por API access? | Test de precio (Van Westendorp o Conjoint) |
| ¿Custom Domain es un diferenciador real o nice-to-have? | Entrevistas con 5-10 tenants |
| ¿Hay competidores que lo incluyen en el plan equivalente? | Benchmarking competitivo |

#### Impacto en código

El archivo `apps/dashboard/lib/plans/features.ts` actualmente tiene `api_access` en el array de features de Scale. **Debe actualizarse** para removerlo y alinearse con esta decisión antes del próximo deploy de features.ts. Esta tarea queda pendiente hasta que marketing confirme la estrategia.

#### Criterio de resolución

Esta decisión debe resolverse antes del inicio de Phase 3 (implementación de API pública, §4.4). Si marketing no tiene datos para ese momento, se adopta **Opción C** (solo Enterprise) por defecto para no bloquear la hoja de ruta.

---

### 2.8 Gaps Críticos del Plan Enterprise — Bloqueados hasta PRD v3

**Fecha:** 2026-04-07
**Estado:** 🔴 No implementar — requiere validación de marketing antes de PRD v3

Los siguientes features están definidos en el sistema de planes (`features.ts`) como exclusivos de Enterprise pero **no tienen arquitectura documentada, ni especificación técnica, ni están contemplados en Phase 3**. Hoy hacen que Enterprise sea funcionalmente un "Scale con precio custom", sin diferenciadores reales de infraestructura.

**Ninguno de estos features debe iniciarse hasta que marketing confirme willingness-to-pay y el equipo de producto los incorpore formalmente en PRD v3.**

---

#### Gap 1 — SSO Tenant (SAML / OIDC)

**Qué es:** Autenticación enterprise que permite al tenant usar su propio Identity Provider (Okta, Azure AD, Google Workspace) para que sus empleados accedan al Dashboard de LoyaltyOS sin credenciales separadas.

**Por qué importa:** Es el feature de Enterprise más demandado en SaaS B2B. Sin SSO, los negocios medianos/grandes con políticas de seguridad corporativa no pueden adoptar LoyaltyOS. Es un bloqueador de ventas upmarket, no un nice-to-have.

**Estado actual:** Solo hay una referencia interna en el PRD a "Cross-domain login SSO entre Web y Dashboard" (§1), que es SSO *interno* de LoyaltyOS — no tiene relación con SSO de tenant. No hay tabla, no hay flujo, no hay spec.

**Preguntas para marketing:**
- ¿Los leads Enterprise actuales han preguntado por SSO?
- ¿Cuántos deals se perdieron por falta de SSO?
- ¿Qué IdPs usan los prospectos objetivo?

**Esfuerzo estimado (cuando se defina):** Alto — 4-6 semanas. Requiere integración con `@auth/supabase` o solución dedicada (WorkOS, BoxyHQ), migración del sistema de sesiones, y UI de configuración en Settings.

---

#### Gap 2 — Multi-Location

**Qué es:** Un tenant con múltiples sucursales (franquicia, cadena de negocios) que comparte base de miembros, acumula puntos en cualquier sucursal, y ve reportes consolidados o por sucursal.

**Por qué importa:** El caso de uso de negocio con una sola ubicación es limitado en ticket promedio. Multi-location es el diferenciador que permite atacar franquicias y cadenas — segmento con LTV significativamente mayor.

**Estado actual:** Solo existe un campo `location_id` implícito en algunas tablas. No hay tabla `locations`, no hay RLS por sucursal, no hay UI de gestión, no hay lógica de acumulación cross-location. La arquitectura actual es 1 tenant = 1 negocio físico.

**Preguntas para marketing:**
- ¿Hay tenants actuales con más de una sucursal que estén gestionando workarounds?
- ¿Los prospectos Enterprise provienen de franquicias o cadenas?
- ¿El modelo de pricing sería por sucursal adicional o flat?

**Esfuerzo estimado (cuando se defina):** Muy alto — 6-8 semanas. Requiere migración de schema, refactor de RLS, nuevo contexto de sesión, y UI completa de gestión de sucursales.

---

#### Gap 3 — Infraestructura Dedicada / Secure Compute

**Qué es:** Aislamiento de infraestructura para tenants Enterprise que operan bajo regulaciones de compliance (SOC 2 Type II, HIPAA, PCI-DSS). Incluye: tenant en schema propio o proyecto Supabase separado, sin multi-tenancy compartido, SLA de uptime garantizado contractualmente, y audit log completo.

**Por qué importa:** Sin esto, LoyaltyOS no puede venderse a retailers de salud, farmacias, clínicas con programas de fidelidad, o cualquier vertical regulado. Es el techo de mercado del producto.

**Estado actual:** Toda la arquitectura es multi-tenant en un único proyecto Supabase con RLS. No hay aislamiento por tenant. El "support_sla" está definido en `features.ts` pero es solo un nivel operacional, no hay infraestructura diferenciada.

**Preguntas para marketing:**
- ¿Hay prospectos en verticales regulados (salud, farmacia, finanzas)?
- ¿El segmento objetivo de Enterprise requiere certificaciones de compliance?
- ¿O Enterprise es simplemente "negocios grandes" sin requisitos de compliance?

**Esfuerzo estimado (cuando se defina):** Muy alto — arquitectura diferente. Requiere decisión sobre multi-project Supabase vs schema isolation vs row-level tenant key, más certificaciones externas.

---

#### Resumen para PRD v3

| Gap | Bloqueador de ventas | Esfuerzo | Prioridad sugerida para v3 |
|-----|---------------------|----------|---------------------------|
| SSO Tenant (SAML/OIDC) | Alto — deals perdidos | Alto (4-6 sem) | 1º |
| Multi-location | Medio — limita segmento | Muy alto (6-8 sem) | 2º |
| Secure Compute / Compliance | Bajo hoy, alto a futuro | Muy alto + certificaciones | 3º |

> **Regla:** Ningún ingeniería avanza en estos tres items sin un documento de validación de marketing que confirme demanda real. El riesgo de construir Enterprise features sin demanda validada es alto — son las implementaciones más costosas del roadmap.

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

### 4.3 Custom Domains

> ⚠️ **Decisión de pricing pendiente (ver §2.7):** Custom Domains fue retirado del plan Scale. Actualmente solo está incluido en Enterprise. Marketing debe validar si justifica un tier Scale+ o add-on separado antes de iniciar implementación.

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

### 4.4 Public REST API

> ⚠️ **Decisión de pricing pendiente (ver §2.7):** API Access fue retirado del plan Scale. Marketing debe validar el modelo (Scale+, add-on o solo Enterprise) antes de iniciar implementación. La especificación técnica a continuación es válida independientemente del tier que resulte.

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

### Candidatos a PRD v3 — Bloqueados por validación de marketing (ver §2.8)

Estos tres items son gaps del plan Enterprise que **no entran en Phase 3 bajo ninguna circunstancia** — requieren validación de demanda antes de ser especificados:

- **SSO Tenant (SAML/OIDC):** Integración con IdP corporativo del tenant (Okta, Azure AD, Google Workspace)
- **Multi-location:** Arquitectura para franquicias y cadenas con múltiples sucursales, base de miembros compartida y reportes consolidados
- **Infraestructura dedicada / Secure Compute:** Aislamiento por tenant para compliance (SOC 2, HIPAA, PCI-DSS), schema propio, SLA contractual

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
| **Bug UX: tenant incorrecto en sub-páginas con múltiples membresías** | Low | Ver sección 9.7. |

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

### 9.7 Bug Pendiente: Tenant Incorrecto en Sub-páginas con Múltiples Membresías

**Contexto:** Introducido como consecuencia del flujo de login directo (sección 9.6). Con la implementación actual, un usuario con membresías en múltiples negocios puede iniciar sesión correctamente, pero las sub-páginas del Member App llaman a `getMemberWithTenant(user.id)` sin pasar `tenantId`.

#### El problema

`getMemberWithTenant` sin `tenantId` hace `.limit(1)` en la tabla `members` filtrada solo por `auth_user_id`. El orden de retorno de Supabase no está garantizado — puede devolver cualquier tenant del usuario, no necesariamente el que seleccionó en el picker.

**Impacto:** Si el usuario tiene membresías en 2 negocios y Supabase retorna el tenant "incorrecto", la home y sub-páginas mostrarían puntos, rewards y datos del negocio equivocado. El cookie `loyalty_tenant_id` está seteado correctamente, pero las Server Components que llaman `getMemberWithTenant` sin leerlo lo ignoran.

**Afecta a:** Solo usuarios con membresías en más de un negocio (caso poco frecuente en MVP).

#### Fix requerido

Todas las Server Components que llaman `getMemberWithTenant(user.id)` deben pasar también el `tenantId` leído de la cookie:

```ts
// Patrón actual (incorrecto para multi-tenant users):
const member = await getMemberWithTenant(user.id);

// Patrón correcto:
const tenantId = cookies().get('loyalty_tenant_id')?.value;
const member = await getMemberWithTenant(user.id, tenantId);
```

**Archivos afectados:** Todas las pages de `apps/member/app/` que resuelven el perfil del miembro — ya tienen soporte para el parámetro `tenantId` en `getMemberWithTenant` (la función ya acepta el segundo parámetro opcional).

**Prioridad:** Low — solo afecta usuarios con membresías en múltiples negocios, que en el MVP es un caso edge. Priorizar antes de abrir el Member App a negocios con usuarios compartidos.

---

### 9.8 Sistema de Consentimiento Legal (2026-04-07)

**Contexto:** Implementación de tracking de consentimientos legales versionados para cumplimiento regulatorio. Cubre GDPR/CCPA en cuanto a registro auditable de aceptación de T&C y política de privacidad.

#### Arquitectura

| Componente | Ubicación | Función |
|------------|-----------|---------|
| Migración | `supabase/migrations/20260407000002_member_consent_system.sql` | Tablas, RLS, función helper, seed |
| API | `apps/member/app/api/consent/route.ts` | GET pendientes / POST registro |
| Checkbox | `apps/member/components/consent-checkbox.tsx` | UI de aceptación con i18n |
| Guard | `apps/member/components/consent-guard.tsx` | Client component, detecta pendientes y redirige |
| Re-aceptación | `apps/member/app/consent-update/page.tsx` | Página para versiones nuevas |
| Términos | `apps/member/app/legal/member-terms/page.tsx` | Hardcoded EN |
| Privacidad | `apps/member/app/legal/privacy-policy/page.tsx` | Hardcoded EN |

#### Modelo de datos

```
legal_documents
  id, tenant_id (NULL = global), type (terms_of_service | privacy_policy),
  version, content, is_active, effective_at, created_at

member_consents
  id, member_id → members, document_id → legal_documents,
  accepted_at, ip_address, user_agent
  UNIQUE(member_id, document_id)
```

**Función:** `get_pending_consents(p_member_id uuid)` — SECURITY DEFINER + SET search_path = public. Devuelve documentos activos no aceptados por el miembro.

#### Decisiones de diseño

- **Documentos legales siempre en inglés:** Los textos de T&C y Privacy Policy son hardcoded en inglés, sin i18n. La UI que los referencia (checkbox, botones) sí usa i18n.
- **Seed de documentos globales:** Se insertan dos documentos con UUIDs fijos (`00000000-0000-0000-0000-000000000001` y `...002`) como base. Para publicar nuevas versiones: insertar un nuevo registro con `is_active = true` y desactivar el anterior.
- **Re-aceptación sin redirect loop:** `ConsentGuard` whitelist `/consent-update`, `/legal/`, `/api/` — nunca redirige desde esas rutas. Si el fetch falla, muestra error en lugar de redirigir.
- **Bearer token fallback en API:** POST /api/consent soporta Authorization: Bearer para el caso de race condition post-signup (el mismo patrón que `/api/auth/create-member`).
- **RLS de `member_consents`:** Solo INSERT y SELECT propios vía `current_member_id()`. La escritura real se hace con `service_role` desde la API para evitar el problema de session vars no seteadas.

#### Flujo de versioning

1. Super Admin inserta nuevo documento en `legal_documents` con `is_active = true` y versión incrementada
2. El documento anterior se marca `is_active = false`
3. `get_pending_consents` detecta automáticamente que los miembros no aceptaron la nueva versión
4. `ConsentGuard` en el root layout redirige a `/consent-update` en la próxima visita
5. Miembro acepta → registro en `member_consents` → redirect a `/`

---

### 9.9 i18n en /join — Corrección y Cobertura Completa (2026-04-07)

**Contexto:** La página `/join` del Member App estaba completamente hardcodeada en español, violando la regla de idioma principal inglés. Un miembro sin preferencia configurada veía la UI en español sin opción de cambio.

#### Problema raíz

La página fue construida antes de que se estableciera el sistema de i18n completo. Al ser un componente `'use client'`, se asumió erróneamente que `useTranslations` no aplicaba — pero next-intl funciona perfectamente en Client Components.

#### Solución

- Reemplazados todos los strings hardcodeados con `useTranslations('join_page')`
- Nuevo namespace `join_page` en `en.json` y `es.json` con cobertura total:
  - Labels e inputs (código, email, nombre, apellido, teléfono, contraseña)
  - Meses del calendario (January–December / Enero–Diciembre)
  - Mensajes de error (código inválido, contraseña incorrecta, ya registrado, etc.)
  - Textos de navegación (Volver/Back, ¿Ya tenés cuenta?/Already have an account?)
  - Estados de loading (Verificando.../Verifying..., Creando cuenta.../Creating account...)

#### Regla establecida

- **Idioma principal: inglés** — un miembro sin preferencia configurada ve `/join` en inglés
- **Español disponible** — si el miembro ya configuró su preferencia en Settings (cookie `NEXT_LOCALE=es`), la página aparece en español neutro
- **Documentos legales: siempre en inglés** — las páginas `/legal/*` no usan i18n (hardcoded)

---

### 9.10 PWA Offline — Redención sin Conexión (Deuda Técnica, Phase 3)

**Contexto:** Evaluación estratégica de modo offline agresivo para negocios con zonas de baja señal (spas, gimnasios, recepciones). El escenario real: miembro intenta mostrar su QR de redención sin conexión.

#### Estado actual

El Member App ya tiene:
- Service Worker con Workbox (cache de assets estáticos)
- Página `/offline` de fallback
- Cache de shell de la app

Lo que NO está cacheado: los datos dinámicos de redención. El código QR viene del servidor (`redemptions.code`). Si el miembro no cargó la pantalla antes de perder señal, no hay QR disponible.

#### Por qué el offline "agresivo" requiere trabajo real

El QR de redención es generado en el servidor y entregado por API. Sin precaching explícito de datos, el modo offline es solo visual — el miembro ve la app pero sin el QR que necesita. Mostrar una pantalla bonita "sin conexión" sin datos útiles no resuelve el problema del negocio.

#### Implementación correcta (cuando se priorice)

| Paso | Qué hacer | Dónde |
|------|-----------|-------|
| 1 | Al hacer login o entrar a `/redemptions`, guardar canjes activos en `IndexedDB` | `apps/member/app/redemptions` |
| 2 | Generar el QR en el cliente con `qrcode` (ya instalado) a partir del dato cacheado | Client component |
| 3 | Mostrar banner "Sin conexión — mostrando datos guardados" para que el staff sepa que el código es válido | UI layer |
| 4 | Expirar cache local cuando el canje se marque como usado (requiere sync al recuperar conexión) | Background sync |

#### Limitación crítica

El cuello de botella no es el miembro — es la verificación del lado del negocio. Si el staff tampoco tiene señal para escanear el QR desde el Dashboard, el sistema falla de igual manera. El offline del miembro solo agrega valor si el scanner del Dashboard puede funcionar offline también, o si el staff verifica el código alfanumérico manualmente.

#### Prioridad

**Medium-Low — Phase 3.** Implementar después de:
1. Rate limiting en APIs críticas (sección 9.1)
2. Spend Cap en Supabase Billing (sección 9.4)

---

### 9.11 Sistema de Feedback Bidireccional (Planificado, Phase 3)

**Contexto:** Decisión estratégica de abrir canales directos de feedback entre los actores del sistema y el equipo de LoyaltyOS, sin depender de canales externos (email, WhatsApp, formularios de terceros).

#### Actores y flujos

**Canal 1 — Tenant → LoyaltyOS**

Los tenants (dueños de negocio) necesitan un canal para reportar problemas, sugerir features o pedir soporte desde adentro del Dashboard, sin salir de la app.

- **Dónde:** Panel de Settings del Dashboard → sección "Feedback & Soporte"
- **Tipos:** Bug report / Feature request / Consulta / Otro
- **Datos automáticos adjuntos:** plan actual, tenant_id, fecha, URL donde ocurrió el problema
- **Destino:** Super Admin Dashboard (`/admin`) — nueva sección "Feedback" con lista de tickets
- **Respuesta:** El Super Admin puede responder desde el Dashboard; el tenant recibe la respuesta por email (Resend) y/o notificación in-app

**Canal 2 — Member → LoyaltyOS**

Los miembros del programa de fidelización pueden reportar problemas con la app, errores en sus puntos o sugerir mejoras directamente desde el Member App.

- **Dónde:** Member App → Perfil → "Enviar feedback"
- **Tipos:** Problema con mis puntos / Error en la app / Sugerencia / Otro
- **Datos automáticos adjuntos:** member_id, tenant_id del negocio activo, versión de app, URL
- **Destino:** Super Admin Dashboard (`/admin`) — misma sección "Feedback", diferenciado por origen (tenant vs member)
- **Respuesta:** Email al member vía Resend

#### Modelo de datos propuesto

```
feedback_submissions
  id, type (tenant | member), category, message,
  submitter_id (tenant_id o member_id), origin_url,
  status (open | in_progress | resolved | closed),
  created_at, resolved_at

feedback_responses
  id, submission_id → feedback_submissions,
  message, sent_by (super_admin_id),
  sent_at, delivery_status
```

#### Por qué es estratégico

- **Retención de tenants:** Un tenant que puede reportar un problema y recibe respuesta en 24h tiene mucho menos churn que uno que manda un email a soporte y no recibe respuesta
- **Product discovery:** El feedback in-app es la fuente más rica de insights reales — más honesto que encuestas, más accionable que métricas
- **Diferenciador vs competencia:** La mayoría de los SaaS de fidelización no tienen feedback loop integrado — el tenant usa Intercom o email desacoplado

#### Prioridad

**Medium — Phase 3.** Implementar después de rate limiting y automatizaciones programadas. El MVP del canal puede ser un formulario simple que genere un email interno, sin UI de respuesta en el Dashboard, y se refina en iteraciones posteriores.

---

### 9.12 Financial Control System — Evaluación e Integración en Super Admin (2026-04-07)

**Contexto:** Evaluación del documento `financial_control_system.html` para determinar qué métricas son implementables en `/admin/overview` con los datos existentes en el proyecto, el impacto en rendimiento a escala, y la viabilidad de integración en analytics avanzado de planes Scale/Enterprise.

---

#### Métricas disponibles vs. no disponibles desde la DB

| Métrica | Fuente en el proyecto | Viabilidad |
|---------|----------------------|------------|
| **MRR** | `tenants.plan` × precio del plan | ✅ Ya calculado en `RevenueCharts.tsx` |
| **MRR Growth** | Histórico de suscripciones vía `stripe_events` | ✅ Ya graficado en `/admin` |
| **Churn rate** | `plan_status = 'canceled'` + `stripe_events` tipo `customer.subscription.deleted` | ⚠️ Dato existe, no calculado como % mensual |
| **NRR** | Requiere snapshot mensual de MRR — activo + upgrades − downgrades − churn | ⚠️ Calculable con tabla `mrr_snapshots` |
| **Trial conversion rate** | `trial_ends_at` + cambio de `plan_status` | ⚠️ Dato existe, no calculado |
| **At-risk / señales de alarma** | `plan_status IN ('past_due', 'trialing')` | ✅ Ya implementado |
| **Runway** | Requiere saldo bancario real — no está en Supabase ni en Stripe | 🚫 No cumple |
| **EBITDA** | Requiere estructura de costos operativos externos — no está en Supabase | 🚫 No cumple |
| **Breakeven** | Requiere costos fijos (Vercel, Supabase, Resend, salarios) — dato externo | 🚫 No cumple |
| **CAC Payback** | Requiere gasto de adquisición (ads, marketing) — dato externo | 🚫 No cumple |

**Runway y EBITDA son explícitamente descartados** — no hay forma de calcularlos automáticamente desde la DB del proyecto sin integrar una fuente externa de costos operativos y saldo bancario. Agregarlos como campos manuales (input del Super Admin) es posible pero fuera del alcance del sistema automatizado.

---

#### Recomendación de implementación en `/admin/overview`

**Fase A — Con datos actuales, sin cambios de modelo:**

Agregar sección "Financial Pulse" al overview con:
- MRR total + variación mes a mes (%)
- Churn rate mensual calculado desde `stripe_events`
- Trial conversion rate (últimos 30 días)
- Señales de alarma activas (past_due, churn > 5%, MRR decreciente dos meses consecutivos)

**Fase B — Con tabla `mrr_snapshots` (Phase 3):**

Un registro por mes con MRR calculado al cierre. Alimentado por pg_cron (ya planificado en sección 4.5). Habilita:
- NRR mensual real
- Forecast 12M proyectado desde tendencia histórica
- Margen bruto = MRR − COGS estimado (hosting, email, infraestructura — input manual en Settings)

---

#### Impacto en rendimiento a escala

Las métricas del overview hacen aggregations sobre todas las tablas (`tenants`, `stripe_events`, `transactions`, `members`). Con 10 tenants no se nota. Con 200 tenants y 100K miembros, cada carga del overview genera sequential scans costosos.

**Solución requerida antes de implementar el dashboard financiero:**

| Mecanismo | Qué resuelve |
|-----------|-------------|
| Tabla `mrr_snapshots` | MRR y NRR leídos desde snapshot, no calculados en tiempo real |
| Tabla `admin_metrics_cache` | Churn rate, trial conversion, tenant count — actualizados cada hora por pg_cron |
| Índices en `tenants.plan_status` y `stripe_events.type` | Acelera los filtros más frecuentes del overview |

**Regla:** el overview financiero debe leer datos pre-computados, nunca calcular en tiempo real sobre tablas de producción. Sin este cacheo, el sistema no escala más allá de 50-100 tenants activos sin latencia visible.

---

#### Integración en Analytics de Scale/Enterprise

Los tenants no acceden a métricas financieras de LoyaltyOS. Lo que tiene sentido exponer es el **marco financiero aplicado al programa de fidelización del propio tenant**:

| Concepto del documento | Equivalente para el tenant | Fuente |
|----------------------|---------------------------|--------|
| MRR | Revenue atribuible al programa (visitas × ticket promedio estimado) | `visits`, `transactions` |
| Churn rate | Tasa de miembros inactivos (sin visita en 30/60/90 días) | `members` |
| NRR | LTV promedio del miembro activo vs. inactivo | `transactions` agrupadas por member |
| Señales de alarma | Churn risk > 0.7 (ya implementado en `member_behavior_scores`) | `member_behavior_scores` |
| Runway | 🚫 No cumple — no aplica al contexto del tenant | — |
| EBITDA | 🚫 No cumple — no aplica al contexto del tenant | — |

Esta integración tiene sentido como feature diferenciador de los planes Scale y Enterprise — el tenant puede medir si su programa genera retención real o solo gasto de puntos sin conversión. Se implementa sobre los datos de `transactions`, `visits`, `member_behavior_scores` que ya existen.

**Prioridad:** Medium — Phase 3. Implementar después de la infraestructura de cacheo (`mrr_snapshots`, `admin_metrics_cache`) que es prerequisito de rendimiento.

---

### 9.13 Estudio de Impacto en Rendimiento — Features Enterprise (2026-04-07)

**Referencia completa:** `Estudio-de-Impacto.md` en la raíz del proyecto.

Antes de iniciar cualquier feature del plan Enterprise, consultar el nivel de impacto en rendimiento. Los features de nivel 🔴 Alto **requieren una estrategia de mitigación definida y aprobada antes de escribir una sola línea de código**.

#### Resumen por nivel de impacto

| Nivel | Features |
|---|---|
| 🔴 **Alto** | Miembros ilimitados, Analytics heatmap, Analytics export, Data export, Gamificación avanzada, Campañas avanzadas, API Access, Multi-location |
| 🟡 **Medio-Alto** | Analytics full, Campañas ilimitadas, Webhooks salientes |
| 🟡 **Medio** | Gamificación básica, Booking Integration, Infraestructura dedicada |
| 🟢 **Bajo / Ninguno** | White-label, Custom Domains, SSO, Account Manager, Support SLA |

#### Prerrequisitos de infraestructura para features 🔴 Alto

Estos cinco componentes deben estar en producción antes de implementar cualquier feature de nivel alto:

| Prerrequisito | Estado | Referencia PRD |
|---|---|---|
| Índices de DB revisados (EXPLAIN ANALYZE) | 🔲 Pendiente | §9.5 |
| Sistema de caché (Upstash Redis) | 🔲 Pendiente | §3 deuda técnica |
| Job queue (pg_cron + Edge Functions) | 🔲 Pendiente | §4.5 |
| Observabilidad (Sentry en 3 apps) | 🔲 Pendiente | §4.8 |
| Rate limiting en APIs públicas | 🔲 Pendiente | §9.1 |

> Sin estos cinco componentes operativos, implementar features de nivel 🔴 Alto es acumular deuda de rendimiento que se manifiesta en producción — no en desarrollo.

---

*LoyaltyOS PRD v2.0 — Documentación interna. No distribuir.*
