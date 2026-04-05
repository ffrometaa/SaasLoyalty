import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createServiceRoleClient } from '@loyalty-os/lib/server';
import { getTranslations } from 'next-intl/server';

interface JoinPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ redirect?: string; embed?: string }>;
}

async function getTenantBySlug(slug: string) {
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from('tenants')
    .select('id, business_name, brand_app_name, brand_logo_url, brand_color_primary, brand_color_secondary, slug')
    .eq('slug', slug)
    .in('plan_status', ['trialing', 'active'])
    .is('deleted_at', null)
    .single();
  return data;
}

export default async function JoinPage({ params, searchParams }: JoinPageProps) {
  const { slug } = await params;
  const { redirect: redirectTo, embed } = await searchParams;
  const isEmbed = embed === 'true';
  const t = await getTranslations('join');

  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();

  const appName = tenant.brand_app_name ?? tenant.business_name;
  const primary = tenant.brand_color_primary ?? '#4a5440';
  const secondary = tenant.brand_color_secondary ?? '#c4a882';

  // Pass slug as query param — the login/register pages read it and set the cookie
  const loginBase = `/login?tenant=${encodeURIComponent(slug)}`;
  const loginHref = redirectTo ? `${loginBase}&redirect=${encodeURIComponent(redirectTo)}` : loginBase;
  const registerBase = `/register?tenant=${encodeURIComponent(slug)}`;
  const registerHref = redirectTo ? `${registerBase}&redirect=${encodeURIComponent(redirectTo)}` : registerBase;

  // Darken primary for hero background
  function darken(hex: string): string {
    const n = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, ((n >> 16) & 0xff) - 60);
    const g = Math.max(0, ((n >> 8) & 0xff) - 60);
    const b = Math.max(0, (n & 0xff) - 60);
    return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
  }

  const heroBg = darken(primary);

  const benefits = [
    { icon: '✦', text: t('benefit1') },
    { icon: '🎁', text: t('benefit2') },
    { icon: '⭐', text: t('benefit3') },
  ];

  return (
    <>
      {/* Inline brand vars — Server Component safe approach */}
      <style>{`
        :root {
          --brand-primary: ${primary};
          --brand-secondary: ${secondary};
          --brand-primary-dark: ${heroBg};
          --brand-primary-light: color-mix(in srgb, ${primary} 15%, white);
        }
      `}</style>

      <main
        className={`flex flex-col ${isEmbed ? 'min-h-[520px]' : 'min-h-screen'}`}
        style={{ background: 'var(--cream, #faf8f4)' }}
      >
        {/* Hero */}
        <div
          className="flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-10 text-center relative overflow-hidden"
          style={{ background: heroBg }}
        >
          {/* Decorative circles */}
          <div className="absolute rounded-full pointer-events-none" style={{ width: 300, height: 300, background: 'rgba(255,255,255,0.04)', top: -80, right: -80 }} />
          <div className="absolute rounded-full pointer-events-none" style={{ width: 180, height: 180, background: 'rgba(255,255,255,0.03)', bottom: -40, left: -40 }} />

          {/* Logo */}
          <div className="relative z-10 mb-8">
            {tenant.brand_logo_url ? (
              <img
                src={tenant.brand_logo_url}
                alt={appName}
                className="w-24 h-24 rounded-3xl object-cover mx-auto mb-4"
                style={{ border: '2px solid rgba(255,255,255,0.2)' }}
              />
            ) : (
              <div
                className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}
              >
                <span style={{ fontSize: 40 }}>✦</span>
              </div>
            )}

            <h1
              className="text-white mb-2"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 300 }}
            >
              {appName}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14 }}>
              {t('rewardsProgram')}
            </p>
          </div>

          {/* Benefits */}
          <div className="relative z-10 w-full max-w-xs space-y-3 mb-10">
            {benefits.map(({ icon, text }) => (
              <div
                key={text}
                className="flex items-center gap-3 text-left"
                style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}
              >
                <span style={{ fontSize: 18, minWidth: 24, textAlign: 'center' }}>{icon}</span>
                {text}
              </div>
            ))}
          </div>
        </div>

        {/* CTA section */}
        <div
          className="px-6 py-8 flex flex-col gap-3"
          style={{ background: 'white', borderTop: '1px solid var(--border, #e8e4dc)' }}
        >
          <Link
            href={registerHref}
            className="w-full py-4 rounded-[14px] text-[15px] font-medium text-white text-center block"
            style={{ background: heroBg }}
          >
            {t('joinProgram')}
          </Link>
          {!isEmbed && (
            <p className="text-center text-xs" style={{ color: 'var(--muted, #8a887f)' }}>
              {t('alreadyHaveAccount')}{' '}
              <Link href={loginHref} style={{ color: primary, fontWeight: 500 }}>
                {t('signIn')}
              </Link>
            </p>
          )}
        </div>
      </main>
    </>
  );
}
