# LoyaltyOS — Daily Checklist

> Actualizado automáticamente por el agente diario (lunes a sábado, 9:00 AM).
> El agente verifica cada tarea contra el historial de commits y actualiza este archivo.

---

## Semana actual: 7–12 Abril 2026

| Fecha | Tarea | Estado | Evidencia |
|-------|-------|--------|-----------|
| 2026-04-07 (Lun) | 🔧 Tarea 1: Git Author Config | `[ ] VENCIDA ⚠️` | — |
| 2026-04-07 (Lun) | 🗄️ Tarea 2: Regenerar tipos Supabase | `[x] Completada` | `2d472be` |
| 2026-04-08 (Mar) | 🔴 Tarea 3a: Fix no-explicit-any (parte 1) | `[ ] Pendiente` | — |
| 2026-04-09 (Mié) | 🔴 Tarea 3b: Fix no-explicit-any (parte 2) | `[ ] Pendiente` | — |
| 2026-04-10 (Jue) | 🧪 Tarea 4a: Tests — Setup + audit rutas API | `[ ] Pendiente` | — |
| 2026-04-11 (Vie) | 🧪 Tarea 4b: Tests — members, rewards, campaigns | `[ ] Pendiente` | — |
| 2026-04-12 (Sáb) | 🧪 Tarea 4c: Tests — CI + revisión final | `[ ] Pendiente` | — |

---

## Próxima semana: 13–19 Abril 2026

| Fecha | Tarea | Estado |
|-------|-------|--------|
| 2026-04-13 (Lun) | 🖼️ M1: img → next/image | `[ ] Pendiente` |
| 2026-04-14 (Mar) | 🛡️ M2: Error Boundaries en Dashboard | `[ ] Pendiente` |
| 2026-04-15 (Mié) | 🚦 M3: Rate Limiting en Member App | `[ ] Pendiente` |
| 2026-04-16 (Jue) | ⚡ B1: Caché en API routes analytics/members | `[ ] Pendiente` |
| 2026-04-18 (Sáb) | ⚙️ M4: Edge Functions — parte 1 (diseño + setup) | `[ ] Pendiente` |

---

## Historial de verificaciones

| Fecha verificación | Tareas revisadas | Completadas | Pendientes | Vencidas |
|--------------------|-----------------|-------------|------------|---------|
| 2026-04-07 | 2 | 1 | 0 | 1 |

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
