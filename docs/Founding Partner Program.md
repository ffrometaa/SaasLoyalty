# Founding Partners Program — LoyaltyOS

**Fecha de creación:** Abril 2026  
**Responsable:** Marketing  
**Estado:** Listo para implementación técnica  
**Deadline de lanzamiento:** Definido por Marketing (el countdown arranca el día del anuncio público)

---

## 1. Resumen del Programa

El Founding Partners Program es la estrategia de adquisición de los primeros 15 clientes de pago de LoyaltyOS. Está diseñado para eliminar la fricción de entrada, generar prueba social real (testimonials + case studies), y validar el producto con negocios reales antes de escalar el outbound a precio completo.

**La oferta central:**
- Trial extendido de **60 días** (vs. 14 días estándar)
- **20% de descuento de por vida** en cualquier plan (Starter, Pro o Scale)
- Acceso directo al fundador durante los 60 días del trial
- Badge "Founding Partner" en el dashboard
- Prioridad en el roadmap de features

**Lo que el negocio aporta a cambio:**
- 2 llamadas de feedback por mes durante el trial (15 min cada una)
- Permiso para usar su nombre/logo como case study
- Introducción a 2 dueños de negocios similares
- Feedback honesto (positivo y negativo)

---

## 2. Precios

### 2.1 Tabla de precios

| Plan | Precio regular/mes | **Precio Founding Partner/mes** | Ahorro anual |
|------|--------------------|---------------------------------|--------------|
| Starter | $199 | **$159** | $480/año |
| Pro | $399 | **$319** | $960/año |
| Scale | $599 | **$479** | $1,440/año |

**Anual (17% adicional sobre precio Founding):**

| Plan | Regular anual/mes | **Founding anual/mes** |
|------|-------------------|------------------------|
| Starter | $166 | **$133** |
| Pro | $332 | **$266** |
| Scale | $499 | **$399** |

> **IMPORTANTE:** El precio Founding Partner queda bloqueado de por vida. Si LoyaltyOS sube los precios en el futuro, los Founding Partners mantienen su tarifa original. Esta es la principal propuesta de valor del programa.

> **IMPORTANTE:** El plan Starter se mantiene en **$199/mes** como precio de entrada al mercado. No se modifica con el programa.

### 2.2 Estructura del período de trial

```
Días 1-60:   Trial gratuito — acceso completo al plan seleccionado
Día 61:      Primer cargo al precio Founding Partner (con 20% off aplicado)
Siempre:     Precio bloqueado — no sube aunque LoyaltyOS actualice el pricing
```

La tarjeta de crédito se solicita al registrarse pero **no se cobra durante 60 días**.  
Mensaje correcto para marketing: *"Su tarjeta no será cobrada durante 60 días."*  
Mensaje incorrecto (no usar): *"No se requiere tarjeta de crédito."*

---

## 3. Exclusividad y Cierre del Programa

- **Cupos:** 15 negocios. Cuando se alcanza el cupo 15, el programa cierra permanentemente.
- **Deadline:** 90 días a partir del anuncio público de Marketing.
- **Qué pasa al cerrar:** Los botones de "Founding Partner" se ocultan automáticamente. Los nuevos registros pasan a trial estándar (14 días, precio completo).
- **No hay excepciones** al cupo de 15 — la escasez es real y parte del valor del programa.

---

## 4. Implementación Técnica

### 4.1 Cambios requeridos por archivo

#### `packages/config/src/constants.ts`
Agregar constantes del programa:

```typescript
export const FOUNDING_PARTNER_DISCOUNT = 0.20;   // 20% off
export const FOUNDING_PARTNER_MAX_SPOTS = 15;
export const FOUNDING_PARTNER_TRIAL_DAYS = 60;
export const FOUNDING_PARTNER_COUPON_ID = 'FOUNDING20';
```

#### `apps/web/app/api/register/route.ts` (archivo CORRECTO — no dashboard)
Modificar para soportar Founding Partner:

