import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Navbar } from '@/components/landing/Navbar';
import { PricingPreview } from '@/components/landing/PricingPreview';
import { FinalCTA } from '@/components/landing/FinalCTA';
import { Footer } from '@/components/landing/Footer';

export const metadata: Metadata = {
  title: 'Pricing — LoyaltyOS',
  description: 'Simple, transparent pricing for every stage of your business. Start free for 14 days.',
};

export default async function PricingPage() {
  const t = await getTranslations('pricingPage');

  const TABLE_ROWS = [
    { feature: 'Member App (PWA)', starter: true, pro: true, scale: true, enterprise: true },
    { feature: 'Points & Rewards Engine', starter: true, pro: true, scale: true, enterprise: true },
    { feature: 'QR Code Onboarding', starter: true, pro: true, scale: true, enterprise: true },
    { feature: 'Members', starter: '500', pro: '2,000', scale: 'Unlimited', enterprise: 'Unlimited' },
    { feature: 'Campaigns / month', starter: '2', pro: '10', scale: 'Unlimited', enterprise: 'Unlimited' },
    { feature: 'Analytics Dashboard', starter: 'Basic', pro: 'Full + Heatmap', scale: 'Full + Export', enterprise: 'Full + Export' },
    { feature: 'White-label', starter: 'Logo', pro: 'Logo + Colors', scale: 'Full Brand', enterprise: 'Full Brand' },
    { feature: 'API Access', starter: false, pro: false, scale: true, enterprise: true },
    { feature: 'SSO & Custom Integrations', starter: false, pro: false, scale: false, enterprise: true },
    { feature: 'Multi-location Management', starter: false, pro: false, scale: false, enterprise: true },
    { feature: 'Gamification Engine', starter: false, pro: false, scale: false, enterprise: true },
    { feature: 'Advanced Campaign Automation', starter: false, pro: false, scale: false, enterprise: true },
    { feature: 'Account Manager', starter: false, pro: false, scale: true, enterprise: true },
    { feature: 'Support', starter: 'Email', pro: 'Priority Chat', scale: 'Dedicated', enterprise: 'SLA-backed' },
  ];

  return (
    <>
      <Navbar />
      <div className="pt-16">
        {/* Hero */}
        <section className="py-24 px-6 text-center" style={{ background: '#0a0a0f' }}>
          <div className="max-w-3xl mx-auto">
            <span className="text-[11px] font-semibold tracking-[0.2em] text-white/40 uppercase block mb-4">
              {t('label')}
            </span>
            <h1 className="font-display font-black text-white mb-5" style={{ fontSize: 'clamp(36px, 5vw, 72px)' }}>
              {t('heading1')}<br />{t('heading2')}
            </h1>
            <p className="text-white/55 text-xl">
              {t('subheading')}
            </p>
          </div>
        </section>

        <PricingPreview />

        {/* Comparison table */}
        <section className="py-16 px-6" style={{ background: '#0a0a0f' }}>
          <div className="max-w-5xl mx-auto">
            <h2 className="font-display font-bold text-white text-2xl text-center mb-10">{t('tableHeading')}</h2>

            <div
              style={{
                background: '#0d0d14',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '16px',
                overflow: 'hidden',
              }}
            >
              {/* Header */}
              <div className="grid grid-cols-5 gap-4 px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="text-white/40 text-xs font-semibold tracking-wide uppercase">{t('featureLabel')}</div>
                {['Starter', 'Pro', 'Scale'].map((p) => (
                  <div key={p} className="text-center text-white font-semibold text-sm">{p}</div>
                ))}
                <div className="text-center font-semibold text-sm" style={{ color: '#a5b4fc' }}>Enterprise</div>
              </div>

              {TABLE_ROWS.map((row, i) => (
                <div
                  key={i}
                  className="grid grid-cols-5 gap-4 px-6 py-4"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                >
                  <div className="text-white/60 text-sm">{row.feature}</div>
                  {[row.starter, row.pro, row.scale, row.enterprise].map((val, j) => (
                    <div key={j} className="text-center">
                      {val === true ? (
                        <svg
                          className={`w-4 h-4 mx-auto ${j === 3 ? 'text-indigo-400' : 'text-purple-400'}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2.5"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : val === false ? (
                        <svg className="w-4 h-4 mx-auto text-white/15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      ) : (
                        <span className={`text-xs ${j === 3 ? 'text-indigo-300' : 'text-white/60'}`}>{val as string}</span>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        <FinalCTA />
        <Footer />
      </div>
    </>
  );
}
