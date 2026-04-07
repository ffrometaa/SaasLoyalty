#!/bin/bash

# LoyaltyOS — Agente de verificación diaria
# Corre lunes a sábado a las 9:00 AM via launchd
# Logs en: loyalty-os/logs/checklist-YYYY-MM-DD.log

REPO="/Users/denisfrometa/proyectos/SaasLoyalty/Proyect/loyalty-os"
LOG_FILE="$REPO/logs/checklist-$(date +%Y-%m-%d).log"
CLAUDE="/opt/homebrew/bin/claude"

echo "=== Verificación diaria LoyaltyOS — $(date '+%Y-%m-%d %H:%M:%S') ===" >> "$LOG_FILE"

cd "$REPO" || exit 1

PROMPT="Sos el agente de verificación diaria de LoyaltyOS. El repo está en $REPO.

Tu tarea (ejecutar en orden):

1. Leer \`tasks.md\` y filtrar todas las tareas cuya fecha <= hoy ($(date +%Y-%m-%d)).

2. Correr este comando para ver commits recientes:
   git log --oneline --since='yesterday 00:00' --until='today 23:59'

3. Para cada tarea con fecha <= hoy:
   - Buscar en el git log palabras clave del nombre de la tarea.
   - Si hay commit relacionado → marcar [x] Completada con el hash en columna Evidencia.
   - Si no hay evidencia → marcar [ ] VENCIDA ⚠️

4. Actualizar \`checklist.md\`:
   - Actualizar la tabla de la semana actual con los estados finales.
   - Agregar fila al historial: fecha=$(date +%Y-%m-%d), cantidad revisadas, completadas, pendientes, vencidas.

5. Si hay tareas completadas, actualizar el campo Estado en \`tasks.md\`.

6. Hacer commit con mensaje: chore(checklist): verificación diaria $(date +%Y-%m-%d)

Reglas de commit:
- NO agregar Co-Authored-By ni atribución de IA.
- Conventional commits únicamente.
- NO hacer build ni instalar dependencias."

"$CLAUDE" --print "$PROMPT" >> "$LOG_FILE" 2>&1

echo "=== Fin: $(date '+%H:%M:%S') ===" >> "$LOG_FILE"
