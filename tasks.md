# LoyaltyOS — Task Board

> Extraído de Google Calendar. Actualizado automáticamente por el agente diario.
> Última actualización: 2026-04-07

---

## Instrucciones para el agente

Este archivo es la fuente de verdad de las tareas de LoyaltyOS.
El agente diario (lunes a sábado, 9:00 AM) debe:
1. Leer este archivo
2. Verificar qué tareas tienen fecha <= hoy
3. Para cada tarea vencida, preguntar al repo (git log, commits) si hay evidencia de que se realizó
4. Actualizar `checklist.md` con el estado de cada tarea del día

Criterios de "completada":
- Hay un commit reciente relacionado con la tarea
- El PR fue mergeado
- El código correspondiente existe en el repo

---

## Pre-Phase 3 — Deuda Técnica y Mejoras (Abril 2026)

### Semana 1 (7–8 Abr)

#### 🔧 Tarea 1: Git Author Config
- **Fecha**: 2026-04-07
- **Estado**: `[ ] Pendiente`
- **Esfuerzo**: 5-10 min
- **Descripción**:
  Configurar git author global para que los commits muestren nombre real.
- **Pasos**:
  1. `git config --global user.name "Tu Nombre"`
  2. `git config --global user.email "tu@email.com"`
  3. Verificar con: `git log --oneline -3`

---

#### 🗄️ Tarea 2: Regenerar tipos Supabase
- **Fecha**: 2026-04-07
- **Estado**: `[x] Completada` (commit `2d472be`)
- **Esfuerzo**: 15-30 min
- **Descripción**:
  Regenerar types.ts tras las últimas migraciones.
- **Pasos**:
  1. `pnpm generate-types`
  2. Revisar `packages/db/src/types.ts`
  3. Verificar que el build no rompa
- **Nota**: Hacer ANTES de tocar los `any` — los tipos regenerados resuelven varios automáticamente.

---

#### 🔴 Tarea 3a: Fix no-explicit-any (parte 1)
- **Fecha**: 2026-04-08
- **Estado**: `[ ] Pendiente`
- **Esfuerzo**: 2 horas
- **Descripción**:
  Eliminar `eslint-disable @typescript-eslint/no-explicit-any` de archivos legacy — sesión 1.
- **Pasos**:
  1. `rg 'eslint-disable.*no-explicit-any' --include='*.ts' --include='*.tsx' -l`
  2. Listar todos los archivos afectados
  3. Empezar por los más simples
  4. Usar los tipos Supabase regenerados del día anterior

---

### Semana 2 (9–12 Abr)

#### 🔴 Tarea 3b: Fix no-explicit-any (parte 2)
- **Fecha**: 2026-04-09
- **Estado**: `[ ] Pendiente`
- **Esfuerzo**: 2 horas
- **Descripción**:
  Continuar y cerrar la eliminación de any types.
- **Pasos**:
  1. Retomar archivos complejos pendientes
  2. Crear interfaces específicas donde no alcancen los tipos de Supabase
  3. Remover todos los comentarios eslint-disable
  4. Verificar: `pnpm turbo build --filter=@loyalty-os/dashboard`

---

#### 🧪 Tarea 4a: Tests integración — Setup + audit de rutas API
- **Fecha**: 2026-04-10
- **Estado**: `[ ] Pendiente`
- **Esfuerzo**: 3 horas
- **Descripción**:
  Preparar infraestructura de testing para rutas API.
- **Pasos**:
  1. Auditar todas las rutas API existentes (dashboard + member)
  2. Definir estrategia: Vitest + msw para mocks Supabase
  3. Configurar setup de tests de integración
  4. Escribir primeros tests (auth routes)

---

#### 🧪 Tarea 4b: Tests integración — members, rewards, campaigns
- **Fecha**: 2026-04-11
- **Estado**: `[ ] Pendiente`
- **Esfuerzo**: 3 horas
- **Descripción**:
  Escribir tests de integración para los módulos core.
- **Pasos**:
  1. Tests para rutas de members
  2. Tests para rutas de rewards
  3. Tests para rutas de campaigns
  4. Verificar coverage

---

#### 🧪 Tarea 4c: Tests integración — CI + cierre y revisión final
- **Fecha**: 2026-04-12
- **Estado**: `[ ] Pendiente`
- **Esfuerzo**: 2 horas
- **Descripción**:
  Cerrar el módulo de tests e integrar al pipeline CI.
- **Pasos**:
  1. Agregar tests al CI (turbo build pipeline)
  2. Revisar coverage general
  3. Documentar estrategia de testing en README
  4. Commit y push

---

### Semana 3 (13–19 Abr) — Mejoras Técnicas