```typescript
// Recibe isFoundingPartner: boolean del body
const { businessName, businessType, slug, email, userId, plan, billingPeriod, isFoundingPartner } = body;

// Validar cupos antes de proceder
if (isFoundingPartner) {
  const { count } = await supabase
    .from('tenants')
    .select('*', { count: 'exact', head: true })
    .eq('is_founding_partner', true);
  
  if ((count ?? 0) >= 15) {
    return NextResponse.json({ error: 'Founding Partners program is full' }, { status: 409 });
  }
}

// En el INSERT del tenant:
.insert({
  auth_user_id: userId,
  business_name: businessName,
  // ... campos existentes ...
  is_founding_partner: isFoundingPartner ?? false,
  founding_partner_number: isFoundingPartner ? nextNumber : null,
})

// En la Stripe Checkout Session:
const session = await stripe.checkout.sessions.create({
  // ...
  subscription_data: {
    trial_period_days: isFoundingPartner ? 60 : 14,
    // ...
  },
  discounts: isFoundingPartner ? [{ coupon: 'FOUNDING20' }] : undefined,
});
```

#### `apps/web/app/(auth)/register/page.tsx`
- Leer `?source=founding` de la URL al montar el componente
- Si `source === 'founding'` y quedan spots: mostrar banner Founding Partner en Step 2
- Mostrar precio tachado + precio con descuento en el selector de plan
- Pasar `isFoundingPartner: true` al submit
- Agregar plan Scale al array de planes (hoy hardcodeado a `['starter', 'pro']`)

#### `apps/web/components/landing/PricingPreview.tsx`
- Agregar plan Scale al array `PLANS` (hoy solo tiene Starter + Pro)
- Nuevo grid de 3 columnas
- Scale: $599/mo regular, anual $499/mo
- Agregar banner/sección "Founding Partners" debajo de los planes con CTA hacia `/register?source=founding`

#### `apps/web/app/pricing/page.tsx`
- Agregar columna Scale a la tabla comparativa (`TABLE_ROWS`)
- Actualizar Schema.org con el tercer plan
- Scale: Unlimited members, Unlimited campaigns, Full analytics + export, Full white-label, Account manager, API access (cuando disponible)

#### `apps/web/app/api/founding-spots/route.ts` (NUEVO)
Endpoint público para mostrar cupos restantes en tiempo real:

```typescript
export async function GET() {
  const { count } = await supabase
    .from('tenants')
    .select('*', { count: 'exact', head: true })
    .eq('is_founding_partner', true);
  
  const remaining = Math.max(0, 15 - (count ?? 0));
  return NextResponse.json({ remaining, total: 15 });
}
```

#### Migración de base de datos (Supabase)

```sql
-- supabase/migrations/YYYYMMDD_founding_partners.sql

ALTER TABLE tenants
  ADD COLUMN is_founding_partner BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN founding_partner_number INT CHECK (founding_partner_number >= 1 AND founding_partner_number <= 15),
  ADD COLUMN founding_trial_ends_at TIMESTAMPTZ;

-- Índice para el endpoint de conteo de cupos
CREATE INDEX idx_tenants_founding_partner ON tenants(is_founding_partner) WHERE is_founding_partner = true;

-- Unique constraint: no dos partners con el mismo número
CREATE UNIQUE INDEX idx_tenants_founding_number ON tenants(founding_partner_number) 
  WHERE founding_partner_number IS NOT NULL;
```

> **NOTA RLS:** Usar `current_tenant_id()` en cualquier policy nueva. NUNCA usar `auth_tenant_id()` — siempre retorna NULL (ver RLS-AUDIT-2026-04-08.md).

### 4.2 Stripe — Configuración requerida

**Coupon a crear en el Stripe Dashboard (una sola vez):**

| Campo | Valor |
|-------|-------|
| ID | `FOUNDING20` |
| Nombre | `Founding Partner — 20% Lifetime Discount` |
| Tipo | `Percent off` |
| Porcentaje | `20%` |
| Duración | `Forever` |
| Máximo de canjes | `15` |

