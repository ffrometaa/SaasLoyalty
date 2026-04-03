import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Navbar } from '@/components/landing/Navbar';
import { FinalCTA } from '@/components/landing/FinalCTA';
import { Footer } from '@/components/landing/Footer';

export const metadata: Metadata = {
  title: 'About — LoyaltyOS',
  description: 'We built LoyaltyOS because local businesses deserve the same retention tools used by global brands.',
};

export default async function AboutPage() {
  const t = await getTranslations('aboutPage');

  const STATS = [
    { num: t('stat0_num'), label: t('stat0_label') },
    { num: t('stat1_num'), label: t('stat1_label') },
    { num: t('stat2_num'), label: t('stat2_label') },
  ];

  const VALUES = [
    { title: t('value0_title'), body: t('value0_body') },
    { title: t('value1_title'), body: t('value1_body') },
    { title: t('value2_title'), body: t('value2_body') },
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
              {t('heroHeading')}
            </h1>
            <p className="text-white/55 text-xl leading-relaxed">
              {t('heroSubheading')}
            </p>
          </div>
        </section>

        {/* Mission */}
        <section className="py-20 px-6" style={{ background: '#0d0d18' }}>
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-[11px] font-semibold tracking-[0.2em] text-white/40 uppercase block mb-4">
                {t('missionLabel')}
              </span>
              <h2 className="font-display font-black text-white text-3xl mb-5">
                {t('missionHeading')}
              </h2>
              <p className="text-white/55 leading-relaxed mb-4">
                {t('missionP1')}
              </p>
              <p className="text-white/55 leading-relaxed">
                {t('missionP2')}
              </p>
            </div>
            <div className="space-y-4">
              {STATS.map((stat) => (
                <div
                  key={stat.num}
                  style={{
                    background: '#111118',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: '12px',
                    padding: '20px 24px',
                  }}
                >
                  <div className="font-display font-black gradient-text text-3xl mb-1">{stat.num}</div>
                  <div className="text-white/50 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-20 px-6" style={{ background: '#0a0a0f' }}>
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-[11px] font-semibold tracking-[0.2em] text-white/40 uppercase block mb-4">
                {t('valuesLabel')}
              </span>
              <h2 className="font-display font-black text-white text-3xl">{t('valuesHeading')}</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {VALUES.map((v) => (
                <div
                  key={v.title}
                  style={{
                    background: '#111118',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: '16px',
                    padding: '28px',
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl mb-5"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}
                  />
                  <h3 className="font-display font-bold text-white text-lg mb-3">{v.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{v.body}</p>
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
