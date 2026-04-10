# Estudio de Impacto en Rendimiento — Features del Plan Enterprise

**Fecha:** 2026-04-07
**Versión PRD:** v2
**Propósito:** Evaluar el impacto en rendimiento de cada feature del plan Enterprise antes de su implementación. Este documento debe consultarse al iniciar el diseño técnico de cualquiera de estos features.

---

## Tabla completa de features y su impacto

| Feature | Definición | Impacto en rendimiento | Nivel |
|---|---|---|---|
| **Miembros ilimitados** | Sin tope en la cantidad de miembros registrados por tenant | Las queries RLS (`current_member_id()`) escanean tablas que crecen sin límite. Sin índices correctos en `members.tenant_id`, cada consulta se degrada linealmente. El costo real no es el límite, es la ausencia de él. | 🔴 Alto |
| **Campañas ilimitadas** | Sin tope de campañas creadas o enviadas por mes | Más campañas activas = más evaluaciones por cada visita/transacción. La query "¿qué campañas aplican a este miembro ahora?" se hace más costosa con cada campaña activa. Requiere índices en `campaigns.status` y `campaigns.tenant_id`. | 🟡 Medio |
| **Analytics full** | Dashboard completo con métricas de visitas, puntos, retención y actividad por período | Queries de agregación pesadas sobre tablas `visits` y `transactions` con GROUP BY por fecha. Sin caché, cada carga del dashboard es un full scan con filtros. Se agrava con tenants de muchos miembros. | 🟡 Medio-Alto |
| **Analytics heatmap** | Visualización de actividad por hora y día de la semana | Requiere GROUP BY de doble dimensión (hora × día) sobre toda la historia de visitas del tenant. El dataset crece indefinidamente. Sin snapshots pre-agregados, es una de las queries más costosas del sistema. | 🔴 Alto |
| **Analytics export** | Exportación de datos a CSV o PDF | Escaneo completo de la tabla de visitas/transacciones del tenant sin paginación. Bloquea el hilo si se hace síncrono. En tenants con 100k+ registros puede generar timeouts. Requiere procesamiento en background (queue + job). | 🔴 Alto |
| **White-label logo** | El tenant puede subir su propio logo para mostrar en el Member App | Solo un campo URL en la tabla `tenants`. Cero impacto en rendimiento. | 🟢 Bajo |
| **White-label full brand** | Personalización completa de colores, tipografía y estética del Member App por tenant | CSS variables calculadas por tenant en cada render. Si se hace server-side, agrega una query extra por sesión. Si se cachea en cookie/localStorage, impacto es mínimo. | 🟢 Bajo |
| **Gamificación básica** | Sistema de puntos, niveles (tiers) y recompensas estándar | El cálculo de puntos y nivel se ejecuta en cada transacción. Es una operación simple y acotada. El impacto es proporcional al volumen de transacciones, no a la complejidad del cálculo. | 🟡 Medio |
| **Gamificación avanzada** | Scoring de comportamiento, desafíos dinámicos, multiplicadores, misiones, leaderboard | El leaderboard es el componente crítico: es un ranking de todos los miembros del tenant, costoso de calcular en tiempo real. Los multiplicadores y desafíos agregan evaluaciones por evento. Sin caché de scores, es la feature de mayor presión sobre DB en el sistema. | 🔴 Alto |
| **Campañas avanzadas** | Segmentación dinámica, reglas complejas de elegibilidad, triggers automáticos | Evaluación de reglas de segmentación en tiempo real contra el perfil completo del miembro. Con muchas campañas activas y reglas complejas, puede multiplicar las queries por visita. Requiere materializar segmentos o usar caché de elegibilidad. | 🔴 Alto |
| **API Access** | REST API pública para que los tenants integren LoyaltyOS con sus propios sistemas | Tráfico externo incontrolable — un POS mal configurado puede generar miles de requests por minuto. Sin rate limiting (Upstash Redis) y sin caché en endpoints de lectura, puede saturar la DB. Es el vector de mayor riesgo de abuso de recursos. | 🔴 Alto |
| **Custom Integrations / Webhooks salientes** | El tenant configura endpoints propios que reciben eventos (nuevo miembro, puntos, redención) | Delivery asíncrono con reintentos. Si muchos tenants tienen webhooks activos y hay un spike de eventos simultáneos (ej. campaña masiva), se genera una cola de requests salientes. Requiere infraestructura de queue con backoff. | 🟡 Medio-Alto |
| **SSO Tenant (SAML/OIDC)** | Autenticación enterprise: el tenant usa su IdP corporativo (Okta, Azure AD) para acceder al Dashboard | El impacto en rendimiento del flujo de login es bajo — la validación SAML es una operación puntual. El riesgo es de complejidad: más capas de auth = más superficie de error. Impacto mínimo en operación normal. | 🟢 Bajo |
| **Multi-location** | Un tenant gestiona múltiples sucursales con base de miembros compartida y reportes por sucursal | Cada query RLS necesita evaluar el contexto de sucursal además del contexto de tenant. Agrega un JOIN en cada operación del sistema. Los reportes consolidados multiplican el costo de agregación. Es el cambio de schema con mayor impacto en cascada. | 🔴 Alto |
| **Custom Domains** | El Member App del tenant se sirve desde su propio dominio (`rewards.miempresa.com`) | El impacto en runtime es mínimo — Vercel maneja el routing y TLS. El costo es de resolución DNS en el primer request (ya cacheado en CDN). La complejidad es operacional, no de rendimiento. | 🟢 Bajo |
| **Booking Integration** | Integración con sistemas de reservas (Square, Vagaro, Acuity) para otorgar puntos automáticamente | Webhooks entrantes de terceros en tiempo real. El volumen depende de la actividad del negocio, no del control de LoyaltyOS. Requiere validación de firma, procesamiento idempotente y tolerancia a duplicados. | 🟡 Medio |
| **Infraestructura dedicada / Secure Compute** | El tenant Enterprise opera en un proyecto Supabase aislado, sin multi-tenancy compartido | Latencia adicional por comunicación entre proyectos Supabase si hay operaciones cross-tenant (ej. Super Admin). El beneficio es aislamiento total de recursos — un tenant no puede saturar los recursos de otro. El impacto global disminuye para el resto de tenants. | 🟡 Medio (aislado) |
| **Account Manager** | Un responsable de cuenta asignado al tenant | Operacional. Sin impacto en rendimiento de plataforma. | 🟢 Ninguno |
| **Support SLA** | Acuerdo contractual de tiempo de respuesta garantizado | Operacional. Sin impacto en rendimiento de plataforma. | 🟢 Ninguno |
| **Data Export** | Exportación de datos completos del tenant (miembros, visitas, transacciones) | Igual que Analytics export pero potencialmente más volumen — exporta toda la historia, no solo un período. Absolutamente debe ser procesamiento en background con notificación por email. | 🔴 Alto |