**Variables de entorno requeridas (ya existen, solo configurar en Vercel):**

```
STRIPE_STARTER_PRICE_ID=price_xxxx
STRIPE_PRO_PRICE_ID=price_xxxx
STRIPE_SCALE_PRICE_ID=price_xxxx
STRIPE_STARTER_ANNUAL_PRICE_ID=price_xxxx
STRIPE_PRO_ANNUAL_PRICE_ID=price_xxxx
STRIPE_SCALE_ANNUAL_PRICE_ID=price_xxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxx
```

**Variable para el deadline del programa:**

```
NEXT_PUBLIC_FOUNDING_ANNOUNCEMENT_DATE=   ← vacío hasta que Marketing anuncie
```

Cuando Marketing haga el anuncio, setear esta variable al ISO date del anuncio (ej: `2026-04-15T00:00:00Z`). El countdown en la landing se calcula automáticamente como `announcement_date + 90 días`. No requiere redeploy del código, solo actualizar el env var en Vercel.

---

## 5. Plan de Implementación — 5 Días

### Día 1 — Scale plan completo + base técnica del programa

**Objetivo:** Los tres planes quedan visibles en producción y el registro soporta Founding Partners.

- [ ] Crear los 6 Stripe Price IDs (starter/pro/scale × monthly/annual) en modo TEST
- [ ] Crear el coupon `FOUNDING20` en Stripe (TEST y LIVE)
- [ ] Agregar columnas founding_* a `tenants` (migration Supabase)
- [ ] Agregar constantes `FOUNDING_PARTNER_*` en `packages/config/src/constants.ts`
- [ ] Agregar Scale al array `PLANS` en `PricingPreview.tsx` — grid 3 columnas
- [ ] Agregar columna Scale a la tabla comparativa en `pricing/page.tsx`
- [ ] Modificar `apps/web/app/api/register/route.ts` para soportar:
  - `isFoundingPartner` flag
  - `trial_period_days: 60` para founding
  - Coupon `FOUNDING20` aplicado en checkout
  - Validación de cupos antes de proceder

**Archivos tocados:**
```
packages/config/src/constants.ts
apps/web/app/api/register/route.ts
apps/web/components/landing/PricingPreview.tsx
apps/web/app/pricing/page.tsx
supabase/migrations/YYYYMMDD_founding_partners.sql
```

---

### Día 2 — Stripe Webhook + lifecycle de suscripción

**Objetivo:** El sistema reacciona correctamente a eventos de pago, cancelación y fallo.

- [ ] Crear `apps/web/app/api/stripe/webhook/route.ts`
- [ ] Manejar los eventos:
  - `checkout.session.completed` → activar tenant, setear `plan_status: 'trialing'`
  - `customer.subscription.updated` → cambiar plan o `plan_status`
  - `customer.subscription.deleted` → suspender acceso (`plan_status: 'cancelled'`)
  - `invoice.payment_failed` → marcar `plan_status: 'past_due'`
- [ ] Verificar `STRIPE_WEBHOOK_SECRET` en env
- [ ] Configurar endpoint webhook en Stripe Dashboard (TEST mode): `https://loyalbase.dev/api/stripe/webhook`
- [ ] Verificar idempotencia via tabla `stripe_events` (ya existe en el schema)

**Archivos tocados:**
```
apps/web/app/api/stripe/webhook/route.ts  ← NUEVO
```

---

### Día 3 — Founding Partners landing section + registro flow

**Objetivo:** El usuario que llega a la landing ve el programa, entiende la oferta, y puede registrarse como Founding Partner.

- [ ] Crear `apps/web/components/landing/FoundingPartners.tsx`
  - Badge "Limited Offer" con dot animado
  - Contador de cupos restantes (fetch a `/api/founding-spots`)
  - Countdown hasta el deadline (calculado desde `NEXT_PUBLIC_FOUNDING_ANNOUNCEMENT_DATE`)
  - Beneficios del programa (lista visual)
  - Precio con tachado por plan: `~~$599~~` → **$479/mes**
  - CTA → `/register?source=founding`
  - Nota: "Tu tarjeta no será cobrada durante 60 días."
