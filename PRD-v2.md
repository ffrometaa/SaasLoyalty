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

*LoyaltyOS PRD v2.0 — Documentación interna. No distribuir.*