---

## Resumen por nivel de impacto

| Nivel | Features |
|---|---|
| 🔴 **Alto** | Miembros ilimitados, Analytics heatmap, Analytics export, Data export, Gamificación avanzada, Campañas avanzadas, API Access, Multi-location |
| 🟡 **Medio-Alto** | Analytics full, Campañas ilimitadas, Webhooks salientes |
| 🟡 **Medio** | Gamificación básica, Booking Integration, Infraestructura dedicada |
| 🟢 **Bajo / Ninguno** | White-label, Custom Domains, SSO, Account Manager, Support SLA |

---

## Patrón común en features de impacto alto

Los 8 features de nivel 🔴 Alto comparten el mismo denominador:

> **Operan sobre datasets que crecen sin límite. Sin una estrategia de caché o procesamiento asíncrono definida antes de implementar, se degradan con el tiempo de forma silenciosa.**

### Estrategias de mitigación obligatorias antes de implementar features 🔴 Alto

| Estrategia | Aplica a |
|---|---|
| **Índices en columnas de filtro RLS** (`tenant_id`, `member_id`, `status`) | Miembros ilimitados, Campañas avanzadas |
| **Snapshots pre-agregados** (tabla `mrr_snapshots` o equivalente, alimentada por pg_cron) | Analytics heatmap, Analytics full |
| **Procesamiento en background** (queue + job + notificación por email) | Analytics export, Data export |
| **Caché de scores** (Redis o tabla materializada, TTL corto) | Gamificación avanzada, Leaderboard |
| **Rate limiting por tenant** (Upstash Redis, ventana deslizante) | API Access |
| **Migración de schema con análisis de impacto en RLS** | Multi-location |

---

## Prerrequisitos de infraestructura (aplicables a todo el plan Enterprise)

Estos componentes deben estar en producción **antes** de implementar cualquier feature de nivel 🔴 Alto:

1. **Índices de DB revisados** — `pnpm generate-types` + análisis de EXPLAIN ANALYZE en las queries más frecuentes
2. **Sistema de caché** — Upstash Redis (ya en el stack de dependencias, no implementado aún)
3. **Job queue** — Supabase Edge Functions + pg_cron (§4.5 PRD v2, pendiente)
4. **Observabilidad** — Sentry integrado en las 3 apps (§4.8 PRD v2, pendiente)
5. **Rate limiting** — middleware en rutas de API públicas (§3 deuda técnica PRD v2, pendiente)

Sin estos cinco componentes en producción, implementar features de nivel 🔴 Alto es acumular deuda técnica de rendimiento que se manifiesta en producción, no en desarrollo.
