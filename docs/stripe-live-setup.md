# Stripe LIVE Setup Checklist

> Acción manual requerida. El código ya está listo — solo faltan las credenciales y los productos en Stripe.

---

## Paso 1 — Crear los 6 Prices en el Stripe Dashboard

Ir a **Stripe Dashboard → Products → Add product**.

### LoyaltyOS Starter
| Billing | Precio | Env var |
|---------|--------|---------|
| Monthly | $199/mes | `STRIPE_STARTER_PRICE_ID` |
| Annual | $1,990/año *(10 meses × $199, 2 meses gratis)* | `STRIPE_STARTER_ANNUAL_PRICE_ID` |

### LoyaltyOS Pro
| Billing | Precio | Env var |
|---------|--------|---------|
| Monthly | $399/mes | `STRIPE_PRO_PRICE_ID` |
| Annual | $3,990/año | `STRIPE_PRO_ANNUAL_PRICE_ID` |

### LoyaltyOS Scale
| Billing | Precio | Env var |
|---------|--------|---------|
| Monthly | $599/mes | `STRIPE_SCALE_PRICE_ID` |
| Annual | $5,990/año | `STRIPE_SCALE_ANNUAL_PRICE_ID` |

> Todos deben ser **recurring** (subscription), currency **USD**, billing period correcto.

---

## Paso 2 — Crear el cupón `FOUNDING20`

Ir a **Stripe Dashboard → Coupons → Create coupon**

| Campo | Valor |
|-------|-------|
| **Coupon ID (exacto)** | `FOUNDING20` |
| **Discount** | 20% off |
| **Duration** | Forever |
| **Max redemptions** | 15 |
| **Expiration** | Sin fecha de vencimiento |

> El ID debe ser exactamente `FOUNDING20` — el código lo usa hardcodeado en `packages/config/src/constants.ts:88`.

---

## Paso 3 — Configurar el Webhook

Ir a **Stripe Dashboard → Developers → Webhooks → Add endpoint**

- **Endpoint URL:** `https://loyalbase.dev/api/webhooks/stripe`
- **Events to listen:**
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_failed`
  - `invoice.payment_succeeded`

Al guardar, copiar el **Webhook signing secret** → guardar como `STRIPE_WEBHOOK_SECRET`.

---

## Paso 4 — Agregar env vars en Vercel

Ir a **Vercel → loyalty-os-web → Settings → Environment Variables** y agregar para **Production**:

| Variable | Valor |
|----------|-------|
| `STRIPE_SECRET_KEY` | `sk_live_...` (Stripe → Developers → API keys) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` (del Paso 3) |
| `STRIPE_STARTER_PRICE_ID` | `price_...` |
| `STRIPE_PRO_PRICE_ID` | `price_...` |
| `STRIPE_SCALE_PRICE_ID` | `price_...` |
| `STRIPE_STARTER_ANNUAL_PRICE_ID` | `price_...` |
| `STRIPE_PRO_ANNUAL_PRICE_ID` | `price_...` |
| `STRIPE_SCALE_ANNUAL_PRICE_ID` | `price_...` |

> `STRIPE_SECRET_KEY` solo va en el proyecto **web**. No usar prefijo `NEXT_PUBLIC_`.

---

## Paso 5 — Redeploy

Después de agregar las env vars, redeploy del proyecto web:

```bash
vercel --prod
```

O desde Vercel Dashboard → **Deployments → Redeploy**.

---

## Paso 6 — Test (recomendado)

Verificar que el webhook llega y el tenant se activa correctamente:

```bash
stripe listen --forward-to https://loyalbase.dev/api/webhooks/stripe
```

Hacer un registro de prueba y confirmar en Supabase que el tenant queda con `plan_status = 'active'`.

---

## Archivos relevantes

| Archivo | Descripción |
|---------|-------------|
| `apps/web/app/api/register/route.ts` | Lee los 6 Price IDs del entorno, crea Checkout Session |
| `apps/web/app/api/webhooks/stripe/route.ts` | Maneja los 6 eventos de Stripe |
| `packages/config/src/constants.ts:88` | `FOUNDING_PARTNER_COUPON_ID = 'FOUNDING20'` |
| `turbo.json` | Lista de env vars requeridas en build time |