- [ ] Integrar `<FoundingPartners />` en `apps/web/app/page.tsx` (entre Pricing y FinalCTA)
- [ ] Modificar `apps/web/app/(auth)/register/page.tsx`:
  - Leer `?source=founding` de `useSearchParams()`
  - Si founding y spots disponibles: banner en Step 2 con precio con descuento
  - Agregar Scale al selector de plan (`['starter', 'pro', 'scale']`)
  - Pasar `isFoundingPartner` al body del POST
- [ ] Crear `apps/web/app/api/founding-spots/route.ts` (endpoint de conteo)
- [ ] Actualizar `apps/web/messages/en.json` y `es.json` con textos del programa

**Archivos tocados:**
```
apps/web/components/landing/FoundingPartners.tsx  ← NUEVO
apps/web/app/page.tsx
apps/web/app/(auth)/register/page.tsx
apps/web/app/api/founding-spots/route.ts  ← NUEVO
apps/web/messages/en.json
apps/web/messages/es.json
```

---

### Día 4 — QA + Testing end-to-end

**Objetivo:** Cero bugs antes de abrir el programa al público.

- [ ] Test completo del flujo de registro en los 3 planes en modo TEST de Stripe
- [ ] Verificar que Founding Partner:
  - Aplica el coupon `FOUNDING20` en checkout
  - Trial es de 60 días
  - Las columnas founding_* se escriben en `tenants`
- [ ] Verificar que el contador de cupos es preciso y se actualiza
- [ ] Verificar que al llegar a 15 el registro founding se bloquea (409)
- [ ] Verificar que el webhook activa el tenant correctamente post-pago
- [ ] Verificar toggle mensual/anual en landing y en registro con precios founding
- [ ] Test en móvil: landing, registro, PWA member app
- [ ] Verificar i18n EN/ES en todos los componentes nuevos

---

### Día 5 — Deploy a producción + activación del programa

**Objetivo:** Todo en vivo. Marketing puede arrancar el outreach.

- [ ] Crear los 6 Stripe Price IDs en modo **LIVE** (no TEST)
- [ ] Actualizar todas las env vars de producción en Vercel (web + dashboard + member)
- [ ] Configurar webhook en Stripe LIVE con el endpoint de producción
- [ ] Deploy final: `pnpm turbo build --filter=@loyalty-os/web`
- [ ] Smoke test en producción: registro completo en modo live (con tarjeta real de test, luego reembolsar)
- [ ] Validar que el banco de datos refleja el Founding Partner registrado
- [ ] Marketing setea `NEXT_PUBLIC_FOUNDING_ANNOUNCEMENT_DATE` en Vercel → countdown activo
- [ ] Anuncio: email, redes, outreach directo

---

## 6. Oferta Formal del Programa

El texto de la oferta para usar en emails, DMs y landing:

```
FOUNDING PARTNERS PROGRAM
Limitado a 15 negocios

QUÉ OBTENÉS:
✅ Trial extendido de 60 días (no 14) — suficiente para ver resultados reales
✅ 20% de descuento de por vida ($479/mo en vez de $599 en Scale)
✅ Precio bloqueado para siempre — aunque suba el precio, el tuyo no cambia
✅ Acceso directo al fundador (WhatsApp + llamadas)
✅ Badge "Founding Partner" en tu dashboard
✅ Prioridad en el roadmap de features

QUÉ NOS APORTÁS:
✅ 2 llamadas de feedback por mes (15 min cada una)
✅ Permiso para usar tu nombre/logo como case study
✅ Introducción a 2 dueños de negocios similares

DESPUÉS DE 60 DÍAS:
→ Continuás a $479/mo (bloqueado de por vida)
→ O cancelás — sin cargo, sin drama

Solo 15 cupos disponibles. Al llegar a 15, el programa cierra para siempre.
```

---

## 7. Secuencias de Outreach

