import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export async function Footer() {
  const t = await getTranslations('footer');

  return (
    <footer
      className="px-6 py-16"
      style={{
        background: '#080810',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Col 1 */}
          <div>
            <div className="font-display font-black text-2xl gradient-text mb-3">LoyaltyOS</div>
            <p className="text-white/40 text-sm leading-relaxed mb-4">
              {t('tagline')}
            </p>
            <p className="text-white/25 text-xs">{t('copyright')}</p>
          </div>

          {/* Col 2 */}
          <div>
            <div className="text-[10px] font-bold tracking-[0.2em] text-white/30 uppercase mb-5">
              {t('productLabel')}
            </div>
            <nav className="flex flex-col gap-3">
              {[
                { href: '/', label: t('home') },
                { href: '/pricing', label: t('pricing') },
                { href: '/about', label: t('about') },
                { href: '/contact', label: t('contact') },
                { href: '/login', label: t('signIn') },
                { href: '/register', label: t('startTrial') },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-white/45 hover:text-white transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Col 3 */}
          <div>
            <div className="text-[10px] font-bold tracking-[0.2em] text-white/30 uppercase mb-5">
              {t('legalLabel')}
            </div>
            <nav className="flex flex-col gap-3 mb-6">
              <Link href="/terms" className="text-sm text-white/45 hover:text-white transition-colors">
                {t('terms')}
              </Link>
              <Link href="/privacy" className="text-sm text-white/45 hover:text-white transition-colors">
                {t('privacy')}
              </Link>
              <Link href="/dpa" className="text-sm text-white/45 hover:text-white transition-colors">
                {t('dpa')}
              </Link>
              <Link href="/sla" className="text-sm text-white/45 hover:text-white transition-colors">
                {t('sla')}
              </Link>
            </nav>
            <div className="space-y-2">
              <a
                href="mailto:legal@loyalbase.dev"
                className="block text-sm text-white/40 hover:text-white/70 transition-colors"
              >
                legal@loyalbase.dev
              </a>
              <a
                href="mailto:support@loyalbase.dev"
                className="block text-sm text-white/40 hover:text-white/70 transition-colors"
              >
                support@loyalbase.dev
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