#### 🖼️ M1: img → next/image
- **Fecha**: 2026-04-13
- **Estado**: `[ ] Pendiente`
- **Esfuerzo**: 1-2 horas
- **Descripción**:
  Reemplazar todas las etiquetas `<img>` por `next/image` en Member App.
- **Pasos**:
  1. `rg "<img " apps/member --include="*.tsx" -l`
  2. Reemplazar con `<Image />` con width/height o fill
  3. Agregar dominios externos en next.config si hace falta
  4. Verificar que desaparezcan las advertencias de build

---

#### 🛡️ M2: Error Boundaries en Dashboard
- **Fecha**: 2026-04-14
- **Estado**: `[ ] Pendiente`
- **Esfuerzo**: 2-3 horas
- **Descripción**:
  Agregar error boundaries por sección en el Dashboard.
- **Pasos**:
  1. Crear componente ErrorBoundary reutilizable (Client Component)
  2. Identificar secciones críticas: métricas, members, campañas, gamificación
  3. Envolver cada sección con su propio boundary
  4. Diseñar UI de fallback por sección (no pantalla global)

---

#### 🚦 M3: Rate Limiting en Member App
- **Fecha**: 2026-04-15
- **Estado**: `[ ] Pendiente`
- **Esfuerzo**: 2-3 horas
- **Descripción**:
  Proteger rutas públicas del Member App contra abuso.
- **Pasos**:
  1. Instalar `@upstash/ratelimit` (ya usás Upstash Redis)
  2. Aplicar a rutas: login, registro, join code
  3. Límite sugerido: 10 req/min por IP en auth routes
  4. Retornar 429 con header `Retry-After`

---

#### ⚡ B1: Caché en API routes analytics/members
- **Fecha**: 2026-04-16
- **Estado**: `[ ] Pendiente`
- **Esfuerzo**: 2-3 horas
- **Descripción**:
  Agregar `unstable_cache` a rutas que siempre van a DB.
- **Nota**: Next.js 14.2.35 → usar `unstable_cache` (NO `'use cache'`, eso es Next.js 15+)
- **Pasos**:
  1. Identificar rutas sin caché: analytics, members list, leaderboard
  2. Envolver con `unstable_cache`:
     - Analytics: `revalidate: 300` (5 min)
     - Members list: `revalidate: 60`
     - Leaderboard: `revalidate: 30`
  3. Agregar tags para invalidación manual

---

#### ⚙️ M4: Edge Functions Supabase — parte 1 (diseño + setup)
- **Fecha**: 2026-04-18
- **Estado**: `[ ] Pendiente`
- **Esfuerzo**: 3 horas
- **Descripción**:
  Implementar procesos automáticos: expiración de puntos y cumpleaños — sesión 1.
- **Pasos**:
  1. Definir lógica de expiración de puntos (cuándo, qué reglas)
  2. Definir lógica de notificación de cumpleaños
  3. Crear Edge Function en Supabase para expiración de puntos
  4. Testear con trigger manual

---

#### ⚙️ M4: Edge Functions Supabase — parte 2 (cumpleaños + pg_cron)
- **Fecha**: 2026-04-19
- **Estado**: `[ ] Pendiente`
- **Esfuerzo**: 2-3 horas
- **Descripción**:
  Cerrar implementación de procesos automáticos con pg_cron.
- **Pasos**:
  1. Crear Edge Function para notificación de cumpleaños
  2. Configurar pg_cron en Supabase SQL Editor para ambos procesos
  3. Testear triggers antes de activar cron
  4. Monitorear primeras 24hs

---

## Phase 3 — Roadmap (Mayo–Septiembre 2026)

### Semana 1 — Bulk Actions Dashboard
- **Fecha inicio**: 2026-05-04
- **Duración**: 1 semana
- **Estado**: `[ ] Pendiente`
- **Descripción**: Selección múltiple en lista de miembros con acciones masivas.
- **Entregable**: PR mergeado + tabla `tenant_plan_history` creada.
- **Tareas**:
  1. Checkbox de selección en tabla de miembros
  2. Barra de acciones flotante al seleccionar
  3. Ajuste masivo de puntos con motivo
  4. Envío de campaña a selección
  5. Export CSV de selección
  6. ⚠️ Crear tabla `tenant_plan_history` (tenant_id, from_plan, to_plan, changed_at)

---

### Semanas 2-3 — Automatizaciones Programadas (pg_cron)
- **Fecha inicio**: 2026-05-11
- **Duración**: 2 semanas
- **Estado**: `[ ] Pendiente`
- **Descripción**: 6 procesos automáticos via Supabase Edge Functions + pg_cron.
- **Entregable**: 6 Edge Functions + pg_cron + `scheduled_jobs` con tenant_id e is_active.
- **KPI objetivo**: 80% de tenants con al menos 1 automatización activada.
- **Tareas**:
  1. Expiración de puntos (diario medianoche)
  2. Bonus de cumpleaños + email (diario)
  3. Miembros en riesgo → trigger campaign (semanal, churn_risk > 0.7)
  4. Tier upgrade automático en cada transacción
  5. Alerta de puntos próximos a vencer (mensual)
  6. Resumen semanal al tenant (lunes 8am)

