# Deployment Guide - LoyaltyOS

## Prerequisites

- Node.js 18+ (LTS recommended)
- npm or pnpm
- Git
- Supabase CLI (for local development)
- Vercel CLI (for deployment)

## Architecture

LoyaltyOS is a monorepo with three Next.js applications:

```
apps/
├── web/         # Marketing site + Public auth (port 3000)
├── dashboard/   # Tenant admin dashboard (port 3001)
└── member/      # Member PWA (port 3002)
```

## Environment Variables

### Web App (apps/web/.env.local)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# App URLs
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_DASHBOARD_URL=https://dashboard.yourdomain.com
NEXT_PUBLIC_MEMBER_URL=https://rewards.yourdomain.com
```

### Dashboard App (apps/dashboard/.env.local)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App URLs
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_MEMBER_URL=https://rewards.yourdomain.com
```

### Member App (apps/member/.env.local)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# App URLs
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_DASHBOARD_URL=https://dashboard.yourdomain.com
```

### Supabase Edge Functions (supabase/functions/.env)

```env
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Deployment Steps

### 1. Prepare Supabase

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Push the database schema
supabase db push

# Apply any pending migrations
supabase migration deploy
```

### 2. Configure Stripe Webhooks

In your Stripe Dashboard:

1. Go to Developers > Webhooks
2. Add endpoint: `https://your-project.supabase.co/functions/v1/stripe-webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Copy the webhook signing secret

### 3. Deploy to Vercel

#### Option A: Using Vercel CLI

```bash
# Install Vercel CLI globally
npm install -g vercel

# Deploy web app
cd apps/web
vercel --prod

# Deploy dashboard
cd ../dashboard
vercel --prod

# Deploy member app
cd ../member
vercel --prod
```

#### Option B: Using Git Integration

1. Push your code to GitHub
2. Connect each app to Vercel
3. Configure the root directory for each:
   - Web: `apps/web`
   - Dashboard: `apps/dashboard`
   - Member: `apps/member`
4. Set environment variables in Vercel dashboard
5. Deploy

### 4. Configure Domain

For each app, configure custom domains:

- Web: `yourdomain.com`
- Dashboard: `dashboard.yourdomain.com`
- Member: `rewards.yourdomain.com`

### 5. Update Supabase Auth URLs

In Supabase Dashboard > Authentication > URL Configuration:

```
Site URL: https://yourdomain.com
Redirect URLs:
- https://yourdomain.com/**
- https://dashboard.yourdomain.com/**
- https://rewards.yourdomain.com/**
```

## Post-Deployment Checklist

- [ ] All environment variables set
- [ ] Stripe webhooks configured and tested
- [ ] Custom domains configured
- [ ] Supabase auth redirect URLs updated
- [ ] RLS policies verified
- [ ] Test user registration flow
- [ ] Test Stripe checkout flow
- [ ] Test PWA installation
- [ ] Verify HTTPS on all endpoints

## Troubleshooting

### Stripe Webhook Not Working

```bash
# Test webhook locally
supabase functions serve stripe-webhook

# Check webhook logs in Stripe Dashboard
```

### RLS Policy Issues

```sql
-- Check policies for a table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'members';
```

### PWA Not Installing

1. Verify manifest.json is accessible
2. Check all icon URLs return 200
3. Ensure service worker is registered (check DevTools > Application)
4. Verify HTTPS is working

## Monitoring

- Vercel Analytics: Built-in dashboard
- Supabase: Project > Logs
- Stripe: Dashboard > Developers > Webhooks > Logs
- Error tracking: Consider adding Sentry

## Security Checklist

- [ ] Environment variables secured (not in git)
- [ ] Stripe keys are restricted (live/test mode correct)
- [ ] Supabase anon key is safe (RLS enabled)
- [ ] Service role key never exposed to client
- [ ] CORS configured correctly
- [ ] Rate limiting on API routes
- [ ] Input validation on all endpoints
