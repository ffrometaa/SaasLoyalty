# LoyaltyOS — Daily Checklist

> Actualizado automáticamente por el agente diario (lunes a sábado, 9:00 AM).
> El agente verifica cada tarea contra el historial de commits y actualiza este archivo.
> Última actualización: 2026-04-08

---

## Semana actual: 7–12 Abril 2026

| Fecha | Tarea | Estado | Evidencia |
|-------|-------|--------|-----------|
| 2026-04-07 (Lun) | 🔧 Tarea 1: Git Author Config | `[x] Completada` | git config verificado |
| 2026-04-07 (Lun) | 🗄️ Tarea 2: Regenerar tipos Supabase | `[x] Completada` | commit `2d472be` |
| 2026-04-07 (Lun) | 🔒 Tarea 5: Sistema de consentimiento legal | `[x] Completada` | migración + `/api/consent` + `consent-checkbox.tsx` + `consent-guard.tsx` + `/consent-update` + páginas legales |
| 2026-04-07 (Lun) | 🌐 Tarea 6: Fix i18n — /join page | `[x] Completada` | `join/page.tsx` reescrita con `useTranslations`, namespaces `join_page` en `en.json` y `es.json` |
| 2026-04-07 (Lun) | 📷 Tarea 7: QR Scanner en /join | `[x] Completada` | `qr-scanner-modal.tsx` con `jsqr`, namespaces `qr_scanner` en ambos idiomas |
| 2026-04-08 (Mar) | ⚠️ Tarea 8: Update features.ts — remover api_access de Scale | `[x] Completada` | commit `89ea3c0` — `features.ts` api_access removido de Scale |
| 2026-04-08 (Mar) | 🔴 Tarea 3a: Fix no-explicit-any (parte 1) | `[x] Completada` | Sin archivos con eslint-disable en repo |
| 2026-04-09 (Mié) | 🔴 Tarea 3b: Fix no-explicit-any (parte 2) | `[x] Completada` | Sin archivos con eslint-disable en repo |
| 2026-04-10 (Jue) | 🧪 Tarea 4a: Tests — Setup + audit rutas API | `[x] Completada` | commit `4d63607` — 19 auth tests |
| 2026-04-11 (Vie) | 🧪 Tarea 4b: Tests — members, rewards + rewrite components | `[x] Completada` | commit `b1e58e7` — 58 tests totales |
| 2026-04-12 (Sáb) | 🧪 Tarea 4c: Tests — CI + revisión final | `[x] Completada` | turbo.json + `tests/README.md` + 58 tests passing |

---

## Próxima semana: 13–19 Abril 2026

| Fecha | Tarea | Estado |
|-------|-------|--------|
| 2026-04-13 (Lun) | 🖼️ M1: img → next/image | `[x] Completo` |
| 2026-04-14 (Mar) | 🛡️ M2: Error Boundaries en Dashboard | `[x] Completo` |
| 2026-04-15 (Mié) | 🚦 M3: Rate Limiting en Member App | `[x] Completo` |
| 2026-04-16 (Jue) | ⚡ B1: Caché en API routes analytics/members | `[x] Completo` |
| 2026-04-18 (Sáb) | ⚙️ M4: Edge Functions Supabase — parte 1 | `[x] Completo` |
| 2026-04-19 (Dom) | ⚙️ M4: Edge Functions Supabase — parte 2 | `[x] Completo` |

---

## Estado de Phase 3 — Semáforo

| Módulo Phase 3 | Fecha inicio | Estado |
|----------------|-------------|--------|
| Bulk Actions Dashboard | 2026-05-04 | `[x] Completo` |
| Automatizaciones Programadas (pg_cron) | 2026-05-11 | `[x] Completo` |
| Advanced Analytics + Export | 2026-05-25 | `[x] Completo` |
| Public REST API + API Keys | 2026-06-08 | `[ ] 🔴 BLOQUEADO — MKT-1` |
| Referral Program | 2026-06-29 | `[x] Completo` |
| Webhook Outbound | 2026-07-13 | `[ ] 🟡 BLOQUEADO — depende de API` |
| Custom Domains | 2026-07-27 | `[ ] 🔴 BLOQUEADO — MKT-1` |
| Booking Integration | 2026-08-17 | `[ ] Pendiente` |
| Redactar PRD v3 | 2026-09-21 | `[ ] Pendiente` |

---

## Gates de Marketing — Seguimiento

| Gate | Responsable | Fecha límite | Estado |
|------|-------------|-------------|--------|
| MKT-1: Pricing API Access + Custom Domains (§2.7) | Marketing | 2026-05-04 | `[ ] Pendiente` |
| MKT-2: Demanda features Enterprise — SSO, Multi-location, Secure Compute (§2.8) | Marketing | 2026-09-21 | `[ ] Pendiente` |

---

## Historial de verificaciones

| Fecha verificación | Tareas revisadas | Completadas | Pendientes | Vencidas |
|--------------------|-----------------|-------------|------------|---------|
| 2026-04-07 | 7 | 5 | 2 | 0 |
| 2026-04-08 | 7 | 7 | 0 | 0 |
| 2026-04-11 | 2 | 2 | 0 | 0 |
| 2026-04-12 | 1 | 1 | 0 | 0 |

---

## Instrucciones para el agente

Al ejecutarse cada mañana (lunes a sábado, 9:00 AM), el agente debe:

1. **Leer** `tasks.md` para obtener todas las tareas con sus fechas.
2. **Obtener la fecha actual** y filtrar tareas con `fecha <= hoy`.
3. **Verificar evidencia** en el repo:
   - `git log --oneline --since="ayer" --until="hoy"` — buscar commits relacionados
   - Palabras clave en commits: nombre de la tarea, archivos mencionados en los pasos
4. **Actualizar este archivo** (`checklist.md`):
   - Si hay evidencia de commit → marcar `[x] Completada` + poner el commit hash en "Evidencia"
   - Si no hay evidencia → marcar `[ ] VENCIDA ⚠️`
   - Agregar fila al "Historial de verificaciones"
5. **Actualizar `tasks.md`**: cambiar el Estado de las tareas completadas.
6. **Hacer commit** con mensaje: `chore(checklist): verificación diaria YYYY-MM-DD`