---

### Semanas 4-5 — Advanced Analytics + Export
- **Fecha inicio**: 2026-05-25
- **Duración**: 2 semanas
- **Estado**: `[ ] Pendiente`
- **Descripción**: Analytics avanzado con exportación de datos (Scale+).
- **Entregable**: Analytics expandido + `tenant_plan_history` validada con datos reales.
- **KPIs**: Churn <5% mensual, Tier upgrade 15% Starter→Pro en 6 meses.
- **Tareas**:
  1. Cohort analysis — retención por mes de alta
  2. Funnel de activación: alta → primera visita → primera redención
  3. Revenue attribution por campaña
  4. Export CSV/Excel de datos (Scale+)
  5. Gráficos de cohort en Dashboard

---

### Semanas 6-8 — Public REST API + API Keys
- **Fecha inicio**: 2026-06-08
- **Duración**: 3 semanas
- **Estado**: `[ ] Pendiente`
- **Descripción**: API pública REST con autenticación por API Key.
- **Entregable**: 7 endpoints + `api_usage` logging activo desde día 1.
- **KPI objetivo**: 100K+ calls/mes a los 90 días del lanzamiento.
- **Endpoints**: POST/GET /v1/members, POST /v1/transactions, GET balance, rewards, POST redemptions, webhooks.
- **Restricción**: Scale+ únicamente.

---

### Semanas 9-10 — Referral Program (Member App)
- **Fecha inicio**: 2026-06-29
- **Duración**: 2 semanas
- **Estado**: `[ ] Pendiente`
- **Descripción**: Sistema de referidos con bonus points para ambas partes.
- **Entregable**: Referral system completo + métricas secundarias en DB.
- **Tareas**:
  1. Link único de referido por miembro
  2. Tracking: pendiente / unido / primera visita completada
  3. Bonus points al referidor + referido en primera visita
  4. Panel de referidos en perfil del miembro
  5. Social sharing de logros (badges, tier upgrades)

---

### Semanas 11-12 — Webhook Outbound
- **Fecha inicio**: 2026-07-13
- **Duración**: 2 semanas
- **Estado**: `[ ] Pendiente`
- **Dependencia**: Public REST API completada.
- **Descripción**: Tenant configura sus propios endpoints para recibir eventos.
- **Entregable**: Webhook outbound completo + diseño del KPI panel aprobado.
- **Tareas**:
  1. UI para configurar endpoints en Settings → Integrations
  2. Eventos: nuevo miembro, puntos ganados, redención, tier change
  3. Delivery con retries automáticos (exponential backoff)
  4. Dashboard de delivery: estado, timestamp, payload, respuesta
  5. Firma HMAC para verificación de autenticidad

---

### Semanas 13-15 — Custom Domains (Scale+)
- **Fecha inicio**: 2026-07-27
- **Duración**: 3 semanas
- **Estado**: `[ ] Pendiente`
- **Descripción**: Cada tenant usa su propio dominio para la Member App.
- **Entregable**: Custom domains funcional + `tenant_domains` con campos de tracking.
- **KPI objetivo**: 30% de tenants Scale+ con custom domain verificado en 90 días.
- **Restricción**: Scale y Enterprise. Pro: teaser "próximamente".

---

### Semanas 16-20 — Booking Integration (Enterprise)
- **Fecha inicio**: 2026-08-17
- **Duración**: 5 semanas
- **Estado**: `[ ] Pendiente`
- **Descripción**: Conexión automática con Square Appointments.
- **Entregable**: Phase 3 completa + KPI Panel en Super Admin deployado.
- **KPI objetivo**: 20% de tenants Enterprise con booking activo en 60 días.
- **Semana 20**: BUILD Super Admin KPI Panel con las 6 métricas de Phase 3.

---

### Cierre de Phase 3

#### 📝 LoyaltyOS — Redactar PRD v3
- **Fecha**: 2026-09-21
- **Estado**: `[ ] Pendiente`
- **Descripción**: Phase 3 completada. Documentar estado actual y definir Phase 4.
- **Agenda**:
  1. Revisar criterios de éxito Phase 3 — ¿se cumplieron los KPIs?
  2. Documentar decisiones de arquitectura tomadas durante Phase 3
  3. Recopilar feedback de tenants sobre los nuevos features
  4. Definir objetivos estratégicos de Phase 4
  5. Redactar PRD v3 con estado actual + roadmap siguiente fase
