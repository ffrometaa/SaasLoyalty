import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export async function FinalCTA() {
  const t = await getTranslations('finalCta');

  return (
    <section
      className="relative py-32 px-6 overflow-hidden text-center"
      style={{ background: '#0a0a0f' }}
    >
      {/* Small orb */}
      <div
        className="absolute top-1/2 left-1/2 pointer-events-none"
        style={{
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: '#080d18',
          boxShadow: '0 0 80px rgba(124,58,237,0.25), 0 0 160px rgba(37,99,235,0.15)',
          transform: 'translate(-50%, -50%)',
          zIndex: 0,
        }}
      />

      {/* Glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(124,58,237,0.2) 0%, rgba(225,29,72,0.08) 50%, transparent 80%)',
          zIndex: 1,
        }}
      />

      <div className="relative z-10 max-w-2xl mx-auto">
        <h2
          className="font-display font-black text-white mb-5"
          style={{ fontSize: 'clamp(28px, 5vw, 56px)' }}
        >
          {t('heading')}
        </h2>
        <p className="text-white/55 text-lg mb-10">
          {t('subheading')}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <Link
            href="/register"
            className="px-10 py-4 rounded-full font-bold text-white text-base transition-all duration-200 hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #e11d48, #7c3aed)',
              boxShadow: '0 0 30px rgba(124,58,237,0.4)',
              minWidth: '180px',
              textAlign: 'center',
            }}
          >
            {t('ctaStart')}
          </Link>
          <Link
            href="/contact"
            className="px-10 py-4 rounded-full font-bold text-white text-base transition-all duration-200 hover:bg-white/10"
            style={{
              border: '1px solid rgba(255,255,255,0.25)',
              background: 'transparent',
              minWidth: '180px',
              textAlign: 'center',
            }}
          >
            {t('ctaDemo')}
          </Link>
        </div>

        <p className="text-white/30 text-sm">
          {t('guarantee')}
        </p>
      </div>
    </section>
  );
}