### 7.1 Email — Secuencia de 3 toques

**Email 1 (Día 0):**

**Subject:** 60-day trial for [Business Name]?

```
Hi [Name],

Quick intro: I built an AI retention platform for local businesses 
(spas, gyms, restaurants, salons) that predicts which customers are 
about to stop coming back — before they actually leave.

Demo (90 sec): [Loom link]

I'm looking for 15 Founding Partners to test it — no strings:

✅ 60-day trial (not the standard 14)
✅ 20% lifetime discount — your price never goes up
✅ I handle setup + training personally

What I need from you:
• 15 min every 2 weeks for feedback
• Intro to 2 similar business owners
• Permission to use [Business Name] as a reference

Only 15 spots total. [X] left.

Interested? Reply "yes" and I'll send the link.

- Denis
LoyaltyOS Founder
```

**Email 2 (Día 4):**

**Subject:** re: founding partners — why 60 days?

```
[Name],

Following up.

Why 60 days instead of the standard 14-day trial?

Week 1-2:  I set up your account, migrate your data
Week 3-4:  System learns your customer patterns  
Week 5-6:  First at-risk customers flagged
Week 7-8:  Auto win-back campaigns sent
Week 9-10: You SEE customers come back + revenue recovered

By Day 60, you have proof it works. Not promises.

Then you decide:
→ Keep it at $[PLAN_PRICE]/mo (20% off forever)
→ Cancel — no charge

Demo: [Loom]

[X] spots left. Reply "send me the link" if you're in.

- Denis
```

**Email 3 (Día 7):**

**Subject:** closing founding partners friday

```
[Name],

Last email on this.

Founding Partners closes at 15 businesses.
Status: [X] spots left.

The offer:
┌──────────────────────────────────────────────┐
│ 60-day trial (fully free)                    │
│ 20% off forever ($479/mo vs $599 for Scale)  │
│ I handle setup + training                    │
│ Direct founder access for 60 days            │
└──────────────────────────────────────────────┘

Start your trial: [Stripe link — /register?source=founding]

After Friday: standard 14-day trial, full price ($599/mo).

- Denis

P.S. If you know another business owner who'd want this, 
feel free to forward.
```

---

### 7.2 LinkedIn DM — Secuencia de 3 toques

**DM 1:**
```
Hi [Name],

Saw you run [Business Name] — impressive operation.

I'm building a retention platform for [spa/gym/restaurant] owners 
and looking for 15 Founding Partners to test it — 60-day trial + 
20% lifetime discount.

Demo (45 sec): [Loom]

Interested?

- Denis
```

**DM 2 (Día 3):**
```
[Name], following up.

Why 60 days? Because 14 isn't enough to see real results.

By Day 60 you'll have:
• At-risk customers flagged and contacted
• Win-back campaigns sent and responded to
• $ recovered — real numbers, not projections

Then you decide: keep at $[PRICE]/mo (20% off forever) or cancel.

[X] of 15 spots left. Want one?
```

**DM 3 (Día 7):**
```
[Name], last message.

Founding Partners closes at 15. [X] spots left.

Start trial: [link]

If timing's wrong, no problem — I'll check in when 
we move to standard pricing.

- Denis
```

> **Límite de LinkedIn:** Máximo 10-12 DMs/día a desconocidos sin Sales Navigator para evitar restricciones. No enviar más de eso.

---

### 7.3 Instagram DM

**DM 1 (después de interactuar con sus posts):**
```
Hey [Name]! 👋

Saw your post about [tema reciente] — love what you're 
building with [Business Name].

I'm looking for 15 Founding Partners to test a retention 
tool for local businesses — 60-day trial + 20% off forever.

Would you be open to checking it out?
```

**DM 2 (si responde positivo):**
```
Awesome! Here's the deal:

📊 Predicts which customers are about to stop coming back
📧 Auto-sends win-back campaigns before they leave  
🏆 Loyalty tiers + points to drive repeat visits

Demo: [Loom - 0:45]

Founding Partner perks:
• 60 days FREE
• $[PRICE]/mo after (20% off forever)
• I set it up personally
• Direct WhatsApp access to me

Only 15 spots. [X] left.

Want in? I'll send the link.
```

---

## 8. Estructura de Feedback Calls (durante el trial de 60 días)

### Semana 2 — Onboarding check
**Objetivo:** Confirmar que el negocio está usando el sistema.

```
1. ¿El staff está registrando check-ins? ¿Alguna confusión?
2. ¿Miraron el dashboard? ¿Tiene sentido?
3. ¿Algo roto o confuso?
4. ¿Qué haría esto más útil para su equipo?
[Acción: resolver issues en 48hs]
```

### Semana 4 — Validación de features
**Objetivo:** Validar que las features core aportan valor real.

```
1. ¿Miraron la lista de "At-Risk Clients"? ¿Es precisa?
2. ¿Enviaron alguna campaña de win-back? ¿Resultados?
3. ¿Los clientes interactúan con los tiers de fidelidad?
4. ¿Qué feature extra pagarías si la construyera?
5. Del 1 al 10, ¿cuán probable es que continues después del trial?
[Si dice menos de 7: "¿Qué lo llevaría a un 9?"]
```

### Semana 6 — Conversación de ROI
**Objetivo:** Iniciar la conversación de valor económico antes del cierre.

```
[Abrir el dashboard juntos]
1. ¿Cuántos clientes en riesgo se identificaron?
2. ¿Cuántas campañas se enviaron?
3. ¿Cuántos clientes volvieron?
4. ¿Cuál es el valor $ de esos clientes recuperados?

"Si en 6 semanas recuperamos $X, eso proyecta $Y anuales.
Su precio Founding Partner es $479/mo = $5,748/año.
Eso es un ROI de [Z]x. ¿Tiene sentido?"
```

### Semana 8 — Cierre del ciclo de feedback
**Objetivo:** Preparar la decisión de conversión.

```
Recap de 8 semanas: clientes identificados, campañas enviadas, recuperados, revenue.
"Tienen 4 semanas de trial restantes. El [FECHA] les contacto para hablar 
de los próximos pasos. ¿Alguna pregunta ahora?"
```

---

## 9. Conversión — Días 50 al 61

### Email Día 50:
```
Subject: 10 days left in your trial

Hi [Name],

Your 60-day Founding Partner trial ends on [DATE].

Let's schedule a quick call to review results and talk next steps.

[Calendly link]

- Denis
```

### Llamada de conversión (Día 55):
```
[Screen share — dashboard juntos]

"Revisemos los últimos 60 días: [X] clientes identificados, 
[Y] campañas, [Z] recuperados, $[Amount] en revenue.

Sus opciones:
1. Continuar a $[PRICE]/mo (precio Founding Partner — bloqueado para siempre)
2. Cancelar antes del Día 61 — sin cargo

¿Qué tiene sentido para [Business Name]?"
[Silencio — dejar que respondan]
```

**Si dicen "continuar":**
```
"Perfecto. El primer cargo será de $[PRICE] el Día 61.
Como Founding Partner #[NÚMERO], ese precio queda bloqueado para siempre.
Gracias por construir esto con nosotros."
```

**Si dicen "necesito pensarlo":**
```
"¿Qué necesitan para decidir? Tal vez puedo aclarar algo."
[Escuchar objeción — ver §10 para manejo de objeciones]
"Tienen hasta el Día 60. Los contacto el Día 59 para asegurarme 
que estén listos."
```

**Si dicen "cancelar":**
```
"Ningún problema. ¿Puedo preguntar qué no funcionó?
Quiero construir esto bien — el feedback honesto ayuda.
[Escuchar. No defender. Tomar notas.]
¿Puedo pedirles 2 cosas antes de cerrar?
1. Un testimonio breve de lo que SÍ funcionó
2. Si conocen a otro dueño que pueda necesitar esto, 
   que nos presenten"
```

---

## 10. Manejo de Objeciones Comunes

| Objeción | Respuesta |
|----------|-----------|
| "Es caro después del trial" | "Su precio Founding es $[X]/mo. En el trial recuperaron $[Y]/mes en clientes. Eso es $[Y-X] neto positivo." |
| "Necesito consultar con mi socio" | "¿Cuándo hablan con él/ella? Les envío un resumen para que puedan presentarlo." |
| "No estoy seguro que funcione" | "¿Qué necesitan ver para estar convencidos? ¿Más clientes recuperados? ¿Una feature específica?" |
| "No tengo presupuesto ahora" | "¿Es un tema de flujo de caja? El precio queda bloqueado — pueden sumarse en 30-60 días si quieren, pero el precio Founding ya no estará disponible." |
| "Vamos a esperar" | "Si esperan al lanzamiento general, el precio sube a $[PRECIO_REGULAR] con solo 14 días de trial. ¿Qué los hace dudar ahora?" |

---

## 11. Métricas del Programa

### Targets (90 días desde el anuncio)

| Métrica | Target |
|---------|--------|
| Outreach LinkedIn | 10 DMs/día × 90 días = 900 total |
| Outreach email | 50/día × 60 días activos = 3,000 total |
| Outreach Instagram | 10 DMs/día × 90 días = 900 total |
| Founding Partners onboardeados | 15 (cierra al llegar) |
| Calls de feedback completadas | 4 por partner = 60 calls |
| Tasa de conversión trial → pago | >60% |
| Partners que aportan referidos | >50% (7+ negocios) |
| Testimonials obtenidos | 10+ (incluso de quienes cancelan) |

### Revenue proyectado (post-conversión)

| Escenario | Partners que pagan | MRR |
|-----------|--------------------|-----|
| Conservador (60%) | 9 × Scale $479 | $4,311/mo |
| Esperado (70%) | 10-11 × mix de planes | $4,800-5,300/mo |
| Optimista (80%) | 12 × Scale $479 | $5,748/mo |

---

## 12. Factores de Éxito y Errores a Evitar

### Hacer

- Cerrar el programa EXACTAMENTE al cupo 15 — la escasez es real y construye credibilidad
- Hacer TODAS las llamadas de feedback — son la fuente de inteligencia de producto
- Pedir el testimonio en la Semana 6, no cuando ya terminó el trial
- Iniciar la conversación de ROI en la Semana 6, no el Día 59
- Pedir referencias en la Semana 6 (cuando están contentos), no al final
- Documentar TODO en un Google Sheet: features pedidas, objeciones, ROI por partner

### No hacer

- Aceptar más de 15 negocios bajo ninguna circunstancia
- Saltar llamadas de feedback — sin feedback, el programa no cumple su función
- Construir todas las feature requests — solo las que piden 3+ partners
- Decir "no se requiere tarjeta" — el checkout de Stripe SÍ pide tarjeta (solo no cobra en 60 días)
- Usar precios del documento anterior ($997/mo, $697/mo) — esos no existen en LoyaltyOS

---

## 13. Preguntas Frecuentes del Programa (para responder en outreach)

**¿El descuento aplica a todos los planes?**  
Sí. Starter $199 → $159, Pro $399 → $319, Scale $599 → $479. Cualquier plan que elijan.

**¿Qué pasa si quiero cambiar de plan después?**  
El descuento del 20% se mantiene en el nuevo plan también.

**¿El precio sube si LoyaltyOS sube sus precios?**  
No. Queda bloqueado en el precio Founding Partner para siempre.

**¿Puedo cancelar en cualquier momento?**  
Sí. Antes del Día 61 no se cobra nada. Después, con 7 días de aviso.

**¿Mis datos son míos si cancelo?**  
Sí. Exportación disponible por 90 días después de la cancelación.

**¿Qué plan es el más conveniente para un Founding Partner?**  
Scale ($479/mo con descuento) porque incluye miembros ilimitados, campañas ilimitadas y export de datos — el programa completo.

---

*Documento creado: Abril 2026 — LoyaltyOS Marketing*
